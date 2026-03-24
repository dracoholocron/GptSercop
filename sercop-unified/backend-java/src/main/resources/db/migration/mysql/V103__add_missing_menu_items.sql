-- =============================================================================
-- V103: Add Missing Menu Items
-- =============================================================================

-- =============================================
-- Add missing CATALOG items
-- =============================================

-- Exchange Rates
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_EXCHANGE_RATES', id, 'menu.catalogs.exchangeRates', 'TrendingUp', '/catalogs/exchange-rates', 74, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Bank Accounts
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_BANK_ACCOUNTS', id, 'menu.catalogs.bankAccounts', 'CreditCard', '/catalogs/bank-accounts', 75, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Custom Catalogs
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_CUSTOM', id, 'menu.catalogs.custom', 'Settings', '/catalogs/custom', 76, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Accounting Rules
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_ACCOUNTING_RULES', id, 'menu.catalogs.accountingRules', 'Calculator', '/catalogs/accounting-rules', 80, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Reference Numbers
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_REFERENCE_NUMBER', id, 'menu.catalogs.referenceNumber', 'Hash', '/catalogs/reference-number', 82, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Swift Fields
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_SWIFT_FIELDS', id, 'menu.catalogs.swiftFields', 'Code', '/catalogs/swift-fields', 83, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Event Types
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_EVENT_TYPES', id, 'menu.catalogs.eventTypes', 'Calendar', '/catalogs/event-types', 84, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Event Flows
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_EVENT_FLOWS', id, 'menu.catalogs.eventFlows', 'GitBranch', '/catalogs/event-flows', 85, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Swift Responses
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_SWIFT_RESPONSES', id, 'menu.catalogs.swiftResponses', 'MessageCircle', '/catalogs/swift-responses', 86, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- Product Types
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_PRODUCT_TYPES', id, 'menu.catalogs.productTypes', 'Package', '/catalogs/product-types', 87, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- =============================================
-- Add missing AI items
-- =============================================

-- Commissions Analysis
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'AI_COMMISSIONS', id, 'menu.ai.commissions', 'PieChart', '/ai-analysis/commissions', 82, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_AI';

-- Regulatory Reporting
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'AI_REGULATORY', id, 'menu.ai.regulatory', 'FileCheck', '/ai-analysis/regulatory-reporting', 83, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_AI';

-- =============================================
-- Add permissions for new catalog items
-- =============================================

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_EXCHANGE_RATES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_BANK_ACCOUNTS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_CUSTOM';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_ACCOUNTING_RULES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_REFERENCE_NUMBER';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_SWIFT_FIELDS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_EVENT_TYPES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_EVENT_FLOWS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_SWIFT_RESPONSES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_PRODUCT_TYPES';

-- =============================================
-- Add permissions for new AI items
-- =============================================

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_AI_ANALYTICS' FROM menu_item WHERE code = 'AI_COMMISSIONS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_AI_ANALYTICS' FROM menu_item WHERE code = 'AI_REGULATORY';

-- =============================================
-- Ensure ADMIN has VIEW_CATALOGS permission
-- =============================================

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_CATALOGS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_AI_ANALYTICS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_USERS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_ROLES' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'SECURITY_AUDIT' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_BRAND_TEMPLATES' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';
