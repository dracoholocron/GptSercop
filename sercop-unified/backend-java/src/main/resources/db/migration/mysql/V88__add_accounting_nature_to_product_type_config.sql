-- Add accounting_nature column to product_type_config
-- This determines how pending balance is calculated:
-- DEBIT: pendingBalance = SUM(debits) - SUM(credits)  (default for LC, Guarantees)
-- CREDIT: pendingBalance = SUM(credits) - SUM(debits) (for Collections)

SET @has_accounting_nature := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'product_type_config'
      AND column_name = 'accounting_nature'
);
SET @add_accounting_nature_sql := IF(
    @has_accounting_nature = 0,
    "ALTER TABLE product_type_config ADD COLUMN accounting_nature VARCHAR(10) DEFAULT 'DEBIT' NOT NULL COMMENT 'DEBIT or CREDIT - determines pending balance calculation direction'",
    'SELECT 1'
);
PREPARE stmt_add_accounting_nature FROM @add_accounting_nature_sql;
EXECUTE stmt_add_accounting_nature;
DEALLOCATE PREPARE stmt_add_accounting_nature;

-- Set CREDIT nature for collection products
UPDATE product_type_config
SET accounting_nature = 'CREDIT'
WHERE product_type IN ('COLLECTION_IMPORT', 'COLLECTION_EXPORT');

-- All other products remain as DEBIT (default)
