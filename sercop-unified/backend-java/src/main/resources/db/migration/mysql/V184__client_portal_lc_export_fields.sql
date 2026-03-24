-- =============================================================================
-- Migration V182: Client Portal - LC Export Custom Fields Configuration
-- Configures form fields for LC Export request wizard
-- =============================================================================

-- ============================================
-- LC EXPORT REQUEST CUSTOM FIELDS
-- ============================================

-- Step 1: LC Conditions
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LCE_CONDITIONS', 'clientPortal.lcExport.step.conditions', 'clientPortal.lcExport.step.conditions.desc', 'CLIENT_LC_EXPORT_REQUEST',
 1, 'FiFileText', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lce_conditions_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LCE_CONDITIONS' AND product_type = 'CLIENT_LC_EXPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LCE_CONDITIONS', 'clientPortal.lcExport.section.conditions', @lce_conditions_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lce_conditions_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LCE_CONDITIONS' AND step_id = @lce_conditions_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules, default_value, field_options,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('LCE_REFERENCE', 'field.lcReference', @lce_conditions_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 1, 1,
 TRUE, '{"required": true, "maxLength": 50}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_ISSUING_BANK', 'field.issuingBank', @lce_conditions_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "maxLength": 200}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_ISSUING_BANK_SWIFT', 'field.issuingBankSwift', @lce_conditions_section_id, 'TEXT', 'SWIFT_CODE',
 NULL, NULL, 3, 1,
 FALSE, '{"pattern": "swift"}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_AMOUNT', 'field.lcAmount', @lce_conditions_section_id, 'NUMBER', 'CURRENCY_AMOUNT',
 NULL, NULL, 4, 1,
 TRUE, '{"required": true, "min": 5000, "max": 50000000}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_CURRENCY', 'field.lcCurrency', @lce_conditions_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'CURRENCIES', 5, 1,
 TRUE, '{"required": true}', 'USD', NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_EXPIRY_DATE', 'field.lcExpiryDate', @lce_conditions_section_id, 'DATE', 'DATE_PICKER',
 NULL, NULL, 6, 1,
 TRUE, '{"required": true, "minDate": "today"}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_EXPIRY_PLACE', 'field.lcExpiryPlace', @lce_conditions_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 7, 1,
 TRUE, '{"required": true, "maxLength": 100}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_PAYMENT_TYPE', 'field.paymentType', @lce_conditions_section_id, 'SELECT', 'SELECT',
 NULL, NULL, 8, 1,
 TRUE, '{"required": true}', 'SIGHT',
 '[{"value": "SIGHT", "labelKey": "option.sight"}, {"value": "DEFERRED", "labelKey": "option.deferred"}, {"value": "ACCEPTANCE", "labelKey": "option.acceptance"}, {"value": "NEGOTIATION", "labelKey": "option.negotiation"}]',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_PAYMENT_TERM_DAYS', 'field.paymentTermDays', @lce_conditions_section_id, 'NUMBER', 'NUMBER_INPUT',
 NULL, NULL, 9, 1,
 FALSE, '{"min": 1, "max": 360}', NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 2: Applicant (Importer)
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LCE_APPLICANT', 'clientPortal.lcExport.step.applicant', 'clientPortal.lcExport.step.applicant.desc', 'CLIENT_LC_EXPORT_REQUEST',
 2, 'FiUser', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lce_applicant_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LCE_APPLICANT' AND product_type = 'CLIENT_LC_EXPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LCE_APPLICANT', 'clientPortal.lcExport.section.applicant', @lce_applicant_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lce_applicant_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LCE_APPLICANT' AND step_id = @lce_applicant_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_view, show_in_list, is_active, created_by
) VALUES
('LCE_APPLICANT_NAME', 'field.applicantName', @lce_applicant_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 1, 2,
 TRUE, '{"required": true, "maxLength": 200}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_APPLICANT_COUNTRY', 'field.applicantCountry', @lce_applicant_section_id, 'SELECT', 'COUNTRY_SELECT',
 'CATALOG', 'COUNTRIES', 2, 1,
 TRUE, '{"required": true}',
 TRUE, TRUE, TRUE, TRUE, 'system'),

('LCE_APPLICANT_ADDRESS', 'field.applicantAddress', @lce_applicant_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, 3, 2,
 TRUE, '{"required": true, "maxLength": 500}',
 TRUE, TRUE, TRUE, TRUE, 'system');

-- Step 3: Shipment Details
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LCE_SHIPMENT', 'clientPortal.lcExport.step.shipment', 'clientPortal.lcExport.step.shipment.desc', 'CLIENT_LC_EXPORT_REQUEST',
 3, 'FiTruck', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lce_shipment_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LCE_SHIPMENT' AND product_type = 'CLIENT_LC_EXPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LCE_SHIPMENT', 'clientPortal.lcExport.section.shipment', @lce_shipment_step_id, 'SINGLE',
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lce_shipment_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LCE_SHIPMENT' AND step_id = @lce_shipment_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules, field_options,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('LCE_PORT_LOADING', 'field.portLoading', @lce_shipment_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 1, 1,
 TRUE, '{"required": true, "maxLength": 100}', NULL,
 TRUE, TRUE, TRUE, 'system'),

