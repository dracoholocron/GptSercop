-- ==================================================
-- Migration V67: Update MT760 :20: field to use SwiftReferenceField
-- ==================================================
-- Changes the component_type for field :20: (Sender's Reference)
-- in MT760 to use SwiftReferenceField which allows auto-generation.
-- ==================================================

-- Update :20: field in MT760 to use SwiftReferenceField
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "B", "countryCode": "E", "agencyCode": "0001", "entityType": "GUARANTEE", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT760';

-- Also update MT767 (Guarantee Amendment) to use SwiftReferenceField
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "B", "countryCode": "E", "agencyCode": "0001", "entityType": "GUARANTEE", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT767';

-- ==================================================
-- End of migration V67
-- ==================================================
