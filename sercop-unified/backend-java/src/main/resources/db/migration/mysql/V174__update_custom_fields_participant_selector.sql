-- ================================================
-- Migration: Update Custom Fields to use Participant Selector
-- Description:
--   - GUARANTORS: Use PARTICIPANT_SELECTOR (must be registered participants like :50:/:59:)
--   - CODEBTORS: Allow both PARTICIPANT_SELECTOR or manual text entry
-- Author: GlobalCMX Architecture
-- Date: 2026-01-19
-- ================================================

-- ================================================
-- Step 1: Delete existing fields for GUARANTORS section
-- ================================================
DELETE FROM custom_field_config_readmodel
WHERE section_id IN (
    SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'GUARANTORS'
);

-- ================================================
-- Step 2: Get the GUARANTORS section ID
-- ================================================
SET @guarantors_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'GUARANTORS' LIMIT 1);

-- ================================================
-- Step 3: Create new fields for GUARANTORS using PARTICIPANT_SELECTOR
-- ================================================
INSERT INTO custom_field_config_readmodel (
    id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type,
    data_source_type, data_source_code, data_source_filters,
    display_order, placeholder_key, help_text_key, span_columns,
    is_required, required_condition, validation_rules,
    default_value, field_options,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES
-- Guarantor (Participant Selector - must select from registered participants)
(UUID(), 'GUARANTOR', 'customFields.fields.GUARANTOR.name', 'customFields.fields.GUARANTOR.description',
 @guarantors_section_id, 'PARTICIPANT', 'PARTICIPANT_SELECTOR',
 'PARTICIPANT', NULL, NULL,
 1, 'customFields.fields.GUARANTOR.placeholder', 'customFields.fields.GUARANTOR.helpText', 2,
 TRUE, NULL, NULL,
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor Type
(UUID(), 'GUARANTOR_TYPE', 'customFields.fields.GUARANTOR_TYPE.name', 'customFields.fields.GUARANTOR_TYPE.description',
 @guarantors_section_id, 'SELECT', 'SELECT',
 NULL, NULL, NULL,
 2, 'customFields.fields.GUARANTOR_TYPE.placeholder', 'customFields.fields.GUARANTOR_TYPE.helpText', 1,
 TRUE, NULL, NULL,
 NULL, '[{"value": "PERSONAL", "labelKey": "customFields.options.guarantorType.PERSONAL"}, {"value": "CORPORATE", "labelKey": "customFields.options.guarantorType.CORPORATE"}, {"value": "BANK", "labelKey": "customFields.options.guarantorType.BANK"}, {"value": "GOVERNMENT", "labelKey": "customFields.options.guarantorType.GOVERNMENT"}]',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantee Amount
(UUID(), 'GUARANTEE_AMOUNT', 'customFields.fields.GUARANTEE_AMOUNT.name', 'customFields.fields.GUARANTEE_AMOUNT.description',
 @guarantors_section_id, 'NUMBER', 'CURRENCY_AMOUNT',
 NULL, NULL, NULL,
 3, 'customFields.fields.GUARANTEE_AMOUNT.placeholder', 'customFields.fields.GUARANTEE_AMOUNT.helpText', 1,
 FALSE, NULL, '{"min": 0, "decimals": 2}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantee Percentage
(UUID(), 'GUARANTEE_PERCENTAGE', 'customFields.fields.GUARANTEE_PERCENTAGE.name', 'customFields.fields.GUARANTEE_PERCENTAGE.description',
 @guarantors_section_id, 'NUMBER', 'PERCENTAGE',
 NULL, NULL, NULL,
 4, 'customFields.fields.GUARANTEE_PERCENTAGE.placeholder', 'customFields.fields.GUARANTEE_PERCENTAGE.helpText', 1,
 FALSE, NULL, '{"min": 0, "max": 100, "decimals": 2}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor Notes
(UUID(), 'GUARANTOR_NOTES', 'customFields.fields.GUARANTOR_NOTES.name', 'customFields.fields.GUARANTOR_NOTES.description',
 @guarantors_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, NULL,
 5, 'customFields.fields.GUARANTOR_NOTES.placeholder', 'customFields.fields.GUARANTOR_NOTES.helpText', 2,
 FALSE, NULL, '{"maxLength": 1000}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- ================================================
-- Step 4: Delete existing fields for CODEBTORS section
-- ================================================
DELETE FROM custom_field_config_readmodel
WHERE section_id IN (
    SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'CODEBTORS'
);

-- ================================================
-- Step 5: Get the CODEBTORS section ID
-- ================================================
SET @codebtors_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'CODEBTORS' LIMIT 1);

-- ================================================
-- Step 6: Create new fields for CODEBTORS with dual mode
-- (can be existing participant or manual entry)
-- ================================================
INSERT INTO custom_field_config_readmodel (
    id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type,
    data_source_type, data_source_code, data_source_filters,
    display_order, placeholder_key, help_text_key, span_columns,
    is_required, required_condition, validation_rules,
    default_value, field_options,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES
-- Co-debtor Type (select if existing client or new)
(UUID(), 'CODEBTOR_TYPE', 'customFields.fields.CODEBTOR_TYPE.name', 'customFields.fields.CODEBTOR_TYPE.description',
 @codebtors_section_id, 'SELECT', 'SELECT',
 NULL, NULL, NULL,
 1, 'customFields.fields.CODEBTOR_TYPE.placeholder', 'customFields.fields.CODEBTOR_TYPE.helpText', 1,
 TRUE, NULL, NULL,
 'NEW', '[{"value": "EXISTING", "labelKey": "customFields.options.codebtorType.EXISTING"}, {"value": "NEW", "labelKey": "customFields.options.codebtorType.NEW"}]',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Co-debtor (Participant Selector - only shown if CODEBTOR_TYPE = EXISTING)
(UUID(), 'CODEBTOR_PARTICIPANT', 'customFields.fields.CODEBTOR_PARTICIPANT.name', 'customFields.fields.CODEBTOR_PARTICIPANT.description',
 @codebtors_section_id, 'PARTICIPANT', 'PARTICIPANT_SELECTOR',
 'PARTICIPANT', NULL, NULL,
 2, 'customFields.fields.CODEBTOR_PARTICIPANT.placeholder', 'customFields.fields.CODEBTOR_PARTICIPANT.helpText', 2,
 FALSE, '{"field": "CODEBTOR_TYPE", "operator": "EQUALS", "value": "EXISTING"}', NULL,
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Co-debtor Name (manual entry - only shown if CODEBTOR_TYPE = NEW)
(UUID(), 'CODEBTOR_NAME', 'customFields.fields.CODEBTOR_NAME.name', 'customFields.fields.CODEBTOR_NAME.description',
 @codebtors_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, NULL,
 3, 'customFields.fields.CODEBTOR_NAME.placeholder', 'customFields.fields.CODEBTOR_NAME.helpText', 1,
 FALSE, '{"field": "CODEBTOR_TYPE", "operator": "EQUALS", "value": "NEW"}', '{"maxLength": 200}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Co-debtor ID (manual entry - only shown if CODEBTOR_TYPE = NEW)
(UUID(), 'CODEBTOR_ID', 'customFields.fields.CODEBTOR_ID.name', 'customFields.fields.CODEBTOR_ID.description',
 @codebtors_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, NULL,
 4, 'customFields.fields.CODEBTOR_ID.placeholder', 'customFields.fields.CODEBTOR_ID.helpText', 1,
 FALSE, '{"field": "CODEBTOR_TYPE", "operator": "EQUALS", "value": "NEW"}', '{"maxLength": 30}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Co-debtor Address (manual entry - only shown if CODEBTOR_TYPE = NEW)
(UUID(), 'CODEBTOR_ADDRESS', 'customFields.fields.CODEBTOR_ADDRESS.name', 'customFields.fields.CODEBTOR_ADDRESS.description',
 @codebtors_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, NULL,
 5, 'customFields.fields.CODEBTOR_ADDRESS.placeholder', 'customFields.fields.CODEBTOR_ADDRESS.helpText', 2,
 FALSE, '{"field": "CODEBTOR_TYPE", "operator": "EQUALS", "value": "NEW"}', '{"maxLength": 500, "maxLines": 4, "maxLineLength": 35}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Relationship to debtor
(UUID(), 'CODEBTOR_RELATIONSHIP', 'customFields.fields.CODEBTOR_RELATIONSHIP.name', 'customFields.fields.CODEBTOR_RELATIONSHIP.description',
 @codebtors_section_id, 'SELECT', 'SELECT',
 NULL, NULL, NULL,
 6, 'customFields.fields.CODEBTOR_RELATIONSHIP.placeholder', 'customFields.fields.CODEBTOR_RELATIONSHIP.helpText', 1,
 FALSE, NULL, NULL,
 NULL, '[{"value": "SPOUSE", "labelKey": "customFields.options.relationship.SPOUSE"}, {"value": "BUSINESS_PARTNER", "labelKey": "customFields.options.relationship.BUSINESS_PARTNER"}, {"value": "SUBSIDIARY", "labelKey": "customFields.options.relationship.SUBSIDIARY"}, {"value": "PARENT_COMPANY", "labelKey": "customFields.options.relationship.PARENT_COMPANY"}, {"value": "OTHER", "labelKey": "customFields.options.relationship.OTHER"}]',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Percentage of Liability
(UUID(), 'CODEBTOR_LIABILITY_PCT', 'customFields.fields.CODEBTOR_LIABILITY_PCT.name', 'customFields.fields.CODEBTOR_LIABILITY_PCT.description',
 @codebtors_section_id, 'NUMBER', 'PERCENTAGE',
 NULL, NULL, NULL,
 7, 'customFields.fields.CODEBTOR_LIABILITY_PCT.placeholder', 'customFields.fields.CODEBTOR_LIABILITY_PCT.helpText', 1,
 FALSE, NULL, '{"min": 0, "max": 100, "decimals": 2}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');
