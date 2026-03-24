-- ============================================================================
-- V251__add_frankfurter_exchange_rate_api.sql
-- Add Frankfurter Exchange Rates API configuration for EXCHANGE_RATE_USD_EUR job
-- ============================================================================

-- Add Frankfurter Exchange Rates API (European Central Bank data)
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, retry_backoff_multiplier, retry_initial_delay_ms, retry_max_delay_ms,
    circuit_breaker_enabled, circuit_breaker_threshold, circuit_breaker_timeout_ms,
    active, environment, created_at, created_by
)
SELECT
    'FRANKFURTER_EXCHANGE_RATES',
    'Frankfurter Exchange Rates API',
    'Free API to get current and historical exchange rates from European Central Bank',
    'https://api.frankfurter.app',
    '/latest',
    'GET',
    'application/json',
    30000,  -- timeout_ms
    3,      -- retry_count
    2,      -- retry_backoff_multiplier
    1000,   -- retry_initial_delay_ms
    30000,  -- retry_max_delay_ms
    TRUE,   -- circuit_breaker_enabled
    5,      -- circuit_breaker_threshold
    60000,  -- circuit_breaker_timeout_ms
    TRUE,   -- active
    'PRODUCTION',
    NOW(),
    'migration'
WHERE NOT EXISTS (
    SELECT 1 FROM external_api_config_read_model WHERE code = 'FRANKFURTER_EXCHANGE_RATES'
);

-- Also fix EXCHANGE_RATE_UPDATER to use EXCHANGE_RATE_API if it still references CORE_EXCHANGE_RATES
UPDATE scheduled_job_config_readmodel
SET external_api_config_code = 'EXCHANGE_RATE_API',
    updated_at = NOW(),
    updated_by = 'migration'
WHERE code = 'EXCHANGE_RATE_UPDATER'
AND external_api_config_code = 'CORE_EXCHANGE_RATES';
