-- Add custom_data column to swift_draft_readmodel table
-- This column stores custom fields data in JSON format for repeatable sections and additional fields

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'swift_draft_readmodel';
SET @columnname = 'custom_data';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL COMMENT ''Custom fields data in JSON format''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
