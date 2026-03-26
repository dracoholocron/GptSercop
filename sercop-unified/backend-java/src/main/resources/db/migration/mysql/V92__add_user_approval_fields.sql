-- Add user approval workflow fields
SET @has_approval_status := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'approval_status'
);
SET @sql_approval_status := IF(
    @has_approval_status = 0,
    "ALTER TABLE user_read_model ADD COLUMN approval_status VARCHAR(20) DEFAULT 'APPROVED' AFTER last_login",
    'SELECT 1'
);
PREPARE stmt_approval_status FROM @sql_approval_status;
EXECUTE stmt_approval_status;
DEALLOCATE PREPARE stmt_approval_status;

SET @has_approval_requested_at := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'approval_requested_at'
);
SET @sql_approval_requested_at := IF(
    @has_approval_requested_at = 0,
    'ALTER TABLE user_read_model ADD COLUMN approval_requested_at TIMESTAMP NULL AFTER approval_status',
    'SELECT 1'
);
PREPARE stmt_approval_requested_at FROM @sql_approval_requested_at;
EXECUTE stmt_approval_requested_at;
DEALLOCATE PREPARE stmt_approval_requested_at;

SET @has_approved_at := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'approved_at'
);
SET @sql_approved_at := IF(
    @has_approved_at = 0,
    'ALTER TABLE user_read_model ADD COLUMN approved_at TIMESTAMP NULL AFTER approval_requested_at',
    'SELECT 1'
);
PREPARE stmt_approved_at FROM @sql_approved_at;
EXECUTE stmt_approved_at;
DEALLOCATE PREPARE stmt_approved_at;

SET @has_approved_by := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'approved_by'
);
SET @sql_approved_by := IF(
    @has_approved_by = 0,
    'ALTER TABLE user_read_model ADD COLUMN approved_by VARCHAR(100) NULL AFTER approved_at',
    'SELECT 1'
);
PREPARE stmt_approved_by FROM @sql_approved_by;
EXECUTE stmt_approved_by;
DEALLOCATE PREPARE stmt_approved_by;

SET @has_rejection_reason := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'rejection_reason'
);
SET @sql_rejection_reason := IF(
    @has_rejection_reason = 0,
    'ALTER TABLE user_read_model ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER approved_by',
    'SELECT 1'
);
PREPARE stmt_rejection_reason FROM @sql_rejection_reason;
EXECUTE stmt_rejection_reason;
DEALLOCATE PREPARE stmt_rejection_reason;

-- Create index for faster queries on approval status
SET @has_idx_user_approval_status := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND index_name = 'idx_user_approval_status'
);
SET @sql_idx_user_approval_status := IF(
    @has_idx_user_approval_status = 0,
    'CREATE INDEX idx_user_approval_status ON user_read_model(approval_status)',
    'SELECT 1'
);
PREPARE stmt_idx_user_approval_status FROM @sql_idx_user_approval_status;
EXECUTE stmt_idx_user_approval_status;
DEALLOCATE PREPARE stmt_idx_user_approval_status;

-- Set existing users as APPROVED
UPDATE user_read_model SET approval_status = 'APPROVED' WHERE approval_status IS NULL;
