-- V266: Custom fields configuration for new product types
-- Configures dynamic wizard forms for: STANDBY_LC, COLLECTION_IMPORT, COLLECTION_EXPORT,
-- GUARANTEE_MANDATARIA, TRADE_FINANCING, AVAL_DESCUENTO

-- Cleanup any previously-inserted data (makes migration idempotent)
-- Must delete in order: fields -> sections -> steps (foreign key dependencies)
DELETE cf FROM custom_field_config_readmodel cf
INNER JOIN custom_field_section_config_readmodel cs ON cf.section_id = cs.id
INNER JOIN custom_field_step_config_readmodel cst ON cs.step_id = cst.id
WHERE cst.product_type IN ('STANDBY_LC','COLLECTION_IMPORT','COLLECTION_EXPORT','GUARANTEE_MANDATARIA','TRADE_FINANCING','AVAL_DESCUENTO');

DELETE cs FROM custom_field_section_config_readmodel cs
INNER JOIN custom_field_step_config_readmodel cst ON cs.step_id = cst.id
WHERE cst.product_type IN ('STANDBY_LC','COLLECTION_IMPORT','COLLECTION_EXPORT','GUARANTEE_MANDATARIA','TRADE_FINANCING','AVAL_DESCUENTO');

DELETE FROM custom_field_step_config_readmodel
WHERE product_type IN ('STANDBY_LC','COLLECTION_IMPORT','COLLECTION_EXPORT','GUARANTEE_MANDATARIA','TRADE_FINANCING','AVAL_DESCUENTO');

-- =============================================================================
-- STANDBY_LC Custom Fields
-- =============================================================================

INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, is_active, created_by
) VALUES
(UUID(), 'PARTIES', 'customFields.steps.PARTIES.name', 'customFields.steps.PARTIES.description',
 'STANDBY_LC', NULL, 1, 'FiUsers', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'AMOUNTS', 'customFields.steps.AMOUNTS.name', 'customFields.steps.AMOUNTS.description',
 'STANDBY_LC', NULL, 2, 'FiDollarSign', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'DATES', 'customFields.steps.DATES.name', 'customFields.steps.DATES.description',
 'STANDBY_LC', NULL, 3, 'FiCalendar', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'TERMS', 'customFields.steps.TERMS.name', 'customFields.steps.TERMS.description',
 'STANDBY_LC', NULL, 4, 'FiFileText', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'ADDITIONAL', 'customFields.steps.ADDITIONAL.name', 'customFields.steps.ADDITIONAL.description',
 'STANDBY_LC', NULL, 5, 'FiInfo', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM');

-- Sections & Fields for STANDBY_LC
SET @sblc_parties_step = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'PARTIES' AND product_type = 'STANDBY_LC' LIMIT 1);
SET @sblc_amounts_step = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'AMOUNTS' AND product_type = 'STANDBY_LC' LIMIT 1);
SET @sblc_dates_step = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'DATES' AND product_type = 'STANDBY_LC' LIMIT 1);
SET @sblc_terms_step = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'TERMS' AND product_type = 'STANDBY_LC' LIMIT 1);
SET @sblc_additional_step = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'ADDITIONAL' AND product_type = 'STANDBY_LC' LIMIT 1);

-- Parties sections
INSERT INTO custom_field_section_config_readmodel (id, section_code, section_name_key, section_description_key,
    step_id, section_type, display_order, collapsible, columns, show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'APPLICANT', 'customFields.sections.APPLICANT.name', 'customFields.sections.APPLICANT.description',
 @sblc_parties_step, 'STANDARD', 1, FALSE, 2, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'BENEFICIARY', 'customFields.sections.BENEFICIARY.name', 'customFields.sections.BENEFICIARY.description',
 @sblc_parties_step, 'STANDARD', 2, FALSE, 2, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'BANKS', 'customFields.sections.BANKS.name', 'customFields.sections.BANKS.description',
 @sblc_parties_step, 'STANDARD', 3, FALSE, 2, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

SET @sblc_applicant = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'APPLICANT' AND step_id = @sblc_parties_step LIMIT 1);
SET @sblc_beneficiary = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'BENEFICIARY' AND step_id = @sblc_parties_step LIMIT 1);
SET @sblc_banks = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'BANKS' AND step_id = @sblc_parties_step LIMIT 1);

