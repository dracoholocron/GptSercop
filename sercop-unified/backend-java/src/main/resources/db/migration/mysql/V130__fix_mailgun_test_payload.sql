-- =============================================================================
-- Migration V130: Fix Mailgun test payload example
-- The test payload must be JSON with the template variables, not the raw form data
-- =============================================================================

-- Mailgun Email - Fix test payload to use JSON format with template variables
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "fromEmail": "test@sandbox4b870687192e4393bff1d54a22269754.mailgun.org",
  "toEmail": "cesar_alvarezc@hotmail.com",
  "subject": "Test Email from GlobalCMX",
  "htmlContent": "<h1>Test</h1><p>Este es un correo de prueba enviado desde GlobalCMX via Mailgun.</p>"
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'MAILGUN_EMAIL');

-- Also fix Exchange Rate API test payload (it's a GET request, needs minimal data)
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "base": "USD",
  "target": "EUR"
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'EXCHANGE_RATE_API');
