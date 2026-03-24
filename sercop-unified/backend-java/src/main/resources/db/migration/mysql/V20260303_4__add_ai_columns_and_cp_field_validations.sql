-- ============================================================================
-- ADD AI COLUMNS + COMPREHENSIVE VALIDATIONS + AI PROMPTS FOR CP FIELDS
-- ============================================================================
-- 1. Add ai_enabled, ai_help_prompt, ai_validation_prompt columns
-- 2. Update ALL CP fields with validation_rules and contextual_alerts
-- 3. Add AI prompts per field for contextual assistance
-- 4. Add missing fields for all stages of all process types
-- ============================================================================

-- ============================================================================
-- 0. ADD AI COLUMNS TO swift_field_config_readmodel
-- ============================================================================
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'ai_enabled');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN ai_enabled TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'ai_help_prompt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN ai_help_prompt TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'ai_validation_prompt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN ai_validation_prompt TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 1. UPDATE EXISTING CP FIELDS - Add validations and AI prompts
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 CP_OBJETO (Objeto de Contratación) - ALL process types
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  validation_rules = JSON_OBJECT(
    'required', TRUE,
    'minLength', 50,
    'maxLength', 2000,
    'patternMessage', 'El objeto de contratación debe ser claro, preciso y tener al menos 50 caracteres'
  ),
  contextual_alerts = JSON_ARRAY(
    JSON_OBJECT(
      'showWhen', JSON_OBJECT('field', ':CP_OBJETO:', 'condition', 'NOT_EMPTY'),
      'alertType', 'info',
      'title', 'Art. 22 LOSNCP',
      'message', 'El objeto debe ser claro, sin ambigüedades y alineado con el PAA.'
    )
  ),
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en contratación pública ecuatoriana. El usuario necesita ayuda para redactar el OBJETO DE CONTRATACIÓN. Debes:\n1. Verificar que sea claro, preciso y completo según Art. 22 LOSNCP\n2. Que no sea genérico ni ambiguo\n3. Que especifique el bien, servicio u obra a contratar\n4. Que esté alineado con la necesidad institucional\n5. Sugerir mejoras de redacción si es necesario\n6. Verificar que no incluya marcas específicas (Art. 23 LOSNCP) salvo excepciones justificadas\nResponde en español con recomendaciones concretas.',
  ai_validation_prompt = 'Valida el siguiente objeto de contratación según la LOSNCP ecuatoriana. Verifica: 1) Claridad y precisión, 2) No menciona marcas (Art. 23), 3) Es suficientemente descriptivo, 4) Está alineado con principios de contratación pública. Valor a validar: '
WHERE field_code = ':CP_OBJETO:' AND message_type LIKE 'CP_%';

-- ---------------------------------------------------------------------------
-- 1.2 CP_CPC (Código CPC)
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  validation_rules = JSON_OBJECT(
    'required', TRUE,
    'pattern', '^[0-9]{2,10}$',
    'patternMessage', 'Ingrese un código CPC válido (solo dígitos, 2-10 caracteres)',
    'minLength', 2,
    'maxLength', 10
  ),
  contextual_alerts = JSON_ARRAY(
    JSON_OBJECT(
      'showWhen', JSON_OBJECT('field', ':CP_CPC:', 'condition', 'NOT_EMPTY'),
      'alertType', 'info',
      'title', 'Clasificador CPC',
      'message', 'Use el Clasificador Central de Productos del SERCOP vigente.'
    )
  ),
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en contratación pública ecuatoriana. El usuario necesita ayuda con el CÓDIGO CPC (Clasificador Central de Productos). Debes:\n1. Explicar la estructura del CPC (nivel 1-5)\n2. Ayudar a identificar el código correcto según la descripción del bien/servicio\n3. Verificar coherencia entre el código CPC y el objeto de contratación\n4. Indicar si el código corresponde a bien normalizado o no normalizado\n5. Recomendar el nivel de detalle apropiado\nResponde en español.',
  ai_validation_prompt = 'Valida el código CPC para contratación pública ecuatoriana. Verifica: 1) Formato correcto (dígitos), 2) Nivel de detalle apropiado, 3) Coherencia con el objeto de contratación. Código CPC: '
WHERE field_code = ':CP_CPC:' AND message_type LIKE 'CP_%';

-- ---------------------------------------------------------------------------
-- 1.3 CP_PRESUPUESTO (Presupuesto Referencial)
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  validation_rules = JSON_OBJECT(
    'required', TRUE,
    'min', 0.01,
    'maxDecimals', 2,
    'currency', 'USD',
    'errorMessage', 'El presupuesto referencial debe ser mayor a $0.01'
  ),
  contextual_alerts = JSON_ARRAY(
    JSON_OBJECT(
      'showWhen', JSON_OBJECT('field', ':CP_PRESUPUESTO:', 'condition', 'GREATER_THAN', 'value', 0),
      'alertType', 'warning',
      'title', 'Art. 23 LOSNCP - Presupuesto Referencial',
      'message', 'El presupuesto referencial debe estar actualizado al momento de la convocatoria. Determine el tipo de proceso según los montos vigentes del SERCOP.'
    )
  ),
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en contratación pública ecuatoriana. El usuario necesita ayuda con el PRESUPUESTO REFERENCIAL. Debes:\n1. Explicar cómo se determina según Art. 23 LOSNCP\n2. Indicar los rangos de montos para cada tipo de proceso (Ínfima Cuantía, Menor Cuantía, Cotización, Licitación, Subasta Inversa)\n3. Verificar que el monto sea coherente con el tipo de proceso seleccionado\n4. Recomendar si debe incluir IVA o no\n5. Indicar la necesidad de estudio de mercado con al menos 3 proformas\n6. Mencionar los coeficientes vigentes del presupuesto inicial del Estado\nResponde en español con montos de referencia actualizados.',
  ai_validation_prompt = 'Valida el presupuesto referencial para contratación pública ecuatoriana. Verifica: 1) Monto positivo, 2) Coherencia con el tipo de proceso, 3) Cumple rangos SERCOP vigentes. Monto: '
