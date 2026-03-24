-- Migration: Fix schedule exemption permissions
-- Ensures permissions are created and assigned to ROLE_ADMIN

-- Create permission for managing schedule exemptions (if not exists)
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'MANAGE_SCHEDULE_EXEMPTIONS', 'Gestionar Exenciones de Horario', 'Gestionar usuarios y roles exentos de horario', 'SCHEDULE', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'MANAGE_SCHEDULE_EXEMPTIONS');

-- Create permission for viewing schedule exemptions (if not exists)
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'VIEW_SCHEDULE_EXEMPTIONS', 'Ver Exenciones de Horario', 'Ver usuarios y roles exentos de horario', 'SCHEDULE', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'VIEW_SCHEDULE_EXEMPTIONS');

-- Add menu item for schedule exemptions (if not exists)
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

-- Associate menu with permission (if not exists)
INSERT INTO menu_item_permission (menu_item_id, permission_code, created_at)
SELECT m.id, 'VIEW_SCHEDULE_EXEMPTIONS', NOW()
FROM menu_item m
WHERE m.code = 'schedule-exemptions'
AND NOT EXISTS (
    SELECT 1 FROM menu_item_permission WHERE menu_item_id = m.id AND permission_code = 'VIEW_SCHEDULE_EXEMPTIONS'
);

-- Grant VIEW_SCHEDULE_EXEMPTIONS to ROLE_ADMIN
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_SCHEDULE_EXEMPTIONS'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model WHERE role_id = r.id AND permission_code = 'VIEW_SCHEDULE_EXEMPTIONS'
);

-- Grant MANAGE_SCHEDULE_EXEMPTIONS to ROLE_ADMIN
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_SCHEDULE_EXEMPTIONS'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model WHERE role_id = r.id AND permission_code = 'MANAGE_SCHEDULE_EXEMPTIONS'
);
