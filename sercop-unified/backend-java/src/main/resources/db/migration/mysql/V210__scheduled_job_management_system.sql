-- =====================================================
-- V200: Scheduled Job Management System
-- Creates tables for dynamic job scheduling with ShedLock
-- =====================================================

-- -----------------------------------------------------
-- Table: scheduled_job_config_readmodel
-- Stores configuration for all scheduled jobs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_job_config_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Schedule configuration
    schedule_type ENUM('CRON', 'FIXED_RATE', 'FIXED_DELAY') NOT NULL DEFAULT 'CRON',
    cron_expression VARCHAR(100),
    fixed_rate_ms BIGINT,
    fixed_delay_ms BIGINT,
    initial_delay_ms BIGINT DEFAULT 0,
    timezone VARCHAR(50) DEFAULT 'America/Guatemala',

    -- Job type and execution target
    job_type ENUM('INTERNAL_SERVICE', 'EXTERNAL_API', 'RULE_ENGINE', 'SQL_QUERY') NOT NULL DEFAULT 'INTERNAL_SERVICE',
    service_bean_name VARCHAR(255),
    service_method_name VARCHAR(255),
    external_api_config_code VARCHAR(100),
    rule_code VARCHAR(100),
    sql_query TEXT,

    -- Parameters (JSON)
    job_parameters JSON,
    api_request_context JSON,

    -- Retry configuration
    retry_on_failure BOOLEAN DEFAULT TRUE,
    max_retries INT DEFAULT 3,
    retry_delay_seconds INT DEFAULT 60,
    retry_backoff_multiplier DECIMAL(3,1) DEFAULT 2.0,

    -- Alerting configuration
    alert_on_failure BOOLEAN DEFAULT TRUE,
    alert_email_recipients TEXT,
    consecutive_failures_threshold INT DEFAULT 3,

    -- Circuit breaker
    circuit_breaker_enabled BOOLEAN DEFAULT FALSE,
    circuit_breaker_threshold INT DEFAULT 5,
    circuit_breaker_reset_timeout_seconds INT DEFAULT 300,

    -- Timeout configuration
    timeout_seconds INT DEFAULT 300,
    lock_at_most_seconds INT DEFAULT 300,
    lock_at_least_seconds INT DEFAULT 15,

    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,
    is_system_job BOOLEAN DEFAULT FALSE,
    is_cluster_safe BOOLEAN DEFAULT TRUE,

    -- Execution tracking
    last_execution_status ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'TIMEOUT', 'CIRCUIT_OPEN') DEFAULT 'PENDING',
    last_execution_at TIMESTAMP NULL,
    last_success_at TIMESTAMP NULL,
    last_failure_at TIMESTAMP NULL,
    next_execution_at TIMESTAMP NULL,
    consecutive_failures INT DEFAULT 0,
    total_executions INT DEFAULT 0,
    total_successes INT DEFAULT 0,
    total_failures INT DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    version INT DEFAULT 0,

    -- Tenant support
    tenant_id VARCHAR(50),

    INDEX idx_scheduled_job_code (code),
    INDEX idx_scheduled_job_enabled (is_enabled),
    INDEX idx_scheduled_job_type (job_type),
    INDEX idx_scheduled_job_status (last_execution_status),
    INDEX idx_scheduled_job_next_exec (next_execution_at),
    INDEX idx_scheduled_job_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: scheduled_job_execution_log
