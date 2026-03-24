-- =============================================================================
-- Migration V133: Add Action Type Config administration menu
-- =============================================================================
-- This adds menu item, permissions, and API endpoints for action_type_config management

-- Get the SECTION_CATALOGS parent ID
SET @catalogs_section = (SELECT id FROM menu_item WHERE code = 'SECTION_CATALOGS' LIMIT 1);

-- Insert menu item for Action Type Config
INSERT INTO menu_item (
    code,
    parent_id,
    label_key,
    icon,
    path,
    display_order,
    is_section,
    is_active,
    created_at,
    created_by
) VALUES (
    'CAT_ACTION_TYPE_CONFIG',
    @catalogs_section,
    'menu.catalogs.actionTypeConfig',
    'FiSettings',
    '/catalogs/action-type-config',
    85,
    FALSE,
    TRUE,
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    label_key = VALUES(label_key),
    icon = VALUES(icon),
    path = VALUES(path),
    display_order = VALUES(display_order);

-- Create permissions in permission_read_model
INSERT INTO permission_read_model (code, name, description, module, created_at) VALUES
    ('VIEW_ACTION_TYPE_CONFIG', 'Ver Config. Tipos de Acción', 'Permite ver la configuración de tipos de acción', 'CATALOGS', NOW()),
    ('MANAGE_ACTION_TYPE_CONFIG', 'Gestionar Config. Tipos de Acción', 'Permite crear, editar y eliminar configuración de tipos de acción', 'CATALOGS', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Link menu to permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_ACTION_TYPE_CONFIG'
FROM menu_item m
WHERE m.code = 'CAT_ACTION_TYPE_CONFIG'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'MANAGE_ACTION_TYPE_CONFIG'
FROM menu_item m
WHERE m.code = 'CAT_ACTION_TYPE_CONFIG'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign permissions to ADMIN role
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_ACTION_TYPE_CONFIG'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_ACTION_TYPE_CONFIG'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign VIEW permission to MANAGER role
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_ACTION_TYPE_CONFIG'
FROM role_read_model r
WHERE r.name = 'ROLE_MANAGER'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Register API endpoints
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
    ('ACTION_TYPE_CONFIG_LIST', 'GET', '/api/v1/admin/action-type-config', 'List all action type configs', 'CATALOGS', FALSE, TRUE, 'system'),
    ('ACTION_TYPE_CONFIG_GET', 'GET', '/api/v1/admin/action-type-config/*', 'Get action type config by ID', 'CATALOGS', FALSE, TRUE, 'system'),
    ('ACTION_TYPE_CONFIG_CREATE', 'POST', '/api/v1/admin/action-type-config', 'Create action type config', 'CATALOGS', FALSE, TRUE, 'system'),
    ('ACTION_TYPE_CONFIG_UPDATE', 'PUT', '/api/v1/admin/action-type-config/*', 'Update action type config', 'CATALOGS', FALSE, TRUE, 'system'),
    ('ACTION_TYPE_CONFIG_DELETE', 'DELETE', '/api/v1/admin/action-type-config/*', 'Delete action type config', 'CATALOGS', FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE description = VALUES(description), module = VALUES(module);

-- Link API endpoints to permissions
INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_ACTION_TYPE_CONFIG'
FROM api_endpoint e
WHERE e.code IN ('ACTION_TYPE_CONFIG_LIST', 'ACTION_TYPE_CONFIG_GET')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_ACTION_TYPE_CONFIG'
FROM api_endpoint e
WHERE e.code IN ('ACTION_TYPE_CONFIG_CREATE', 'ACTION_TYPE_CONFIG_UPDATE', 'ACTION_TYPE_CONFIG_DELETE')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
