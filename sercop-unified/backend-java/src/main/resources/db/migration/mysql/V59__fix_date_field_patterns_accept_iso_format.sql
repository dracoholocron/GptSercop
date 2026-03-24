-- ==================================================
-- Migration V59: Fix Date Field Validations
-- ==================================================
-- 1. Updates patterns to accept both ISO (YYYY-MM-DD) and SWIFT (YYMMDD) formats
-- 2. Adds minDateField validation for date relationships (e.g., expiry > issue date)
--
-- Uses JSON_SET to preserve existing validation rules while adding new properties
-- ==================================================

-- ============================================
-- SECCIÓN 1: MT700 - Issue of Documentary Credit
-- ============================================

-- Campo :31C: Date of Issue - Accept both ISO and YYMMDD
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Formato de fecha: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10
)
WHERE field_code = ':31C:' AND message_type = 'MT700';

-- Campo :31D: Date and Place of Expiry
-- minDateField validates that expiry date > issue date
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,29}$',
    '$.patternMessage', 'Formato: YYMMDD o YYYY-MM-DD seguido de lugar de vencimiento (max 29 caracteres)',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 39,
    '$.minDateField', ':31C:',
    '$.minDateMessage', 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':31D:' AND message_type = 'MT700';

-- Campo :44C: Latest Date of Shipment
-- Shipment date must be after issue date and before expiry
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Fecha límite de embarque. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10,
    '$.minDateField', ':31C:',
    '$.minDateMessage', 'La fecha de embarque debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':44C:' AND message_type = 'MT700';

-- ============================================
-- SECCIÓN 2: MT707 - Amendment to Documentary Credit
-- ============================================

-- Campo :30: Date of Amendment
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Fecha de enmienda. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10
)
WHERE field_code = ':30:' AND message_type = 'MT707';

-- Campo :31C: Date of Issue (original)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Fecha de emisión original. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10
)
WHERE field_code = ':31C:' AND message_type = 'MT707';

-- Campo :31E: New Date of Expiry
-- New expiry must be after amendment date
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Nueva fecha de vencimiento. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10,
    '$.minDateField', ':30:',
    '$.minDateMessage', 'La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda'
)
WHERE field_code = ':31E:' AND message_type = 'MT707';

-- ============================================
-- SECCIÓN 3: MT710 - Advice of Third Bank's Documentary Credit
-- ============================================

-- Campo :31C: Date of Issue
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Fecha de emisión. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10
)
WHERE field_code = ':31C:' AND message_type = 'MT710';

-- Campo :31D: Date and Place of Expiry
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,29}$',
    '$.patternMessage', 'Formato: YYMMDD o YYYY-MM-DD + lugar (max 29 chars)',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 39,
    '$.minDateField', ':31C:',
    '$.minDateMessage', 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':31D:' AND message_type = 'MT710';

-- ============================================
-- SECCIÓN 4: MT760 - Guarantee / Standby LC
-- ============================================

-- Campo :30: Date of Issue
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Fecha de emisión. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10
)
WHERE field_code = ':30:' AND message_type = 'MT760';

-- ============================================
-- SECCIÓN 5: MT767 - Guarantee Amendment
-- ============================================

-- Campo :30: Date of Amendment (if exists)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Fecha de enmienda. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10
)
WHERE field_code = ':30:' AND message_type = 'MT767';

-- Campo :31D: New Expiry Date
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Nueva fecha de vencimiento. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10,
    '$.minDateField', ':30:',
    '$.minDateMessage', 'La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda'
)
WHERE field_code = ':31D:' AND message_type = 'MT767';

-- ============================================
-- SECCIÓN 6: MT412 - Advice of Acceptance
-- ============================================

-- Campo :33a: Date of Acceptance
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    '$.patternMessage', 'Fecha de aceptación. Formato: YYMMDD o YYYY-MM-DD',
    '$.dateFormat', 'YYMMDD',
    '$.maxLength', 10
)
WHERE field_code = ':33a:' AND message_type = 'MT412';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT
    field_code,
    message_type,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.pattern')) as pattern,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.dateFormat')) as dateFormat,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.minDateField')) as minDateField,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.minDateMessage')) as minDateMessage
FROM swift_field_config_readmodel
WHERE field_code IN (':31C:', ':31D:', ':30:', ':31E:', ':44C:', ':33a:')
  AND language = 'es'
ORDER BY message_type, field_code;

-- ================================================
-- End of migration V59
-- ================================================
