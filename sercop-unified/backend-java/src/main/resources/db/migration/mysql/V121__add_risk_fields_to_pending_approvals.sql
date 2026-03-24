-- =====================================================
-- V121: Add Risk Engine Fields to Pending Approvals
-- =====================================================
-- Integrates Risk Engine evaluation results with the
-- approval workflow, allowing approvers to see which
-- risk rules were triggered and how to proceed.
-- =====================================================

-- Add risk evaluation fields to pending approvals
ALTER TABLE pending_event_approval_readmodel
    ADD COLUMN risk_score INT DEFAULT NULL COMMENT 'Risk score from Risk Engine (0-100)',
    ADD COLUMN risk_level VARCHAR(20) DEFAULT NULL COMMENT 'Risk level: LOW, MEDIUM, HIGH, CRITICAL',
    ADD COLUMN triggered_risk_rules JSON DEFAULT NULL COMMENT 'Array of triggered rules with code, name, points, reason',
    ADD COLUMN risk_action VARCHAR(30) DEFAULT NULL COMMENT 'Recommended action: ALLOW, MFA_REQUIRED, STEP_UP_AUTH, BLOCK',
    ADD COLUMN approval_instructions TEXT DEFAULT NULL COMMENT 'Instructions for approver based on risk',
    ADD COLUMN risk_triggered BOOLEAN DEFAULT FALSE COMMENT 'Whether approval was triggered by risk (vs normal 4-eyes)';

-- Add index for filtering by risk level
CREATE INDEX idx_pending_approval_risk_level ON pending_event_approval_readmodel(risk_level);
CREATE INDEX idx_pending_approval_risk_score ON pending_event_approval_readmodel(risk_score);
