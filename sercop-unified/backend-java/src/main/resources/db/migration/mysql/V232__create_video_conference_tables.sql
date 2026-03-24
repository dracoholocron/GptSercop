-- =============================================================================
-- Video Conference Tables Migration
-- Creates tables for video conference meeting management
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Meeting Read Model Table
-- Stores video conference meeting records for auditing and retrieval
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id VARCHAR(255) UNIQUE,
    conference_id VARCHAR(255),
    operation_id VARCHAR(100),
    provider VARCHAR(50) NOT NULL,
    meeting_url VARCHAR(500),
    calendar_event_url VARCHAR(500),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    scheduled_start DATETIME NOT NULL,
    scheduled_end DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    client_id VARCHAR(100),
    client_name VARCHAR(200),
    attendees TEXT,
    notes TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    updated_by VARCHAR(100),
    cancellation_reason VARCHAR(500),
    cancelled_by VARCHAR(100),
    cancelled_at DATETIME,

    -- Indexes for common queries
    INDEX idx_meeting_operation (operation_id),
    INDEX idx_meeting_client (client_id),
    INDEX idx_meeting_provider (provider),
    INDEX idx_meeting_status (status),
    INDEX idx_meeting_scheduled (scheduled_start, status),
    INDEX idx_meeting_created_by (created_by, scheduled_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Meeting History Read Model Table
-- Records all changes made to meetings for audit trail
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_history_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    previous_scheduled_start DATETIME,
    new_scheduled_start DATETIME,
    previous_scheduled_end DATETIME,
    new_scheduled_end DATETIME,
    notes TEXT,
    snapshot_before TEXT,
    snapshot_after TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for history queries
    INDEX idx_meeting_history_meeting (meeting_id),
    INDEX idx_meeting_history_action (action_type),
    INDEX idx_meeting_history_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Add menu item for video conferences (optional)
-- -----------------------------------------------------------------------------
-- INSERT INTO menu_item (code, parent_code, label_key, icon, route, display_order, is_active, permission_required)
-- VALUES ('VIDEO_CONFERENCE', 'OPERATIONS', 'menu.videoConference', 'FiVideo', '/video-conference', 60, TRUE, 'VIDEO_CONFERENCE_VIEW')
-- ON DUPLICATE KEY UPDATE label_key = VALUES(label_key);
