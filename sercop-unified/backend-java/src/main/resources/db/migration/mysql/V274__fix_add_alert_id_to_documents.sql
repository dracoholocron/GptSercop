-- Fix: Add alert_id column to documents if it doesn't exist
-- This is an idempotent version of V273 in case that migration was skipped or failed

-- Add alert_id to documents table if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'alert_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE documents ADD COLUMN alert_id VARCHAR(100)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on documents.alert_id if missing
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND INDEX_NAME = 'idx_doc_alert');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_doc_alert ON documents(alert_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add alert_id to document_readmodel table if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_readmodel' AND COLUMN_NAME = 'alert_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE document_readmodel ADD COLUMN alert_id VARCHAR(100)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on document_readmodel.alert_id if missing
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_readmodel' AND INDEX_NAME = 'idx_doc_rm_alert');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_doc_rm_alert ON document_readmodel(alert_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
