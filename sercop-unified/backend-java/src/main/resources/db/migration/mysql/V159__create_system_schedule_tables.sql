-- =====================================================
-- V159: System Usage Schedules
-- Implementa control de horarios de acceso al sistema
-- con múltiples niveles: Global, Rol, Usuario, Excepciones
-- Campos de texto usan claves i18n para multi-idioma
-- =====================================================

-- 1. Horarios Globales
CREATE TABLE IF NOT EXISTS system_schedule_global_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único del horario',
    name_key VARCHAR(100) NOT NULL COMMENT 'Clave i18n para el nombre',
    description_key VARCHAR(100) COMMENT 'Clave i18n para la descripción',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_schedule_global_default (is_default),
    INDEX idx_schedule_global_active (is_active),
    INDEX idx_schedule_global_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Horas por día de la semana para horario global
CREATE TABLE IF NOT EXISTS system_schedule_global_hours_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    schedule_id BIGINT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '1=Lunes, 7=Domingo',
    is_enabled BOOLEAN DEFAULT TRUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    allow_overnight BOOLEAN DEFAULT FALSE COMMENT 'Si end_time < start_time (ej: 22:00-02:00)',
    FOREIGN KEY (schedule_id) REFERENCES system_schedule_global_read_model(id) ON DELETE CASCADE,
    UNIQUE KEY uk_global_schedule_day (schedule_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Horarios por Rol
CREATE TABLE IF NOT EXISTS system_schedule_role_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    schedule_type ENUM('EXTEND', 'RESTRICT', 'REPLACE') NOT NULL DEFAULT 'EXTEND'
        COMMENT 'EXTEND=Amplía, RESTRICT=Restringe, REPLACE=Reemplaza el horario global',
    description_key VARCHAR(100) COMMENT 'Clave i18n para la descripción',
    priority INT DEFAULT 0 COMMENT 'Mayor prioridad = se evalúa primero',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (role_id) REFERENCES role_read_model(id) ON DELETE CASCADE,
    INDEX idx_schedule_role_active (is_active),
    INDEX idx_schedule_role_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_schedule_role_hours_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_schedule_id BIGINT NOT NULL,
    day_of_week TINYINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    allow_overnight BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (role_schedule_id) REFERENCES system_schedule_role_read_model(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_schedule_day (role_schedule_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Horarios por Usuario
CREATE TABLE IF NOT EXISTS system_schedule_user_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    schedule_type ENUM('EXTEND', 'RESTRICT', 'REPLACE') NOT NULL DEFAULT 'EXTEND',
    timezone_override VARCHAR(50) COMMENT 'Zona horaria específica del usuario',
    reason TEXT COMMENT 'Justificación del horario especial (texto libre)',
    approved_by VARCHAR(100),
    approved_at TIMESTAMP NULL,
    valid_from DATE,
    valid_until DATE COMMENT 'NULL = indefinido',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,
    INDEX idx_schedule_user_active (is_active),
    INDEX idx_schedule_user_validity (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_schedule_user_hours_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_schedule_id BIGINT NOT NULL,
    day_of_week TINYINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    allow_overnight BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_schedule_id) REFERENCES system_schedule_user_read_model(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_schedule_day (user_schedule_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Excepciones Temporales
CREATE TABLE IF NOT EXISTS system_schedule_exception_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exception_type ENUM('GLOBAL', 'ROLE', 'USER') NOT NULL,
    target_id BIGINT COMMENT 'role_id o user_id según exception_type, NULL para GLOBAL',
    exception_date DATE NOT NULL,
    exception_action ENUM('ALLOW', 'DENY', 'MODIFY') NOT NULL
        COMMENT 'ALLOW=Permite fuera de horario, DENY=Bloquea, MODIFY=Modifica horario',
    start_time TIME,
    end_time TIME,
    reason TEXT NOT NULL COMMENT 'Justificación (texto libre)',
    requested_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP NULL,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    rejection_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_exception_date (exception_date),
    INDEX idx_exception_type_target (exception_type, target_id),
    INDEX idx_exception_status (approval_status),
    INDEX idx_exception_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Días Festivos
CREATE TABLE IF NOT EXISTS system_schedule_holiday_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL COMMENT 'Código único del festivo (ej: NEW_YEAR, CHRISTMAS)',
    holiday_date DATE NOT NULL,
    name_key VARCHAR(100) NOT NULL COMMENT 'Clave i18n para el nombre (ej: holiday.new_year)',
    country_code VARCHAR(3) COMMENT 'ISO 3166-1 alpha-3 (MEX, USA, ESP, etc.)',
    region_code VARCHAR(10) COMMENT 'Para festivos regionales',
    is_bank_holiday BOOLEAN DEFAULT TRUE,
    action_type ENUM('CLOSED', 'REDUCED_HOURS', 'NORMAL') NOT NULL DEFAULT 'CLOSED',
    start_time TIME COMMENT 'Solo si action_type = REDUCED_HOURS',
    end_time TIME,
    is_recurring BOOLEAN DEFAULT FALSE COMMENT 'Si se repite cada año',
    recurrence_month TINYINT COMMENT '1-12',
    recurrence_day TINYINT COMMENT '1-31',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_holiday_date (holiday_date),
    INDEX idx_holiday_country (country_code),
    INDEX idx_holiday_recurring (is_recurring, recurrence_month, recurrence_day),
    UNIQUE KEY uk_holiday_country_date (holiday_date, country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Log de Accesos por Horario
CREATE TABLE IF NOT EXISTS system_schedule_access_log_read_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    username VARCHAR(100) NOT NULL,
    access_timestamp TIMESTAMP NOT NULL,
    user_timezone VARCHAR(50),
    system_timezone VARCHAR(50),
    user_local_time TIME,
    access_result ENUM('ALLOWED', 'DENIED', 'WARNED') NOT NULL,
    denial_reason_key VARCHAR(100) COMMENT 'Clave i18n para la razón de denegación',
    denial_reason_params TEXT COMMENT 'Parámetros JSON para interpolación',
    schedule_level_applied ENUM('GLOBAL', 'ROLE', 'USER', 'EXCEPTION', 'HOLIDAY') NOT NULL,
    schedule_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_access_user (user_id),
    INDEX idx_access_timestamp (access_timestamp),
    INDEX idx_access_result (access_result),
    INDEX idx_access_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar horario global predeterminado (solo si no existe)
INSERT IGNORE INTO system_schedule_global_read_model
    (code, name_key, description_key, timezone, is_default, is_active, created_by)
VALUES
    ('DEFAULT', 'schedule.default.name', 'schedule.default.description', 'America/Mexico_City', TRUE, TRUE, 'SYSTEM');

-- Obtener el ID del horario por defecto
SET @default_schedule_id = (SELECT id FROM system_schedule_global_read_model WHERE code = 'DEFAULT' LIMIT 1);

-- Insertar horas para Lunes a Viernes (días 1-5) - usando INSERT IGNORE para evitar duplicados
INSERT IGNORE INTO system_schedule_global_hours_read_model
    (schedule_id, day_of_week, is_enabled, start_time, end_time, allow_overnight)
VALUES
    (@default_schedule_id, 1, TRUE, '09:00:00', '18:00:00', FALSE),
    (@default_schedule_id, 2, TRUE, '09:00:00', '18:00:00', FALSE),
    (@default_schedule_id, 3, TRUE, '09:00:00', '18:00:00', FALSE),
    (@default_schedule_id, 4, TRUE, '09:00:00', '18:00:00', FALSE),
    (@default_schedule_id, 5, TRUE, '09:00:00', '18:00:00', FALSE),
    (@default_schedule_id, 6, FALSE, '00:00:00', '00:00:00', FALSE),
    (@default_schedule_id, 7, FALSE, '00:00:00', '00:00:00', FALSE);

-- Insertar días festivos de México 2024-2026 (INSERT IGNORE para evitar duplicados)
-- Los nombres usan claves i18n que se resolverán en el frontend
INSERT IGNORE INTO system_schedule_holiday_read_model
    (code, holiday_date, name_key, country_code, is_bank_holiday, action_type, is_recurring, recurrence_month, recurrence_day, created_by)
VALUES
    -- Festivos recurrentes (se definen una vez con la fecha base)
    ('NEW_YEAR', '2024-01-01', 'holiday.new_year', 'MEX', TRUE, 'CLOSED', TRUE, 1, 1, 'SYSTEM'),
    ('CONSTITUTION_DAY', '2024-02-05', 'holiday.constitution_day', 'MEX', TRUE, 'CLOSED', TRUE, 2, 5, 'SYSTEM'),
    ('BENITO_JUAREZ', '2024-03-18', 'holiday.benito_juarez', 'MEX', TRUE, 'CLOSED', TRUE, 3, 21, 'SYSTEM'),
    ('LABOR_DAY', '2024-05-01', 'holiday.labor_day', 'MEX', TRUE, 'CLOSED', TRUE, 5, 1, 'SYSTEM'),
    ('INDEPENDENCE_DAY', '2024-09-16', 'holiday.independence_day', 'MEX', TRUE, 'CLOSED', TRUE, 9, 16, 'SYSTEM'),
    ('REVOLUTION_DAY', '2024-11-18', 'holiday.revolution_day', 'MEX', TRUE, 'CLOSED', TRUE, 11, 20, 'SYSTEM'),
    ('CHRISTMAS', '2024-12-25', 'holiday.christmas', 'MEX', TRUE, 'CLOSED', TRUE, 12, 25, 'SYSTEM');

-- =====================================================
-- PERMISOS
-- =====================================================

-- Los permisos también usan claves i18n
INSERT IGNORE INTO permission_read_model (code, name, description, module, created_at) VALUES
    ('CAN_VIEW_SCHEDULES', 'permission.schedule.view.name', 'permission.schedule.view.description', 'SYSTEM', NOW()),
    ('CAN_MANAGE_GLOBAL_SCHEDULE', 'permission.schedule.manage_global.name', 'permission.schedule.manage_global.description', 'SYSTEM', NOW()),
    ('CAN_MANAGE_ROLE_SCHEDULES', 'permission.schedule.manage_role.name', 'permission.schedule.manage_role.description', 'SYSTEM', NOW()),
    ('CAN_MANAGE_USER_SCHEDULES', 'permission.schedule.manage_user.name', 'permission.schedule.manage_user.description', 'SYSTEM', NOW()),
    ('CAN_MANAGE_SCHEDULE_EXCEPTIONS', 'permission.schedule.manage_exceptions.name', 'permission.schedule.manage_exceptions.description', 'SYSTEM', NOW()),
    ('CAN_APPROVE_SCHEDULE_EXCEPTIONS', 'permission.schedule.approve_exceptions.name', 'permission.schedule.approve_exceptions.description', 'SYSTEM', NOW()),
    ('CAN_MANAGE_HOLIDAYS', 'permission.schedule.manage_holidays.name', 'permission.schedule.manage_holidays.description', 'SYSTEM', NOW()),
    ('CAN_VIEW_SCHEDULE_LOGS', 'permission.schedule.view_logs.name', 'permission.schedule.view_logs.description', 'SYSTEM', NOW());

-- Asignar permisos al rol ADMIN
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN'
AND p.code IN (
    'CAN_VIEW_SCHEDULES',
    'CAN_MANAGE_GLOBAL_SCHEDULE',
    'CAN_MANAGE_ROLE_SCHEDULES',
    'CAN_MANAGE_USER_SCHEDULES',
    'CAN_MANAGE_SCHEDULE_EXCEPTIONS',
    'CAN_APPROVE_SCHEDULE_EXCEPTIONS',
    'CAN_MANAGE_HOLIDAYS',
    'CAN_VIEW_SCHEDULE_LOGS'
)
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Asignar permisos de solo lectura al rol MANAGER
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_MANAGER'
AND p.code IN (
    'CAN_VIEW_SCHEDULES',
    'CAN_VIEW_SCHEDULE_LOGS',
    'CAN_APPROVE_SCHEDULE_EXCEPTIONS'
)
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- =====================================================
-- MENÚ
-- =====================================================

-- Obtener el ID del menú SECTION_ADMIN
SET @admin_section_id = (SELECT id FROM menu_item WHERE code = 'SECTION_ADMIN' LIMIT 1);

-- Insertar el menú de horarios del sistema
INSERT IGNORE INTO menu_item
    (code, label_key, icon, path, parent_id, display_order, is_section, is_active, created_by)
VALUES
    ('ADMIN_SCHEDULES', 'menu.admin.schedules', 'FiClock', '/admin/schedules', @admin_section_id, 120, FALSE, TRUE, 'SYSTEM');

-- Obtener el ID del nuevo menú
SET @schedule_menu_id = (SELECT id FROM menu_item WHERE code = 'ADMIN_SCHEDULES' LIMIT 1);

-- Asociar el permiso requerido
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
VALUES (@schedule_menu_id, 'CAN_VIEW_SCHEDULES');
