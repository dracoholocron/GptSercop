-- =============================================================================
-- V201: Add is_system flag to custom_catalog_read_model
-- =============================================================================
-- Purpose: Distinguish system catalogs from user-created catalogs
-- System catalogs are required for the platform and cannot be deleted
-- =============================================================================

-- Helper procedure
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v201;
DELIMITER //
CREATE PROCEDURE add_col_if_not_exists_v201(
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

-- Add is_system column to custom_catalog_read_model
CALL add_col_if_not_exists_v201('custom_catalog_read_model', 'is_system', 'TINYINT(1) DEFAULT 0 COMMENT "1=System catalog (cannot be deleted), 0=User catalog"');

-- Add index for system catalogs
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v201;
DELIMITER //
CREATE PROCEDURE add_idx_if_not_exists_v201()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_catalog_read_model'
        AND INDEX_NAME = 'idx_custom_catalog_system'
    ) THEN
        CREATE INDEX idx_custom_catalog_system ON custom_catalog_read_model(is_system);
    END IF;
END //
DELIMITER ;
CALL add_idx_if_not_exists_v201();

-- Cleanup
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v201;
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v201;

-- =============================================================================
-- Mark existing core catalogs as system catalogs
-- =============================================================================

-- Currency catalog
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'CURRENCIES' AND level = 1;
-- Countries
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'COUNTRIES' AND level = 1;
-- Document types
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'DOCUMENT_TYPES' AND level = 1;
-- Payment terms
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'PAYMENT_TERMS' AND level = 1;
-- Bank codes
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'BANK_CODES' AND level = 1;
-- SWIFT message types
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'SWIFT_MESSAGE_TYPES' AND level = 1;
-- Incoterms
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'INCOTERMS' AND level = 1;
-- Product types
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'PRODUCT_TYPES' AND level = 1;
-- Operation statuses
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'OPERATION_STATUSES' AND level = 1;
-- Event categories
UPDATE custom_catalog_read_model SET is_system = 1 WHERE code = 'EVENT_CATEGORIES' AND level = 1;

-- Also mark child entries of system catalogs as system
UPDATE custom_catalog_read_model c
SET c.is_system = 1
WHERE c.level = 2
AND c.parent_catalog_id IN (
    SELECT id FROM (SELECT id FROM custom_catalog_read_model WHERE is_system = 1 AND level = 1) AS sys_cats
);