WHERE field_code = ':CP_PRESUPUESTO:' AND message_type LIKE 'CP_%';

-- ---------------------------------------------------------------------------
-- 1.4 CP_CERT_PRESUP (Certificación Presupuestaria)
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  validation_rules = JSON_OBJECT(
    'required', TRUE,
    'minLength', 3,
    'maxLength', 50,
    'patternMessage', 'Ingrese el número de certificación presupuestaria'
  ),
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en contratación pública ecuatoriana. El usuario necesita ayuda con la CERTIFICACIÓN PRESUPUESTARIA. Debes:\n1. Explicar que es requisito obligatorio según Art. 24 LOSNCP\n2. Que debe ser emitida por el Director Financiero o equivalente\n3. Que certifica la existencia y disponibilidad de recursos\n4. Que debe estar vigente al momento de la convocatoria\n5. Que la partida presupuestaria debe corresponder al objeto de contratación\nResponde en español.',
  ai_validation_prompt = 'Valida el número de certificación presupuestaria. Verifica formato y que no esté vacío. Valor: '
WHERE field_code = ':CP_CERT_PRESUP:' AND message_type LIKE 'CP_%';

-- ---------------------------------------------------------------------------
-- 1.5 CP_PARTIDA (Partida Presupuestaria)
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  validation_rules = JSON_OBJECT(
    'required', TRUE,
    'minLength', 5,
    'maxLength', 30,
    'pattern', '^[0-9\\.\\-]+$',
    'patternMessage', 'Formato de partida presupuestaria: números separados por puntos (ej: 53.08.01)'
  ),
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en presupuesto público ecuatoriano. El usuario necesita ayuda con la PARTIDA PRESUPUESTARIA. Debes:\n1. Explicar la estructura del clasificador presupuestario de gastos\n2. Grupo 53: Bienes y Servicios de Consumo\n3. Grupo 73: Bienes y Servicios para Inversión\n4. Grupo 84: Bienes de Larga Duración\n5. Ayudar a identificar la partida correcta según el objeto de contratación\n6. Indicar que debe coincidir con la certificación presupuestaria\nResponde en español.',
  ai_validation_prompt = 'Valida la partida presupuestaria según el clasificador presupuestario ecuatoriano. Verifica formato y coherencia. Valor: '
WHERE field_code = ':CP_PARTIDA:' AND message_type LIKE 'CP_%';

-- ---------------------------------------------------------------------------
-- 1.6 CP_FUENTE_FINANC (Fuente de Financiamiento)
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  validation_rules = JSON_OBJECT(
    'required', TRUE,
    'minLength', 3,
    'maxLength', 100
  ),
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en finanzas públicas ecuatorianas. El usuario necesita ayuda con la FUENTE DE FINANCIAMIENTO. Debes:\n1. Explicar las fuentes: Recursos Fiscales, Recursos de Autogestión, Preasignaciones, Créditos Internos/Externos\n2. Que debe coincidir con la certificación presupuestaria\n3. Que determina restricciones adicionales de uso\nResponde en español.',
  ai_validation_prompt = 'Valida la fuente de financiamiento para contratación pública ecuatoriana. Valor: '
WHERE field_code = ':CP_FUENTE_FINANC:' AND message_type LIKE 'CP_%';

-- ---------------------------------------------------------------------------
-- 1.7 CP_RESOLUCION_INICIO (Resolución de Inicio)
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  validation_rules = JSON_OBJECT(
    'required', TRUE,
    'minLength', 3,
    'maxLength', 50
  ),
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en contratación pública ecuatoriana. El usuario necesita ayuda con la RESOLUCIÓN DE INICIO. Debes:\n1. Explicar que según Art. 22 LOSNCP la máxima autoridad o su delegado aprueba los pliegos e inicia el proceso\n2. Contenido mínimo de la resolución\n3. Que debe estar motivada conforme al Art. 76 de la Constitución\n4. Que autoriza el gasto y designa la comisión técnica (si aplica)\n5. Que debe publicarse en el portal SERCOP\nResponde en español.',
  ai_validation_prompt = 'Valida el número de resolución de inicio del proceso de contratación. Valor: '
WHERE field_code = ':CP_RESOLUCION_INICIO:' AND message_type LIKE 'CP_%';

-- ============================================================================
-- 2. ADD MISSING STAGE-SPECIFIC FIELDS FOR ALL PROCESS TYPES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 CONVOCATORIA fields (for SIE, CDC, MC, LP, RE, FI)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO swift_field_config_readmodel
  (id, field_code, field_name_key, message_type, section, display_order, is_required, is_active,
   field_type, component_type, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt,
   help_text_key, created_at)
VALUES
-- SIE - Convocatoria additional fields
(UUID(), ':CP_PLAZO_OFERTAS:', 'Plazo para Presentación de Ofertas (días)', 'CP_SUBASTA_INVERSA', 'CONVOCATORIA', 5, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 5, "max": 90, "errorMessage": "El plazo mínimo es 5 días según resoluciones SERCOP"}',
 TRUE, 'Eres un experto en contratación pública ecuatoriana. Ayuda con el PLAZO PARA PRESENTACIÓN DE OFERTAS en Subasta Inversa. Según Art. 47 LOSNCP y resoluciones SERCOP:\n1. Plazo mínimo para SIE: 7 días\n2. El plazo se cuenta desde la publicación\n3. Puede ampliarse por convalidación de errores\n4. Los días se cuentan como término (días hábiles)\nResponde en español.',
 'Valida el plazo para presentación de ofertas en Subasta Inversa. Mínimo 7 días según SERCOP. Valor: ',
 'Art. 47 LOSNCP: Plazo para presentación de ofertas', NOW()),

