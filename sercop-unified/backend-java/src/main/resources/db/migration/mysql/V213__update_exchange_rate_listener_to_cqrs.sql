-- ============================================================================
-- V213__update_exchange_rate_listener_to_cqrs.sql
-- Updates the exchange rate listener to use CQRS instead of direct SQL update
-- This ensures proper event sourcing and history tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_api_response_listener (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(50) NOT NULL,
    execution_condition VARCHAR(1000),
    action_config JSON NOT NULL,
    priority INT DEFAULT 100,
    retry_on_failure BOOLEAN DEFAULT FALSE,
    max_retries INT DEFAULT 3,
    retry_delay_seconds INT DEFAULT 60,
    only_on_success BOOLEAN DEFAULT TRUE,
    only_on_failure BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_external_listener_api_config (api_config_id),
    INDEX idx_external_listener_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update the existing listener to use the new UPSERT_EXCHANGE_RATE action type
SET @has_external_api_config_rm := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'external_api_config_read_model'
);

SET @sql_update_exchange_rate_listener := IF(
    @has_external_api_config_rm > 0,
    "UPDATE external_api_response_listener SET action_type = 'UPSERT_EXCHANGE_RATE', action_config = JSON_OBJECT('currencyCode', 'EUR', 'rateDate', '#response.rateDate', 'buyRate', '#response.eurRate', 'sellRate', '#response.eurRate', 'updatedBy', 'EXCHANGE_RATE_JOB'), description = 'Updates the EUR exchange rate using CQRS commands (creates event history)', updated_at = NOW() WHERE name = 'Update EUR Exchange Rate' AND api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'FRANKFURTER_EXCHANGE_RATES')",
    "SELECT 'V213 skipped: external_api_config_read_model missing' AS migration_note"
);
PREPARE stmt_update_exchange_rate_listener FROM @sql_update_exchange_rate_listener;
EXECUTE stmt_update_exchange_rate_listener;
DEALLOCATE PREPARE stmt_update_exchange_rate_listener;
