-- V84: Fix product_type_config account_prefix mapping based on actual GLE data
-- Problem: Account 630305004/640305004 was mapped to LC_EXPORT but actually contains GUARANTEE (GID) entries

-- First, expand the account_prefix column to allow more accounts
ALTER TABLE product_type_config MODIFY account_prefix VARCHAR(255);

-- Fix LC_EXPORT: remove 630305004,640305004 (these are GUARANTEE accounts, not LC)
UPDATE product_type_config
SET account_prefix = '630305003,640305003'
WHERE product_type = 'LC_EXPORT';

-- Fix GUARANTEE: add 630305004,640305004 (GLE data shows GID entries in these accounts)
UPDATE product_type_config
SET account_prefix = '630290002,630290011,640290002,640290011,630305004,640305004'
WHERE product_type = 'GUARANTEE';

-- Fix GUARANTEE_RECEIVED: add 630305004,640305004
UPDATE product_type_config
SET account_prefix = '630290002,630290011,640290002,640290011,630305004,640305004'
WHERE product_type = 'GUARANTEE_RECEIVED';

-- Fix GUARANTEE_ISSUED: add 630305004,640305004
UPDATE product_type_config
SET account_prefix = '630290002,630290011,640290002,640290011,630305004,640305004'
WHERE product_type = 'GUARANTEE_ISSUED';
