-- ==================================================
-- Migration V62: Drop guarantee_draft_readmodel table
-- ==================================================
-- This table is no longer needed as guarantees now use
-- the unified draft_readmodel table like other products
-- ==================================================

-- Drop the table if it exists
DROP TABLE IF EXISTS guarantee_draft_readmodel;

-- ==================================================
-- End of migration V62
-- ==================================================
