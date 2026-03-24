-- =============================================================================
-- V109: Add Client Menu Items and New Roles
-- - Client menu options for LC Imports, LC Exports, Guarantees
-- - ROLE_CLIENT for external clients
-- - ROLE_SECURITY_OFFICER for security auditing
-- - ROLE_CATALOG_ADMIN for business catalog management
-- =============================================================================

-- ============================================
-- CLIENT MENU ITEMS
-- ============================================
SET @lc_import_parent = (SELECT id FROM menu_item WHERE code = 'SECTION_LC_IMPORT');
SET @lc_export_parent = (SELECT id FROM menu_item WHERE code = 'SECTION_LC_EXPORT');
SET @guarantee_parent = (SELECT id FROM menu_item WHERE code = 'SECTION_GUARANTEES');

INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES 
('LC_IMPORT_CLIENT', @lc_import_parent, 'menu.lcImport.client', 'User', '/lc-imports/issuance-client', 23, FALSE, TRUE, 'system'),
('LC_EXPORT_CLIENT', @lc_export_parent, 'menu.lcExport.client', 'User', '/lc-exports/issuance-client', 33, FALSE, TRUE, 'system'),
('GUARANTEES_CLIENT', @guarantee_parent, 'menu.guarantees.client', 'User', '/guarantees/issuance-client', 43, FALSE, TRUE, 'system');

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_IMPORT' FROM menu_item WHERE code = 'LC_IMPORT_CLIENT';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_EXPORT' FROM menu_item WHERE code = 'LC_EXPORT_CLIENT';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_GUARANTEE' FROM menu_item WHERE code = 'GUARANTEES_CLIENT';

-- ============================================
-- ROLE_CLIENT
-- ============================================
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CLIENT', 'Cliente con acceso a formularios de solicitud');

SET @client_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT');

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES 
(@client_role_id, 'CAN_VIEW_LC_IMPORT'),
(@client_role_id, 'CAN_VIEW_LC_EXPORT'),
(@client_role_id, 'CAN_VIEW_GUARANTEE'),
(@client_role_id, 'CAN_CREATE_LC_IMPORT'),
(@client_role_id, 'CAN_CREATE_LC_EXPORT'),
(@client_role_id, 'CAN_CREATE_GUARANTEE');

-- ============================================
-- ROLE_SECURITY_OFFICER
-- ============================================
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_SECURITY_OFFICER', 'Oficial de Seguridad con acceso a auditoría y monitoreo');

SET @security_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_SECURITY_OFFICER');

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES 
(@security_role_id, 'SECURITY_AUDIT'),
(@security_role_id, 'CAN_VIEW_AUDIT'),
(@security_role_id, 'CAN_EXPORT_AUDIT'),
(@security_role_id, 'VIEW_USERS'),
(@security_role_id, 'VIEW_ROLES'),
(@security_role_id, 'VIEW_PERMISSIONS');

-- ============================================
-- ROLE_CATALOG_ADMIN
-- ============================================
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CATALOG_ADMIN', 'Administrador de Catálogos de Negocio');

SET @catalog_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_CATALOG_ADMIN');

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
VALUES 
(@catalog_role_id, 'CAN_MANAGE_CATALOGS'),
(@catalog_role_id, 'MANAGE_CATALOGS'),
(@catalog_role_id, 'VIEW_CATALOGS'),
(@catalog_role_id, 'CAN_CONFIG_SWIFT'),
(@catalog_role_id, 'VIEW_SWIFT'),
(@catalog_role_id, 'MANAGE_BRAND_TEMPLATES'),
(@catalog_role_id, 'VIEW_BRAND_TEMPLATES');
