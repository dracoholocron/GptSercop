-- =====================================================
-- V122: Add Multi-Approver Support to Pending Approvals
-- =====================================================
-- Implements tracking of multiple approvers when
-- minApprovers > 1 in FourEyesConfig.
-- =====================================================

-- Add multi-approver fields to pending approvals
ALTER TABLE pending_event_approval_readmodel
    ADD COLUMN required_approvers INT DEFAULT 1 COMMENT 'Number of approvers required (from 4-eyes config)',
    ADD COLUMN current_approval_count INT DEFAULT 0 COMMENT 'Current number of approvals received',
    ADD COLUMN approval_history JSON DEFAULT NULL COMMENT 'Array of approval records: [{user, timestamp, comments}]';

-- Add index for filtering partially approved items
CREATE INDEX idx_pending_approval_counts ON pending_event_approval_readmodel(required_approvers, current_approval_count);

-- Add new status for partial approval
-- Note: The status column already exists, we just need to use 'PARTIALLY_APPROVED' as a new value
