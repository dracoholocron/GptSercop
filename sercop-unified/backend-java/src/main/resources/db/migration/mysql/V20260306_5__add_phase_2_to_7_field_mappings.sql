-- ============================================================================
-- Add visual field mappings for phases 2-7 of CIPS_KEARNEY_LOSNCP methodology
-- Phase 1 already has full mappings from V20260305_9
-- ============================================================================

SET @meth_cips_id = (SELECT id FROM cp_paa_methodology WHERE code = 'CIPS_KEARNEY_LOSNCP');

-- ============================================================================
-- Phase 2: MARCO_PRESUPUESTARIO
-- ============================================================================
SET @phase2_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'MARCO_PRESUPUESTARIO');

UPDATE cp_paa_phase_field_mapping
SET component_type = 'TEXT', card_size = 'md', grid_span = 1,
    label = 'Presupuesto Referencial', icon = 'FiDollarSign',
    placeholder = 'Indique el presupuesto total asignado para contrataciones...',
    is_editable = TRUE, is_required = TRUE, min_length = 5, max_length = 3000,
    ai_assist_enabled = TRUE, ai_step = 'PAA_BUDGET', ai_field_id = 'BUDGET_TOTAL',
    ai_suggestion_prompt = 'Genera una descripcion del presupuesto referencial para el PAA.'
WHERE phase_id = @phase2_id AND field_code = 'PRESUPUESTO_REFERENCIAL';

UPDATE cp_paa_phase_field_mapping
SET component_type = 'TEXT', card_size = 'md', grid_span = 1,
    label = 'Fuente de Financiamiento', icon = 'FiCreditCard',
    placeholder = 'Describa las fuentes de financiamiento: fiscal, autofinanciamiento, credito...',
    is_editable = TRUE, is_required = FALSE, min_length = 5, max_length = 3000,
    ai_assist_enabled = TRUE, ai_step = 'PAA_BUDGET', ai_field_id = 'BUDGET_SOURCE',
    ai_suggestion_prompt = 'Genera una descripcion de las fuentes de financiamiento para el PAA.'
WHERE phase_id = @phase2_id AND field_code = 'FUENTE_FINANCIAMIENTO';

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_step, ai_field_id, ai_suggestion_prompt)
VALUES
(@phase2_id, 'needs', '$.needs', 'DIRECT', 5,
  'TEXT', 'lg', 2, 'Necesidades Presupuestarias', 'FiClipboard',
  'Describa las necesidades presupuestarias: distribucion por tipo de gasto, partidas, techos presupuestarios...',
  TRUE, TRUE, 20, 5000, TRUE, 'PAA_BUDGET', 'BUDGET_NEEDS',
  'Genera una descripcion de las necesidades presupuestarias para un PAA.'),
(@phase2_id, 'priorities', '$.priorities', 'DIRECT', 15,
  'PRIORITY_LIST', 'md', 1, 'Prioridades de Gasto', 'FiTarget',
  'Indique las prioridades de asignacion presupuestaria...',
  TRUE, FALSE, 10, 3000, TRUE, 'PAA_BUDGET', 'BUDGET_PRIORITIES',
  'Genera prioridades de asignacion presupuestaria para el PAA.');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required)
VALUES
(@phase2_id, 'timeline', '$.timeline', 'DIRECT', 25,
  'GANTT_TIMELINE', 'md', 2, 'Cronograma Presupuestario', 'FiCalendar',
  'Defina el cronograma de ejecucion presupuestaria por trimestre...', TRUE, FALSE);

-- ============================================================================
-- Phase 3: LEVANTAMIENTO_NECESIDADES
-- ============================================================================
SET @phase3_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'LEVANTAMIENTO_NECESIDADES');

UPDATE cp_paa_phase_field_mapping
SET component_type = 'TEXT', card_size = 'md', grid_span = 1,
    label = 'Objeto de Contratacion', icon = 'FiFileText',
    placeholder = 'Describa los objetos de contratacion requeridos...',
    is_editable = TRUE, is_required = TRUE, min_length = 10, max_length = 5000,
    ai_assist_enabled = TRUE, ai_step = 'PAA_NEEDS', ai_field_id = 'CONTRACT_OBJECT',
    ai_suggestion_prompt = 'Genera una descripcion de objetos de contratacion para el PAA.'
WHERE phase_id = @phase3_id AND field_code = 'OBJETO_CONTRATACION';

