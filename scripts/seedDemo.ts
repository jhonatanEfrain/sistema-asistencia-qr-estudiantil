import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const host = process.env.DB_HOST || 'localhost';
const connection = await mysql.createConnection({
  host,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'asistencia_qr_db',
  ssl: host.includes('proxy.rlwy.net') ? { rejectUnauthorized: false } : undefined,
});

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

try {
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

  await connection.beginTransaction();

  const classrooms = [
    ['AUL-P1A', '1.°', 'A', 'Primaria', 'DOC-201', 'Prof. Carmen Rosa Flores', 30],
    ['AUL-P2A', '2.°', 'A', 'Primaria', 'DOC-202', 'Prof. Luis Alberto Vega', 30],
    ['AUL-S1A', '1.°', 'A', 'Secundaria', 'DOC-203', 'Prof. Elena Chávez Salas', 30],
  ];
  for (const classroom of classrooms) {
    await connection.execute(`
      INSERT INTO aulas (id, grado, seccion, nivel, tutor_docente_id, tutor_nombre, capacidad)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE tutor_docente_id = VALUES(tutor_docente_id), tutor_nombre = VALUES(tutor_nombre)
    `, classroom);
  }

  const teachers = [
    ['DOC-201', '43111222', 'Carmen Rosa', 'Flores', 'Educación Primaria', 'c.flores@colegio.edu.pe', '981111222', JSON.stringify(['AUL-P1A'])],
    ['DOC-202', '44222333', 'Luis Alberto', 'Vega', 'Educación Primaria', 'l.vega@colegio.edu.pe', '982222333', JSON.stringify(['AUL-P2A'])],
    ['DOC-203', '45333444', 'Elena', 'Chávez Salas', 'Comunicación', 'e.chavez@colegio.edu.pe', '983333444', JSON.stringify(['AUL-S1A'])],
  ];
  for (const teacher of teachers) {
    await connection.execute(`
      INSERT INTO docentes (id, dni, nombres, apellidos, especialidad, email, telefono, aulas_asignadas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE aulas_asignadas = VALUES(aulas_asignadas), email = VALUES(email)
    `, teacher);
  }

  const students = [
    ['EST-1001', 1, 'Álvarez Rojas', 'Mateo', '72819301', '1.°', 'A', 'Primaria', 'AUL-P1A', 'Juan Carlos Álvarez', '987654321', 'jalvarez@gmail.com', 'EST-1001'],
    ['EST-1002', 2, 'Mendoza Ruiz', 'Valeria', '73920412', '1.°', 'A', 'Primaria', 'AUL-P1A', 'Rosa Elena Ruiz', '986123450', 'rruiz@gmail.com', 'EST-1002'],
    ['EST-1003', 1, 'Torres Silva', 'Diego', '74135520', '2.°', 'A', 'Primaria', 'AUL-P2A', 'Lucía Silva Pérez', '985445566', 'lsilva@gmail.com', 'EST-1003'],
    ['EST-1004', 1, 'Rojas Díaz', 'Camila', '75246631', '1.°', 'A', 'Secundaria', 'AUL-S1A', 'Marco Antonio Rojas', '984112233', 'mrojas@gmail.com', 'EST-1004'],
  ];
  for (const student of students) {
    await connection.execute(`
      INSERT INTO estudiantes (
        id, numero_orden, apellidos, nombres, dni, grado, seccion, nivel, aula_id,
        nombre_apoderado, telefono_apoderado, correo_apoderado, qr_code_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE aula_id = VALUES(aula_id), nombre_apoderado = VALUES(nombre_apoderado),
        correo_apoderado = VALUES(correo_apoderado)
    `, student);
  }

  const parents = students.map(student => [
    `PAD-${student[0]}`, student[4], student[0], student[9], student[10], student[11],
  ]);
  for (const parent of parents) {
    await connection.execute(`
      INSERT INTO padres (id, estudiante_dni, estudiante_id, nombre_padre, telefono, email)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nombre_padre = VALUES(nombre_padre), email = VALUES(email)
    `, parent);
  }

  const users = [
    ['USR-DOC-201', 'Prof. Carmen Rosa Flores', 'c.flores@colegio.edu.pe', 'docente123', 'docente', '43111222', null, JSON.stringify(['AUL-P1A'])],
    ['USR-DOC-202', 'Prof. Luis Alberto Vega', 'l.vega@colegio.edu.pe', 'luis123', 'docente', '44222333', null, JSON.stringify(['AUL-P2A'])],
    ['USR-DOC-203', 'Prof. Elena Chávez Salas', 'e.chavez@colegio.edu.pe', 'elena123', 'docente', '45333444', null, JSON.stringify(['AUL-S1A'])],
    ['USR-PAD-EST-1001', 'Juan Carlos Álvarez (Apoderado de Mateo)', 'jalvarez@gmail.com', '72819301', 'padre', '72819301', 'EST-1001', null],
    ['USR-PAD-EST-1002', 'Rosa Elena Ruiz (Apoderada de Valeria)', 'rruiz@gmail.com', '73920412', 'padre', '73920412', 'EST-1002', null],
    ['USR-PAD-EST-1003', 'Lucía Silva Pérez (Apoderada de Diego)', 'lsilva@gmail.com', '74135520', 'padre', '74135520', 'EST-1003', null],
    ['USR-PAD-EST-1004', 'Marco Antonio Rojas (Apoderado de Camila)', 'mrojas@gmail.com', '75246631', 'padre', '75246631', 'EST-1004', null],
  ];
  for (const user of users) {
    await connection.execute(`
      INSERT INTO usuarios (id, nombre, email, password, rol, dni, estudiante_id, assigned_aulas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password = VALUES(password),
        estudiante_id = VALUES(estudiante_id), assigned_aulas = VALUES(assigned_aulas)
    `, user);
  }

  const announcements = [
    ['COM-DEMO-001', 'Bienvenida a la comunidad educativa', 'Los avisos oficiales se publicarán únicamente dentro de esta plataforma.', '2026-09-02 08:00:00', 'Lic. Roberto Valdivia (Director)', 'USR-001', 'Administrador', 'colegio', null, 'Todo el colegio', 'Todos'],
    ['COM-DEMO-002', 'Reunión de familias de 1.° A', 'Se convoca a las familias del aula para coordinar las actividades del mes.', '2026-09-02 09:15:00', 'Prof. Carmen Rosa Flores', 'USR-DOC-201', 'Docente', 'aula', 'AUL-P1A', 'Primaria 1.° “A”', 'Primaria'],
  ];
  for (const announcement of announcements) {
    await connection.execute(`
      INSERT INTO comunicados (
        id, titulo, descripcion, fecha, autor, autor_id, autor_rol, alcance, aula_id, aula_destino, nivel_destino
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), aula_id = VALUES(aula_id)
    `, announcement);
  }

  const messages = [
    ['MSG-DEMO-001', 'USR-DOC-201', 'USR-PAD-EST-1001', 'EST-1001', 'USR-DOC-201', 'docente', 'Buenos días, quería felicitar a Mateo por su participación en clase.', '2026-09-02 10:20:00', false],
    ['MSG-DEMO-002', 'USR-DOC-201', 'USR-PAD-EST-1001', 'EST-1001', 'USR-PAD-EST-1001', 'padre', 'Muchas gracias, profesora. Estaremos atentos a las próximas actividades.', '2026-09-02 10:28:00', true],
    ['MSG-DEMO-003', 'USR-DOC-201', 'USR-PAD-EST-1002', 'EST-1002', 'USR-DOC-201', 'docente', 'Buenos días, quería felicitar a Valeria por su participación en clase.', '2026-09-02 10:35:00', false],
    ['MSG-DEMO-004', 'USR-DOC-201', 'USR-PAD-EST-1002', 'EST-1002', 'USR-PAD-EST-1002', 'padre', 'Muchas gracias, profesora. Estaremos atentos a las próximas actividades.', '2026-09-02 10:42:00', true],
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

  const notifications = [
    ['NOT-DEMO-GEN-1001', 'EST-1001', 'PAD-EST-1001', 'USR-PAD-EST-1001', 'COM-DEMO-001', 'Bienvenida a la comunidad educativa', 'Los avisos oficiales se publicarán únicamente dentro de esta plataforma.', '2026-09-02 08:00:00', 'comunicado'],
    ['NOT-DEMO-GEN-1002', 'EST-1002', 'PAD-EST-1002', 'USR-PAD-EST-1002', 'COM-DEMO-001', 'Bienvenida a la comunidad educativa', 'Los avisos oficiales se publicarán únicamente dentro de esta plataforma.', '2026-09-02 08:00:00', 'comunicado'],
    ['NOT-DEMO-GEN-1003', 'EST-1003', 'PAD-EST-1003', 'USR-PAD-EST-1003', 'COM-DEMO-001', 'Bienvenida a la comunidad educativa', 'Los avisos oficiales se publicarán únicamente dentro de esta plataforma.', '2026-09-02 08:00:00', 'comunicado'],
    ['NOT-DEMO-GEN-1004', 'EST-1004', 'PAD-EST-1004', 'USR-PAD-EST-1004', 'COM-DEMO-001', 'Bienvenida a la comunidad educativa', 'Los avisos oficiales se publicarán únicamente dentro de esta plataforma.', '2026-09-02 08:00:00', 'comunicado'],
    ['NOT-DEMO-AUL-1001', 'EST-1001', 'PAD-EST-1001', 'USR-PAD-EST-1001', 'COM-DEMO-002', 'Reunión de familias de 1.° A', 'Se convoca a las familias del aula para coordinar las actividades del mes.', '2026-09-02 09:15:00', 'comunicado'],
    ['NOT-DEMO-AUL-1002', 'EST-1002', 'PAD-EST-1002', 'USR-PAD-EST-1002', 'COM-DEMO-002', 'Reunión de familias de 1.° A', 'Se convoca a las familias del aula para coordinar las actividades del mes.', '2026-09-02 09:15:00', 'comunicado'],
  ];
  for (const notification of notifications) {
    await connection.execute(`
      INSERT INTO notificaciones (
        id, estudiante_id, padre_id, usuario_destino_id, comunicado_id,
        titulo, mensaje, fecha_hora, leida, tipo, canal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, 'App')
      ON DUPLICATE KEY UPDATE usuario_destino_id = VALUES(usuario_destino_id), canal = 'App'
    `, notification);
  }

  await connection.commit();
  console.log('Datos demostrativos creados correctamente.');
  console.log('3 docentes, 4 estudiantes, 4 apoderados, 3 aulas, 2 comunicados y conversaciones privadas.');
} catch (error) {
  await connection.rollback();
  console.error('No se pudieron crear los datos demostrativos:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
