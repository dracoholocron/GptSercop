-- ============================================================================
-- V252__exchange_rate_all_currencies.sql
-- Fix FRANKFURTER_EXCHANGE_RATES to fetch ALL currencies instead of only EUR
-- Remove 'to=EUR' request param so API returns all rates from USD base
-- Add $.rates JSON response mapping and UPSERT_ALL_EXCHANGE_RATES listener
-- ============================================================================

SET @api_id = (SELECT id FROM external_api_config_read_model WHERE code = 'FRANKFURTER_EXCHANGE_RATES');

-- 1. Deactivate the 'to' request mapping (removes to=EUR, so API returns all currencies)
UPDATE external_api_request_mapping
SET is_active = FALSE,
    updated_at = NOW()
WHERE api_config_id = @api_id
  AND api_parameter_name = 'to';

-- 2. Add response mapping for $.rates as JSON (full rates map)
INSERT INTO external_api_response_mapping (
    api_config_id, response_json_path, internal_name, data_type,
    is_required, display_order, is_active, description
)
SELECT @api_id, '$.rates', 'rates', 'JSON', TRUE, 0, TRUE,
       'Full rates map with all currencies against USD'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM external_api_response_mapping
    WHERE api_config_id = @api_id AND internal_name = 'rates'
);

-- 3. Add UPSERT_ALL_EXCHANGE_RATES listener to process all currencies
INSERT INTO external_api_response_listener (
    api_config_id, name, description, action_type, execution_condition, action_config,
    priority, only_on_success, only_on_failure, is_active
)
SELECT @api_id,
       'Upsert All Exchange Rates',
       'Processes all currency rates from Frankfurter API response and upserts them via CQRS',
       'UPSERT_ALL_EXCHANGE_RATES',
       '#response.rates != null',
       JSON_OBJECT('rateDate', '#response.rateDate', 'updatedBy', 'EXCHANGE_RATE_JOB'),
       5, TRUE, FALSE, TRUE
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM external_api_response_listener
    WHERE api_config_id = @api_id AND action_type = 'UPSERT_ALL_EXCHANGE_RATES'
);