(UUID(), ':CP_COMISION_TECNICA:', 'Miembros Comisión Técnica', 'CP_SUBASTA_INVERSA', 'CONVOCATORIA', 6, TRUE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"required": true, "minLength": 10, "maxLength": 500, "maxLines": 10}',
 TRUE, 'Eres un experto en contratación pública ecuatoriana. Ayuda con la COMISIÓN TÉCNICA. Según Art. 18 RGLOSNCP:\n1. Se conforma para procesos de Cotización, Licitación, Subasta Inversa\n2. Integrada por: un profesional designado por la máxima autoridad (preside), el titular del área requirente, un profesional afín al objeto\n3. Actúa con 3 miembros\n4. Puede tener asesores sin voto\n5. La resolución de conformación debe ser previa a la convocatoria\nResponde en español.',
 'Valida la conformación de la comisión técnica según Art. 18 RGLOSNCP. Valor: ',
 'Art. 18 RGLOSNCP: Conformación de la Comisión Técnica', NOW()),

-- CDC - Convocatoria
(UUID(), ':CP_FECHA_PUBLICACION:', 'Fecha de Publicación', 'CP_COTIZACION', 'CONVOCATORIA', 1, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true, "dateFormat": "YYYY-MM-DD", "minDate": "today"}',
 TRUE, 'Ayuda con la FECHA DE PUBLICACIÓN de la convocatoria para Cotización. Art. 50 LOSNCP. La publicación inicia los plazos del proceso.',
 'Valida la fecha de publicación. Debe ser fecha actual o futura. Valor: ',
 'Fecha de publicación en el portal SERCOP', NOW()),

(UUID(), ':CP_PLAZO_OFERTAS:', 'Plazo para Presentación de Ofertas (días)', 'CP_COTIZACION', 'CONVOCATORIA', 2, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 7, "max": 90}',
 TRUE, 'Ayuda con el PLAZO DE OFERTAS para Cotización. Según resoluciones SERCOP: mínimo 10 días para cotización.',
 'Valida plazo de ofertas para Cotización. Valor: ',
 'Plazo mínimo según resoluciones SERCOP', NOW()),

(UUID(), ':CP_COMISION_TECNICA:', 'Miembros Comisión Técnica', 'CP_COTIZACION', 'CONVOCATORIA', 3, TRUE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"required": true, "minLength": 10, "maxLength": 500}',
 TRUE, 'Ayuda con la COMISIÓN TÉCNICA para Cotización. Art. 18 RGLOSNCP: Profesional designado (preside), titular del área requirente, profesional afín.',
 'Valida la comisión técnica según Art. 18 RGLOSNCP. Valor: ',
 'Art. 18 RGLOSNCP: Comisión Técnica', NOW()),

-- MC - Convocatoria
(UUID(), ':CP_FECHA_PUBLICACION:', 'Fecha de Publicación', 'CP_MENOR_CUANTIA', 'CONVOCATORIA', 1, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true, "dateFormat": "YYYY-MM-DD"}',
 TRUE, 'Ayuda con la FECHA DE PUBLICACIÓN para Menor Cuantía. Art. 51 LOSNCP.',
 'Valida fecha de publicación. Valor: ',
 'Fecha de publicación en el portal SERCOP', NOW()),

(UUID(), ':CP_PLAZO_OFERTAS:', 'Plazo para Presentación de Ofertas (días)', 'CP_MENOR_CUANTIA', 'CONVOCATORIA', 2, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 5, "max": 30}',
 TRUE, 'Ayuda con el PLAZO DE OFERTAS para Menor Cuantía. Plazo mínimo 5 días.',
 'Valida plazo de ofertas para Menor Cuantía. Valor: ',
 'Plazo según resoluciones SERCOP', NOW()),

-- LP - Convocatoria
(UUID(), ':CP_FECHA_PUBLICACION:', 'Fecha de Publicación', 'CP_LICITACION', 'CONVOCATORIA', 1, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true, "dateFormat": "YYYY-MM-DD"}',
 TRUE, 'Ayuda con la FECHA DE PUBLICACIÓN para Licitación. Art. 48 LOSNCP.',
 'Valida fecha de publicación. Valor: ',
 'Fecha de publicación en el portal SERCOP', NOW()),

(UUID(), ':CP_PLAZO_OFERTAS:', 'Plazo para Presentación de Ofertas (días)', 'CP_LICITACION', 'CONVOCATORIA', 2, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 22, "max": 120}',
 TRUE, 'Ayuda con el PLAZO DE OFERTAS para Licitación. Según LOSNCP Art. 48: mínimo 22 días para licitación.',
 'Valida plazo de ofertas para Licitación. Mínimo 22 días. Valor: ',
 'Art. 48 LOSNCP: Plazo mínimo de presentación', NOW()),

(UUID(), ':CP_COMISION_TECNICA:', 'Miembros Comisión Técnica', 'CP_LICITACION', 'CONVOCATORIA', 3, TRUE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"required": true, "minLength": 10, "maxLength": 500}',
 TRUE, 'Ayuda con la COMISIÓN TÉCNICA para Licitación. Art. 18 RGLOSNCP.',
 'Valida la comisión técnica. Valor: ',
 'Art. 18 RGLOSNCP: Comisión Técnica obligatoria para Licitación', NOW()),

