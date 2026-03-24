-- =============================================================================
-- V99: Populate API Endpoint Permissions
-- =============================================================================
-- Maps API endpoints to required permissions for dynamic authorization

-- First, ensure we have the necessary permissions
INSERT IGNORE INTO permission_read_model (code, name, description, module) VALUES
    ('VIEW_USERS', 'Ver Usuarios', 'Permite ver lista de usuarios', 'SECURITY'),
    ('MANAGE_USERS', 'Gestionar Usuarios', 'Permite crear, editar y eliminar usuarios', 'SECURITY'),
    ('VIEW_ROLES', 'Ver Roles', 'Permite ver lista de roles', 'SECURITY'),
    ('VIEW_PERMISSIONS', 'Ver Permisos', 'Permite ver lista de permisos', 'SECURITY'),
    ('VIEW_MENU', 'Ver Menú', 'Permite ver configuración del menú', 'MENU'),
    ('MANAGE_MENU', 'Gestionar Menú', 'Permite crear, editar y eliminar items del menú', 'MENU'),
    ('SECURITY_AUDIT', 'Auditoría de Seguridad', 'Permite ver logs y estadísticas de seguridad', 'MONITORING');

-- Assign new permissions to ADMIN role
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' 
AND p.code IN ('VIEW_USERS', 'MANAGE_USERS', 'VIEW_ROLES', 'VIEW_PERMISSIONS', 'VIEW_MENU', 'MANAGE_MENU', 'SECURITY_AUDIT');

-- Assign view permissions to MANAGER role
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_MANAGER' 
AND p.code IN ('VIEW_USERS', 'VIEW_ROLES', 'VIEW_MENU');

-- =============================================
-- BRAND TEMPLATE ENDPOINTS
-- =============================================
INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_BRAND_TEMPLATES'
FROM api_endpoint e WHERE e.code = 'BRAND_LIST';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_BRAND_TEMPLATES'
FROM api_endpoint e WHERE e.code = 'BRAND_GET';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_BRAND_TEMPLATES'
FROM api_endpoint e WHERE e.code = 'BRAND_CREATE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_BRAND_TEMPLATES'
FROM api_endpoint e WHERE e.code = 'BRAND_UPDATE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_BRAND_TEMPLATES'
FROM api_endpoint e WHERE e.code = 'BRAND_DELETE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_BRAND_TEMPLATES'
FROM api_endpoint e WHERE e.code = 'BRAND_ACTIVATE';

-- =============================================
-- MENU ENDPOINTS
-- =============================================
INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_MENU'
FROM api_endpoint e WHERE e.code = 'MENU_ALL';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_MENU'
FROM api_endpoint e WHERE e.code = 'MENU_CREATE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_MENU'
FROM api_endpoint e WHERE e.code = 'MENU_UPDATE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_MENU'
FROM api_endpoint e WHERE e.code = 'MENU_DELETE';

-- =============================================
-- USER/SECURITY ENDPOINTS
-- =============================================
INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_USERS'
FROM api_endpoint e WHERE e.code = 'USER_LIST';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_USERS'
FROM api_endpoint e WHERE e.code = 'USER_GET';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_USERS'
FROM api_endpoint e WHERE e.code = 'USER_CREATE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_USERS'
FROM api_endpoint e WHERE e.code = 'USER_UPDATE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_USERS'
FROM api_endpoint e WHERE e.code = 'USER_DELETE';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_ROLES'
FROM api_endpoint e WHERE e.code = 'ROLE_LIST';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_PERMISSIONS'
FROM api_endpoint e WHERE e.code = 'PERMISSION_LIST';

-- =============================================
-- MONITORING ENDPOINTS
-- =============================================
INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'SECURITY_AUDIT'
FROM api_endpoint e WHERE e.code = 'MONITORING_STATS';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'SECURITY_AUDIT'
FROM api_endpoint e WHERE e.code = 'MONITORING_LOGS';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'SECURITY_AUDIT'
FROM api_endpoint e WHERE e.code = 'MONITORING_DENIED';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'SECURITY_AUDIT'
FROM api_endpoint e WHERE e.code = 'MONITORING_TOP_USERS';

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'SECURITY_AUDIT'
FROM api_endpoint e WHERE e.code = 'MONITORING_TOP_ENDPOINTS';
