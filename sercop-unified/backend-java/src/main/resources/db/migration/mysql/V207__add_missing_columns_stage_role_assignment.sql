-- =============================================================================
-- Migration V207: Add missing columns to stage_role_assignment table
-- Fixes SQL Error 1054: Unknown column 'created_by' in 'field list'
-- =============================================================================

-- Add created_by column if not exists
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'stage_role_assignment'
    AND COLUMN_NAME = 'created_by'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE stage_role_assignment ADD COLUMN created_by VARCHAR(100) DEFAULT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add updated_by column if not exists
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'stage_role_assignment'
    AND COLUMN_NAME = 'updated_by'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE stage_role_assignment ADD COLUMN updated_by VARCHAR(100) DEFAULT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to have system as created_by
UPDATE stage_role_assignment
SET created_by = 'system'
WHERE created_by IS NULL;
