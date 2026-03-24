-- Email System Tables

CREATE TABLE IF NOT EXISTS email_provider_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(20) NOT NULL,
    smtp_host VARCHAR(255),
    smtp_port VARCHAR(10),
    smtp_username VARCHAR(255),
    smtp_password VARCHAR(500),
    smtp_use_tls BOOLEAN DEFAULT TRUE,
    smtp_use_ssl BOOLEAN DEFAULT FALSE,
    api_key VARCHAR(500),
    api_endpoint VARCHAR(255),
    api_region VARCHAR(50),
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(100) NOT NULL,
    reply_to_email VARCHAR(255),
    rate_limit_per_minute INT,
    rate_limit_per_hour INT,
    rate_limit_per_day INT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_email_provider_tenant (tenant_id),
    INDEX idx_email_provider_active (is_active)
);

CREATE TABLE IF NOT EXISTS email_queue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    tenant_id VARCHAR(50),
    to_addresses TEXT,
    cc_addresses TEXT,
    bcc_addresses TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(100),
    subject VARCHAR(500) NOT NULL,
    body_html LONGTEXT,
    body_text LONGTEXT,
    template_code VARCHAR(50),
    template_variables TEXT,
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
    status ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'RETRY', 'CANCELLED') DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    last_error TEXT,
    reference_type VARCHAR(50),
    reference_id VARCHAR(50),
    provider_id BIGINT,
    provider_used VARCHAR(100),
    provider_message_id VARCHAR(255),
    scheduled_at TIMESTAMP NULL,
    next_retry_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_email_queue_uuid (uuid),
    INDEX idx_email_queue_status (status),
    INDEX idx_email_queue_priority (priority),
    INDEX idx_email_queue_scheduled (scheduled_at),
    FOREIGN KEY (provider_id) REFERENCES email_provider_config(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS email_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email_queue_id BIGINT NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    event_data TEXT,
    provider_response TEXT,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_log_queue (email_queue_id),
    INDEX idx_email_log_event (event_type),
    FOREIGN KEY (email_queue_id) REFERENCES email_queue(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_action_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action_type ENUM('OPERATION_CREATED', 'OPERATION_APPROVED', 'OPERATION_REJECTED', 'STATUS_CHANGED', 'DOCUMENT_UPLOADED', 'AMENDMENT_REQUESTED', 'PAYMENT_DUE', 'EXPIRY_WARNING') NOT NULL,
    event_type_code VARCHAR(50),
    product_type_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    template_code VARCHAR(50) NOT NULL,
    recipient_type ENUM('OPERATION_OWNER', 'APPROVERS', 'PARTICIPANTS', 'CUSTOM') NOT NULL,
    custom_recipients TEXT,
    conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_email_action_type (action_type),
    INDEX idx_email_action_active (is_active)
);

-- Default SMTP provider
INSERT INTO email_provider_config (name, provider_type, smtp_host, smtp_port, from_email, from_name, is_active, is_default, priority, created_by)
VALUES ('Development SMTP', 'SMTP', 'smtp.gmail.com', '587', 'noreply@globalcmx.com', 'GlobalCMX', TRUE, TRUE, 100, 'system');
