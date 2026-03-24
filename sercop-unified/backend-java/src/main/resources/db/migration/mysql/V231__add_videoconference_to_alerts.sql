-- =============================================================================
-- NOTE: This migration is now a no-op
-- The video conference columns (meeting_id, meeting_url, meeting_provider, organizer_name)
-- were already added in V229__create_user_alerts_system.sql
-- The VIDEO_CALL alert type was also added in V229
-- Keeping this file to maintain Flyway version history
-- =============================================================================

-- No changes needed - columns and data already exist
SELECT 1;
