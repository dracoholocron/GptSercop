-- ============================================================================
-- V20260225_3: Add dynamic date reference support to alert templates and
--              template tracking columns to user_alert_readmodel
-- ============================================================================

-- 1. Add due_date_reference to event_alert_template
--    Controls how scheduled_date is calculated:
--    - EVENT_EXECUTION: scheduled_date = event_date + due_days_offset (current behavior)
--    - EXPIRY_DATE: scheduled_date = operation.expiry_date + due_days_offset
--    - ISSUE_DATE: scheduled_date = operation.issue_date + due_days_offset
ALTER TABLE event_alert_template
  ADD COLUMN due_date_reference VARCHAR(30) DEFAULT 'EVENT_EXECUTION'
  AFTER due_days_offset;

-- 2. Add template tracking columns to user_alert_readmodel
--    These enable recalculation when operation dates change
ALTER TABLE user_alert_readmodel
  ADD COLUMN template_id BIGINT NULL AFTER source_module,
  ADD COLUMN due_date_reference VARCHAR(30) NULL AFTER template_id,
  ADD COLUMN date_offset_days INT NULL AFTER due_date_reference,
  ADD COLUMN reference_date DATE NULL AFTER date_offset_days;

-- Index for efficient recalculation queries
CREATE INDEX idx_user_alert_template ON user_alert_readmodel (template_id);
CREATE INDEX idx_user_alert_op_status ON user_alert_readmodel (operation_id, status, due_date_reference);
