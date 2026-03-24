-- =============================================================================
-- V102: Complete Menu Structure - All Items with Permissions
-- =============================================================================
-- Every menu item must have at least one permission requirement
-- Users only see items they're authorized to access

-- Clear existing menu data
DELETE FROM menu_item_api_endpoint;
DELETE FROM menu_item_permission;
DELETE FROM menu_item;

-- =============================================
-- First: Add all necessary permissions
-- =============================================
INSERT IGNORE INTO permission_read_model (code, name, description, module) VALUES
    -- Workbox permissions
    ('VIEW_WORKBOX', 'Ver Bandeja de Trabajo', 'Acceso a la bandeja de trabajo', 'WORKBOX'),
    ('APPROVE_OPERATIONS', 'Aprobar Operaciones', 'Permite aprobar operaciones pendientes', 'WORKBOX'),
    -- Guarantees permissions
    ('CAN_VIEW_GUARANTEE', 'Ver Garantías', 'Permite ver garantías', 'GUARANTEE'),
    ('CAN_CREATE_GUARANTEE', 'Crear Garantías', 'Permite crear garantías', 'GUARANTEE'),
    ('CAN_EDIT_GUARANTEE', 'Editar Garantías', 'Permite editar garantías', 'GUARANTEE'),
    ('CAN_APPROVE_GUARANTEE', 'Aprobar Garantías', 'Permite aprobar garantías', 'GUARANTEE'),
    -- Collections permissions
    ('CAN_VIEW_COLLECTION', 'Ver Cobranzas', 'Permite ver cobranzas', 'COLLECTION'),
    ('CAN_CREATE_COLLECTION', 'Crear Cobranzas', 'Permite crear cobranzas', 'COLLECTION'),
    ('CAN_EDIT_COLLECTION', 'Editar Cobranzas', 'Permite editar cobranzas', 'COLLECTION'),
    -- Operations permissions
    ('VIEW_OPERATIONS', 'Ver Operaciones', 'Acceso a operaciones activas', 'OPERATIONS'),
    ('VIEW_SWIFT', 'Ver SWIFT', 'Acceso al centro de mensajes SWIFT', 'OPERATIONS'),
    ('VIEW_DOCUMENTS', 'Ver Documentos', 'Acceso a gestión documental', 'OPERATIONS'),
    -- Catalogs permissions
    ('VIEW_CATALOGS', 'Ver Catálogos', 'Acceso a catálogos del sistema', 'CATALOGS'),
    ('MANAGE_CATALOGS', 'Gestionar Catálogos', 'Permite editar catálogos', 'CATALOGS'),
    -- AI/Analytics permissions
    ('VIEW_AI_ANALYTICS', 'Ver IA y Analíticas', 'Acceso a herramientas de IA', 'AI'),
    ('VIEW_REPORTS', 'Ver Reportes', 'Acceso a generador de reportes', 'REPORTS');

-- Assign new permissions to ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' AND p.code IN (
    'VIEW_WORKBOX', 'APPROVE_OPERATIONS',
    'CAN_VIEW_GUARANTEE', 'CAN_CREATE_GUARANTEE', 'CAN_EDIT_GUARANTEE', 'CAN_APPROVE_GUARANTEE',
    'CAN_VIEW_COLLECTION', 'CAN_CREATE_COLLECTION', 'CAN_EDIT_COLLECTION',
    'VIEW_OPERATIONS', 'VIEW_SWIFT', 'VIEW_DOCUMENTS',
    'VIEW_CATALOGS', 'MANAGE_CATALOGS',
    'VIEW_AI_ANALYTICS', 'VIEW_REPORTS'
);

-- Assign operational permissions to OPERATOR
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_OPERATOR' AND p.code IN (
    'VIEW_WORKBOX',
    'CAN_VIEW_GUARANTEE', 'CAN_CREATE_GUARANTEE', 'CAN_EDIT_GUARANTEE',
    'CAN_VIEW_COLLECTION', 'CAN_CREATE_COLLECTION', 'CAN_EDIT_COLLECTION',
    'VIEW_OPERATIONS', 'VIEW_SWIFT', 'VIEW_DOCUMENTS',
    'VIEW_CATALOGS'
);

