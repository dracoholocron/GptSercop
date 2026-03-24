-- =============================================================================
-- V98: Fix Brand Template Permissions
-- =============================================================================
-- Ensure brand template permissions are properly assigned

-- Insert permissions if not exist
INSERT IGNORE INTO permission_read_model (code, name, description, module) VALUES
    ('VIEW_BRAND_TEMPLATES', 'Ver Plantillas de Marca', 'Permite ver plantillas de marca', 'BRAND'),
    ('MANAGE_BRAND_TEMPLATES', 'Gestionar Plantillas de Marca', 'Permite crear, editar y eliminar plantillas de marca', 'BRAND');

-- Assign VIEW permission to ROLE_USER
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_USER';

-- Assign both permissions to ADMIN role
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

-- Assign to MANAGER role
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_MANAGER';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_MANAGER';

-- Assign to OPERATOR role (view only)
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_OPERATOR';
