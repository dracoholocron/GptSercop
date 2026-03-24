-- Add accounting_nature column to product_type_config
-- This determines how pending balance is calculated:
-- DEBIT: pendingBalance = SUM(debits) - SUM(credits)  (default for LC, Guarantees)
-- CREDIT: pendingBalance = SUM(credits) - SUM(debits) (for Collections)

ALTER TABLE product_type_config
ADD COLUMN accounting_nature VARCHAR(10) DEFAULT 'DEBIT' NOT NULL
COMMENT 'DEBIT or CREDIT - determines pending balance calculation direction';

-- Set CREDIT nature for collection products
UPDATE product_type_config
SET accounting_nature = 'CREDIT'
WHERE product_type IN ('COLLECTION_IMPORT', 'COLLECTION_EXPORT');

-- All other products remain as DEBIT (default)
