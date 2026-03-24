-- ============================================================================
-- V20260129__external_api_variable_mapping.sql
-- Sistema de Mapeo de Variables y Procesamiento de Respuestas para APIs Externas
-- ============================================================================

-- 1. Tabla para mapeo de variables de entrada (Request Mapping)
-- Mapea variables del sistema a parámetros del API
CREATE TABLE IF NOT EXISTS external_api_request_mapping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,

    -- Variable del sistema (referencia a template_variable_read_model.code)
    variable_code VARCHAR(100) NOT NULL,

    -- Nombre del parámetro en el API (nombre por defecto de GlobalCMX)
    api_parameter_name VARCHAR(255) NOT NULL,

    -- Usar nombre personalizado del cliente (banco)
    use_custom_name BOOLEAN DEFAULT FALSE,
    custom_name VARCHAR(255),

    -- Ubicación del parámetro
    parameter_location ENUM('PATH', 'QUERY', 'HEADER', 'BODY', 'BODY_JSON_PATH') NOT NULL DEFAULT 'BODY',

    -- Para BODY_JSON_PATH: ruta JSON donde insertar (ej: "$.data.currency")
    json_path VARCHAR(500),

    -- Transformación opcional
    transformation_type ENUM('NONE', 'UPPERCASE', 'LOWERCASE', 'DATE_FORMAT', 'NUMBER_FORMAT', 'CUSTOM') DEFAULT 'NONE',
    transformation_pattern VARCHAR(255),

    -- Valor por defecto si la variable es null
    default_value VARCHAR(500),

    -- Obligatorio o opcional
    is_required BOOLEAN DEFAULT TRUE,

    -- Descripción para documentación
    description VARCHAR(500),

    -- Orden de procesamiento
    display_order INT DEFAULT 0,

    -- Activo
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_api_request_mapping_config (api_config_id),
    INDEX idx_api_request_mapping_variable (variable_code),

    CONSTRAINT fk_request_mapping_api_config
        FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Tabla para mapeo de respuesta (Response Mapping)
-- Mapea campos de la respuesta del API a variables del sistema
CREATE TABLE IF NOT EXISTS external_api_response_mapping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,

    -- Ruta JSON en la respuesta (ej: "$.data.exchangeRate", "$.rates[0].value")
    response_json_path VARCHAR(500) NOT NULL,

    -- Nombre interno para referenciar este valor
    internal_name VARCHAR(100) NOT NULL,

    -- Tipo de dato esperado
    data_type ENUM('STRING', 'NUMBER', 'DECIMAL', 'INTEGER', 'BOOLEAN', 'DATE', 'DATETIME', 'JSON', 'ARRAY') NOT NULL DEFAULT 'STRING',

    -- Formato para parseo (ej: "yyyy-MM-dd" para fechas)
    parse_format VARCHAR(100),

    -- Transformación post-extracción
    transformation_type ENUM('NONE', 'UPPERCASE', 'LOWERCASE', 'TRIM', 'ROUND', 'MULTIPLY', 'DIVIDE', 'CUSTOM') DEFAULT 'NONE',
    transformation_value VARCHAR(255),

    -- Validación
    validation_regex VARCHAR(500),
    validation_min_value DECIMAL(20,6),
    validation_max_value DECIMAL(20,6),

    -- Valor por defecto si no se encuentra
    default_value VARCHAR(500),

    -- Es obligatorio en la respuesta
    is_required BOOLEAN DEFAULT FALSE,

    -- Descripción para documentación
    description VARCHAR(500),

    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_api_response_mapping_config (api_config_id),
    INDEX idx_api_response_mapping_name (internal_name),

    CONSTRAINT fk_response_mapping_api_config
        FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Tabla para listeners de respuesta
