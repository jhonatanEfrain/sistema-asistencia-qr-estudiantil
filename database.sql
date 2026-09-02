-- ========================================================
-- SISTEMA DE ASISTENCIA QR ESTUDIANTIL
-- Script de Creación y Poblamiento de Base de Datos MySQL
-- ========================================================

CREATE DATABASE IF NOT EXISTS asistencia_qr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE asistencia_qr_db;

-- 1. Tabla de Configuración de Horario e Institución
CREATE TABLE IF NOT EXISTS configuracion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hora_ingreso_normal VARCHAR(10) NOT NULL DEFAULT '08:00',
  hora_limite_tardanza VARCHAR(10) NOT NULL DEFAULT '08:15',
  nombre_institucion VARCHAR(150) NOT NULL DEFAULT 'José Sabogal Diéguez (Josdic)',
  direccion VARCHAR(255) DEFAULT 'Av. Las Flores 456, Lima',
  telefono VARCHAR(50) DEFAULT '(01) 456-7890'
);

-- 2. Tabla de Aulas
CREATE TABLE IF NOT EXISTS aulas (
  id VARCHAR(50) PRIMARY KEY,
  grado VARCHAR(20) NOT NULL,
  seccion VARCHAR(10) NOT NULL,
  nivel ENUM('Primaria', 'Secundaria') NOT NULL,
  tutor_docente_id VARCHAR(50) NULL,
  tutor_nombre VARCHAR(150) NULL,
  capacidad INT DEFAULT 30
);

-- 3. Tabla de Estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
  id VARCHAR(50) PRIMARY KEY,
  numero_orden INT NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  dni VARCHAR(15) UNIQUE NOT NULL,
  grado VARCHAR(20) NOT NULL,
  seccion VARCHAR(10) NOT NULL,
  nivel ENUM('Primaria', 'Secundaria') NOT NULL,
  aula_id VARCHAR(50),
  nombre_apoderado VARCHAR(150) NOT NULL,
  telefono_apoderado VARCHAR(30) NOT NULL,
  correo_apoderado VARCHAR(100) NULL,
  qr_code_data VARCHAR(100) NOT NULL,
  foto_url VARCHAR(500) NULL,
  FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE SET NULL
);

-- 4. Tabla de Docentes
CREATE TABLE IF NOT EXISTS docentes (
  id VARCHAR(50) PRIMARY KEY,
  dni VARCHAR(15) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  especialidad VARCHAR(150) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  aulas_asignadas JSON NULL
);

-- 5. Tabla de Padres / Apoderados
CREATE TABLE IF NOT EXISTS padres (
  id VARCHAR(50) PRIMARY KEY,
  estudiante_dni VARCHAR(15) NOT NULL,
  estudiante_id VARCHAR(50) NOT NULL,
  nombre_padre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  email VARCHAR(100) NULL,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

-- 6. Tabla de Asistencias (Única por Estudiante y Fecha para evitar duplicados)
CREATE TABLE IF NOT EXISTS asistencias (
  id VARCHAR(50) PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL,
  estudiante_nombre VARCHAR(200) NOT NULL,
  dni VARCHAR(15) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado ENUM('Presente', 'Tardanza', 'Inasistencia', 'Justificado') NOT NULL,
  aula_id VARCHAR(50) NOT NULL,
  grado VARCHAR(20) NOT NULL,
  seccion VARCHAR(10) NOT NULL,
  nivel ENUM('Primaria', 'Secundaria') NOT NULL,
  observacion TEXT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_estudiante_fecha (estudiante_id, fecha)
);

-- 6.1 Tabla de Usuarios para Inicios de Sesión
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'docente', 'padre') NOT NULL,
  dni VARCHAR(15) NULL,
  estudiante_id VARCHAR(50) NULL,
  assigned_aulas JSON NULL,
  avatar VARCHAR(500) NULL
);

-- 7. Tabla de Comunicados
CREATE TABLE IF NOT EXISTS comunicados (
  id VARCHAR(50) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATETIME NOT NULL,
  autor VARCHAR(100) NOT NULL,
  autor_id VARCHAR(50) NOT NULL,
  autor_rol VARCHAR(50) NOT NULL,
  alcance ENUM('colegio', 'aula') NOT NULL,
  aula_id VARCHAR(50) NULL,
  aula_destino VARCHAR(100) NOT NULL,
  nivel_destino VARCHAR(50) DEFAULT 'Todos'
);

-- 8. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id VARCHAR(50) PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL,
  padre_id VARCHAR(50) NULL,
  usuario_destino_id VARCHAR(50) NULL,
  comunicado_id VARCHAR(50) NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  tipo ENUM('asistencia', 'comunicado', 'mensaje') NOT NULL DEFAULT 'asistencia',
  canal ENUM('App') NOT NULL DEFAULT 'App',
  INDEX idx_notificacion_usuario (usuario_destino_id, leida)
);

