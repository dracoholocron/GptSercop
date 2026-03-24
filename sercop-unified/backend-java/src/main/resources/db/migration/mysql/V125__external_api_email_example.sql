-- =============================================================================
-- Migration V125: Example External API Configuration for Email Service
-- Creates a sample SendGrid API configuration for sending emails
-- =============================================================================

-- 1. Create the main API configuration
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
    'SENDGRID_EMAIL',
    'SendGrid Email Service',
    'API para envío de correos electrónicos transaccionales via SendGrid. Utilizada para notificaciones de operaciones, alertas de aprobación y comunicaciones automáticas.',
    'https://api.sendgrid.com',
    '/v3/mail/send',
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

-- Get the ID of the inserted config
SET @api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'SENDGRID_EMAIL');

-- 2. Create the authentication configuration (API Key)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    api_key_name,
    api_key_value_encrypted,
    api_key_location,
    active,
    created_at
) VALUES (
    @api_config_id,
    'BEARER_TOKEN',
    'Authorization',
    'SG.PLACEHOLDER_API_KEY',  -- Replace with actual encrypted key
    'HEADER',
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- 3. Create the default request template
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
    @api_config_id,
    'Email Notification Template',
    'Plantilla para envío de notificaciones por correo electrónico',
    '{"Content-Type": "application/json"}',
    '{
  "personalizations": [
    {
      "to": [
        {
          "email": "{{recipientEmail}}",
          "name": "{{recipientName}}"
        }
      ],
      "subject": "{{subject}}"
    }
  ],
  "from": {
    "email": "{{fromEmail}}",
    "name": "{{fromName}}"
  },
  "content": [
    {
      "type": "text/html",
      "value": "{{htmlContent}}"
    }
  ],
  "tracking_settings": {
    "click_tracking": {
      "enable": true
    },
    "open_tracking": {
      "enable": true
    }
  }
}',
    '{
  "recipientEmail": "operation.approverEmail",
  "recipientName": "operation.approverName",
  "subject": "operation.notificationSubject",
  "fromEmail": "config.fromEmail",
  "fromName": "config.fromName",
  "htmlContent": "operation.emailBody"
}',
    TRUE,
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    body_template = VALUES(body_template);

-- 4. Create the response configuration
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
    @api_config_id,
    '200,201,202',
    'JSON',
    NULL,  -- SendGrid returns 202 Accepted with empty body on success
    'errors[0].message',
    'x-message-id',  -- From response headers
    '{
  "messageId": "headers.x-message-id",
  "status": "statusCode"
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);

-- =============================================================================
-- Additional Example: Core Banking Validation API
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
    circuit_breaker_enabled,
    active,
    environment,
    created_at,
    created_by
) VALUES (
    'CORE_BANKING_VALIDATION',
    'Core Banking - Validación de Operaciones',
    'API del sistema core bancario para validar operaciones antes de su aprobación. Verifica límites de crédito, estado del cliente y políticas de cumplimiento.',
    'https://core.example-bank.com',
    '/api/v1/operations/validate',
    'POST',
    'application/json',
    60000,
    2,
    TRUE,
    FALSE,  -- Disabled by default (example)
    'STAGING',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Get the ID for core banking config
SET @core_api_id = (SELECT id FROM external_api_config_read_model WHERE code = 'CORE_BANKING_VALIDATION');

-- Auth config for Core Banking (OAuth2 Client Credentials)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    oauth2_token_url,
    oauth2_client_id,
    oauth2_client_secret_encrypted,
    oauth2_scope,
    active,
    created_at
) VALUES (
    @core_api_id,
    'OAUTH2_CLIENT_CREDENTIALS',
    'https://auth.example-bank.com/oauth/token',
    'globalcmx-client',
    'PLACEHOLDER_SECRET',  -- Replace with actual encrypted secret
    'operations:validate operations:read',
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- Request template for Core Banking validation
INSERT INTO external_api_request_template (
    api_config_id,
    name,
    description,
    body_template,
    variable_mappings_json,
    is_default,
    active,
    created_at
) VALUES (
    @core_api_id,
    'Operation Validation Request',
    'Plantilla para validación de operaciones en el core bancario',
    '{
  "operationId": "{{operationId}}",
  "operationType": "{{operationType}}",
  "reference": "{{reference}}",
  "amount": {{amount}},
  "currency": "{{currency}}",
  "applicant": {
    "id": "{{applicantId}}",
    "name": "{{applicantName}}"
  },
  "beneficiary": {
    "id": "{{beneficiaryId}}",
    "name": "{{beneficiaryName}}"
  },
  "requestedBy": "{{requestedBy}}",
  "requestedAt": "{{requestedAt}}"
}',
    '{
  "operationId": "operation.operationId",
  "operationType": "operation.productType",
  "reference": "operation.reference",
  "amount": "operation.amount",
  "currency": "operation.currency",
  "applicantId": "operation.applicantId",
  "applicantName": "operation.applicantName",
  "beneficiaryId": "operation.beneficiaryId",
  "beneficiaryName": "operation.beneficiaryName",
  "requestedBy": "context.username",
  "requestedAt": "context.timestamp"
}',
    TRUE,
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    body_template = VALUES(body_template);

-- Response config for Core Banking
INSERT INTO external_api_response_config (
    api_config_id,
    success_codes,
    response_type,
    success_field_path,
    success_expected_value,
    error_message_path,
    transaction_id_path,
    extraction_mappings_json,
    validation_rules_json,
    created_at
) VALUES (
    @core_api_id,
    '200',
    'JSON',
    'status',
    'APPROVED',
    'error.message',
    'transactionId',
    '{
  "validationStatus": "status",
  "validationMessage": "message",
  "coreTransactionId": "transactionId",
  "validatedAt": "timestamp"
}',
    '{
  "checkCreditLimit": true,
  "checkCompliance": true,
  "checkClientStatus": true
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);
