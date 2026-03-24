-- ============================================================================
-- V248__fix_exchange_rate_updater_api_code.sql
-- Fix: Update EXCHANGE_RATE_UPDATER job to use correct external API config code
-- ============================================================================

-- Update the scheduled job to use the correct API config code
UPDATE scheduled_job_config_readmodel
SET external_api_config_code = 'EXCHANGE_RATE_API',
    job_parameters = JSON_OBJECT(
        'currencies', JSON_ARRAY('USD', 'EUR', 'GBP', 'JPY'),
        'baseCurrency', 'GTQ'
    ),
    updated_at = NOW(),
    updated_by = 'migration'
WHERE code = 'EXCHANGE_RATE_UPDATER';

-- Ensure the external API config exists and is active
UPDATE external_api_config_read_model
SET active = TRUE,
    updated_at = NOW()
WHERE code = 'EXCHANGE_RATE_API';
