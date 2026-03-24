-- ==================================================
-- Migration V63: Fix MT760 bank field component types
-- ==================================================
-- Updates BANK_SELECTOR to FINANCIAL_INSTITUTION_SELECTOR
-- so DynamicSwiftField renders the correct component
-- ==================================================

-- Update all bank fields in MT760 to use FINANCIAL_INSTITUTION_SELECTOR
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR'
WHERE message_type = 'MT760'
  AND component_type = 'BANK_SELECTOR';

-- ==================================================
-- End of migration V63
-- ==================================================
