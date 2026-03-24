-- ==================================================
-- Migration V60: Add minDateField validation to date fields
-- ==================================================
-- Adds minDateField validation for date relationships:
-- - Expiry date must be after issue date
-- - Shipment date must be after issue date
-- - Amendment expiry must be after amendment date
--
-- Uses JSON_SET to preserve existing validation rules
-- ==================================================

-- ============================================
-- MT700 - Issue of Documentary Credit
-- ============================================

-- Campo :31D: Date and Place of Expiry
-- La fecha de vencimiento debe ser posterior a la fecha de emisión (:31C:)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDateField', ':31C:',
    '$.minDateMessage', 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':31D:' AND message_type = 'MT700';

-- Campo :44C: Latest Date of Shipment
-- La fecha de embarque debe ser posterior a la fecha de emisión
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDateField', ':31C:',
    '$.minDateMessage', 'La fecha de embarque debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':44C:' AND message_type = 'MT700';

-- ============================================
-- MT707 - Amendment to Documentary Credit
-- ============================================

-- Campo :31E: New Date of Expiry
-- La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda (:30:)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDateField', ':30:',
    '$.minDateMessage', 'La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda'
)
WHERE field_code = ':31E:' AND message_type = 'MT707';

-- ============================================
-- MT710 - Advice of Third Bank's Documentary Credit
-- ============================================

-- Campo :31D: Date and Place of Expiry
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDateField', ':31C:',
    '$.minDateMessage', 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':31D:' AND message_type = 'MT710';

-- ============================================
-- MT767 - Guarantee Amendment
-- ============================================

-- Campo :31D: New Expiry Date
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDateField', ':30:',
    '$.minDateMessage', 'La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda'
)
WHERE field_code = ':31D:' AND message_type = 'MT767';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT
    field_code,
    message_type,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.minDateField')) as minDateField,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.minDateMessage')) as minDateMessage
FROM swift_field_config_readmodel
WHERE field_code IN (':31D:', ':31E:', ':44C:')
  AND language = 'es'
ORDER BY message_type, field_code;

-- ================================================
-- End of migration V60
-- ================================================
