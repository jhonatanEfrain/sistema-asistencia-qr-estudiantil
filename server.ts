import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

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
           autor, autor_rol as autorRol, aula_destino as aulaDestino, nivel_destino as nivelDestino
    FROM comunicados ORDER BY fecha DESC
  `);
  if (!rows) return res.status(503).json({ connected: false });
  return res.json({ connected: true, data: rows });
});

// POST /api/comunicados
app.post('/api/comunicados', async (req, res) => {
  const com = req.body;
  const sql = `
    INSERT INTO comunicados (id, titulo, descripcion, fecha, autor, autor_rol, aula_destino, nivel_destino)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await queryDB(sql, [
    com.id, com.titulo, com.descripcion, com.fecha, com.autor, com.autorRol, com.aulaDestino, com.nivelDestino || 'Todos'
  ]);
  if (!result) return res.status(500).json({ error: 'Error guardando comunicado en MySQL' });
  return res.json({ success: true });
});

// GET /api/notificaciones
app.get('/api/notificaciones', async (_req, res) => {
  const rows = await queryDB(`
    SELECT id, estudiante_id as estudianteId, padre_id as padreId, titulo, mensaje, 
           DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') as fechaHora, leida, canal
    FROM notificaciones ORDER BY fecha_hora DESC
  `);
  if (!rows) return res.status(503).json({ connected: false });
  const formatted = rows.map((r: any) => ({ ...r, leida: Boolean(r.leida) }));
  return res.json({ connected: true, data: formatted });
});

// POST /api/notificaciones
app.post('/api/notificaciones', async (req, res) => {
  const not = req.body;
  const sql = `
    INSERT INTO notificaciones (id, estudiante_id, padre_id, titulo, mensaje, fecha_hora, leida, canal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await queryDB(sql, [
    not.id, not.estudianteId, not.padreId || null, not.titulo, not.mensaje, not.fechaHora, not.leida ? 1 : 0, not.canal || 'WhatsApp'
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
