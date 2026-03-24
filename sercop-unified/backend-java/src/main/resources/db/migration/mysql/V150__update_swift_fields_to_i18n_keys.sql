-- =====================================================
-- V150: Update swift_field_config to use i18n translation keys
-- =====================================================
-- Changes fieldNameKey, descriptionKey, placeholderKey, helpTextKey
-- from hardcoded text to i18n translation keys for ALL records.
-- Pattern: swift.{messageType}.{fieldCode}.{property}
-- =====================================================

-- Update ALL swift field configs to use i18n keys based on message_type
-- This uses LOWER() to normalize the message type for the key pattern

UPDATE swift_field_config_readmodel
SET
    field_name_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.fieldName'),
    description_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.description'),
    placeholder_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.placeholder'),
    help_text_key = CONCAT('swift.', LOWER(message_type), '.', field_code, '.helpText'),
    updated_at = NOW(),
    updated_by = 'V150_I18N_MIGRATION'
WHERE message_type IS NOT NULL;

-- Verify the update - show sample records
SELECT message_type, field_code, field_name_key, is_active, spec_version
FROM swift_field_config_readmodel
WHERE field_code = ':20:'
ORDER BY message_type, spec_version, is_active DESC;
