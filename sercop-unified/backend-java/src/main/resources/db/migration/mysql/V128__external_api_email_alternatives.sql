-- =============================================================================
-- Migration V128: Alternative Email Service Providers
-- Mailgun and Resend as alternatives to SendGrid (no IP restrictions)
-- =============================================================================

-- =============================================================================
-- Example 1: Mailgun Email Service
-- Popular email service with generous free tier and no IP restrictions
-- =============================================================================

INSERT INTO external_api_config_read_model (
    code,
    name,
    description,
    base_url,
    path,
    http_method,
    content_type,
    timeout_ms,
    retry_count,
    retry_backoff_multiplier,
    retry_initial_delay_ms,
    retry_max_delay_ms,
    circuit_breaker_enabled,
    circuit_breaker_threshold,
    circuit_breaker_timeout_ms,
    active,
    environment,
    created_at,
    created_by
) VALUES (
    'MAILGUN_EMAIL',
    'Mailgun - Servicio de Email',
    'API de Mailgun para envío de correos transaccionales. Alternativa a SendGrid sin restricciones de IP. Requiere dominio verificado.',
    'https://api.mailgun.net',
    '/v3/YOUR_DOMAIN/messages',
    'POST',
    'application/x-www-form-urlencoded',
    30000,
    3,
    2.0,
    1000,
    30000,
    TRUE,
    5,
    60000,
    FALSE,
    'PRODUCTION',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Get the ID of Mailgun config
SET @mailgun_id = (SELECT id FROM external_api_config_read_model WHERE code = 'MAILGUN_EMAIL');

-- Auth config for Mailgun (Basic Auth with api:key format)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    username,
    password_encrypted,
    active,
    created_at
) VALUES (
    @mailgun_id,
    'BASIC_AUTH',
    'api',
    'YOUR_MAILGUN_API_KEY',  -- Replace with actual encrypted key
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- Request template for Mailgun
INSERT INTO external_api_request_template (
    api_config_id,
    name,
    description,
    static_headers_json,
    body_template,
    variable_mappings_json,
    is_default,
    active,
    created_at
) VALUES (
    @mailgun_id,
    'Mailgun Email Template',
    'Plantilla para envío de correos via Mailgun (form-urlencoded)',
    '{"Content-Type": "application/x-www-form-urlencoded"}',
    'from={{fromEmail}}&to={{toEmail}}&subject={{subject}}&html={{htmlContent}}',
    '{
  "fromEmail": "config.fromEmail",
  "toEmail": "operation.recipientEmail",
  "subject": "operation.subject",
  "htmlContent": "operation.emailBody"
}',
    TRUE,
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    body_template = VALUES(body_template);

-- Response config for Mailgun
INSERT INTO external_api_response_config (
    api_config_id,
    success_codes,
    response_type,
    success_field_path,
    error_message_path,
    transaction_id_path,
    extraction_mappings_json,
    created_at
) VALUES (
    @mailgun_id,
    '200',
    'JSON',
    'id',
    'message',
    'id',
    '{
  "messageId": "id",
  "message": "message"
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);

-- =============================================================================
-- Example 2: Resend Email Service
-- Modern email API with excellent DX and no IP restrictions
-- Free tier: 3000 emails/month, 100 emails/day
-- =============================================================================

INSERT INTO external_api_config_read_model (
    code,
    name,
    description,
    base_url,
    path,
    http_method,
    content_type,
    timeout_ms,
    retry_count,
    retry_backoff_multiplier,
    retry_initial_delay_ms,
    retry_max_delay_ms,
    circuit_breaker_enabled,
    circuit_breaker_threshold,
    circuit_breaker_timeout_ms,
    active,
    environment,
    created_at,
    created_by
) VALUES (
    'RESEND_EMAIL',
    'Resend - Modern Email API',
    'API moderna de email con excelente experiencia de desarrollo. Sin restricciones de IP. Free tier: 3000 emails/mes. Muy fácil de configurar.',
    'https://api.resend.com',
    '/emails',
    'POST',
    'application/json',
    30000,
    3,
    2.0,
    1000,
    30000,
    TRUE,
    5,
    60000,
    TRUE,
    'PRODUCTION',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Get the ID of Resend config
SET @resend_id = (SELECT id FROM external_api_config_read_model WHERE code = 'RESEND_EMAIL');

-- Auth config for Resend (Bearer Token)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    static_token_encrypted,
    active,
    created_at
) VALUES (
    @resend_id,
    'BEARER_TOKEN',
    're_YOUR_RESEND_API_KEY',  -- Replace with actual encrypted key
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- Request template for Resend
INSERT INTO external_api_request_template (
    api_config_id,
    name,
    description,
    static_headers_json,
    body_template,
    variable_mappings_json,
    is_default,
    active,
    created_at
) VALUES (
    @resend_id,
    'Resend Email Template',
    'Plantilla para envío de correos via Resend API',
    '{"Content-Type": "application/json"}',
    '{
  "from": "{{fromName}} <{{fromEmail}}>",
  "to": ["{{toEmail}}"],
  "subject": "{{subject}}",
  "html": "{{htmlContent}}",
  "tags": [
    {
      "name": "source",
      "value": "globalcmx"
    },
    {
      "name": "operation_type",
      "value": "{{operationType}}"
    }
  ]
}',
    '{
  "fromName": "config.fromName",
  "fromEmail": "config.fromEmail",
  "toEmail": "operation.recipientEmail",
  "subject": "operation.subject",
  "htmlContent": "operation.emailBody",
  "operationType": "operation.type"
}',
    TRUE,
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    body_template = VALUES(body_template);

-- Response config for Resend
INSERT INTO external_api_response_config (
    api_config_id,
    success_codes,
    response_type,
    success_field_path,
    error_message_path,
    transaction_id_path,
    extraction_mappings_json,
    created_at
) VALUES (
    @resend_id,
    '200',
    'JSON',
    'id',
    'message',
    'id',
    '{
  "emailId": "id"
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);

-- =============================================================================
-- Example 3: Mailtrap Email Testing (Sandbox)
-- Perfect for development/testing - emails are NOT delivered to real addresses
-- Instead they go to a virtual inbox for inspection
-- =============================================================================

INSERT INTO external_api_config_read_model (
    code,
    name,
    description,
    base_url,
    path,
    http_method,
    content_type,
    timeout_ms,
    retry_count,
    retry_backoff_multiplier,
    retry_initial_delay_ms,
    retry_max_delay_ms,
    circuit_breaker_enabled,
    circuit_breaker_threshold,
    circuit_breaker_timeout_ms,
    active,
    environment,
    created_at,
    created_by
) VALUES (
    'MAILTRAP_SANDBOX',
    'Mailtrap - Email Sandbox',
    'Servicio de pruebas de email. Los correos NO se entregan a destinatarios reales, van a un inbox virtual para inspección. Ideal para desarrollo y QA.',
    'https://sandbox.api.mailtrap.io',
    '/api/send/YOUR_INBOX_ID',
    'POST',
    'application/json',
    15000,
    2,
    2.0,
    500,
    5000,
    TRUE,
    5,
    30000,
    FALSE,
    'DEVELOPMENT',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Get the ID of Mailtrap config
SET @mailtrap_id = (SELECT id FROM external_api_config_read_model WHERE code = 'MAILTRAP_SANDBOX');

-- Auth config for Mailtrap (Bearer Token)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    static_token_encrypted,
    active,
    created_at
) VALUES (
    @mailtrap_id,
    'BEARER_TOKEN',
    'YOUR_MAILTRAP_API_TOKEN',  -- Replace with actual encrypted token
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- Request template for Mailtrap
INSERT INTO external_api_request_template (
    api_config_id,
    name,
    description,
    static_headers_json,
    body_template,
    variable_mappings_json,
    is_default,
    active,
    created_at
) VALUES (
    @mailtrap_id,
    'Mailtrap Test Email Template',
    'Plantilla para envío de correos de prueba a Mailtrap sandbox',
    '{"Content-Type": "application/json", "Api-Token": "{{apiToken}}"}',
    '{
  "from": {
    "email": "{{fromEmail}}",
    "name": "{{fromName}}"
  },
  "to": [
    {
      "email": "{{toEmail}}",
      "name": "{{toName}}"
    }
  ],
  "subject": "{{subject}}",
  "html": "{{htmlContent}}",
  "category": "GlobalCMX Test"
}',
    '{
  "fromEmail": "config.fromEmail",
  "fromName": "config.fromName",
  "toEmail": "operation.recipientEmail",
  "toName": "operation.recipientName",
  "subject": "operation.subject",
  "htmlContent": "operation.emailBody"
}',
    TRUE,
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    body_template = VALUES(body_template);

-- Response config for Mailtrap
INSERT INTO external_api_response_config (
    api_config_id,
    success_codes,
    response_type,
    success_field_path,
    error_message_path,
    transaction_id_path,
    extraction_mappings_json,
    created_at
) VALUES (
    @mailtrap_id,
    '200',
    'JSON',
    'success',
    'errors[0]',
    'message_ids[0]',
    '{
  "success": "success",
  "messageId": "message_ids[0]"
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);
