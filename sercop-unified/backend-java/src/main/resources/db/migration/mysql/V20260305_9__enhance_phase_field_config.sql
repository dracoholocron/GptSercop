-- Enhance cp_paa_phase_field_mapping with component configuration for DB-driven UI rendering
ALTER TABLE cp_paa_phase_field_mapping
  ADD COLUMN component_type VARCHAR(50) DEFAULT 'TEXT' COMMENT 'TEXT, PRIORITY_LIST, GANTT_TIMELINE, ITEMS_TABLE, BUDGET_STATS, BADGE_LIST, MISSION_CARD, ENTITY_INFO, ENRICHED_TABLE, READONLY_NOTE',
  ADD COLUMN card_size VARCHAR(10) DEFAULT 'md' COMMENT 'sm, md, lg',
  ADD COLUMN grid_span INT DEFAULT 1 COMMENT 'Grid columns (1-4)',
  ADD COLUMN label VARCHAR(200) COMMENT 'Display label for the card',
  ADD COLUMN icon VARCHAR(50) COMMENT 'React icon name: FiClipboard, FiCalendar, etc.',
  ADD COLUMN placeholder TEXT COMMENT 'Placeholder for editable fields',
  ADD COLUMN help_text TEXT COMMENT 'Tooltip or help text',
  ADD COLUMN is_editable BOOLEAN DEFAULT TRUE,
  ADD COLUMN is_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN min_length INT DEFAULT 0,
  ADD COLUMN max_length INT DEFAULT 10000,
  ADD COLUMN ai_assist_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN ai_validation_on_blur BOOLEAN DEFAULT FALSE,
  ADD COLUMN ai_step VARCHAR(100) COMMENT 'AI step for validation/suggestion calls',
  ADD COLUMN ai_field_id VARCHAR(100) COMMENT 'AI field identifier',
  ADD COLUMN ai_validation_prompt TEXT COMMENT 'Prompt used for AI validation on blur',
  ADD COLUMN ai_suggestion_prompt TEXT COMMENT 'Prompt used for AI suggestion generation',
  ADD COLUMN data_schema JSON COMMENT 'Component-specific schema: GANTT quarters, PRIORITY levels/colors, TABLE columns';

-- ============================================================================
-- Seed: Update existing Phase 1 (CONTEXTO_INSTITUCIONAL) field mappings
-- and add new visual field configs for the mural cards
-- ============================================================================

SET @meth_cips_id = (SELECT id FROM cp_paa_methodology WHERE code = 'CIPS_KEARNEY_LOSNCP');
SET @phase1_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'CONTEXTO_INSTITUCIONAL');

-- Update existing entityName field
UPDATE cp_paa_phase_field_mapping
SET component_type = 'ENTITY_INFO',
    card_size = 'sm',
    grid_span = 1,
    label = 'Entidad',
    icon = 'FiShield',
    is_editable = FALSE,
    is_required = FALSE,
    ai_assist_enabled = FALSE
WHERE phase_id = @phase1_id AND field_code = 'ENTIDAD_NOMBRE';

-- Add needs field
INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_validation_on_blur, ai_step, ai_field_id,
  ai_validation_prompt, ai_suggestion_prompt)
VALUES (@phase1_id, 'needs', '$.needs', 'DIRECT', 10,
  'TEXT', 'lg', 1, 'Necesidades', 'FiClipboard',
  'Describa las necesidades de contratacion del departamento: bienes, servicios, obras y consultorias requeridas...',
  TRUE, TRUE, 20, 5000, TRUE, TRUE,
  'PAA_NEEDS_ENRICHMENT', 'NEEDS_VALIDATE',
  'Valida si estas necesidades son coherentes y suficientemente detalladas para un PAA. Sugiere mejoras si es necesario.',
  'Genera una sugerencia de contenido para las necesidades de contratacion de un PAA.');

-- Add priorities field
INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_validation_on_blur, ai_step, ai_field_id,
  ai_validation_prompt, ai_suggestion_prompt, data_schema)
VALUES (@phase1_id, 'priorities', '$.priorities', 'DIRECT', 20,
  'PRIORITY_LIST', 'md', 1, 'Prioridades', 'FiTarget',
  'Indique las prioridades de contratacion...',
  TRUE, FALSE, 10, 3000, TRUE, FALSE,
  'PAA_NEEDS_ENRICHMENT', 'PRIORITIES_VALIDATE',
  'Valida si las prioridades estan bien definidas y son coherentes con las necesidades del PAA.',
  'Genera prioridades sugeridas basadas en las necesidades del PAA.',
  '{"levels":["CRITICA","ALTA","MEDIA","BAJA"],"colors":{"CRITICA":"red","ALTA":"orange","MEDIA":"yellow","BAJA":"blue"},"maxItems":10}');

-- Add timeline field
INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  ai_assist_enabled, data_schema)
VALUES (@phase1_id, 'timeline', '$.timeline', 'DIRECT', 30,
  'GANTT_TIMELINE', 'md', 2, 'Cronograma', 'FiCalendar',
  'Defina el cronograma: trimestres de ejecucion, fechas clave...',
  TRUE, FALSE, FALSE,
  '{"quarters":["Q1","Q2","Q3","Q4"],"year":2026}');

-- Add missionSummary field
INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, placeholder, is_editable, is_required,
  min_length, max_length, ai_assist_enabled, ai_validation_on_blur, ai_step, ai_field_id,
  ai_suggestion_prompt)
VALUES (@phase1_id, 'missionSummary', '$.missionSummary', 'DIRECT', 40,
  'MISSION_CARD', 'md', 1, 'Mision', 'FiTrendingUp',
  'Resuma la mision institucional y como se alinean las contrataciones con los objetivos estrategicos...',
  TRUE, FALSE, 10, 2000, TRUE, FALSE,
  'PAA_ENTITY_VALIDATION', 'MISSION_VALIDATE',
  'Genera un resumen de mision institucional alineado con las contrataciones del PAA.');

-- Add summary (readonly)
INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, is_editable, is_required, ai_assist_enabled)
VALUES (@phase1_id, 'summary', '$.summary', 'DIRECT', 50,
  'READONLY_NOTE', 'md', 1, 'Resumen', 'FiFileText',
  FALSE, FALSE, FALSE);

-- Add enrichedNeeds (readonly table)
INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, is_editable, is_required, ai_assist_enabled,
  data_schema)
VALUES (@phase1_id, 'enrichedNeeds', '$.enrichedNeeds', 'DIRECT', 60,
  'ENRICHED_TABLE', 'lg', 4, 'Items Identificados', 'FiPackage',
  FALSE, FALSE, FALSE,
  '{"columns":[{"key":"cpc","label":"CPC","type":"text"},{"key":"description","label":"Descripcion","type":"text"},{"key":"type","label":"Tipo","type":"text"},{"key":"procedure","label":"Procedimiento","type":"text"},{"key":"quantity","label":"Cantidad","type":"number"},{"key":"total","label":"Total","type":"currency"}]}');

-- Add additionalItems (badges)
INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order,
  component_type, card_size, grid_span, label, icon, is_editable, is_required, ai_assist_enabled)
VALUES (@phase1_id, 'additionalItems', '$.additionalItems', 'DIRECT', 70,
  'BADGE_LIST', 'sm', 2, 'Items Adicionales', 'FiLayers',
  FALSE, FALSE, FALSE);
