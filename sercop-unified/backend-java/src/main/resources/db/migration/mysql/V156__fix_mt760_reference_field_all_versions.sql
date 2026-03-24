-- ==================================================
-- Migration V156: Fix MT760 :20: field to use SwiftReferenceField
-- ==================================================
-- The field :20: (Sender's Reference) in MT760 should use the
-- SwiftReferenceField component to allow auto-generation of reference
-- numbers, just like MT700 and other message types.
--
-- Previous migrations (V67, V69) updated the field but didn't specify
-- spec_version, so only original records were updated. Newer versions
-- (2024, 2025, 2026) still have component_type = 'INPUT'.
--
-- This migration updates ALL versions of :20: in MT760 to use
-- SwiftReferenceField with the same configuration as MT700.
-- ==================================================

-- Update :20: field in MT760 (ALL spec_versions) to use SwiftReferenceField
UPDATE swift_field_config_readmodel
SET
    component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "B", "countryCode": "E", "agencyCode": "0001", "entityType": "GUARANTEE", "showPreview": true, "autoGenerate": false}',
    updated_at = NOW(),
    updated_by = 'V156_FIX_MT760_REFERENCE'
WHERE field_code = ':20:'
  AND message_type = 'MT760';

-- Also update MT767 (Guarantee Amendment) to use SwiftReferenceField
-- for consistency with MT760
UPDATE swift_field_config_readmodel
SET
    component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "B", "countryCode": "E", "agencyCode": "0001", "entityType": "GUARANTEE_AMENDMENT", "showPreview": true, "autoGenerate": false}',
    updated_at = NOW(),
    updated_by = 'V156_FIX_MT760_REFERENCE'
WHERE field_code = ':20:'
  AND message_type = 'MT767';

-- ==================================================
-- End of migration V156
-- ==================================================
