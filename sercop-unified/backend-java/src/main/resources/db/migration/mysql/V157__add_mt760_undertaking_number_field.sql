-- ==================================================
-- Migration V157: Add missing :20: (Undertaking Number) field for MT760
-- ==================================================
-- The :20: field (Undertaking Number) is MANDATORY in the official SWIFT
-- specification for MT760, but was omitted by the SRG parser in migrations
-- V142 (2025) and V143 (2026).
--
-- This migration inserts the missing :20: field for MT760 in spec_versions
-- 2025 and 2026, based on the official SWIFT specification:
-- - Field: :20: Undertaking Number
-- - Format: 16x
-- - Status: M (Mandatory)
-- - Definition: Specifies the unique and unambiguous undertaking identifier
--
-- The field uses SwiftReferenceField component for reference generation.
-- ==================================================

-- Insert :20: for MT760 spec_version 2025
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, spec_version, effective_date,
    field_options, created_at, created_by
) SELECT
    UUID(),
    ':20:',
    'swift.mt760.20.fieldName',
    'swift.mt760.20.description',
    'MT760',
    'BASIC',
    1,
    1,
    1,
    'TEXT',
    'SwiftReferenceField',
    '16x',
    'M',
    '2025',
    '2025-11-16',
    '{"productCode": "B", "countryCode": "E", "agencyCode": "0001", "entityType": "GUARANTEE", "showPreview": true, "autoGenerate": false}',
    NOW(),
    'V157_ADD_MT760_20'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT760'
    AND spec_version = '2025'
);

-- Insert :20: for MT760 spec_version 2026
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, spec_version, effective_date,
    field_options, created_at, created_by
) SELECT
    UUID(),
    ':20:',
    'swift.mt760.20.fieldName',
    'swift.mt760.20.description',
    'MT760',
    'BASIC',
    1,
    1,
    1,
    'TEXT',
    'SwiftReferenceField',
    '16x',
    'M',
    '2026',
    '2026-11-15',
    '{"productCode": "B", "countryCode": "E", "agencyCode": "0001", "entityType": "GUARANTEE", "showPreview": true, "autoGenerate": false}',
    NOW(),
    'V157_ADD_MT760_20'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT760'
    AND spec_version = '2026'
);

-- ==================================================
-- End of migration V157
-- ==================================================
