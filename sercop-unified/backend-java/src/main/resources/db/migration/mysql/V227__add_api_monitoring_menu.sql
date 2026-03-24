-- =============================================================================
-- Migration V227: Add API Monitoring menu item for administrators
-- Description: Adds menu entry for API access monitoring dashboard
-- =============================================================================

-- Get the parent ID for ADMINISTRATION section
SET @admin_parent_id = (SELECT id FROM menu_item WHERE code = 'ADMINISTRATION' OR code = 'ADMIN_SECTION' LIMIT 1);

-- Add menu item for API Monitoring under Administration
INSERT INTO menu_item (
    code,
    parent_id,
    label_key,
    icon,
    path,
    display_order,
    is_section,
    is_active,
    user_type_restriction,
    created_at,
    created_by
) VALUES (
    'API_MONITORING',
    @admin_parent_id,
    'menu.admin.api',
    'Activity',
    '/admin/api-monitoring',
    67,
    FALSE,
    TRUE,
    'INTERNAL',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    label_key = VALUES(label_key),
    icon = VALUES(icon),
    path = VALUES(path),
    display_order = VALUES(display_order),
    is_active = TRUE;

-- Create the permission for API monitoring (if not exists)
INSERT INTO permission_read_model (code, name, description, module, created_at)
VALUES (
    'CAN_VIEW_API_MONITORING',
    'Ver Monitoreo de APIs',
    'Permite acceder al dashboard de monitoreo de llamadas a APIs del sistema',
    'SECURITY',
    NOW()
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Link menu to permission
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CAN_VIEW_API_MONITORING'
FROM menu_item m
WHERE m.code = 'API_MONITORING'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Also link existing SECURITY_AUDIT permission (users with security audit should see this)
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'SECURITY_AUDIT'
FROM menu_item m
WHERE m.code = 'API_MONITORING'
AND EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'SECURITY_AUDIT')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign permission to ROLE_ADMIN (role_id from role_read_model)
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_API_MONITORING'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Also assign SECURITY_AUDIT to ROLE_ADMIN if not already there
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'SECURITY_AUDIT'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
AND EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'SECURITY_AUDIT')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
