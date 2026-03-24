-- =====================================================
-- V38: Add MODE column to swift_draft_readmodel table
-- =====================================================
-- Purpose: Track the creation mode of SWIFT drafts
-- Values: EXPERT, CLIENT, WIZARD
-- This allows the system to reopen drafts in their original mode
-- =====================================================

-- Check if column exists before adding it (idempotent migration)
SET @dbname = DATABASE();
SET @tablename = 'swift_draft_readmodel';
SET @columnname = 'mode';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(20) DEFAULT ''EXPERT'' AFTER status')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing records to have default value (if column was just added)
UPDATE swift_draft_readmodel SET mode = 'EXPERT' WHERE mode IS NULL;

-- Create index for filtering by mode (if it doesn't exist)
SET @indexname = 'idx_swift_draft_mode';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1', -- Index exists, do nothing
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(', @columnname, ')')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;
