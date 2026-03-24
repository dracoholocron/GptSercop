-- Move GUARANTORS, CODEBTORS, and ON_BEHALF_OF sections to the RISK_DATA step
-- These sections were under ADDITIONAL_PARTIES and LC_IMPORT_ON_BEHALF_OF steps
-- but logically belong under Datos de Riesgo

-- Get the RISK_DATA step ID
SET @risk_data_step_id = (
    SELECT id FROM custom_field_step_config_readmodel
    WHERE step_code = 'RISK_DATA' AND is_active = TRUE
    LIMIT 1
);

-- Move GUARANTORS section to RISK_DATA
UPDATE custom_field_section_config_readmodel
SET step_id = @risk_data_step_id,
    display_order = 10,
    updated_at = NOW(),
    updated_by = 'V20260223_MIGRATION'
WHERE section_code = 'GUARANTORS' AND is_active = TRUE;

-- Move CODEBTORS section to RISK_DATA
UPDATE custom_field_section_config_readmodel
SET step_id = @risk_data_step_id,
    display_order = 20,
    updated_at = NOW(),
    updated_by = 'V20260223_MIGRATION'
WHERE section_code = 'CODEBTORS' AND is_active = TRUE;

-- Move ON_BEHALF_OF section to RISK_DATA
UPDATE custom_field_section_config_readmodel
SET step_id = @risk_data_step_id,
    display_order = 30,
    updated_at = NOW(),
    updated_by = 'V20260223_MIGRATION'
WHERE section_code = 'ON_BEHALF_OF' AND is_active = TRUE;
