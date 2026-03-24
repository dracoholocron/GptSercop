-- =====================================================
-- V225: Create Risk Data Custom Fields Step
-- =====================================================
-- Este paso captura datos regulatorios de riesgo requeridos
-- por normativa bancaria (SBS Ecuador / DOKA integration).
--
-- Los campos usan CATALOG_LISTBOX que carga opciones
-- automáticamente desde custom_catalog_read_model.
--
-- EJEMPLO DOCUMENTADO: Cómo crear un paso personalizado
-- de captura de datos usando catálogos existentes.
-- =====================================================

-- =====================================================
-- PASO 1: Crear el Step de Datos de Riesgo
-- =====================================================
-- El step define un nuevo paso en el wizard.
-- - product_type = 'ALL' aplica a todos los productos
-- - embed_mode = 'SEPARATE_STEP' lo muestra como paso independiente
-- - display_order = 150 lo ubica después de los pasos SWIFT
-- =====================================================

INSERT INTO custom_field_step_config_readmodel (
    id,
    step_code,
    step_name_key,
    step_description_key,
    product_type,
    tenant_id,
    display_order,
    icon,
    show_in_wizard,
    show_in_expert,
    show_in_custom,
    show_in_view,
    embed_mode,
    embed_swift_step,
    is_active,
    created_by,
    created_at
) VALUES (
    UUID(),
    'RISK_DATA',
    'customFields.steps.RISK_DATA.name',
    'customFields.steps.RISK_DATA.description',
    'ALL',           -- Aplica a todos los productos (LC Import, Export, Guarantee, etc.)
    NULL,            -- Sin tenant específico (global)
    150,             -- Orden: después de pasos SWIFT, antes de Contabilidad
    'FiShield',      -- Icono de escudo para datos de riesgo
    TRUE,            -- Visible en modo Wizard
    TRUE,            -- Visible en modo Experto
    TRUE,            -- Visible en modo Custom
    TRUE,            -- Visible en modo Vista
    'SEPARATE_STEP', -- Paso separado (no embebido en SWIFT)
    NULL,            -- No embebido
    TRUE,            -- Activo
    'V225_MIGRATION',
    NOW()
);

-- Obtener el ID del step recién creado
SET @risk_step_id = (
    SELECT id FROM custom_field_step_config_readmodel
    WHERE step_code = 'RISK_DATA'
    LIMIT 1
);

-- =====================================================
-- PASO 2: Crear la Sección de Clasificación Regulatoria
-- =====================================================
-- La sección agrupa campos relacionados.
-- - section_type = 'SINGLE' para campos únicos (no repetibles)
-- - columns = 2 para layout de 2 columnas
-- =====================================================

INSERT INTO custom_field_section_config_readmodel (
    id,
    section_code,
    section_name_key,
    section_description_key,
    step_id,
    section_type,
    min_rows,
    max_rows,
    display_order,
    collapsible,
    default_collapsed,
    columns,
    embed_mode,
    embed_target_type,
    embed_target_code,
    embed_show_separator,
    embed_collapsible,
    embed_separator_title_key,
    show_in_wizard,
    show_in_expert,
    show_in_custom,
    show_in_view,
    is_active,
    created_by,
    created_at
) VALUES (
    UUID(),
    'REGULATORY_CLASSIFICATION',
    'customFields.sections.REGULATORY_CLASSIFICATION.name',
    'customFields.sections.REGULATORY_CLASSIFICATION.description',
    @risk_step_id,
    'SINGLE',        -- Campos únicos, no repetibles
    0,
    1,
    1,               -- Primera sección
    FALSE,           -- No colapsable
    FALSE,
    2,               -- Layout de 2 columnas
    'NONE',          -- No embebida
    NULL,
    NULL,
    FALSE,
    FALSE,
    NULL,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    'V225_MIGRATION',
    NOW()
);

-- Obtener el ID de la sección
SET @regulatory_section_id = (
    SELECT id FROM custom_field_section_config_readmodel
    WHERE section_code = 'REGULATORY_CLASSIFICATION'
    LIMIT 1
);

-- =====================================================
-- PASO 3: Crear los Campos con CATALOG_LISTBOX
-- =====================================================
-- Cada campo usa component_type = 'CATALOG_LISTBOX' que
-- carga automáticamente las opciones desde el catálogo
-- especificado en data_source_code.
--
-- El frontend (CustomCatalogDropdown) llama a:
-- GET /custom-catalogs/queries/codigo-padre/{data_source_code}
-- =====================================================

INSERT INTO custom_field_config_readmodel (
    id,
    field_code,
    field_name_key,
    field_description_key,
    section_id,
    field_type,
    component_type,
    data_source_type,
    data_source_code,
    data_source_filters,
    display_order,
    placeholder_key,
    help_text_key,
    span_columns,
    is_required,
    required_condition,
    validation_rules,
    dependencies,
    default_value,
    default_value_expression,
    field_options,
    embed_after_swift_field,
    embed_inline,
    show_in_wizard,
    show_in_expert,
    show_in_custom,
    show_in_view,
    show_in_list,
    is_active,
    created_by,
    created_at
) VALUES
-- =====================================================
-- Campo 1: Destino Contable (ACCDES)
-- Clasificación del tipo de cliente o cuenta
-- =====================================================
(
    UUID(),
    'ACCOUNT_DESCRIPTOR',
    'customFields.fields.ACCOUNT_DESCRIPTOR.name',
    'customFields.fields.ACCOUNT_DESCRIPTOR.description',
    @regulatory_section_id,
    'SELECT',
    'CATALOG_LISTBOX',      -- Componente que carga del catálogo
    'CATALOG',              -- Tipo de data source
    'ACCDES',               -- Código del catálogo padre en custom_catalog_read_model
    NULL,
    1,                      -- Primer campo
    'customFields.fields.ACCOUNT_DESCRIPTOR.placeholder',
    'customFields.fields.ACCOUNT_DESCRIPTOR.helpText',
    1,                      -- Ocupa 1 columna
    TRUE,                   -- Requerido
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    TRUE, TRUE, TRUE, TRUE,
    TRUE,                   -- Mostrar en listados
    TRUE,
    'V225_MIGRATION',
    NOW()
),

