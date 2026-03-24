-- =============================================================================
-- Migration V269: Add "Por Cuenta de" custom field for LC_IMPORT PARTIES section
-- Description: Adds a non-SWIFT participant field that looks like :50: Ordenante
--              but represents the "On Account Of" / "Por Cuenta de" party
-- =============================================================================

-- Step: Embed in PARTIES for LC_IMPORT only
INSERT INTO custom_field_step_config_readmodel (
    id, step_code, step_name_key, step_description_key,
    product_type, tenant_id, display_order, icon,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    embed_mode, embed_swift_step, is_active, created_by
) VALUES (
    UUID(),
    'LC_IMPORT_ON_BEHALF_OF',
    'customFields.steps.LC_IMPORT_ON_BEHALF_OF.name',
    'customFields.steps.LC_IMPORT_ON_BEHALF_OF.description',
    'LC_IMPORT', NULL, 50, 'FiUser',
    TRUE, TRUE, TRUE, TRUE,
    'EMBEDDED_IN_SWIFT', 'PARTIES', TRUE, 'SYSTEM'
) ON DUPLICATE KEY UPDATE step_name_key = VALUES(step_name_key);

SET @step_id = (SELECT id FROM custom_field_step_config_readmodel
                WHERE step_code = 'LC_IMPORT_ON_BEHALF_OF' AND product_type = 'LC_IMPORT' LIMIT 1);

-- Section: Single section embedded after PARTIES SWIFT section (before GUARANTORS)
INSERT INTO custom_field_section_config_readmodel (
    id, section_code, section_name_key, section_description_key,
    step_id, section_type, min_rows, max_rows,
    display_order, collapsible, default_collapsed, `columns`,
    embed_mode, embed_target_type, embed_target_code,
    embed_show_separator, embed_collapsible, embed_separator_title_key,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES (
    UUID(),
    'ON_BEHALF_OF',
    'customFields.sections.ON_BEHALF_OF.name',
    'customFields.sections.ON_BEHALF_OF.description',
    @step_id, 'SINGLE', 0, 1,
    0, FALSE, FALSE, 2,
    'AFTER_SECTION', 'SECTION', 'PARTIES',
    FALSE, FALSE, 'customFields.sections.ON_BEHALF_OF.separatorTitle',
    TRUE, TRUE, TRUE, TRUE,
    TRUE, 'SYSTEM'
) ON DUPLICATE KEY UPDATE section_name_key = VALUES(section_name_key);

SET @section_id = (SELECT id FROM custom_field_section_config_readmodel
                   WHERE section_code = 'ON_BEHALF_OF' AND step_id = @step_id LIMIT 1);

-- Field: "Por Cuenta de" - PARTICIPANT_SELECTOR (same concept as :50: Ordenante)
INSERT INTO custom_field_config_readmodel (
    id, field_code, field_name_key, field_description_key,
    section_id, field_type, component_type,
    data_source_type, data_source_code, data_source_filters,
    display_order, placeholder_key, help_text_key, span_columns,
    is_required, required_condition, validation_rules,
    default_value, field_options,
    embed_after_swift_field, embed_inline,
    show_in_wizard, show_in_expert, show_in_custom, show_in_view,
    is_active, created_by
) VALUES (
    UUID(),
    'POR_CUENTA_DE',
    'customFields.fields.POR_CUENTA_DE.name',
    'customFields.fields.POR_CUENTA_DE.description',
    @section_id, 'TEXT', 'PARTICIPANT_SELECTOR',
    NULL, NULL, NULL,
    1, 'customFields.fields.POR_CUENTA_DE.placeholder',
    'customFields.fields.POR_CUENTA_DE.helpText', 2,
    FALSE, NULL, NULL,
    NULL, NULL,
    NULL, FALSE,
    TRUE, TRUE, TRUE, TRUE,
    TRUE, 'SYSTEM'
) ON DUPLICATE KEY UPDATE field_name_key = VALUES(field_name_key);
