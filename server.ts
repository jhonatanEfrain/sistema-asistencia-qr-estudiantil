import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Crear Pool de conexiones MySQL si están los datos configurados
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD ?? '';
const dbName = process.env.DB_NAME || 'asistencia_qr_db';

let pool: mysql.Pool | null = null;

try {
  pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
} catch (err) {
  console.warn('⚠️ No se pudo inicializar la conexión MySQL. Se usará el modo fallback local.', err);
}

// Helper para ejecutar consultas MySQL de forma segura
let lastDbErrorLoggedTime = 0;
async function queryDB<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (!pool) return null;
  try {
    const [rows] = await pool.query(sql, params);
    return rows as T;
  } catch (error: any) {
    const now = Date.now();
    // Evitar saturar la consola con errores idénticos cada segundo si MySQL no está iniciado
    if (now - lastDbErrorLoggedTime > 15000) {
      console.warn('⚠️ No se pudo conectar a MySQL local (Servicio no iniciado o desconectado). Usando fallback local.');
      lastDbErrorLoggedTime = now;
    }
    return null;
  }
}

async function ensureCommunicationSchema() {
  if (!pool) return;
  const connection = await pool.getConnection();

  try {
    const ensureColumn = async (table: string, column: string, definition: string) => {
      const [rows] = await connection.query<any[]>(
        `SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      if (Number(rows[0]?.total || 0) === 0) {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      }
    };

    await ensureColumn('comunicados', 'autor_id', "VARCHAR(50) NOT NULL DEFAULT 'USR-001'");
    await ensureColumn('comunicados', 'alcance', "ENUM('colegio', 'aula') NOT NULL DEFAULT 'colegio'");
    await ensureColumn('comunicados', 'aula_id', 'VARCHAR(50) NULL');
    await ensureColumn('notificaciones', 'usuario_destino_id', 'VARCHAR(50) NULL');
    await ensureColumn('notificaciones', 'comunicado_id', 'VARCHAR(50) NULL');
    await ensureColumn('notificaciones', 'tipo', "ENUM('asistencia', 'comunicado', 'mensaje') NOT NULL DEFAULT 'asistencia'");

    await connection.query(`UPDATE notificaciones SET canal = 'App' WHERE canal <> 'App' OR canal IS NULL`);
    await connection.query(`ALTER TABLE notificaciones MODIFY COLUMN canal ENUM('App') NOT NULL DEFAULT 'App'`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS mensajes_chat (
        id VARCHAR(50) PRIMARY KEY,
        docente_usuario_id VARCHAR(50) NOT NULL,
        padre_usuario_id VARCHAR(50) NOT NULL,
        estudiante_id VARCHAR(50) NOT NULL,
        remitente_id VARCHAR(50) NOT NULL,
        remitente_rol ENUM('docente', 'padre') NOT NULL,
        contenido TEXT NOT NULL,
        fecha_hora DATETIME NOT NULL,
        leido BOOLEAN NOT NULL DEFAULT FALSE,
        INDEX idx_chat_docente (docente_usuario_id, fecha_hora),
        INDEX idx_chat_padre (padre_usuario_id, fecha_hora),
        INDEX idx_chat_estudiante (estudiante_id, fecha_hora)
      )
    `);
  } finally {
    connection.release();
  }
}

async function seedProductionDemoDataOnce() {
  if (!pool) return;
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sistema_migraciones (
        id VARCHAR(100) PRIMARY KEY,
        aplicado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [markerRows] = await connection.query<any[]>(
      `SELECT id FROM sistema_migraciones WHERE id = 'demo_comunicacion_v1' LIMIT 1`
    );
    if (markerRows.length > 0) return;

    await connection.beginTransaction();

    const classrooms = [
      ['AUL-DEMO-P1A', '1.°', 'D', 'Primaria', 'DEMO-DOC-01', 'Prof. Andrea Torres Demo', 25],
      ['AUL-DEMO-S1A', '1.°', 'D', 'Secundaria', 'DEMO-DOC-02', 'Prof. Miguel Salazar Demo', 25],
    ];
    for (const classroom of classrooms) {
      await connection.execute(`
        INSERT INTO aulas (id, grado, seccion, nivel, tutor_docente_id, tutor_nombre, capacidad)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE tutor_docente_id = VALUES(tutor_docente_id), tutor_nombre = VALUES(tutor_nombre)
      `, classroom);
    }

    const teachers = [
      ['DEMO-DOC-01', '81000001', 'Andrea', 'Torres Demo', 'Educación Primaria', 'docente.demo1@colegio.edu.pe', '980000001', JSON.stringify(['AUL-DEMO-P1A'])],
      ['DEMO-DOC-02', '81000002', 'Miguel', 'Salazar Demo', 'Comunicación', 'docente.demo2@colegio.edu.pe', '980000002', JSON.stringify(['AUL-DEMO-S1A'])],
    ];
    for (const teacher of teachers) {
      await connection.execute(`
        INSERT INTO docentes (id, dni, nombres, apellidos, especialidad, email, telefono, aulas_asignadas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE aulas_asignadas = VALUES(aulas_asignadas), email = VALUES(email)
      `, teacher);
    }

    const students = [
      ['DEMO-EST-01', 1, 'Quispe Demo', 'Luciana', '82000001', '1.°', 'D', 'Primaria', 'AUL-DEMO-P1A', 'Patricia Demo', '970000001', 'familia.demo1@colegio.edu.pe', 'DEMO-EST-01'],
      ['DEMO-EST-02', 2, 'Campos Demo', 'Thiago', '82000002', '1.°', 'D', 'Primaria', 'AUL-DEMO-P1A', 'Roberto Demo', '970000002', 'familia.demo2@colegio.edu.pe', 'DEMO-EST-02'],
      ['DEMO-EST-03', 1, 'Ramos Demo', 'Sofía', '82000003', '1.°', 'D', 'Secundaria', 'AUL-DEMO-S1A', 'Elena Demo', '970000003', 'familia.demo3@colegio.edu.pe', 'DEMO-EST-03'],
    ];
    for (const student of students) {
      await connection.execute(`
        INSERT INTO estudiantes (
          id, numero_orden, apellidos, nombres, dni, grado, seccion, nivel, aula_id,
          nombre_apoderado, telefono_apoderado, correo_apoderado, qr_code_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE aula_id = VALUES(aula_id), correo_apoderado = VALUES(correo_apoderado)
      `, student);
    }

    const parents = students.map(student => [
      `DEMO-PAD-${student[0]}`, student[4], student[0], student[9], student[10], student[11],
    ]);
    for (const parent of parents) {
      await connection.execute(`
        INSERT INTO padres (id, estudiante_dni, estudiante_id, nombre_padre, telefono, email)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nombre_padre = VALUES(nombre_padre), email = VALUES(email)
      `, parent);
    }

    const users = [
      ['DEMO-USR-DOC-01', 'Prof. Andrea Torres Demo', 'docente.demo1@colegio.edu.pe', 'DocenteDemo123', 'docente', '81000001', null, JSON.stringify(['AUL-DEMO-P1A'])],
      ['DEMO-USR-DOC-02', 'Prof. Miguel Salazar Demo', 'docente.demo2@colegio.edu.pe', 'DocenteDemo123', 'docente', '81000002', null, JSON.stringify(['AUL-DEMO-S1A'])],
      ['DEMO-USR-PAD-01', 'Patricia Demo (Apoderada de Luciana)', 'familia.demo1@colegio.edu.pe', '82000001', 'padre', '82000001', 'DEMO-EST-01', null],
      ['DEMO-USR-PAD-02', 'Roberto Demo (Apoderado de Thiago)', 'familia.demo2@colegio.edu.pe', '82000002', 'padre', '82000002', 'DEMO-EST-02', null],
      ['DEMO-USR-PAD-03', 'Elena Demo (Apoderada de Sofía)', 'familia.demo3@colegio.edu.pe', '82000003', 'padre', '82000003', 'DEMO-EST-03', null],
    ];
    for (const user of users) {
      await connection.execute(`
        INSERT INTO usuarios (id, nombre, email, password, rol, dni, estudiante_id, assigned_aulas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE password = VALUES(password), estudiante_id = VALUES(estudiante_id),
          assigned_aulas = VALUES(assigned_aulas)
      `, user);
    }

    const announcements = [
      ['DEMO-COM-GENERAL', 'Comunicado general de demostración', 'Este aviso llega a todas las familias porque fue publicado por la administración.', '2026-09-02 08:00:00', 'Lic. Roberto Valdivia (Director)', 'USR-001', 'Administrador', 'colegio', null, 'Todo el colegio', 'Todos'],
      ['DEMO-COM-AULA', 'Actividad del aula de demostración', 'Este aviso llega únicamente a las familias de Primaria 1.° “D”.', '2026-09-02 09:15:00', 'Prof. Andrea Torres Demo', 'DEMO-USR-DOC-01', 'Docente', 'aula', 'AUL-DEMO-P1A', 'Primaria 1.° “D”', 'Primaria'],
    ];
    for (const announcement of announcements) {
      await connection.execute(`
        INSERT INTO comunicados (
          id, titulo, descripcion, fecha, autor, autor_id, autor_rol, alcance, aula_id, aula_destino, nivel_destino
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)
      `, announcement);
    }

    const notifications = [
      ['DEMO-NOT-GEN-01', 'DEMO-EST-01', 'DEMO-PAD-DEMO-EST-01', 'DEMO-USR-PAD-01', 'DEMO-COM-GENERAL', 'Comunicado general de demostración', 'Este aviso llega a todas las familias porque fue publicado por la administración.', '2026-09-02 08:00:00'],
      ['DEMO-NOT-GEN-02', 'DEMO-EST-02', 'DEMO-PAD-DEMO-EST-02', 'DEMO-USR-PAD-02', 'DEMO-COM-GENERAL', 'Comunicado general de demostración', 'Este aviso llega a todas las familias porque fue publicado por la administración.', '2026-09-02 08:00:00'],
      ['DEMO-NOT-GEN-03', 'DEMO-EST-03', 'DEMO-PAD-DEMO-EST-03', 'DEMO-USR-PAD-03', 'DEMO-COM-GENERAL', 'Comunicado general de demostración', 'Este aviso llega a todas las familias porque fue publicado por la administración.', '2026-09-02 08:00:00'],
      ['DEMO-NOT-AULA-01', 'DEMO-EST-01', 'DEMO-PAD-DEMO-EST-01', 'DEMO-USR-PAD-01', 'DEMO-COM-AULA', 'Actividad del aula de demostración', 'Este aviso llega únicamente a las familias de Primaria 1.° “D”.', '2026-09-02 09:15:00'],
      ['DEMO-NOT-AULA-02', 'DEMO-EST-02', 'DEMO-PAD-DEMO-EST-02', 'DEMO-USR-PAD-02', 'DEMO-COM-AULA', 'Actividad del aula de demostración', 'Este aviso llega únicamente a las familias de Primaria 1.° “D”.', '2026-09-02 09:15:00'],
    ];
    for (const notification of notifications) {
      await connection.execute(`
        INSERT INTO notificaciones (
          id, estudiante_id, padre_id, usuario_destino_id, comunicado_id,
          titulo, mensaje, fecha_hora, leida, tipo, canal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'comunicado', 'App')
        ON DUPLICATE KEY UPDATE usuario_destino_id = VALUES(usuario_destino_id), canal = 'App'
      `, notification);
    }

    const messages = [
      ['DEMO-MSG-01', 'DEMO-USR-DOC-01', 'DEMO-USR-PAD-01', 'DEMO-EST-01', 'DEMO-USR-DOC-01', 'docente', 'Buenos días. Luciana está participando muy bien en las actividades del aula.', '2026-09-02 10:20:00', false],
      ['DEMO-MSG-02', 'DEMO-USR-DOC-01', 'DEMO-USR-PAD-01', 'DEMO-EST-01', 'DEMO-USR-PAD-01', 'padre', 'Muchas gracias, profesora. Seguiremos apoyándola desde casa.', '2026-09-02 10:28:00', true],
    ];
    for (const message of messages) {
      await connection.execute(`
        INSERT INTO mensajes_chat (
          id, docente_usuario_id, padre_usuario_id, estudiante_id,
          remitente_id, remitente_rol, contenido, fecha_hora, leido
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE contenido = VALUES(contenido)
      `, message);
    }

    await connection.execute(
      `INSERT INTO sistema_migraciones (id) VALUES ('demo_comunicacion_v1')`
    );
    await connection.commit();
    console.log('✅ Datos de demostración de comunicación creados en MySQL.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ==================== ENDPOINTS API ====================

// Endpoint de verificación del estado de MySQL
app.get('/api/db-status', async (_req, res) => {
  if (!pool) {
    return res.json({
      connected: false,
      message: 'Base de datos MySQL no configurada en las variables de entorno (.env)',
      config: { dbHost, dbPort, dbUser, dbName },
    });
  }

  try {
    const connection = await pool.getConnection();
    connection.release();
    return res.json({
      connected: true,
      message: 'Conexión a MySQL exitosa',
      database: dbName,
      host: dbHost,
    });
  } catch (error: any) {
    return res.json({
      connected: false,
      message: 'Error de conexión a MySQL',
      error: error?.message || String(error),
      config: { dbHost, dbPort, dbUser, dbName },
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { emailOrDni, password, role } = req.body;
  if (!emailOrDni) {
    return res.status(400).json({ error: 'Ingrese correo, DNI o datos del estudiante' });
  }

  const cleanInput = String(emailOrDni).trim();

  // 1. Buscar en tabla de usuarios por email, dni, id, o estudiante_id
  let rows = await queryDB(`
    SELECT id, nombre as name, email, rol as role, dni, estudiante_id as estudianteId, 
           assigned_aulas as assignedAulas, avatar, password
    FROM usuarios 
    WHERE (LOWER(email) = LOWER(?) OR dni = ? OR id = ? OR estudiante_id = ?)
      AND (rol = ? OR ? = '')
  `, [cleanInput, cleanInput, cleanInput, cleanInput, role || '', role || '']);

  if (rows && rows.length > 0) {
    const user = rows[0];
    if (user.role === 'padre') {
      // Para apoderado, verificar que la contraseña sea el DNI de su menor hijo
      if (user.estudianteId) {
        const studentRow = await queryDB(`SELECT dni FROM estudiantes WHERE id = ? LIMIT 1`, [user.estudianteId]);
        if (studentRow && studentRow.length > 0) {
          const studentDni = studentRow[0].dni;
          if (password && password.trim() !== studentDni.trim() && password.trim() !== user.password) {
            return res.status(401).json({ error: 'Contraseña incorrecta. Para ingresar como Apoderado, la contraseña debe ser el número de DNI de su menor hijo.' });
          }
        }
      } else if (user.password && password && user.password !== password) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
    } else if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    delete user.password;
    if (typeof user.assignedAulas === 'string') {
      try { user.assignedAulas = JSON.parse(user.assignedAulas); } catch (e) {}
    }
    return res.json({ success: true, user });
  }

  // 2. Si no se encontró en 'usuarios' y el rol es 'padre' o no especificó rol:
  // Intentar relacionar directamente con un estudiante por nombre de alumno, DNI de alumno o correo de apoderado
  const estRows = await queryDB(`
    SELECT id, nombres, apellidos, dni, nombre_apoderado as nombreApoderado, correo_apoderado as correoApoderado
    FROM estudiantes
    WHERE LOWER(correo_apoderado) = LOWER(?)
       OR dni = ?
       OR id = ?
       OR LOWER(CONCAT(nombres, ' ', apellidos)) LIKE LOWER(?)
       OR LOWER(CONCAT(apellidos, ' ', nombres)) LIKE LOWER(?)
       OR LOWER(nombres) LIKE LOWER(?)
       OR LOWER(apellidos) LIKE LOWER(?)
    LIMIT 1
  `, [
    cleanInput, cleanInput, cleanInput,
    `%${cleanInput}%`, `%${cleanInput}%`, `%${cleanInput}%`, `%${cleanInput}%`
  ]);

  if (estRows && estRows.length > 0) {
    const est = estRows[0];
    if (password && password.trim() !== est.dni.trim()) {
      return res.status(401).json({ error: 'Contraseña incorrecta. Para el rol Apoderado, la contraseña es el número de DNI de su menor hijo.' });
    }
    const user = {
      id: `USR-PAD-${est.id}`,
      name: `${est.nombreApoderado || 'Apoderado'} (Padre de ${est.nombres} ${est.apellidos})`,
      email: est.correoApoderado || `${est.id.toLowerCase()}@padre.colegio.edu.pe`,
      role: 'padre' as const,
      dni: est.dni,
      estudianteId: est.id,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    };
    return res.json({ success: true, user });
  }

  return res.status(401).json({ error: 'No se encontró ningún usuario o alumno asociado con esos datos' });
});

// GET /api/usuarios
app.get('/api/usuarios', async (_req, res) => {
  const rows = await queryDB(`
    SELECT id, nombre, email, rol, dni, estudiante_id as estudianteId, 
           assigned_aulas as assignedAulas, avatar, password
    FROM usuarios ORDER BY id ASC
  `);
  if (!rows) return res.status(503).json({ connected: false });
  const formatted = rows.map((r: any) => ({
    ...r,
    assignedAulas: typeof r.assignedAulas === 'string' ? JSON.parse(r.assignedAulas || '[]') : r.assignedAulas
  }));
  return res.json({ connected: true, data: formatted });
});

// POST /api/usuarios
app.post('/api/usuarios', async (req, res) => {
  const u = req.body;
  if (!u.id || !u.nombre || !u.email) {
    return res.status(400).json({ error: 'Datos de usuario incompletos' });
  }

  const sql = `
    INSERT INTO usuarios (id, nombre, email, password, rol, dni, estudiante_id, assigned_aulas, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      nombre=VALUES(nombre), email=VALUES(email), password=VALUES(password),
      rol=VALUES(rol), dni=VALUES(dni), estudiante_id=VALUES(estudiante_id),
      assigned_aulas=VALUES(assigned_aulas), avatar=VALUES(avatar)
  `;

  const assignedStr = u.assignedAulas ? JSON.stringify(u.assignedAulas) : null;
  const result = await queryDB(sql, [
    u.id, u.nombre, u.email, u.password || '123456', u.rol || 'docente',
    u.dni || null, u.estudianteId || null, assignedStr, u.avatar || null
  ]);

  if (!result) return res.status(500).json({ error: 'Error al guardar usuario en MySQL' });
  return res.json({ success: true });
});

// DELETE /api/usuarios/:id
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const result = await queryDB(`DELETE FROM usuarios WHERE id = ?`, [id]);
  if (!result) return res.status(500).json({ error: 'Error al eliminar usuario' });
  return res.json({ success: true });
});

// GET /api/config
app.get('/api/config', async (_req, res) => {
  const rows = await queryDB(`
    SELECT hora_ingreso_normal as horaIngresoNormal, hora_limite_tardanza as horaLimiteTardanza, 
           nombre_institucion as nombreInstitucion, direccion, telefono 
    FROM configuracion LIMIT 1
  `);
  if (!rows || rows.length === 0) return res.status(503).json({ connected: false });
  return res.json({ connected: true, data: rows[0] });
});

// POST /api/config
app.post('/api/config', async (req, res) => {
  const cfg = req.body;
  const sql = `
    INSERT INTO configuracion (id, hora_ingreso_normal, hora_limite_tardanza, nombre_institucion, direccion, telefono)
    VALUES (1, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hora_ingreso_normal=VALUES(hora_ingreso_normal),
      hora_limite_tardanza=VALUES(hora_limite_tardanza),
      nombre_institucion=VALUES(nombre_institucion),
      direccion=VALUES(direccion),
      telefono=VALUES(telefono)
  `;
  const result = await queryDB(sql, [cfg.horaIngresoNormal, cfg.horaLimiteTardanza, cfg.nombreInstitucion, cfg.direccion, cfg.telefono]);
  if (!result) return res.status(500).json({ error: 'Error al actualizar configuración en MySQL' });
  return res.json({ success: true });
});

// GET /api/estudiantes
app.get('/api/estudiantes', async (_req, res) => {
  const rows = await queryDB(`
    SELECT id, numero_orden as numeroOrden, apellidos, nombres, dni, grado, seccion, nivel, 
           aula_id as aulaId, nombre_apoderado as nombreApoderado, telefono_apoderado as telefonoApoderado, 
           correo_apoderado as correoApoderado, qr_code_data as qrCodeData, foto_url as fotoUrl 
    FROM estudiantes ORDER BY apellidos ASC
  `);

  if (!rows) {
    return res.status(503).json({ connected: false, message: 'MySQL no disponible. Usando estado local.' });
  }
  return res.json({ connected: true, data: rows });
});

// POST /api/estudiantes (Agregar o actualizar estudiante)
app.post('/api/estudiantes', async (req, res) => {
  const est = req.body;
  if (!est.id || !est.dni || !est.apellidos || !est.nombres) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  // Asegurar que el aula exista en la tabla 'aulas' si se especificó aulaId
  if (est.aulaId) {
    await queryDB(`
      INSERT INTO aulas (id, grado, seccion, nivel, capacidad)
      VALUES (?, ?, ?, ?, 30)
      ON DUPLICATE KEY UPDATE capacidad = capacidad
    `, [est.aulaId, est.grado || '1.°', est.seccion || 'A', est.nivel || 'Primaria']);
  }

  const sql = `
    INSERT INTO estudiantes (id, numero_orden, apellidos, nombres, dni, grado, seccion, nivel, aula_id, nombre_apoderado, telefono_apoderado, correo_apoderado, qr_code_data, foto_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      numero_orden=VALUES(numero_orden), apellidos=VALUES(apellidos), nombres=VALUES(nombres),
      grado=VALUES(grado), seccion=VALUES(seccion), nivel=VALUES(nivel), aula_id=VALUES(aula_id),
      nombre_apoderado=VALUES(nombre_apoderado), telefono_apoderado=VALUES(telefono_apoderado),
      correo_apoderado=VALUES(correo_apoderado), foto_url=VALUES(foto_url)
  `;

  const params = [
    est.id, est.numeroOrden || 1, est.apellidos, est.nombres, est.dni,
    est.grado || '1.°', est.seccion || 'A', est.nivel || 'Primaria', est.aulaId || null,
    est.nombreApoderado || '', est.telefonoApoderado || '', est.correoApoderado || null,
    est.qrCodeData || est.id, est.fotoUrl || null
  ];

  const result = await queryDB(sql, params);
  if (!result) {
    return res.status(500).json({ error: 'Error guardando estudiante en MySQL' });
  }

  // Registrar o actualizar también al apoderado en la tabla 'padres' y 'usuarios'
  if (est.nombreApoderado) {
    const padreId = `PAD-${est.id}`;
    await queryDB(`
      INSERT INTO padres (id, estudiante_dni, estudiante_id, nombre_padre, telefono, email)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombre_padre=VALUES(nombre_padre), telefono=VALUES(telefono), email=VALUES(email)
    `, [padreId, est.dni, est.id, est.nombreApoderado, est.telefonoApoderado || '', est.correoApoderado || null]);

    const userPadreId = `USR-PAD-${est.id}`;
    await queryDB(`
      INSERT INTO usuarios (id, nombre, email, password, rol, dni, estudiante_id, avatar)
      VALUES (?, ?, ?, ?, 'padre', ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombre=VALUES(nombre), email=VALUES(email), dni=VALUES(dni)
    `, [
      userPadreId,
      `${est.nombreApoderado} (Padre de ${est.nombres} ${est.apellidos})`,
      est.correoApoderado || `${est.id.toLowerCase()}@padre.colegio.edu.pe`,
      est.dni,
      est.dni,
      est.id,
      est.fotoUrl || null
    ]);
  }

  return res.json({ success: true, message: 'Estudiante guardado en MySQL' });
});

// DELETE /api/estudiantes/:id
app.delete('/api/estudiantes/:id', async (req, res) => {
  const { id } = req.params;
  const result = await queryDB(`DELETE FROM estudiantes WHERE id = ?`, [id]);
  if (!result) return res.status(500).json({ error: 'Error al eliminar estudiante de MySQL' });
  return res.json({ success: true });
});

// GET /api/docentes
app.get('/api/docentes', async (_req, res) => {
  const rows = await queryDB(`
    SELECT id, dni, nombres, apellidos, especialidad, email, telefono, aulas_asignadas as aulasAsignadas
    FROM docentes ORDER BY apellidos ASC
  `);
  if (!rows) return res.status(503).json({ connected: false });
  const formatted = rows.map((r: any) => ({
    ...r,
    aulasAsignadas: typeof r.aulasAsignadas === 'string' ? JSON.parse(r.aulasAsignadas || '[]') : r.aulasAsignadas
  }));
  return res.json({ connected: true, data: formatted });
});

// POST /api/docentes
app.post('/api/docentes', async (req, res) => {
  const doc = req.body;
  const sql = `
    INSERT INTO docentes (id, dni, nombres, apellidos, especialidad, email, telefono, aulas_asignadas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      dni=VALUES(dni), nombres=VALUES(nombres), apellidos=VALUES(apellidos),
      especialidad=VALUES(especialidad), email=VALUES(email), telefono=VALUES(telefono),
      aulas_asignadas=VALUES(aulas_asignadas)
  `;
  const result = await queryDB(sql, [
    doc.id, doc.dni, doc.nombres, doc.apellidos, doc.especialidad, doc.email, doc.telefono,
    JSON.stringify(doc.aulasAsignadas || [])
  ]);
  if (!result) return res.status(500).json({ error: 'Error al guardar docente en MySQL' });

  // Actualizar vinculación de tutor en la tabla 'aulas'
  const tutorNombre = `Prof. ${doc.nombres} ${doc.apellidos}`;
  if (Array.isArray(doc.aulasAsignadas)) {
    for (const aulaId of doc.aulasAsignadas) {
      await queryDB(`
        UPDATE aulas SET tutor_docente_id = ?, tutor_nombre = ? WHERE id = ?
      `, [doc.id, tutorNombre, aulaId]);
    }
  }

  return res.json({ success: true });
});

// GET /api/padres
app.get('/api/padres', async (_req, res) => {
  const rows = await queryDB(`
    SELECT id, estudiante_dni as estudianteDni, estudiante_id as estudianteId, nombre_padre as nombrePadre, telefono, email
    FROM padres ORDER BY nombre_padre ASC
  `);
  if (!rows) return res.status(503).json({ connected: false });
  return res.json({ connected: true, data: rows });
});

// POST /api/padres
app.post('/api/padres', async (req, res) => {
  const pad = req.body;
  const sql = `
    INSERT INTO padres (id, estudiante_dni, estudiante_id, nombre_padre, telefono, email)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      estudiante_dni=VALUES(estudiante_dni), estudiante_id=VALUES(estudiante_id),
      nombre_padre=VALUES(nombre_padre), telefono=VALUES(telefono), email=VALUES(email)
  `;
  const result = await queryDB(sql, [pad.id, pad.estudianteDni, pad.estudianteId, pad.nombrePadre, pad.telefono, pad.email]);
  if (!result) return res.status(500).json({ error: 'Error al guardar padre en MySQL' });
  return res.json({ success: true });
});

// GET /api/asistencias
app.get('/api/asistencias', async (req, res) => {
  const { fecha } = req.query;
  let sql = `
    SELECT id, estudiante_id as estudianteId, estudiante_nombre as estudianteNombre, dni, 
           DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, hora, estado, aula_id as aulaId, 
           grado, seccion, nivel, observacion 
    FROM asistencias
  `;
  const params: any[] = [];

  if (fecha) {
    sql += ` WHERE fecha = ?`;
    params.push(fecha);
  }
  sql += ` ORDER BY fecha DESC, hora DESC`;

  const rows = await queryDB(sql, params);
  if (!rows) {
    return res.status(503).json({ connected: false, message: 'MySQL no disponible.' });
  }
  return res.json({ connected: true, data: rows });
});

// POST /api/asistencias (Registrar asistencia QR sin duplicados)
app.post('/api/asistencias', async (req, res) => {
  const asis = req.body;
  if (!asis.id || !asis.estudianteId || !asis.fecha) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  // Verificar si ya existe un registro para este estudiante en esta fecha
  const existing = await queryDB(`
    SELECT id, hora, estado FROM asistencias WHERE estudiante_id = ? AND fecha = ?
  `, [asis.estudianteId, asis.fecha]);

  if (existing && existing.length > 0) {
    return res.status(409).json({
      duplicate: true,
      message: `El estudiante ya registró asistencia hoy a las ${existing[0].hora}.`,
      existing: existing[0]
    });
  }

  const sql = `
    INSERT INTO asistencias (id, estudiante_id, estudiante_nombre, dni, fecha, hora, estado, aula_id, grado, seccion, nivel, observacion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    asis.id, asis.estudianteId, asis.estudianteNombre, asis.dni, asis.fecha,
    asis.hora, asis.estado, asis.aulaId, asis.grado, asis.seccion, asis.nivel, asis.observacion || null
  ];

  const result = await queryDB(sql, params);
  if (!result) {
    return res.status(500).json({ error: 'Error guardando en MySQL' });
  }
  return res.json({ success: true, message: 'Asistencia registrada en MySQL' });
});

// GET /api/comunicados
app.get('/api/comunicados', async (_req, res) => {
  const rows = await queryDB(`
    SELECT id, titulo, descripcion, DATE_FORMAT(fecha, '%Y-%m-%d %H:%i') as fecha, 
           autor, autor_id as autorId, autor_rol as autorRol, alcance, aula_id as aulaId,
           aula_destino as aulaDestino, nivel_destino as nivelDestino
    FROM comunicados ORDER BY fecha DESC
  `);
  if (!rows) return res.status(503).json({ connected: false });
  return res.json({ connected: true, data: rows });
});

// POST /api/comunicados
app.post('/api/comunicados', async (req, res) => {
  const com = req.body;
  if (!com.id || !com.titulo || !com.descripcion || !com.autorId || !com.autorRol || !com.alcance) {
    return res.status(400).json({ error: 'Datos incompletos para publicar el comunicado.' });
  }

  const authorRows = await queryDB<any[]>(`
    SELECT rol, assigned_aulas as assignedAulas
    FROM usuarios WHERE id = ? AND rol IN ('admin', 'docente') LIMIT 1
  `, [com.autorId]);
  if (!authorRows?.length) {
    return res.status(403).json({ error: 'La cuenta no tiene permisos para publicar comunicados.' });
  }

  const authorRole = authorRows[0].rol as 'admin' | 'docente';
  const resolvedAuthorRole = authorRole === 'admin' ? 'Administrador' : 'Docente';

  if (authorRole === 'admin' && com.alcance !== 'colegio') {
    return res.status(403).json({ error: 'El administrador debe publicar el comunicado para todo el colegio.' });
  }

  if (authorRole === 'docente') {
    if (com.alcance !== 'aula' || !com.aulaId) {
      return res.status(403).json({ error: 'El docente debe seleccionar una de sus aulas asignadas.' });
    }
    const assignedAulas = typeof authorRows[0].assignedAulas === 'string'
      ? JSON.parse(authorRows[0].assignedAulas || '[]')
      : authorRows[0].assignedAulas || [];
    if (!assignedAulas.includes(com.aulaId)) {
      return res.status(403).json({ error: 'No puedes publicar comunicados para un aula no asignada.' });
    }
  }

  const sql = `
    INSERT INTO comunicados (
      id, titulo, descripcion, fecha, autor, autor_id, autor_rol, alcance, aula_id, aula_destino, nivel_destino
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await queryDB(sql, [
    com.id, com.titulo, com.descripcion, com.fecha, com.autor, com.autorId, resolvedAuthorRole,
    com.alcance, com.aulaId || null, com.aulaDestino, com.nivelDestino || 'Todos'
  ]);
  if (!result) return res.status(500).json({ error: 'Error guardando comunicado en MySQL' });

  const recipients = await queryDB<any[]>(`
    SELECT u.id as usuarioDestinoId, e.id as estudianteId, p.id as padreId
    FROM usuarios u
    INNER JOIN estudiantes e ON e.id = u.estudiante_id
    LEFT JOIN padres p ON p.estudiante_id = e.id
    WHERE u.rol = 'padre'
      AND (? = 'colegio' OR e.aula_id = ?)
  `, [com.alcance, com.aulaId || null]);

  const notifications: any[] = [];
  for (const [index, recipient] of (recipients || []).entries()) {
    const notification = {
      id: `NOT-COM-${Date.now()}-${index}`,
      estudianteId: recipient.estudianteId,
      padreId: recipient.padreId,
      usuarioDestinoId: recipient.usuarioDestinoId,
      comunicadoId: com.id,
      titulo: com.titulo,
      mensaje: com.descripcion,
      fechaHora: `${com.fecha}:00`,
      leida: false,
      tipo: 'comunicado',
      canal: 'App'
    };
    await queryDB(`
      INSERT INTO notificaciones (
        id, estudiante_id, padre_id, usuario_destino_id, comunicado_id,
        titulo, mensaje, fecha_hora, leida, tipo, canal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'comunicado', 'App')
    `, [
      notification.id, notification.estudianteId, notification.padreId,
      notification.usuarioDestinoId, notification.comunicadoId,
      notification.titulo, notification.mensaje, notification.fechaHora
    ]);
    notifications.push(notification);
  }

  return res.json({ success: true, notifications });
});

// GET /api/notificaciones
app.get('/api/notificaciones', async (req, res) => {
  const { usuarioId, rol, estudianteId } = req.query;
  let whereClause = '';
  const params: any[] = [];

  if (usuarioId) {
    if (rol === 'padre' && estudianteId) {
      whereClause = 'WHERE usuario_destino_id = ? OR (usuario_destino_id IS NULL AND estudiante_id = ?)';
      params.push(usuarioId, estudianteId);
    } else {
      whereClause = 'WHERE usuario_destino_id = ?';
      params.push(usuarioId);
    }
  }

  const rows = await queryDB(`
    SELECT id, estudiante_id as estudianteId, padre_id as padreId,
           usuario_destino_id as usuarioDestinoId, comunicado_id as comunicadoId,
           titulo, mensaje, DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') as fechaHora,
           leida, tipo, canal
    FROM notificaciones ${whereClause} ORDER BY fecha_hora DESC
  `, params);
  if (!rows) return res.status(503).json({ connected: false });
  const formatted = rows.map((r: any) => ({ ...r, leida: Boolean(r.leida) }));
  return res.json({ connected: true, data: formatted });
});

// POST /api/notificaciones
app.post('/api/notificaciones', async (req, res) => {
  const not = req.body;
  let usuarioDestinoId = not.usuarioDestinoId || null;
  let padreId = not.padreId || null;
  if (!usuarioDestinoId && not.estudianteId) {
    const recipientRows = await queryDB<any[]>(`
      SELECT u.id as usuarioDestinoId, p.id as padreId
      FROM usuarios u
      LEFT JOIN padres p ON p.estudiante_id = u.estudiante_id
      WHERE u.rol = 'padre' AND u.estudiante_id = ? LIMIT 1
    `, [not.estudianteId]);
    usuarioDestinoId = recipientRows?.[0]?.usuarioDestinoId || null;
    padreId = recipientRows?.[0]?.padreId || padreId;
  }
  const sql = `
    INSERT INTO notificaciones (
      id, estudiante_id, padre_id, usuario_destino_id, comunicado_id,
      titulo, mensaje, fecha_hora, leida, tipo, canal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'App')
  `;
  const result = await queryDB(sql, [
    not.id, not.estudianteId, padreId, usuarioDestinoId, not.comunicadoId || null,
    not.titulo, not.mensaje, not.fechaHora, not.leida ? 1 : 0, not.tipo || 'asistencia'
  ]);
  if (!result) return res.status(500).json({ error: 'Error guardando notificación en MySQL' });
  return res.json({ success: true });
});

// PUT /api/notificaciones/:id/read
app.put('/api/notificaciones/:id/read', async (req, res) => {
  const { id } = req.params;
  const result = await queryDB(`UPDATE notificaciones SET leida = TRUE WHERE id = ?`, [id]);
  if (!result) return res.status(500).json({ error: 'Error al actualizar notificación' });
  return res.json({ success: true });
});

// GET /api/mensajes-chat - solo devuelve conversaciones del usuario autenticado en la interfaz
app.get('/api/mensajes-chat', async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) return res.json({ connected: true, data: [] });

  const rows = await queryDB(`
    SELECT id, docente_usuario_id as docenteUsuarioId, padre_usuario_id as padreUsuarioId,
           estudiante_id as estudianteId, remitente_id as remitenteId,
           remitente_rol as remitenteRol, contenido,
           DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') as fechaHora, leido
    FROM mensajes_chat
    WHERE docente_usuario_id = ? OR padre_usuario_id = ?
    ORDER BY fecha_hora ASC
  `, [usuarioId, usuarioId]);
  if (!rows) return res.status(503).json({ connected: false });
  return res.json({ connected: true, data: rows.map((row: any) => ({ ...row, leido: Boolean(row.leido) })) });
});

// POST /api/mensajes-chat - valida la relación docente/aula/apoderado antes de guardar
app.post('/api/mensajes-chat', async (req, res) => {
  const message = req.body;
  if (
    !message.id || !message.docenteUsuarioId || !message.padreUsuarioId ||
    !message.estudianteId || !message.remitenteId || !message.contenido
  ) {
    return res.status(400).json({ error: 'Datos incompletos para enviar el mensaje.' });
  }

  const studentRows = await queryDB<any[]>(`
    SELECT aula_id as aulaId FROM estudiantes WHERE id = ? LIMIT 1
  `, [message.estudianteId]);
  const teacherRows = await queryDB<any[]>(`
    SELECT assigned_aulas as assignedAulas FROM usuarios
    WHERE id = ? AND rol = 'docente' LIMIT 1
  `, [message.docenteUsuarioId]);
  const parentRows = await queryDB<any[]>(`
    SELECT id FROM usuarios
    WHERE id = ? AND rol = 'padre' AND estudiante_id = ? LIMIT 1
  `, [message.padreUsuarioId, message.estudianteId]);

  const assignedAulas = teacherRows?.length
    ? (typeof teacherRows[0].assignedAulas === 'string'
        ? JSON.parse(teacherRows[0].assignedAulas || '[]')
        : teacherRows[0].assignedAulas || [])
    : [];
  const validRelationship = Boolean(
    studentRows?.length && parentRows?.length && assignedAulas.includes(studentRows[0].aulaId)
  );
  const validSender =
    (message.remitenteRol === 'docente' && message.remitenteId === message.docenteUsuarioId) ||
    (message.remitenteRol === 'padre' && message.remitenteId === message.padreUsuarioId);

  if (!validRelationship || !validSender) {
    return res.status(403).json({ error: 'No existe una relación válida entre el docente, el aula y el apoderado.' });
  }

  const result = await queryDB(`
    INSERT INTO mensajes_chat (
      id, docente_usuario_id, padre_usuario_id, estudiante_id,
      remitente_id, remitente_rol, contenido, fecha_hora, leido
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)
  `, [
    message.id, message.docenteUsuarioId, message.padreUsuarioId, message.estudianteId,
    message.remitenteId, message.remitenteRol, message.contenido.trim(), message.fechaHora
  ]);
  if (!result) return res.status(500).json({ error: 'No se pudo guardar el mensaje.' });

  const destinationId = message.remitenteRol === 'docente'
    ? message.padreUsuarioId
    : message.docenteUsuarioId;
  const notification = {
    id: `NOT-MSG-${Date.now()}`,
    estudianteId: message.estudianteId,
    usuarioDestinoId: destinationId,
    titulo: 'Nuevo mensaje privado',
    mensaje: message.contenido.trim(),
    fechaHora: message.fechaHora,
    leida: false,
    tipo: 'mensaje',
    canal: 'App'
  };
  await queryDB(`
    INSERT INTO notificaciones (
      id, estudiante_id, usuario_destino_id, titulo, mensaje,
      fecha_hora, leida, tipo, canal
    ) VALUES (?, ?, ?, ?, ?, ?, FALSE, 'mensaje', 'App')
  `, [
    notification.id, notification.estudianteId, notification.usuarioDestinoId,
    notification.titulo, notification.mensaje, notification.fechaHora
  ]);

  return res.json({ success: true, notification });
});

app.put('/api/mensajes-chat/read', async (req, res) => {
  const { docenteUsuarioId, padreUsuarioId, estudianteId, lectorId } = req.body;
  if (!docenteUsuarioId || !padreUsuarioId || !estudianteId || !lectorId) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }
  const result = await queryDB(`
    UPDATE mensajes_chat SET leido = TRUE
    WHERE docente_usuario_id = ? AND padre_usuario_id = ? AND estudiante_id = ?
      AND remitente_id <> ?
  `, [docenteUsuarioId, padreUsuarioId, estudianteId, lectorId]);
  if (!result) return res.status(500).json({ error: 'No se pudo actualizar la conversación.' });
  return res.json({ success: true });
});

// GET /api/aulas
app.get('/api/aulas', async (_req, res) => {
  const rows = await queryDB(`
    SELECT id, grado, seccion, nivel, tutor_docente_id as tutorDocenteId, tutor_nombre as tutorNombre, capacidad 
    FROM aulas
  `);
  if (!rows) return res.status(503).json({ connected: false });
  return res.json({ connected: true, data: rows });
});

// Configuración de Servidor de Desarrollo con Middleware de Vite
async function startServer() {
  try {
    await ensureCommunicationSchema();
    await seedProductionDemoDataOnce();
  } catch (error) {
    console.warn('⚠️ No se pudo preparar el módulo de comunicación.', error);
  }
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 API Estado MySQL disponible en http://localhost:${PORT}/api/db-status`);
  });
}

startServer();