-- =====================================================
-- Campo 2: Destino Financiero (FINDES)
-- Finalidad del crédito según normativa SBS
-- =====================================================
(
    UUID(),
    'FINANCIAL_DESTINATION',
    'customFields.fields.FINANCIAL_DESTINATION.name',
    'customFields.fields.FINANCIAL_DESTINATION.description',
    @regulatory_section_id,
    'SELECT',
    'CATALOG_LISTBOX',
    'CATALOG',
    'FINDES',               -- Catálogo de Destino Financiero
    NULL,
    2,
    'customFields.fields.FINANCIAL_DESTINATION.placeholder',
    'customFields.fields.FINANCIAL_DESTINATION.helpText',
    1,
    TRUE,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    TRUE, TRUE, TRUE, TRUE,
    TRUE,
    TRUE,
    'V225_MIGRATION',
    NOW()
),

-- =====================================================
-- Campo 3: Origen de Recursos (SOURES)
-- Fuente de fondos para la operación
-- =====================================================
(
    UUID(),
    'SOURCE_OF_FUNDS',
    'customFields.fields.SOURCE_OF_FUNDS.name',
    'customFields.fields.SOURCE_OF_FUNDS.description',
    @regulatory_section_id,
    'SELECT',
    'CATALOG_LISTBOX',
    'CATALOG',
    'SOURES',               -- Catálogo de Origen de Recursos
    NULL,
    3,
    'customFields.fields.SOURCE_OF_FUNDS.placeholder',
    'customFields.fields.SOURCE_OF_FUNDS.helpText',
    1,
    TRUE,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    TRUE, TRUE, TRUE, TRUE,
    TRUE,
    TRUE,
    'V225_MIGRATION',
    NOW()
),

-- =====================================================
-- Campo 4: Sector de Crédito (CRESEC)
-- Clasificación del sector crediticio SBS
-- =====================================================
(
    UUID(),
    'CREDIT_SECTOR',
    'customFields.fields.CREDIT_SECTOR.name',
    'customFields.fields.CREDIT_SECTOR.description',
    @regulatory_section_id,
    'SELECT',
    'CATALOG_LISTBOX',
    'CATALOG',
    'CRESEC',               -- Catálogo de Sector de Crédito
    NULL,
    4,
    'customFields.fields.CREDIT_SECTOR.placeholder',
    'customFields.fields.CREDIT_SECTOR.helpText',
    1,
    TRUE,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    TRUE, TRUE, TRUE, TRUE,
    TRUE,
    TRUE,
    'V225_MIGRATION',
    NOW()
),

-- =====================================================
-- Campo 5: Actividad Económica CIIU (ECOACT)
-- Clasificación Industrial Internacional Uniforme
-- =====================================================
(
    UUID(),
    'ECONOMIC_ACTIVITY',
    'customFields.fields.ECONOMIC_ACTIVITY.name',
    'customFields.fields.ECONOMIC_ACTIVITY.description',
    @regulatory_section_id,
    'SELECT',
    'CATALOG_LISTBOX',
    'CATALOG',
    'ECOACT',               -- Catálogo de Actividad Económica CIIU
    NULL,
    5,
    'customFields.fields.ECONOMIC_ACTIVITY.placeholder',
    'customFields.fields.ECONOMIC_ACTIVITY.helpText',
    2,                      -- Ocupa 2 columnas (más ancho para CIIU)
    TRUE,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    TRUE, TRUE, TRUE, TRUE,
    TRUE,
    TRUE,
    'V225_MIGRATION',
    NOW()
);

-- =====================================================
-- PASO 4: Agregar traducciones i18n (español)
-- =====================================================
-- Las traducciones se agregan en los archivos JSON del frontend:
-- /frontend/src/i18n/es.json
-- /frontend/src/i18n/en.json
--
-- Ejemplo de estructura:
-- {
--   "customFields": {
--     "steps": {
--       "RISK_DATA": {
--         "name": "Datos de Riesgo",
--         "description": "Información regulatoria requerida"
--       }
--     },
--     "sections": {
--       "REGULATORY_CLASSIFICATION": {
--         "name": "Clasificación Regulatoria",
--         "description": "Datos requeridos por normativa SBS"
--       }
--     },
--     "fields": {
--       "ACCOUNT_DESCRIPTOR": {
--         "name": "Destino Contable",
--         "description": "Tipo de cliente o cuenta",
--         "placeholder": "Seleccione destino contable...",
--         "helpText": "Clasificación del cliente para reportes regulatorios"
--       },
--       ...
--     }
--   }
-- }
-- =====================================================
