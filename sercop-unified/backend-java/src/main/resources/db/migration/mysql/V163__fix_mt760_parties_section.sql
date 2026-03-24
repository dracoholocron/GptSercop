-- V163: Fix MT760 field section assignments for PARTIES
-- Move :50: (Applicant) and :59: (Beneficiary) from BANKS to PARTIES section

-- =====================================================
-- Update :50: (Applicant) to PARTIES section
-- =====================================================
UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 1,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT760'
  AND field_code = ':50:';

-- =====================================================
-- Update :59: (Beneficiary) to PARTIES section
-- =====================================================
UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 2,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT760'
  AND field_code = ':59:';

-- =====================================================
-- Update :59a: (Beneficiary option A) to PARTIES section
-- =====================================================
UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 3,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT760'
  AND field_code = ':59a:';

-- =====================================================
-- Also fix MT700, MT710, MT720 party fields
-- =====================================================

-- MT700
UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 1,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT700'
  AND field_code = ':50:';

UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 2,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT700'
  AND field_code = ':59:';

UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 3,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT700'
  AND field_code = ':59a:';

-- MT710
UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 1,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT710'
  AND field_code = ':50:';

UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 2,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT710'
  AND field_code = ':59:';

UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 3,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT710'
  AND field_code = ':59a:';

-- MT720
UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 1,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT720'
  AND field_code = ':50:';

UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 2,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT720'
  AND field_code = ':59:';

UPDATE swift_field_config_readmodel
SET section = 'PARTIES',
    display_order = 3,
    updated_at = NOW(),
    updated_by = 'V163_FIX_PARTIES'
WHERE message_type = 'MT720'
  AND field_code = ':59a:';
