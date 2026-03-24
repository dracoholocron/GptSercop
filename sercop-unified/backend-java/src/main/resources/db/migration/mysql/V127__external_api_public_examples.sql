-- =============================================================================
-- Migration V127: Public API Examples for Testing
-- Creates sample configurations using public test APIs that work without restrictions
-- =============================================================================

-- =============================================================================
-- Example 1: JSONPlaceholder API (Free fake REST API for testing)
-- No authentication required, works from any IP
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
    'JSONPLACEHOLDER_TEST',
    'JSONPlaceholder - Test API',
    'API pública de prueba para desarrollo y testing. Simula respuestas REST sin autenticación. Útil para verificar conectividad y formato de solicitudes.',
    'https://jsonplaceholder.typicode.com',
    '/posts',
    'POST',
    'application/json',
    10000,
    2,
    2.0,
    500,
    5000,
    TRUE,
    5,
    30000,
    TRUE,
    'TESTING',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Get the ID of JSONPlaceholder config
SET @jsonplaceholder_id = (SELECT id FROM external_api_config_read_model WHERE code = 'JSONPLACEHOLDER_TEST');

-- Auth config (No authentication needed)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    active,
    created_at
) VALUES (
    @jsonplaceholder_id,
    'NONE',
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- Request template for JSONPlaceholder
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
    @jsonplaceholder_id,
    'Create Post Template',
    'Plantilla para crear un post de prueba en JSONPlaceholder',
    '{"Content-Type": "application/json", "Accept": "application/json"}',
    '{
  "title": "{{title}}",
  "body": "{{body}}",
  "userId": {{userId}}
}',
    '{
  "title": "testData.title",
  "body": "testData.body",
  "userId": "testData.userId"
}',
    TRUE,
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    body_template = VALUES(body_template);

-- Response config for JSONPlaceholder
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
    @jsonplaceholder_id,
    '200,201',
    'JSON',
    NULL,
    'error',
    'id',
    '{
  "postId": "id",
  "title": "title",
  "body": "body"
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);

-- =============================================================================
-- Example 2: HTTPBin - Echo API for testing HTTP requests
-- No authentication required, echoes back request data
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
    'HTTPBIN_ECHO',
    'HTTPBin - Echo Service',
    'Servicio de eco HTTP que devuelve los datos enviados. Perfecto para verificar que las solicitudes se formatean correctamente.',
    'https://httpbin.org',
    '/post',
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
    TRUE,
    'TESTING',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Get the ID of HTTPBin config
SET @httpbin_id = (SELECT id FROM external_api_config_read_model WHERE code = 'HTTPBIN_ECHO');

-- Auth config (No authentication needed)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    active,
    created_at
) VALUES (
    @httpbin_id,
    'NONE',
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- Request template for HTTPBin
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
    @httpbin_id,
    'Echo Request Template',
    'Plantilla para probar el servicio de eco - devuelve exactamente lo que envias',
    '{"Content-Type": "application/json", "X-Custom-Header": "GlobalCMX-Test"}',
    '{
  "message": "{{message}}",
  "timestamp": "{{timestamp}}",
  "data": {
    "operationId": "{{operationId}}",
    "type": "{{type}}",
    "amount": {{amount}}
  }
}',
    '{
  "message": "testData.message",
  "timestamp": "context.timestamp",
  "operationId": "operation.id",
  "type": "operation.type",
  "amount": "operation.amount"
}',
    TRUE,
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    body_template = VALUES(body_template);

-- Response config for HTTPBin
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
    @httpbin_id,
    '200',
    'JSON',
    'origin',
    NULL,
    NULL,
    '{
  "requestData": "json",
  "headers": "headers",
  "origin": "origin",
  "url": "url"
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);

-- =============================================================================
-- Example 3: Exchange Rate API (Free tier available)
-- Demonstrates GET request with API key authentication
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
    'EXCHANGE_RATE_API',
    'API de Tipos de Cambio',
    'API para consultar tipos de cambio de divisas en tiempo real. Útil para validar montos en operaciones internacionales.',
    'https://api.exchangerate-api.com',
    '/v4/latest/USD',
    'GET',
    'application/json',
    10000,
    2,
    2.0,
    500,
    5000,
    TRUE,
    5,
    30000,
    FALSE,
    'PRODUCTION',
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

-- Get the ID of Exchange Rate API config
SET @exchange_id = (SELECT id FROM external_api_config_read_model WHERE code = 'EXCHANGE_RATE_API');

-- Auth config (No auth for free tier)
INSERT INTO external_api_auth_config (
    api_config_id,
    auth_type,
    active,
    created_at
) VALUES (
    @exchange_id,
    'NONE',
    TRUE,
    NOW()
) ON DUPLICATE KEY UPDATE
    auth_type = VALUES(auth_type);

-- Response config for Exchange Rate API
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
    @exchange_id,
    '200',
    'JSON',
    'result',
    'error-type',
    NULL,
    '{
  "baseCurrency": "base",
  "date": "date",
  "rates": "rates"
}',
    NOW()
) ON DUPLICATE KEY UPDATE
    success_codes = VALUES(success_codes);
