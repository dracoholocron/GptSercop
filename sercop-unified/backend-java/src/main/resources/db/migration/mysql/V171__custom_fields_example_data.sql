-- ================================================
-- Migration: Custom Fields Example Data
-- Description: Sample configuration for Guarantors section
-- Author: GlobalCMX Architecture
-- Date: 2026-01-18
-- ================================================

-- ================================================
-- Example: Guarantors and Co-debtors embedded in Parties
-- ================================================

-- Create a step that embeds in SWIFT Parties
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, embed_swift_step, is_active, created_by
) VALUES (
    UUID(),
    'ADDITIONAL_PARTIES',
    'customFields.steps.ADDITIONAL_PARTIES.name',
    'customFields.steps.ADDITIONAL_PARTIES.description',
    'ALL', NULL, 100, 'FiUsers',
    TRUE, TRUE, TRUE, TRUE,
    'EMBEDDED_IN_SWIFT', 'PARTIES', TRUE, 'SYSTEM'
);

SET @step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'ADDITIONAL_PARTIES' LIMIT 1);

-- Create Guarantors section (repeatable)
INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, section_description_key,
    step_id, section_type, min_rows, max_rows,
    display_order, collapsible, default_collapsed, columns,
    embed_mode, embed_target_type, embed_target_code,
    embed_show_separator, embed_collapsible, embed_separator_title_key,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES (
    UUID(),
    'GUARANTORS',
    'customFields.sections.GUARANTORS.name',
    'customFields.sections.GUARANTORS.description',
    @step_id, 'REPEATABLE', 0, 10,
    1, TRUE, FALSE, 2,
    'AFTER_SECTION', 'SECTION', 'PARTIES',
    TRUE, TRUE, 'customFields.sections.GUARANTORS.separatorTitle',
    TRUE, TRUE, TRUE, TRUE,
    TRUE, 'SYSTEM'
);

SET @guarantors_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'GUARANTORS' LIMIT 1);

