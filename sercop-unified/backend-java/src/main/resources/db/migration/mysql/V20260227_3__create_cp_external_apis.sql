-- ============================================================================
-- V20260227_3: APIs Externas para Sistema de Compras Públicas
-- ============================================================================
-- Configuración de integraciones con servicios gubernamentales de Ecuador
-- ============================================================================

-- ============================================================================
-- 1. API SERCOP - Portal de Compras Públicas
-- ============================================================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
('SERCOP_CONSULTA_PROCESO', 'SERCOP - Consulta de Procesos',
 'Consulta información de procesos de contratación pública en SERCOP',
 'https://api.compraspublicas.gob.ec', '/api/v1/procesos', 'GET', 'application/json',
 30000, 3, TRUE, 'PRODUCTION', 'system'),

('SERCOP_PUBLICACION', 'SERCOP - Publicación de Procesos',
 'Publica procesos de contratación en el portal SERCOP',
 'https://api.compraspublicas.gob.ec', '/api/v1/procesos/publicar', 'POST', 'application/json',
 60000, 2, TRUE, 'PRODUCTION', 'system'),

('SERCOP_CATALOGO', 'SERCOP - Catálogo Electrónico',
 'Consulta productos y proveedores del catálogo electrónico',
 'https://api.compraspublicas.gob.ec', '/api/v1/catalogo', 'GET', 'application/json',
 30000, 3, TRUE, 'PRODUCTION', 'system'),

('SERCOP_PROVEEDORES', 'SERCOP - Registro de Proveedores (RUP)',
 'Consulta el Registro Único de Proveedores',
 'https://api.compraspublicas.gob.ec', '/api/v1/proveedores', 'GET', 'application/json',
 30000, 3, TRUE, 'PRODUCTION', 'system'),

('SERCOP_PRECIOS_REF', 'SERCOP - Precios Referenciales',
 'Consulta precios referenciales de bienes y servicios',
 'https://api.compraspublicas.gob.ec', '/api/v1/precios', 'GET', 'application/json',
 30000, 3, TRUE, 'PRODUCTION', 'system');

-- ============================================================================
-- 2. API SRI - Servicio de Rentas Internas
-- ============================================================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
('SRI_VALIDAR_RUC', 'SRI - Validación de RUC',
 'Valida que un RUC existe y está activo en el SRI',
 'https://srienlinea.sri.gob.ec', '/sri-catastro-sujeto-servicio-internet/rest/Persona', 'GET', 'application/json',
 15000, 2, TRUE, 'PRODUCTION', 'system'),

('SRI_INFO_CONTRIBUYENTE', 'SRI - Información de Contribuyente',
 'Obtiene información del contribuyente por RUC',
 'https://srienlinea.sri.gob.ec', '/sri-catastro-sujeto-servicio-internet/rest/DatosAdicionales', 'GET', 'application/json',
 15000, 2, TRUE, 'PRODUCTION', 'system'),

('SRI_ESTADO_TRIBUTARIO', 'SRI - Estado Tributario',
 'Verifica el estado tributario del contribuyente',
 'https://srienlinea.sri.gob.ec', '/movil-servicios/api/estadoTributario', 'GET', 'application/json',
 15000, 2, TRUE, 'PRODUCTION', 'system');

-- ============================================================================
-- 3. API SUPERCIAS - Superintendencia de Compañías
-- ============================================================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
('SUPERCIAS_CONSULTA', 'SUPERCIAS - Consulta de Compañías',
 'Consulta información de compañías en la Superintendencia',
 'https://appscvsmovil.supercias.gob.ec', '/portalmovil/api/v1/companias/consulta', 'GET', 'application/json',
 20000, 2, TRUE, 'PRODUCTION', 'system'),

('SUPERCIAS_REPRESENTANTES', 'SUPERCIAS - Representantes Legales',
 'Obtiene los representantes legales de una compañía',
 'https://appscvsmovil.supercias.gob.ec', '/portalmovil/api/v1/companias/representantes', 'GET', 'application/json',
 20000, 2, TRUE, 'PRODUCTION', 'system');

