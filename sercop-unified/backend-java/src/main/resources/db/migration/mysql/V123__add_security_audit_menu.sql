-- =============================================================================
-- V123: Add Security Audit Menu Item
-- - Security Audit under Administration section
-- - Includes viewing audit logs, alerts, critical events, statistics
-- - Required for compliance: SOX, PCI-DSS, GDPR, Basel III
-- =============================================================================

-- ============================================
-- GET PARENT SECTION ID
-- ============================================
SET @admin_section = (SELECT id FROM menu_item WHERE code = 'SECTION_ADMIN' LIMIT 1);

-- ============================================
-- SECURITY AUDIT MENU ITEM
-- ============================================

-- Security Audit - Main menu item
INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('ADMIN_SECURITY_AUDIT', @admin_section, 'menu.admin.securityAudit', 'ShieldCheck', '/admin/security-audit', 50, FALSE, TRUE, 'system');

-- ============================================
-- PERMISSIONS FOR SECURITY AUDIT
-- ============================================

-- Create security audit permissions if they don't exist
INSERT IGNORE INTO permission_read_model (code, name, description, module)
VALUES
('VIEW_SECURITY_AUDIT', 'Ver Auditoría de Seguridad', 'Permite ver logs de auditoría, alertas y eventos críticos', 'SECURITY'),
('EXPORT_AUDIT_LOGS', 'Exportar Logs de Auditoría', 'Permite exportar logs de auditoría en CSV/JSON', 'SECURITY'),
('ACKNOWLEDGE_ALERTS', 'Reconocer Alertas de Seguridad', 'Permite marcar alertas como reconocidas', 'SECURITY');

-- Associate menu item with permission
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_SECURITY_AUDIT' FROM menu_item WHERE code = 'ADMIN_SECURITY_AUDIT';

-- ============================================
-- GRANT SECURITY AUDIT PERMISSIONS TO ADMIN AND MANAGER
-- ============================================

SET @admin_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_ADMIN' LIMIT 1);
SET @manager_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_MANAGER' LIMIT 1);

-- Admin gets all security audit permissions
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES
(@admin_role_id, 'VIEW_SECURITY_AUDIT'),
(@admin_role_id, 'EXPORT_AUDIT_LOGS'),
(@admin_role_id, 'ACKNOWLEDGE_ALERTS');

-- Manager gets view and export permissions
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES
(@manager_role_id, 'VIEW_SECURITY_AUDIT'),
(@manager_role_id, 'EXPORT_AUDIT_LOGS');

-- ============================================
-- API ENDPOINTS FOR SECURITY AUDIT
-- ============================================

-- Register API endpoints for security audit
INSERT IGNORE INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
('SECURITY_AUDIT_LIST', 'GET', '/api/v1/admin/security/audit-logs', 'List security audit logs', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_AUDIT_GET', 'GET', '/api/v1/admin/security/audit-logs/*', 'Get security audit log detail', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_AUDIT_EXPORT', 'GET', '/api/v1/admin/security/audit-logs/export', 'Export security audit logs', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_AUDIT_STATISTICS', 'GET', '/api/v1/admin/security/audit-logs/statistics', 'Get audit statistics', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_ALERTS_LIST', 'GET', '/api/v1/admin/security/alerts', 'List security alerts', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_ALERTS_ACKNOWLEDGE', 'POST', '/api/v1/admin/security/alerts/*/acknowledge', 'Acknowledge security alert', 'SECURITY', FALSE, TRUE, 'system'),
('SECURITY_CRITICAL_EVENTS', 'GET', '/api/v1/admin/security/critical-events', 'List critical security events', 'SECURITY', FALSE, TRUE, 'system');

-- Associate endpoints with permissions
INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'VIEW_SECURITY_AUDIT' FROM api_endpoint WHERE code IN ('SECURITY_AUDIT_LIST', 'SECURITY_AUDIT_GET', 'SECURITY_AUDIT_STATISTICS', 'SECURITY_ALERTS_LIST', 'SECURITY_CRITICAL_EVENTS');

INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'EXPORT_AUDIT_LOGS' FROM api_endpoint WHERE code = 'SECURITY_AUDIT_EXPORT';

INSERT IGNORE INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT id, 'ACKNOWLEDGE_ALERTS' FROM api_endpoint WHERE code = 'SECURITY_ALERTS_ACKNOWLEDGE';

-- Note: Translations are handled in frontend i18n config (src/i18n/config.ts)
