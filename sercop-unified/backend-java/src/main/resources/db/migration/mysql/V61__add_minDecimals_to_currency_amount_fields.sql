-- ==================================================
-- Migration V61: Add minDecimals to currency/amount fields
-- ==================================================
-- Adds minDecimals configuration for proper SWIFT amount formatting
-- SWIFT standard requires amounts to have decimal separator
-- minDecimals=2 ensures amounts like 50000 display as 50000,00
-- ==================================================

-- ============================================
-- MT700 - Issue of Documentary Credit
-- ============================================

-- Campo :32B: Currency Code, Amount
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDecimals', 2
)
WHERE field_code = ':32B:' AND message_type = 'MT700';

-- Campo :33B: Additional Amount Covered (if exists)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDecimals', 2
)
WHERE field_code = ':33B:' AND message_type = 'MT700';

-- ============================================
-- MT707 - Amendment to Documentary Credit
-- ============================================

-- Campo :32B: Increase of Credit Amount
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDecimals', 2
)
WHERE field_code = ':32B:' AND message_type = 'MT707';

-- Campo :33B: Decrease of Credit Amount
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDecimals', 2
)
WHERE field_code = ':33B:' AND message_type = 'MT707';

-- ============================================
-- MT710 - Advice of Third Bank's Documentary Credit
-- ============================================

-- Campo :32B: Currency Code, Amount
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDecimals', 2
)
WHERE field_code = ':32B:' AND message_type = 'MT710';

-- ============================================
-- MT760 - Guarantee / Standby LC
-- ============================================

-- Campo :32B: Currency Code, Amount
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDecimals', 2
)
WHERE field_code = ':32B:' AND message_type = 'MT760';

-- ============================================
-- MT767 - Guarantee Amendment
-- ============================================

-- Campo :32B: Increase/Decrease Amount
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.minDecimals', 2
)
WHERE field_code = ':32B:' AND message_type = 'MT767';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT
    field_code,
    message_type,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.minDecimals')) as minDecimals,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.maxDecimals')) as maxDecimals,
    JSON_UNQUOTE(JSON_EXTRACT(validation_rules, '$.decimalSeparator')) as decimalSeparator
FROM swift_field_config_readmodel
WHERE field_code IN (':32B:', ':33B:')
  AND language = 'es'
ORDER BY message_type, field_code;

-- ================================================
-- End of migration V61
-- ================================================
