-- ============================================================================
-- V20260222: Widen BIC columns and fix existing operation data
-- ============================================================================
-- The issuing_bank_bic and advising_bank_bic columns were VARCHAR(11) which
-- only fits a raw BIC code. Widen to VARCHAR(100) to also support institution
-- names as fallback when no BIC is available.
-- ============================================================================

-- Widen BIC columns in operation_readmodel
ALTER TABLE operation_readmodel MODIFY issuing_bank_bic VARCHAR(100);
ALTER TABLE operation_readmodel MODIFY advising_bank_bic VARCHAR(100);

-- Widen BIC columns in swift_draft_readmodel
ALTER TABLE swift_draft_readmodel MODIFY issuing_bank_bic VARCHAR(100);
ALTER TABLE swift_draft_readmodel MODIFY advising_bank_bic VARCHAR(100);

-- Fix existing operations: resolve BIC from issuing_bank_id via financial_institution_readmodel
UPDATE operation_readmodel o
INNER JOIN financial_institution_readmodel fi ON fi.id = o.issuing_bank_id
SET o.issuing_bank_bic = fi.swift_code
WHERE o.issuing_bank_bic IS NULL
  AND o.issuing_bank_id IS NOT NULL
  AND fi.swift_code IS NOT NULL;

-- Fix existing operations: resolve BIC from advising_bank_id via financial_institution_readmodel
UPDATE operation_readmodel o
INNER JOIN financial_institution_readmodel fi ON fi.id = o.advising_bank_id
SET o.advising_bank_bic = fi.swift_code
WHERE o.advising_bank_bic IS NULL
  AND o.advising_bank_id IS NOT NULL
  AND fi.swift_code IS NOT NULL;

-- Fix existing drafts: resolve BIC from issuing_bank_id
UPDATE swift_draft_readmodel d
INNER JOIN financial_institution_readmodel fi ON fi.id = d.issuing_bank_id
SET d.issuing_bank_bic = fi.swift_code
WHERE d.issuing_bank_bic IS NULL
  AND d.issuing_bank_id IS NOT NULL
  AND fi.swift_code IS NOT NULL;

-- Fix existing drafts: resolve BIC from advising_bank_id
UPDATE swift_draft_readmodel d
INNER JOIN financial_institution_readmodel fi ON fi.id = d.advising_bank_id
SET d.advising_bank_bic = fi.swift_code
WHERE d.advising_bank_bic IS NULL
  AND d.advising_bank_id IS NOT NULL
  AND fi.swift_code IS NOT NULL;
