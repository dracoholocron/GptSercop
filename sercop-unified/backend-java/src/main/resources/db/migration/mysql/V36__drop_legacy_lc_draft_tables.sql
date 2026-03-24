-- =============================================================================
-- V36: Drop legacy Letter of Credit draft tables
-- =============================================================================
-- These tables are no longer needed as we now use the generic swift_draft_readmodel
-- table for all product types.
-- =============================================================================

-- Drop history table first (due to potential foreign key constraints)
DROP TABLE IF EXISTS letter_of_credit_draft_history;

-- Drop the main draft readmodel table
DROP TABLE IF EXISTS letter_of_credit_draft_readmodel;
