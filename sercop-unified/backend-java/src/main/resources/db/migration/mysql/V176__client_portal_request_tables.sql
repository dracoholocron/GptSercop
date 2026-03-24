-- =============================================================================
-- Migration V176: Client Portal - Request Tables
-- Creates tables for client requests
-- All configurations are database-driven, no hardcoded values
-- =============================================================================

-- ============================================
-- 1. Main client_request table (Write Model)
-- ============================================

CREATE TABLE IF NOT EXISTS client_request (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Client reference (data isolation)
    client_id CHAR(36) NOT NULL COMMENT 'FK to participante - for data isolation',
    client_name VARCHAR(200) NOT NULL COMMENT 'Denormalized for display',

    -- Product type
    product_type VARCHAR(50) NOT NULL COMMENT 'GUARANTEE, LC_IMPORT, LC_EXPORT, COLLECTION',
    product_subtype VARCHAR(50) NULL COMMENT 'Specific subtype if applicable',

    -- Request number (auto-generated)
    request_number VARCHAR(30) NOT NULL COMMENT 'Auto-generated request number',

    -- Status tracking
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, SUBMITTED, IN_REVIEW, PENDING_DOCUMENTS, APPROVED, REJECTED, CANCELLED',
    status_detail VARCHAR(100) NULL COMMENT 'Additional status detail',

    -- Workflow tracking
    current_step INT DEFAULT 1 COMMENT 'Current wizard step',
    total_steps INT DEFAULT 1 COMMENT 'Total wizard steps',
    completion_percentage INT DEFAULT 0 COMMENT 'Completion percentage',

    -- After approval: link to created operation
    operation_id CHAR(36) NULL COMMENT 'FK to operation created after approval',
    operation_reference VARCHAR(30) NULL COMMENT 'Operation reference number',

    -- Amount summary (denormalized for display/filtering)
    amount DECIMAL(18,2) NULL COMMENT 'Request amount',
    currency VARCHAR(3) NULL COMMENT 'Currency code',

    -- Key dates
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL COMMENT 'When submitted by client',
    review_started_at TIMESTAMP NULL COMMENT 'When review started',
    approved_at TIMESTAMP NULL COMMENT 'When approved',
    rejected_at TIMESTAMP NULL COMMENT 'When rejected',
    expires_at TIMESTAMP NULL COMMENT 'Request expiry date',

    -- Assignment tracking
    assigned_to_user_id CHAR(36) NULL COMMENT 'Current assignee',
    assigned_to_user_name VARCHAR(100) NULL,
    approved_by_user_id CHAR(36) NULL,
    approved_by_user_name VARCHAR(100) NULL,
    rejection_reason TEXT NULL COMMENT 'Rejection reason',

    -- SLA tracking
    sla_hours INT NULL COMMENT 'Configured SLA hours for this request',
    sla_deadline TIMESTAMP NULL COMMENT 'Calculated SLA deadline',
    sla_breached BOOLEAN DEFAULT FALSE COMMENT 'TRUE if SLA was breached',

    -- Priority
    priority VARCHAR(20) DEFAULT 'NORMAL' COMMENT 'LOW, NORMAL, HIGH, URGENT',

    -- Source tracking
    source_channel VARCHAR(30) DEFAULT 'PORTAL' COMMENT 'PORTAL, API, BATCH',
    source_ip VARCHAR(45) NULL,

    -- Custom data (JSON storage for flexible fields)
    custom_data JSON NULL COMMENT 'All form data as JSON',

    -- Version for optimistic locking
    version INT DEFAULT 1,

    -- Audit
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Indexes
    INDEX idx_client_id (client_id),
    INDEX idx_status (status),
    INDEX idx_product_type (product_type),
    INDEX idx_created_at (created_at),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_assigned_to (assigned_to_user_id),
    INDEX idx_operation_id (operation_id),
    INDEX idx_request_number (request_number),
    INDEX idx_sla_deadline (sla_deadline),
    INDEX idx_priority (priority),

    -- Composite indexes for common queries
    INDEX idx_client_status (client_id, status),
    INDEX idx_client_product (client_id, product_type),
    INDEX idx_status_submitted (status, submitted_at),
    INDEX idx_assigned_status (assigned_to_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Client requests for trade finance products';

-- ============================================
-- 2. Client Request Read Model (Denormalized for queries)
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_readmodel (
    id CHAR(36) PRIMARY KEY,

    -- Client info (denormalized)
    client_id CHAR(36) NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    client_identification VARCHAR(50) NULL COMMENT 'RUC/Tax ID',
    client_contact_name VARCHAR(200) NULL COMMENT 'Contact person name',
    client_contact_email VARCHAR(100) NULL,

    -- Product info
    product_type VARCHAR(50) NOT NULL,
    product_type_label_key VARCHAR(100) NOT NULL COMMENT 'i18n key for product type',
    product_subtype VARCHAR(50) NULL,
    product_icon VARCHAR(50) NULL,
    product_color VARCHAR(30) NULL,

    -- Request number
    request_number VARCHAR(30) NOT NULL,

    -- Status with labels
    status VARCHAR(30) NOT NULL,
    status_label_key VARCHAR(100) NOT NULL COMMENT 'i18n key for status',
    status_color VARCHAR(30) NOT NULL COMMENT 'UI color for status badge',
    status_icon VARCHAR(50) NULL,

    -- Progress
    current_step INT DEFAULT 1,
    total_steps INT DEFAULT 1,
    completion_percentage INT DEFAULT 0,

    -- Operation link
    operation_id CHAR(36) NULL,
    operation_reference VARCHAR(30) NULL,

    -- Amount display
    amount DECIMAL(18,2) NULL,
    currency VARCHAR(3) NULL,
    amount_formatted VARCHAR(50) NULL COMMENT 'Pre-formatted amount for display',

    -- Key dates
    created_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,

    -- Days tracking
    days_since_creation INT DEFAULT 0 COMMENT 'Calculated days since creation',
    days_in_review INT DEFAULT 0 COMMENT 'Days in review',

    -- Assignment
    assigned_to_user_id CHAR(36) NULL,
    assigned_to_user_name VARCHAR(100) NULL,
    assigned_to_avatar_url VARCHAR(500) NULL,

    -- Approval
    approved_by_user_name VARCHAR(100) NULL,
    rejection_reason TEXT NULL,

    -- SLA
    sla_hours INT NULL,
    sla_deadline TIMESTAMP NULL,
    sla_breached BOOLEAN DEFAULT FALSE,
    sla_remaining_hours INT NULL COMMENT 'Hours remaining for SLA',
    sla_status VARCHAR(20) NULL COMMENT 'ON_TRACK, WARNING, CRITICAL, BREACHED',

    -- Priority
    priority VARCHAR(20) DEFAULT 'NORMAL',
    priority_label_key VARCHAR(100) NULL,
    priority_color VARCHAR(30) NULL,

    -- Summary fields for list display
    summary_line1 VARCHAR(200) NULL COMMENT 'Primary summary line',
    summary_line2 VARCHAR(200) NULL COMMENT 'Secondary summary line',

    -- Document count
    document_count INT DEFAULT 0,
    pending_document_count INT DEFAULT 0,

    -- Comments/notes count
    comment_count INT DEFAULT 0,
    unread_comment_count INT DEFAULT 0,

    -- Last activity
    last_activity_at TIMESTAMP NULL,
    last_activity_by VARCHAR(100) NULL,
    last_activity_description VARCHAR(200) NULL,

    -- Search optimization
    search_text TEXT NULL COMMENT 'Concatenated searchable text',

    -- Audit
    read_model_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_model_updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_rm_client_id (client_id),
    INDEX idx_rm_status (status),
    INDEX idx_rm_product_type (product_type),
    INDEX idx_rm_created_at (created_at),
    INDEX idx_rm_submitted_at (submitted_at),
    INDEX idx_rm_assigned_to (assigned_to_user_id),
    INDEX idx_rm_sla_status (sla_status),
    INDEX idx_rm_priority (priority),
    INDEX idx_rm_operation_id (operation_id),
    FULLTEXT INDEX idx_rm_search (search_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Denormalized read model for client requests';

-- ============================================
-- 3. Client Request Status Configuration
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_status_config (
    status_code VARCHAR(30) PRIMARY KEY,
    status_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key for description',

    -- UI configuration
    color VARCHAR(30) NOT NULL DEFAULT 'gray',
    icon VARCHAR(50) NULL,
    display_order INT DEFAULT 0,

    -- Behavior
    is_final BOOLEAN DEFAULT FALSE COMMENT 'No transitions from this status',
    is_editable BOOLEAN DEFAULT FALSE COMMENT 'Client can edit in this status',
    is_visible_to_client BOOLEAN DEFAULT TRUE,
    requires_assignment BOOLEAN DEFAULT FALSE COMMENT 'Must be assigned to user',

    -- Allowed transitions (JSON array of status codes)
    allowed_next_statuses JSON COMMENT '["STATUS1", "STATUS2"]',

    -- Notifications
    notify_client_on_enter BOOLEAN DEFAULT FALSE,
    client_notification_template VARCHAR(50) NULL,
    notify_backoffice_on_enter BOOLEAN DEFAULT FALSE,
    backoffice_notification_template VARCHAR(50) NULL,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for request statuses';

-- Seed status configurations
INSERT INTO client_request_status_config (
    status_code, status_name_key, description_key, color, icon, display_order,
    is_final, is_editable, is_visible_to_client, requires_assignment,
    allowed_next_statuses, notify_client_on_enter, notify_backoffice_on_enter
) VALUES
('DRAFT', 'request.status.draft', 'request.status.draft.description', 'gray', 'FiEdit3', 1,
 FALSE, TRUE, TRUE, FALSE,
 '["SUBMITTED", "CANCELLED"]', FALSE, FALSE),

('SUBMITTED', 'request.status.submitted', 'request.status.submitted.description', 'blue', 'FiSend', 2,
 FALSE, FALSE, TRUE, TRUE,
 '["IN_REVIEW", "CANCELLED"]', TRUE, TRUE),

('IN_REVIEW', 'request.status.inReview', 'request.status.inReview.description', 'yellow', 'FiEye', 3,
 FALSE, FALSE, TRUE, TRUE,
 '["PENDING_DOCUMENTS", "APPROVED", "REJECTED"]', TRUE, FALSE),

('PENDING_DOCUMENTS', 'request.status.pendingDocuments', 'request.status.pendingDocuments.description', 'orange', 'FiFile', 4,
 FALSE, TRUE, TRUE, TRUE,
 '["SUBMITTED", "CANCELLED"]', TRUE, FALSE),

('APPROVED', 'request.status.approved', 'request.status.approved.description', 'green', 'FiCheckCircle', 5,
 TRUE, FALSE, TRUE, FALSE,
 '[]', TRUE, FALSE),

('REJECTED', 'request.status.rejected', 'request.status.rejected.description', 'red', 'FiXCircle', 6,
 TRUE, FALSE, TRUE, FALSE,
 '[]', TRUE, FALSE),

('CANCELLED', 'request.status.cancelled', 'request.status.cancelled.description', 'gray', 'FiSlash', 7,
 TRUE, FALSE, TRUE, FALSE,
 '[]', FALSE, FALSE)

ON DUPLICATE KEY UPDATE
    status_name_key = VALUES(status_name_key),
    color = VALUES(color),
    icon = VALUES(icon);

-- ============================================
-- 4. Client Request Comments/Notes
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_comment (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    request_id CHAR(36) NOT NULL,

    -- Author
    author_user_id CHAR(36) NOT NULL,
    author_user_name VARCHAR(100) NOT NULL,
    author_user_type VARCHAR(20) NOT NULL COMMENT 'INTERNAL or CLIENT',
    author_avatar_url VARCHAR(500) NULL,

    -- Content
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'TEXT' COMMENT 'TEXT, HTML, MARKDOWN',

    -- Visibility
    is_internal BOOLEAN DEFAULT FALSE COMMENT 'TRUE = only visible to backoffice',
    is_system_generated BOOLEAN DEFAULT FALSE COMMENT 'TRUE = auto-generated by system',

    -- Read tracking
    is_read_by_client BOOLEAN DEFAULT FALSE,
    read_by_client_at TIMESTAMP NULL,
    is_read_by_backoffice BOOLEAN DEFAULT FALSE,
    read_by_backoffice_at TIMESTAMP NULL,

    -- Attachments
    has_attachments BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,

    -- Constraints
    CONSTRAINT fk_comment_request FOREIGN KEY (request_id)
        REFERENCES client_request(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_comment_request (request_id),
    INDEX idx_comment_author (author_user_id),
    INDEX idx_comment_created (created_at),
    INDEX idx_comment_internal (is_internal),
    INDEX idx_comment_unread_client (request_id, is_read_by_client),
    INDEX idx_comment_unread_backoffice (request_id, is_read_by_backoffice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Comments and notes on client requests';

-- ============================================
-- 5. Client Request Activity Log
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_activity_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    request_id CHAR(36) NOT NULL,

    -- Activity type
    activity_type VARCHAR(50) NOT NULL COMMENT 'CREATED, SUBMITTED, STATUS_CHANGED, ASSIGNED, COMMENTED, DOCUMENT_UPLOADED, etc.',
    activity_code VARCHAR(50) NOT NULL COMMENT 'Specific activity code for i18n',

    -- Actor
    actor_user_id CHAR(36) NULL COMMENT 'NULL for system activities',
    actor_user_name VARCHAR(100) NULL,
    actor_user_type VARCHAR(20) NULL COMMENT 'INTERNAL, CLIENT, SYSTEM',

    -- Details
    old_value TEXT NULL,
    new_value TEXT NULL,
    description_key VARCHAR(100) NULL COMMENT 'i18n key for description',
    description_params JSON NULL COMMENT 'Parameters for i18n interpolation',

    -- Context
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_activity_request FOREIGN KEY (request_id)
        REFERENCES client_request(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_activity_request (request_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_actor (actor_user_id),
    INDEX idx_activity_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Activity history for client requests';

-- ============================================
-- 6. Product Type Configuration for Client Portal
-- ============================================

CREATE TABLE IF NOT EXISTS client_product_type_config (
    product_code VARCHAR(50) PRIMARY KEY,
    product_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key',

    -- UI
    icon VARCHAR(50) NOT NULL DEFAULT 'FiFile',
    color VARCHAR(30) NOT NULL DEFAULT 'blue',
    display_order INT DEFAULT 0,

    -- Configuration
    wizard_steps INT DEFAULT 4 COMMENT 'Number of wizard steps',
    custom_field_product_type VARCHAR(50) NOT NULL COMMENT 'Product type code for custom fields',

    -- SLA defaults
    default_sla_hours INT DEFAULT 24,
    default_priority VARCHAR(20) DEFAULT 'NORMAL',

    -- Document requirements
    min_documents INT DEFAULT 1,
    max_documents INT DEFAULT 20,

    -- Amount limits
    min_amount DECIMAL(18,2) NULL,
    max_amount DECIMAL(18,2) NULL,
    allowed_currencies JSON COMMENT '["USD", "EUR", "GBP"]',

    -- Features
    is_enabled BOOLEAN DEFAULT TRUE,
    requires_beneficiary BOOLEAN DEFAULT TRUE,
    requires_documents BOOLEAN DEFAULT TRUE,
    supports_draft_save BOOLEAN DEFAULT TRUE,

    -- Target operation type (when approved)
    target_operation_type VARCHAR(50) NOT NULL COMMENT 'Operation type created on approval',

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for products available in client portal';

-- Seed product configurations
INSERT INTO client_product_type_config (
    product_code, product_name_key, description_key, icon, color, display_order,
    wizard_steps, custom_field_product_type, default_sla_hours, default_priority,
    min_documents, max_documents, min_amount, max_amount, allowed_currencies,
    is_enabled, requires_beneficiary, requires_documents, supports_draft_save,
    target_operation_type
) VALUES
-- Guarantee Request
('GUARANTEE_REQUEST', 'product.guaranteeRequest.name', 'product.guaranteeRequest.description',
 'FiShield', 'purple', 1, 5, 'CLIENT_GUARANTEE_REQUEST', 48, 'NORMAL',
 1, 10, 1000.00, 10000000.00, '["USD", "EUR", "GBP", "CHF"]',
 TRUE, TRUE, TRUE, TRUE, 'GUARANTEE_ISSUED'),

-- LC Import Request
('LC_IMPORT_REQUEST', 'product.lcImportRequest.name', 'product.lcImportRequest.description',
 'FiDownload', 'blue', 2, 6, 'CLIENT_LC_IMPORT_REQUEST', 72, 'NORMAL',
 2, 15, 5000.00, 50000000.00, '["USD", "EUR", "GBP", "JPY", "CNY"]',
 TRUE, TRUE, TRUE, TRUE, 'LC_IMPORT'),

-- LC Export Request
('LC_EXPORT_REQUEST', 'product.lcExportRequest.name', 'product.lcExportRequest.description',
 'FiUpload', 'green', 3, 5, 'CLIENT_LC_EXPORT_REQUEST', 48, 'NORMAL',
 1, 15, 5000.00, 50000000.00, '["USD", "EUR", "GBP", "JPY", "CNY"]',
 TRUE, TRUE, TRUE, TRUE, 'LC_EXPORT'),

-- Collection Request
('COLLECTION_REQUEST', 'product.collectionRequest.name', 'product.collectionRequest.description',
 'FiDollarSign', 'orange', 4, 5, 'CLIENT_COLLECTION_REQUEST', 24, 'NORMAL',
 2, 10, 1000.00, 10000000.00, '["USD", "EUR", "GBP"]',
 TRUE, TRUE, TRUE, TRUE, 'COLLECTION_EXPORT')

ON DUPLICATE KEY UPDATE
    product_name_key = VALUES(product_name_key),
    description_key = VALUES(description_key),
    icon = VALUES(icon),
    color = VALUES(color);

-- ============================================
-- 7. Reference number sequence for requests
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_sequence (
    product_code VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    current_value INT NOT NULL DEFAULT 0,
    prefix VARCHAR(10) NOT NULL,

    PRIMARY KEY (product_code, year),

    INDEX idx_sequence_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sequence generator for request numbers';

-- Seed initial sequences for current year
INSERT INTO client_request_sequence (product_code, year, current_value, prefix)
VALUES
('GUARANTEE_REQUEST', YEAR(CURDATE()), 0, 'GR'),
('LC_IMPORT_REQUEST', YEAR(CURDATE()), 0, 'LI'),
('LC_EXPORT_REQUEST', YEAR(CURDATE()), 0, 'LE'),
('COLLECTION_REQUEST', YEAR(CURDATE()), 0, 'CR')
ON DUPLICATE KEY UPDATE prefix = VALUES(prefix);
