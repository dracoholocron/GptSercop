-- =====================================================
-- V152: Fix i18n keys format - remove colons from field codes
-- =====================================================
-- i18next uses ':' as namespace separator, so we need to
-- remove colons from the field code in the key pattern.
-- Pattern: swift.{messageType}.{fieldCodeWithoutColons}.{property}
-- Example: :20: -> 20, :31D: -> 31D
-- =====================================================

-- Update ALL swift field configs to use clean i18n keys (without colons)
UPDATE swift_field_config_readmodel
SET
    field_name_key = CONCAT('swift.', LOWER(message_type), '.', REPLACE(field_code, ':', ''), '.fieldName'),
    description_key = CONCAT('swift.', LOWER(message_type), '.', REPLACE(field_code, ':', ''), '.description'),
    placeholder_key = CONCAT('swift.', LOWER(message_type), '.', REPLACE(field_code, ':', ''), '.placeholder'),
    help_text_key = CONCAT('swift.', LOWER(message_type), '.', REPLACE(field_code, ':', ''), '.helpText'),
    updated_at = NOW(),
    updated_by = 'V152_FIX_I18N_KEYS'
WHERE message_type IS NOT NULL;

-- Verify the update - sample records
SELECT field_code, field_name_key, description_key
FROM swift_field_config_readmodel
WHERE field_code IN (':20:', ':31D:', ':32B:')
AND is_active = 1
LIMIT 10;