-- RE - Convocatoria
(UUID(), ':CP_FECHA_PUBLICACION:', 'Fecha de Publicación', 'CP_REGIMEN_ESPECIAL', 'CONVOCATORIA', 1, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true, "dateFormat": "YYYY-MM-DD"}',
 TRUE, 'Ayuda con la FECHA DE PUBLICACIÓN para Régimen Especial. Art. 2 LOSNCP.',
 'Valida fecha de publicación. Valor: ',
 'Fecha de publicación', NOW()),

-- FI - Convocatoria
(UUID(), ':CP_FECHA_PUBLICACION:', 'Fecha de Publicación', 'CP_FERIA_INCLUSIVA', 'CONVOCATORIA', 1, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true, "dateFormat": "YYYY-MM-DD"}',
 TRUE, 'Ayuda con la FECHA DE PUBLICACIÓN para Feria Inclusiva.',
 'Valida fecha de publicación. Valor: ',
 'Fecha de publicación en el portal SERCOP', NOW()),

(UUID(), ':CP_PLAZO_OFERTAS:', 'Plazo para Presentación de Ofertas (días)', 'CP_FERIA_INCLUSIVA', 'CONVOCATORIA', 2, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 3, "max": 30}',
 TRUE, 'Ayuda con el PLAZO DE OFERTAS para Feria Inclusiva.',
 'Valida plazo de ofertas. Valor: ',
 'Plazo según resoluciones SERCOP', NOW());

-- ---------------------------------------------------------------------------
-- 2.2 EVALUACION / CALIFICACION fields
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO swift_field_config_readmodel
  (id, field_code, field_name_key, message_type, section, display_order, is_required, is_active,
   field_type, component_type, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt,
   help_text_key, created_at)
VALUES
-- SIE - Calificación additional
(UUID(), ':CP_CRITERIO_EVALUACION:', 'Criterios de Evaluación', 'CP_SUBASTA_INVERSA', 'CALIFICACION', 4, TRUE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"required": true, "minLength": 20, "maxLength": 2000}',
 TRUE, 'Eres un experto en contratación pública ecuatoriana. Ayuda con los CRITERIOS DE EVALUACIÓN para Subasta Inversa. Según Art. 47 LOSNCP:\n1. La calificación es de cumplimiento (cumple/no cumple) para la parte técnica\n2. No se evalúa oferta económica en esta fase (se define en puja)\n3. Verificar: experiencia, capacidad técnica, situación financiera\n4. Parámetros deben ser objetivos y no discriminatorios\n5. Deben constar en los pliegos\nResponde en español.',
 'Valida los criterios de evaluación según Art. 47 LOSNCP. Valor: ',
 'Art. 47 LOSNCP: Criterios de calificación técnica', NOW()),

(UUID(), ':CP_NUM_OFERTAS_RECIBIDAS:', 'Número de Ofertas Recibidas', 'CP_SUBASTA_INVERSA', 'CALIFICACION', 5, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 0, "max": 999}',
 TRUE, 'Ayuda con el NÚMERO DE OFERTAS RECIBIDAS en Subasta Inversa. Si hay menos de 2 oferentes calificados, se puede declarar desierto o negociar con el único oferente calificado.',
 'Valida el número de ofertas. Si es 0, el proceso debe declararse desierto. Valor: ',
 'Número total de ofertas recibidas', NOW()),

-- CDC - Evaluación
(UUID(), ':CP_CRITERIO_EVALUACION:', 'Criterios de Evaluación', 'CP_COTIZACION', 'EVALUACION', 1, TRUE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"required": true, "minLength": 20, "maxLength": 2000}',
 TRUE, 'Ayuda con los CRITERIOS DE EVALUACIÓN para Cotización. Art. 50 LOSNCP: Se evalúa oferta técnica y económica. Parámetros de calificación según pliegos.',
 'Valida criterios de evaluación para Cotización. Valor: ',
 'Art. 50 LOSNCP: Parámetros de calificación', NOW()),

(UUID(), ':CP_NUM_OFERTAS_RECIBIDAS:', 'Número de Ofertas Recibidas', 'CP_COTIZACION', 'EVALUACION', 2, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 0, "max": 999}',
 TRUE, 'Ayuda con ofertas recibidas en Cotización.',
 'Valida número de ofertas. Valor: ',
 'Número total de ofertas recibidas', NOW()),

-- MC - Evaluación
(UUID(), ':CP_CRITERIO_EVALUACION:', 'Criterios de Evaluación', 'CP_MENOR_CUANTIA', 'EVALUACION', 1, TRUE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"required": true, "minLength": 20, "maxLength": 2000}',
 TRUE, 'Ayuda con CRITERIOS DE EVALUACIÓN para Menor Cuantía. Art. 51 LOSNCP: Se selecciona al proveedor por sorteo entre los que cumplan requisitos técnicos.',
 'Valida criterios. Valor: ',
 'Art. 51 LOSNCP: Selección por sorteo', NOW()),

-- LP - Evaluación
(UUID(), ':CP_CRITERIO_EVALUACION:', 'Criterios de Evaluación', 'CP_LICITACION', 'EVALUACION', 1, TRUE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"required": true, "minLength": 20, "maxLength": 2000}',
 TRUE, 'Ayuda con CRITERIOS DE EVALUACIÓN para Licitación. Art. 48 LOSNCP: Evaluación integral técnica-económica con puntaje.',
 'Valida criterios de evaluación para Licitación. Valor: ',
 'Art. 48 LOSNCP: Evaluación técnica-económica', NOW()),

(UUID(), ':CP_NUM_OFERTAS_RECIBIDAS:', 'Número de Ofertas Recibidas', 'CP_LICITACION', 'EVALUACION', 2, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 0, "max": 999}',
 TRUE, 'Ayuda con ofertas recibidas en Licitación.',
 'Valida número de ofertas. Valor: ',
 'Número de ofertas recibidas', NOW());

