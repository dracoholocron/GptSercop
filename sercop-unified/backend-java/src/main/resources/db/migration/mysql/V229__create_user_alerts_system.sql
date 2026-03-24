-- =============================================================================
-- Migration: User Alerts and Follow-up System
-- Description: Creates tables for user alerts, business requests, and related entities
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: user_alert_readmodel
-- Stores user alerts and follow-up activities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_alert_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id VARCHAR(36) NOT NULL UNIQUE,

    -- User and assignment
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(200),
    assigned_by VARCHAR(100),
    assigned_role VARCHAR(50),

    -- Content
    title VARCHAR(300) NOT NULL,
    description TEXT,
    alert_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',

    -- Source/Origin
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(100),
    source_reference VARCHAR(100),
    source_module VARCHAR(50),

    -- Linking
    operation_id VARCHAR(100),
    request_id VARCHAR(100),
    draft_id VARCHAR(100),
    client_id VARCHAR(100),
    client_name VARCHAR(200),

    -- Video Conference
    meeting_id VARCHAR(100),
    meeting_url VARCHAR(500),
    meeting_provider VARCHAR(50),
    organizer_name VARCHAR(200),

    -- Scheduling
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    due_date DATETIME,

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    processed_at DATETIME,
    processed_by VARCHAR(100),
    processing_notes TEXT,

    -- Rescheduling
    original_scheduled_date DATE,
    reschedule_count INT DEFAULT 0,

    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_alert_user (user_id, status, scheduled_date),
    INDEX idx_user_alert_date (scheduled_date, status),
    INDEX idx_user_alert_operation (operation_id),
    INDEX idx_user_alert_client (client_id),
    INDEX idx_user_alert_source (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User alerts and follow-up activities';

-- -----------------------------------------------------------------------------
-- Table: user_alert_history_readmodel
-- Stores history of changes for each alert
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_alert_history_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    history_id VARCHAR(36) NOT NULL UNIQUE,
    alert_id VARCHAR(36) NOT NULL,

    -- Change info
    action_type VARCHAR(30) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    previous_date DATE,
    new_date DATE,
    notes TEXT,

    -- Additional context
    previous_priority VARCHAR(20),
    new_priority VARCHAR(20),
    previous_title VARCHAR(300),
    new_title VARCHAR(300),
    previous_assigned_to VARCHAR(100),
    new_assigned_to VARCHAR(100),

    -- Security audit
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),

    INDEX idx_alert_history_alert (alert_id),
    INDEX idx_alert_history_action (action_type),
    INDEX idx_alert_history_created (created_at),

    CONSTRAINT fk_alert_history_alert FOREIGN KEY (alert_id)
        REFERENCES user_alert_readmodel(alert_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='History of alert changes';

-- -----------------------------------------------------------------------------
-- Table: business_request_readmodel
-- Stores business requests from AI extraction and other sources
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_request_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL UNIQUE,
    request_number VARCHAR(50) NOT NULL UNIQUE,

    -- Source
    source_type VARCHAR(50) NOT NULL,
    extraction_id VARCHAR(36),

    -- Content
    title VARCHAR(300) NOT NULL,
    description TEXT,
    extracted_data JSON,

    -- Client info
    client_id VARCHAR(100),
    client_name VARCHAR(200),

    -- Operation type to create
    operation_type VARCHAR(50),

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,

    -- Alerts configuration (JSON array of alerts to create on approval)
    alerts_config JSON,

    -- Conversion tracking
    converted_to_draft_id VARCHAR(100),
    converted_to_operation_id VARCHAR(100),
    converted_at DATETIME,

    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    approved_at DATETIME,
    approved_by VARCHAR(100),
    rejected_at DATETIME,
    rejected_by VARCHAR(100),

    INDEX idx_business_request_status (status),
    INDEX idx_business_request_created (created_by, status),
    INDEX idx_business_request_client (client_id),
    INDEX idx_business_request_extraction (extraction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Business requests from AI extraction and other sources';

-- -----------------------------------------------------------------------------
-- Table: alert_type_config
-- Configuration for alert types with i18n support
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_type_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(50) NOT NULL UNIQUE,

    -- Display
    label_es VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL,
    description_es TEXT,
    description_en TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),

    -- Settings
    default_priority VARCHAR(20) DEFAULT 'NORMAL',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,

    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Alert type configuration';

-- -----------------------------------------------------------------------------
-- Insert default alert types
-- -----------------------------------------------------------------------------
INSERT INTO alert_type_config
    (type_code, label_es, label_en, description_es, description_en, icon, color, default_priority, display_order)
VALUES
    ('FOLLOW_UP', 'Seguimiento', 'Follow-up', 'Actividad de seguimiento programada', 'Scheduled follow-up activity', 'FiUserCheck', 'blue', 'NORMAL', 1),
    ('REMINDER', 'Recordatorio', 'Reminder', 'Recordatorio general', 'General reminder', 'FiBell', 'yellow', 'NORMAL', 2),
    ('DEADLINE', 'Fecha Límite', 'Deadline', 'Fecha límite importante', 'Important deadline', 'FiClock', 'red', 'HIGH', 3),
    ('TASK', 'Tarea', 'Task', 'Tarea asignada', 'Assigned task', 'FiCheckSquare', 'green', 'NORMAL', 4),
    ('DOCUMENT_REVIEW', 'Revisión de Documento', 'Document Review', 'Documento pendiente de revisión', 'Document pending review', 'FiFileText', 'purple', 'NORMAL', 5),
    ('CLIENT_CONTACT', 'Contactar Cliente', 'Contact Client', 'Contactar al cliente', 'Contact the client', 'FiPhone', 'teal', 'NORMAL', 6),
    ('OPERATION_UPDATE', 'Actualizar Operación', 'Update Operation', 'Actualizar información de operación', 'Update operation information', 'FiRefreshCw', 'orange', 'NORMAL', 7),
    ('COMPLIANCE_CHECK', 'Verificación de Cumplimiento', 'Compliance Check', 'Verificación de cumplimiento regulatorio', 'Regulatory compliance check', 'FiShield', 'red', 'HIGH', 8),
    ('VIDEO_CALL', 'Videollamada', 'Video Call', 'Reunión por videollamada programada', 'Scheduled video conference meeting', 'FiVideo', 'purple', 'NORMAL', 9)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- Add CREATE_ALERT action type to event_action_type if exists
-- NOTE: Commented out - table may not exist in all environments
-- -----------------------------------------------------------------------------
-- INSERT INTO event_action_type (code, name, description, category, is_active)
-- SELECT 'CREATE_ALERT', 'Crear Alerta', 'Crea una alerta de seguimiento para un usuario', 'WORKFLOW', TRUE
-- WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'event_action_type')
-- AND NOT EXISTS (SELECT 1 FROM event_action_type WHERE code = 'CREATE_ALERT');

-- -----------------------------------------------------------------------------
-- NOTE: Menu items, permissions, and role assignments are commented out
-- because these tables (menu_item, permission, role_permission, role)
-- don't exist in the read model database schema.
-- These should be added via a separate migration or manual SQL if needed.
-- -----------------------------------------------------------------------------

-- Menu Item: Alerts Agenda (SKIPPED - table doesn't exist)
-- Permission inserts (SKIPPED - table doesn't exist)
-- Role permission assignments (SKIPPED - table doesn't exist)
