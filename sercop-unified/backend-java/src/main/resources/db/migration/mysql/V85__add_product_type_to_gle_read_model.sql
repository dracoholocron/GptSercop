-- V85: Add product_type column to gle_read_model based on reference prefix
-- This allows accurate reporting by product type instead of account-based mapping

CREATE TABLE IF NOT EXISTS gle_read_model (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inr VARCHAR(20),
    objtyp VARCHAR(10),
    objinr VARCHAR(20),
    trninr VARCHAR(20),
    act VARCHAR(50),
    dbtcdt VARCHAR(1),
    cur VARCHAR(3),
    amt DECIMAL(18,3),
    syscur VARCHAR(3),
    sysamt DECIMAL(18,3),
    valdat DATETIME,
    bucdat DATETIME,
    txt1 VARCHAR(255),
    txt2 VARCHAR(255),
    txt3 VARCHAR(255),
    prn VARCHAR(50),
    expses VARCHAR(50),
    tsyref VARCHAR(50),
    expflg VARCHAR(10),
    acttyp VARCHAR(10),
    reference VARCHAR(100),
    referencia VARCHAR(100),
    product_type VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gle_reference (reference),
    INDEX idx_gle_referencia (referencia),
    INDEX idx_gle_product_type (product_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @gle_has_reference := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'gle_read_model'
      AND column_name = 'reference'
);
SET @gle_reference_sql := IF(
    @gle_has_reference = 0,
    'ALTER TABLE gle_read_model ADD COLUMN reference VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE stmt_gle_reference FROM @gle_reference_sql;
EXECUTE stmt_gle_reference;
DEALLOCATE PREPARE stmt_gle_reference;

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
