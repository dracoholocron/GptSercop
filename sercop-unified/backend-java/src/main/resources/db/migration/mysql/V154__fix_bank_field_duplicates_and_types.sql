-- V154: Fix bank field component types across all SWIFT versions
-- Problem: Bank fields (:52a:, :53a:, :56a:, :57a:, :58a:) in some spec versions
-- have TEXT/INPUT instead of INSTITUTION/BANK_SELECTOR

-- Update all bank fields to use correct INSTITUTION/BANK_SELECTOR type
UPDATE swift_field_config_readmodel
SET
    field_type = 'INSTITUTION',
    component_type = 'BANK_SELECTOR',
    updated_at = NOW(),
    updated_by = 'V154_FIX_BANK_FIELDS'
WHERE field_code IN (':52a:', ':53a:', ':56a:', ':57a:', ':58a:')
  AND (field_type = 'TEXT' OR component_type = 'INPUT');

-- Also fix D-format bank fields (Name & Address format)
UPDATE swift_field_config_readmodel
SET
    field_type = 'INSTITUTION',
    component_type = 'BANK_SELECTOR',
    updated_at = NOW(),
    updated_by = 'V154_FIX_BANK_FIELDS'
WHERE field_code IN (':52D:', ':53D:', ':56D:', ':57D:', ':58D:')
  AND (field_type = 'TEXT' OR component_type = 'INPUT');
