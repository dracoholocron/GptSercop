-- ==================================================
-- Migration V69: Update all :20: fields to use SwiftReferenceField
-- ==================================================
-- Changes the component_type for field :20: (Sender's Reference)
-- in ALL message types to use SwiftReferenceField which allows
-- auto-generation of reference numbers.
-- ==================================================

-- MT700 - Documentary Credit Issuance (LC Import)
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_IMPORT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT700'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT707 - Amendment to Documentary Credit (LC Amendment)
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_AMENDMENT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT707'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT710 - Advice of Third Bank's Documentary Credit (LC Export Advice)
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "E", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_EXPORT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT710'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT720 - Transfer of Documentary Credit (LC Transfer)
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_TRANSFER", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT720'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT730 - Acknowledgement (LC Acknowledgement)
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_ACKNOWLEDGEMENT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT730'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT740 - Authorisation to Reimburse
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_REIMBURSEMENT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT740'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT747 - Amendment to Authorisation to Reimburse
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_REIMBURSEMENT_AMENDMENT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT747'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT750 - Advice of Discrepancy
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_DISCREPANCY", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT750'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT752 - Authorisation to Pay, Accept or Negotiate
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_PAYMENT_AUTH", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT752'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT754 - Advice of Payment/Acceptance/Negotiation
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_PAYMENT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT754'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT756 - Advice of Reimbursement or Payment
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_REIMBURSEMENT_ADVICE", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT756'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT799 - Free Format Message (LC)
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "M", "countryCode": "E", "agencyCode": "0001", "entityType": "LC_FREE_MESSAGE", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT799'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- ==================================================
-- Documentary Collections (MT4xx)
-- ==================================================

-- MT400 - Advice of Payment
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT400'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT410 - Acknowledgement
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_ACK", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT410'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT412 - Advice of Acceptance
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_ACCEPTANCE", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT412'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT416 - Advice of Non-Payment/Non-Acceptance
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_NON_PAYMENT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT416'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT420 - Tracer
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_TRACER", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT420'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT422 - Advice of Fate and Request for Instructions
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_FATE", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT422'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT430 - Amendment of Instructions
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_AMENDMENT", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT430'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT490 - Advice of Charges, Interest and Other Adjustments
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_CHARGES", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT490'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- MT499 - Free Format Message (Collections)
UPDATE swift_field_config_readmodel
SET component_type = 'SwiftReferenceField',
    field_options = '{"productCode": "O", "countryCode": "E", "agencyCode": "0001", "entityType": "COLLECTION_FREE_MESSAGE", "showPreview": true, "autoGenerate": false}'
WHERE field_code = ':20:'
  AND message_type = 'MT499'
  AND (component_type IS NULL OR component_type = 'TEXT_INPUT');

-- ==================================================
-- End of migration V69
-- ==================================================