-- ---------------------------------------------------------------------------
-- 2.3 ADJUDICACION fields (for all process types that have it)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO swift_field_config_readmodel
  (id, field_code, field_name_key, message_type, section, display_order, is_required, is_active,
   field_type, component_type, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt,
   help_text_key, created_at)
VALUES
-- CDC - Adjudicación
(UUID(), ':CP_ADJUDICATARIO_RUC:', 'RUC Adjudicatario', 'CP_COTIZACION', 'ADJUDICACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "pattern": "^[0-9]{13}$", "patternMessage": "El RUC debe tener 13 dígitos"}',
 TRUE, 'Ayuda con el RUC del ADJUDICATARIO. Debe ser un RUC válido de 13 dígitos, registrado en el SERCOP como proveedor habilitado.',
 'Valida el RUC del adjudicatario. Debe ser 13 dígitos y estar registrado. Valor: ',
 'RUC del proveedor adjudicado', NOW()),

(UUID(), ':CP_ADJUDICATARIO_NOMBRE:', 'Nombre/Razón Social Adjudicatario', 'CP_COTIZACION', 'ADJUDICACION', 2, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 5, "maxLength": 200}',
 TRUE, 'Ayuda con el nombre del adjudicatario.',
 'Valida nombre del adjudicatario. Valor: ',
 'Nombre o razón social del proveedor adjudicado', NOW()),

(UUID(), ':CP_MONTO_ADJUDICADO:', 'Monto Adjudicado (USD)', 'CP_COTIZACION', 'ADJUDICACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2, "currency": "USD"}',
 TRUE, 'Ayuda con el MONTO ADJUDICADO. Según Art. 32 LOSNCP: La máxima autoridad adjudicará mediante resolución motivada. El monto no puede exceder el presupuesto referencial.',
 'Valida el monto adjudicado. No debe exceder presupuesto referencial. Valor: ',
 'Art. 32 LOSNCP: Monto de adjudicación', NOW()),

(UUID(), ':CP_RESOLUCION_ADJUDICACION:', 'No. Resolución de Adjudicación', 'CP_COTIZACION', 'ADJUDICACION', 4, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con la RESOLUCIÓN DE ADJUDICACIÓN. Art. 32 LOSNCP: Debe ser motivada, firmada por la máxima autoridad o su delegado.',
 'Valida número de resolución de adjudicación. Valor: ',
 'Art. 32 LOSNCP: Resolución motivada de adjudicación', NOW()),

-- MC - Adjudicación
(UUID(), ':CP_ADJUDICATARIO_RUC:', 'RUC Adjudicatario', 'CP_MENOR_CUANTIA', 'ADJUDICACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "pattern": "^[0-9]{13}$", "patternMessage": "El RUC debe tener 13 dígitos"}',
 TRUE, 'Ayuda con el RUC del adjudicatario para Menor Cuantía.',
 'Valida RUC. Valor: ',
 'RUC del proveedor adjudicado', NOW()),

(UUID(), ':CP_ADJUDICATARIO_NOMBRE:', 'Nombre/Razón Social Adjudicatario', 'CP_MENOR_CUANTIA', 'ADJUDICACION', 2, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 5, "maxLength": 200}',
 TRUE, 'Ayuda con nombre del adjudicatario.',
 'Valida nombre. Valor: ',
 'Nombre o razón social', NOW()),

(UUID(), ':CP_MONTO_ADJUDICADO:', 'Monto Adjudicado (USD)', 'CP_MENOR_CUANTIA', 'ADJUDICACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto adjudicado para Menor Cuantía.',
 'Valida monto. Valor: ',
 'Monto de adjudicación', NOW()),

(UUID(), ':CP_RESOLUCION_ADJUDICACION:', 'No. Resolución de Adjudicación', 'CP_MENOR_CUANTIA', 'ADJUDICACION', 4, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con resolución de adjudicación para Menor Cuantía.',
 'Valida resolución. Valor: ',
 'Resolución de adjudicación', NOW()),

-- LP - Adjudicación
(UUID(), ':CP_ADJUDICATARIO_RUC:', 'RUC Adjudicatario', 'CP_LICITACION', 'ADJUDICACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "pattern": "^[0-9]{13}$", "patternMessage": "El RUC debe tener 13 dígitos"}',
 TRUE, 'Ayuda con RUC del adjudicatario para Licitación.',
 'Valida RUC. Valor: ',
 'RUC del proveedor adjudicado', NOW()),

(UUID(), ':CP_ADJUDICATARIO_NOMBRE:', 'Nombre/Razón Social Adjudicatario', 'CP_LICITACION', 'ADJUDICACION', 2, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 5, "maxLength": 200}',
 TRUE, 'Ayuda con nombre del adjudicatario para Licitación.',
 'Valida nombre. Valor: ',
 'Nombre o razón social', NOW()),

(UUID(), ':CP_MONTO_ADJUDICADO:', 'Monto Adjudicado (USD)', 'CP_LICITACION', 'ADJUDICACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto adjudicado para Licitación. Art. 32 LOSNCP.',
 'Valida monto adjudicado. Valor: ',
 'Monto de adjudicación', NOW()),

(UUID(), ':CP_RESOLUCION_ADJUDICACION:', 'No. Resolución de Adjudicación', 'CP_LICITACION', 'ADJUDICACION', 4, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con resolución de adjudicación para Licitación.',
 'Valida resolución. Valor: ',
 'Art. 32 LOSNCP: Resolución de adjudicación', NOW()),

-- RE - Adjudicación
(UUID(), ':CP_ADJUDICATARIO_RUC:', 'RUC Adjudicatario', 'CP_REGIMEN_ESPECIAL', 'ADJUDICACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "pattern": "^[0-9]{13}$"}',
 TRUE, 'Ayuda con RUC del adjudicatario para Régimen Especial.',
 'Valida RUC. Valor: ',
 'RUC del proveedor', NOW()),