UPDATE cp_paa_phase_field_mapping
SET component_type = 'TEXT', card_size = 'sm', grid_span = 1,
    label = 'Codigos CPC', icon = 'FiHash',
    placeholder = 'Indique los codigos CPC aplicables...',
    is_editable = TRUE, is_required = FALSE, min_length = 3, max_length = 2000,
    ai_assist_enabled = TRUE, ai_step = 'PAA_NEEDS', ai_field_id = 'CPC_CODES',
    ai_suggestion_prompt = 'Sugiere codigos CPC aplicables basados en las necesidades del PAA.'
WHERE phase_id = @phase3_id AND field_code = 'CODIGO_CPC';

UPDATE cp_paa_phase_field_mapping
SET component_type = 'TEXT', card_size = 'sm', grid_span = 1,
    label = 'Tipo de Compra', icon = 'FiShoppingCart',
    placeholder = 'Bien, Servicio, Obra o Consultoria...',
    is_editable = TRUE, is_required = TRUE, min_length = 3, max_length = 1000,
    ai_assist_enabled = FALSE
WHERE phase_id = @phase3_id AND field_code = 'TIPO_COMPRA';

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_step, ai_field_id, ai_suggestion_prompt)
VALUES
(@phase3_id, 'needs', '$.needs', 'DIRECT', 0,
  'TEXT', 'lg', 2, 'Necesidades Identificadas', 'FiClipboard',
  'Describa las necesidades de bienes, servicios, obras y consultorias del departamento...',
  TRUE, TRUE, 20, 5000, TRUE, 'PAA_NEEDS_ENRICHMENT', 'NEEDS_VALIDATE',
  'Genera una descripcion de necesidades de contratacion para un PAA.'),
(@phase3_id, 'priorities', '$.priorities', 'DIRECT', 5,
  'PRIORITY_LIST', 'md', 1, 'Prioridades', 'FiTarget',
  'Indique las prioridades de contratacion...',
  TRUE, FALSE, 10, 3000, TRUE, 'PAA_NEEDS_ENRICHMENT', 'PRIORITIES_VALIDATE',
  'Genera prioridades de contratacion basadas en las necesidades.');

-- ============================================================================
-- Phase 4: INTELIGENCIA_MERCADO
-- ============================================================================
SET @phase4_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'INTELIGENCIA_MERCADO');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_step, ai_field_id, ai_suggestion_prompt)
VALUES
(@phase4_id, 'needs', '$.needs', 'DIRECT', 1,
  'TEXT', 'lg', 2, 'Analisis de Mercado', 'FiTrendingUp',
  'Describa el analisis de mercado: proveedores identificados, precios referenciales, condiciones...',
  TRUE, TRUE, 20, 5000, TRUE, 'PAA_MARKET_INTELLIGENCE', 'MARKET_ANALYSIS',
  'Genera un analisis de inteligencia de mercado para los items del PAA.'),
(@phase4_id, 'priorities', '$.priorities', 'DIRECT', 10,
  'PRIORITY_LIST', 'md', 1, 'Riesgos de Mercado', 'FiAlertTriangle',
  'Identifique riesgos de mercado: proveedor unico, volatilidad de precios...',
  TRUE, FALSE, 10, 3000, TRUE, 'PAA_MARKET_INTELLIGENCE', 'MARKET_RISKS',
  'Genera una lista de riesgos de mercado para los items del PAA.');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, is_editable, is_required)
VALUES
(@phase4_id, 'summary', '$.summary', 'DIRECT', 20,
  'READONLY_NOTE', 'md', 1, 'Resumen IA', 'FiCpu', FALSE, FALSE);

-- ============================================================================
-- Phase 5: CONSOLIDACION_CATEGORIAS
-- ============================================================================
SET @phase5_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'CONSOLIDACION_CATEGORIAS');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_step, ai_field_id, ai_suggestion_prompt)
VALUES
(@phase5_id, 'needs', '$.needs', 'DIRECT', 1,
  'TEXT', 'lg', 2, 'Consolidacion de Categorias', 'FiLayers',
  'Describa como se agrupan los items por categoria CPC: lotes, familias de productos...',
  TRUE, TRUE, 20, 5000, TRUE, 'PAA_CONSOLIDATION', 'CATEGORY_GROUPING',
  'Genera una propuesta de consolidacion por categorias CPC para los items del PAA.'),
(@phase5_id, 'priorities', '$.priorities', 'DIRECT', 10,
  'PRIORITY_LIST', 'md', 1, 'Alertas de Fraccionamiento', 'FiAlertCircle',
  'Identifique posibles fraccionamientos detectados...',
  TRUE, FALSE, 10, 3000, TRUE, 'PAA_CONSOLIDATION', 'FRAGMENTATION_ALERTS',
  'Identifica posibles fraccionamientos en la consolidacion de items del PAA.');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, is_editable, is_required)