INSERT INTO custom_field_config_readmodel (id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type, display_order, span_columns, is_required,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'APPLICANT_NAME', 'customFields.fields.APPLICANT_NAME.name', 'customFields.fields.APPLICANT_NAME.description',
 @sblc_applicant, 'TEXT', 'PARTICIPANT_SELECTOR', 1, 2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'BENEFICIARY_NAME', 'customFields.fields.BENEFICIARY_NAME.name', 'customFields.fields.BENEFICIARY_NAME.description',
 @sblc_beneficiary, 'TEXT', 'PARTICIPANT_SELECTOR', 1, 2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'ISSUING_BANK', 'customFields.fields.ISSUING_BANK.name', 'customFields.fields.ISSUING_BANK.description',
 @sblc_banks, 'TEXT', 'BANK_SELECTOR', 1, 1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'ADVISING_BANK', 'customFields.fields.ADVISING_BANK.name', 'customFields.fields.ADVISING_BANK.description',
 @sblc_banks, 'TEXT', 'BANK_SELECTOR', 2, 1, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- Amount section
INSERT INTO custom_field_section_config_readmodel (id, section_code, section_name_key, section_description_key,
    step_id, section_type, display_order, collapsible, columns, show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'AMOUNT_DETAILS', 'customFields.sections.AMOUNT_DETAILS.name', 'customFields.sections.AMOUNT_DETAILS.description',
 @sblc_amounts_step, 'STANDARD', 1, FALSE, 2, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

SET @sblc_amount_section = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'AMOUNT_DETAILS' AND step_id = @sblc_amounts_step LIMIT 1);

INSERT INTO custom_field_config_readmodel (id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type, display_order, span_columns, is_required,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'CURRENCY', 'customFields.fields.CURRENCY.name', 'customFields.fields.CURRENCY.description',
 @sblc_amount_section, 'TEXT', 'CURRENCY_SELECT', 1, 1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'AMOUNT', 'customFields.fields.AMOUNT.name', 'customFields.fields.AMOUNT.description',
 @sblc_amount_section, 'DECIMAL', 'CURRENCY_AMOUNT', 2, 1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- Dates section
INSERT INTO custom_field_section_config_readmodel (id, section_code, section_name_key, section_description_key,
    step_id, section_type, display_order, collapsible, columns, show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'KEY_DATES', 'customFields.sections.KEY_DATES.name', 'customFields.sections.KEY_DATES.description',
 @sblc_dates_step, 'STANDARD', 1, FALSE, 3, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

SET @sblc_dates_section = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'KEY_DATES' AND step_id = @sblc_dates_step LIMIT 1);

INSERT INTO custom_field_config_readmodel (id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type, display_order, span_columns, is_required,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'ISSUE_DATE', 'customFields.fields.ISSUE_DATE.name', 'customFields.fields.ISSUE_DATE.description',
 @sblc_dates_section, 'DATE', 'DATE_PICKER', 1, 1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'EXPIRY_DATE', 'customFields.fields.EXPIRY_DATE.name', 'customFields.fields.EXPIRY_DATE.description',
 @sblc_dates_section, 'DATE', 'DATE_PICKER', 2, 1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'LATEST_PRESENTATION', 'customFields.fields.LATEST_PRESENTATION.name', 'customFields.fields.LATEST_PRESENTATION.description',
 @sblc_dates_section, 'DATE', 'DATE_PICKER', 3, 1, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- Terms section
INSERT INTO custom_field_section_config_readmodel (id, section_code, section_name_key, section_description_key,
    step_id, section_type, display_order, collapsible, columns, show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'STANDBY_TERMS', 'customFields.sections.STANDBY_TERMS.name', 'customFields.sections.STANDBY_TERMS.description',
 @sblc_terms_step, 'STANDARD', 1, FALSE, 2, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

SET @sblc_terms_section = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'STANDBY_TERMS' AND step_id = @sblc_terms_step LIMIT 1);

INSERT INTO custom_field_config_readmodel (id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type, display_order, span_columns, is_required,
    field_options, show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'APPLICABLE_RULES', 'customFields.fields.APPLICABLE_RULES.name', 'customFields.fields.APPLICABLE_RULES.description',
 @sblc_terms_section, 'SELECT', 'SELECT', 1, 1, TRUE,
 '[{"value":"ISP98","labelKey":"ISP98"},{"value":"UCP600","labelKey":"UCP600"},{"value":"URDG758","labelKey":"URDG758"}]',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'DEMAND_BASIS', 'customFields.fields.DEMAND_BASIS.name', 'customFields.fields.DEMAND_BASIS.description',
 @sblc_terms_section, 'TEXT', 'TEXT_INPUT', 2, 1, FALSE, NULL, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- Additional section
INSERT INTO custom_field_section_config_readmodel (id, section_code, section_name_key, section_description_key,
    step_id, section_type, display_order, collapsible, columns, show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'NARRATIVE', 'customFields.sections.NARRATIVE.name', 'customFields.sections.NARRATIVE.description',
 @sblc_additional_step, 'STANDARD', 1, FALSE, 1, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

SET @sblc_narrative = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'NARRATIVE' AND step_id = @sblc_additional_step LIMIT 1);

INSERT INTO custom_field_config_readmodel (id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type, display_order, span_columns, is_required,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view, is_active, created_by)
VALUES
(UUID(), 'NARRATIVE_TEXT', 'customFields.fields.NARRATIVE_TEXT.name', 'customFields.fields.NARRATIVE_TEXT.description',
 @sblc_narrative, 'TEXT', 'TEXTAREA', 1, 1, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),
(UUID(), 'SPECIAL_CONDITIONS', 'customFields.fields.SPECIAL_CONDITIONS.name', 'customFields.fields.SPECIAL_CONDITIONS.description',
 @sblc_narrative, 'TEXT', 'TEXTAREA', 2, 1, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- =============================================================================
-- Repeat similar pattern for remaining 5 product types
-- Using a condensed approach: 1 step with key sections per product
-- =============================================================================

-- COLLECTION_IMPORT
INSERT INTO custom_field_step_config_readmodel (id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon, show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, is_active, created_by) VALUES
(UUID(), 'PARTIES', 'customFields.steps.PARTIES.name', 'customFields.steps.PARTIES.description',
 'COLLECTION_IMPORT', NULL, 1, 'FiUsers', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'COLLECTION_DETAILS', 'customFields.steps.COLLECTION_DETAILS.name', 'customFields.steps.COLLECTION_DETAILS.description',
 'COLLECTION_IMPORT', NULL, 2, 'FiFileText', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'AMOUNTS', 'customFields.steps.AMOUNTS.name', 'customFields.steps.AMOUNTS.description',
 'COLLECTION_IMPORT', NULL, 3, 'FiDollarSign', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM');

-- COLLECTION_EXPORT
INSERT INTO custom_field_step_config_readmodel (id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon, show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, is_active, created_by) VALUES
(UUID(), 'PARTIES', 'customFields.steps.PARTIES.name', 'customFields.steps.PARTIES.description',
 'COLLECTION_EXPORT', NULL, 1, 'FiUsers', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'COLLECTION_DETAILS', 'customFields.steps.COLLECTION_DETAILS.name', 'customFields.steps.COLLECTION_DETAILS.description',
 'COLLECTION_EXPORT', NULL, 2, 'FiFileText', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'AMOUNTS', 'customFields.steps.AMOUNTS.name', 'customFields.steps.AMOUNTS.description',
 'COLLECTION_EXPORT', NULL, 3, 'FiDollarSign', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM');

-- GUARANTEE_MANDATARIA
INSERT INTO custom_field_step_config_readmodel (id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon, show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, is_active, created_by) VALUES
(UUID(), 'PARTIES', 'customFields.steps.PARTIES.name', 'customFields.steps.PARTIES.description',
 'GUARANTEE_MANDATARIA', NULL, 1, 'FiUsers', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'GUARANTEE_DETAILS', 'customFields.steps.GUARANTEE_DETAILS.name', 'customFields.steps.GUARANTEE_DETAILS.description',
 'GUARANTEE_MANDATARIA', NULL, 2, 'FiShield', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'AMOUNTS', 'customFields.steps.AMOUNTS.name', 'customFields.steps.AMOUNTS.description',
 'GUARANTEE_MANDATARIA', NULL, 3, 'FiDollarSign', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'DATES', 'customFields.steps.DATES.name', 'customFields.steps.DATES.description',
 'GUARANTEE_MANDATARIA', NULL, 4, 'FiCalendar', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM');

-- TRADE_FINANCING
INSERT INTO custom_field_step_config_readmodel (id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon, show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, is_active, created_by) VALUES
(UUID(), 'PARTIES', 'customFields.steps.PARTIES.name', 'customFields.steps.PARTIES.description',
 'TRADE_FINANCING', NULL, 1, 'FiUsers', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'FINANCING_DETAILS', 'customFields.steps.FINANCING_DETAILS.name', 'customFields.steps.FINANCING_DETAILS.description',
 'TRADE_FINANCING', NULL, 2, 'FiFileText', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'AMOUNTS', 'customFields.steps.AMOUNTS.name', 'customFields.steps.AMOUNTS.description',
 'TRADE_FINANCING', NULL, 3, 'FiDollarSign', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'DATES', 'customFields.steps.DATES.name', 'customFields.steps.DATES.description',
 'TRADE_FINANCING', NULL, 4, 'FiCalendar', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM');

-- AVAL_DESCUENTO
INSERT INTO custom_field_step_config_readmodel (id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon, show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, is_active, created_by) VALUES
(UUID(), 'PARTIES', 'customFields.steps.PARTIES.name', 'customFields.steps.PARTIES.description',
 'AVAL_DESCUENTO', NULL, 1, 'FiUsers', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'DRAFT_DETAILS', 'customFields.steps.DRAFT_DETAILS.name', 'customFields.steps.DRAFT_DETAILS.description',
 'AVAL_DESCUENTO', NULL, 2, 'FiFileText', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'AMOUNTS', 'customFields.steps.AMOUNTS.name', 'customFields.steps.AMOUNTS.description',
 'AVAL_DESCUENTO', NULL, 3, 'FiDollarSign', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM'),
(UUID(), 'DATES', 'customFields.steps.DATES.name', 'customFields.steps.DATES.description',
 'AVAL_DESCUENTO', NULL, 4, 'FiCalendar', TRUE, TRUE, TRUE, TRUE, 'STANDALONE', TRUE, 'SYSTEM');
