-- =====================================================
-- V151: Update ALL swift_field_config to use i18n translation keys
-- =====================================================
-- Ensures ALL records (active and inactive) have i18n keys
-- Pattern: swift.{messageType}.{fieldCode}.{property}
-- =====================================================

-- Update ALL swift field configs to use i18n keys (without conditions)
-- This ensures ALL columns get the correct i18n key pattern
UPDATE swift_field_config_readmodel
SET
    field_name_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.fieldName'),
    description_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.description'),
    placeholder_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.placeholder'),
    help_text_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.helpText'),
    updated_at = NOW(),
    updated_by = 'V151_I18N_ALL'
WHERE message_type IS NOT NULL;

-- Verify the update
SELECT
    message_type,
    COUNT(*) as total_records,
    SUM(CASE WHEN field_name_key LIKE 'swift.%' THEN 1 ELSE 0 END) as field_name_ok,
    SUM(CASE WHEN description_key LIKE 'swift.%' THEN 1 ELSE 0 END) as description_ok
FROM swift_field_config_readmodel
GROUP BY message_type
ORDER BY message_type;
