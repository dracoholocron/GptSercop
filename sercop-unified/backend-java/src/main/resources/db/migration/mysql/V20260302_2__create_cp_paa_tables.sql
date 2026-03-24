-- ============================================================================
-- V20260302_2: Plan Anual de Adquisiciones (PAA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_paa (
    id CHAR(36) PRIMARY KEY,
    entity_ruc VARCHAR(20) NOT NULL,
    entity_name VARCHAR(300) NOT NULL,
    country_code VARCHAR(3) NOT NULL DEFAULT 'EC',
    fiscal_year INT NOT NULL,
    version INT DEFAULT 1 COMMENT 'Se incrementa con reformas',
    status VARCHAR(30) DEFAULT 'BORRADOR' COMMENT 'BORRADOR, ENVIADO, APROBADO, REFORMADO',
    total_budget DECIMAL(15,2),
    approval_date DATE,
    approved_by VARCHAR(100),
    form_data JSON COMMENT 'Metadata adicional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uk_paa_entity_year (entity_ruc, fiscal_year, version),
    INDEX idx_paa_country (country_code, fiscal_year),
    INDEX idx_paa_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_paa_item (
    id CHAR(36) PRIMARY KEY,
    paa_id CHAR(36) NOT NULL,
    line_number INT NOT NULL,
    cpc_code VARCHAR(20),
    cpc_description VARCHAR(500),
    item_description VARCHAR(500) NOT NULL,
    process_type VARCHAR(30) NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL,
    budget_partition VARCHAR(50),
    funding_source VARCHAR(100),
    department VARCHAR(200) COMMENT 'Area solicitante',
    estimated_publication_date DATE,
    estimated_adjudication_date DATE,
    estimated_contract_duration_days INT,
    priority VARCHAR(10) DEFAULT 'MEDIUM' COMMENT 'HIGH, MEDIUM, LOW',
    status VARCHAR(30) DEFAULT 'PLANIFICADO' COMMENT 'PLANIFICADO, EN_PROCESO, COMPLETADO, CANCELADO',
    linked_process_id CHAR(36) COMMENT 'FK cuando se inicia el proceso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_paa_item_paa (paa_id),
    INDEX idx_paa_item_cpc (cpc_code),
    INDEX idx_paa_item_type (process_type),
    INDEX idx_paa_item_status (status),
    INDEX idx_paa_item_dept (department),
    CONSTRAINT fk_paa_item_paa FOREIGN KEY (paa_id) REFERENCES cp_paa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_paa_modification (
    id CHAR(36) PRIMARY KEY,
    paa_id CHAR(36) NOT NULL,
    modification_number INT NOT NULL,
    modification_date DATE NOT NULL,
    reason TEXT NOT NULL,
    items_added JSON,
    items_modified JSON,
    items_removed JSON,
    approved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_paa_mod_paa (paa_id),
    CONSTRAINT fk_paa_mod_paa FOREIGN KEY (paa_id) REFERENCES cp_paa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo: Prioridades PAA
INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_PRIORIDAD_PAA', 'Prioridades PAA', 'Niveles de prioridad para items del PAA', 1, NULL, TRUE, TRUE, 104, NOW(), 'system'
FROM custom_catalog_read_model
WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_PRIORIDAD_PAA');

SET @cp_prioridad_id = (SELECT id FROM custom_catalog_read_model WHERE code = 'CP_PRIORIDAD_PAA');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_PAA_HIGH', 'Alta', 'Prioridad alta - ejecutar primer trimestre', 2, @cp_prioridad_id, 'CP_PRIORIDAD_PAA', TRUE, TRUE, 1, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_PAA_HIGH');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_PAA_MEDIUM', 'Media', 'Prioridad media - ejecutar primer semestre', 2, @cp_prioridad_id, 'CP_PRIORIDAD_PAA', TRUE, TRUE, 2, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_PAA_MEDIUM');

INSERT INTO custom_catalog_read_model (id, code, name, description, level, parent_catalog_id, parent_catalog_code, active, is_system, display_order, created_at, created_by)
SELECT COALESCE(MAX(id), 0) + 1, 'CP_PAA_LOW', 'Baja', 'Prioridad baja - ejecutar segundo semestre', 2, @cp_prioridad_id, 'CP_PRIORIDAD_PAA', TRUE, TRUE, 3, NOW(), 'system'
FROM custom_catalog_read_model WHERE NOT EXISTS (SELECT 1 FROM custom_catalog_read_model WHERE code = 'CP_PAA_LOW');