-- Create fields for Guarantors section
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
-- Guarantor Type
(UUID(), 'GUARANTOR_TYPE', 'customFields.fields.GUARANTOR_TYPE.name', 'customFields.fields.GUARANTOR_TYPE.description',
 @guarantors_section_id, 'SELECT', 'SELECT',
 NULL, NULL, NULL,
 1, 'customFields.fields.GUARANTOR_TYPE.placeholder', 'customFields.fields.GUARANTOR_TYPE.helpText', 1,
 TRUE, NULL, NULL,
 NULL, '[{"value": "PERSONAL", "labelKey": "customFields.options.guarantorType.PERSONAL"}, {"value": "CORPORATE", "labelKey": "customFields.options.guarantorType.CORPORATE"}, {"value": "BANK", "labelKey": "customFields.options.guarantorType.BANK"}, {"value": "GOVERNMENT", "labelKey": "customFields.options.guarantorType.GOVERNMENT"}]',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor Name
(UUID(), 'GUARANTOR_NAME', 'customFields.fields.GUARANTOR_NAME.name', 'customFields.fields.GUARANTOR_NAME.description',
 @guarantors_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, NULL,
 2, 'customFields.fields.GUARANTOR_NAME.placeholder', 'customFields.fields.GUARANTOR_NAME.helpText', 1,
 TRUE, NULL, '{"maxLength": 200}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor ID Type
(UUID(), 'GUARANTOR_ID_TYPE', 'customFields.fields.GUARANTOR_ID_TYPE.name', 'customFields.fields.GUARANTOR_ID_TYPE.description',
 @guarantors_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'ID_TYPES', NULL,
 3, 'customFields.fields.GUARANTOR_ID_TYPE.placeholder', 'customFields.fields.GUARANTOR_ID_TYPE.helpText', 1,
 TRUE, NULL, NULL,
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor ID Number
(UUID(), 'GUARANTOR_ID_NUMBER', 'customFields.fields.GUARANTOR_ID_NUMBER.name', 'customFields.fields.GUARANTOR_ID_NUMBER.description',
 @guarantors_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL, NULL,
 4, 'customFields.fields.GUARANTOR_ID_NUMBER.placeholder', 'customFields.fields.GUARANTOR_ID_NUMBER.helpText', 1,
 TRUE, NULL, '{"pattern": "^[A-Z0-9-]+$", "maxLength": 30}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor Address
(UUID(), 'GUARANTOR_ADDRESS', 'customFields.fields.GUARANTOR_ADDRESS.name', 'customFields.fields.GUARANTOR_ADDRESS.description',
 @guarantors_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, NULL,
 5, 'customFields.fields.GUARANTOR_ADDRESS.placeholder', 'customFields.fields.GUARANTOR_ADDRESS.helpText', 2,
 FALSE, NULL, '{"maxLength": 500}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor Country
(UUID(), 'GUARANTOR_COUNTRY', 'customFields.fields.GUARANTOR_COUNTRY.name', 'customFields.fields.GUARANTOR_COUNTRY.description',
 @guarantors_section_id, 'SELECT', 'COUNTRY_SELECT',
 NULL, NULL, NULL,
 6, 'customFields.fields.GUARANTOR_COUNTRY.placeholder', 'customFields.fields.GUARANTOR_COUNTRY.helpText', 1,
 TRUE, NULL, NULL,
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor Phone
(UUID(), 'GUARANTOR_PHONE', 'customFields.fields.GUARANTOR_PHONE.name', 'customFields.fields.GUARANTOR_PHONE.description',
 @guarantors_section_id, 'TEXT', 'PHONE',
 NULL, NULL, NULL,
 7, 'customFields.fields.GUARANTOR_PHONE.placeholder', 'customFields.fields.GUARANTOR_PHONE.helpText', 1,
 FALSE, NULL, NULL,
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantor Email
(UUID(), 'GUARANTOR_EMAIL', 'customFields.fields.GUARANTOR_EMAIL.name', 'customFields.fields.GUARANTOR_EMAIL.description',
 @guarantors_section_id, 'TEXT', 'EMAIL',
 NULL, NULL, NULL,
 8, 'customFields.fields.GUARANTOR_EMAIL.placeholder', 'customFields.fields.GUARANTOR_EMAIL.helpText', 1,
 FALSE, NULL, NULL,
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantee Amount
(UUID(), 'GUARANTEE_AMOUNT', 'customFields.fields.GUARANTEE_AMOUNT.name', 'customFields.fields.GUARANTEE_AMOUNT.description',
 @guarantors_section_id, 'NUMBER', 'CURRENCY_AMOUNT',
 NULL, NULL, NULL,
 9, 'customFields.fields.GUARANTEE_AMOUNT.placeholder', 'customFields.fields.GUARANTEE_AMOUNT.helpText', 2,
 FALSE, NULL, '{"min": 0, "decimals": 2}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Guarantee Percentage
(UUID(), 'GUARANTEE_PERCENTAGE', 'customFields.fields.GUARANTEE_PERCENTAGE.name', 'customFields.fields.GUARANTEE_PERCENTAGE.description',
 @guarantors_section_id, 'NUMBER', 'PERCENTAGE',
 NULL, NULL, NULL,
 10, 'customFields.fields.GUARANTEE_PERCENTAGE.placeholder', 'customFields.fields.GUARANTEE_PERCENTAGE.helpText', 1,
 FALSE, NULL, '{"min": 0, "max": 100, "decimals": 2}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Responsible Officer (from user list)
(UUID(), 'RESPONSIBLE_OFFICER', 'customFields.fields.RESPONSIBLE_OFFICER.name', 'customFields.fields.RESPONSIBLE_OFFICER.description',
 @guarantors_section_id, 'SELECT', 'USER_LISTBOX',
 'USER', NULL, '{"roleFilter": "OFFICER,MANAGER", "activeOnly": true}',
 11, 'customFields.fields.RESPONSIBLE_OFFICER.placeholder', 'customFields.fields.RESPONSIBLE_OFFICER.helpText', 1,
 FALSE, NULL, NULL,
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Notes
(UUID(), 'GUARANTOR_NOTES', 'customFields.fields.GUARANTOR_NOTES.name', 'customFields.fields.GUARANTOR_NOTES.description',
 @guarantors_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL, NULL,
 12, 'customFields.fields.GUARANTOR_NOTES.placeholder', 'customFields.fields.GUARANTOR_NOTES.helpText', 2,
 FALSE, NULL, '{"maxLength": 1000}',
 NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- ================================================
-- Create Co-debtors section (repeatable)
-- ================================================
INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, section_description_key,
    step_id, section_type, min_rows, max_rows,
    display_order, collapsible, default_collapsed, columns,
    embed_mode, embed_target_type, embed_target_code,
    embed_show_separator, embed_collapsible, embed_separator_title_key,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES (
    UUID(),
    'CODEBTORS',
    'customFields.sections.CODEBTORS.name',
    'customFields.sections.CODEBTORS.description',
    @step_id, 'REPEATABLE', 0, 5,
    2, TRUE, TRUE, 2,
    'AFTER_SECTION', 'SECTION', 'PARTIES',
    TRUE, TRUE, 'customFields.sections.CODEBTORS.separatorTitle',
    TRUE, TRUE, TRUE, TRUE,
    TRUE, 'SYSTEM'
);

SET @codebtors_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'CODEBTORS' LIMIT 1);

-- Create fields for Co-debtors section
INSERT INTO custom_field_config_readmodel (
    id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type,
    data_source_type, data_source_code,
    display_order, placeholder_key, help_text_key, span_columns,
    is_required, validation_rules,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES
-- Co-debtor Name
(UUID(), 'CODEBTOR_NAME', 'customFields.fields.CODEBTOR_NAME.name', 'customFields.fields.CODEBTOR_NAME.description',
 @codebtors_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL,
 1, 'customFields.fields.CODEBTOR_NAME.placeholder', 'customFields.fields.CODEBTOR_NAME.helpText', 1,
 TRUE, '{"maxLength": 200}',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Co-debtor ID
(UUID(), 'CODEBTOR_ID', 'customFields.fields.CODEBTOR_ID.name', 'customFields.fields.CODEBTOR_ID.description',
 @codebtors_section_id, 'TEXT', 'TEXT_INPUT',
 NULL, NULL,
 2, 'customFields.fields.CODEBTOR_ID.placeholder', 'customFields.fields.CODEBTOR_ID.helpText', 1,
 TRUE, '{"maxLength": 30}',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Relationship
(UUID(), 'CODEBTOR_RELATIONSHIP', 'customFields.fields.CODEBTOR_RELATIONSHIP.name', 'customFields.fields.CODEBTOR_RELATIONSHIP.description',
 @codebtors_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'RELATIONSHIPS',
 3, 'customFields.fields.CODEBTOR_RELATIONSHIP.placeholder', 'customFields.fields.CODEBTOR_RELATIONSHIP.helpText', 1,
 FALSE, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Percentage of Liability
(UUID(), 'CODEBTOR_LIABILITY_PCT', 'customFields.fields.CODEBTOR_LIABILITY_PCT.name', 'customFields.fields.CODEBTOR_LIABILITY_PCT.description',
 @codebtors_section_id, 'NUMBER', 'PERCENTAGE',
 NULL, NULL,
 4, 'customFields.fields.CODEBTOR_LIABILITY_PCT.placeholder', 'customFields.fields.CODEBTOR_LIABILITY_PCT.helpText', 1,
 FALSE, '{"min": 0, "max": 100, "decimals": 2}',
 TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

-- ================================================
-- Example: Additional Info step (separate step)
-- ================================================
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, embed_swift_step, is_active, created_by
) VALUES (
    UUID(),
    'ADDITIONAL_INFO',
    'customFields.steps.ADDITIONAL_INFO.name',
    'customFields.steps.ADDITIONAL_INFO.description',
    'LC_IMPORT', NULL, 200, 'FiInfo',
    TRUE, TRUE, TRUE, TRUE,
    'SEPARATE_STEP', NULL, TRUE, 'SYSTEM'
);

SET @additional_step_id = (SELECT id FROM custom_field_step_config_readmodel WHERE step_code = 'ADDITIONAL_INFO' LIMIT 1);

-- Create Internal Classification section
INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, section_description_key,
    step_id, section_type, min_rows, max_rows,
    display_order, collapsible, default_collapsed, columns,
    embed_mode,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES (
    UUID(),
    'INTERNAL_CLASSIFICATION',
    'customFields.sections.INTERNAL_CLASSIFICATION.name',
    'customFields.sections.INTERNAL_CLASSIFICATION.description',
    @additional_step_id, 'SINGLE', 0, 1,
    1, FALSE, FALSE, 2,
    'NONE',
    TRUE, TRUE, TRUE, TRUE,
    TRUE, 'SYSTEM'
);

SET @classification_section_id = (SELECT id FROM custom_field_section_config_readmodel WHERE section_code = 'INTERNAL_CLASSIFICATION' LIMIT 1);

-- Create fields for Internal Classification
INSERT INTO custom_field_config_readmodel (
    id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type,
    data_source_type, data_source_code,
    display_order, placeholder_key, help_text_key, span_columns,
    is_required, validation_rules, field_options,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view, show_in_list,
    is_active, created_by
) VALUES
-- Priority Level
(UUID(), 'PRIORITY_LEVEL', 'customFields.fields.PRIORITY_LEVEL.name', 'customFields.fields.PRIORITY_LEVEL.description',
 @classification_section_id, 'SELECT', 'SELECT',
 NULL, NULL,
 1, 'customFields.fields.PRIORITY_LEVEL.placeholder', 'customFields.fields.PRIORITY_LEVEL.helpText', 1,
 FALSE, NULL, '[{"value": "LOW", "labelKey": "customFields.options.priority.LOW"}, {"value": "NORMAL", "labelKey": "customFields.options.priority.NORMAL"}, {"value": "HIGH", "labelKey": "customFields.options.priority.HIGH"}, {"value": "URGENT", "labelKey": "customFields.options.priority.URGENT"}]',
 TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Assigned Officer
(UUID(), 'ASSIGNED_OFFICER', 'customFields.fields.ASSIGNED_OFFICER.name', 'customFields.fields.ASSIGNED_OFFICER.description',
 @classification_section_id, 'SELECT', 'USER_LISTBOX',
 'USER', NULL,
 2, 'customFields.fields.ASSIGNED_OFFICER.placeholder', 'customFields.fields.ASSIGNED_OFFICER.helpText', 1,
 FALSE, NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Risk Category
(UUID(), 'RISK_CATEGORY', 'customFields.fields.RISK_CATEGORY.name', 'customFields.fields.RISK_CATEGORY.description',
 @classification_section_id, 'SELECT', 'CATALOG_LISTBOX',
 'CATALOG', 'RISK_CATEGORIES',
 3, 'customFields.fields.RISK_CATEGORY.placeholder', 'customFields.fields.RISK_CATEGORY.helpText', 1,
 FALSE, NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Internal Notes
(UUID(), 'INTERNAL_NOTES', 'customFields.fields.INTERNAL_NOTES.name', 'customFields.fields.INTERNAL_NOTES.description',
 @classification_section_id, 'TEXT', 'MULTILINE_TEXT',
 NULL, NULL,
 4, 'customFields.fields.INTERNAL_NOTES.placeholder', 'customFields.fields.INTERNAL_NOTES.helpText', 2,
 FALSE, '{"maxLength": 2000}', NULL,
 TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, 'SYSTEM'),

-- Follow-up Date
(UUID(), 'FOLLOWUP_DATE', 'customFields.fields.FOLLOWUP_DATE.name', 'customFields.fields.FOLLOWUP_DATE.description',
 @classification_section_id, 'DATE', 'DATE_PICKER',
 NULL, NULL,
 5, 'customFields.fields.FOLLOWUP_DATE.placeholder', 'customFields.fields.FOLLOWUP_DATE.helpText', 1,
 FALSE, NULL, NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- Tags
(UUID(), 'TAGS', 'customFields.fields.TAGS.name', 'customFields.fields.TAGS.description',
 @classification_section_id, 'TEXT', 'TAGS_INPUT',
 NULL, NULL,
 6, 'customFields.fields.TAGS.placeholder', 'customFields.fields.TAGS.helpText', 1,
 FALSE, '{"maxTags": 10}', NULL,
 TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');
