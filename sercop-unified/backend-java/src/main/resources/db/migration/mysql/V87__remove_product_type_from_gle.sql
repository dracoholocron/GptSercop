-- Remove product_type column from gle_read_model
-- product_type is now obtained via JOIN with operation_readmodel
-- This eliminates data redundancy and prevents inconsistencies
-- Note: Column was already dropped manually, this migration is for tracking purposes

-- This is a no-op migration since the column was already removed
SELECT 'Column product_type already removed from gle_read_model' AS migration_note;
