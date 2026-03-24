-- Migration: Add meeting notes table and operation fields to meetings
-- Date: 2026-02-06

-- Add operation_type column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'meeting_readmodel'
                   AND column_name = 'operation_type');
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE meeting_readmodel ADD COLUMN operation_type VARCHAR(50) NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add operation_reference column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'meeting_readmodel'
                   AND column_name = 'operation_reference');
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE meeting_readmodel ADD COLUMN operation_reference VARCHAR(100) NULL',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index for operation type (idempotent)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                   WHERE table_schema = DATABASE()
                   AND table_name = 'meeting_readmodel'
                   AND index_name = 'idx_meeting_operation_type');
SET @ddl = IF(@idx_exists = 0,
    'CREATE INDEX idx_meeting_operation_type ON meeting_readmodel(operation_type)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create meeting_notes table
CREATE TABLE IF NOT EXISTS meeting_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id BIGINT NOT NULL,
    summary TEXT,
    agreements TEXT,
    action_items TEXT,
    follow_up_date DATETIME,
    recording_url VARCHAR(500),
    attachments TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    updated_by VARCHAR(100),
    CONSTRAINT fk_meeting_note_meeting FOREIGN KEY (meeting_id) REFERENCES meeting_readmodel(id) ON DELETE CASCADE
);

-- Create indexes for meeting_notes (idempotent)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                   WHERE table_schema = DATABASE()
                   AND table_name = 'meeting_notes'
                   AND index_name = 'idx_note_meeting');
SET @ddl = IF(@idx_exists = 0,
    'CREATE INDEX idx_note_meeting ON meeting_notes(meeting_id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                   WHERE table_schema = DATABASE()
                   AND table_name = 'meeting_notes'
                   AND index_name = 'idx_note_created');
SET @ddl = IF(@idx_exists = 0,
    'CREATE INDEX idx_note_created ON meeting_notes(created_at)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                   WHERE table_schema = DATABASE()
                   AND table_name = 'meeting_notes'
                   AND index_name = 'idx_note_follow_up');
SET @ddl = IF(@idx_exists = 0,
    'CREATE INDEX idx_note_follow_up ON meeting_notes(follow_up_date)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