-- 8.1 Chat privado entre docentes y apoderados
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
);

-- 9. Tabla de Historial de Accesos / Logs
CREATE TABLE IF NOT EXISTS historial_accesos (
  id VARCHAR(50) PRIMARY KEY,
  usuario VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  fecha_hora DATETIME NOT NULL,
  ip VARCHAR(45) NOT NULL,
  accion TEXT NOT NULL
);

-- ========================================================
-- DATOS INICIALES MÍNIMOS
-- ========================================================

-- Insertar Configuración inicial
INSERT INTO configuracion (id, hora_ingreso_normal, hora_limite_tardanza, nombre_institucion, direccion, telefono)
VALUES (1, '08:00', '08:15', 'José Sabogal Diéguez (Josdic)', 'Av. Las Flores 456, Lima', '(01) 456-7890')
ON DUPLICATE KEY UPDATE nombre_institucion = VALUES(nombre_institucion);

-- Insertar únicamente la cuenta administradora inicial
INSERT INTO usuarios (id, nombre, email, password, rol, dni, estudiante_id, assigned_aulas, avatar) VALUES
('USR-001', 'Lic. Roberto Valdivia (Director)', 'admin@colegio.edu.pe', 'admin123', 'admin', '40998877', NULL, NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Datos demostrativos para evidenciar aulas, usuarios, permisos y comunicación
INSERT INTO aulas (id, grado, seccion, nivel, tutor_docente_id, tutor_nombre, capacidad) VALUES
('AUL-P1A', '1.°', 'A', 'Primaria', 'DOC-201', 'Prof. Carmen Rosa Flores', 30),
('AUL-P2A', '2.°', 'A', 'Primaria', 'DOC-202', 'Prof. Luis Alberto Vega', 30),
('AUL-S1A', '1.°', 'A', 'Secundaria', 'DOC-203', 'Prof. Elena Chávez Salas', 30)
ON DUPLICATE KEY UPDATE tutor_docente_id = VALUES(tutor_docente_id), tutor_nombre = VALUES(tutor_nombre);

INSERT INTO docentes (id, dni, nombres, apellidos, especialidad, email, telefono, aulas_asignadas) VALUES
('DOC-201', '43111222', 'Carmen Rosa', 'Flores', 'Educación Primaria', 'c.flores@colegio.edu.pe', '981111222', JSON_ARRAY('AUL-P1A')),
('DOC-202', '44222333', 'Luis Alberto', 'Vega', 'Educación Primaria', 'l.vega@colegio.edu.pe', '982222333', JSON_ARRAY('AUL-P2A')),
('DOC-203', '45333444', 'Elena', 'Chávez Salas', 'Comunicación', 'e.chavez@colegio.edu.pe', '983333444', JSON_ARRAY('AUL-S1A'))
ON DUPLICATE KEY UPDATE aulas_asignadas = VALUES(aulas_asignadas), email = VALUES(email);

INSERT INTO estudiantes (
  id, numero_orden, apellidos, nombres, dni, grado, seccion, nivel, aula_id,
  nombre_apoderado, telefono_apoderado, correo_apoderado, qr_code_data
) VALUES
('EST-1001', 1, 'Álvarez Rojas', 'Mateo', '72819301', '1.°', 'A', 'Primaria', 'AUL-P1A', 'Juan Carlos Álvarez', '987654321', 'jalvarez@gmail.com', 'EST-1001'),
('EST-1002', 2, 'Mendoza Ruiz', 'Valeria', '73920412', '1.°', 'A', 'Primaria', 'AUL-P1A', 'Rosa Elena Ruiz', '986123450', 'rruiz@gmail.com', 'EST-1002'),
('EST-1003', 1, 'Torres Silva', 'Diego', '74135520', '2.°', 'A', 'Primaria', 'AUL-P2A', 'Lucía Silva Pérez', '985445566', 'lsilva@gmail.com', 'EST-1003'),
('EST-1004', 1, 'Rojas Díaz', 'Camila', '75246631', '1.°', 'A', 'Secundaria', 'AUL-S1A', 'Marco Antonio Rojas', '984112233', 'mrojas@gmail.com', 'EST-1004')
ON DUPLICATE KEY UPDATE aula_id = VALUES(aula_id), nombre_apoderado = VALUES(nombre_apoderado), correo_apoderado = VALUES(correo_apoderado);

INSERT INTO padres (id, estudiante_dni, estudiante_id, nombre_padre, telefono, email) VALUES
('PAD-EST-1001', '72819301', 'EST-1001', 'Juan Carlos Álvarez', '987654321', 'jalvarez@gmail.com'),
('PAD-EST-1002', '73920412', 'EST-1002', 'Rosa Elena Ruiz', '986123450', 'rruiz@gmail.com'),
('PAD-EST-1003', '74135520', 'EST-1003', 'Lucía Silva Pérez', '985445566', 'lsilva@gmail.com'),
('PAD-EST-1004', '75246631', 'EST-1004', 'Marco Antonio Rojas', '984112233', 'mrojas@gmail.com')
ON DUPLICATE KEY UPDATE nombre_padre = VALUES(nombre_padre), email = VALUES(email);

INSERT INTO usuarios (id, nombre, email, password, rol, dni, estudiante_id, assigned_aulas) VALUES
('USR-DOC-201', 'Prof. Carmen Rosa Flores', 'c.flores@colegio.edu.pe', 'docente123', 'docente', '43111222', NULL, JSON_ARRAY('AUL-P1A')),
('USR-DOC-202', 'Prof. Luis Alberto Vega', 'l.vega@colegio.edu.pe', 'luis123', 'docente', '44222333', NULL, JSON_ARRAY('AUL-P2A')),
('USR-DOC-203', 'Prof. Elena Chávez Salas', 'e.chavez@colegio.edu.pe', 'elena123', 'docente', '45333444', NULL, JSON_ARRAY('AUL-S1A')),
('USR-PAD-EST-1001', 'Juan Carlos Álvarez (Apoderado de Mateo)', 'jalvarez@gmail.com', '72819301', 'padre', '72819301', 'EST-1001', NULL),
('USR-PAD-EST-1002', 'Rosa Elena Ruiz (Apoderada de Valeria)', 'rruiz@gmail.com', '73920412', 'padre', '73920412', 'EST-1002', NULL),
('USR-PAD-EST-1003', 'Lucía Silva Pérez (Apoderada de Diego)', 'lsilva@gmail.com', '74135520', 'padre', '74135520', 'EST-1003', NULL),
('USR-PAD-EST-1004', 'Marco Antonio Rojas (Apoderado de Camila)', 'mrojas@gmail.com', '75246631', 'padre', '75246631', 'EST-1004', NULL)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password = VALUES(password), assigned_aulas = VALUES(assigned_aulas);

INSERT INTO comunicados (
  id, titulo, descripcion, fecha, autor, autor_id, autor_rol, alcance, aula_id, aula_destino, nivel_destino
) VALUES
('COM-DEMO-001', 'Bienvenida a la comunidad educativa', 'Los avisos oficiales se publicarán únicamente dentro de esta plataforma.', '2026-09-02 08:00:00', 'Lic. Roberto Valdivia (Director)', 'USR-001', 'Administrador', 'colegio', NULL, 'Todo el colegio', 'Todos'),
('COM-DEMO-002', 'Reunión de familias de 1.° A', 'Se convoca a las familias del aula para coordinar las actividades del mes.', '2026-09-02 09:15:00', 'Prof. Carmen Rosa Flores', 'USR-DOC-201', 'Docente', 'aula', 'AUL-P1A', 'Primaria 1.° “A”', 'Primaria')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), aula_id = VALUES(aula_id);