-- Assign view + approve to MANAGER
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_MANAGER' AND p.code IN (
    'VIEW_WORKBOX', 'APPROVE_OPERATIONS',
    'CAN_VIEW_GUARANTEE', 'CAN_CREATE_GUARANTEE', 'CAN_EDIT_GUARANTEE', 'CAN_APPROVE_GUARANTEE',
    'CAN_VIEW_COLLECTION', 'CAN_CREATE_COLLECTION', 'CAN_EDIT_COLLECTION',
    'VIEW_OPERATIONS', 'VIEW_SWIFT', 'VIEW_DOCUMENTS',
    'VIEW_CATALOGS', 'VIEW_AI_ANALYTICS', 'VIEW_REPORTS'
);

-- Basic view permissions to USER
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_USER' AND p.code IN (
    'VIEW_WORKBOX', 'VIEW_OPERATIONS'
);

-- =============================================
-- SECTION: WORKBOX
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_WORKBOX', NULL, 'menu.section.workbox', NULL, NULL, 1, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'WORKBOX_DRAFTS', id, 'menu.workbox.drafts', 'FileEdit', '/workbox/drafts', 11, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_WORKBOX';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'WORKBOX_PENDING', id, 'menu.workbox.pending', 'Clock', '/workbox/pending-approval', 12, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_WORKBOX';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'WORKBOX_LC_IMPORTS', id, 'menu.workbox.lcImports', 'FileInput', '/workbox/lc-imports', 13, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_WORKBOX';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'WORKBOX_LC_EXPORTS', id, 'menu.workbox.lcExports', 'FileOutput', '/workbox/lc-exports', 14, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_WORKBOX';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'WORKBOX_GUARANTEES', id, 'menu.workbox.guarantees', 'Shield', '/workbox/guarantees', 15, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_WORKBOX';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'WORKBOX_COLLECTIONS', id, 'menu.workbox.collections', 'Wallet', '/workbox/collections', 16, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_WORKBOX';

-- =============================================
-- SECTION: LC IMPORT
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_LC_IMPORT', NULL, 'menu.section.lcImport', NULL, NULL, 20, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_IMPORT_WIZARD', id, 'menu.lcImport.wizard', 'Wand', '/lc-imports/issuance-wizard', 21, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_IMPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_IMPORT_EXPERT', id, 'menu.lcImport.expert', 'Code', '/lc-imports/issuance-expert', 22, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_IMPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_IMPORT_AMENDMENT', id, 'menu.lcImport.amendment', 'Edit', '/lc-imports/amendment', 24, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_IMPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_IMPORT_NEGOTIATION', id, 'menu.lcImport.negotiation', 'Handshake', '/lc-imports/negotiation', 25, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_IMPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_IMPORT_PAYMENT', id, 'menu.lcImport.payment', 'CreditCard', '/lc-imports/payment', 26, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_IMPORT';

-- =============================================
-- SECTION: LC EXPORT
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_LC_EXPORT', NULL, 'menu.section.lcExport', NULL, NULL, 30, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_EXPORT_WIZARD', id, 'menu.lcExport.wizard', 'Wand', '/lc-exports/issuance-wizard', 31, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_EXPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_EXPORT_EXPERT', id, 'menu.lcExport.expert', 'Code', '/lc-exports/issuance-expert', 32, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_EXPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_EXPORT_AMENDMENT', id, 'menu.lcExport.amendment', 'Edit', '/lc-exports/amendment', 34, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_EXPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_EXPORT_NEGOTIATION', id, 'menu.lcExport.negotiation', 'Handshake', '/lc-exports/negotiation', 35, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_EXPORT';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'LC_EXPORT_PAYMENT', id, 'menu.lcExport.payment', 'CreditCard', '/lc-exports/payment', 36, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_LC_EXPORT';

