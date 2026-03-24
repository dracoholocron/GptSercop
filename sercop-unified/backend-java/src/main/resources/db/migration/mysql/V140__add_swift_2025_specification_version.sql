-- ==================================================
-- Migration V140: Add SWIFT 2025 Specification Version
-- ==================================================
-- Creates 2025 version records for MT700 fields.
-- The 2025 release (November 2025) includes format changes for
-- transport location fields (44A, 44E, 44F, 44B) from 65x to 140z.
--
-- This allows version comparison between:
-- - 2024: Original specification
-- - 2025: Format changes for transport locations
-- - 2026: Major changes with structured applicant/beneficiary fields
-- ==================================================

-- First, add 2025 version to the spec version registry
INSERT INTO swift_spec_version_readmodel (version_code, version_name, effective_date, is_current, release_notes)
VALUES ('2025', 'SWIFT Standards Release November 2025', '2025-11-16', FALSE, 'Transport location fields format extended from 65x to 140z')
ON DUPLICATE KEY UPDATE version_name = VALUES(version_name);

-- Insert 2025 version records by copying from 2024 and adjusting where needed
-- This creates a complete set of 2025 fields for Spanish language

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    placeholder, validation_rules, dependencies, contextual_alerts,
    field_options, default_value, help_text, documentation_url,
    draft_field_mapping, spec_version, effective_date, deprecated_date,
    successor_field_code, spec_notes, swift_format, swift_status,
    swift_definition_en, swift_usage_notes, created_at, created_by
)
SELECT
    UUID() as id,
    field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    placeholder, validation_rules, dependencies, contextual_alerts,
    field_options, default_value, help_text, documentation_url,
    draft_field_mapping,
    '2025' as spec_version,
    '2025-11-16' as effective_date,
    NULL as deprecated_date,
    NULL as successor_field_code,
    'SWIFT Standards MT November 2025 Release' as spec_notes,
    swift_format, swift_status, swift_definition_en, swift_usage_notes,
    NOW() as created_at,
    'SYSTEM-MIGRATION' as created_by
FROM swift_field_config_readmodel
WHERE message_type = 'MT700'
  AND spec_version = '2024'
  AND language = 'es'
  AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel sfc2
    WHERE sfc2.field_code = swift_field_config_readmodel.field_code
      AND sfc2.message_type = 'MT700'
      AND sfc2.spec_version = '2025'
      AND sfc2.language = 'es'
  );

-- Insert 2025 version records for English language
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    placeholder, validation_rules, dependencies, contextual_alerts,
    field_options, default_value, help_text, documentation_url,
    draft_field_mapping, spec_version, effective_date, deprecated_date,
    successor_field_code, spec_notes, swift_format, swift_status,
    swift_definition_en, swift_usage_notes, created_at, created_by
)
SELECT
    UUID() as id,
    field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    placeholder, validation_rules, dependencies, contextual_alerts,
    field_options, default_value, help_text, documentation_url,
    draft_field_mapping,
    '2025' as spec_version,
    '2025-11-16' as effective_date,
    NULL as deprecated_date,
    NULL as successor_field_code,
    'SWIFT Standards MT November 2025 Release' as spec_notes,
    swift_format, swift_status, swift_definition_en, swift_usage_notes,
    NOW() as created_at,
    'SYSTEM-MIGRATION' as created_by
FROM swift_field_config_readmodel
WHERE message_type = 'MT700'
  AND spec_version = '2024'
  AND language = 'en'
  AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel sfc2
    WHERE sfc2.field_code = swift_field_config_readmodel.field_code
      AND sfc2.message_type = 'MT700'
      AND sfc2.spec_version = '2025'
      AND sfc2.language = 'en'
  );

-- ==================================================
-- Update 2025 fields with format changes
-- November 2025 release changed transport location fields from 65x to 140z
-- ==================================================

-- :44A: Place of Taking in Charge (format changed from 65x to 140z)
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_definition_en = 'Place of Taking in Charge/Dispatch from .../Place of Receipt - Location for transport (format extended in 2025)',
    spec_notes = 'Format changed from 65x to 140z in November 2025 release to allow longer location names'
WHERE field_code = ':44A:' AND message_type = 'MT700' AND spec_version = '2025';

-- :44E: Port of Loading/Airport of Departure (format changed from 65x to 140z)
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_definition_en = 'Port of Loading/Airport of Departure - Origin location for transport (format extended in 2025)',
    spec_notes = 'Format changed from 65x to 140z in November 2025 release to allow longer location names'
WHERE field_code = ':44E:' AND message_type = 'MT700' AND spec_version = '2025';

-- :44F: Port of Discharge/Airport of Destination (format changed from 65x to 140z)
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_definition_en = 'Port of Discharge/Airport of Destination - Destination location for transport (format extended in 2025)',
    spec_notes = 'Format changed from 65x to 140z in November 2025 release to allow longer location names'
WHERE field_code = ':44F:' AND message_type = 'MT700' AND spec_version = '2025';

-- :44B: Place of Final Destination (format changed from 65x to 140z)
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_definition_en = 'Place of Final Destination/For Transportation to .../Place of Delivery - Final destination location (format extended in 2025)',
    spec_notes = 'Format changed from 65x to 140z in November 2025 release to allow longer location names'
WHERE field_code = ':44B:' AND message_type = 'MT700' AND spec_version = '2025';

-- ==================================================
-- Update validation rules for 2025 fields with new format
-- ==================================================

-- Update validation maxLength for fields that changed from 65x to 140z
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.maxLength', 140
)
WHERE field_code IN (':44A:', ':44E:', ':44F:', ':44B:')
  AND message_type = 'MT700'
  AND spec_version = '2025';

-- ==================================================
-- Also update 2024 version to mark correct format
-- ==================================================

-- Ensure 2024 fields have the original 65x format
UPDATE swift_field_config_readmodel
SET swift_format = '65x',
    spec_notes = 'Original format - changed to 140z in November 2025 release'
WHERE field_code IN (':44A:', ':44E:', ':44F:', ':44B:')
  AND message_type = 'MT700'
  AND spec_version = '2024';
