-- V51: Deactivate old ADVISE event for LC_IMPORT
-- The ADVISE event is being replaced by conditional events:
-- - TRANSMIT_DIRECT: when no intermediary bank (field 57a absent)
-- - TRANSMIT_VIA_CORRESPONDENT: when intermediary bank exists (field 57a present)

-- =============================================
-- 1. Deactivate old ADVISE event type for LC_IMPORT
-- =============================================

UPDATE event_type_config_readmodel
SET is_active = FALSE
WHERE event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT';

-- =============================================
-- 2. Deactivate old ADVISE flow configs for LC_IMPORT
-- =============================================

UPDATE event_flow_config_readmodel
SET is_active = FALSE
WHERE to_event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT';