-- ============================================================================
-- 4. API DINARDAP - Datos de Identificación
-- ============================================================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
('DINARDAP_CEDULA', 'DINARDAP - Validación de Cédula',
 'Valida datos de cédula de identidad ecuatoriana',
 'https://interoperabilidad.dinardap.gob.ec', '/interoperador-v2/api/Datos', 'POST', 'application/json',
 10000, 2, TRUE, 'PRODUCTION', 'system');

-- ============================================================================
-- 5. API CONTRALORÍA - Contraloría General del Estado
-- ============================================================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
('CGE_RESPONSABILIDADES', 'CGE - Consulta Responsabilidades',
 'Verifica si existe glosa o responsabilidad pendiente',
 'https://servicios.contraloria.gob.ec', '/api/v1/responsabilidades', 'GET', 'application/json',
 15000, 2, TRUE, 'PRODUCTION', 'system'),

('CGE_INHABILIDADES', 'CGE - Consulta Inhabilidades',
 'Verifica inhabilidades para contratar con el Estado',
 'https://servicios.contraloria.gob.ec', '/api/v1/inhabilidades', 'GET', 'application/json',
 15000, 2, TRUE, 'PRODUCTION', 'system');

-- ============================================================================
-- 6. API BCE - Banco Central del Ecuador
-- ============================================================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
('BCE_TIPO_CAMBIO', 'BCE - Tipo de Cambio',
 'Obtiene el tipo de cambio oficial del BCE',
 'https://www.bce.fin.ec', '/api/cotizaciones', 'GET', 'application/json',
 10000, 2, TRUE, 'PRODUCTION', 'system');

-- ============================================================================
-- 7. APIs DE INTELIGENCIA ARTIFICIAL
-- ============================================================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
('OPENAI_ANALYSIS', 'OpenAI - Análisis IA',
 'API de OpenAI para análisis de documentos y detección de riesgos',
 'https://api.openai.com', '/v1/chat/completions', 'POST', 'application/json',
 120000, 2, TRUE, 'PRODUCTION', 'system'),

('CLAUDE_ANALYSIS', 'Claude - Análisis IA',
 'API de Anthropic Claude para análisis de documentos',
 'https://api.anthropic.com', '/v1/messages', 'POST', 'application/json',
 120000, 2, TRUE, 'PRODUCTION', 'system'),

('GEMINI_ANALYSIS', 'Google Gemini - Análisis IA',
 'API de Google Gemini para análisis de documentos',
 'https://generativelanguage.googleapis.com', '/v1beta/models/gemini-pro:generateContent', 'POST', 'application/json',
 120000, 2, TRUE, 'PRODUCTION', 'system');

-- ============================================================================
-- 8. CONFIGURACIÓN DE AUTENTICACIÓN
-- ============================================================================

-- Autenticación para SERCOP (ejemplo con API Key)
INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'API_KEY', 'X-API-Key', '{{ENCRYPTED_SERCOP_API_KEY}}', 'HEADER'
FROM external_api_config_read_model WHERE code = 'SERCOP_CONSULTA_PROCESO';

INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'API_KEY', 'X-API-Key', '{{ENCRYPTED_SERCOP_API_KEY}}', 'HEADER'
FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION';

INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'API_KEY', 'X-API-Key', '{{ENCRYPTED_SERCOP_API_KEY}}', 'HEADER'
FROM external_api_config_read_model WHERE code = 'SERCOP_CATALOGO';

INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'API_KEY', 'X-API-Key', '{{ENCRYPTED_SERCOP_API_KEY}}', 'HEADER'
FROM external_api_config_read_model WHERE code = 'SERCOP_PROVEEDORES';

INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'API_KEY', 'X-API-Key', '{{ENCRYPTED_SERCOP_API_KEY}}', 'HEADER'
FROM external_api_config_read_model WHERE code = 'SERCOP_PRECIOS_REF';

-- Autenticación para DINARDAP (OAuth2)
INSERT INTO external_api_auth_config (api_config_id, auth_type, oauth2_token_url, oauth2_client_id, oauth2_client_secret_encrypted)
SELECT id, 'OAUTH2_CLIENT_CREDENTIALS',
       'https://interoperabilidad.dinardap.gob.ec/oauth/token',
       '{{DINARDAP_CLIENT_ID}}',
       '{{ENCRYPTED_DINARDAP_SECRET}}'
FROM external_api_config_read_model WHERE code = 'DINARDAP_CEDULA';

