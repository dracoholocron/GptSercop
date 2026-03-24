-- V57: Add BIC columns to swift_draft_readmodel and configure SWIFT field mappings
-- for automatic extraction of bank BICs from SWIFT messages

-- =====================================================
-- 1. Add BIC columns to swift_draft_readmodel
-- =====================================================
ALTER TABLE swift_draft_readmodel
    ADD COLUMN issuing_bank_bic VARCHAR(11) NULL
    COMMENT 'BIC of issuing bank (extracted from :52a:)'
    AFTER issuing_bank_id;

ALTER TABLE swift_draft_readmodel
    ADD COLUMN advising_bank_bic VARCHAR(11) NULL
    COMMENT 'BIC of advising bank (extracted from :57a:)'
    AFTER advising_bank_id;

-- =====================================================
-- 2. Add :57a: field to swift_field_config if not exists
-- =====================================================
-- Insert for English
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language,
    section, display_order, is_required, is_active,
    field_type, draft_field_mapping, component_type, placeholder,
    created_at, created_by
)
SELECT
    UUID(), ':57a:', 'Advise Through Bank', 'Bank through which the credit is advised',
    'MT700', 'en', 'BANCOS', 70, false, true,
    'SWIFT_PARTY', 'advisingBankBic', 'FINANCIAL_INSTITUTION_SELECTOR', 'Select advising bank',
    NOW(), 'system'
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:' AND message_type = 'MT700' AND language = 'en'
);

-- Insert for Spanish
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language,
    section, display_order, is_required, is_active,
    field_type, draft_field_mapping, component_type, placeholder,
    created_at, created_by
)
SELECT
    UUID(), ':57a:', 'Banco Avisador', 'Banco a través del cual se avisa el crédito',
    'MT700', 'es', 'BANCOS', 70, false, true,
    'SWIFT_PARTY', 'advisingBankBic', 'FINANCIAL_INSTITUTION_SELECTOR', 'Seleccione banco avisador',
    NOW(), 'system'
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:' AND message_type = 'MT700' AND language = 'es'
);

-- =====================================================
-- 3. Update draft_field_mapping for existing :52a: and :57a: fields
-- =====================================================
-- Update :52a: (Issuing Bank) to map to issuingBankBic
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issuingBankBic',
    field_type = 'SWIFT_PARTY'
WHERE field_code = ':52a:'
  AND message_type = 'MT700'
  AND (draft_field_mapping IS NULL OR draft_field_mapping = '');

-- Update :57a: (Advising Bank) to map to advisingBankBic
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'advisingBankBic',
    field_type = 'SWIFT_PARTY'
WHERE field_code = ':57a:'
  AND message_type = 'MT700'
  AND (draft_field_mapping IS NULL OR draft_field_mapping = '');

-- =====================================================
-- 4. Also add mappings for MT710 and MT720 (LC Export)
-- =====================================================
-- Update :52a: for MT710
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issuingBankBic',
    field_type = 'SWIFT_PARTY'
WHERE field_code = ':52a:'
  AND message_type = 'MT710'
  AND (draft_field_mapping IS NULL OR draft_field_mapping = '');

-- Update :57a: for MT710
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'advisingBankBic',
    field_type = 'SWIFT_PARTY'
WHERE field_code = ':57a:'
  AND message_type = 'MT710'
  AND (draft_field_mapping IS NULL OR draft_field_mapping = '');

-- Update :52a: for MT720
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issuingBankBic',
    field_type = 'SWIFT_PARTY'
WHERE field_code = ':52a:'
  AND message_type = 'MT720'
  AND (draft_field_mapping IS NULL OR draft_field_mapping = '');

-- Update :57a: for MT720
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'advisingBankBic',
    field_type = 'SWIFT_PARTY'
WHERE field_code = ':57a:'
  AND message_type = 'MT720'
  AND (draft_field_mapping IS NULL OR draft_field_mapping = '');
