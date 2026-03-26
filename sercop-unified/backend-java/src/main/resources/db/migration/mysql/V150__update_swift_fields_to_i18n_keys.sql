-- =====================================================
-- V150: Update swift_field_config to use i18n translation keys
-- =====================================================
-- Changes fieldNameKey, descriptionKey, placeholderKey, helpTextKey
-- from hardcoded text to i18n translation keys for ALL records.
-- Pattern: swift.{messageType}.{fieldCode}.{property}
-- =====================================================

-- Update ALL swift field configs to use i18n keys based on message_type
-- This uses LOWER() to normalize the message type for the key pattern

SET @has_field_name_key := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'swift_field_config_readmodel'
      AND column_name = 'field_name_key'
);
SET @sql_field_name_key := IF(
    @has_field_name_key = 0,
    'ALTER TABLE swift_field_config_readmodel ADD COLUMN field_name_key VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt_field_name_key FROM @sql_field_name_key;
EXECUTE stmt_field_name_key;
DEALLOCATE PREPARE stmt_field_name_key;

SET @has_description_key := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'swift_field_config_readmodel'
      AND column_name = 'description_key'
);
SET @sql_description_key := IF(
    @has_description_key = 0,
    'ALTER TABLE swift_field_config_readmodel ADD COLUMN description_key VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt_description_key FROM @sql_description_key;
EXECUTE stmt_description_key;
DEALLOCATE PREPARE stmt_description_key;

SET @has_placeholder_key := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'swift_field_config_readmodel'
      AND column_name = 'placeholder_key'
);
SET @sql_placeholder_key := IF(
    @has_placeholder_key = 0,
    'ALTER TABLE swift_field_config_readmodel ADD COLUMN placeholder_key VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt_placeholder_key FROM @sql_placeholder_key;
EXECUTE stmt_placeholder_key;
DEALLOCATE PREPARE stmt_placeholder_key;

SET @has_help_text_key := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'swift_field_config_readmodel'
      AND column_name = 'help_text_key'
);
SET @sql_help_text_key := IF(
    @has_help_text_key = 0,
    'ALTER TABLE swift_field_config_readmodel ADD COLUMN help_text_key VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt_help_text_key FROM @sql_help_text_key;
EXECUTE stmt_help_text_key;
DEALLOCATE PREPARE stmt_help_text_key;

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