VALUES
(@phase5_id, 'summary', '$.summary', 'DIRECT', 20,
  'READONLY_NOTE', 'md', 1, 'Resumen de Consolidacion', 'FiFileText', FALSE, FALSE);

-- ============================================================================
-- Phase 6: ESTRATEGIA_CONTRATACION
-- ============================================================================
SET @phase6_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'ESTRATEGIA_CONTRATACION');

UPDATE cp_paa_phase_field_mapping
SET component_type = 'TEXT', card_size = 'md', grid_span = 1,
    label = 'Tipo de Proceso', icon = 'FiShield',
    placeholder = 'Describa los tipos de proceso: Subasta Inversa, Catalogo, Menor Cuantia...',
    is_editable = TRUE, is_required = TRUE, min_length = 10, max_length = 3000,
    ai_assist_enabled = TRUE, ai_step = 'PAA_STRATEGY', ai_field_id = 'PROCESS_TYPE',
    ai_suggestion_prompt = 'Genera la asignacion de tipos de proceso LOSNCP segun los montos del PAA.'
WHERE phase_id = @phase6_id AND field_code = 'TIPO_PROCESO';

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_step, ai_field_id, ai_suggestion_prompt)
VALUES
(@phase6_id, 'needs', '$.needs', 'DIRECT', 0,
  'TEXT', 'lg', 2, 'Estrategia de Contratacion', 'FiTarget',
  'Describa la estrategia de contratacion: criterios, umbrales LOSNCP, preferencias...',
  TRUE, TRUE, 20, 5000, TRUE, 'PAA_STRATEGY', 'STRATEGY_DESC',
  'Genera una estrategia de contratacion para el PAA basada en la LOSNCP.'),
(@phase6_id, 'priorities', '$.priorities', 'DIRECT', 5,
  'PRIORITY_LIST', 'md', 1, 'Prioridades Estrategicas', 'FiList',
  'Indique las prioridades: participacion MIPYMES, economia popular, produccion nacional...',
  TRUE, FALSE, 10, 3000, TRUE, 'PAA_STRATEGY', 'STRATEGY_PRIORITIES',
  'Genera prioridades estrategicas para la contratacion publica del PAA.');

-- ============================================================================
-- Phase 7: CALENDARIZACION_VALIDACION
-- ============================================================================
SET @phase7_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'CALENDARIZACION_VALIDACION');

UPDATE cp_paa_phase_field_mapping
SET component_type = 'TEXT', card_size = 'md', grid_span = 1,
    label = 'Fecha de Publicacion', icon = 'FiCalendar',
    placeholder = 'Indique las fechas estimadas de publicacion por trimestre...',
    is_editable = TRUE, is_required = TRUE, min_length = 5, max_length = 3000,
    ai_assist_enabled = TRUE, ai_step = 'PAA_SCHEDULE', ai_field_id = 'PUB_DATE',
    ai_suggestion_prompt = 'Genera un cronograma de publicacion para los procesos del PAA.'
WHERE phase_id = @phase7_id AND field_code = 'FECHA_PUBLICACION';

UPDATE cp_paa_phase_field_mapping
SET component_type = 'GANTT_TIMELINE', card_size = 'md', grid_span = 2,
    label = 'Periodo de Contratacion', icon = 'FiClock',
    placeholder = 'Defina los periodos de contratacion por trimestre...',
    is_editable = TRUE, is_required = FALSE, ai_assist_enabled = FALSE,
    data_schema = '{"quarters":["Q1","Q2","Q3","Q4"],"year":2026}'
WHERE phase_id = @phase7_id AND field_code = 'PERIODO_CONTRATACION';

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_step, ai_field_id, ai_suggestion_prompt)
VALUES
(@phase7_id, 'needs', '$.needs', 'DIRECT', 0,
  'TEXT', 'lg', 2, 'Calendarizacion y Validacion', 'FiCheckSquare',
  'Describa el plan de calendarizacion: distribucion trimestral, validaciones normativas, hitos...',
  TRUE, TRUE, 20, 5000, TRUE, 'PAA_SCHEDULE', 'SCHEDULE_DESC',
  'Genera un plan de calendarizacion y validacion para el PAA.');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, is_editable, is_required)
VALUES
(@phase7_id, 'summary', '$.summary', 'DIRECT', 30,
  'READONLY_NOTE', 'md', 1, 'Validacion Normativa', 'FiCheckCircle', FALSE, FALSE);
