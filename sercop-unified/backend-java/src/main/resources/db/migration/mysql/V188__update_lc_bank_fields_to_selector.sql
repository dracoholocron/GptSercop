-- =============================================================================
-- Migration V188: Update LC Import bank fields to use Bank Selector
-- Changes ADVISING_BANK and ADVISING_BANK_SWIFT fields to use BANK_SELECTOR
-- so they can select from the financial_institution catalog
-- =============================================================================

-- Update ADVISING_BANK field to use BANK_SELECTOR
UPDATE custom_field_config_readmodel
SET component_type = 'BANK_SELECTOR',
    data_source_type = 'FINANCIAL_INSTITUTION',
    data_source_code = NULL
WHERE field_code = 'ADVISING_BANK'
AND section_id IN (
    SELECT id FROM custom_field_section_config_readmodel
    WHERE section_code = 'LC_BENEFICIARY'
);

-- Update ADVISING_BANK_SWIFT to use SWIFT_SELECTOR
UPDATE custom_field_config_readmodel
SET component_type = 'SWIFT_SELECTOR',
    data_source_type = 'FINANCIAL_INSTITUTION',
    data_source_code = NULL
WHERE field_code = 'ADVISING_BANK_SWIFT'
AND section_id IN (
    SELECT id FROM custom_field_section_config_readmodel
    WHERE section_code = 'LC_BENEFICIARY'
);

-- Also update COLLECTING_BANK fields in Collection Request
UPDATE custom_field_config_readmodel
SET component_type = 'BANK_SELECTOR',
    data_source_type = 'FINANCIAL_INSTITUTION',
    data_source_code = NULL
WHERE field_code = 'COLLECTING_BANK'
AND section_id IN (
    SELECT id FROM custom_field_section_config_readmodel
    WHERE section_code = 'COL_DRAWEE'
);

UPDATE custom_field_config_readmodel
SET component_type = 'SWIFT_SELECTOR',
    data_source_type = 'FINANCIAL_INSTITUTION',
    data_source_code = NULL
WHERE field_code = 'COLLECTING_BANK_SWIFT'
AND section_id IN (
    SELECT id FROM custom_field_section_config_readmodel
    WHERE section_code = 'COL_DRAWEE'
);
