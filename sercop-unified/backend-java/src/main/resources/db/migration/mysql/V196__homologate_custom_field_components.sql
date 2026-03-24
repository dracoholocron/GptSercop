-- =============================================================================
-- Migration V196: Homologate Custom Field Components with SWIFT Components
-- Updates CLIENT_LC_IMPORT_REQUEST fields to use the same components as
-- swift_field_config_readmodel for natural compatibility (no transformation needed)
-- =============================================================================

-- =============================================================================
-- PART 1: Update simple component types to match SWIFT exactly
-- =============================================================================

-- :39A: TOLERANCE_PERCENTAGE - Change PERCENTAGE to TOLERANCE_PERCENTAGE
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.component_type = 'TOLERANCE_PERCENTAGE',
    c.field_type = 'TEXT'
WHERE c.field_code = 'TOLERANCE_PERCENTAGE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- :57A: ADVISING_BANK_SWIFT - Change SWIFT_SELECTOR to FINANCIAL_INSTITUTION_SELECTOR
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    c.field_type = 'INSTITUTION'
WHERE c.field_code = 'ADVISING_BANK_SWIFT'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- :45A: GOODS_DESCRIPTION - Change MULTILINE_TEXT to TEXTAREA
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.component_type = 'TEXTAREA',
    c.field_type = 'TEXTAREA'
WHERE c.field_code = 'GOODS_DESCRIPTION'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- :40A: LC_TYPE - Change SELECT to DROPDOWN (SWIFT standard)
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.component_type = 'DROPDOWN'
WHERE c.field_code = 'LC_TYPE'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- :43P: PARTIAL_SHIPMENTS - Change SELECT to DROPDOWN
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.component_type = 'DROPDOWN'
WHERE c.field_code = 'PARTIAL_SHIPMENTS'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- :43T: TRANSSHIPMENT - Change SELECT to DROPDOWN
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.component_type = 'DROPDOWN'
WHERE c.field_code = 'TRANSSHIPMENT'
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- =============================================================================
-- PART 2: Replace separate fields with composite SWIFT components
-- =============================================================================

-- Step 2.1: Get the section_id for "basic_info" section (where LC_CURRENCY is located)
SET @basic_section_id = (
    SELECT c.section_id
    FROM custom_field_config_readmodel c
    JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
    JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
    WHERE c.field_code = 'LC_CURRENCY'
      AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST'
    LIMIT 1
);

-- Step 2.2: Deactivate LC_CURRENCY and LC_AMOUNT (replaced by composite)
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.is_active = 0
WHERE c.field_code IN ('LC_CURRENCY', 'LC_AMOUNT')
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- Step 2.3: Create composite field LC_CURRENCY_AMOUNT with CURRENCY_AMOUNT_INPUT
-- This component stores {currency: 'USD', amount: 10000} - same as SWIFT :32B:
INSERT INTO custom_field_config_readmodel (
    id, field_code, field_name_key, field_description_key, section_id,
    field_type, component_type, display_order, is_required,
    maps_to_product_type, maps_to_field_code, maps_to_swift_tag,
    mapping_transformation, is_active, created_at, created_by
)
SELECT
    UUID(),
    'LC_CURRENCY_AMOUNT',
    'fields.lc_currency_amount',
    'fields.lc_currency_amount_desc',
    @basic_section_id,
    'CURRENCY',
    'CURRENCY_AMOUNT_INPUT',
    5,
    1,
    'LC_IMPORT',
    ':32B:',
    ':32B:',
    'DIRECT',
    1,
    NOW(),
    'SYSTEM'
WHERE @basic_section_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_field_config_readmodel
    WHERE field_code = 'LC_CURRENCY_AMOUNT'
      AND section_id = @basic_section_id
  );

-- Step 2.4: Get section_id for beneficiary section
SET @beneficiary_section_id = (
    SELECT c.section_id
    FROM custom_field_config_readmodel c
    JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
    JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
    WHERE c.field_code = 'LC_BENEFICIARY_NAME'
      AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST'
    LIMIT 1
);

-- Step 2.5: Deactivate separate beneficiary fields (replaced by composite)
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.is_active = 0
WHERE c.field_code IN ('LC_BENEFICIARY_NAME', 'LC_BENEFICIARY_ADDRESS', 'LC_BENEFICIARY_COUNTRY')
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';

-- Step 2.6: Create composite field LC_BENEFICIARY with SWIFT_PARTY
-- This component stores {line1: 'Name', line2: 'Address', line3: 'Country', ...} - same as SWIFT :59:
INSERT INTO custom_field_config_readmodel (
    id, field_code, field_name_key, field_description_key, section_id,
    field_type, component_type, display_order, is_required,
    maps_to_product_type, maps_to_field_code, maps_to_swift_tag,
    mapping_transformation, is_active, created_at, created_by
)
SELECT
    UUID(),
    'LC_BENEFICIARY',
    'fields.lc_beneficiary',
    'fields.lc_beneficiary_desc',
    @beneficiary_section_id,
    'SWIFT_PARTY',
    'SWIFT_PARTY',
    1,
    1,
    'LC_IMPORT',
    ':59:',
    ':59:',
    'DIRECT',
    1,
    NOW(),
    'SYSTEM'
WHERE @beneficiary_section_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_field_config_readmodel
    WHERE field_code = 'LC_BENEFICIARY'
      AND section_id = @beneficiary_section_id
  );

-- =============================================================================
-- PART 3: Clear old mapping configs for deactivated fields
-- =============================================================================
UPDATE custom_field_config_readmodel c
JOIN custom_field_section_config_readmodel sec ON sec.id = c.section_id
JOIN custom_field_step_config_readmodel step ON step.id = sec.step_id
SET c.maps_to_product_type = NULL,
    c.maps_to_field_code = NULL,
    c.maps_to_swift_tag = NULL,
    c.maps_to_swift_line = NULL,
    c.mapping_transformation = NULL,
    c.mapping_params = NULL
WHERE c.field_code IN ('LC_CURRENCY', 'LC_AMOUNT', 'LC_BENEFICIARY_NAME', 'LC_BENEFICIARY_ADDRESS', 'LC_BENEFICIARY_COUNTRY')
  AND step.product_type = 'CLIENT_LC_IMPORT_REQUEST';
