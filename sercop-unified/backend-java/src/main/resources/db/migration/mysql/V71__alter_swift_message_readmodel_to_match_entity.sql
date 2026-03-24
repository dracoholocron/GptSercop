-- =============================================================================
-- V71: Alter swift_message_readmodel to match SwiftMessageReadModel entity
-- The existing table has different column names and types
-- =============================================================================

-- Drop the old table and recreate with the correct structure
DROP TABLE IF EXISTS swift_message_readmodel;

CREATE TABLE swift_message_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL UNIQUE,
    message_type VARCHAR(10) NOT NULL,
    direction VARCHAR(10) NOT NULL,

    operation_id VARCHAR(50),
    operation_type VARCHAR(50),

    sender_bic VARCHAR(11) NOT NULL,
    receiver_bic VARCHAR(11) NOT NULL,
    swift_content TEXT NOT NULL,

    -- Extracted fields for queries
    field_20_reference VARCHAR(35),
    field_21_related_ref VARCHAR(35),
    currency VARCHAR(3),
    amount DECIMAL(18,2),
    value_date DATE,

    status VARCHAR(30) NOT NULL,

    -- ACK/NAK tracking
    ack_received BOOLEAN DEFAULT FALSE,
    ack_content TEXT,
    ack_received_at DATETIME,

    -- Response tracking
    expects_response BOOLEAN DEFAULT FALSE,
    expected_response_type VARCHAR(10),
    response_due_date DATE,
    response_received BOOLEAN DEFAULT FALSE,
    response_message_id VARCHAR(50),

    -- Event link
    triggered_by_event VARCHAR(50),
    generates_event VARCHAR(50),

    -- Audit
    created_by VARCHAR(100),
    created_at DATETIME,
    sent_at DATETIME,
    delivered_at DATETIME,
    received_at DATETIME,
    processed_at DATETIME,
    processed_by VARCHAR(100),

    version INT DEFAULT 1,

    -- Indexes
    INDEX idx_swift_msg_operation (operation_id),
    INDEX idx_swift_msg_type (message_type),
    INDEX idx_swift_msg_direction (direction),
    INDEX idx_swift_msg_status (status),
    INDEX idx_swift_msg_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