-- Configura qué acciones ejecutar cuando un API responde
CREATE TABLE IF NOT EXISTS external_api_response_listener (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,

    -- Nombre del listener para identificación
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Tipo de acción a ejecutar
    action_type ENUM(
        'UPDATE_CATALOG',      -- Actualiza un catálogo del sistema
        'UPDATE_OPERATION',    -- Actualiza campos de la operación
        'UPDATE_ENTITY',       -- Actualiza cualquier entidad
        'TRIGGER_RULE',        -- Dispara una regla de evento
        'SEND_NOTIFICATION',   -- Envía notificación (email, push)
        'QUEUE_JOB',           -- Encola un job programado
        'CUSTOM_SERVICE'       -- Invoca un bean de Spring personalizado
    ) NOT NULL,

    -- Condición para ejecutar (expresión SpEL o JSONPath)
    -- Ej: "#response.status == 'SUCCESS'", "$.data.exchangeRate > 0"
    execution_condition VARCHAR(1000),

    -- Configuración específica según action_type (JSON)
    action_config JSON NOT NULL,

    -- Prioridad de ejecución (menor = primero)
    priority INT DEFAULT 100,

    -- Reintentos si falla
    retry_on_failure BOOLEAN DEFAULT FALSE,
    max_retries INT DEFAULT 3,
    retry_delay_seconds INT DEFAULT 60,

    -- Solo ejecutar si la respuesta del API fue exitosa
    only_on_success BOOLEAN DEFAULT TRUE,

    -- Solo ejecutar si la respuesta del API falló
    only_on_failure BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_api_listener_config (api_config_id),
    INDEX idx_api_listener_type (action_type),
    INDEX idx_api_listener_priority (priority),
    INDEX idx_api_listener_active (is_active),

    CONSTRAINT fk_listener_api_config
        FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. Agregar campos adicionales a external_api_call_log si no existen
-- Primero verificamos si las columnas existen antes de agregarlas

-- Agregar call_id como UUID único
ALTER TABLE external_api_call_log
ADD COLUMN IF NOT EXISTS call_id VARCHAR(36) AFTER id;

-- Agregar índice único para call_id
CREATE INDEX IF NOT EXISTS idx_api_call_log_call_id ON external_api_call_log(call_id);

-- Agregar campos de respuesta mapeada
ALTER TABLE external_api_call_log
ADD COLUMN IF NOT EXISTS mapped_response_data JSON AFTER response_body;

-- Agregar campo para listeners ejecutados
ALTER TABLE external_api_call_log
ADD COLUMN IF NOT EXISTS listeners_executed JSON AFTER mapped_response_data;

-- Agregar campo de status enum
ALTER TABLE external_api_call_log
ADD COLUMN IF NOT EXISTS status ENUM('PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'RETRY') DEFAULT 'PENDING' AFTER success;

-- Agregar aggregate_id para Event Sourcing
ALTER TABLE external_api_call_log
ADD COLUMN IF NOT EXISTS aggregate_id VARCHAR(100) AFTER listeners_executed;

-- Agregar índice para aggregate_id
CREATE INDEX IF NOT EXISTS idx_api_call_log_aggregate ON external_api_call_log(aggregate_id);

-- Agregar campo de timestamp de respuesta
ALTER TABLE external_api_call_log
ADD COLUMN IF NOT EXISTS response_timestamp TIMESTAMP AFTER response_body;


-- 5. Tabla para log de ejecución de listeners
CREATE TABLE IF NOT EXISTS external_api_listener_execution_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Referencia a la llamada del API
    api_call_log_id BIGINT NOT NULL,
    call_id VARCHAR(36) NOT NULL,

    -- Referencia al listener
    listener_id BIGINT NOT NULL,
    listener_name VARCHAR(255),
    action_type VARCHAR(50),

    -- Estado de ejecución
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED', 'RETRYING') NOT NULL DEFAULT 'PENDING',

    -- Resultado
    result_data JSON,
    error_message TEXT,

    -- Métricas
    execution_time_ms BIGINT,
    retry_count INT DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_listener_exec_call (api_call_log_id),
    INDEX idx_listener_exec_call_id (call_id),
    INDEX idx_listener_exec_listener (listener_id),
    INDEX idx_listener_exec_status (status),

    CONSTRAINT fk_listener_exec_call
        FOREIGN KEY (api_call_log_id) REFERENCES external_api_call_log(id) ON DELETE CASCADE,
    CONSTRAINT fk_listener_exec_listener
        FOREIGN KEY (listener_id) REFERENCES external_api_response_listener(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Permisos para administrar mapeos de APIs
-- ============================================================================
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'CAN_MANAGE_API_MAPPINGS', 'Gestionar Mapeos de APIs',
       'Permite configurar mapeos de variables y listeners para APIs externas',
       'ADMINISTRATION', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'CAN_MANAGE_API_MAPPINGS');

-- Asignar al rol ADMIN si existe
INSERT INTO role_permission (role_id, permission_code, created_at)
SELECT r.id, 'CAN_MANAGE_API_MAPPINGS', NOW()
FROM role_read_model r
WHERE r.code = 'ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM role_permission
    WHERE role_id = r.id AND permission_code = 'CAN_MANAGE_API_MAPPINGS'
);


-- ============================================================================
-- Datos de ejemplo: Configuración para API de Tipos de Cambio
-- ============================================================================

-- Solo insertar si existe la API de ejemplo (comentado por defecto)
/*
-- Ejemplo de configuración de API de tipos de cambio
INSERT INTO external_api_config_read_model
(code, name, description, base_url, path, http_method, content_type, timeout_ms, active, created_at)
VALUES
('CORE_EXCHANGE_RATES', 'Core Banking Exchange Rates',
 'Obtiene tipos de cambio del sistema core del banco',
 'https://core.banco.com/api', '/v1/exchange-rates', 'POST',
 'application/json', 30000, true, NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Mapeo de variables de entrada
INSERT INTO external_api_request_mapping
(api_config_id, variable_code, api_parameter_name, use_custom_name, custom_name,
 parameter_location, is_required, display_order, description)
SELECT id, 'currency', 'baseCurrency', true, 'monedaBase', 'BODY', true, 1,
       'Moneda base para obtener tipos de cambio'
FROM external_api_config_read_model WHERE code = 'CORE_EXCHANGE_RATES';

-- Mapeo de respuesta
INSERT INTO external_api_response_mapping
(api_config_id, response_json_path, internal_name, data_type, description)
SELECT id, '$.data.rates[*].currency', 'currencies', 'ARRAY', 'Lista de códigos de moneda'
FROM external_api_config_read_model WHERE code = 'CORE_EXCHANGE_RATES';

INSERT INTO external_api_response_mapping
(api_config_id, response_json_path, internal_name, data_type, description)
SELECT id, '$.data.rates[*].rate', 'rates', 'ARRAY', 'Lista de tipos de cambio'
FROM external_api_config_read_model WHERE code = 'CORE_EXCHANGE_RATES';

INSERT INTO external_api_response_mapping
(api_config_id, response_json_path, internal_name, data_type, parse_format, description)
SELECT id, '$.data.rateDate', 'rateDate', 'DATE', 'yyyy-MM-dd', 'Fecha del tipo de cambio'
FROM external_api_config_read_model WHERE code = 'CORE_EXCHANGE_RATES';

-- Listener para actualizar catálogo de monedas
INSERT INTO external_api_response_listener
(api_config_id, name, description, action_type, execution_condition, action_config, priority)
SELECT id, 'Update Currency Catalog',
       'Actualiza los tipos de cambio en el catálogo de monedas',
       'CUSTOM_SERVICE',
       '#response.rates != null && #response.rates.size() > 0',
       '{
           "beanName": "currencyExchangeRateService",
           "methodName": "updateExchangeRates",
           "methodParams": ["#response.baseCurrency", "#response.currencies", "#response.rates", "#response.rateDate"]
       }',
       10
FROM external_api_config_read_model WHERE code = 'CORE_EXCHANGE_RATES';
*/