INSERT INTO mensajes_chat (
  id, docente_usuario_id, padre_usuario_id, estudiante_id, remitente_id, remitente_rol, contenido, fecha_hora, leido
) VALUES
('MSG-DEMO-001', 'USR-DOC-201', 'USR-PAD-EST-1001', 'EST-1001', 'USR-DOC-201', 'docente', 'Buenos días, quería felicitar a Mateo por su participación en clase.', '2026-09-02 10:20:00', FALSE),
('MSG-DEMO-002', 'USR-DOC-201', 'USR-PAD-EST-1001', 'EST-1001', 'USR-PAD-EST-1001', 'padre', 'Muchas gracias, profesora. Estaremos atentos a las próximas actividades.', '2026-09-02 10:28:00', TRUE),
('MSG-DEMO-003', 'USR-DOC-201', 'USR-PAD-EST-1002', 'EST-1002', 'USR-DOC-201', 'docente', 'Buenos días, quería felicitar a Valeria por su participación en clase.', '2026-09-02 10:35:00', FALSE),
('MSG-DEMO-004', 'USR-DOC-201', 'USR-PAD-EST-1002', 'EST-1002', 'USR-PAD-EST-1002', 'padre', 'Muchas gracias, profesora. Estaremos atentos a las próximas actividades.', '2026-09-02 10:42:00', TRUE)
ON DUPLICATE KEY UPDATE contenido = VALUES(contenido);
