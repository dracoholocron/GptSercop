-- ============================================================================
-- V253__fix_exchange_rate_all_configs.sql
-- Ensure ALL exchange rate API configs return all currencies
-- Deactivate 'to=EUR' on both CORE_EXCHANGE_RATES and FRANKFURTER_EXCHANGE_RATES
-- Add $.rates JSON mapping and UPSERT_ALL_EXCHANGE_RATES listener on both
-- ============================================================================

-- ========================
-- CORE_EXCHANGE_RATES
-- ========================
SET @core_id = (SELECT id FROM external_api_config_read_model WHERE code = 'CORE_EXCHANGE_RATES');

-- Deactivate 'to=EUR'
UPDATE external_api_request_mapping
SET is_active = FALSE, updated_at = NOW()
WHERE api_config_id = @core_id
  AND api_parameter_name = 'to';

-- Add $.rates as JSON if not exists
INSERT INTO external_api_response_mapping (
    api_config_id, response_json_path, internal_name, data_type,
    is_required, display_order, is_active, description
)
SELECT @core_id, '$.rates', 'rates', 'JSON', TRUE, 0, TRUE,
       'Full rates map with all currencies against USD'
FROM DUAL
WHERE @core_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM external_api_response_mapping
    WHERE api_config_id = @core_id AND internal_name = 'rates'
);

-- Add UPSERT_ALL_EXCHANGE_RATES listener if not exists
INSERT INTO external_api_response_listener (
    api_config_id, name, description, action_type, execution_condition, action_config,
    priority, only_on_success, only_on_failure, is_active
)
SELECT @core_id,
       'Upsert All Exchange Rates',
       'Processes all currency rates and upserts them via CQRS',
       'UPSERT_ALL_EXCHANGE_RATES',
       '#response.rates != null',
       JSON_OBJECT('rateDate', '#response.rateDate', 'updatedBy', 'EXCHANGE_RATE_JOB'),
       5, TRUE, FALSE, TRUE
FROM DUAL
WHERE @core_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM external_api_response_listener
    WHERE api_config_id = @core_id AND action_type = 'UPSERT_ALL_EXCHANGE_RATES'
);

-- ========================
-- FRANKFURTER_EXCHANGE_RATES (in case V252 missed it)
-- ========================
SET @frank_id = (SELECT id FROM external_api_config_read_model WHERE code = 'FRANKFURTER_EXCHANGE_RATES');

-- Ensure 'to=EUR' is deactivated
UPDATE external_api_request_mapping
SET is_active = FALSE, updated_at = NOW()
WHERE api_config_id = @frank_id
  AND api_parameter_name = 'to'
  AND is_active = TRUE;
