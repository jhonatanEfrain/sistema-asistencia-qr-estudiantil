export function getCompleteMySQLScript(): string {
  return `-- ==============================================================================
-- SISTEMA DE CONTROL Y REGISTRO DE ASISTENCIA ESTUDIANTIL POR CÓDIGO QR
-- SCRIPT DE CREACIÓN DE BASE DE DATOS MYSQL Y POBLACIÓN INICIAL DE DATOS
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS \`asistencia_qr_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`asistencia_qr_db\`;

-- ------------------------------------------------------------------------------
-- 1. TABLA: roles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`roles\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`nombre\` VARCHAR(50) NOT NULL UNIQUE,
  \`descripcion\` VARCHAR(255) NULL,
  \`fecha_creacion\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 2. TABLA: usuarios
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nombre_usuario\` VARCHAR(100) NOT NULL UNIQUE,
  \`correo\` VARCHAR(120) NOT NULL UNIQUE,
  \`contrasena_hash\` VARCHAR(255) NOT NULL,
  \`rol_id\` INT NOT NULL,
  \`estado\` ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
  \`ultimo_acceso\` DATETIME NULL,
  \`fecha_creacion\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`rol_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 3. TABLA: grados
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`grados\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nombre\` VARCHAR(20) NOT NULL, -- Ej: '1.°', '2.°'
  \`nivel\` ENUM('Primaria', 'Secundaria') NOT NULL,
  \`orden\` INT NOT NULL,
  UNIQUE KEY \`uk_grado_nivel\` (\`nombre\`, \`nivel\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 4. TABLA: docentes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`docentes\` (
  \`id\` VARCHAR(20) PRIMARY KEY,
  \`dni\` VARCHAR(15) NOT NULL UNIQUE,
  \`nombres\` VARCHAR(100) NOT NULL,
  \`apellidos\` VARCHAR(100) NOT NULL,
  \`especialidad\` VARCHAR(100) NULL,
  \`email\` VARCHAR(120) NOT NULL UNIQUE,
  \`telefono\` VARCHAR(20) NULL,
  \`usuario_id\` INT NULL,
  \`fecha_creacion\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 5. TABLA: aulas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`aulas\` (
  \`id\` VARCHAR(20) PRIMARY KEY,
  \`grado_id\` INT NOT NULL,
  \`seccion\` VARCHAR(10) NOT NULL, -- Ej: 'A', 'B'
  \`nivel\` ENUM('Primaria', 'Secundaria') NOT NULL,
  \`tutor_docente_id\` VARCHAR(20) NULL,
  \`capacidad\` INT DEFAULT 30,
  FOREIGN KEY (\`grado_id\`) REFERENCES \`grados\`(\`id\`) ON DELETE RESTRICT,
  FOREIGN KEY (\`tutor_docente_id\`) REFERENCES \`docentes\`(\`id\`) ON DELETE SET NULL,
  UNIQUE KEY \`uk_aula\` (\`grado_id\`, \`seccion\`, \`nivel\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 6. TABLA: padres (Apoderados)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`padres\` (
  \`id\` VARCHAR(20) PRIMARY KEY,
  \`nombres_completos\` VARCHAR(150) NOT NULL,
  \`telefono\` VARCHAR(20) NOT NULL,
  \`correo\` VARCHAR(120) NULL,
  \`direccion\` VARCHAR(255) NULL,
  \`usuario_id\` INT NULL,
  \`fecha_creacion\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 7. TABLA: estudiantes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`estudiantes\` (
  \`id\` VARCHAR(20) PRIMARY KEY, -- Número de orden / ID único
  \`numero_orden\` INT NOT NULL,
  \`apellidos\` VARCHAR(100) NOT NULL,
  \`nombres\` VARCHAR(100) NOT NULL,
  \`dni\` VARCHAR(15) NOT NULL UNIQUE,
  \`aula_id\` VARCHAR(20) NOT NULL,
  \`padre_id\` VARCHAR(20) NULL,
  \`estado\` ENUM('Activo', 'Retirado', 'Suspendido') DEFAULT 'Activo',
  \`foto_url\` VARCHAR(255) NULL,
  \`fecha_registro\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`aula_id\`) REFERENCES \`aulas\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (\`padre_id\`) REFERENCES \`padres\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 8. TABLA: qr_estudiantes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`qr_estudiantes\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`estudiante_id\` VARCHAR(20) NOT NULL UNIQUE,
  \`codigo_qr_hash\` VARCHAR(255) NOT NULL,
  \`fecha_generacion\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`estado\` ENUM('Vigente', 'Revocado') DEFAULT 'Vigente',
  FOREIGN KEY (\`estudiante_id\`) REFERENCES \`estudiantes\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 9. TABLA: asistencias
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`asistencias\` (
  \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
  \`estudiante_id\` VARCHAR(20) NOT NULL,
  \`aula_id\` VARCHAR(20) NOT NULL,
  \`fecha\` DATE NOT NULL,
  \`hora\` TIME NOT NULL,
  \`estado\` ENUM('Presente', 'Tardanza', 'Inasistencia', 'Justificado') NOT NULL DEFAULT 'Presente',
  \`dispositivo_escaneo\` VARCHAR(100) DEFAULT 'Camara_Lector_QR_01',
  \`observacion\` VARCHAR(255) NULL,
  \`fecha_creacion\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`estudiante_id\`) REFERENCES \`estudiantes\`(\`id\`) ON DELETE RESTRICT,
  FOREIGN KEY (\`aula_id\`) REFERENCES \`aulas\`(\`id\`) ON DELETE RESTRICT,
  -- Restricción para evitar duplicados en la misma fecha para un estudiante
  UNIQUE KEY \`uk_asistencia_diaria\` (\`estudiante_id\`, \`fecha\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 10. TABLA: comunicados
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`comunicados\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`titulo\` VARCHAR(150) NOT NULL,
  \`descripcion\` TEXT NOT NULL,
  \`fecha\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`autor\` VARCHAR(100) NOT NULL,
  \`autor_id\` VARCHAR(50) NOT NULL,
  \`autor_rol\` VARCHAR(50) NOT NULL,
  \`alcance\` ENUM('colegio', 'aula') NOT NULL,
  \`aula_id\` VARCHAR(50) NULL,
  \`aula_destino\` VARCHAR(100) NOT NULL,
  \`nivel_destino\` ENUM('Primaria', 'Secundaria', 'Todos') DEFAULT 'Todos',
  FOREIGN KEY (\`aula_id\`) REFERENCES \`aulas\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 11. TABLA: notificaciones
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`notificaciones\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`estudiante_id\` VARCHAR(20) NOT NULL,
  \`padre_id\` VARCHAR(20) NULL,
  \`usuario_destino_id\` VARCHAR(50) NULL,
  \`comunicado_id\` VARCHAR(50) NULL,
  \`titulo\` VARCHAR(100) NOT NULL,
  \`mensaje\` TEXT NOT NULL,
  \`canal\` ENUM('App') DEFAULT 'App',
  \`tipo\` ENUM('asistencia', 'comunicado', 'mensaje') NOT NULL DEFAULT 'asistencia',
  \`leida\` TINYINT(1) DEFAULT 0,
  \`fecha_hora\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`estudiante_id\`) REFERENCES \`estudiantes\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`padre_id\`) REFERENCES \`padres\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 12. TABLA: mensajes_chat
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`mensajes_chat\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`docente_usuario_id\` VARCHAR(50) NOT NULL,
  \`padre_usuario_id\` VARCHAR(50) NOT NULL,
  \`estudiante_id\` VARCHAR(50) NOT NULL,
  \`remitente_id\` VARCHAR(50) NOT NULL,
  \`remitente_rol\` ENUM('docente', 'padre') NOT NULL,
  \`contenido\` TEXT NOT NULL,
  \`fecha_hora\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`leido\` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 13. TABLA: historial_accesos (Auditoría)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`historial_accesos\` (
  \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
  \`usuario\` VARCHAR(100) NOT NULL,
  \`rol\` VARCHAR(50) NOT NULL,
  \`ip\` VARCHAR(45) NOT NULL,
  \`accion\` VARCHAR(255) NOT NULL,
  \`fecha_hora\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO PARA CONSULTAS Y REPORTES
-- ------------------------------------------------------------------------------
CREATE INDEX \`idx_asistencias_fecha_estado\` ON \`asistencias\` (\`fecha\`, \`estado\`);
CREATE INDEX \`idx_asistencias_aula_fecha\` ON \`asistencias\` (\`aula_id\`, \`fecha\`);
CREATE INDEX \`idx_estudiantes_dni\` ON \`estudiantes\` (\`dni\`);
CREATE INDEX \`idx_estudiantes_aula\` ON \`estudiantes\` (\`aula_id\`);
CREATE INDEX \`idx_notificaciones_estudiante\` ON \`notificaciones\` (\`estudiante_id\`, \`leida\`);
CREATE INDEX \`idx_notificaciones_usuario\` ON \`notificaciones\` (\`usuario_destino_id\`, \`leida\`);
CREATE INDEX \`idx_chat_docente\` ON \`mensajes_chat\` (\`docente_usuario_id\`, \`fecha_hora\`);
CREATE INDEX \`idx_chat_padre\` ON \`mensajes_chat\` (\`padre_usuario_id\`, \`fecha_hora\`);

-- ------------------------------------------------------------------------------
-- PROCEDIMIENTO ALMACENADO: REGISTRAR ASISTENCIA QR
-- ------------------------------------------------------------------------------
DELIMITER //

CREATE PROCEDURE \`sp_registrar_asistencia_qr\`(
    IN p_estudiante_id VARCHAR(20),
    IN p_hora_escaneo TIME,
    IN p_limite_tardanza TIME,
    OUT p_codigo_respuesta INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT;
    DECLARE v_aula_id VARCHAR(20);
    DECLARE v_hoy DATE;
    DECLARE v_estado VARCHAR(20);
    DECLARE v_padre_id VARCHAR(20);
    DECLARE v_nombre_estudiante VARCHAR(200);

    SET v_hoy = CURDATE();

    -- Check si estudiante existe
    SELECT COUNT(*), MAX(aula_id), MAX(padre_id), CONCAT(apellidos, ', ', nombres)
    INTO v_existe, v_aula_id, v_padre_id, v_nombre_estudiante
    FROM estudiantes
    WHERE id = p_estudiante_id AND estado = 'Activo';

    IF v_existe = 0 THEN
        SET p_codigo_respuesta = 404;
        SET p_mensaje = 'Código QR no pertenece a ningún estudiante activo.';
    ELSE
        -- Verificar si ya registró asistencia hoy
        SELECT COUNT(*) INTO v_existe FROM asistencias WHERE estudiante_id = p_estudiante_id AND fecha = v_hoy;

        IF v_existe > 0 THEN
            SET p_codigo_respuesta = 409;
            SET p_mensaje = CONCAT('El estudiante ', v_nombre_estudiante, ' ya registró su asistencia hoy.');
        ELSE
            -- Determinar si es Presente o Tardanza
            IF p_hora_escaneo <= p_limite_tardanza THEN
                SET v_estado = 'Presente';
            ELSE
                SET v_estado = 'Tardanza';
            END IF;

            -- Registrar asistencia
            INSERT INTO asistencias (estudiante_id, aula_id, fecha, hora, estado)
            VALUES (p_estudiante_id, v_aula_id, v_hoy, p_hora_escaneo, v_estado);

            -- Notificar a apoderado
            INSERT INTO notificaciones (estudiante_id, padre_id, titulo, mensaje, canal)
            VALUES (
                p_estudiante_id,
                v_padre_id,
                'Asistencia Registrada',
                CONCAT('Su hijo(a) ', v_nombre_estudiante, ' ingresó a la institución a las ', p_hora_escaneo),
                'App'
            );

            SET p_codigo_respuesta = 200;
            SET p_mensaje = CONCAT('Asistencia registrada correctamente [', v_estado, '].');
        END IF;
    END IF;
END //

DELIMITER ;

-- ------------------------------------------------------------------------------
-- DATOS SEMILLA (INSERCIONES INICIALES DE EJEMPLO)
-- ------------------------------------------------------------------------------
INSERT INTO \`roles\` (\`id\`, \`nombre\`, \`descripcion\`) VALUES
(1, 'Administrador', 'Control total del sistema escolar'),
(2, 'Docente', 'Acceso a aulas asignadas y comunicados'),
(3, 'Padre', 'Consulta de asistencia e informes de su hijo');

INSERT INTO \`grados\` (\`id\`, \`nombre\`, \`nivel\`, \`orden\`) VALUES
(1, '1.°', 'Primaria', 1),
(2, '2.°', 'Primaria', 2),
(3, '3.°', 'Primaria', 3),
(4, '4.°', 'Primaria', 4),
(5, '5.°', 'Primaria', 5),
(6, '6.°', 'Primaria', 6),
(7, '1.°', 'Secundaria', 7),
(8, '2.°', 'Secundaria', 8),
(9, '3.°', 'Secundaria', 9),
(10, '4.°', 'Secundaria', 10),
(11, '5.°', 'Secundaria', 11);
`;
}
