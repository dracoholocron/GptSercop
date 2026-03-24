-- Add user approval workflow fields
ALTER TABLE user_read_model ADD COLUMN approval_status VARCHAR(20) DEFAULT 'APPROVED' AFTER last_login;
ALTER TABLE user_read_model ADD COLUMN approval_requested_at TIMESTAMP NULL AFTER approval_status;
ALTER TABLE user_read_model ADD COLUMN approved_at TIMESTAMP NULL AFTER approval_requested_at;
ALTER TABLE user_read_model ADD COLUMN approved_by VARCHAR(100) NULL AFTER approved_at;
ALTER TABLE user_read_model ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER approved_by;

-- Create index for faster queries on approval status
CREATE INDEX idx_user_approval_status ON user_read_model(approval_status);

-- Set existing users as APPROVED
UPDATE user_read_model SET approval_status = 'APPROVED' WHERE approval_status IS NULL;
