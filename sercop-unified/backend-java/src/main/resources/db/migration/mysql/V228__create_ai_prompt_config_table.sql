-- ============================================================================
-- AI Prompt Configuration Table
-- ============================================================================
-- Permite configurar y versionar los prompts de IA desde la base de datos
-- sin necesidad de deployments para cambios en los prompts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_prompt_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Identificador único del prompt (ej: 'swift_extraction_prompt', 'analysis_prompt')
    prompt_key VARCHAR(100) NOT NULL UNIQUE,

    -- Nombre descriptivo para mostrar en la UI
    display_name VARCHAR(255) NOT NULL,

    -- Descripción del propósito del prompt
    description TEXT,

    -- Categoría del prompt (EXTRACTION, ANALYSIS, ACTIONS, OTHER)
    category VARCHAR(50) NOT NULL DEFAULT 'OTHER',

    -- Idioma del prompt (es, en, all)
    language VARCHAR(10) NOT NULL DEFAULT 'all',

    -- Tipo de mensaje SWIFT al que aplica (MT700, MT760, ALL, etc.)
    message_type VARCHAR(20) DEFAULT 'ALL',

    -- El template del prompt (puede contener variables como {{messageType}}, {{language}})
    prompt_template LONGTEXT NOT NULL,

    -- Variables disponibles en el prompt (JSON array)
    available_variables JSON,

    -- Configuración adicional (JSON)
    config JSON,

    -- Versión del prompt para auditoría
    version INT NOT NULL DEFAULT 1,

    -- Estado activo/inactivo
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoría
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_prompt_key (prompt_key),
    INDEX idx_category (category),
    INDEX idx_message_type (message_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Tabla de historial de versiones de prompts
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_prompt_config_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prompt_config_id BIGINT NOT NULL,
    prompt_key VARCHAR(100) NOT NULL,
    version INT NOT NULL,
    prompt_template LONGTEXT NOT NULL,
    available_variables JSON,
    config JSON,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason VARCHAR(500),

    INDEX idx_prompt_config_id (prompt_config_id),
    INDEX idx_prompt_key_version (prompt_key, version),

    FOREIGN KEY (prompt_config_id) REFERENCES ai_prompt_config(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Insertar prompts iniciales
-- ============================================================================

-- Prompt principal de extracción SWIFT
INSERT IGNORE INTO ai_prompt_config (
    prompt_key,
    display_name,
    description,
    category,
    language,
    message_type,
    prompt_template,
    available_variables,
    config,
    created_by
) VALUES (
    'swift_extraction_main',
    'Extracción SWIFT - Prompt Principal',
    'Prompt principal para la extracción de campos SWIFT de documentos. Incluye instrucciones generales y formato de respuesta.',
    'EXTRACTION',
    'all',
    'ALL',
    'Eres un experto en mensajes SWIFT y cartas de crédito.
Analiza el documento y extrae campos para un mensaje {{messageType}}.

REGLAS:
1. El "value" DEBE tener el formato especificado (objeto o string)
2. Fechas en formato ISO: YYYY-MM-DD
3. Montos como string con punto decimal: "125750.00"
4. Monedas en ISO 4217: USD, EUR, etc.
5. Códigos BIC/SWIFT exactamente como aparecen

{{textareaInstructions}}

{{additionalAnalysisInstructions}}

FORMATO JSON:
{{responseFormat}}

CAMPOS {{messageType}}:
{{fieldSchema}}',
    '["messageType", "textareaInstructions", "additionalAnalysisInstructions", "responseFormat", "fieldSchema"]',
    '{"maxTokens": 4000, "temperature": 0.1}',
    'system'
);

-- Prompt de análisis adicional
INSERT IGNORE INTO ai_prompt_config (
    prompt_key,
    display_name,
    description,
    category,
    language,
    message_type,
    prompt_template,
    available_variables,
    config,
    created_by
) VALUES (
    'additional_analysis_es',
    'Análisis Adicional (Español)',
    'Instrucciones para el análisis adicional de documentos en español: resumen ejecutivo, discrepancias, compliance, calidad de datos, etc.',
    'ANALYSIS',
    'es',
    'ALL',
    '=== ANÁLISIS ADICIONAL (OBLIGATORIO) ===
Además de los campos SWIFT, proporciona el siguiente análisis completo:

1. RESUMEN EJECUTIVO (executiveSummary):
   - summary: Resumen del documento en 2-3 oraciones claras y concisas
   - documentType: Tipo de documento detectado (MT700, MT760, Invoice, BL, etc.)
   - detectedLanguage: Idioma principal del documento (es, en, fr, etc.)
   - overallConfidence: Confianza general de la extracción (0-100)
   - keyPoints: Array de 3-5 puntos clave del documento

2. ANÁLISIS DE DISCREPANCIAS (discrepancyAnalysis):
   - hasDiscrepancies: true/false si hay inconsistencias
   - discrepancies: Array de discrepancias encontradas
   - totalCount: Número total de discrepancias
   - highSeverityCount: Número de discrepancias de alta severidad

3. ALERTAS DE COMPLIANCE (complianceAnalysis):
   - requiresReview: true/false si requiere revisión de compliance
   - alerts: Array de alertas con type, severity, entity, reason, action
   - countriesOfConcern: Array de países que podrían requerir revisión
   - suggestedScreenings: Array de verificaciones sugeridas

4. CALIDAD DE DATOS (dataQualityAnalysis):
   - completenessScore: Porcentaje de campos completados (0-100)
   - totalFields: Número total de campos esperados
   - populatedFields: Número de campos con valor
   - missingRequired: Array de campos requeridos faltantes
   - invalidFormats: Array de campos con formato inválido
   - warnings: Array de advertencias generales

5. DOCUMENTOS REQUERIDOS (documentsAnalysis):
   - Lista de documentos mencionados
   - Para cada documento: tipo, cantidad de originales/copias, observaciones

6. ANÁLISIS DE RIESGO (riskAnalysis):
   - Nivel de riesgo general (LOW/MEDIUM/HIGH) con JUSTIFICACIÓN
   - Países mencionados y su nivel de riesgo
   - Términos inusuales detectados
   - Alertas identificadas

7. PARTES INVOLUCRADAS (partiesAnalysis):
   - Ordenante/Applicant: nombre, país, tipo, estado de validación
   - Beneficiario: nombre, país, tipo, estado de validación
   - Bancos: nombre, BIC, rol, estado del BIC

8. CLASIFICACIÓN DE MERCANCÍAS (goodsAnalysis):
   - Descripción resumida de la mercancía
   - Código HS sugerido
   - Categoría general
   - Alertas si es mercancía restringida

9. ANÁLISIS DE FECHAS Y PLAZOS (datesAnalysis):
   - Fecha de emisión, vencimiento
   - Período de presentación
   - Última fecha de embarque
   - Días hasta vencimiento
   - Alertas si los plazos son muy cortos',
    '[]',
    '{}',
    'system'
);

-- Prompt de acciones recomendadas
INSERT IGNORE INTO ai_prompt_config (
    prompt_key,
    display_name,
    description,
    category,
    language,
    message_type,
    prompt_template,
    available_variables,
    config,
    created_by
) VALUES (
    'recommended_actions_es',
    'Acciones Recomendadas (Español)',
    'Instrucciones para generar acciones recomendadas incluyendo mensajes SWIFT a enviar/recibir.',
    'ACTIONS',
    'es',
    'ALL',
    '10. ACCIONES RECOMENDADAS (recommendedActionsAnalysis):
   - summary: Resumen breve de las acciones pendientes
   - totalActions: Número total de acciones
   - highPriorityCount: Número de acciones urgentes
   - nextDeadline: Fecha del próximo vencimiento (formato YYYY-MM-DD)
   - nextDeadlineDays: Días hasta el próximo vencimiento
   - actions: Array de acciones recomendadas, cada una con:
     * id: Identificador único (ej: "action_1")
     * description: Descripción clara de la acción a realizar
     * dueDate: Fecha límite sugerida (YYYY-MM-DD)
     * dueDays: Días hasta la fecha límite
     * priority: HIGH/MEDIUM/LOW
     * responsible: Área o rol responsable
     * type: VERIFICATION/DOCUMENT/COMMUNICATION/REVIEW/APPROVAL/SHIPMENT/PAYMENT/SWIFT_MESSAGE/OTHER
     * status: PENDING
     * relatedField: Campo SWIFT relacionado (opcional)
     * notes: Notas adicionales (opcional)
     * swiftMessage: (solo para type=SWIFT_MESSAGE) objeto con messageType, direction, purpose, parties

   IMPORTANTE para acciones:
   - HIGH: Acciones que deben completarse en los próximos 3 días
   - MEDIUM: Acciones para los próximos 7 días
   - LOW: Acciones sin urgencia inmediata

   MENSAJES SWIFT EN ACCIONES:
   Para type=SWIFT_MESSAGE incluir swiftMessage con:
   - messageType: MT700, MT707, MT710, MT720, MT730, MT732, MT734, MT740, MT742, MT747, MT752, MT754, MT756, MT760, MT767, MT768, MT769, MT799
   - direction: SEND/RECEIVE/BOTH
   - purpose: Propósito específico
   - parties: Array de partes (Issuing Bank, Advising Bank, Confirming Bank, etc.)

   Flujos SWIFT típicos:
   - LC Import: MT700→MT730→MT734→MT732→MT756
   - LC Export: MT710→MT720→MT740
   - Garantías: MT760→MT767→MT769
   - Comunicaciones: MT799',
    '[]',
    '{"swiftFlows": {"LC_IMPORT": ["MT700","MT730","MT734","MT732","MT756"], "LC_EXPORT": ["MT710","MT720","MT740"], "GUARANTEE": ["MT760","MT767","MT769"]}}',
    'system'
);

-- Prompt de formato de respuesta JSON
INSERT IGNORE INTO ai_prompt_config (
    prompt_key,
    display_name,
    description,
    category,
    language,
    message_type,
    prompt_template,
    available_variables,
    config,
    created_by
) VALUES (
    'response_format_json',
    'Formato de Respuesta JSON',
    'Template del formato JSON esperado en la respuesta de la IA.',
    'EXTRACTION',
    'all',
    'ALL',
    '{
  "fields": [
    {
      "fieldCode": "{{exampleFieldCode}}",
      "value": "...",
      "confidence": 0.95,
      "evidence": "texto del documento"
    }
  ],
  "additionalAnalysis": {
    "executiveSummary": {
      "summary": "Resumen conciso del documento",
      "documentType": "MT700|MT760|Invoice|BL",
      "detectedLanguage": "es|en|fr",
      "overallConfidence": 85,
      "keyPoints": ["Punto 1", "Punto 2", "Punto 3"]
    },
    "discrepancyAnalysis": {
      "hasDiscrepancies": false,
      "discrepancies": [],
      "totalCount": 0,
      "highSeverityCount": 0
    },
    "complianceAnalysis": {
      "requiresReview": false,
      "alerts": [],
      "countriesOfConcern": [],
      "suggestedScreenings": []
    },
    "dataQualityAnalysis": {
      "completenessScore": 87,
      "totalFields": 25,
      "populatedFields": 22,
      "missingRequired": [],
      "invalidFormats": [],
      "warnings": []
    },
    "documentsAnalysis": {
      "documents": [],
      "totalDocuments": 0,
      "missingCommon": []
    },
    "riskAnalysis": {
      "overallRisk": "LOW|MEDIUM|HIGH",
      "riskReason": "Justificación",
      "countries": [],
      "alerts": [],
      "unusualTerms": []
    },
    "partiesAnalysis": {
      "applicant": {"name": "", "country": "", "type": "COMPANY", "status": "VALID"},
      "beneficiary": {"name": "", "country": "", "type": "COMPANY", "status": "VALID"},
      "banks": []
    },
    "goodsAnalysis": {
      "description": "",
      "suggestedHSCode": "",
      "category": "",
      "isRestricted": false,
      "alerts": []
    },
    "datesAnalysis": {
      "issueDate": "",
      "expiryDate": "",
      "presentationPeriod": "",
      "latestShipmentDate": "",
      "daysUntilExpiry": 0,
      "alerts": []
    },
    "recommendedActionsAnalysis": {
      "summary": "",
      "totalActions": 0,
      "highPriorityCount": 0,
      "nextDeadline": "",
      "nextDeadlineDays": 0,
      "actions": []
    }
  }
}',
    '["exampleFieldCode"]',
    '{}',
    'system'
);

-- Agregar permisos para la gestión de prompts (usando permission_read_model)
INSERT IGNORE INTO permission_read_model (code, name, description, module, created_at)
VALUES
    ('AI_PROMPT_VIEW', 'Ver Configuración de Prompts IA', 'Permite ver la configuración de prompts de IA', 'AI_CONFIG', NOW()),
    ('AI_PROMPT_EDIT', 'Editar Configuración de Prompts IA', 'Permite editar la configuración de prompts de IA', 'AI_CONFIG', NOW()),
    ('AI_PROMPT_CREATE', 'Crear Prompts IA', 'Permite crear nuevos prompts de IA', 'AI_CONFIG', NOW()),
    ('AI_PROMPT_DELETE', 'Eliminar Prompts IA', 'Permite eliminar prompts de IA', 'AI_CONFIG', NOW());

-- ============================================================================
-- Agregar ítem de menú para Configuración de Prompts IA
-- ============================================================================

-- Primero verificar si existe la sección ADMIN
INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ADMIN_AI_PROMPTS', id, 'menu.admin.aiPrompts', 'MessageSquare', '/admin/ai-prompts', 95, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN';

-- Si no existe SECTION_ADMIN, agregar bajo SECTION_CATALOGS
INSERT IGNORE INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ADMIN_AI_PROMPTS', id, 'menu.admin.aiPrompts', 'MessageSquare', '/admin/ai-prompts', 95, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'ADMIN_AI_PROMPTS');

-- Agregar permiso al menú
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'AI_PROMPT_VIEW' FROM menu_item WHERE code = 'ADMIN_AI_PROMPTS';

-- Asignar permiso de ver al rol ADMIN en read model
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'AI_PROMPT_VIEW' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'AI_PROMPT_EDIT' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'AI_PROMPT_CREATE' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'AI_PROMPT_DELETE' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';