-- =============================================
-- SECTION: GUARANTEES
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_GUARANTEES', NULL, 'menu.section.guarantees', NULL, NULL, 40, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GUARANTEES_WIZARD', id, 'menu.guarantees.wizard', 'Wand', '/guarantees/issuance-wizard', 41, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GUARANTEES';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GUARANTEES_EXPERT', id, 'menu.guarantees.expert', 'Code', '/guarantees/issuance-expert', 42, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GUARANTEES';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GUARANTEES_PAYMENT', id, 'menu.guarantees.payment', 'CreditCard', '/guarantees/payment', 44, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GUARANTEES';

-- =============================================
-- SECTION: COLLECTIONS
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_COLLECTIONS', NULL, 'menu.section.collections', NULL, NULL, 50, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'COLLECTIONS_WIZARD', id, 'menu.collections.wizard', 'Wand', '/collections/issuance-wizard', 51, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_COLLECTIONS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'COLLECTIONS_EXPERT', id, 'menu.collections.expert', 'Code', '/collections/issuance-expert', 52, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_COLLECTIONS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'COLLECTIONS_PAYMENT', id, 'menu.collections.paymentNotice', 'Receipt', '/collections/payment-notice', 53, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_COLLECTIONS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'COLLECTIONS_TRACKING', id, 'menu.collections.tracking', 'Search', '/collections/tracking', 57, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_COLLECTIONS';

-- =============================================
-- SECTION: OPERATIONS
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_OPERATIONS', NULL, 'menu.section.operations', NULL, NULL, 60, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'OPERATIONS_ACTIVE', id, 'menu.operations.active', 'Activity', '/operations/active', 61, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'OPERATIONS_AWAITING', id, 'menu.operations.awaiting', 'Clock', '/operations/awaiting-response', 62, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'OPERATIONS_HISTORY', id, 'menu.operations.history', 'History', '/operations/event-history', 63, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'SWIFT_CENTER', id, 'menu.operations.swiftCenter', 'MessageSquare', '/swift-message-center', 64, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'DOCUMENT_MGMT', id, 'menu.operations.documents', 'FolderOpen', '/document-management', 65, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_OPERATIONS';

-- =============================================
-- SECTION: CATALOGS
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_CATALOGS', NULL, 'menu.section.catalogs', NULL, NULL, 70, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_PARTICIPANTS', id, 'menu.catalogs.participants', 'Users', '/catalogs/participants', 71, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_FINANCIAL_INST', id, 'menu.catalogs.financialInst', 'Building', '/catalogs/financial-institutions', 72, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_CURRENCIES', id, 'menu.catalogs.currencies', 'DollarSign', '/catalogs/currencies', 73, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_TEMPLATES', id, 'menu.catalogs.templates', 'FileType', '/catalogs/templates', 77, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_EMAIL_TEMPLATES', id, 'menu.catalogs.emailTemplates', 'Mail', '/catalogs/email-templates', 78, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_COMMISSIONS', id, 'menu.catalogs.commissions', 'Percent', '/catalogs/commissions', 79, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_EVENT_RULES', id, 'menu.catalogs.eventRules', 'Zap', '/catalogs/event-rules', 81, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- =============================================
-- SECTION: AI & ANALYTICS
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_AI', NULL, 'menu.section.ai', NULL, NULL, 80, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'AI_ASSISTANT', id, 'menu.ai.assistant', 'Bot', '/ai-analysis/assistant', 81, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_AI';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'BUSINESS_INTEL', id, 'menu.ai.businessIntel', 'BarChart', '/business-intelligence', 84, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_AI';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'REPORTS', id, 'menu.ai.reports', 'FileText', '/reports', 85, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_AI';

-- =============================================
-- SECTION: ADMINISTRATION
-- =============================================
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_ADMIN', NULL, 'menu.section.admin', NULL, NULL, 90, TRUE, TRUE, 'system');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ADMIN_USERS', id, 'menu.admin.users', 'UserCog', '/users', 91, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ADMIN_PERMISSIONS', id, 'menu.admin.permissions', 'Key', '/permissions', 92, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ADMIN_SECURITY', id, 'menu.admin.security', 'ShieldCheck', '/security', 93, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ADMIN_BRAND', id, 'menu.admin.brand', 'Palette', '/catalogs/brand-templates', 94, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- =============================================
-- ALL MENU ITEM PERMISSIONS (Every item needs permission)
-- =============================================