(UUID(), ':CP_ADJUDICATARIO_NOMBRE:', 'Nombre/Razón Social Adjudicatario', 'CP_REGIMEN_ESPECIAL', 'ADJUDICACION', 2, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 5, "maxLength": 200}',
 TRUE, 'Ayuda con nombre adjudicatario para Régimen Especial.',
 'Valida nombre. Valor: ',
 'Nombre o razón social', NOW()),

(UUID(), ':CP_MONTO_ADJUDICADO:', 'Monto Adjudicado (USD)', 'CP_REGIMEN_ESPECIAL', 'ADJUDICACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto adjudicado para Régimen Especial.',
 'Valida monto. Valor: ',
 'Monto de adjudicación', NOW()),

-- FI - Adjudicación
(UUID(), ':CP_ADJUDICATARIO_RUC:', 'RUC Adjudicatario', 'CP_FERIA_INCLUSIVA', 'ADJUDICACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "pattern": "^[0-9]{13}$"}',
 TRUE, 'Ayuda con RUC del adjudicatario para Feria Inclusiva. Verificar que sea actor de la Economía Popular y Solidaria.',
 'Valida RUC de actor EPS. Valor: ',
 'RUC del actor EPS adjudicado', NOW()),

(UUID(), ':CP_ADJUDICATARIO_NOMBRE:', 'Nombre/Razón Social Adjudicatario', 'CP_FERIA_INCLUSIVA', 'ADJUDICACION', 2, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 5, "maxLength": 200}',
 TRUE, 'Ayuda con nombre adjudicatario para Feria Inclusiva.',
 'Valida nombre. Valor: ',
 'Nombre del actor EPS', NOW()),

(UUID(), ':CP_MONTO_ADJUDICADO:', 'Monto Adjudicado (USD)', 'CP_FERIA_INCLUSIVA', 'ADJUDICACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto adjudicado para Feria Inclusiva.',
 'Valida monto. Valor: ',
 'Monto adjudicado', NOW());

-- ---------------------------------------------------------------------------
-- 2.4 CONTRATACION fields (for all process types)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO swift_field_config_readmodel
  (id, field_code, field_name_key, message_type, section, display_order, is_required, is_active,
   field_type, component_type, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt,
   help_text_key, created_at)
VALUES
-- CDC - Contratación
(UUID(), ':CP_NUMERO_CONTRATO:', 'Número de Contrato', 'CP_COTIZACION', 'CONTRATACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con el NÚMERO DE CONTRATO. Art. 68-69 LOSNCP: El contrato debe suscribirse dentro del plazo de 15 días desde la adjudicación. Debe contener: antecedentes, objeto, precio, plazo, garantías, multas.',
 'Valida número de contrato. Valor: ',
 'Art. 68-69 LOSNCP: Contrato administrativo', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'Fecha de Suscripción', 'CP_COTIZACION', 'CONTRATACION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true, "dateFormat": "YYYY-MM-DD"}',
 TRUE, 'Ayuda con la FECHA DE SUSCRIPCIÓN del contrato. Art. 69 LOSNCP: Dentro de 15 días desde la notificación de adjudicación.',
 'Valida fecha de contrato. Valor: ',
 'Fecha de suscripción del contrato', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'Monto del Contrato (USD)', 'CP_COTIZACION', 'CONTRATACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con el MONTO DEL CONTRATO. Debe coincidir o ser menor al monto adjudicado.',
 'Valida monto del contrato. Valor: ',
 'Monto contractual', NOW()),

(UUID(), ':CP_PLAZO_CONTRATO:', 'Plazo del Contrato (días)', 'CP_COTIZACION', 'CONTRATACION', 4, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 1, "max": 3650}',
 TRUE, 'Ayuda con el PLAZO DEL CONTRATO. Art. 70 LOSNCP: Debe ser coherente con el objeto y plazo planificado.',
 'Valida plazo del contrato. Valor: ',
 'Plazo de ejecución contractual', NOW()),

(UUID(), ':CP_GARANTIA_FIEL_CUMPLIMIENTO:', 'Garantía de Fiel Cumplimiento (%)', 'CP_COTIZACION', 'CONTRATACION', 5, TRUE, TRUE,
 'DECIMAL', 'PERCENTAGE',
 '{"required": true, "min": 5, "max": 5, "errorMessage": "La garantía de fiel cumplimiento es el 5% del monto del contrato"}',
 TRUE, 'Ayuda con la GARANTÍA DE FIEL CUMPLIMIENTO. Art. 74 LOSNCP: 5% del monto del contrato. Puede ser: garantía bancaria incondicional, póliza de seguros, primera hipoteca, efectivo. Excepciones para montos menores.',
 'Valida el porcentaje de garantía. Art. 74 LOSNCP: debe ser 5%. Valor: ',
 'Art. 74 LOSNCP: 5% del monto contractual', NOW()),

-- MC - Contratación
(UUID(), ':CP_NUMERO_CONTRATO:', 'Número de Contrato', 'CP_MENOR_CUANTIA', 'CONTRATACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con número de contrato para Menor Cuantía.',
 'Valida número de contrato. Valor: ',
 'Número de contrato', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'Fecha de Suscripción', 'CP_MENOR_CUANTIA', 'CONTRATACION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de contrato para Menor Cuantía.',
 'Valida fecha. Valor: ',
 'Fecha de suscripción', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'Monto del Contrato (USD)', 'CP_MENOR_CUANTIA', 'CONTRATACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto del contrato para Menor Cuantía.',
 'Valida monto. Valor: ',
 'Monto contractual', NOW()),

