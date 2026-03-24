-- Add reference_prefix column to product_type_config
-- This column stores the operation reference prefix (e.g., I, J, L) used to identify product types
-- from GLE entries, enabling dynamic product type detection in reports

-- Check if column exists and add if not
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns
                      WHERE table_schema = DATABASE()
                      AND table_name = 'product_type_config'
                      AND column_name = 'reference_prefix');
SET @sql = IF(@column_exists = 0,
              'ALTER TABLE product_type_config ADD COLUMN reference_prefix VARCHAR(10) NULL AFTER account_prefix',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate reference_prefix based on product type
-- These prefixes match the first character(s) of operation references
UPDATE product_type_config SET reference_prefix = 'I' WHERE product_type = 'LC_IMPORT' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'L' WHERE product_type = 'LC_EXPORT' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'J' WHERE product_type = 'GUARANTEE_RECEIVED' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'A' WHERE product_type = 'GUARANTEE' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'B' WHERE product_type = 'GUARANTEE_ISSUED' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'K' WHERE product_type = 'AVAL' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'S' WHERE product_type = 'STANDBY_LC' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'E,G' WHERE product_type = 'COLLECTION_EXPORT' AND (reference_prefix IS NULL OR reference_prefix = '');
UPDATE product_type_config SET reference_prefix = 'IE' WHERE product_type = 'COLLECTION_IMPORT' AND (reference_prefix IS NULL OR reference_prefix = '');
