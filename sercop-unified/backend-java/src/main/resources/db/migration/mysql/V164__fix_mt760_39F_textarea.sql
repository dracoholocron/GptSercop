-- =====================================================
-- V164: Fix MT760 :39F: field to use TEXTAREA for free text
-- =====================================================
-- The :39F: field "Supplementary Information About Amount"
-- should be a free text field (TEXTAREA), not a pattern-validated INPUT.
-- This field can contain any supplementary information about amounts.

-- Update :39F: to TEXTAREA for MT760
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'TEXTAREA',
    validation_rules = '{"maxLength": 350, "rows": 4, "placeholder": "Enter supplementary information about amount..."}',
    updated_at = NOW(),
    updated_by = 'V164_FIX_39F_TEXTAREA'
WHERE field_code = ':39F:'
  AND message_type = 'MT760';

-- Also update :39F: for MT760_LOCAL if it exists
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'TEXTAREA',
    validation_rules = '{"maxLength": 350, "rows": 4, "placeholder": "Enter supplementary information about amount..."}',
    updated_at = NOW(),
    updated_by = 'V164_FIX_39F_TEXTAREA'
WHERE field_code = ':39F:'
  AND message_type = 'MT760_LOCAL';