-- Autenticación para OpenAI
INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'BEARER_TOKEN', NULL, '{{ENCRYPTED_OPENAI_API_KEY}}', 'HEADER'
FROM external_api_config_read_model WHERE code = 'OPENAI_ANALYSIS';

-- Autenticación para Claude
INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'API_KEY', 'x-api-key', '{{ENCRYPTED_CLAUDE_API_KEY}}', 'HEADER'
FROM external_api_config_read_model WHERE code = 'CLAUDE_ANALYSIS';

-- Autenticación para Gemini
INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location)
SELECT id, 'API_KEY', 'key', '{{ENCRYPTED_GEMINI_API_KEY}}', 'QUERY_PARAM'
FROM external_api_config_read_model WHERE code = 'GEMINI_ANALYSIS';

-- ============================================================================
-- 9. TEMPLATES DE REQUEST
-- ============================================================================

-- Template para consulta de RUC en SRI
INSERT INTO external_api_request_template (api_config_id, name, description, query_params_template, is_default)
SELECT id, 'Consulta por RUC', 'Consulta información por número de RUC',
       '{"ruc": "{{ruc}}"}',
       TRUE
FROM external_api_config_read_model WHERE code = 'SRI_VALIDAR_RUC';

-- Template para búsqueda en catálogo SERCOP
INSERT INTO external_api_request_template (api_config_id, name, description, query_params_template, is_default)
SELECT id, 'Búsqueda de Productos', 'Busca productos en el catálogo electrónico',
       '{"cpc": "{{cpcCode}}", "descripcion": "{{searchTerm}}", "page": "{{page}}", "size": "{{size}}"}',
       TRUE
FROM external_api_config_read_model WHERE code = 'SERCOP_CATALOGO';

-- Template para consulta de precios referenciales
INSERT INTO external_api_request_template (api_config_id, name, description, query_params_template, is_default)
SELECT id, 'Consulta Precios por CPC', 'Obtiene precios referenciales por código CPC',
       '{"cpc": "{{cpcCode}}", "fechaDesde": "{{startDate}}", "fechaHasta": "{{endDate}}"}',
       TRUE
FROM external_api_config_read_model WHERE code = 'SERCOP_PRECIOS_REF';

-- Template para publicación de proceso
INSERT INTO external_api_request_template (api_config_id, name, description, body_template, is_default)
SELECT id, 'Publicar Proceso', 'Publica un nuevo proceso en SERCOP',
       '{
         "codigoProceso": "{{processCode}}",
         "tipoProceso": "{{processType}}",
         "objeto": "{{processObject}}",
         "presupuestoReferencial": {{budget}},
         "entidadContratante": {
           "ruc": "{{entityRuc}}",
           "nombre": "{{entityName}}"
         },
         "fechaPublicacion": "{{publicationDate}}",
         "fechaLimiteOfertas": "{{deadlineDate}}",
         "documentos": {{documents}}
       }',
       TRUE
FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION';

-- Template para análisis con IA
INSERT INTO external_api_request_template (api_config_id, name, description, body_template, is_default)
SELECT id, 'Análisis de Documento CP', 'Analiza documentos de contratación pública',
       '{
         "model": "gpt-4-turbo-preview",
         "messages": [
           {"role": "system", "content": "{{systemPrompt}}"},
           {"role": "user", "content": "{{userPrompt}}"}
         ],
         "temperature": 0.1,
         "max_tokens": 4000,
         "response_format": {"type": "json_object"}
       }',
       TRUE
FROM external_api_config_read_model WHERE code = 'OPENAI_ANALYSIS';

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, is_default)
SELECT id, 'Análisis de Documento CP', 'Analiza documentos de contratación pública',
       '{
         "model": "claude-3-opus-20240229",
         "max_tokens": 4000,
         "system": "{{systemPrompt}}",
         "messages": [
           {"role": "user", "content": "{{userPrompt}}"}
         ]
       }',
       TRUE
FROM external_api_config_read_model WHERE code = 'CLAUDE_ANALYSIS';

-- ============================================================================
-- 10. CONFIGURACIÓN DE RESPUESTAS
-- ============================================================================

