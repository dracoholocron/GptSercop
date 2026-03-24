-- =============================================================================
-- Migration V181: Client Portal - Custom Fields Configuration
-- Configures form fields for client portal request wizards (Guarantee, LC, Collection)
-- Uses existing custom fields framework - reuses tables from V169
-- =============================================================================

-- ============================================
-- 1. GUARANTEE REQUEST CUSTOM FIELDS
-- ============================================

-- Step 1: General Information
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_GB_GENERAL', 'clientPortal.guarantee.step.general', 'clientPortal.guarantee.step.general.desc', 'CLIENT_GUARANTEE_REQUEST',
 1, 'FiInfo', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @gb_general_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_GB_GENERAL' AND product_type = 'CLIENT_GUARANTEE_REQUEST');

-- Section: Guarantee Type and Amount
INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'GB_TYPE_AMOUNT', 'clientPortal.guarantee.section.typeAmount', @gb_general_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @gb_type_amount_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'GB_TYPE_AMOUNT' AND step_id = @gb_general_step_id);

-- Fields for Type and Amount
INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules, default_value,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('GUARANTEE_TYPE', 'field.guaranteeType', @gb_type_amount_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'GUARANTEE_TYPES', 1, 1,
 TRUE, '{"required": true}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('AMOUNT', 'field.amount', @gb_type_amount_section_id, 'NUMBER', 'CURRENCY_AMOUNT',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "min": 1000, "max": 10000000}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('CURRENCY', 'field.currency', @gb_type_amount_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'CURRENCIES', 3, 1,
 TRUE, '{"required": true}', 'USD',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('ISSUE_DATE', 'field.issueDate', @gb_type_amount_section_id, 'DATE', 'DATE_PICKER',
 NULL, NULL, 4, 1,
 TRUE, '{"required": true, "minDate": "today"}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('EXPIRY_DATE', 'field.expiryDate', @gb_type_amount_section_id, 'DATE', 'DATE_PICKER',
 NULL, NULL, 5, 1,
 TRUE, '{"required": true, "minDateField": "ISSUE_DATE"}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('PURPOSE', 'field.purpose', @gb_type_amount_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, 6, 2,
 TRUE, '{"required": true, "maxLength": 500}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 2: Beneficiary Information
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_GB_BENEFICIARY', 'clientPortal.guarantee.step.beneficiary', 'clientPortal.guarantee.step.beneficiary.desc', 'CLIENT_GUARANTEE_REQUEST',
 2, 'FiUser', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @gb_beneficiary_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_GB_BENEFICIARY' AND product_type = 'CLIENT_GUARANTEE_REQUEST');

-- Section: Beneficiary Details
INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'GB_BENEFICIARY', 'clientPortal.guarantee.section.beneficiary', @gb_beneficiary_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @gb_beneficiary_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'GB_BENEFICIARY' AND step_id = @gb_beneficiary_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules, default_value,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('BENEFICIARY_NAME', 'field.beneficiaryName', @gb_beneficiary_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 1, 2,
 TRUE, '{"required": true, "maxLength": 200}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('BENEFICIARY_ID_TYPE', 'field.beneficiaryIdType', @gb_beneficiary_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'ID_TYPES', 2, 1,
 TRUE, '{"required": true}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('BENEFICIARY_ID_NUMBER', 'field.beneficiaryIdNumber', @gb_beneficiary_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 3, 1,
 TRUE, '{"required": true, "maxLength": 30}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('BENEFICIARY_COUNTRY', 'field.beneficiaryCountry', @gb_beneficiary_section_id, 'SELECT', 'COUNTRY_SELECT',
 'CATALOG', 'COUNTRIES', 4, 1,
 TRUE, '{"required": true}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('BENEFICIARY_ADDRESS', 'field.beneficiaryAddress', @gb_beneficiary_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, 5, 2,
 TRUE, '{"required": true, "maxLength": 500}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('BENEFICIARY_EMAIL', 'field.beneficiaryEmail', @gb_beneficiary_section_id, 'TEXT', 'EMAIL',
 NULL, NULL, 6, 1,
 FALSE, '{"pattern": "email"}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('BENEFICIARY_PHONE', 'field.beneficiaryPhone', @gb_beneficiary_section_id, 'TEXT', 'PHONE',
 NULL, NULL, 7, 1,
 FALSE, NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 3: Guarantee Text
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_GB_TEXT', 'clientPortal.guarantee.step.text', 'clientPortal.guarantee.step.text.desc', 'CLIENT_GUARANTEE_REQUEST',
 3, 'FiFileText', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @gb_text_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_GB_TEXT' AND product_type = 'CLIENT_GUARANTEE_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'GB_TEXT', 'clientPortal.guarantee.section.text', @gb_text_step_id, 'SINGLE',
 1, 1, FALSE, TRUE, TRUE, TRUE, 'system');

SET @gb_text_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'GB_TEXT' AND step_id = @gb_text_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    display_order, span_columns, is_required, validation_rules,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('GUARANTEE_TEXT', 'field.guaranteeText', @gb_text_section_id, 'TEXT', 'MULTILINE_TEXT',
 1, 1, TRUE, '{"required": true, "maxLength": 10000, "rows": 15}',
 TRUE, TRUE, TRUE, 'system'),

('SPECIAL_CONDITIONS', 'field.specialConditions', @gb_text_section_id, 'TEXT', 'MULTILINE_TEXT',
 2, 1, FALSE, '{"maxLength": 2000, "rows": 5}',
 TRUE, TRUE, TRUE, 'system');

-- Step 4: Documents
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_GB_DOCUMENTS', 'clientPortal.guarantee.step.documents', 'clientPortal.guarantee.step.documents.desc', 'CLIENT_GUARANTEE_REQUEST',
 4, 'FiUpload', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @gb_docs_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_GB_DOCUMENTS' AND product_type = 'CLIENT_GUARANTEE_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type, min_rows, max_rows,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'GB_DOCUMENTS', 'clientPortal.guarantee.section.documents', @gb_docs_step_id, 'REPEATABLE', 1, 10,
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @gb_docs_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'GB_DOCUMENTS' AND step_id = @gb_docs_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('DOC_TYPE', 'field.documentType', @gb_docs_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'DOCUMENT_TYPES_GUARANTEE', 1, 1,
 TRUE, '{"required": true}',
 TRUE, TRUE, TRUE, 'system'),

('DOC_FILE', 'field.documentFile', @gb_docs_section_id, 'FILE', 'FILE_UPLOAD',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "accept": ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png", "maxSize": 10485760}',
 TRUE, TRUE, TRUE, 'system'),

('DOC_DESCRIPTION', 'field.documentDescription', @gb_docs_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 3, 2,
 FALSE, '{"maxLength": 200}',
 TRUE, TRUE, TRUE, 'system');

-- Step 5: Review and Submit
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_GB_REVIEW', 'clientPortal.guarantee.step.review', 'clientPortal.guarantee.step.review.desc', 'CLIENT_GUARANTEE_REQUEST',
 5, 'FiCheckCircle', TRUE, FALSE, FALSE, 'SEPARATE_STEP', TRUE, 'system');

-- ============================================
-- 2. LC IMPORT REQUEST CUSTOM FIELDS
-- ============================================

-- Step 1: LC Conditions
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LC_CONDITIONS', 'clientPortal.lcImport.step.conditions', 'clientPortal.lcImport.step.conditions.desc', 'CLIENT_LC_IMPORT_REQUEST',
 1, 'FiFileText', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lc_conditions_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LC_CONDITIONS' AND product_type = 'CLIENT_LC_IMPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LC_CONDITIONS', 'clientPortal.lcImport.section.conditions', @lc_conditions_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lc_conditions_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LC_CONDITIONS' AND step_id = @lc_conditions_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules, default_value, field_options,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('LC_TYPE', 'field.lcType', @lc_conditions_section_id, 'SELECT', 'SELECT',
 NULL, NULL, 1, 1,
 TRUE, '{"required": true}', 'IRREVOCABLE',
 '[{"value": "IRREVOCABLE", "labelKey": "option.irrevocable"}, {"value": "REVOCABLE", "labelKey": "option.revocable"}]',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LC_AMOUNT', 'field.lcAmount', @lc_conditions_section_id, 'NUMBER', 'CURRENCY_AMOUNT',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "min": 5000, "max": 50000000}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LC_CURRENCY', 'field.lcCurrency', @lc_conditions_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'CURRENCIES', 3, 1,
 TRUE, '{"required": true}', 'USD', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('PAYMENT_TYPE', 'field.paymentType', @lc_conditions_section_id, 'SELECT', 'SELECT',
 NULL, NULL, 4, 1,
 TRUE, '{"required": true}', 'SIGHT',
 '[{"value": "SIGHT", "labelKey": "option.sight"}, {"value": "DEFERRED", "labelKey": "option.deferred"}, {"value": "ACCEPTANCE", "labelKey": "option.acceptance"}, {"value": "NEGOTIATION", "labelKey": "option.negotiation"}]',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('PAYMENT_TERM_DAYS', 'field.paymentTermDays', @lc_conditions_section_id, 'NUMBER', 'NUMBER_INPUT',
 NULL, NULL, 5, 1,
 FALSE, '{"min": 1, "max": 360}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LC_EXPIRY_DATE', 'field.lcExpiryDate', @lc_conditions_section_id, 'DATE', 'DATE_PICKER',
 NULL, NULL, 6, 1,
 TRUE, '{"required": true, "minDate": "today"}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LATEST_SHIPMENT_DATE', 'field.latestShipmentDate', @lc_conditions_section_id, 'DATE', 'DATE_PICKER',
 NULL, NULL, 7, 1,
 TRUE, '{"required": true, "minDate": "today"}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('TOLERANCE_PERCENTAGE', 'field.tolerancePercentage', @lc_conditions_section_id, 'NUMBER', 'PERCENTAGE',
 NULL, NULL, 8, 1,
 FALSE, '{"min": 0, "max": 10, "decimals": 2}', '5', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 2: Beneficiary (Supplier)
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LC_BENEFICIARY', 'clientPortal.lcImport.step.beneficiary', 'clientPortal.lcImport.step.beneficiary.desc', 'CLIENT_LC_IMPORT_REQUEST',
 2, 'FiUser', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lc_beneficiary_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LC_BENEFICIARY' AND product_type = 'CLIENT_LC_IMPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LC_BENEFICIARY', 'clientPortal.lcImport.section.beneficiary', @lc_beneficiary_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lc_beneficiary_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LC_BENEFICIARY' AND step_id = @lc_beneficiary_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('LC_BENEFICIARY_NAME', 'field.beneficiaryName', @lc_beneficiary_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 1, 2,
 TRUE, '{"required": true, "maxLength": 200}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LC_BENEFICIARY_COUNTRY', 'field.beneficiaryCountry', @lc_beneficiary_section_id, 'SELECT', 'COUNTRY_SELECT',
 'CATALOG', 'COUNTRIES', 2, 1,
 TRUE, '{"required": true}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LC_BENEFICIARY_ADDRESS', 'field.beneficiaryAddress', @lc_beneficiary_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, 3, 2,
 TRUE, '{"required": true, "maxLength": 500}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('ADVISING_BANK', 'field.advisingBank', @lc_beneficiary_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 4, 1,
 FALSE, '{"maxLength": 200}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('ADVISING_BANK_SWIFT', 'field.advisingBankSwift', @lc_beneficiary_section_id, 'TEXT', 'SWIFT_CODE',
 NULL, NULL, 5, 1,
 FALSE, '{"pattern": "swift"}',
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 3: Shipment Details
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LC_SHIPMENT', 'clientPortal.lcImport.step.shipment', 'clientPortal.lcImport.step.shipment.desc', 'CLIENT_LC_IMPORT_REQUEST',
 3, 'FiTruck', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lc_shipment_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LC_SHIPMENT' AND product_type = 'CLIENT_LC_IMPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LC_SHIPMENT', 'clientPortal.lcImport.section.shipment', @lc_shipment_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lc_shipment_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LC_SHIPMENT' AND step_id = @lc_shipment_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules, field_options,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('PORT_LOADING', 'field.portLoading', @lc_shipment_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 1, 1,
 TRUE, '{"required": true, "maxLength": 100}', NULL,
 TRUE, TRUE, TRUE, 'system'),

('PORT_DISCHARGE', 'field.portDischarge', @lc_shipment_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "maxLength": 100}', NULL,
 TRUE, TRUE, TRUE, 'system'),

('INCOTERM', 'field.incoterm', @lc_shipment_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'INCOTERMS', 3, 1,
 TRUE, '{"required": true}', NULL,
 TRUE, TRUE, TRUE, 'system'),

('PARTIAL_SHIPMENTS', 'field.partialShipments', @lc_shipment_section_id, 'SELECT', 'SELECT',
 NULL, NULL, 4, 1,
 TRUE, '{"required": true}',
 '[{"value": "ALLOWED", "labelKey": "option.allowed"}, {"value": "NOT_ALLOWED", "labelKey": "option.notAllowed"}]',
 TRUE, TRUE, TRUE, 'system'),

('TRANSSHIPMENT', 'field.transshipment', @lc_shipment_section_id, 'SELECT', 'SELECT',
 NULL, NULL, 5, 1,
 TRUE, '{"required": true}',
 '[{"value": "ALLOWED", "labelKey": "option.allowed"}, {"value": "NOT_ALLOWED", "labelKey": "option.notAllowed"}]',
 TRUE, TRUE, TRUE, 'system');

-- Step 4: Goods Description
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LC_GOODS', 'clientPortal.lcImport.step.goods', 'clientPortal.lcImport.step.goods.desc', 'CLIENT_LC_IMPORT_REQUEST',
 4, 'FiPackage', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lc_goods_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LC_GOODS' AND product_type = 'CLIENT_LC_IMPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LC_GOODS', 'clientPortal.lcImport.section.goods', @lc_goods_step_id, 'SINGLE',
 1, 1, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lc_goods_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LC_GOODS' AND step_id = @lc_goods_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    display_order, span_columns, is_required, validation_rules,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('GOODS_DESCRIPTION', 'field.goodsDescription', @lc_goods_section_id, 'TEXT', 'MULTILINE_TEXT',
 1, 1, TRUE, '{"required": true, "maxLength": 5000, "rows": 10}',
 TRUE, TRUE, TRUE, 'system'),

('HS_CODE', 'field.hsCode', @lc_goods_section_id, 'TEXT', 'TEXT_INPUT',
 2, 1, FALSE, '{"maxLength": 20}',
 TRUE, TRUE, TRUE, 'system');

-- Step 5: Documents Required
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LC_DOCUMENTS', 'clientPortal.lcImport.step.documents', 'clientPortal.lcImport.step.documents.desc', 'CLIENT_LC_IMPORT_REQUEST',
 5, 'FiUpload', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lc_docs_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LC_DOCUMENTS' AND product_type = 'CLIENT_LC_IMPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type, min_rows, max_rows,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LC_DOCUMENTS', 'clientPortal.lcImport.section.documents', @lc_docs_step_id, 'REPEATABLE', 2, 15,
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lc_docs_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LC_DOCUMENTS' AND step_id = @lc_docs_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('LC_DOC_TYPE', 'field.documentType', @lc_docs_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'DOCUMENT_TYPES_LC', 1, 1,
 TRUE, '{"required": true}',
 TRUE, TRUE, TRUE, 'system'),

('LC_DOC_FILE', 'field.documentFile', @lc_docs_section_id, 'FILE', 'FILE_UPLOAD',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "accept": ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png", "maxSize": 10485760}',
 TRUE, TRUE, TRUE, 'system');

-- Step 6: Review
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LC_REVIEW', 'clientPortal.lcImport.step.review', 'clientPortal.lcImport.step.review.desc', 'CLIENT_LC_IMPORT_REQUEST',
 6, 'FiCheckCircle', TRUE, FALSE, FALSE, 'SEPARATE_STEP', TRUE, 'system');

-- ============================================
-- 3. COLLECTION REQUEST CUSTOM FIELDS
-- ============================================

-- Step 1: Collection Type
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_COL_TYPE', 'clientPortal.collection.step.type', 'clientPortal.collection.step.type.desc', 'CLIENT_COLLECTION_REQUEST',
 1, 'FiDollarSign', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @col_type_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_COL_TYPE' AND product_type = 'CLIENT_COLLECTION_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'COL_TYPE', 'clientPortal.collection.section.type', @col_type_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @col_type_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'COL_TYPE' AND step_id = @col_type_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    display_order, span_columns, is_required, validation_rules, field_options,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('COLLECTION_TYPE', 'field.collectionType', @col_type_section_id, 'SELECT', 'SELECT',
 1, 1, TRUE, '{"required": true}',
 '[{"value": "DOCUMENTARY", "labelKey": "option.documentary"}, {"value": "CLEAN", "labelKey": "option.clean"}]',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('INSTRUCTION_TYPE', 'field.instructionType', @col_type_section_id, 'SELECT', 'SELECT',
 2, 1, TRUE, '{"required": true}',
 '[{"value": "D/P", "labelKey": "option.documentsAgainstPayment"}, {"value": "D/A", "labelKey": "option.documentsAgainstAcceptance"}]',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('COL_AMOUNT', 'field.collectionAmount', @col_type_section_id, 'NUMBER', 'CURRENCY_AMOUNT',
 3, 1, TRUE, '{"required": true, "min": 1000, "max": 10000000}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('COL_CURRENCY', 'field.collectionCurrency', @col_type_section_id, 'SELECT', 'CATALOG_LISTBOX',
 4, 1, TRUE, '{"required": true}', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 2: Drawee (Importer)
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_COL_DRAWEE', 'clientPortal.collection.step.drawee', 'clientPortal.collection.step.drawee.desc', 'CLIENT_COLLECTION_REQUEST',
 2, 'FiUser', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @col_drawee_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_COL_DRAWEE' AND product_type = 'CLIENT_COLLECTION_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'COL_DRAWEE', 'clientPortal.collection.section.drawee', @col_drawee_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @col_drawee_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'COL_DRAWEE' AND step_id = @col_drawee_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('DRAWEE_NAME', 'field.draweeName', @col_drawee_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 1, 2,
 TRUE, '{"required": true, "maxLength": 200}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('DRAWEE_COUNTRY', 'field.draweeCountry', @col_drawee_section_id, 'SELECT', 'COUNTRY_SELECT',
 'CATALOG', 'COUNTRIES', 2, 1,
 TRUE, '{"required": true}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('DRAWEE_ADDRESS', 'field.draweeAddress', @col_drawee_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, 3, 2,
 TRUE, '{"required": true, "maxLength": 500}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('COLLECTING_BANK', 'field.collectingBank', @col_drawee_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 4, 1,
 FALSE, '{"maxLength": 200}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('COLLECTING_BANK_SWIFT', 'field.collectingBankSwift', @col_drawee_section_id, 'TEXT', 'SWIFT_CODE',
 NULL, NULL, 5, 1,
 FALSE, '{"pattern": "swift"}',
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 3: Instructions
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_COL_INSTRUCTIONS', 'clientPortal.collection.step.instructions', 'clientPortal.collection.step.instructions.desc', 'CLIENT_COLLECTION_REQUEST',
 3, 'FiList', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @col_instructions_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_COL_INSTRUCTIONS' AND product_type = 'CLIENT_COLLECTION_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'COL_INSTRUCTIONS', 'clientPortal.collection.section.instructions', @col_instructions_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @col_instructions_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'COL_INSTRUCTIONS' AND step_id = @col_instructions_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    display_order, span_columns, is_required, field_options,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('PROTEST_NON_PAYMENT', 'field.protestNonPayment', @col_instructions_section_id, 'BOOLEAN', 'CHECKBOX',
 1, 1, FALSE, NULL,
 TRUE, TRUE, TRUE, 'system'),

('PROTEST_NON_ACCEPTANCE', 'field.protestNonAcceptance', @col_instructions_section_id, 'BOOLEAN', 'CHECKBOX',
 2, 1, FALSE, NULL,
 TRUE, TRUE, TRUE, 'system'),

('CHARGES_ACCOUNT', 'field.chargesAccount', @col_instructions_section_id, 'SELECT', 'SELECT',
 3, 1, TRUE,
 '[{"value": "DRAWEE", "labelKey": "option.drawee"}, {"value": "PRINCIPAL", "labelKey": "option.principal"}]',
 TRUE, TRUE, TRUE, 'system'),

('SPECIAL_INSTRUCTIONS', 'field.specialInstructions', @col_instructions_section_id, 'TEXT', 'MULTILINE_TEXT',
 4, 2, FALSE, NULL,
 TRUE, TRUE, TRUE, 'system');

-- Step 4: Documents
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_COL_DOCUMENTS', 'clientPortal.collection.step.documents', 'clientPortal.collection.step.documents.desc', 'CLIENT_COLLECTION_REQUEST',
 4, 'FiUpload', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @col_docs_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_COL_DOCUMENTS' AND product_type = 'CLIENT_COLLECTION_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type, min_rows, max_rows,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'COL_DOCUMENTS', 'clientPortal.collection.section.documents', @col_docs_step_id, 'REPEATABLE', 2, 10,
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @col_docs_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'COL_DOCUMENTS' AND step_id = @col_docs_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('COL_DOC_TYPE', 'field.documentType', @col_docs_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'DOCUMENT_TYPES_COLLECTION', 1, 1,
 TRUE, '{"required": true}',
 TRUE, TRUE, TRUE, 'system'),

('COL_DOC_FILE', 'field.documentFile', @col_docs_section_id, 'FILE', 'FILE_UPLOAD',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "accept": ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png", "maxSize": 10485760}',
 TRUE, TRUE, TRUE, 'system');

-- Step 5: Review
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_COL_REVIEW', 'clientPortal.collection.step.review', 'clientPortal.collection.step.review.desc', 'CLIENT_COLLECTION_REQUEST',
 5, 'FiCheckCircle', TRUE, FALSE, FALSE, 'SEPARATE_STEP', TRUE, 'system');
