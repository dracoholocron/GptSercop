-- V264: Add id_prefix column to product_type_config
-- Stores the prefix used for generating operation IDs per product type
-- This replaces the hardcoded switch in OperationCommandService.generateOperationId()
-- Made idempotent: checks if column exists before adding

-- Add column only if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'product_type_config'
                   AND column_name = 'id_prefix');

SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE product_type_config ADD COLUMN id_prefix VARCHAR(5) NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate prefixes for existing product types (idempotent UPDATEs)
UPDATE product_type_config SET id_prefix = 'LCI' WHERE product_type = 'LC_IMPORT' AND (id_prefix IS NULL OR id_prefix = '');
UPDATE product_type_config SET id_prefix = 'LCE' WHERE product_type = 'LC_EXPORT' AND (id_prefix IS NULL OR id_prefix = '');
UPDATE product_type_config SET id_prefix = 'GAR' WHERE product_type = 'GUARANTEE' AND (id_prefix IS NULL OR id_prefix = '');
UPDATE product_type_config SET id_prefix = 'COL' WHERE product_type = 'COLLECTION' AND (id_prefix IS NULL OR id_prefix = '');
UPDATE product_type_config SET id_prefix = 'SBY' WHERE product_type = 'STANDBY_LC' AND (id_prefix IS NULL OR id_prefix = '');
UPDATE product_type_config SET id_prefix = 'COI' WHERE product_type = 'COLLECTION_IMPORT' AND (id_prefix IS NULL OR id_prefix = '');
UPDATE product_type_config SET id_prefix = 'COE' WHERE product_type = 'COLLECTION_EXPORT' AND (id_prefix IS NULL OR id_prefix = '');
