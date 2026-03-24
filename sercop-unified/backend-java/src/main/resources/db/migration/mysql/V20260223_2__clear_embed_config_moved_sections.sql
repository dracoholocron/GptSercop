-- Clear embed configuration for sections moved to RISK_DATA
-- so they only appear under Datos de Riesgo, not duplicated in PARTIES

UPDATE custom_field_section_config_readmodel
SET embed_mode = 'NONE',
    embed_target_type = NULL,
    embed_target_code = NULL,
    embed_show_separator = FALSE,
    embed_collapsible = FALSE,
    embed_separator_title_key = NULL,
    updated_at = NOW(),
    updated_by = 'V20260223_2_MIGRATION'
WHERE section_code IN ('GUARANTORS', 'CODEBTORS', 'ON_BEHALF_OF')
  AND is_active = TRUE;
