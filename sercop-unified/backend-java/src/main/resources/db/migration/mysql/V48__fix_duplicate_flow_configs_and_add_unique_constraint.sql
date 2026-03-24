-- V48: Fix duplicate flow configurations and add unique constraint
-- This migration:
-- 1. Removes any duplicate entries in event_flow_config_readmodel
-- 2. Adds a unique constraint to prevent future duplicates
-- 3. Ensures data integrity for the event flow state machine

-- =============================================
-- Step 1: Identify and remove duplicate flow configs
-- Keep the row with the lowest ID for each unique combination
-- MySQL approach: Use DELETE with self-join
-- =============================================

-- Delete duplicate rows keeping the one with the lowest ID
DELETE t1 FROM event_flow_config_readmodel t1
INNER JOIN event_flow_config_readmodel t2
WHERE t1.id > t2.id
  AND t1.operation_type = t2.operation_type
  AND (t1.from_event_code <=> t2.from_event_code)
  AND (t1.from_stage <=> t2.from_stage)
  AND t1.to_event_code = t2.to_event_code
  AND t1.language = t2.language;

-- =============================================
-- Step 2: Add unique constraint
-- Ensures no duplicate flow configurations can be created
-- Note: MySQL treats NULL values as distinct in UNIQUE indexes
-- So we use a generated column approach
-- =============================================

-- Add helper columns for the unique index (to handle NULLs)
ALTER TABLE event_flow_config_readmodel
ADD COLUMN from_event_code_uk VARCHAR(50) GENERATED ALWAYS AS (COALESCE(from_event_code, '')) STORED,
ADD COLUMN from_stage_uk VARCHAR(50) GENERATED ALWAYS AS (COALESCE(from_stage, '')) STORED;

-- Add unique index on the combination of fields that define a unique flow
ALTER TABLE event_flow_config_readmodel
ADD UNIQUE INDEX uk_event_flow_config_unique (
    operation_type,
    from_event_code_uk,
    from_stage_uk,
    to_event_code,
    language
);
