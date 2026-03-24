-- =====================================================
-- V145: Fix SWIFT 2026 field types from SRG parser
-- =====================================================
-- The SRG parser imported 2026 fields with default types (TEXT/INPUT)
-- instead of preserving the specialized types (SELECT, INSTITUTION, etc.)
-- This migration copies field_type, component_type, and field_options
-- from version 2025 to 2026 for all affected fields.
-- =====================================================

-- Fix Spanish version fields
UPDATE swift_field_config_readmodel a
JOIN swift_field_config_readmodel b
    ON a.field_code = b.field_code
    AND a.message_type = b.message_type
    AND a.language = b.language
SET
    a.field_type = b.field_type,
    a.component_type = b.component_type,
    a.field_options = b.field_options
WHERE a.spec_version = '2026'
AND b.spec_version = '2025'
AND a.language = 'es'
AND (a.field_type != b.field_type OR a.component_type != b.component_type);

-- Fix English version fields (if any)
UPDATE swift_field_config_readmodel a
JOIN swift_field_config_readmodel b
    ON a.field_code = b.field_code
    AND a.message_type = b.message_type
    AND a.language = b.language
SET
    a.field_type = b.field_type,
    a.component_type = b.component_type,
    a.field_options = b.field_options
WHERE a.spec_version = '2026'
AND b.spec_version = '2025'
AND a.language = 'en'
AND (a.field_type != b.field_type OR a.component_type != b.component_type);
