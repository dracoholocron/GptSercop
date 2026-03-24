-- =====================================================
-- V146: Fix MT760 (Guarantees) field sections
-- =====================================================
-- The MT760 fields were imported with section 'GENERAL'
-- This migration assigns proper sections for the UI to render correctly
-- Section codes are in ENGLISH for consistency
-- =====================================================

-- BASIC - Basic Information
UPDATE swift_field_config_readmodel
SET section = 'BASIC', display_order =
    CASE field_code
        WHEN ':20:' THEN 1
        WHEN ':22A:' THEN 2
        WHEN ':22D:' THEN 3
        WHEN ':22K:' THEN 4
        WHEN ':27:' THEN 5
        WHEN ':40C:' THEN 6
        ELSE display_order
    END
WHERE message_type = 'MT760'
AND field_code IN (':20:', ':22A:', ':22D:', ':22K:', ':27:', ':40C:');

-- DATES - Dates
UPDATE swift_field_config_readmodel
SET section = 'DATES', display_order =
    CASE field_code
        WHEN ':30:' THEN 1
        WHEN ':31C:' THEN 2
        WHEN ':23B:' THEN 3
        WHEN ':31E:' THEN 4
        WHEN ':35G:' THEN 5
        WHEN ':31S:' THEN 6
    END
WHERE message_type = 'MT760'
AND field_code IN (':30:', ':31C:', ':23B:', ':31E:', ':35G:', ':31S:');

-- AMOUNTS - Amounts
UPDATE swift_field_config_readmodel
SET section = 'AMOUNTS', display_order =
    CASE field_code
        WHEN ':32B:' THEN 1
        WHEN ':39F:' THEN 2
        WHEN ':39D:' THEN 3
        WHEN ':39E:' THEN 4
        WHEN ':71D:' THEN 5
    END
WHERE message_type = 'MT760'
AND field_code IN (':32B:', ':39F:', ':39D:', ':39E:', ':71D:');

-- BANKS - Banks/Parties
UPDATE swift_field_config_readmodel
SET section = 'BANKS', display_order =
    CASE field_code
        WHEN ':50:' THEN 1
        WHEN ':51:' THEN 2
        WHEN ':52a:' THEN 3
        WHEN ':59a:' THEN 4
        WHEN ':59:' THEN 5
        WHEN ':56a:' THEN 6
        WHEN ':57a:' THEN 7
        WHEN ':41a:' THEN 8
        WHEN ':58a:' THEN 9
        WHEN ':23:' THEN 10
    END
WHERE message_type = 'MT760'
AND field_code IN (':50:', ':51:', ':52a:', ':59a:', ':59:', ':56a:', ':57a:', ':41a:', ':58a:', ':23:');

-- TERMS - Terms and Conditions
UPDATE swift_field_config_readmodel
SET section = 'TERMS', display_order =
    CASE field_code
        WHEN ':45C:' THEN 1
        WHEN ':77U:' THEN 2
        WHEN ':77L:' THEN 3
        WHEN ':49:' THEN 4
        WHEN ':44H:' THEN 5
        WHEN ':44J:' THEN 6
        WHEN ':22Y:' THEN 7
        WHEN ':40D:' THEN 8
        WHEN ':45L:' THEN 9
    END
WHERE message_type = 'MT760'
AND field_code IN (':45C:', ':77U:', ':77L:', ':49:', ':44H:', ':44J:', ':22Y:', ':40D:', ':45L:');

-- ADDITIONAL - Additional Information
UPDATE swift_field_config_readmodel
SET section = 'ADDITIONAL', display_order =
    CASE field_code
        WHEN ':15A:' THEN 1
        WHEN ':15B:' THEN 2
        WHEN ':15C:' THEN 3
        WHEN ':23X:' THEN 4
        WHEN ':72Z:' THEN 5
        WHEN ':23F:' THEN 6
        WHEN ':78:' THEN 7
        WHEN ':26E:' THEN 8
        WHEN ':48B:' THEN 9
        WHEN ':48D:' THEN 10
        WHEN ':24E:' THEN 11
        WHEN ':24G:' THEN 12
    END
WHERE message_type = 'MT760'
AND field_code IN (':15A:', ':15B:', ':15C:', ':23X:', ':72Z:', ':23F:', ':78:', ':26E:', ':48B:', ':48D:', ':24E:', ':24G:');

-- Set reasonable required/optional flags
-- Sequence markers and system fields should NOT be required for user input
UPDATE swift_field_config_readmodel
SET is_required = 0
WHERE message_type = 'MT760'
AND field_code IN (':15A:', ':15B:', ':15C:', ':23X:', ':27:');

-- Key fields that should be required
UPDATE swift_field_config_readmodel
SET is_required = 1
WHERE message_type = 'MT760'
AND field_code IN (':20:', ':22D:', ':30:', ':31E:', ':32B:', ':50:', ':52a:', ':59a:');

-- Optional extension fields
UPDATE swift_field_config_readmodel
SET is_required = 0
WHERE message_type = 'MT760'
AND field_code IN (':23F:', ':78:', ':26E:', ':31S:', ':48B:', ':48D:', ':39E:', ':24E:', ':24G:');