-- Stores execution history for all jobs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_job_execution_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(36) NOT NULL UNIQUE,
    job_code VARCHAR(100) NOT NULL,
    job_config_id BIGINT,

    -- Execution status
    status ENUM('RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'TIMEOUT', 'CANCELLED') NOT NULL DEFAULT 'RUNNING',

    -- Timing
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_ms BIGINT,

    -- Results
    items_processed INT DEFAULT 0,
    items_success INT DEFAULT 0,
    items_failed INT DEFAULT 0,
    result_summary TEXT,
    result_data JSON,

    -- Error information
    error_message TEXT,
    error_stack_trace TEXT,
    error_code VARCHAR(100),

    -- Retry information
    retry_attempt INT DEFAULT 0,
    is_retry BOOLEAN DEFAULT FALSE,
    original_execution_id VARCHAR(36),

    -- Trigger information
    triggered_by ENUM('SCHEDULER', 'MANUAL', 'SYSTEM', 'RETRY', 'API') NOT NULL DEFAULT 'SCHEDULER',
    triggered_by_user VARCHAR(100),

    -- Server information
    server_instance VARCHAR(255),
    server_ip VARCHAR(50),
    thread_name VARCHAR(255),

    -- Tenant support
    tenant_id VARCHAR(50),

    INDEX idx_execution_job_code (job_code),
    INDEX idx_execution_status (status),
    INDEX idx_execution_started (started_at),
    INDEX idx_execution_job_started (job_code, started_at),
    INDEX idx_execution_tenant (tenant_id),

    CONSTRAINT fk_execution_job_config
        FOREIGN KEY (job_config_id) REFERENCES scheduled_job_config_readmodel(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: scheduled_job_dead_letter
-- Stores jobs that have exceeded max retries
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_job_dead_letter (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_code VARCHAR(100) NOT NULL,
    job_config_id BIGINT,
    original_execution_id VARCHAR(36) NOT NULL,

    -- Status
    status ENUM('PENDING', 'RETRYING', 'RESOLVED', 'ABANDONED') NOT NULL DEFAULT 'PENDING',

    -- Error information
    error_message TEXT NOT NULL,
    error_stack_trace TEXT,
    error_code VARCHAR(100),

    -- Retry tracking
    retry_count INT DEFAULT 0,
    max_retries_reached BOOLEAN DEFAULT TRUE,
    last_retry_at TIMESTAMP NULL,

    -- Original execution data
    original_parameters JSON,
    original_started_at TIMESTAMP,
    original_triggered_by VARCHAR(50),

    -- Resolution
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(100),
    resolution_notes TEXT,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Tenant support
    tenant_id VARCHAR(50),

    INDEX idx_dead_letter_job_code (job_code),
    INDEX idx_dead_letter_status (status),
    INDEX idx_dead_letter_created (created_at),
    INDEX idx_dead_letter_tenant (tenant_id),

    CONSTRAINT fk_dead_letter_job_config
        FOREIGN KEY (job_config_id) REFERENCES scheduled_job_config_readmodel(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: shedlock
-- ShedLock table for distributed locking
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS shedlock (
    name VARCHAR(64) NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    locked_by VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Insert predefined system jobs
-- -----------------------------------------------------
INSERT IGNORE INTO scheduled_job_config_readmodel (
    code, name, description, schedule_type, cron_expression, job_type,
    service_bean_name, service_method_name, is_enabled, is_system_job,
    timeout_seconds, max_retries, alert_on_failure, created_by
) VALUES
-- SWIFT SLA Monitor - Checks for overdue SWIFT responses every 15 minutes
('SWIFT_SLA_MONITOR', 'SWIFT SLA Monitor',
 'Monitors SWIFT messages with overdue response due dates and generates alerts',
 'CRON', '0 */15 * * * *', 'INTERNAL_SERVICE',
 'globalCmxJobImplementations', 'executeSwiftSlaMonitor',
 TRUE, TRUE, 300, 3, TRUE, 'system'),

-- Exchange Rate Updater - Gets exchange rates at 6 AM on weekdays
('EXCHANGE_RATE_UPDATER', 'Exchange Rate Updater',
 'Fetches current exchange rates from the core banking system',
 'CRON', '0 0 6 * * MON-FRI', 'EXTERNAL_API',
 NULL, NULL,
 TRUE, TRUE, 120, 3, TRUE, 'system'),

-- Operation Expiry Monitor - Checks for expiring LCs/Guarantees at 8 AM
('OPERATION_EXPIRY_MONITOR', 'Operation Expiry Monitor',
 'Monitors letters of credit and guarantees approaching expiration',
 'CRON', '0 0 8 * * *', 'INTERNAL_SERVICE',
 'globalCmxJobImplementations', 'executeOperationExpiryMonitor',
 TRUE, TRUE, 300, 3, TRUE, 'system'),

-- Pending Approval Reminder - Sends reminders at 9 AM and 2 PM on weekdays
('PENDING_APPROVAL_REMINDER', 'Pending Approval Reminder',
 'Sends reminder notifications for pending approvals',
 'CRON', '0 0 9,14 * * MON-FRI', 'INTERNAL_SERVICE',
 'globalCmxJobImplementations', 'executePendingApprovalReminder',
 TRUE, TRUE, 300, 3, TRUE, 'system'),

-- Daily Statistics - Calculates daily statistics at midnight
('DAILY_STATISTICS', 'Daily Statistics Calculator',
 'Calculates and stores daily operational statistics',
 'CRON', '0 0 0 * * *', 'INTERNAL_SERVICE',
 'globalCmxJobImplementations', 'executeDailyStatistics',
 TRUE, TRUE, 600, 3, TRUE, 'system'),

-- Document Retention Cleanup - Cleans old documents at 3 AM on Sundays
('DOCUMENT_RETENTION_CLEANUP', 'Document Retention Cleanup',
 'Removes documents that have exceeded retention period',
 'CRON', '0 0 3 * * SUN', 'INTERNAL_SERVICE',
 'globalCmxJobImplementations', 'executeDocumentRetentionCleanup',
 FALSE, TRUE, 1800, 3, TRUE, 'system'),

-- Client Session Cleanup - Cleans expired sessions at 4 AM
('CLIENT_SESSION_CLEANUP', 'Client Session Cleanup',
 'Removes expired client sessions from the database',
 'CRON', '0 0 4 * * *', 'INTERNAL_SERVICE',
 'globalCmxJobImplementations', 'executeClientSessionCleanup',
 TRUE, TRUE, 300, 3, FALSE, 'system'),

-- SLA Breach Escalation - Escalates breached SLAs every 30 minutes during business hours
('SLA_BREACH_ESCALATION', 'SLA Breach Escalation',
 'Escalates client requests that have breached SLA thresholds',
 'CRON', '0 */30 8-18 * * MON-FRI', 'INTERNAL_SERVICE',
 'globalCmxJobImplementations', 'executeSlaBbreachEscalation',
 TRUE, TRUE, 300, 3, TRUE, 'system');

-- -----------------------------------------------------
-- Update exchange rate job with external API config
-- -----------------------------------------------------
UPDATE scheduled_job_config_readmodel
SET external_api_config_code = 'CORE_EXCHANGE_RATES',
    job_parameters = JSON_OBJECT(
        'currencies', JSON_ARRAY('USD', 'EUR', 'GBP', 'JPY'),
        'baseCurrency', 'GTQ'
    )
WHERE code = 'EXCHANGE_RATE_UPDATER';

-- -----------------------------------------------------
-- Add job parameters for other jobs
-- -----------------------------------------------------
UPDATE scheduled_job_config_readmodel
SET job_parameters = JSON_OBJECT(
    'alertDaysBeforeExpiry', JSON_ARRAY(30, 15, 7, 3, 1),
    'productTypes', JSON_ARRAY('LC_IMPORT', 'LC_EXPORT', 'GUARANTEE_ISSUED', 'GUARANTEE_RECEIVED')
)
WHERE code = 'OPERATION_EXPIRY_MONITOR';

UPDATE scheduled_job_config_readmodel
SET job_parameters = JSON_OBJECT(
    'retentionDays', 365,
    'documentTypes', JSON_ARRAY('TEMP', 'DRAFT', 'ARCHIVED'),
    'dryRun', TRUE
)
WHERE code = 'DOCUMENT_RETENTION_CLEANUP';

UPDATE scheduled_job_config_readmodel
SET job_parameters = JSON_OBJECT(
    'escalationLevels', JSON_ARRAY(
        JSON_OBJECT('breachPercentage', 80, 'notifyRoles', JSON_ARRAY('ANALYST')),
        JSON_OBJECT('breachPercentage', 100, 'notifyRoles', JSON_ARRAY('SUPERVISOR')),
        JSON_OBJECT('breachPercentage', 150, 'notifyRoles', JSON_ARRAY('MANAGER'))
    )
)
WHERE code = 'SLA_BREACH_ESCALATION';

-- -----------------------------------------------------
-- Optional: Insert permissions, menu items, and API endpoints
-- These are skipped as they depend on tables that may not exist or have different schema
-- Can be added manually if needed after verifying table structures
-- -----------------------------------------------------