(UUID(), ':CP_PLAZO_CONTRATO:', 'Plazo del Contrato (días)', 'CP_MENOR_CUANTIA', 'CONTRATACION', 4, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 1, "max": 3650}',
 TRUE, 'Ayuda con plazo del contrato para Menor Cuantía.',
 'Valida plazo. Valor: ',
 'Plazo contractual', NOW()),

-- LP - Contratación
(UUID(), ':CP_NUMERO_CONTRATO:', 'Número de Contrato', 'CP_LICITACION', 'CONTRATACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con número de contrato para Licitación.',
 'Valida número. Valor: ',
 'Número de contrato', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'Fecha de Suscripción', 'CP_LICITACION', 'CONTRATACION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de contrato para Licitación.',
 'Valida fecha. Valor: ',
 'Fecha de suscripción', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'Monto del Contrato (USD)', 'CP_LICITACION', 'CONTRATACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto del contrato para Licitación.',
 'Valida monto. Valor: ',
 'Monto contractual', NOW()),

(UUID(), ':CP_PLAZO_CONTRATO:', 'Plazo del Contrato (días)', 'CP_LICITACION', 'CONTRATACION', 4, TRUE, TRUE,
 'NUMBER', 'NUMBER_INPUT',
 '{"required": true, "min": 1, "max": 3650}',
 TRUE, 'Ayuda con plazo del contrato para Licitación.',
 'Valida plazo. Valor: ',
 'Plazo contractual', NOW()),

(UUID(), ':CP_GARANTIA_FIEL_CUMPLIMIENTO:', 'Garantía de Fiel Cumplimiento (%)', 'CP_LICITACION', 'CONTRATACION', 5, TRUE, TRUE,
 'DECIMAL', 'PERCENTAGE',
 '{"required": true, "min": 5, "max": 5}',
 TRUE, 'Ayuda con garantía de fiel cumplimiento para Licitación. Art. 74 LOSNCP: 5% obligatorio.',
 'Valida garantía. Art. 74: 5%. Valor: ',
 'Art. 74 LOSNCP: 5% del monto contractual', NOW()),

-- RE - Contratación
(UUID(), ':CP_NUMERO_CONTRATO:', 'Número de Contrato', 'CP_REGIMEN_ESPECIAL', 'CONTRATACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con número de contrato para Régimen Especial.',
 'Valida número. Valor: ',
 'Número de contrato', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'Fecha de Suscripción', 'CP_REGIMEN_ESPECIAL', 'CONTRATACION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de contrato para Régimen Especial.',
 'Valida fecha. Valor: ',
 'Fecha de suscripción', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'Monto del Contrato (USD)', 'CP_REGIMEN_ESPECIAL', 'CONTRATACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto del contrato para Régimen Especial.',
 'Valida monto. Valor: ',
 'Monto contractual', NOW()),

-- FI - Contratación
(UUID(), ':CP_NUMERO_CONTRATO:', 'Número de Contrato', 'CP_FERIA_INCLUSIVA', 'CONTRATACION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con número de contrato para Feria Inclusiva.',
 'Valida número. Valor: ',
 'Número de contrato', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'Fecha de Suscripción', 'CP_FERIA_INCLUSIVA', 'CONTRATACION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de contrato para Feria Inclusiva.',
 'Valida fecha. Valor: ',
 'Fecha de suscripción', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'Monto del Contrato (USD)', 'CP_FERIA_INCLUSIVA', 'CONTRATACION', 3, TRUE, TRUE,
 'DECIMAL', 'NUMBER_INPUT',
 '{"required": true, "min": 0.01, "maxDecimals": 2}',
 TRUE, 'Ayuda con monto del contrato para Feria Inclusiva.',
 'Valida monto. Valor: ',
 'Monto contractual', NOW());

-- ---------------------------------------------------------------------------
-- 2.5 EJECUCION / RECEPCION fields (final stage for most processes)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO swift_field_config_readmodel
  (id, field_code, field_name_key, message_type, section, display_order, is_required, is_active,
   field_type, component_type, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt,
   help_text_key, created_at)
VALUES
-- CDC - Ejecución
(UUID(), ':CP_ACTA_RECEPCION:', 'No. Acta de Recepción', 'CP_COTIZACION', 'EJECUCION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con el ACTA DE RECEPCIÓN. Art. 81 LOSNCP: En contratos de bienes se designa comisión de recepción. Tipos: Recepción Provisional (si aplica) y Definitiva.',
 'Valida número de acta de recepción. Valor: ',
 'Art. 81 LOSNCP: Acta de entrega-recepción', NOW()),

(UUID(), ':CP_FECHA_RECEPCION:', 'Fecha de Recepción', 'CP_COTIZACION', 'EJECUCION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de recepción.',
 'Valida fecha. Valor: ',
 'Fecha del acta de recepción', NOW()),

(UUID(), ':CP_OBSERVACIONES_RECEPCION:', 'Observaciones de Recepción', 'CP_COTIZACION', 'EJECUCION', 3, FALSE, TRUE,
 'TEXT', 'TEXTAREA',
 '{"maxLength": 2000}',
 TRUE, 'Ayuda con observaciones de recepción. Si existen novedades, deben documentarse y notificarse al contratista.',
 'Valida observaciones. Valor: ',
 'Observaciones sobre la recepción', NOW()),

-- MC - Ejecución
(UUID(), ':CP_ACTA_RECEPCION:', 'No. Acta de Recepción', 'CP_MENOR_CUANTIA', 'EJECUCION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con acta de recepción para Menor Cuantía.',
 'Valida acta. Valor: ',
 'Acta de entrega-recepción', NOW()),

