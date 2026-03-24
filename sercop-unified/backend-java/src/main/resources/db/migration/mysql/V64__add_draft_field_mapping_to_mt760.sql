-- =====================================================
-- V64: Add draft_field_mapping to MT760 (Guarantee) fields
-- =====================================================
-- This migration adds the draft_field_mapping column values for MT760 fields
-- to enable automatic extraction of metadata from SWIFT messages to swift_draft_readmodel
-- Similar to V56 which added mappings for MT700

-- :20: Reference -> reference
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'reference'
WHERE field_code = ':20:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :31C: Issue Date -> issueDate
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issueDate'
WHERE field_code = ':31C:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :31D: Expiry Date -> expiryDate
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'expiryDate'
WHERE field_code = ':31D:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :31E: Alternative Expiry Date -> expiryDate (if :31D: not present)
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'expiryDate'
WHERE field_code = ':31E:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :32B: Currency and Amount -> currency, amount (composite)
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'currency,amount'
WHERE field_code = ':32B:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :50: Applicant -> applicantId (participant selector)
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'applicantId'
WHERE field_code = ':50:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :59: Beneficiary -> beneficiaryId (participant selector)
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'beneficiaryId'
WHERE field_code = ':59:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :52a: Issuing Bank -> issuingBankId
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issuingBankId'
WHERE field_code = ':52a:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;

-- :57a: Advising Bank -> advisingBankId
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'advisingBankId'
WHERE field_code = ':57a:' AND message_type = 'MT760' AND draft_field_mapping IS NULL;
