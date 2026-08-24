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
  autor_rol VARCHAR(50) NOT NULL,
  aula_destino VARCHAR(100) NOT NULL,
  nivel_destino VARCHAR(50) DEFAULT 'Todos'
);

-- 8. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id VARCHAR(50) PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL,
  padre_id VARCHAR(50) NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  canal ENUM('App', 'WhatsApp', 'SMS', 'Email') DEFAULT 'App'
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
-- DATOS INICIALES DE PRUEBA (SEED DATA)
-- ========================================================

-- Insertar Configuración inicial
INSERT INTO configuracion (id, hora_ingreso_normal, hora_limite_tardanza, nombre_institucion, direccion, telefono)
VALUES (1, '08:00', '08:15', 'José Sabogal Diéguez (Josdic)', 'Av. Las Flores 456, Lima', '(01) 456-7890')
ON DUPLICATE KEY UPDATE nombre_institucion = VALUES(nombre_institucion);

-- Insertar Aulas (Sin tutores preasignados ficticios; los docentes se asignan al registrarlos)
INSERT INTO aulas (id, grado, seccion, nivel, tutor_docente_id, tutor_nombre, capacidad) VALUES
('AUL-P1A', '1.°', 'A', 'Primaria', 'DOC-201', 'Prof. Carmen Rosa Flores', 30),
('AUL-P2A', '2.°', 'A', 'Primaria', 'DOC-201', 'Prof. Carmen Rosa Flores', 30),
('AUL-P3A', '3.°', 'A', 'Primaria', NULL, NULL, 30),
('AUL-P4A', '4.°', 'A', 'Primaria', NULL, NULL, 30),
('AUL-P5A', '5.°', 'A', 'Primaria', NULL, NULL, 30),
('AUL-P6A', '6.°', 'A', 'Primaria', NULL, NULL, 30),
('AUL-S1A', '1.°', 'A', 'Secundaria', NULL, NULL, 35),
('AUL-S2A', '2.°', 'A', 'Secundaria', NULL, NULL, 35),
('AUL-S3A', '3.°', 'A', 'Secundaria', NULL, NULL, 35),
('AUL-S4A', '4.°', 'A', 'Secundaria', NULL, NULL, 35),
('AUL-S5A', '5.°', 'A', 'Secundaria', NULL, NULL, 35)
ON DUPLICATE KEY UPDATE 
  tutor_docente_id = VALUES(tutor_docente_id),
  tutor_nombre = VALUES(tutor_nombre),
  capacidad = VALUES(capacidad);

-- Insertar Docentes (1 Docente de prueba)
INSERT INTO docentes (id, dni, nombres, apellidos, especialidad, email, telefono, aulas_asignadas) VALUES
('DOC-201', '41238901', 'Carmen Rosa', 'Flores Silva', 'Tutoría Primaria', 'c.flores@colegio.edu.pe', '+51 988112233', '["AUL-P1A", "AUL-P2A"]')
ON DUPLICATE KEY UPDATE nombres = VALUES(nombres);

-- Insertar Usuarios por defecto para Inicios de Sesión (Admin y 1 Docente únicamente)
INSERT INTO usuarios (id, nombre, email, password, rol, dni, estudiante_id, assigned_aulas, avatar) VALUES
('USR-001', 'Lic. Roberto Valdivia (Director)', 'admin@colegio.edu.pe', 'admin123', 'admin', '40998877', NULL, NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'),
('USR-002', 'Prof. Carmen Rosa Flores', 'c.flores@colegio.edu.pe', 'docente123', 'docente', '41238901', NULL, '["AUL-P1A", "AUL-P2A"]', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

