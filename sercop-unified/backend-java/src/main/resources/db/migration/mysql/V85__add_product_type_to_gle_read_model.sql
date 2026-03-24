-- V85: Add product_type column to gle_read_model based on reference prefix
-- This allows accurate reporting by product type instead of account-based mapping

-- Add product_type column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns
                      WHERE table_schema = DATABASE()
                      AND table_name = 'gle_read_model'
                      AND column_name = 'product_type');
SET @sql = IF(@column_exists = 0,
              'ALTER TABLE gle_read_model ADD COLUMN product_type VARCHAR(50) NULL',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index for efficient queries (if not exists)
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics
                     WHERE table_schema = DATABASE()
                     AND table_name = 'gle_read_model'
                     AND index_name = 'idx_gle_product_type');
SET @sql = IF(@index_exists = 0,
              'CREATE INDEX idx_gle_product_type ON gle_read_model(product_type)',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics
                     WHERE table_schema = DATABASE()
                     AND table_name = 'gle_read_model'
                     AND index_name = 'idx_gle_reference');
SET @sql = IF(@index_exists = 0,
              'CREATE INDEX idx_gle_reference ON gle_read_model(reference)',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate product_type based on reference prefix
-- Using the same mapping as product_type_config.reference_prefix
UPDATE gle_read_model SET product_type = 'LC_IMPORT' WHERE LEFT(reference, 1) = 'I' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'LC_EXPORT' WHERE LEFT(reference, 1) = 'L' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'GUARANTEE' WHERE LEFT(reference, 1) = 'A' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'GUARANTEE_ISSUED' WHERE LEFT(reference, 1) = 'B' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'GUARANTEE_RECEIVED' WHERE LEFT(reference, 1) = 'J' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'AVAL' WHERE LEFT(reference, 1) = 'K' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'STANDBY_LC' WHERE LEFT(reference, 1) = 'S' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'COLLECTION_IMPORT' WHERE LEFT(reference, 1) = 'C' AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'COLLECTION_EXPORT' WHERE LEFT(reference, 1) IN ('E', 'G') AND product_type IS NULL;
UPDATE gle_read_model SET product_type = 'REIMBURSEMENT' WHERE LEFT(reference, 1) = 'R' AND product_type IS NULL;
