-- =============================================================================
-- V116: Add Email Configuration and Advanced Security Menu Items
-- - Email Providers, Queue, Actions under Administration
-- - Risk Engine under Security Configuration
-- - Permissions for ROLE_ADMIN and ROLE_MANAGER
-- =============================================================================

-- ============================================
-- GET PARENT SECTION IDS
-- ============================================
SET @admin_section = (SELECT id FROM menu_item WHERE code = 'SECTION_ADMIN' LIMIT 1);

-- ============================================
-- EMAIL CONFIGURATION MENU ITEMS
-- ============================================

-- Email Providers
INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('ADMIN_EMAIL_PROVIDERS', @admin_section, 'menu.admin.emailProviders', 'Mail', '/catalogs/email-providers', 40, FALSE, TRUE, 'system');

-- Email Queue
INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('ADMIN_EMAIL_QUEUE', @admin_section, 'menu.admin.emailQueue', 'Inbox', '/catalogs/email-queue', 41, FALSE, TRUE, 'system');

-- Email Actions
INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('ADMIN_EMAIL_ACTIONS', @admin_section, 'menu.admin.emailActions', 'Zap', '/catalogs/email-actions', 42, FALSE, TRUE, 'system');

-- ============================================
-- PERMISSIONS FOR EMAIL
-- ============================================

-- Create email permissions if they don't exist
INSERT IGNORE INTO permission_read_model (code, name, description, module)
VALUES
('MANAGE_EMAIL_PROVIDERS', 'Gestionar Proveedores de Email', 'Permite configurar proveedores SMTP, SendGrid, AWS SES', 'EMAIL'),
('VIEW_EMAIL_QUEUE', 'Ver Cola de Emails', 'Permite ver la cola de emails pendientes y enviados', 'EMAIL'),
('MANAGE_EMAIL_ACTIONS', 'Gestionar Acciones de Email', 'Permite configurar acciones automáticas de email', 'EMAIL');

-- Associate menu items with permissions
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'MANAGE_EMAIL_PROVIDERS' FROM menu_item WHERE code = 'ADMIN_EMAIL_PROVIDERS';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_EMAIL_QUEUE' FROM menu_item WHERE code = 'ADMIN_EMAIL_QUEUE';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'MANAGE_EMAIL_ACTIONS' FROM menu_item WHERE code = 'ADMIN_EMAIL_ACTIONS';

-- ============================================
-- GRANT EMAIL PERMISSIONS TO ADMIN AND MANAGER
-- ============================================

SET @admin_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_ADMIN' LIMIT 1);
SET @manager_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_MANAGER' LIMIT 1);

-- Admin gets all email permissions
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES
(@admin_role_id, 'MANAGE_EMAIL_PROVIDERS'),
(@admin_role_id, 'VIEW_EMAIL_QUEUE'),
(@admin_role_id, 'MANAGE_EMAIL_ACTIONS');

-- Manager gets email permissions too
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES
(@manager_role_id, 'MANAGE_EMAIL_PROVIDERS'),
(@manager_role_id, 'VIEW_EMAIL_QUEUE'),
(@manager_role_id, 'MANAGE_EMAIL_ACTIONS');

-- ============================================
-- GRANT SECURITY CONFIG PERMISSION TO MANAGER
-- ============================================

-- Manager should also see Security Configuration
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES (@manager_role_id, 'MANAGE_SECURITY_CONFIG');

-- ============================================
-- API ENDPOINTS FOR EMAIL
-- ============================================

-- Register API endpoints for email
INSERT IGNORE INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('EMAIL_PROVIDERS_LIST', 'GET', '/api/v1/admin/email/providers', 'List email providers', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_PROVIDERS_GET', 'GET', '/api/v1/admin/email/providers/*', 'Get email provider', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_PROVIDERS_CREATE', 'POST', '/api/v1/admin/email/providers', 'Create email provider', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_PROVIDERS_UPDATE', 'PUT', '/api/v1/admin/email/providers/*', 'Update email provider', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_PROVIDERS_DELETE', 'DELETE', '/api/v1/admin/email/providers/*', 'Delete email provider', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_QUEUE_LIST', 'GET', '/api/v1/admin/email/queue', 'List email queue', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_QUEUE_GET', 'GET', '/api/v1/admin/email/queue/*', 'Get email from queue', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_QUEUE_RETRY', 'POST', '/api/v1/admin/email/queue/*/retry', 'Retry failed email', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_ACTIONS_LIST', 'GET', '/api/v1/admin/email/actions', 'List email actions', 'EMAIL', FALSE, TRUE, 'system'),
('EMAIL_ACTIONS_UPDATE', 'PUT', '/api/v1/admin/email/actions/*', 'Update email action', 'EMAIL', FALSE, TRUE, 'system');

-- Associate endpoints with permissions
INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'MANAGE_EMAIL_PROVIDERS' FROM api_endpoint WHERE code IN ('EMAIL_PROVIDERS_LIST', 'EMAIL_PROVIDERS_GET', 'EMAIL_PROVIDERS_CREATE', 'EMAIL_PROVIDERS_UPDATE', 'EMAIL_PROVIDERS_DELETE');

INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'VIEW_EMAIL_QUEUE' FROM api_endpoint WHERE code IN ('EMAIL_QUEUE_LIST', 'EMAIL_QUEUE_GET', 'EMAIL_QUEUE_RETRY');

INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'MANAGE_EMAIL_ACTIONS' FROM api_endpoint WHERE code IN ('EMAIL_ACTIONS_LIST', 'EMAIL_ACTIONS_UPDATE');

-- Note: Translations are handled in frontend i18n config (src/i18n/config.ts)
