-- =============================================================================
-- V112: Add Security Configuration Menu Item
-- - Security Configuration option under Administration
-- - Permission for ROLE_ADMIN
-- =============================================================================

-- ============================================
-- SECURITY CONFIGURATION MENU ITEM
-- ============================================

-- Get the Administration section parent ID
SET @admin_section = (SELECT id FROM menu_item WHERE code = 'SECTION_ADMIN' LIMIT 1);

-- Insert Security Configuration menu item
INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES
('ADMIN_SECURITY_CONFIG', @admin_section, 'menu.admin.securityConfig', 'Shield', '/admin/security-configuration', 99, FALSE, TRUE, 'system');

-- ============================================
-- PERMISSION FOR SECURITY CONFIGURATION
-- ============================================

-- Create the permission if it doesn't exist
INSERT IGNORE INTO permission_read_model (code, name, description, module)
VALUES ('MANAGE_SECURITY_CONFIG', 'Gestionar Configuración de Seguridad', 'Permite configurar autenticación, autorización y auditoría', 'SECURITY');

-- Associate menu item with the permission
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'MANAGE_SECURITY_CONFIG' FROM menu_item WHERE code = 'ADMIN_SECURITY_CONFIG';

-- ============================================
-- GRANT PERMISSION TO ADMIN ROLE
-- ============================================

SET @admin_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_ADMIN' LIMIT 1);

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES
(@admin_role_id, 'MANAGE_SECURITY_CONFIG');

-- ============================================
-- API ENDPOINTS FOR SECURITY CONFIGURATION
-- ============================================

-- Register API endpoints for security configuration
INSERT IGNORE INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('SECURITY_CONFIG_GET', 'GET', '/api/v1/admin/security-configuration/**', 'Get security configuration', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_CONFIG_PUT', 'PUT', '/api/v1/admin/security-configuration/**', 'Update security configuration', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_CONFIG_POST', 'POST', '/api/v1/admin/security-configuration/**', 'Create security configuration', 'SECURITY', FALSE, TRUE, 'system');

-- Associate endpoints with permission
INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'MANAGE_SECURITY_CONFIG' FROM api_endpoint WHERE code = 'SECURITY_CONFIG_GET';

INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'MANAGE_SECURITY_CONFIG' FROM api_endpoint WHERE code = 'SECURITY_CONFIG_PUT';

INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'MANAGE_SECURITY_CONFIG' FROM api_endpoint WHERE code = 'SECURITY_CONFIG_POST';
