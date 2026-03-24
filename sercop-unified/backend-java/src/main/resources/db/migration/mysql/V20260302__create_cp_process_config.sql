-- ============================================================================
-- V20260302: Motor de Configuración de Procesos de Compras Públicas
-- ============================================================================
-- Configurable multi-país: steps, sections, fields por country_code
-- Sigue el patrón de custom_field_step/section/config_readmodel
-- ============================================================================

-- ============================================================================
-- 1. CONFIGURACIÓN POR PAÍS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_country_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    country_code VARCHAR(3) NOT NULL UNIQUE COMMENT 'ISO 3166-1 alpha-2/3 (EC, CO, PE, MX)',
    country_name VARCHAR(100) NOT NULL,
    legal_framework_name VARCHAR(200) COMMENT 'Ej: LOSNCP, Ley 80, Ley de Contrataciones',
    currency_code VARCHAR(3) DEFAULT 'USD',
    tax_id_name VARCHAR(50) DEFAULT 'RUC' COMMENT 'RUC, NIT, RFC, RUT',
    tax_id_pattern VARCHAR(100) COMMENT 'Regex para validar ID fiscal',
    catalog_system VARCHAR(20) DEFAULT 'CPC' COMMENT 'CPC, UNSPSC, CUBSO',
    budget_integration_enabled BOOLEAN DEFAULT FALSE,
    erp_api_code VARCHAR(50) COMMENT 'Código en external_api_config_read_model',
    regulatory_body_name VARCHAR(100) COMMENT 'SERCOP, Colombia Compra Eficiente, OSCE',
    regulatory_body_url VARCHAR(300),
    config JSON COMMENT 'Umbrales y parámetros específicos del país',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_country_active (country_code, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. PASOS DEL PROCESO (basado en custom_field_step_config_readmodel)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_process_step_config (
    id CHAR(36) PRIMARY KEY,
    step_code VARCHAR(50) NOT NULL,
    step_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    step_description_key TEXT,
    country_code VARCHAR(3) COMMENT 'NULL = global',
    process_type VARCHAR(30) COMMENT 'NULL = ALL process types',
    tenant_id CHAR(36) COMMENT 'NULL = global, para override por entidad',
    phase VARCHAR(30) NOT NULL DEFAULT 'PREPARATORIA' COMMENT 'PREPARATORIA, PRECONTRACTUAL, CONTRACTUAL, EJECUCION',
    display_order INT NOT NULL DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'FiFileText',
    color VARCHAR(20),
    show_in_wizard BOOLEAN DEFAULT TRUE,
    show_in_expert BOOLEAN DEFAULT TRUE,
    required_role VARCHAR(50) COMMENT 'Rol mínimo para editar',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uk_cp_step (step_code, country_code, process_type, tenant_id),
    INDEX idx_cp_step_country (country_code, process_type, is_active),
    INDEX idx_cp_step_phase (phase, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. SECCIONES DENTRO DE PASOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_process_section_config (
    id CHAR(36) PRIMARY KEY,
    section_code VARCHAR(50) NOT NULL,
    section_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    section_description_key TEXT,
    step_id CHAR(36) NOT NULL,
    section_type VARCHAR(20) DEFAULT 'SINGLE' COMMENT 'SINGLE o REPEATABLE',
    min_rows INT DEFAULT 0,
    max_rows INT DEFAULT 100,
    display_order INT NOT NULL DEFAULT 0,
    columns_count INT DEFAULT 2,
    collapsible BOOLEAN DEFAULT FALSE,
    default_collapsed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uk_cp_section (section_code, step_id),
    INDEX idx_cp_section_step (step_id, display_order),
    CONSTRAINT fk_cp_section_step FOREIGN KEY (step_id) REFERENCES cp_process_step_config(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CAMPOS CONFIGURABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_process_field_config (
    id CHAR(36) PRIMARY KEY,
    field_code VARCHAR(50) NOT NULL,
    field_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    field_description_key TEXT,
    section_id CHAR(36) NOT NULL,
    field_type VARCHAR(30) NOT NULL DEFAULT 'TEXT' COMMENT 'TEXT, NUMBER, DATE, SELECT, TEXTAREA, BOOLEAN, CURRENCY, FILE_UPLOAD, CALCULATED',
    component_type VARCHAR(50) DEFAULT 'TEXT_INPUT' COMMENT 'TEXT_INPUT, CURRENCY_INPUT, DATE_PICKER, CPC_TREE_SELECTOR, CATALOG_SELECT, TAX_ID_LOOKUP, FILE_UPLOAD, TEXTAREA',
    data_source_type VARCHAR(20) COMMENT 'CATALOG, API, STATIC',
    data_source_code VARCHAR(50) COMMENT 'Código catálogo o API',
    data_source_filters JSON COMMENT 'Filtros para data source',
    display_order INT NOT NULL DEFAULT 0,
    placeholder_key VARCHAR(100),
    help_text_key VARCHAR(200),
    is_required BOOLEAN DEFAULT FALSE,
    required_condition JSON COMMENT 'Condición dinámica para required',
    validation_rules JSON COMMENT '{"pattern":"regex", "min":0, "max":100, "minLength":5}',
    dependencies JSON COMMENT 'Visibilidad condicional: {"field":"TIPO","value":"CE","action":"SHOW"}',
    field_options JSON COMMENT 'Opciones estáticas para SELECT',
    default_value VARCHAR(500),
    default_value_expression VARCHAR(200) COMMENT 'TODAY(), CURRENT_USER, UUID()',
    legal_reference VARCHAR(200) COMMENT 'Art. 44 LOSNCP',
    ai_assist_enabled BOOLEAN DEFAULT FALSE,
    maps_to_external_field VARCHAR(100) COMMENT 'Mapeo a API externa (SERCOP, SRI)',
    show_in_wizard BOOLEAN DEFAULT TRUE,
    show_in_expert BOOLEAN DEFAULT TRUE,
    show_in_view BOOLEAN DEFAULT TRUE,
    show_in_list BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uk_cp_field (field_code, section_id),
    INDEX idx_cp_field_section (section_id, display_order),
    INDEX idx_cp_field_type (component_type),
    CONSTRAINT fk_cp_field_section FOREIGN KEY (section_id) REFERENCES cp_process_section_config(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. DATOS DE PROCESOS (formularios guardados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_process_data (
    id CHAR(36) PRIMARY KEY,
    process_id CHAR(36) NOT NULL UNIQUE COMMENT 'ID único del proceso',
    country_code VARCHAR(3) NOT NULL DEFAULT 'EC',
    process_type VARCHAR(30) NOT NULL,
    process_code VARCHAR(50) COMMENT 'Código externo (SERCOP, etc.)',
    entity_ruc VARCHAR(20),
    entity_name VARCHAR(300),
    status VARCHAR(30) DEFAULT 'BORRADOR',
    form_data JSON NOT NULL COMMENT 'Todos los valores de campos',
    version INT DEFAULT 1 COMMENT 'Optimistic locking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_cp_process_country (country_code, process_type),
    INDEX idx_cp_process_status (status),
    INDEX idx_cp_process_entity (entity_ruc),
    INDEX idx_cp_process_code (process_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. SEED DATA: ECUADOR
-- ============================================================================

-- País: Ecuador
INSERT IGNORE INTO cp_country_config (country_code, country_name, legal_framework_name, currency_code, tax_id_name, tax_id_pattern, catalog_system, regulatory_body_name, regulatory_body_url, config, is_active)
VALUES ('EC', 'Ecuador', 'LOSNCP - Ley Orgánica del Sistema Nacional de Contratación Pública', 'USD', 'RUC', '^[0-9]{13}$', 'CPC',
        'SERCOP', 'https://portal.compraspublicas.gob.ec',
        '{"umbrales":{"infima_cuantia":7263.42,"menor_cuantia_bienes":72634.22,"cotizacion_bienes":544756.67,"licitacion_bienes":544756.67,"menor_cuantia_obras":290536.89,"cotizacion_obras":1089513.34,"licitacion_obras":1089513.34},"presupuesto_inicial_estado":36317111889.44,"salario_basico_unificado":460}',
        TRUE);

-- ============================================================================
-- 7. SEED DATA: STEPS, SECTIONS, FIELDS para CE (Catálogo Electrónico) Ecuador
-- ============================================================================

-- STEP 1: PREPARACIÓN
INSERT IGNORE INTO cp_process_step_config (id, step_code, step_name_key, step_description_key, country_code, process_type, phase, display_order, icon, color, show_in_wizard, show_in_expert, is_active, created_by)
VALUES ('step-ec-ce-prep', 'PREPARACION', 'cp.steps.PREPARACION.name', 'cp.steps.PREPARACION.description', 'EC', 'CE', 'PREPARATORIA', 1, 'FiClipboard', 'blue', TRUE, TRUE, TRUE, 'system');

-- Section: INFO GENERAL
INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-info', 'INFO_GENERAL', 'cp.sections.INFO_GENERAL.name', 'step-ec-ce-prep', 'SINGLE', 1, 2, TRUE, 'system');

-- Fields: INFO GENERAL
INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, legal_reference, ai_assist_enabled, show_in_list, created_by) VALUES
('fld-ec-objeto', 'OBJETO_CONTRATACION', 'cp.fields.OBJETO_CONTRATACION.name', 'sec-ec-ce-info', 'TEXTAREA', 'TEXTAREA', 1, TRUE, 'Art. 23 LOSNCP', TRUE, TRUE, 'system'),
('fld-ec-cpc', 'CODIGO_CPC', 'cp.fields.CODIGO_CPC.name', 'sec-ec-ce-info', 'TEXT', 'CPC_TREE_SELECTOR', 2, TRUE, 'Art. 6 num. 3 LOSNCP', FALSE, TRUE, 'system'),
('fld-ec-presupuesto', 'PRESUPUESTO_REFERENCIAL', 'cp.fields.PRESUPUESTO_REFERENCIAL.name', 'sec-ec-ce-info', 'CURRENCY', 'CURRENCY_INPUT', 3, TRUE, 'Art. 24 LOSNCP', TRUE, TRUE, 'system'),
('fld-ec-tipo-proc', 'TIPO_PROCESO', 'cp.fields.TIPO_PROCESO.name', 'sec-ec-ce-info', 'SELECT', 'CATALOG_SELECT', 4, TRUE, NULL, FALSE, TRUE, 'system');

-- Update TIPO_PROCESO data source
UPDATE cp_process_field_config SET data_source_type = 'CATALOG', data_source_code = 'CP_TIPO_PROCESO', default_value = 'CE' WHERE id = 'fld-ec-tipo-proc';

-- Section: ENTIDAD CONTRATANTE
INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-entity', 'ENTIDAD_CONTRATANTE', 'cp.sections.ENTIDAD_CONTRATANTE.name', 'step-ec-ce-prep', 'SINGLE', 2, 2, TRUE, 'system');

INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, validation_rules, maps_to_external_field, created_by) VALUES
('fld-ec-ruc', 'RUC_ENTIDAD', 'cp.fields.RUC_ENTIDAD.name', 'sec-ec-ce-entity', 'TEXT', 'TAX_ID_LOOKUP', 1, TRUE, '{"pattern":"^[0-9]{13}$","message":"RUC debe tener 13 dígitos"}', 'SRI_RUC_LOOKUP', 'system'),
('fld-ec-nombre-ent', 'NOMBRE_ENTIDAD', 'cp.fields.NOMBRE_ENTIDAD.name', 'sec-ec-ce-entity', 'TEXT', 'TEXT_INPUT', 2, TRUE, NULL, NULL, 'system'),
('fld-ec-dir-ent', 'DIRECCION_ENTIDAD', 'cp.fields.DIRECCION_ENTIDAD.name', 'sec-ec-ce-entity', 'TEXT', 'TEXT_INPUT', 3, FALSE, NULL, NULL, 'system'),
('fld-ec-admin-cont', 'ADMINISTRADOR_CONTRATO', 'cp.fields.ADMINISTRADOR_CONTRATO.name', 'sec-ec-ce-entity', 'TEXT', 'TEXT_INPUT', 4, FALSE, NULL, NULL, 'system');

-- Set legal_reference separately
UPDATE cp_process_field_config SET legal_reference = 'Art. 70 LOSNCP' WHERE id = 'fld-ec-admin-cont';

-- Section: REFERENCIA PAC
INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-pac', 'REFERENCIA_PAC', 'cp.sections.REFERENCIA_PAC.name', 'step-ec-ce-prep', 'SINGLE', 3, 2, TRUE, 'system');

INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, ai_assist_enabled, legal_reference, created_by) VALUES
('fld-ec-anio-pac', 'ANIO_PAC', 'cp.fields.ANIO_PAC.name', 'sec-ec-ce-pac', 'NUMBER', 'NUMBER_INPUT', 1, TRUE, FALSE, 'Art. 22 LOSNCP', 'system'),
('fld-ec-num-partida', 'NUMERO_PARTIDA', 'cp.fields.NUMERO_PARTIDA.name', 'sec-ec-ce-pac', 'TEXT', 'TEXT_INPUT', 2, TRUE, FALSE, NULL, 'system'),
('fld-ec-fecha-aprob', 'FECHA_APROBACION_PAC', 'cp.fields.FECHA_APROBACION_PAC.name', 'sec-ec-ce-pac', 'DATE', 'DATE_PICKER', 3, FALSE, FALSE, NULL, 'system');

-- Section: ITEMS DEL PROCESO (REPEATABLE)
INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, min_rows, max_rows, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-items', 'ITEMS', 'cp.sections.ITEMS.name', 'step-ec-ce-prep', 'REPEATABLE', 1, 50, 4, 6, TRUE, 'system');

INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, created_by) VALUES
('fld-ec-item-cpc', 'CPC_ITEM', 'cp.fields.CPC_ITEM.name', 'sec-ec-ce-items', 'TEXT', 'CPC_TREE_SELECTOR', 1, TRUE, 'system'),
('fld-ec-item-desc', 'DESCRIPCION_ITEM', 'cp.fields.DESCRIPCION_ITEM.name', 'sec-ec-ce-items', 'TEXT', 'TEXT_INPUT', 2, TRUE, 'system'),
('fld-ec-item-cant', 'CANTIDAD', 'cp.fields.CANTIDAD.name', 'sec-ec-ce-items', 'NUMBER', 'NUMBER_INPUT', 3, TRUE, 'system'),
('fld-ec-item-unid', 'UNIDAD', 'cp.fields.UNIDAD.name', 'sec-ec-ce-items', 'TEXT', 'TEXT_INPUT', 4, TRUE, 'system'),
('fld-ec-item-prec', 'PRECIO_UNITARIO', 'cp.fields.PRECIO_UNITARIO.name', 'sec-ec-ce-items', 'CURRENCY', 'CURRENCY_INPUT', 5, TRUE, 'system'),
('fld-ec-item-sub', 'SUBTOTAL', 'cp.fields.SUBTOTAL.name', 'sec-ec-ce-items', 'CURRENCY', 'CURRENCY_INPUT', 6, FALSE, 'system');

-- Update SUBTOTAL as calculated
UPDATE cp_process_field_config SET field_type = 'CALCULATED', default_value_expression = 'CANTIDAD * PRECIO_UNITARIO' WHERE id = 'fld-ec-item-sub';

-- STEP 2: CERTIFICACIÓN PRESUPUESTARIA
INSERT IGNORE INTO cp_process_step_config (id, step_code, step_name_key, step_description_key, country_code, process_type, phase, display_order, icon, color, show_in_wizard, show_in_expert, is_active, created_by)
VALUES ('step-ec-ce-cdp', 'CERTIFICACION_PRESUPUESTARIA', 'cp.steps.CERTIFICACION_PRESUPUESTARIA.name', 'cp.steps.CERTIFICACION_PRESUPUESTARIA.description', 'EC', 'CE', 'PREPARATORIA', 2, 'FiDollarSign', 'green', TRUE, TRUE, TRUE, 'system');

INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-cdp', 'CDP', 'cp.sections.CDP.name', 'step-ec-ce-cdp', 'SINGLE', 1, 2, TRUE, 'system');

INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, legal_reference, created_by) VALUES
('fld-ec-num-cdp', 'NUMERO_CDP', 'cp.fields.NUMERO_CDP.name', 'sec-ec-ce-cdp', 'TEXT', 'TEXT_INPUT', 1, TRUE, 'Art. 24 LOSNCP', 'system'),
('fld-ec-fecha-cdp', 'FECHA_CDP', 'cp.fields.FECHA_CDP.name', 'sec-ec-ce-cdp', 'DATE', 'DATE_PICKER', 2, TRUE, NULL, 'system'),
('fld-ec-monto-cdp', 'MONTO_CDP', 'cp.fields.MONTO_CDP.name', 'sec-ec-ce-cdp', 'CURRENCY', 'CURRENCY_INPUT', 3, TRUE, NULL, 'system'),
('fld-ec-partida', 'PARTIDA_PRESUPUESTARIA', 'cp.fields.PARTIDA_PRESUPUESTARIA.name', 'sec-ec-ce-cdp', 'TEXT', 'TEXT_INPUT', 4, TRUE, NULL, 'system'),
('fld-ec-fuente', 'FUENTE_FINANCIAMIENTO', 'cp.fields.FUENTE_FINANCIAMIENTO.name', 'sec-ec-ce-cdp', 'TEXT', 'TEXT_INPUT', 5, FALSE, NULL, 'system');

-- STEP 3: ESTUDIO DE MERCADO
INSERT IGNORE INTO cp_process_step_config (id, step_code, step_name_key, step_description_key, country_code, process_type, phase, display_order, icon, color, show_in_wizard, show_in_expert, is_active, created_by)
VALUES ('step-ec-ce-market', 'ESTUDIO_MERCADO', 'cp.steps.ESTUDIO_MERCADO.name', 'cp.steps.ESTUDIO_MERCADO.description', 'EC', 'CE', 'PREPARATORIA', 3, 'FiTrendingUp', 'purple', TRUE, TRUE, TRUE, 'system');

INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-market', 'ESTUDIO_MERCADO', 'cp.sections.ESTUDIO_MERCADO.name', 'step-ec-ce-market', 'SINGLE', 1, 2, TRUE, 'system');

INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, ai_assist_enabled, legal_reference, created_by) VALUES
('fld-ec-metodologia', 'METODOLOGIA_ESTUDIO', 'cp.fields.METODOLOGIA_ESTUDIO.name', 'sec-ec-ce-market', 'SELECT', 'CATALOG_SELECT', 1, TRUE, FALSE, 'Art. 23 RGLOSNCP', 'system'),
('fld-ec-num-proformas', 'NUMERO_PROFORMAS', 'cp.fields.NUMERO_PROFORMAS.name', 'sec-ec-ce-market', 'NUMBER', 'NUMBER_INPUT', 2, FALSE, FALSE, NULL, 'system'),
('fld-ec-precio-ref', 'PRECIO_REFERENCIAL_CALC', 'cp.fields.PRECIO_REFERENCIAL_CALC.name', 'sec-ec-ce-market', 'CURRENCY', 'CURRENCY_INPUT', 3, TRUE, TRUE, NULL, 'system'),
('fld-ec-justificacion', 'JUSTIFICACION_PRECIO', 'cp.fields.JUSTIFICACION_PRECIO.name', 'sec-ec-ce-market', 'TEXTAREA', 'TEXTAREA', 4, TRUE, TRUE, NULL, 'system');

-- Section: PROFORMAS (REPEATABLE)
INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, min_rows, max_rows, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-proformas', 'PROFORMAS', 'cp.sections.PROFORMAS.name', 'step-ec-ce-market', 'REPEATABLE', 3, 10, 2, 4, TRUE, 'system');

INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, created_by) VALUES
('fld-ec-prov-nombre', 'PROVEEDOR_NOMBRE', 'cp.fields.PROVEEDOR_NOMBRE.name', 'sec-ec-ce-proformas', 'TEXT', 'TEXT_INPUT', 1, TRUE, 'system'),
('fld-ec-prov-ruc', 'PROVEEDOR_RUC', 'cp.fields.PROVEEDOR_RUC.name', 'sec-ec-ce-proformas', 'TEXT', 'TAX_ID_LOOKUP', 2, TRUE, 'system'),
('fld-ec-prov-precio', 'PRECIO_PROFORMA', 'cp.fields.PRECIO_PROFORMA.name', 'sec-ec-ce-proformas', 'CURRENCY', 'CURRENCY_INPUT', 3, TRUE, 'system'),
('fld-ec-prov-fecha', 'FECHA_PROFORMA', 'cp.fields.FECHA_PROFORMA.name', 'sec-ec-ce-proformas', 'DATE', 'DATE_PICKER', 4, TRUE, 'system');

-- STEP 4: DOCUMENTOS
INSERT IGNORE INTO cp_process_step_config (id, step_code, step_name_key, step_description_key, country_code, process_type, phase, display_order, icon, color, show_in_wizard, show_in_expert, is_active, created_by)
VALUES ('step-ec-ce-docs', 'DOCUMENTOS', 'cp.steps.DOCUMENTOS.name', 'cp.steps.DOCUMENTOS.description', 'EC', 'CE', 'PREPARATORIA', 4, 'FiFile', 'orange', TRUE, TRUE, TRUE, 'system');

INSERT IGNORE INTO cp_process_section_config (id, section_code, section_name_key, step_id, section_type, display_order, columns_count, is_active, created_by)
VALUES ('sec-ec-ce-docs', 'DOCUMENTOS_HABILITANTES', 'cp.sections.DOCUMENTOS_HABILITANTES.name', 'step-ec-ce-docs', 'SINGLE', 1, 1, TRUE, 'system');

INSERT IGNORE INTO cp_process_field_config (id, field_code, field_name_key, section_id, field_type, component_type, display_order, is_required, legal_reference, created_by) VALUES
('fld-ec-doc-cdp', 'DOC_CERTIFICACION_PRESUPUESTARIA', 'cp.fields.DOC_CERTIFICACION_PRESUPUESTARIA.name', 'sec-ec-ce-docs', 'TEXT', 'FILE_UPLOAD', 1, TRUE, 'Art. 24 LOSNCP', 'system'),
('fld-ec-doc-pac', 'DOC_CERTIFICACION_PAC', 'cp.fields.DOC_CERTIFICACION_PAC.name', 'sec-ec-ce-docs', 'TEXT', 'FILE_UPLOAD', 2, TRUE, 'Art. 22 LOSNCP', 'system'),
('fld-ec-doc-tdr', 'DOC_TERMINOS_REFERENCIA', 'cp.fields.DOC_TERMINOS_REFERENCIA.name', 'sec-ec-ce-docs', 'TEXT', 'FILE_UPLOAD', 3, TRUE, 'Art. 23 RGLOSNCP', 'system'),
('fld-ec-doc-estudio', 'DOC_ESTUDIO_MERCADO', 'cp.fields.DOC_ESTUDIO_MERCADO.name', 'sec-ec-ce-docs', 'TEXT', 'FILE_UPLOAD', 4, TRUE, NULL, 'system'),
('fld-ec-doc-resol', 'DOC_RESOLUCION_INICIO', 'cp.fields.DOC_RESOLUCION_INICIO.name', 'sec-ec-ce-docs', 'TEXT', 'FILE_UPLOAD', 5, FALSE, 'Art. 36 LOSNCP', 'system');
