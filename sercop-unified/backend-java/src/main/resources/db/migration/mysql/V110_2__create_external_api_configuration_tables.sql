-- =============================================================================
-- Migration V110: External API Configuration Module
-- Provides configuration for external API endpoints with multiple auth types
-- Used for automatic API calls during operation approval workflows
-- =============================================================================

-- 1. Main API Endpoint Configuration
CREATE TABLE IF NOT EXISTS external_api_config_read_model (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),

    -- Connection Settings
    base_url VARCHAR(500) NOT NULL,
    path VARCHAR(500),
    http_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    content_type VARCHAR(50) DEFAULT 'application/json',

    -- Timeout & Retry Settings
    timeout_ms INT NOT NULL DEFAULT 30000,
    retry_count INT NOT NULL DEFAULT 3,
    retry_backoff_multiplier DECIMAL(3,1) DEFAULT 2.0,
    retry_initial_delay_ms INT DEFAULT 1000,
    retry_max_delay_ms INT DEFAULT 30000,

    -- Circuit Breaker Settings
    circuit_breaker_enabled BOOLEAN DEFAULT TRUE,
    circuit_breaker_threshold INT DEFAULT 5,
    circuit_breaker_timeout_ms INT DEFAULT 60000,

    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,
    environment VARCHAR(20) DEFAULT 'PRODUCTION',

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    INDEX idx_api_config_code (code),
    INDEX idx_api_config_active (active),
    INDEX idx_api_config_environment (environment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Authentication Configuration (encrypted sensitive data)
CREATE TABLE IF NOT EXISTS external_api_auth_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,
    auth_type VARCHAR(30) NOT NULL,

    -- For API_KEY
    api_key_name VARCHAR(100),
    api_key_value_encrypted TEXT,
    api_key_location VARCHAR(20) DEFAULT 'HEADER',

    -- For BASIC_AUTH
    username VARCHAR(255),
    password_encrypted TEXT,

    -- For BEARER_TOKEN
    static_token_encrypted TEXT,

    -- For OAUTH2_CLIENT_CREDENTIALS
    oauth2_token_url VARCHAR(500),
    oauth2_client_id VARCHAR(255),
    oauth2_client_secret_encrypted TEXT,
    oauth2_scope VARCHAR(500),
    oauth2_audience VARCHAR(255),

    -- For OAUTH2_AUTHORIZATION_CODE
    oauth2_auth_url VARCHAR(500),
    oauth2_redirect_uri VARCHAR(500),
    oauth2_state VARCHAR(255),

    -- For JWT
    jwt_secret_encrypted TEXT,
    jwt_algorithm VARCHAR(20) DEFAULT 'HS256',
    jwt_issuer VARCHAR(255),
    jwt_audience VARCHAR(255),
    jwt_expiration_seconds INT DEFAULT 3600,
    jwt_claims_template TEXT,

    -- For mTLS
    mtls_cert_path VARCHAR(500),
    mtls_key_path VARCHAR(500),
    mtls_ca_cert_path VARCHAR(500),
    mtls_key_password_encrypted TEXT,

    -- For CUSTOM_HEADER
    custom_headers_json TEXT,

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE,
    INDEX idx_auth_config_api (api_config_id),
    INDEX idx_auth_config_type (auth_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Request Templates
CREATE TABLE IF NOT EXISTS external_api_request_template (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),

    -- Static Headers (JSON)
    static_headers_json TEXT,

    -- Query Parameters Template (JSON with variables)
    query_params_template TEXT,

    -- Body Template (supports variable placeholders)
    body_template TEXT,

    -- Variable mappings for body template
    variable_mappings_json TEXT,

    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE,
    INDEX idx_request_template_api (api_config_id),
    INDEX idx_request_template_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Response Handling Configuration
CREATE TABLE IF NOT EXISTS external_api_response_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,

    -- Expected Success Codes (comma separated, e.g., "200,201,202")
    success_codes VARCHAR(100) DEFAULT '200,201',

    -- Response Parsing
    response_type VARCHAR(20) DEFAULT 'JSON',
    success_field_path VARCHAR(255),
    success_expected_value VARCHAR(255),
    error_message_path VARCHAR(255),
    transaction_id_path VARCHAR(255),

    -- Data Extraction Mappings (JSON)
    extraction_mappings_json TEXT,

    -- Validation Rules (JSON)
    validation_rules_json TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE,
    INDEX idx_response_config_api (api_config_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. API Call Log (Audit & Monitoring)
CREATE TABLE IF NOT EXISTS external_api_call_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,
    api_config_code VARCHAR(50) NOT NULL,

    -- Request Details
    request_url VARCHAR(2000),
    request_method VARCHAR(10),
    request_headers_json TEXT,
    request_body TEXT,

    -- Response Details
    response_status_code INT,
    response_headers_json TEXT,
    response_body TEXT,

    -- Execution Details
    execution_time_ms BIGINT,
    attempt_number INT DEFAULT 1,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    error_type VARCHAR(100),

    -- Context
    correlation_id VARCHAR(100),
    operation_id VARCHAR(100),
    operation_type VARCHAR(50),
    event_type VARCHAR(50),
    triggered_by VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_call_log_api (api_config_id),
    INDEX idx_call_log_code (api_config_code),
    INDEX idx_call_log_correlation (correlation_id),
    INDEX idx_call_log_operation (operation_id),
    INDEX idx_call_log_success (success),
    INDEX idx_call_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. API Test Results
CREATE TABLE IF NOT EXISTS external_api_test_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,

    test_type VARCHAR(50) NOT NULL,
    test_data_json TEXT,

    success BOOLEAN NOT NULL,
    response_status_code INT,
    response_body TEXT,
    execution_time_ms BIGINT,
    error_message TEXT,

    tested_by VARCHAR(100),
    tested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE,
    INDEX idx_test_result_api (api_config_id),
    INDEX idx_test_result_date (tested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. API Metrics (Aggregated for monitoring)
CREATE TABLE IF NOT EXISTS external_api_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,
    api_config_code VARCHAR(50) NOT NULL,

    metric_date DATE NOT NULL,
    metric_hour INT,

    total_calls INT DEFAULT 0,
    successful_calls INT DEFAULT 0,
    failed_calls INT DEFAULT 0,
    avg_response_time_ms BIGINT,
    max_response_time_ms BIGINT,
    min_response_time_ms BIGINT,

    -- Error breakdown
    timeout_errors INT DEFAULT 0,
    connection_errors INT DEFAULT 0,
    auth_errors INT DEFAULT 0,
    server_errors INT DEFAULT 0,
    client_errors INT DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE,
    UNIQUE KEY uk_metrics_api_date_hour (api_config_id, metric_date, metric_hour),
    INDEX idx_metrics_code (api_config_code),
    INDEX idx_metrics_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Alert Configuration
CREATE TABLE IF NOT EXISTS external_api_alert_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,

    alert_type VARCHAR(50) NOT NULL,
    threshold_value INT NOT NULL,
    threshold_period_minutes INT DEFAULT 5,

    notification_channels_json TEXT,
    notification_recipients_json TEXT,

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE,
    INDEX idx_alert_config_api (api_config_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add permissions for API Configuration module
INSERT INTO permission_read_model (code, name, description, module, created_at) VALUES
    ('CAN_VIEW_API_CONFIG', 'Ver Configuracion APIs', 'Permite ver configuraciones de APIs externas', 'API_CONFIG', NOW()),
    ('CAN_CREATE_API_CONFIG', 'Crear Configuracion API', 'Permite crear nuevas configuraciones de API', 'API_CONFIG', NOW()),
    ('CAN_EDIT_API_CONFIG', 'Editar Configuracion API', 'Permite editar configuraciones de API existentes', 'API_CONFIG', NOW()),
    ('CAN_DELETE_API_CONFIG', 'Eliminar Configuracion API', 'Permite eliminar configuraciones de API', 'API_CONFIG', NOW()),
    ('CAN_TEST_API_CONFIG', 'Probar Configuracion API', 'Permite ejecutar pruebas de conexion a APIs', 'API_CONFIG', NOW()),
    ('CAN_VIEW_API_LOGS', 'Ver Logs de API', 'Permite ver logs de llamadas a APIs externas', 'API_CONFIG', NOW()),
    ('CAN_VIEW_API_METRICS', 'Ver Metricas de API', 'Permite ver metricas de rendimiento de APIs', 'API_CONFIG', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Assign all API_CONFIG permissions to ROLE_ADMIN
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' AND p.module = 'API_CONFIG'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