('LCE_PORT_DISCHARGE', 'field.portDischarge', @lce_shipment_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "maxLength": 100}', NULL,
 TRUE, TRUE, TRUE, 'system'),

('LCE_INCOTERM', 'field.incoterm', @lce_shipment_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'INCOTERMS', 3, 1,
 TRUE, '{"required": true}', NULL,
 TRUE, TRUE, TRUE, 'system'),

('LCE_LATEST_SHIPMENT_DATE', 'field.latestShipmentDate', @lce_shipment_section_id, 'DATE', 'DATE_PICKER',
 NULL, NULL, 4, 1,
 TRUE, '{"required": true, "minDate": "today"}', NULL,
 TRUE, TRUE, TRUE, 'system'),

('LCE_PARTIAL_SHIPMENTS', 'field.partialShipments', @lce_shipment_section_id, 'SELECT', 'SELECT',
 NULL, NULL, 5, 1,
 TRUE, '{"required": true}',
 '[{"value": "ALLOWED", "labelKey": "option.allowed"}, {"value": "NOT_ALLOWED", "labelKey": "option.notAllowed"}]',
 TRUE, TRUE, TRUE, 'system'),

('LCE_TRANSSHIPMENT', 'field.transshipment', @lce_shipment_section_id, 'SELECT', 'SELECT',
 NULL, NULL, 6, 1,
 TRUE, '{"required": true}',
 '[{"value": "ALLOWED", "labelKey": "option.allowed"}, {"value": "NOT_ALLOWED", "labelKey": "option.notAllowed"}]',
 TRUE, TRUE, TRUE, 'system');

-- Step 4: Goods Description
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LCE_GOODS', 'clientPortal.lcExport.step.goods', 'clientPortal.lcExport.step.goods.desc', 'CLIENT_LC_EXPORT_REQUEST',
 4, 'FiPackage', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lce_goods_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LCE_GOODS' AND product_type = 'CLIENT_LC_EXPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LCE_GOODS', 'clientPortal.lcExport.section.goods', @lce_goods_step_id, 'SINGLE',
 1, 1, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lce_goods_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LCE_GOODS' AND step_id = @lce_goods_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    display_order, span_columns, is_required, validation_rules,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('LCE_GOODS_DESCRIPTION', 'field.goodsDescription', @lce_goods_section_id, 'TEXT', 'MULTILINE_TEXT',
 1, 1, TRUE, '{"required": true, "maxLength": 5000, "rows": 10}',
 TRUE, TRUE, TRUE, 'system'),

('LCE_HS_CODE', 'field.hsCode', @lce_goods_section_id, 'TEXT', 'TEXT_INPUT',
 2, 1, FALSE, '{"maxLength": 20}',
 TRUE, TRUE, TRUE, 'system');

-- Step 5: Documents Required
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LCE_DOCUMENTS', 'clientPortal.lcExport.step.documents', 'clientPortal.lcExport.step.documents.desc', 'CLIENT_LC_EXPORT_REQUEST',
 5, 'FiUpload', TRUE, TRUE, TRUE, 'SEPARATE_STEP', TRUE, 'system');

SET @lce_docs_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'CLIENT_LCE_DOCUMENTS' AND product_type = 'CLIENT_LC_EXPORT_REQUEST');

INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, step_id, section_type, min_rows, max_rows,
    display_order, columns, collapsible, show_in_wizard, show_in_view, is_active, created_by
) VALUES
(UUID(), 'LCE_DOCUMENTS', 'clientPortal.lcExport.section.documents', @lce_docs_step_id, 'REPEATABLE', 1, 15,
 1, 2, FALSE, TRUE, TRUE, TRUE, 'system');

SET @lce_docs_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'LCE_DOCUMENTS' AND step_id = @lce_docs_step_id);

INSERT INTO custom_field_config_readmodel (
    field_code, field_name_key, section_id, field_type, component_type,
    data_source_type, data_source_code, display_order, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_view, is_active, created_by
) VALUES
('LCE_DOC_TYPE', 'field.documentType', @lce_docs_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'DOCUMENT_TYPES_LC', 1, 1,
 TRUE, '{"required": true}',
 TRUE, TRUE, TRUE, 'system'),

('LCE_DOC_FILE', 'field.documentFile', @lce_docs_section_id, 'FILE', 'FILE_UPLOAD',
 NULL, NULL, 2, 1,
 TRUE, '{"required": true, "accept": ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png", "maxSize": 10485760}',
 TRUE, TRUE, TRUE, 'system'),

('LCE_DOC_DESCRIPTION', 'field.documentDescription', @lce_docs_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, 3, 2,
 FALSE, '{"maxLength": 200}',
 TRUE, TRUE, TRUE, 'system');

-- Step 6: Review
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key, product_type,
    display_order, icon, show_in_wizard, show_in_expert, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'CLIENT_LCE_REVIEW', 'clientPortal.lcExport.step.review', 'clientPortal.lcExport.step.review.desc', 'CLIENT_LC_EXPORT_REQUEST',
 6, 'FiCheckCircle', TRUE, FALSE, FALSE, 'SEPARATE_STEP', TRUE, 'system');
