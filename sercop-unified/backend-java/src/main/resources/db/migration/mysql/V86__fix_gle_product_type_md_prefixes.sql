-- V86: Fix product_type for M* and D* prefixes in gle_read_model
-- These prefixes are LC_IMPORT (migrated LCs and drafts)

-- M* = LC_IMPORT (LCs migradas de sistemas anteriores)
UPDATE gle_read_model
SET product_type = 'LC_IMPORT'
WHERE LEFT(reference, 1) = 'M'
AND (product_type IS NULL OR product_type = '');

-- D* = LC_IMPORT (Drafts de LC)
UPDATE gle_read_model
SET product_type = 'LC_IMPORT'
WHERE LEFT(reference, 1) = 'D'
AND (product_type IS NULL OR product_type = '');

-- Also fix operation_readmodel for I* prefix that might be wrong
UPDATE operation_readmodel
SET product_type = 'LC_IMPORT'
WHERE LEFT(reference, 1) = 'I'
AND product_type != 'LC_IMPORT';
