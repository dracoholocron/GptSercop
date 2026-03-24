-- =============================================================================
-- Migration V197: Client Request SWIFT Draft Integration
-- Integrates client portal requests with SWIFT drafts.
-- When a client saves a request, a SWIFT draft is created with mode='CLIENT'.
-- When opened from GlobalCMX workbox, the draft is loaded directly.
-- =============================================================================

-- =============================================================================
-- PART 1: Add draft_id to client_request_readmodel (idempotent)
-- This links a client request to its SWIFT draft
-- =============================================================================

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v197;
DELIMITER //
CREATE PROCEDURE add_col_if_not_exists_v197(
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

-- Add draft_id column if not exists
CALL add_col_if_not_exists_v197('client_request_readmodel', 'draft_id', "VARCHAR(100) NULL COMMENT 'Reference to swift_draft_readmodel.draft_id'");

-- Cleanup procedure
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v197;

-- Add index if not exists
DROP PROCEDURE IF EXISTS create_idx_if_not_exists_v197;
DELIMITER //
CREATE PROCEDURE create_idx_if_not_exists_v197()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'client_request_readmodel'
        AND INDEX_NAME = 'idx_client_request_draft_id'
    ) THEN
        CREATE INDEX idx_client_request_draft_id ON client_request_readmodel(draft_id);
    END IF;
END //
DELIMITER ;
CALL create_idx_if_not_exists_v197();
DROP PROCEDURE IF EXISTS create_idx_if_not_exists_v197;

-- =============================================================================
-- PART 2 & 3: SKIPPED - Table catalogo_personalizado_readmodel does not exist
-- These sections referenced a non-existent table and have been commented out.
-- The product type mappings can be configured through a separate mechanism.
-- =============================================================================
