-- Migration: Create schedule exempt users and roles tables
-- Description: Tables for managing users and roles that are exempt from schedule restrictions

-- Table for exempt users
CREATE TABLE IF NOT EXISTS schedule_exempt_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from DATETIME NULL,
    valid_until DATETIME NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) NULL,
    updated_at DATETIME NULL,
    approved_by VARCHAR(100) NULL,
    approved_at DATETIME NULL,
    CONSTRAINT fk_exempt_user_user FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,
    CONSTRAINT uk_exempt_user_user UNIQUE (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for exempt roles
CREATE TABLE IF NOT EXISTS schedule_exempt_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from DATETIME NULL,
    valid_until DATETIME NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) NULL,
    updated_at DATETIME NULL,
    approved_by VARCHAR(100) NULL,
    approved_at DATETIME NULL,
    CONSTRAINT fk_exempt_role_role FOREIGN KEY (role_id) REFERENCES role_read_model(id) ON DELETE CASCADE,
    CONSTRAINT uk_exempt_role_role UNIQUE (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Indexes already created, skipping to avoid duplicate errors

-- Add ROLE_ADMIN as exempt by default with justification
INSERT INTO schedule_exempt_role (role_id, reason, is_active, created_by, approved_by, approved_at)
SELECT id, 'Rol de administrador del sistema - requiere acceso sin restricciones de horario para tareas de mantenimiento y emergencias',
       TRUE, 'system', 'system', NOW()
FROM role_read_model WHERE name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

-- Add menu item for schedule exemptions management
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_at, updated_at, created_by)
SELECT 'schedule-exemptions',
       (SELECT id FROM menu_item WHERE code = 'admin' LIMIT 1),
       'menu.scheduleExemptions',
       'UserCheck',
       '/admin/schedule-exemptions',
       85,
       FALSE,
       TRUE,
       NOW(),
       NOW(),
       'system'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'schedule-exemptions');

-- Create permission for managing schedule exemptions
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'MANAGE_SCHEDULE_EXEMPTIONS', 'Gestionar Exenciones de Horario', 'Gestionar usuarios y roles exentos de horario', 'SCHEDULE', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'MANAGE_SCHEDULE_EXEMPTIONS');

-- Create permission for viewing schedule exemptions
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'VIEW_SCHEDULE_EXEMPTIONS', 'Ver Exenciones de Horario', 'Ver usuarios y roles exentos de horario', 'SCHEDULE', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'VIEW_SCHEDULE_EXEMPTIONS');

-- Associate menu with permission
INSERT INTO menu_item_permission (menu_item_id, permission_code, created_at)
SELECT m.id, 'VIEW_SCHEDULE_EXEMPTIONS', NOW()
FROM menu_item m
WHERE m.code = 'schedule-exemptions'
AND NOT EXISTS (
    SELECT 1 FROM menu_item_permission WHERE menu_item_id = m.id AND permission_code = 'VIEW_SCHEDULE_EXEMPTIONS'
);

-- Grant permissions to ROLE_ADMIN via role_permission_read_model
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' AND p.code IN ('MANAGE_SCHEDULE_EXEMPTIONS', 'VIEW_SCHEDULE_EXEMPTIONS')
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model WHERE role_id = r.id AND permission_code = p.code
);
