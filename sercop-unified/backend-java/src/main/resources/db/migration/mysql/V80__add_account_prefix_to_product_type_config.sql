-- Add account_prefix column to product_type_config
-- This column stores the accounting account prefix for filtering GLE entries
-- Configure the correct prefixes for each product type from the admin catalog

ALTER TABLE product_type_config
ADD COLUMN account_prefix VARCHAR(50) NULL AFTER category;
