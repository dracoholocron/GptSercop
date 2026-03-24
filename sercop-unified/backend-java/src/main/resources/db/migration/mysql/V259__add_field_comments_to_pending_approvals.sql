-- Add field_comments column to pending_event_approval_readmodel
-- Stores per-field comments from approvers when rejecting (JSON format)
-- Example: {":20:": {"comment": "...", "commentedAt": "...", "commentedBy": "..."}}
SET @dbname = DATABASE();
SET @tablename = 'pending_event_approval_readmodel';
SET @columnname = 'field_comments';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` JSON DEFAULT NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
