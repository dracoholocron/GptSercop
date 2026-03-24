-- =============================================================================
-- Migration V193: Add missing columns to client_request_readmodel
-- Since we are consolidating to use only client_request_readmodel table,
-- we need to add some columns that were originally only in client_request
-- =============================================================================

-- Add custom_data column for storing form data as JSON
SET @columnExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'custom_data'
);

SET @sql = IF(@columnExists = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN custom_data JSON NULL COMMENT ''All form data as JSON''',
    'SELECT ''Column custom_data already exists'' as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add status_detail column
SET @columnExists2 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'status_detail'
);

SET @sql2 = IF(@columnExists2 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN status_detail VARCHAR(500) NULL COMMENT ''Additional status detail''',
    'SELECT ''Column status_detail already exists'' as message');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Add approved_by_user_id column
SET @columnExists3 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'approved_by_user_id'
);

SET @sql3 = IF(@columnExists3 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN approved_by_user_id CHAR(36) NULL COMMENT ''User who approved/rejected the request''',
    'SELECT ''Column approved_by_user_id already exists'' as message');

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Add review_started_at column
SET @columnExists4 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'review_started_at'
);

SET @sql4 = IF(@columnExists4 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN review_started_at TIMESTAMP NULL COMMENT ''When review started''',
    'SELECT ''Column review_started_at already exists'' as message');

PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Add created_by column for audit
SET @columnExists5 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'created_by'
);

SET @sql5 = IF(@columnExists5 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN created_by VARCHAR(100) NULL COMMENT ''User who created the request''',
    'SELECT ''Column created_by already exists'' as message');

PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- Add updated_by column for audit
SET @columnExists6 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'updated_by'
);

SET @sql6 = IF(@columnExists6 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN updated_by VARCHAR(100) NULL COMMENT ''User who last updated the request''',
    'SELECT ''Column updated_by already exists'' as message');

PREPARE stmt6 FROM @sql6;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

-- Add updated_at column (separate from read_model_updated_at for entity compatibility)
SET @columnExists7 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'updated_at'
);

SET @sql7 = IF(@columnExists7 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT ''Last update timestamp''',
    'SELECT ''Column updated_at already exists'' as message');

PREPARE stmt7 FROM @sql7;
EXECUTE stmt7;
DEALLOCATE PREPARE stmt7;

-- Add source_channel column
SET @columnExists8 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'source_channel'
);

SET @sql8 = IF(@columnExists8 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN source_channel VARCHAR(30) DEFAULT ''PORTAL'' COMMENT ''PORTAL, API, BATCH''',
    'SELECT ''Column source_channel already exists'' as message');

PREPARE stmt8 FROM @sql8;
EXECUTE stmt8;
DEALLOCATE PREPARE stmt8;

-- Add source_ip column
SET @columnExists9 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'source_ip'
);

SET @sql9 = IF(@columnExists9 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN source_ip VARCHAR(45) NULL COMMENT ''Source IP address''',
    'SELECT ''Column source_ip already exists'' as message');

PREPARE stmt9 FROM @sql9;
EXECUTE stmt9;
DEALLOCATE PREPARE stmt9;

-- Add version column for optimistic locking
SET @columnExists10 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'version'
);

SET @sql10 = IF(@columnExists10 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN version INT DEFAULT 1 COMMENT ''Version for optimistic locking''',
    'SELECT ''Column version already exists'' as message');

PREPARE stmt10 FROM @sql10;
EXECUTE stmt10;
DEALLOCATE PREPARE stmt10;