-- Configuración de respuesta para SRI
INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, error_message_path, extraction_mappings_json)
SELECT id, '200', 'JSON', '$.success', '$.mensaje',
       '{
         "ruc": "$.numeroRuc",
         "razonSocial": "$.razonSocial",
         "estado": "$.estadoContribuyente",
         "tipoContribuyente": "$.tipoContribuyente",
         "fechaInicio": "$.fechaInicioActividades",
         "direccion": "$.direccionMatriz"
       }'
FROM external_api_config_read_model WHERE code = 'SRI_VALIDAR_RUC';

-- Configuración de respuesta para SERCOP Catálogo
INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, error_message_path, extraction_mappings_json)
SELECT id, '200', 'JSON', '$.success', '$.error.message',
       '{
         "productos": "$.data.productos",
         "totalItems": "$.data.totalItems",
         "page": "$.data.page"
       }'
FROM external_api_config_read_model WHERE code = 'SERCOP_CATALOGO';

-- Configuración de respuesta para precios referenciales
INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, error_message_path, extraction_mappings_json)
SELECT id, '200', 'JSON', '$.success', '$.error.message',
       '{
         "precios": "$.data.precios",
         "precioPromedio": "$.data.estadisticas.promedio",
         "precioMinimo": "$.data.estadisticas.minimo",
         "precioMaximo": "$.data.estadisticas.maximo",
         "cantidadMuestras": "$.data.estadisticas.muestras"
       }'
FROM external_api_config_read_model WHERE code = 'SERCOP_PRECIOS_REF';

-- ============================================================================
-- 11. ALERTAS DE MONITOREO DE APIS
-- ============================================================================
-- NOTA: Sección de external_api_alert_config omitida - la tabla no existe como entidad JPA.
-- Las alertas de API se configurarán mediante el sistema de alertas existente.

-- ============================================================================
-- 12. MAPEO DE VARIABLES PARA COMPRAS PÚBLICAS
-- ============================================================================

-- Crear tabla de mapeo si no existe
CREATE TABLE IF NOT EXISTS external_api_variable_mapping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_config_id BIGINT NOT NULL,
    variable_name VARCHAR(100) NOT NULL,
    source_type ENUM('OPERATION', 'CONTEXT', 'CONSTANT', 'EXPRESSION') NOT NULL,
    source_path VARCHAR(500),
    default_value VARCHAR(500),
    transform_expression VARCHAR(500),
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_config_id) REFERENCES external_api_config_read_model(id) ON DELETE CASCADE,
    INDEX idx_variable_api (api_config_id),
    UNIQUE KEY uk_variable (api_config_id, variable_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mapeo de variables para publicación SERCOP
INSERT INTO external_api_variable_mapping (api_config_id, variable_name, source_type, source_path, is_required)
SELECT id, 'processCode', 'OPERATION', '$.processCode', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'processType', 'OPERATION', '$.processType', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'processObject', 'OPERATION', '$.description', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'budget', 'OPERATION', '$.budget', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'entityRuc', 'CONTEXT', '$.entity.ruc', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'entityName', 'CONTEXT', '$.entity.name', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'publicationDate', 'OPERATION', '$.publicationDate', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'deadlineDate', 'OPERATION', '$.deadlineDate', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION'
UNION ALL
SELECT id, 'documents', 'OPERATION', '$.documents', FALSE FROM external_api_config_read_model WHERE code = 'SERCOP_PUBLICACION';

-- Mapeo de variables para validación RUC
INSERT INTO external_api_variable_mapping (api_config_id, variable_name, source_type, source_path, is_required)
SELECT id, 'ruc', 'OPERATION', '$.supplierRuc', TRUE FROM external_api_config_read_model WHERE code = 'SRI_VALIDAR_RUC';

-- Mapeo de variables para consulta de precios
INSERT INTO external_api_variable_mapping (api_config_id, variable_name, source_type, source_path, is_required)
SELECT id, 'cpcCode', 'OPERATION', '$.cpcCode', TRUE FROM external_api_config_read_model WHERE code = 'SERCOP_PRECIOS_REF'
UNION ALL
SELECT id, 'startDate', 'EXPRESSION', 'NOW - 24 MONTHS', FALSE FROM external_api_config_read_model WHERE code = 'SERCOP_PRECIOS_REF'
UNION ALL
SELECT id, 'endDate', 'EXPRESSION', 'NOW', FALSE FROM external_api_config_read_model WHERE code = 'SERCOP_PRECIOS_REF';
