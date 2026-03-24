-- ============================================================================
-- V213__update_exchange_rate_listener_to_cqrs.sql
-- Updates the exchange rate listener to use CQRS instead of direct SQL update
-- This ensures proper event sourcing and history tracking
-- ============================================================================

-- Update the existing listener to use the new UPSERT_EXCHANGE_RATE action type
UPDATE external_api_response_listener
SET
    action_type = 'UPSERT_EXCHANGE_RATE',
    action_config = JSON_OBJECT(
        'currencyCode', 'EUR',
        'rateDate', '#response.rateDate',
        'buyRate', '#response.eurRate',
        'sellRate', '#response.eurRate',
        'updatedBy', 'EXCHANGE_RATE_JOB'
    ),
    description = 'Updates the EUR exchange rate using CQRS commands (creates event history)',
    updated_at = NOW()
WHERE name = 'Update EUR Exchange Rate'
  AND api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'FRANKFURTER_EXCHANGE_RATES');
