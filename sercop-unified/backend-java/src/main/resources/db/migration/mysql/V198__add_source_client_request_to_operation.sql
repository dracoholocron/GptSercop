-- =====================================================
-- V198: Add source_client_request_id to operation_readmodel
-- =====================================================
-- This column stores the link between an operation and
-- the client request it was created from.
-- This enables loading client request documents when
-- viewing an operation.
-- =====================================================

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v198;
DELIMITER //
CREATE PROCEDURE add_col_if_not_exists_v198()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'operation_readmodel'
        AND COLUMN_NAME = 'source_client_request_id'
    ) THEN
        ALTER TABLE operation_readmodel
        ADD COLUMN source_client_request_id VARCHAR(36) NULL;
    END IF;
END //
DELIMITER ;
CALL add_col_if_not_exists_v198();
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v198;

-- Add index if not exists
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v198;
DELIMITER //
CREATE PROCEDURE add_idx_if_not_exists_v198()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'operation_readmodel'
        AND INDEX_NAME = 'idx_operation_source_client_request'
    ) THEN
        CREATE INDEX idx_operation_source_client_request ON operation_readmodel(source_client_request_id);
    END IF;
END //
DELIMITER ;
CALL add_idx_if_not_exists_v198();
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v198;

-- Update existing operations that have a matching client_request
-- (match by operation_id or reference) - only if client_request table exists
DROP PROCEDURE IF EXISTS update_operation_client_request_v198;
DELIMITER //
CREATE PROCEDURE update_operation_client_request_v198()
BEGIN
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'client_request'
    ) THEN
        UPDATE operation_readmodel o
        INNER JOIN client_request cr ON (
            cr.operation_id = o.operation_id
            OR cr.operation_reference = o.reference
        )
        SET o.source_client_request_id = cr.id
        WHERE o.source_client_request_id IS NULL;
    END IF;
END //
DELIMITER ;
CALL update_operation_client_request_v198();
DROP PROCEDURE IF EXISTS update_operation_client_request_v198;
