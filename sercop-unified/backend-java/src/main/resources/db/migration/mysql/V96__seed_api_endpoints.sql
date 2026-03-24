-- =============================================================================
-- V96: Seed initial API endpoints
-- =============================================================================
-- Initial configuration for API permission tracking

-- Auth endpoints (public)
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('AUTH_LOGIN', 'POST', '/api/auth/login', 'User login', 'AUTH', TRUE, TRUE, 'system'),
('AUTH_REGISTER', 'POST', '/api/auth/register', 'User registration', 'AUTH', TRUE, TRUE, 'system'),
('AUTH_REFRESH', 'POST', '/api/auth/refresh', 'Refresh token', 'AUTH', TRUE, TRUE, 'system'),
('AUTH_LOGOUT', 'POST', '/api/auth/logout', 'User logout', 'AUTH', FALSE, TRUE, 'system'),
('AUTH_ME', 'GET', '/api/auth/me', 'Get current user', 'AUTH', FALSE, TRUE, 'system');

-- Brand templates (partially public)
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('BRAND_ACTIVE', 'GET', '/api/brand-templates/active', 'Get active brand template', 'BRAND', TRUE, TRUE, 'system'),
('BRAND_LIST', 'GET', '/api/brand-templates', 'List brand templates', 'BRAND', FALSE, TRUE, 'system'),
('BRAND_GET', 'GET', '/api/brand-templates/*', 'Get brand template by ID', 'BRAND', FALSE, TRUE, 'system'),
('BRAND_CREATE', 'POST', '/api/brand-templates', 'Create brand template', 'BRAND', FALSE, TRUE, 'system'),
('BRAND_UPDATE', 'PUT', '/api/brand-templates/*', 'Update brand template', 'BRAND', FALSE, TRUE, 'system'),
('BRAND_DELETE', 'DELETE', '/api/brand-templates/*', 'Delete brand template', 'BRAND', FALSE, TRUE, 'system'),
('BRAND_ACTIVATE', 'POST', '/api/brand-templates/*/activate', 'Activate brand template', 'BRAND', FALSE, TRUE, 'system');

-- Menu configuration
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('MENU_USER', 'GET', '/api/menu/user', 'Get user menu', 'MENU', FALSE, TRUE, 'system'),
('MENU_ALL', 'GET', '/api/menu/all', 'Get all menu items', 'MENU', FALSE, TRUE, 'system'),
('MENU_CREATE', 'POST', '/api/menu', 'Create menu item', 'MENU', FALSE, TRUE, 'system'),
('MENU_UPDATE', 'PUT', '/api/menu/*', 'Update menu item', 'MENU', FALSE, TRUE, 'system'),
('MENU_DELETE', 'DELETE', '/api/menu/*', 'Delete menu item', 'MENU', FALSE, TRUE, 'system');

-- Security / Users
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('USER_LIST', 'GET', '/api/users', 'List users', 'SECURITY', FALSE, TRUE, 'system'),
('USER_GET', 'GET', '/api/users/*', 'Get user by ID', 'SECURITY', FALSE, TRUE, 'system'),
('USER_CREATE', 'POST', '/api/users', 'Create user', 'SECURITY', FALSE, TRUE, 'system'),
('USER_UPDATE', 'PUT', '/api/users/*', 'Update user', 'SECURITY', FALSE, TRUE, 'system'),
('USER_DELETE', 'DELETE', '/api/users/*', 'Delete user', 'SECURITY', FALSE, TRUE, 'system'),
('ROLE_LIST', 'GET', '/api/roles', 'List roles', 'SECURITY', FALSE, TRUE, 'system'),
('PERMISSION_LIST', 'GET', '/api/permissions', 'List permissions', 'SECURITY', FALSE, TRUE, 'system');

-- Monitoring
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('MONITORING_STATS', 'GET', '/api/monitoring/stats', 'Get API statistics', 'MONITORING', FALSE, TRUE, 'system'),
('MONITORING_LOGS', 'GET', '/api/monitoring/logs', 'Get API access logs', 'MONITORING', FALSE, TRUE, 'system'),
('MONITORING_DENIED', 'GET', '/api/monitoring/logs/denied', 'Get denied access logs', 'MONITORING', FALSE, TRUE, 'system'),
('MONITORING_TOP_USERS', 'GET', '/api/monitoring/top-users', 'Get top users by API usage', 'MONITORING', FALSE, TRUE, 'system'),
('MONITORING_TOP_ENDPOINTS', 'GET', '/api/monitoring/top-endpoints', 'Get top accessed endpoints', 'MONITORING', FALSE, TRUE, 'system');

-- Actuator (public health)
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('ACTUATOR_HEALTH', 'GET', '/api/actuator/health', 'Health check', 'SYSTEM', TRUE, TRUE, 'system'),
('ACTUATOR_HEALTH_DETAIL', 'GET', '/api/actuator/health/**', 'Health check details', 'SYSTEM', TRUE, TRUE, 'system');
