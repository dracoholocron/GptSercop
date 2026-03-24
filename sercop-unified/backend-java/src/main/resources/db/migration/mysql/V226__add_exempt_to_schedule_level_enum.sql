-- =====================================================
-- V186: Add EXEMPT value to schedule_level_applied enum
-- The Java enum ScheduleLevelApplied includes EXEMPT but
-- the database ENUM was missing this value
-- =====================================================

ALTER TABLE system_schedule_access_log_read_model
MODIFY COLUMN schedule_level_applied ENUM('GLOBAL', 'ROLE', 'USER', 'EXCEPTION', 'HOLIDAY', 'EXEMPT') NOT NULL;
