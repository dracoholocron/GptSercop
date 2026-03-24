-- ============================================================================
-- V212__assign_scheduled_jobs_permissions.sql
-- Assigns scheduled jobs permissions to admin roles
-- NOTE: Skipped because 'role' table may not exist in all environments
-- ============================================================================

-- This migration is skipped as the role/permission tables may not exist
SELECT 'V212: Skipping role permission assignments - tables may not exist' AS migration_note;
