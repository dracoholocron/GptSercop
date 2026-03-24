-- ===========================================================================
-- Migración: Configurar draft_field_mapping para TODOS los tipos de mensaje
-- ===========================================================================
-- OperationAnalyzerService usa draft_field_mapping para extraer parties, fechas
-- y montos del SWIFT message. Sin estos mapeos, el sistema usa hardcoding.
-- Esta migración asegura que TODOS los tipos de mensaje tengan sus campos
-- mapeados correctamente al readmodel.
--
-- Valores de draft_field_mapping → campo en OperationReadModel:
--   applicantName    → applicant_name
--   beneficiaryName  → beneficiary_name
--   issuingBankBic   → issuing_bank_bic
--   advisingBankBic  → advising_bank_bic
--   issueDate        → issue_date
--   expiryDate       → expiry_date
--   currency,amount  → currency + amount
--   latestShipmentDate → usado en DateSummary
--   reference        → reference
-- ===========================================================================

-- =============================================
-- 1. CORREGIR INCONSISTENCIAS EXISTENTES
-- =============================================

-- :52a: en MT700 tiene 'issuingBankId' → debería ser 'issuingBankBic'
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issuingBankBic'
WHERE field_code = ':52a:' AND draft_field_mapping = 'issuingBankId';

-- :57A: en MT700 tiene 'advisingBankId' → debería ser 'advisingBankBic'
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'advisingBankBic'
WHERE field_code = ':57A:' AND draft_field_mapping = 'advisingBankId';

-- =============================================
-- 2. APPLICANT NAME → :50: / :50K:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'applicantName'
WHERE field_code IN (':50:', ':50K:')
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 3. BENEFICIARY NAME → :59: / :59A:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'beneficiaryName'
WHERE field_code IN (':59:', ':59A:')
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 4. ISSUING BANK → :52a: / :52A: / :52D: / :51a:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issuingBankBic'
WHERE field_code IN (':52a:', ':52A:', ':52D:', ':51a:')
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 5. ADVISING BANK → :57A: / :57a: / :57D:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'advisingBankBic'
WHERE field_code IN (':57A:', ':57a:', ':57D:')
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 6. ISSUE DATE → :31C:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issueDate'
WHERE field_code = ':31C:'
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 7. EXPIRY DATE → :31D: / :31E:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'expiryDate'
WHERE field_code IN (':31D:', ':31E:')
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 8. CURRENCY + AMOUNT → :32B:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'currency,amount'
WHERE field_code = ':32B:'
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 9. LATEST SHIPMENT DATE → :44C:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'latestShipmentDate'
WHERE field_code = ':44C:'
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- 10. REFERENCE → :20:
-- =============================================
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'reference'
WHERE field_code = ':20:'
  AND draft_field_mapping IS NULL
  AND is_active = true;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT message_type, field_code, draft_field_mapping, spec_version
FROM swift_field_config_readmodel
WHERE draft_field_mapping IS NOT NULL
ORDER BY draft_field_mapping, message_type, field_code;
