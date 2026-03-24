-- ============================================================================
-- V20260227_2: Eventos, Alertas, Reglas y Transiciones para Compras Públicas
-- ============================================================================
-- Configuración completa del sistema de workflow para procesos de contratación
-- ============================================================================

-- ============================================================================
-- 1. TIPOS DE EVENTO PARA COMPRAS PÚBLICAS
-- ============================================================================
-- NOTA: Sección de event_type_config omitida - la tabla real es event_type_config_readmodel
-- con esquema diferente. Los tipos de evento CP se insertarán por el sistema cuando sea necesario.

-- ============================================================================
-- 2. ESTADOS DE PROCESO DE COMPRAS PÚBLICAS
-- ============================================================================
-- NOTA: Los estados CP ya fueron creados en V20260227 con prefijo CP_
-- (CP_BORRADOR, CP_EN_REVISION, CP_APROBADO, etc.)

-- ============================================================================
-- 3. REGLAS DE TRANSICIÓN DE ESTADOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_state_transition_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    process_type VARCHAR(50) COMMENT 'NULL aplica a todos los tipos',
    required_event VARCHAR(100) COMMENT 'Evento que debe existir para la transición',
    required_role VARCHAR(100) COMMENT 'Rol requerido para ejecutar transición',
    required_documents JSON COMMENT 'Documentos requeridos',
    validation_rules JSON COMMENT 'Reglas de validación adicionales',
    auto_create_alert BOOLEAN DEFAULT FALSE,
    alert_template_code VARCHAR(100),
    alert_days_before INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transition (from_state, to_state),
    INDEX idx_process_type (process_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas de transición
INSERT INTO cp_state_transition_rules (from_state, to_state, required_event, required_role, required_documents, validation_rules, auto_create_alert, alert_template_code, alert_days_before) VALUES
-- Preparación
('BORRADOR', 'EN_REVISION', 'CP_RESOLUCION_INICIO', 'CP_ANALISTA', '["PAC", "CERT_PRESUPUESTARIA", "ESTUDIO_MERCADO", "TDR"]', '{"minBudget": 0, "requireApproval": true}', TRUE, 'CP_REVISION_PENDIENTE', 0),
('EN_REVISION', 'APROBADO', NULL, 'CP_DIRECTOR', '[]', '{"requiresSignature": true}', FALSE, NULL, NULL),
('EN_REVISION', 'BORRADOR', NULL, 'CP_ANALISTA', '[]', '{"requiresObservation": true}', FALSE, NULL, NULL),

-- Publicación
('APROBADO', 'PUBLICADO', 'CP_PUBLICACION_PROCESO', 'CP_ANALISTA', '["PLIEGOS_FIRMADOS"]', '{"requiresSercopCode": true}', TRUE, 'CP_PROCESO_PUBLICADO', 0),

-- Evaluación
('PUBLICADO', 'EN_EVALUACION', 'CP_APERTURA_OFERTAS', 'CP_COMISION', '["ACTA_APERTURA"]', '{"minBidders": 1}', TRUE, 'CP_EVALUAR_OFERTAS', 0),
('EN_EVALUACION', 'ADJUDICADO', 'CP_RESOLUCION_ADJUDICACION', 'CP_MAXIMA_AUTORIDAD', '["INFORME_COMISION", "RESOLUCION"]', '{"requiresWinner": true}', TRUE, 'CP_PROCESO_ADJUDICADO', 0),
('EN_EVALUACION', 'DESIERTO', 'CP_DECLARATORIA_DESIERTO', 'CP_MAXIMA_AUTORIDAD', '["RESOLUCION_DESIERTO"]', '{}', FALSE, NULL, NULL),

-- Contratación
('ADJUDICADO', 'CONTRATADO', 'CP_SUSCRIPCION_CONTRATO', 'CP_ANALISTA', '["CONTRATO_FIRMADO", "GARANTIAS"]', '{"requiresContract": true}', TRUE, 'CP_CONTRATO_SUSCRITO', 0),

-- Ejecución
('CONTRATADO', 'EN_EJECUCION', 'CP_ORDEN_INICIO', 'CP_ADMINISTRADOR_CONTRATO', '["ORDEN_INICIO"]', '{}', TRUE, 'CP_INICIO_EJECUCION', 0),
('EN_EJECUCION', 'LIQUIDADO', 'CP_LIQUIDACION_CONTRATO', 'CP_ADMINISTRADOR_CONTRATO', '["ACTA_RECEPCION_DEFINITIVA", "ACTA_LIQUIDACION"]', '{"allPaymentsComplete": true}', TRUE, 'CP_CONTRATO_LIQUIDADO', 0),

-- Cancelación (puede ocurrir desde varios estados)
('BORRADOR', 'CANCELADO', NULL, 'CP_DIRECTOR', '[]', '{"requiresJustification": true}', FALSE, NULL, NULL),
('EN_REVISION', 'CANCELADO', NULL, 'CP_DIRECTOR', '[]', '{"requiresJustification": true}', FALSE, NULL, NULL),
('APROBADO', 'CANCELADO', NULL, 'CP_MAXIMA_AUTORIDAD', '["RESOLUCION_CANCELACION"]', '{"requiresJustification": true}', FALSE, NULL, NULL),
('PUBLICADO', 'CANCELADO', NULL, 'CP_MAXIMA_AUTORIDAD', '["RESOLUCION_CANCELACION"]', '{"requiresJustification": true, "notifyBidders": true}', FALSE, NULL, NULL);

-- ============================================================================
-- 4. PLANTILLAS DE ALERTAS AUTOMÁTICAS
-- ============================================================================
-- NOTA: Sección de alert_type_config omitida - la entidad AlertTypeConfig tiene un esquema
-- diferente (type_code, label_es, label_en, etc.). Las alertas CP se configurarán por el sistema.

-- ============================================================================
-- 5. REGLAS DE NEGOCIO AUTOMÁTICAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_business_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_name VARCHAR(200) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(100) COMMENT 'Evento que dispara la regla',
    trigger_condition JSON COMMENT 'Condición para ejecutar',
    action_type ENUM('CREATE_ALERT', 'CHANGE_STATE', 'NOTIFY', 'BLOCK', 'CALCULATE', 'AI_ANALYSIS') NOT NULL,
    action_config JSON NOT NULL COMMENT 'Configuración de la acción',
    priority INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trigger (trigger_event)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas de negocio
INSERT INTO cp_business_rules (rule_code, rule_name, description, trigger_event, trigger_condition, action_type, action_config, priority) VALUES
-- Análisis de riesgo automático al publicar
('CP_AUTO_RISK_ANALYSIS', 'Análisis de Riesgo Automático', 'Ejecutar análisis de riesgo IA al publicar un proceso', 'CP_PUBLICACION_PROCESO', '{}', 'AI_ANALYSIS', '{"analysisType": "RISK", "createAlertOnHighRisk": true}', 100),

-- Análisis de precios automático
('CP_AUTO_PRICE_ANALYSIS', 'Análisis de Precios Automático', 'Analizar precios cuando se agrega un item al proceso', 'CP_ITEM_ADDED', '{"minValue": 1000}', 'AI_ANALYSIS', '{"analysisType": "PRICE", "alertOnAnomaly": true}', 90),

-- Alerta por oferente único
('CP_SINGLE_BIDDER_ALERT', 'Alerta Oferente Único', 'Crear alerta cuando solo hay un oferente', 'CP_APERTURA_OFERTAS', '{"bidderCount": 1}', 'CREATE_ALERT', '{"alertType": "CP_RIESGO_DETECTADO", "priority": "HIGH", "message": "Proceso con oferente único"}', 80),

-- Verificación de fraccionamiento
('CP_FRACTIONING_CHECK', 'Verificación Fraccionamiento', 'Detectar posible fraccionamiento de compras', 'CP_PREPARACION_INICIO', '{}', 'AI_ANALYSIS', '{"analysisType": "FRACTIONING", "lookbackDays": 365, "threshold": 0.7}', 70),

-- Notificación a Contraloría por monto
('CP_HIGH_VALUE_NOTIFY', 'Notificación Alto Valor', 'Notificar procesos de alto valor', 'CP_PUBLICACION_PROCESO', '{"minBudget": 500000}', 'NOTIFY', '{"recipients": ["CONTRALORIA"], "template": "HIGH_VALUE_PROCESS"}', 60),

-- Bloqueo por documentos incompletos
('CP_BLOCK_INCOMPLETE', 'Bloqueo Documentos Incompletos', 'Impedir publicación sin documentos completos', 'CP_PUBLICACION_PROCESO', '{}', 'BLOCK', '{"requiredDocs": ["PAC", "CERT_PRESUPUESTARIA", "TDR"], "message": "Faltan documentos obligatorios"}', 50),

-- Cálculo de plazos automático
('CP_AUTO_DEADLINE_CALC', 'Cálculo Plazos Automático', 'Calcular plazos según tipo de proceso', 'CP_PREPARACION_INICIO', '{}', 'CALCULATE', '{"field": "deadlines", "formula": "LOSNCP_DEADLINES"}', 40),

-- Alerta de vencimiento de contrato
('CP_CONTRACT_EXPIRY_ALERT', 'Alerta Vencimiento Contrato', 'Crear alertas antes del vencimiento del contrato', 'CP_SUSCRIPCION_CONTRATO', '{}', 'CREATE_ALERT', '{"alertType": "CP_VENCIMIENTO_CONTRATO", "daysBeforeList": [30, 15, 7]}', 30);

-- ============================================================================
-- 6. FLUJOS DE TRABAJO POR TIPO DE PROCESO
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_workflow_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    process_type VARCHAR(50) NOT NULL,
    workflow_name VARCHAR(200) NOT NULL,
    workflow_steps JSON NOT NULL COMMENT 'Pasos del flujo en orden',
    required_roles JSON COMMENT 'Roles involucrados',
    sla_config JSON COMMENT 'Tiempos máximos por paso',
    notifications JSON COMMENT 'Configuración de notificaciones',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_process_type (process_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración de flujos por tipo de proceso
INSERT INTO cp_workflow_config (process_type, workflow_name, workflow_steps, required_roles, sla_config, notifications) VALUES
('CE', 'Catálogo Electrónico',
 '[{"step": "PREPARACION", "name": "Preparación", "maxDays": 1}, {"step": "SELECCION", "name": "Selección de Productos", "maxDays": 1}, {"step": "ORDEN_COMPRA", "name": "Generación Orden", "maxDays": 1}, {"step": "RECEPCION", "name": "Recepción", "maxDays": 5}]',
 '["CP_ANALISTA", "CP_DIRECTOR"]',
 '{"maxTotalDays": 8, "escalationAfter": 2}',
 '{"onStart": true, "onComplete": true, "onDelay": true}'
),

('SIE', 'Subasta Inversa Electrónica',
 '[{"step": "PREPARACION", "name": "Fase Preparatoria", "maxDays": 15}, {"step": "CONVOCATORIA", "name": "Convocatoria", "maxDays": 7}, {"step": "PREGUNTAS", "name": "Preguntas y Respuestas", "maxDays": 3}, {"step": "OFERTAS", "name": "Recepción Ofertas", "maxDays": 1}, {"step": "CALIFICACION", "name": "Calificación", "maxDays": 5}, {"step": "SUBASTA", "name": "Puja", "maxDays": 1}, {"step": "ADJUDICACION", "name": "Adjudicación", "maxDays": 3}, {"step": "CONTRATACION", "name": "Contratación", "maxDays": 15}]',
 '["CP_ANALISTA", "CP_COMISION", "CP_DIRECTOR", "CP_MAXIMA_AUTORIDAD"]',
 '{"maxTotalDays": 50, "escalationAfter": 5}',
 '{"onStart": true, "onPhaseChange": true, "onComplete": true, "onDelay": true}'
),

('MC', 'Menor Cuantía',
 '[{"step": "PREPARACION", "name": "Fase Preparatoria", "maxDays": 10}, {"step": "CONVOCATORIA", "name": "Convocatoria", "maxDays": 5}, {"step": "OFERTAS", "name": "Recepción Ofertas", "maxDays": 3}, {"step": "EVALUACION", "name": "Evaluación", "maxDays": 3}, {"step": "ADJUDICACION", "name": "Adjudicación", "maxDays": 2}, {"step": "CONTRATACION", "name": "Contratación", "maxDays": 10}]',
 '["CP_ANALISTA", "CP_COMISION", "CP_DIRECTOR"]',
 '{"maxTotalDays": 33, "escalationAfter": 3}',
 '{"onStart": true, "onComplete": true, "onDelay": true}'
),

('LP', 'Licitación Pública',
 '[{"step": "PREPARACION", "name": "Fase Preparatoria", "maxDays": 20}, {"step": "CONVOCATORIA", "name": "Convocatoria", "maxDays": 22}, {"step": "PREGUNTAS", "name": "Preguntas y Aclaraciones", "maxDays": 10}, {"step": "OFERTAS", "name": "Recepción Ofertas", "maxDays": 1}, {"step": "APERTURA", "name": "Apertura", "maxDays": 1}, {"step": "EVALUACION", "name": "Evaluación", "maxDays": 10}, {"step": "ADJUDICACION", "name": "Adjudicación", "maxDays": 5}, {"step": "CONTRATACION", "name": "Contratación", "maxDays": 15}]',
 '["CP_ANALISTA", "CP_COMISION", "CP_DIRECTOR", "CP_MAXIMA_AUTORIDAD", "CP_JURIDICO"]',
 '{"maxTotalDays": 84, "escalationAfter": 7}',
 '{"onStart": true, "onPhaseChange": true, "onComplete": true, "onDelay": true, "onHighValue": true}'
),

('IC', 'Ínfima Cuantía',
 '[{"step": "PREPARACION", "name": "Preparación", "maxDays": 1}, {"step": "COTIZACION", "name": "Cotización", "maxDays": 2}, {"step": "SELECCION", "name": "Selección", "maxDays": 1}, {"step": "ADQUISICION", "name": "Adquisición", "maxDays": 3}]',
 '["CP_ANALISTA"]',
 '{"maxTotalDays": 7, "escalationAfter": 2}',
 '{"onComplete": true}'
);

-- ============================================================================
-- 7. PERMISOS ADICIONALES PARA COMPRAS PÚBLICAS
-- ============================================================================

INSERT IGNORE INTO permission_read_model (code, name, description, module, created_at) VALUES
-- Gestión de Procesos
('CP_PROCESO_CREATE', 'Crear Proceso CP', 'Permite crear procesos de contratación pública', 'CP_PROCESO', NOW()),
('CP_PROCESO_EDIT', 'Editar Proceso CP', 'Permite editar procesos de contratación pública', 'CP_PROCESO', NOW()),
('CP_PROCESO_DELETE', 'Eliminar Proceso CP', 'Permite eliminar procesos de contratación pública', 'CP_PROCESO', NOW()),
('CP_PROCESO_APPROVE', 'Aprobar Proceso CP', 'Permite aprobar procesos de contratación pública', 'CP_PROCESO', NOW()),
('CP_PROCESO_PUBLISH', 'Publicar Proceso CP', 'Permite publicar procesos en SERCOP', 'CP_PROCESO', NOW()),
('CP_PROCESO_ADJUDICATE', 'Adjudicar Proceso CP', 'Permite adjudicar procesos de contratación', 'CP_PROCESO', NOW()),

-- Evaluación
('CP_EVALUACION_VIEW', 'Ver Evaluaciones CP', 'Permite ver evaluaciones de ofertas', 'CP_EVALUACION', NOW()),
('CP_EVALUACION_EDIT', 'Evaluar Ofertas CP', 'Permite evaluar ofertas', 'CP_EVALUACION', NOW()),

-- Contratos
('CP_CONTRATO_CREATE', 'Crear Contrato CP', 'Permite crear contratos', 'CP_CONTRATO', NOW()),
('CP_CONTRATO_EDIT', 'Editar Contrato CP', 'Permite editar contratos', 'CP_CONTRATO', NOW()),
('CP_CONTRATO_LIQUIDATE', 'Liquidar Contrato CP', 'Permite liquidar contratos', 'CP_CONTRATO', NOW()),

-- Administración
('CP_CONFIG_MANAGE', 'Administrar Config CP', 'Permite administrar configuración de CP', 'CP_ADMIN', NOW()),
('CP_REPORTS_VIEW', 'Ver Reportes CP', 'Permite ver reportes de contratación pública', 'CP_REPORTS', NOW()),
('CP_AUDIT_VIEW', 'Ver Auditoría CP', 'Permite ver auditoría de procesos', 'CP_AUDIT', NOW());

-- Asignar permisos al rol ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' AND p.module LIKE 'CP_%';
