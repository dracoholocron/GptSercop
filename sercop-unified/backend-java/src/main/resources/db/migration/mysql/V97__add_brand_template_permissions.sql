-- =============================================================================
-- V97: Add Brand Template Permissions
-- =============================================================================
-- Permissions for brand template management

-- Insert brand template permissions
INSERT INTO permission_read_model (code, name, description, module) VALUES
    ('VIEW_BRAND_TEMPLATES', 'Ver Plantillas de Marca', 'Permite ver plantillas de marca', 'BRAND'),
    ('MANAGE_BRAND_TEMPLATES', 'Gestionar Plantillas de Marca', 'Permite crear, editar y eliminar plantillas de marca', 'BRAND');

-- Assign VIEW permission to ROLE_USER (all users can view)
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_USER';

-- Assign both permissions to ADMIN role
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

-- Also assign MANAGE to MANAGER role if exists
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_MANAGER';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_BRAND_TEMPLATES'
FROM role_read_model r WHERE r.name = 'ROLE_MANAGER';
