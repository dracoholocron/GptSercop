-- =============================================================================
-- V100: Populate Menu Items and Permissions
-- =============================================================================
-- Creates the menu structure with permission requirements

-- =============================================
-- MENU ITEMS - Main Navigation Structure
-- =============================================

-- Dashboard (visible to all authenticated users)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('DASHBOARD', NULL, 'menu.dashboard', 'Home', '/dashboard', 1, FALSE, TRUE, 'system');

-- =============================================
-- OPERATIONS SECTION
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_OPERATIONS', NULL, 'menu.section.operations', NULL, NULL, 10, TRUE, TRUE, 'system');

-- LC Import
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_IMPORT', id, 'menu.lc.import', 'FileText', '/lc/import', 11, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

-- LC Export  
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_EXPORT', id, 'menu.lc.export', 'FileOutput', '/lc/export', 12, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

-- Guarantees
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GUARANTEES', id, 'menu.guarantees', 'Shield', '/guarantees', 13, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

-- Collections
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'COLLECTIONS', id, 'menu.collections', 'Wallet', '/collections', 14, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

-- =============================================
-- CONFIGURATION SECTION
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_CONFIG', NULL, 'menu.section.configuration', NULL, NULL, 20, TRUE, TRUE, 'system');

-- Participants
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'PARTICIPANTS', id, 'menu.participants', 'Users', '/config/participants', 21, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CONFIG';

-- Financial Institutions
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'FINANCIAL_INSTITUTIONS', id, 'menu.financial.institutions', 'Building', '/config/financial-institutions', 22, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CONFIG';

-- Currencies
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CURRENCIES', id, 'menu.currencies', 'DollarSign', '/config/currencies', 23, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CONFIG';

-- Templates
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'TEMPLATES', id, 'menu.templates', 'FileType', '/config/templates', 24, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CONFIG';

-- =============================================
-- ADMINISTRATION SECTION
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_ADMIN', NULL, 'menu.section.administration', NULL, NULL, 30, TRUE, TRUE, 'system');

-- Users Management
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'USERS_ADMIN', id, 'menu.admin.users', 'UserCog', '/admin/users', 31, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- Roles & Permissions
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ROLES_PERMISSIONS', id, 'menu.admin.roles', 'Key', '/admin/roles', 32, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- Brand Templates
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'BRAND_TEMPLATES', id, 'menu.admin.brand', 'Palette', '/admin/brand-templates', 33, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- Menu Configuration
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'MENU_CONFIG', id, 'menu.admin.menu', 'Menu', '/admin/menu', 34, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- Security Monitoring
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'SECURITY_MONITORING', id, 'menu.admin.security', 'ShieldCheck', '/admin/security', 35, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- API Monitoring
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'API_MONITORING', id, 'menu.admin.api', 'Activity', '/admin/api-monitoring', 36, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- =============================================
-- MENU ITEM PERMISSIONS
-- =============================================

-- Dashboard - all authenticated users can see
-- (no permission required, just authentication)

-- LC Import requires CAN_VIEW_LC_IMPORT
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CAN_VIEW_LC_IMPORT'
FROM menu_item m WHERE m.code = 'LC_IMPORT';

-- LC Export requires CAN_VIEW_LC_EXPORT
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CAN_VIEW_LC_EXPORT'
FROM menu_item m WHERE m.code = 'LC_EXPORT';

-- Users Admin requires VIEW_USERS
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_USERS'
FROM menu_item m WHERE m.code = 'USERS_ADMIN';

-- Roles & Permissions requires VIEW_ROLES
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_ROLES'
FROM menu_item m WHERE m.code = 'ROLES_PERMISSIONS';

-- Brand Templates requires VIEW_BRAND_TEMPLATES
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_BRAND_TEMPLATES'
FROM menu_item m WHERE m.code = 'BRAND_TEMPLATES';

-- Menu Configuration requires VIEW_MENU
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_MENU'
FROM menu_item m WHERE m.code = 'MENU_CONFIG';

-- Security Monitoring requires SECURITY_AUDIT
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'SECURITY_AUDIT'
FROM menu_item m WHERE m.code = 'SECURITY_MONITORING';

-- API Monitoring requires SECURITY_AUDIT
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'SECURITY_AUDIT'
FROM menu_item m WHERE m.code = 'API_MONITORING';

-- =============================================
-- MENU ITEM API ENDPOINTS
-- =============================================

-- Brand Templates menu uses these APIs
INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'BRAND_TEMPLATES' AND e.code = 'BRAND_LIST';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'BRAND_TEMPLATES' AND e.code = 'BRAND_GET';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'BRAND_TEMPLATES' AND e.code = 'BRAND_CREATE';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'BRAND_TEMPLATES' AND e.code = 'BRAND_UPDATE';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'BRAND_TEMPLATES' AND e.code = 'BRAND_DELETE';

-- Users Admin menu uses these APIs
INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'USERS_ADMIN' AND e.code = 'USER_LIST';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'USERS_ADMIN' AND e.code = 'USER_GET';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'USERS_ADMIN' AND e.code = 'USER_CREATE';

-- Roles menu uses these APIs
INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'ROLES_PERMISSIONS' AND e.code = 'ROLE_LIST';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'ROLES_PERMISSIONS' AND e.code = 'PERMISSION_LIST';

-- Menu Config uses these APIs
INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'MENU_CONFIG' AND e.code = 'MENU_ALL';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'MENU_CONFIG' AND e.code = 'MENU_CREATE';

-- Security/API Monitoring uses these APIs
INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'SECURITY_MONITORING' AND e.code = 'MONITORING_STATS';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'SECURITY_MONITORING' AND e.code = 'MONITORING_LOGS';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'API_MONITORING' AND e.code = 'MONITORING_STATS';

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e 
WHERE m.code = 'API_MONITORING' AND e.code = 'MONITORING_TOP_ENDPOINTS';
