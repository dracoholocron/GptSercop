-- ================================================
-- V20260219: Set event_category for all product types
-- Description: Populates missing event_category values for events
--   added in V216 and V265. The journey map UI groups events by
--   event_category, so events without it don't appear.
-- Affected product types:
--   V216: LC_IMPORT (new events), LC_EXPORT (new), GUARANTEE (new),
--         COLLECTION (new), GUARANTEE_ISSUED, GUARANTEE_RECEIVED,
--         BACK_TO_BACK_LC
--   V265: STANDBY_LC, COLLECTION_IMPORT, COLLECTION_EXPORT,
--         GUARANTEE_MANDATARIA, TRADE_FINANCING, AVAL_DESCUENTO
-- ================================================

-- =============================================================================
-- 1. V216 events - LC_IMPORT additional events
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ADVICE'
WHERE event_code = 'PRE_ADVISE' AND operation_type = 'LC_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'ADVICE'
WHERE event_code = 'TRANSFER' AND operation_type = 'LC_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'REFUSE_AMENDMENT' AND operation_type = 'LC_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'REIMBURSEMENT_CLAIM' AND operation_type = 'LC_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'CHARGE_ADVICE' AND operation_type = 'LC_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'CHARGE_REQUEST' AND operation_type = 'LC_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE'
WHERE event_code = 'ISSUE_EXTENDED' AND operation_type = 'LC_IMPORT' AND event_category IS NULL;

-- =============================================================================
-- 2. V216 events - LC_EXPORT additional events
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ADVICE'
WHERE event_code = 'PRE_ADVISE' AND operation_type = 'LC_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'REIMBURSEMENT_ADVICE' AND operation_type = 'LC_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'DEFER_PAYMENT' AND operation_type = 'LC_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'CHARGE_ADVICE' AND operation_type = 'LC_EXPORT' AND event_category IS NULL;

-- =============================================================================
-- 3. V216 events - GUARANTEE additional events
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ADVICE'
WHERE event_code = 'ADVISE_THIRD_BANK' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'AMEND_REQUEST' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'REDUCE' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'RELEASE_REQUEST' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLAIM'
WHERE event_code = 'CLAIM_REJECT' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'ATTACHMENT' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'EXTEND_788' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'DEFERRED_PAYMENT' AND operation_type = 'GUARANTEE' AND event_category IS NULL;

-- =============================================================================
-- 4. V216 events - COLLECTION additional events
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'TRACER' AND operation_type = 'COLLECTION' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'COLLECTION' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CANCEL_REQUEST' AND operation_type = 'COLLECTION' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'DISCHARGE' AND operation_type = 'COLLECTION' AND event_category IS NULL;

-- =============================================================================
-- 5. V216 events - GUARANTEE_ISSUED
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'ISSUE' AND operation_type = 'GUARANTEE_ISSUED' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'GUARANTEE_ISSUED' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'REDUCE' AND operation_type = 'GUARANTEE_ISSUED' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'RELEASE' AND operation_type = 'GUARANTEE_ISSUED' AND event_category IS NULL;

-- =============================================================================
-- 6. V216 events - GUARANTEE_RECEIVED
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'RECEIVE' AND operation_type = 'GUARANTEE_RECEIVED' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'ADVICE'
WHERE event_code = 'ACKNOWLEDGE' AND operation_type = 'GUARANTEE_RECEIVED' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLAIM'
WHERE event_code = 'CLAIM' AND operation_type = 'GUARANTEE_RECEIVED' AND event_category IS NULL;

-- =============================================================================
-- 7. V216 events - BACK_TO_BACK_LC
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'ISSUE' AND operation_type = 'BACK_TO_BACK_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'BACK_TO_BACK_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'PRESENT_DOCUMENTS' AND operation_type = 'BACK_TO_BACK_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'PAYMENT' AND operation_type = 'BACK_TO_BACK_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'BACK_TO_BACK_LC' AND event_category IS NULL;

-- =============================================================================
-- 8. V265 events - STANDBY_LC
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'ISSUE' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'ADVICE'
WHERE event_code = 'ADVISE' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'PRESENT_DEMAND' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'PAY_DEMAND' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'EXTEND' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CANCEL' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'STANDBY_LC' AND event_category IS NULL;

-- =============================================================================
-- 9. V265 events - COLLECTION_IMPORT
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'RECEIVE_COLLECTION' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'PRESENT_DRAWEE' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'ACCEPT' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'REFUSE' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'PAYMENT' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'RETURN_DOCS' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'TRACER' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'COLLECTION_IMPORT' AND event_category IS NULL;

-- =============================================================================
-- 10. V265 events - COLLECTION_EXPORT
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'SEND_COLLECTION' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'PRESENT_DRAWEE' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'ACCEPT' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'REFUSE' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'PAYMENT' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'RETURN_DOCS' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'TRACER' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'REMIT_PROCEEDS' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'COLLECTION_EXPORT' AND event_category IS NULL;

-- =============================================================================
-- 11. V265 events - GUARANTEE_MANDATARIA
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'RECEIVE_MANDATE' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE'
WHERE event_code = 'ISSUE' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'EXTEND' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLAIM'
WHERE event_code = 'CLAIM' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'PAY_CLAIM' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'RELEASE' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'GUARANTEE_MANDATARIA' AND event_category IS NULL;

-- =============================================================================
-- 12. V265 events - TRADE_FINANCING
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'CREATE_FINANCING' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE'
WHERE event_code = 'APPROVE' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'DISBURSE' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'PAYMENT' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'ROLLOVER' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'AMENDMENT'
WHERE event_code = 'RESTRUCTURE' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'SETTLE' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'TRADE_FINANCING' AND event_category IS NULL;

-- =============================================================================
-- 13. V265 events - AVAL_DESCUENTO
-- =============================================================================

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE', is_initial_event = TRUE
WHERE event_code = 'RECEIVE_DRAFT' AND operation_type = 'AVAL_DESCUENTO' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'ISSUANCE'
WHERE event_code = 'ENDORSE' AND operation_type = 'AVAL_DESCUENTO' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'DISCOUNT' AND operation_type = 'AVAL_DESCUENTO' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'DOCUMENTS'
WHERE event_code = 'PRESENT' AND operation_type = 'AVAL_DESCUENTO' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'PAYMENT'
WHERE event_code = 'PAYMENT' AND operation_type = 'AVAL_DESCUENTO' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLAIM'
WHERE event_code = 'PROTEST' AND operation_type = 'AVAL_DESCUENTO' AND event_category IS NULL;

UPDATE event_type_config_readmodel
SET event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'AVAL_DESCUENTO' AND event_category IS NULL;
