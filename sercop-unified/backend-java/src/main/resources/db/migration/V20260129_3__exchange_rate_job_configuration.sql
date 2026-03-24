-- ============================================================================
-- V20260129_3__exchange_rate_job_configuration.sql
-- Configuration for automatic USD/EUR exchange rate updates using Frankfurter API
-- ============================================================================

-- 1. External API Configuration for Frankfurter API (Free, no API key required)
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, retry_initial_delay_ms, retry_backoff_multiplier,
    active, mock_enabled, environment, created_at
) VALUES (
    'FRANKFURTER_EXCHANGE_RATES',
    'Frankfurter Exchange Rates API',
    'Free API to get current and historical exchange rates from European Central Bank',
    'https://api.frankfurter.app',
    '/latest',
    'GET',
    'application/json',
    30000,
    3,
    1000,
    2.0,
    TRUE,
    FALSE,
    'PRODUCTION',
    NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Get the API config ID
SET @api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'FRANKFURTER_EXCHANGE_RATES');

-- 2. Request Mappings - Configure query parameters
-- Base currency (from)
INSERT INTO external_api_request_mapping (
    api_config_id, source_type, variable_code, constant_value, calculated_expression,
    api_parameter_name, parameter_location, is_required, display_order, is_active, description
) VALUES (
    @api_config_id,
    'CONSTANT',
    NULL,
    'USD',
    NULL,
    'from',
    'QUERY',
    TRUE,
    1,
    TRUE,
    'Base currency for exchange rate (USD)'
);

-- Target currency (to)
INSERT INTO external_api_request_mapping (
    api_config_id, source_type, variable_code, constant_value, calculated_expression,
    api_parameter_name, parameter_location, is_required, display_order, is_active, description
) VALUES (
    @api_config_id,
    'CONSTANT',
    NULL,
    'EUR',
    NULL,
    'to',
    'QUERY',
    TRUE,
    2,
    TRUE,
    'Target currency for exchange rate (EUR)'
);

-- 3. Response Mappings - Extract data from API response
-- Frankfurter response: {"amount":1.0,"base":"USD","date":"2024-01-29","rates":{"EUR":0.92}}

-- Extract the EUR exchange rate
INSERT INTO external_api_response_mapping (
    api_config_id, response_json_path, internal_name, data_type,
    is_required, display_order, is_active, description
) VALUES (
    @api_config_id,
    '$.rates.EUR',
    'eurRate',
    'NUMBER',
    TRUE,
    1,
    TRUE,
    'EUR exchange rate against USD'
);

-- Extract the date
INSERT INTO external_api_response_mapping (
    api_config_id, response_json_path, internal_name, data_type,
    is_required, display_order, is_active, description
) VALUES (
    @api_config_id,
    '$.date',
    'rateDate',
    'DATE',
    TRUE,
    2,
    TRUE,
    'Date of the exchange rate'
);

-- Extract base currency
INSERT INTO external_api_response_mapping (
    api_config_id, response_json_path, internal_name, data_type,
    is_required, display_order, is_active, description
) VALUES (
    @api_config_id,
    '$.base',
    'baseCurrency',
    'STRING',
    TRUE,
    3,
    TRUE,
    'Base currency code'
);

-- 4. Response Listener - Update exchange_rate_read_model table
INSERT INTO external_api_response_listener (
    api_config_id, name, description, action_type, execution_condition, action_config,
    priority, only_on_success, only_on_failure, is_active
) VALUES (
    @api_config_id,
    'Update EUR Exchange Rate',
    'Updates the EUR exchange rate in the exchange_rate_read_model catalog',
    'UPDATE_CATALOG',
    '#response.eurRate != null',
    JSON_OBJECT(
        'catalogTable', 'exchange_rate_read_model',
        'operation', 'UPSERT',
        'matchCondition', JSON_OBJECT(
            'currency_code', 'EUR',
            'date', '#response.rateDate'
        ),
        'updateFields', JSON_OBJECT(
            'currency_code', 'EUR',
            'date', '#response.rateDate',
            'buy_rate', '#response.eurRate',
            'sell_rate', '#response.eurRate',
            'updated_at', '#now',
            'updated_by', 'SYSTEM_JOB'
        ),
        'insertFields', JSON_OBJECT(
            'currency_code', 'EUR',
            'date', '#response.rateDate',
            'buy_rate', '#response.eurRate',
            'sell_rate', '#response.eurRate',
            'created_at', '#now',
            'created_by', 'SYSTEM_JOB',
            'updated_at', '#now',
            'updated_by', 'SYSTEM_JOB',
            'version', 1
        )
    ),
    10,
    TRUE,
    FALSE,
    TRUE
);

-- 5. Scheduled Job Configuration
INSERT INTO scheduled_job_config_readmodel (
    code, name, description,
    schedule_type, cron_expression, timezone,
    job_type, external_api_config_code,
    is_enabled, is_system_job,
    timeout_seconds, max_retries,
    retry_on_failure, retry_delay_seconds, retry_backoff_multiplier,
    circuit_breaker_enabled, circuit_breaker_threshold, circuit_breaker_reset_timeout_seconds,
    alert_on_failure, consecutive_failures_threshold,
    created_by, created_at
) VALUES (
    'EXCHANGE_RATE_USD_EUR',
    'USD/EUR Exchange Rate Updater',
    'Fetches the latest USD/EUR exchange rate from Frankfurter API (European Central Bank data) and stores it in the catalog',
    'CRON',
    '0 0 * * * *',  -- Every hour at minute 0
    'America/New_York',
    'EXTERNAL_API',
    'FRANKFURTER_EXCHANGE_RATES',
    TRUE,
    FALSE,
    120,
    3,
    TRUE,
    60,
    2.0,
    TRUE,
    5,
    300,
    TRUE,
    3,
    'SYSTEM',
    NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================================================
-- Verification queries (can be run manually to verify configuration)
-- ============================================================================
-- SELECT * FROM external_api_config_read_model WHERE code = 'FRANKFURTER_EXCHANGE_RATES';
-- SELECT * FROM external_api_request_mapping WHERE api_config_id = @api_config_id;
-- SELECT * FROM external_api_response_mapping WHERE api_config_id = @api_config_id;
-- SELECT * FROM external_api_response_listener WHERE api_config_id = @api_config_id;
-- SELECT * FROM scheduled_job_config_readmodel WHERE code = 'EXCHANGE_RATE_USD_EUR';
