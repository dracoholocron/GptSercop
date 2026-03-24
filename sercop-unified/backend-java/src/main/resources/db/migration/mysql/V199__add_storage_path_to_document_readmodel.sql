-- =============================================================================
-- V199: Add storage_path and storage_provider to document_readmodel
-- =============================================================================
-- Purpose: Enable file existence validation in document queries
-- Note: CQRS architecture - document_entity is in eventstore, document_readmodel is in read DB
-- =============================================================================

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v199;
DELIMITER //
CREATE PROCEDURE add_col_if_not_exists_v199(
    IN p_table VARCHAR(100),
    IN p_column VARCHAR(100),
    IN p_definition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Add storage_path column
CALL add_col_if_not_exists_v199('document_readmodel', 'storage_path', 'VARCHAR(1000) NULL');

-- Add storage_provider column
CALL add_col_if_not_exists_v199('document_readmodel', 'storage_provider', 'VARCHAR(20) NULL');

-- Cleanup
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v199;

-- Update existing records from documents table (same database) - with check
DROP PROCEDURE IF EXISTS update_doc_storage_v199;
DELIMITER //
CREATE PROCEDURE update_doc_storage_v199()
BEGIN
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'documents'
    ) THEN
        UPDATE document_readmodel rm
        INNER JOIN documents de ON rm.document_id = de.document_id
        SET rm.storage_path = de.storage_path,
            rm.storage_provider = de.storage_provider
        WHERE rm.storage_path IS NULL;
    END IF;
END //
DELIMITER ;
CALL update_doc_storage_v199();
DROP PROCEDURE IF EXISTS update_doc_storage_v199;

-- Create index for storage provider queries (if not exists)
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v199;
DELIMITER //
CREATE PROCEDURE add_idx_if_not_exists_v199()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'document_readmodel'
        AND INDEX_NAME = 'idx_doc_rm_storage_provider'
    ) THEN
        CREATE INDEX idx_doc_rm_storage_provider ON document_readmodel(storage_provider);
    END IF;
END //
DELIMITER ;
CALL add_idx_if_not_exists_v199();
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v199;
