-- V161: Fix existing field_type and component_type for all spec versions
-- This migration updates records that already exist in the database
-- with the correct field_type and component_type values

-- ============================================================================
-- 1. Fix :50: (Applicant) -> PARTICIPANT/PARTICIPANT_SELECTOR
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'PARTICIPANT',
    component_type = 'PARTICIPANT_SELECTOR',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':50:'
  AND (field_type = 'TEXTAREA' OR field_type = 'TEXT')
  AND (component_type = 'TEXTAREA' OR component_type = 'INPUT');

-- ============================================================================
-- 2. Fix :59: (Beneficiary) -> PARTICIPANT/NON_CLIENT_SELECTOR
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'PARTICIPANT',
    component_type = 'NON_CLIENT_SELECTOR',
    swift_format = '[/34x]4*35x',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':59:'
  AND (field_type = 'TEXT' OR field_type = 'TEXTAREA')
  AND (component_type = 'INPUT' OR component_type = 'TEXTAREA');

-- ============================================================================
-- 3. Fix :40A: (Form of Documentary Credit) -> SELECT/DROPDOWN
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'SELECT',
    component_type = 'DROPDOWN',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':40A:'
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';

-- ============================================================================
-- 4. Fix :40E: (Applicable Rules) -> SELECT/DROPDOWN
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'SELECT',
    component_type = 'DROPDOWN',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':40E:'
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';

-- ============================================================================
-- 5. Fix :41a: (Available With...By) -> SELECT/DROPDOWN
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'SELECT',
    component_type = 'DROPDOWN',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':41a:'
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';

-- ============================================================================
-- 6. Fix :49: (Confirmation Instructions) -> SELECT/DROPDOWN
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'SELECT',
    component_type = 'DROPDOWN',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':49:'
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';

-- ============================================================================
-- 7. Fix :43P: (Partial Shipments) -> SELECT/DROPDOWN
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'SELECT',
    component_type = 'DROPDOWN',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':43P:'
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';

-- ============================================================================
-- 8. Fix :43T: (Transhipment) -> SELECT/DROPDOWN
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'SELECT',
    component_type = 'DROPDOWN',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code = ':43T:'
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';

-- ============================================================================
-- 9. Fix bank fields -> INSTITUTION/FINANCIAL_INSTITUTION_SELECTOR
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'INSTITUTION',
    component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code IN (':51a:', ':52a:', ':53a:', ':56a:', ':57a:', ':58a:')
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';

-- ============================================================================
-- 10. Fix currency fields -> CURRENCY/CURRENCY_AMOUNT_INPUT
-- ============================================================================
UPDATE swift_field_config_readmodel
SET
    field_type = 'CURRENCY',
    component_type = 'CURRENCY_AMOUNT_INPUT',
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'V161_FIX_EXISTING'
WHERE field_code IN (':32B:', ':33B:', ':34B:')
  AND field_type = 'TEXT'
  AND component_type = 'INPUT';
