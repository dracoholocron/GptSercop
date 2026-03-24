-- =============================================================================
-- Migration V195: Configure Field Mappings for LC Import
-- Maps fields from CLIENT_LC_IMPORT_REQUEST to LC_IMPORT SWIFT tags
-- Uses custom_field_config_readmodel with mapping columns from V193
--
-- Table hierarchy:
-- custom_field_step_config_readmodel (has product_type)
--   -> custom_field_section_config_readmodel (step_id)
--     -> custom_field_config_readmodel (section_id)
-- =============================================================================

-- Update existing CLIENT_LC_IMPORT_REQUEST fields to map to LC_IMPORT SWIFT tags

-- LC_TYPE -> :40A: Form of Documentary Credit
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':40A:',
    c.maps_to_swift_tag = ':40A:',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'LC_TYPE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- LC_CURRENCY -> :32B: currency component
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':32B:',
    c.maps_to_swift_tag = ':32B:',
    c.maps_to_swift_line = 1,
    c.mapping_transformation = 'DIRECT',
    c.mapping_params = '{"targetField": "currency"}'
WHERE c.field_code = 'LC_CURRENCY'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- LC_AMOUNT -> :32B: amount component
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':32B:',
    c.maps_to_swift_tag = ':32B:',
    c.maps_to_swift_line = 2,
    c.mapping_transformation = 'DIRECT',
    c.mapping_params = '{"targetField": "amount"}'
WHERE c.field_code = 'LC_AMOUNT'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- LC_EXPIRY_DATE -> :31D: Date and Place of Expiry
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':31D:',
    c.maps_to_swift_tag = ':31D:',
    c.mapping_transformation = 'FORMAT_DATE',
    c.mapping_params = '{"inputFormat": "yyyy-MM-dd", "outputFormat": "yyMMdd"}'
WHERE c.field_code = 'LC_EXPIRY_DATE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- LATEST_SHIPMENT_DATE -> :44C: Latest Date of Shipment
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':44C:',
    c.maps_to_swift_tag = ':44C:',
    c.mapping_transformation = 'FORMAT_DATE',
    c.mapping_params = '{"inputFormat": "yyyy-MM-dd", "outputFormat": "yyMMdd"}'
WHERE c.field_code = 'LATEST_SHIPMENT_DATE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- PARTIAL_SHIPMENTS -> :43P: Partial Shipments
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':43P:',
    c.maps_to_swift_tag = ':43P:',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'PARTIAL_SHIPMENTS'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- TRANSSHIPMENT -> :43T: Transshipment
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':43T:',
    c.maps_to_swift_tag = ':43T:',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'TRANSSHIPMENT'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- PORT_LOADING -> :44A: Place of Taking in Charge
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':44A:',
    c.maps_to_swift_tag = ':44A:',
    c.mapping_transformation = 'UPPERCASE'
WHERE c.field_code = 'PORT_LOADING'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- PORT_DISCHARGE -> :44B: Port of Discharge
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':44B:',
    c.maps_to_swift_tag = ':44B:',
    c.mapping_transformation = 'UPPERCASE'
WHERE c.field_code = 'PORT_DISCHARGE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- GOODS_DESCRIPTION -> :45A: Description of Goods
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':45A:',
    c.maps_to_swift_tag = ':45A:',
    c.mapping_transformation = 'UPPERCASE'
WHERE c.field_code = 'GOODS_DESCRIPTION'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- TOLERANCE_PERCENTAGE -> :39A: Percentage Credit Amount Tolerance
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':39A:',
    c.maps_to_swift_tag = ':39A:',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'TOLERANCE_PERCENTAGE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- LC_BENEFICIARY_NAME -> :59: Beneficiary (line 1)
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':59:',
    c.maps_to_swift_tag = ':59:',
    c.maps_to_swift_line = 1,
    c.mapping_transformation = 'UPPERCASE',
    c.mapping_params = '{"maxLength": 35}'
WHERE c.field_code = 'LC_BENEFICIARY_NAME'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- LC_BENEFICIARY_ADDRESS -> :59: Beneficiary (line 2)
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':59:',
    c.maps_to_swift_tag = ':59:',
    c.maps_to_swift_line = 2,
    c.mapping_transformation = 'UPPERCASE',
    c.mapping_params = '{"maxLength": 35}'
WHERE c.field_code = 'LC_BENEFICIARY_ADDRESS'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- LC_BENEFICIARY_COUNTRY -> :59: Beneficiary (line 3)
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':59:',
    c.maps_to_swift_tag = ':59:',
    c.maps_to_swift_line = 3,
    c.mapping_transformation = 'LOOKUP',
    c.mapping_params = '{"catalog": "PAISES", "sourceField": "codigo", "targetField": "nombre"}'
WHERE c.field_code = 'LC_BENEFICIARY_COUNTRY'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- ADVISING_BANK_SWIFT -> :57A: Advise Through Bank
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = ':57A:',
    c.maps_to_swift_tag = ':57A:',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'ADVISING_BANK_SWIFT'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- INCOTERM -> Custom field
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = 'INCOTERM',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'INCOTERM'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- PAYMENT_TYPE -> Custom field
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = 'PAYMENT_TYPE',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'PAYMENT_TYPE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- PAYMENT_TERM_DAYS -> Custom field
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = 'LC_IMPORT',
    c.maps_to_field_code = 'PAYMENT_TERM_DAYS',
    c.mapping_transformation = 'DIRECT'
WHERE c.field_code = 'PAYMENT_TERM_DAYS'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';