(UUID(), ':CP_FECHA_RECEPCION:', 'Fecha de Recepción', 'CP_MENOR_CUANTIA', 'EJECUCION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de recepción.',
 'Valida fecha. Valor: ',
 'Fecha de recepción', NOW()),

-- LP - Ejecución
(UUID(), ':CP_ACTA_RECEPCION:', 'No. Acta de Recepción', 'CP_LICITACION', 'EJECUCION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con acta de recepción para Licitación.',
 'Valida acta. Valor: ',
 'Acta de entrega-recepción', NOW()),

(UUID(), ':CP_FECHA_RECEPCION:', 'Fecha de Recepción', 'CP_LICITACION', 'EJECUCION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de recepción.',
 'Valida fecha. Valor: ',
 'Fecha de recepción', NOW()),

-- IC - Ejecución (Ínfima Cuantía tiene recepción directa)
(UUID(), ':CP_FACTURA:', 'Número de Factura', 'CP_INFIMA_CUANTIA', 'EJECUCION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 5, "maxLength": 50, "pattern": "^[0-9\\\\-]+$", "patternMessage": "Formato: 001-001-000000001"}',
 TRUE, 'Ayuda con la FACTURA para Ínfima Cuantía. Debe ser factura electrónica autorizada por el SRI.',
 'Valida número de factura. Formato SRI. Valor: ',
 'Factura electrónica autorizada por SRI', NOW()),

(UUID(), ':CP_FECHA_FACTURA:', 'Fecha de Factura', 'CP_INFIMA_CUANTIA', 'EJECUCION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de factura para Ínfima Cuantía.',
 'Valida fecha. Valor: ',
 'Fecha de la factura', NOW()),

(UUID(), ':CP_ACTA_RECEPCION:', 'No. Acta de Recepción', 'CP_INFIMA_CUANTIA', 'EJECUCION', 3, FALSE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"maxLength": 50}',
 TRUE, 'Ayuda con acta de recepción para Ínfima Cuantía. No siempre requerida para montos menores.',
 'Valida acta. Valor: ',
 'Acta de recepción (opcional para montos menores)', NOW()),

-- RE - Ejecución
(UUID(), ':CP_ACTA_RECEPCION:', 'No. Acta de Recepción', 'CP_REGIMEN_ESPECIAL', 'EJECUCION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con acta de recepción para Régimen Especial.',
 'Valida acta. Valor: ',
 'Acta de entrega-recepción', NOW()),

(UUID(), ':CP_FECHA_RECEPCION:', 'Fecha de Recepción', 'CP_REGIMEN_ESPECIAL', 'EJECUCION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de recepción.',
 'Valida fecha. Valor: ',
 'Fecha de recepción', NOW()),

-- FI - Ejecución
(UUID(), ':CP_ACTA_RECEPCION:', 'No. Acta de Recepción', 'CP_FERIA_INCLUSIVA', 'EJECUCION', 1, TRUE, TRUE,
 'TEXT', 'TEXT_INPUT',
 '{"required": true, "minLength": 3, "maxLength": 50}',
 TRUE, 'Ayuda con acta de recepción para Feria Inclusiva.',
 'Valida acta. Valor: ',
 'Acta de entrega-recepción', NOW()),

(UUID(), ':CP_FECHA_RECEPCION:', 'Fecha de Recepción', 'CP_FERIA_INCLUSIVA', 'EJECUCION', 2, TRUE, TRUE,
 'DATE', 'DATE_PICKER',
 '{"required": true}',
 TRUE, 'Ayuda con fecha de recepción.',
 'Valida fecha. Valor: ',
 'Fecha de recepción', NOW());

-- ---------------------------------------------------------------------------
-- 2.6 SUBASTA (Puja) fields - SIE specific
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  ai_enabled = TRUE,
  ai_help_prompt = 'Eres un experto en contratación pública ecuatoriana. Ayuda con la PUJA ELECTRÓNICA de Subasta Inversa. Art. 47 LOSNCP:\n1. La puja es hacia la baja entre oferentes calificados\n2. Duración mínima: 15 minutos con extensión automática de 2 minutos\n3. El sistema registra cada lance y su hora\n4. El ganador es quien oferte el precio más bajo\n5. Si solo hay un calificado, se negocia directamente\n6. La reducción mínima entre lances se configura en pliegos\nResponde en español.',
  ai_validation_prompt = 'Valida los datos de la puja electrónica según Art. 47 LOSNCP. Valor: '
WHERE message_type = 'CP_SUBASTA_INVERSA' AND section = 'SUBASTA';

-- ---------------------------------------------------------------------------
-- 2.7 Update ALL remaining fields with ai_enabled = TRUE and basic prompts
-- ---------------------------------------------------------------------------
UPDATE swift_field_config_readmodel SET
  ai_enabled = TRUE,
  ai_help_prompt = CONCAT(
    'Eres un experto en contratación pública ecuatoriana (LOSNCP). ',
    'Ayuda al usuario con el campo "', field_name_key, '" ',
    'en la etapa "', section, '" del proceso. ',
    'Proporciona: 1) Base legal aplicable, 2) Requisitos y formato, 3) Errores comunes a evitar, 4) Recomendaciones. ',
    'Responde en español.'
  ),
  ai_validation_prompt = CONCAT(
    'Valida el valor del campo "', field_name_key, '" para contratación pública ecuatoriana. ',
    'Verifica formato, requisitos legales y coherencia. Valor: '
  )
WHERE message_type LIKE 'CP_%' AND ai_enabled IS NULL OR ai_enabled = FALSE;

-- Mark all CP fields as required where validation_rules is null
UPDATE swift_field_config_readmodel SET
  validation_rules = '{"required": true}'
WHERE message_type LIKE 'CP_%' AND validation_rules IS NULL AND is_required = TRUE;
