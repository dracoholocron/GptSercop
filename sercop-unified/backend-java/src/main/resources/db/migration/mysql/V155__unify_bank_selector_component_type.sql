-- V155: Unify bank selector component types
-- Standardize all bank/institution selectors to use FINANCIAL_INSTITUTION_SELECTOR
-- This avoids confusion with multiple component type names that do the same thing

UPDATE swift_field_config_readmodel
SET
    component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    updated_at = NOW(),
    updated_by = 'V155_UNIFY_BANK_SELECTOR'
WHERE component_type IN ('BANK_SELECTOR', 'INSTITUTION_SELECTOR')
  AND field_code IN (':52a:', ':53a:', ':56a:', ':57a:', ':58a:', ':52D:', ':53D:', ':56D:', ':57D:', ':58D:');
