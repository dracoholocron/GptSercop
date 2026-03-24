-- Create pending_event_approval_readmodel table
-- This table stores events that require approval before execution

CREATE TABLE IF NOT EXISTS pending_event_approval_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Unique identifier for the pending approval request
    approval_id VARCHAR(100) NOT NULL UNIQUE,

    -- Type of approval: NEW_OPERATION (from draft) or OPERATION_EVENT
    approval_type VARCHAR(30) NOT NULL,

    -- Status: PENDING, APPROVED, REJECTED
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    -- Operation context
    operation_id VARCHAR(50),
    draft_id VARCHAR(100),
    product_type VARCHAR(50) NOT NULL,
    reference VARCHAR(100),

    -- Event details
    event_code VARCHAR(50) NOT NULL,
    event_name VARCHAR(100),
    event_description TEXT,
    message_type VARCHAR(10),
    swift_message TEXT,
    event_data JSON,
    submitter_comments TEXT,

    -- Financial data
    currency VARCHAR(3),
    amount DECIMAL(18, 2),

    -- Parties
    applicant_name VARCHAR(200),
    beneficiary_name VARCHAR(200),

    -- Submission info
    submitted_by VARCHAR(100) NOT NULL,
    submitted_at DATETIME NOT NULL,

    -- Approval/Rejection info
    reviewed_by VARCHAR(100),
    reviewed_at DATETIME,
    review_comments TEXT,
    rejection_reason TEXT,

    -- UI hints
    icon VARCHAR(50),
    color VARCHAR(20),
    priority INT DEFAULT 2,

    -- Audit
    version BIGINT DEFAULT 0,

    -- Indexes
    INDEX idx_pending_event_status (status),
    INDEX idx_pending_event_operation (operation_id),
    INDEX idx_pending_event_product (product_type),
    INDEX idx_pending_event_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
