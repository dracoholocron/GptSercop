-- ============================================================================
-- V20260227: Prompts y Catálogos de IA para Sistema de Compras Públicas
-- ============================================================================
-- Reutiliza la infraestructura existente:
-- - ai_prompt_config: Para prompts configurables
-- - custom_catalog_read_model: Para catálogos de configuración
-- ============================================================================

-- ============================================================================
-- 1. TABLAS (crear primero, antes de cualquier INSERT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_historical_prices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cpc_code VARCHAR(20) NOT NULL COMMENT 'Código CPC del bien/servicio',
    cpc_description VARCHAR(500),
    item_description VARCHAR(500),
    unit VARCHAR(50),
    unit_price DECIMAL(15,4) NOT NULL,
    quantity DECIMAL(15,4),
    total_value DECIMAL(15,2),
    process_code VARCHAR(50) COMMENT 'Código del proceso SERCOP',
    process_type VARCHAR(50) COMMENT 'Tipo: SIE, CE, MC, etc.',
    entity_ruc VARCHAR(13),
    entity_name VARCHAR(300),
    supplier_ruc VARCHAR(13),
    supplier_name VARCHAR(300),
    adjudication_date DATE,
    publication_date DATE,
    province VARCHAR(100),
    canton VARCHAR(100),
    source VARCHAR(50) DEFAULT 'SERCOP' COMMENT 'Fuente: SERCOP, CATALOG, MANUAL',
    data_quality ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cpc_date (cpc_code, adjudication_date),
    INDEX idx_entity (entity_ruc),
    INDEX idx_supplier (supplier_ruc),
    INDEX idx_process (process_code),
    FULLTEXT INDEX idx_description (item_description, cpc_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_ai_analysis_history (
    id VARCHAR(36) PRIMARY KEY,
    analysis_type VARCHAR(50) NOT NULL COMMENT 'PRICE, RISK, LEGAL, EXTRACTION, GENERATION',
    prompt_key VARCHAR(100) NOT NULL,
    process_id VARCHAR(36),
    process_code VARCHAR(50),
    entity_ruc VARCHAR(13),
    input_data JSON NOT NULL COMMENT 'Datos de entrada al análisis',
    output_data JSON COMMENT 'Resultado del análisis',
    provider VARCHAR(20) NOT NULL COMMENT 'claude, openai, gemini',
    model VARCHAR(50),
    input_tokens INT,
    output_tokens INT,
    processing_time_ms BIGINT,
    estimated_cost DECIMAL(10,6),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    error_message TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analysis_type (analysis_type),
    INDEX idx_process (process_id),
    INDEX idx_entity (entity_ruc),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. CATÁLOGOS DE CONFIGURACIÓN PARA COMPRAS PÚBLICAS
-- ============================================================================

-- Catálogo padre: TIPOS DE PROCESO DE CONTRATACIÓN
INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_TIPO_PROCESO', 'Tipos de Proceso de Contratación Pública',
       'Catálogo de tipos de procedimientos de contratación según LOSNCP', 1, NULL, TRUE, TRUE, 100, NOW(), 'system'
FROM custom_catalog_read_model
WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_TIPO_PROCESO');

SET @cp_tipo_proceso_id = (SELECT id FROM custom_catalog_read_model WHERE code = 'CP_TIPO_PROCESO');

-- Registros de tipos de proceso (individual inserts para evitar conflictos de ID)
INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_CE', 'Catálogo Electrónico', 'Compras mediante convenio marco - Art. 44 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 1, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_CE' AND parent_catalog_code = 'CP_TIPO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_SIE', 'Subasta Inversa Electrónica', 'Para bienes y servicios normalizados - Art. 47 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 2, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_SIE' AND parent_catalog_code = 'CP_TIPO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_MC', 'Menor Cuantía', 'Procedimiento simplificado por montos menores - Art. 51 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 3, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_MC' AND parent_catalog_code = 'CP_TIPO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_CDC', 'Cotización', 'Proceso de cotización - Art. 50 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 4, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_CDC' AND parent_catalog_code = 'CP_TIPO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_LP', 'Licitación Pública', 'Para montos mayores - Art. 48 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 5, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_LP' AND parent_catalog_code = 'CP_TIPO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_IC', 'Ínfima Cuantía', 'Contrataciones de menor valor - Art. 52.1 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 6, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_IC' AND parent_catalog_code = 'CP_TIPO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_RE', 'Régimen Especial', 'Procedimientos especiales - Art. 2 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 7, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_RE' AND parent_catalog_code = 'CP_TIPO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_FI', 'Feria Inclusiva', 'Participación de micro y pequeñas empresas - Art. 6 LOSNCP', 2, @cp_tipo_proceso_id, 'CP_TIPO_PROCESO', TRUE, TRUE, 8, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_FI' AND parent_catalog_code = 'CP_TIPO_PROCESO');

-- Catálogo padre: INDICADORES DE RIESGO
INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_INDICADOR_RIESGO', 'Indicadores de Riesgo de Contratación',
       'Indicadores para detección de irregularidades en procesos de contratación', 1, NULL, TRUE, TRUE, 101, NOW(), 'system'
FROM custom_catalog_read_model
WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_INDICADOR_RIESGO');

SET @cp_riesgo_id = (SELECT id FROM custom_catalog_read_model WHERE code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_SINGLE_BIDDER', 'Oferente Único', 'Proceso competitivo con un solo oferente - Severidad: ALTA - Peso: 0.80', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 1, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_SINGLE_BIDDER' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_IDENTICAL_PRICES', 'Precios Idénticos', 'Dos o más ofertas con precios casi idénticos (<1%) - Severidad: CRÍTICA - Peso: 0.95', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 2, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_IDENTICAL_PRICES' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_REPEAT_WINNER', 'Ganador Repetitivo', 'Mismo proveedor gana >70% de procesos similares - Severidad: MEDIA - Peso: 0.60', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 3, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_REPEAT_WINNER' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_FRACTIONING', 'Fraccionamiento', 'División de compras para evitar umbrales - Severidad: CRÍTICA - Peso: 0.90', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 4, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_FRACTIONING' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_SHORT_DEADLINE', 'Plazo Insuficiente', 'Tiempo de participación menor al mínimo - Severidad: MEDIA - Peso: 0.50', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 5, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_SHORT_DEADLINE' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_SPECIFIC_SPECS', 'Especificaciones Dirigidas', 'Requisitos que solo un proveedor cumple - Severidad: ALTA - Peso: 0.75', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 6, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_SPECIFIC_SPECS' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_CONFLICT_INTEREST', 'Conflicto de Interés', 'Relación entre funcionario y proveedor - Severidad: CRÍTICA - Peso: 1.00', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 7, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_CONFLICT_INTEREST' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_PRICE_ANOMALY', 'Anomalía de Precio', 'Precio muy superior o inferior al mercado - Severidad: ALTA - Peso: 0.70', 2, @cp_riesgo_id, 'CP_INDICADOR_RIESGO', TRUE, TRUE, 8, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_PRICE_ANOMALY' AND parent_catalog_code = 'CP_INDICADOR_RIESGO');

-- Catálogo padre: NIVELES DE RIESGO
INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_NIVEL_RIESGO', 'Niveles de Riesgo',
       'Clasificación de niveles de riesgo para procesos', 1, NULL, TRUE, TRUE, 102, NOW(), 'system'
FROM custom_catalog_read_model
WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_NIVEL_RIESGO');

SET @cp_nivel_riesgo_id = (SELECT id FROM custom_catalog_read_model WHERE code = 'CP_NIVEL_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_LOW', 'Bajo', 'Score 0-25 - Sin indicadores significativos', 2, @cp_nivel_riesgo_id, 'CP_NIVEL_RIESGO', TRUE, TRUE, 1, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_LOW' AND parent_catalog_code = 'CP_NIVEL_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_MEDIUM', 'Medio', 'Score 26-50 - Algunos indicadores presentes', 2, @cp_nivel_riesgo_id, 'CP_NIVEL_RIESGO', TRUE, TRUE, 2, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_MEDIUM' AND parent_catalog_code = 'CP_NIVEL_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_HIGH', 'Alto', 'Score 51-75 - Múltiples indicadores detectados', 2, @cp_nivel_riesgo_id, 'CP_NIVEL_RIESGO', TRUE, TRUE, 3, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_HIGH' AND parent_catalog_code = 'CP_NIVEL_RIESGO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_CRITICAL', 'Crítico', 'Score 76-100 - Requiere revisión inmediata', 2, @cp_nivel_riesgo_id, 'CP_NIVEL_RIESGO', TRUE, TRUE, 4, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_CRITICAL' AND parent_catalog_code = 'CP_NIVEL_RIESGO');

-- Catálogo padre: ESTADOS DE PROCESO
INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_ESTADO_PROCESO', 'Estados de Proceso de Contratación',
       'Catálogo de estados posibles para procesos de contratación', 1, NULL, TRUE, TRUE, 103, NOW(), 'system'
FROM custom_catalog_read_model
WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_ESTADO_PROCESO');

SET @cp_estado_id = (SELECT id FROM custom_catalog_read_model WHERE code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_BORRADOR', 'Borrador', 'Proceso en elaboración', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 1, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_BORRADOR' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_EN_REVISION', 'En Revisión', 'Pendiente aprobación', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 2, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_EN_REVISION' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_APROBADO', 'Aprobado', 'Aprobado para publicación', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 3, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_APROBADO' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_PUBLICADO', 'Publicado', 'Publicado en SERCOP', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 4, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_PUBLICADO' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_ADJUDICADO', 'Adjudicado', 'Proceso adjudicado', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 5, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_ADJUDICADO' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_CANCELADO', 'Cancelado', 'Proceso cancelado', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 6, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_CANCELADO' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_DESIERTO', 'Desierto', 'Proceso declarado desierto', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 7, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_DESIERTO' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_FINALIZADO', 'Finalizado', 'Proceso finalizado y liquidado', 2, @cp_estado_id, 'CP_ESTADO_PROCESO', TRUE, TRUE, 8, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_FINALIZADO' AND parent_catalog_code = 'CP_ESTADO_PROCESO');

-- ============================================================================
-- 3. PROMPTS DE IA PARA COMPRAS PÚBLICAS
-- ============================================================================

INSERT IGNORE INTO ai_prompt_config (
    prompt_key, display_name, description, category, language, message_type, prompt_template,
    available_variables, config, created_by
) VALUES (
    'cp_legal_assistant',
    'Asistente Legal - Compras Públicas Ecuador',
    'Prompt para proporcionar asistencia legal contextual en procesos de contratación pública basado en LOSNCP, RGLOSNCP y Resoluciones SERCOP.',
    'CP_LEGAL', 'es', 'ALL',
    'Eres un experto en contratación pública de Ecuador. Tu rol es asistir a funcionarios públicos en la elaboración correcta de procesos de contratación.

CONTEXTO DEL PROCESO:
- Tipo de Proceso: {{processType}}
- Etapa Actual: {{currentStep}}
- Campo en edición: {{fieldId}}
- Presupuesto Referencial: {{budget}}

MARCO LEGAL APLICABLE:
- Ley Orgánica del Sistema Nacional de Contratación Pública (LOSNCP)
- Reglamento General a la LOSNCP (RGLOSNCP)
- Resoluciones SERCOP vigentes
- Codificación de Resoluciones SERCOP

INSTRUCCIONES:
1. Proporciona ayuda contextual específica para el campo "{{fieldId}}" en el proceso "{{processType}}"
2. Incluye referencias legales exactas (artículos de LOSNCP, RGLOSNCP)
3. Menciona errores comunes a evitar
4. Da ejemplos de redacción correcta cuando aplique
5. Indica si hay resoluciones SERCOP específicas que apliquen

FORMATO DE RESPUESTA JSON:
{
  "help": {
    "title": "Título de la ayuda",
    "content": "Explicación detallada",
    "legalReferences": [
      {"law": "LOSNCP", "article": "Art. X", "summary": "Resumen del artículo"}
    ],
    "requirements": ["Requisito 1", "Requisito 2"],
    "commonErrors": ["Error 1 a evitar", "Error 2 a evitar"],
    "tips": ["Consejo 1", "Consejo 2"],
    "examples": ["Ejemplo de redacción correcta"],
    "sercopResolutions": ["RE-SERCOP-2024-XXX"]
  }
}',
    '["processType", "currentStep", "fieldId", "budget"]',
    '{"maxTokens": 2000, "temperature": 0.2}',
    'system'
);

INSERT IGNORE INTO ai_prompt_config (
    prompt_key, display_name, description, category, language, message_type, prompt_template,
    available_variables, config, created_by
) VALUES (
    'cp_price_analysis',
    'Análisis de Precios - Compras Públicas',
    'Prompt para analizar precios propuestos comparándolos con datos históricos de contratación pública.',
    'CP_ANALYSIS', 'es', 'ALL',
    'Eres un analista experto en precios de contratación pública de Ecuador.

DATOS DEL ANÁLISIS:
- Código CPC: {{cpcCode}}
- Descripción: {{itemDescription}}
- Precio Propuesto: ${{proposedPrice}}
- Unidad: {{unit}}
- Cantidad: {{quantity}}

DATOS HISTÓRICOS (últimos 24 meses):
{{historicalData}}

INSTRUCCIONES:
1. Compara el precio propuesto con los precios históricos
2. Calcula percentil del precio propuesto
3. Identifica anomalías de precio (muy alto o muy bajo)
4. Considera factores como inflación, ubicación geográfica, volumen
5. Proporciona recomendación fundamentada

FORMATO DE RESPUESTA JSON:
{
  "analysis": {
    "percentileRank": 0,
    "deviationFromAverage": 0,
    "anomalyScore": 0,
    "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
    "recommendation": "Descripción de la recomendación",
    "warnings": ["Advertencia 1"],
    "justification": "Justificación detallada del análisis"
  }
}',
    '["cpcCode", "itemDescription", "proposedPrice", "unit", "quantity", "historicalData"]',
    '{"maxTokens": 1500, "temperature": 0.1}',
    'system'
);

INSERT IGNORE INTO ai_prompt_config (
    prompt_key, display_name, description, category, language, message_type, prompt_template,
    available_variables, config, created_by
) VALUES (
    'cp_risk_detection',
    'Detección de Riesgos - Compras Públicas',
    'Prompt para detectar indicadores de riesgo de corrupción en procesos de contratación pública.',
    'CP_RISK', 'es', 'ALL',
    'Eres un auditor especializado en detección de irregularidades en contratación pública de Ecuador.

DATOS DEL PROCESO:
- Código de Proceso: {{processCode}}
- Tipo de Proceso: {{processType}}
- Entidad Contratante: {{entityName}} (RUC: {{entityRuc}})
- Presupuesto Referencial: ${{budget}}
- Fecha de Publicación: {{publicationDate}}
- Fecha Límite de Ofertas: {{deadlineDate}}

OFERENTES PARTICIPANTES:
{{biddersData}}

INDICADORES A EVALUAR:
{{riskIndicators}}

FORMATO DE RESPUESTA JSON:
{
  "assessment": {
    "overallRiskScore": 0,
    "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
    "detectedIndicators": [
      {"code": "CODE", "name": "Name", "detected": true, "score": 0, "evidence": "...", "severity": "HIGH"}
    ],
    "patterns": [{"type": "Type", "description": "...", "entities": ["Entity"]}],
    "recommendations": [{"priority": "HIGH", "action": "...", "responsible": "..."}],
    "summary": "Resumen ejecutivo"
  }
}',
    '["processCode", "processType", "entityName", "entityRuc", "budget", "publicationDate", "deadlineDate", "biddersData", "riskIndicators"]',
    '{"maxTokens": 2500, "temperature": 0.1}',
    'system'
);

INSERT IGNORE INTO ai_prompt_config (
    prompt_key, display_name, description, category, language, message_type, prompt_template,
    available_variables, config, created_by
) VALUES (
    'cp_document_extraction',
    'Extracción de Documentos - Compras Públicas',
    'Prompt para extraer información de pliegos, TDR, especificaciones técnicas y otros documentos de contratación.',
    'CP_EXTRACTION', 'es', 'ALL',
    'Eres un especialista en análisis de documentos de contratación pública de Ecuador.

TIPO DE DOCUMENTO: {{documentType}}
PROCESO: {{processType}}

INSTRUCCIONES:
1. Analiza el documento proporcionado
2. Extrae los campos relevantes según el tipo de documento
3. Identifica requisitos obligatorios vs opcionales
4. Detecta inconsistencias o información faltante

FORMATO DE RESPUESTA JSON:
{
  "extraction": {
    "documentType": "{{documentType}}",
    "confidence": 0.95,
    "fields": [{"fieldCode": "CAMPO_1", "value": "Valor", "confidence": 0.9, "evidence": "Texto fuente"}],
    "warnings": [],
    "missingInfo": [],
    "summary": "Resumen"
  }
}',
    '["documentType", "processType", "fieldSchema"]',
    '{"maxTokens": 4000, "temperature": 0.1}',
    'system'
);

INSERT IGNORE INTO ai_prompt_config (
    prompt_key, display_name, description, category, language, message_type, prompt_template,
    available_variables, config, created_by
) VALUES (
    'cp_pliego_generator',
    'Generador de Pliegos - Compras Públicas',
    'Prompt para generar secciones de pliegos basados en los modelos SERCOP y la información del proceso.',
    'CP_GENERATION', 'es', 'ALL',
    'Eres un experto en elaboración de pliegos de contratación pública de Ecuador.

DATOS DEL PROCESO:
- Tipo: {{processType}}
- Objeto: {{contractObject}}
- Presupuesto: ${{budget}}
- Entidad: {{entityName}}
- CPC: {{cpcCode}}

SECCIÓN A GENERAR: {{section}}

FORMATO DE RESPUESTA JSON:
{
  "generated": {
    "section": "{{section}}",
    "content": "Contenido generado...",
    "legalBasis": ["Art. X LOSNCP"],
    "mandatoryClauses": ["Cláusula 1"],
    "warnings": ["Advertencia"],
    "reviewPoints": ["Punto a revisar"]
  }
}',
    '["processType", "contractObject", "budget", "entityName", "cpcCode", "section"]',
    '{"maxTokens": 3000, "temperature": 0.3}',
    'system'
);

-- ============================================================================
-- 4. PERMISOS PARA MÓDULOS DE IA DE COMPRAS PÚBLICAS
-- ============================================================================

INSERT IGNORE INTO permission_read_model (code, name, description, module, created_at) VALUES
    ('CP_AI_LEGAL_VIEW', 'Ver Asistente Legal CP', 'Permite usar el asistente legal de compras públicas', 'CP_AI', NOW()),
    ('CP_AI_PRICE_ANALYSIS', 'Análisis de Precios CP', 'Permite usar el módulo de análisis de precios', 'CP_AI', NOW()),
    ('CP_AI_RISK_DETECTION', 'Detección de Riesgos CP', 'Permite usar el módulo de detección de riesgos', 'CP_AI', NOW()),
    ('CP_AI_DOC_EXTRACTION', 'Extracción de Documentos CP', 'Permite usar la extracción de documentos con IA', 'CP_AI', NOW()),
    ('CP_AI_PLIEGO_GENERATOR', 'Generador de Pliegos CP', 'Permite usar el generador de pliegos con IA', 'CP_AI', NOW()),
    ('CP_PROCESS_VIEW', 'Ver Procesos CP', 'Permite ver procesos de contratación', 'CP', NOW()),
    ('CP_PROCESS_CREATE', 'Crear Procesos CP', 'Permite crear procesos de contratación', 'CP', NOW()),
    ('CP_PROCESS_EDIT', 'Editar Procesos CP', 'Permite editar procesos de contratación', 'CP', NOW()),
    ('CP_PAA_VIEW', 'Ver PAA', 'Permite ver el Plan Anual de Adquisiciones', 'CP', NOW()),
    ('CP_PAA_EDIT', 'Editar PAA', 'Permite editar el Plan Anual de Adquisiciones', 'CP', NOW()),
    ('CP_BUDGET_VIEW', 'Ver Presupuesto CP', 'Permite ver certificaciones presupuestarias', 'CP', NOW()),
    ('CP_BUDGET_MANAGE', 'Gestionar Presupuesto CP', 'Permite gestionar certificaciones presupuestarias', 'CP', NOW());

-- Asignar permisos al rol ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' AND p.module IN ('CP_AI', 'CP');

-- ============================================================================
-- 5. DATOS DE EJEMPLO PARA DEMO
-- ============================================================================

INSERT IGNORE INTO cp_historical_prices (cpc_code, cpc_description, item_description, unit, unit_price, quantity, total_value, process_type, entity_name, supplier_name, adjudication_date, province) VALUES
('43211503', 'Computadores portátiles', 'Laptop Core i5 8GB RAM 256GB SSD', 'Unidad', 850.00, 50, 42500.00, 'CE', 'Ministerio de Educación', 'TechStore S.A.', '2024-01-15', 'Pichincha'),
('43211503', 'Computadores portátiles', 'Laptop Core i5 8GB RAM 256GB SSD', 'Unidad', 820.00, 100, 82000.00, 'SIE', 'Universidad Central', 'CompuWorld Cia. Ltda.', '2024-02-20', 'Pichincha'),
('43211503', 'Computadores portátiles', 'Laptop Core i7 16GB RAM 512GB SSD', 'Unidad', 1150.00, 30, 34500.00, 'CE', 'Contraloría General', 'TechStore S.A.', '2024-03-10', 'Pichincha'),
('44121615', 'Papel bond', 'Resma papel bond A4 75g', 'Resma', 3.50, 5000, 17500.00, 'CE', 'Registro Civil', 'Papelera Nacional', '2024-01-20', 'Guayas'),
('44121615', 'Papel bond', 'Resma papel bond A4 75g', 'Resma', 3.45, 10000, 34500.00, 'SIE', 'SRI', 'DistPapel S.A.', '2024-02-15', 'Pichincha'),
('44121615', 'Papel bond', 'Resma papel bond A4 75g', 'Resma', 3.60, 2000, 7200.00, 'MC', 'Municipio de Quito', 'Papelera Nacional', '2024-03-01', 'Pichincha'),
('51471901', 'Medicamentos', 'Paracetamol 500mg tabletas x 100', 'Caja', 2.80, 10000, 28000.00, 'SIE', 'Hospital Eugenio Espejo', 'FarmaDistrib S.A.', '2024-01-25', 'Pichincha'),
('51471901', 'Medicamentos', 'Paracetamol 500mg tabletas x 100', 'Caja', 2.75, 50000, 137500.00, 'SIE', 'MSP', 'Laboratorios Life', '2024-02-28', 'Guayas'),
('72154066', 'Servicios de limpieza', 'Servicio de limpieza mensual', 'Mes', 4500.00, 12, 54000.00, 'MC', 'GAD Pichincha', 'CleanPro S.A.', '2024-01-10', 'Pichincha'),
('72154066', 'Servicios de limpieza', 'Servicio de limpieza mensual', 'Mes', 4200.00, 12, 50400.00, 'MC', 'ANT', 'ServiLimp Cia. Ltda.', '2024-02-05', 'Pichincha');