-- WORKBOX permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_WORKBOX' FROM menu_item WHERE code = 'WORKBOX_DRAFTS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'APPROVE_OPERATIONS' FROM menu_item WHERE code = 'WORKBOX_PENDING';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_IMPORT' FROM menu_item WHERE code = 'WORKBOX_LC_IMPORTS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_EXPORT' FROM menu_item WHERE code = 'WORKBOX_LC_EXPORTS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_GUARANTEE' FROM menu_item WHERE code = 'WORKBOX_GUARANTEES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_COLLECTION' FROM menu_item WHERE code = 'WORKBOX_COLLECTIONS';

-- LC IMPORT permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_LC_IMPORT' FROM menu_item WHERE code = 'LC_IMPORT_WIZARD';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_LC_IMPORT' FROM menu_item WHERE code = 'LC_IMPORT_EXPERT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_EDIT_LC_IMPORT' FROM menu_item WHERE code = 'LC_IMPORT_AMENDMENT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_IMPORT' FROM menu_item WHERE code = 'LC_IMPORT_NEGOTIATION';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_IMPORT' FROM menu_item WHERE code = 'LC_IMPORT_PAYMENT';

-- LC EXPORT permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_LC_EXPORT' FROM menu_item WHERE code = 'LC_EXPORT_WIZARD';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_LC_EXPORT' FROM menu_item WHERE code = 'LC_EXPORT_EXPERT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_EDIT_LC_EXPORT' FROM menu_item WHERE code = 'LC_EXPORT_AMENDMENT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_EXPORT' FROM menu_item WHERE code = 'LC_EXPORT_NEGOTIATION';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_LC_EXPORT' FROM menu_item WHERE code = 'LC_EXPORT_PAYMENT';

-- GUARANTEES permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_GUARANTEE' FROM menu_item WHERE code = 'GUARANTEES_WIZARD';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_GUARANTEE' FROM menu_item WHERE code = 'GUARANTEES_EXPERT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_GUARANTEE' FROM menu_item WHERE code = 'GUARANTEES_PAYMENT';

-- COLLECTIONS permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_COLLECTION' FROM menu_item WHERE code = 'COLLECTIONS_WIZARD';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_CREATE_COLLECTION' FROM menu_item WHERE code = 'COLLECTIONS_EXPERT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_COLLECTION' FROM menu_item WHERE code = 'COLLECTIONS_PAYMENT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_COLLECTION' FROM menu_item WHERE code = 'COLLECTIONS_TRACKING';

-- OPERATIONS permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_OPERATIONS' FROM menu_item WHERE code = 'OPERATIONS_ACTIVE';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_OPERATIONS' FROM menu_item WHERE code = 'OPERATIONS_AWAITING';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_OPERATIONS' FROM menu_item WHERE code = 'OPERATIONS_HISTORY';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_SWIFT' FROM menu_item WHERE code = 'SWIFT_CENTER';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_DOCUMENTS' FROM menu_item WHERE code = 'DOCUMENT_MGMT';

-- CATALOGS permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_PARTICIPANTS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_FINANCIAL_INST';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_CURRENCIES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_TEMPLATES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_EMAIL_TEMPLATES';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_COMMISSIONS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_EVENT_RULES';

-- AI & REPORTS permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_AI_ANALYTICS' FROM menu_item WHERE code = 'AI_ASSISTANT';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_AI_ANALYTICS' FROM menu_item WHERE code = 'BUSINESS_INTEL';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_REPORTS' FROM menu_item WHERE code = 'REPORTS';

-- ADMIN permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_USERS' FROM menu_item WHERE code = 'ADMIN_USERS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_ROLES' FROM menu_item WHERE code = 'ADMIN_PERMISSIONS';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'SECURITY_AUDIT' FROM menu_item WHERE code = 'ADMIN_SECURITY';

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_BRAND_TEMPLATES' FROM menu_item WHERE code = 'ADMIN_BRAND';

-- =============================================
-- Update ADMIN to have ALL permissions
-- =============================================
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
CROSS JOIN permission_read_model p
WHERE r.name = 'ROLE_ADMIN';
