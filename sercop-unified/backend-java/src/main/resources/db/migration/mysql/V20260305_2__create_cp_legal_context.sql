-- ============================================================================
-- V20260305_2: Contexto Legal Dinamico, Entidades Conocidas, Umbrales
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_legal_context (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  context_code VARCHAR(100) NOT NULL UNIQUE,
  context_type VARCHAR(50) NOT NULL COMMENT 'LEY, REGLAMENTO, RESOLUCION, DECRETO, LINEAMIENTO, DIRECTRIZ',
  authority VARCHAR(200) COMMENT 'LOSNCP, SERCOP, Presidencia, etc.',
  title VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL COMMENT 'Resumen del articulo/resolucion',
  full_text LONGTEXT COMMENT 'Texto completo',
  article_number VARCHAR(50) COMMENT 'Art. 22, Art. 62, etc.',
  applicable_phases JSON COMMENT 'Fases donde aplica: ["CONTEXTO_INSTITUCIONAL", "CALENDARIZACION_VALIDACION"]',
  applicable_process_types JSON COMMENT 'Tipos de proceso: ["CP_PAA"] o null = todos',
  country_code VARCHAR(5) DEFAULT 'EC',
  effective_date DATE,
  expiry_date DATE COMMENT 'null = vigente indefinidamente',
  priority INT DEFAULT 0 COMMENT 'Mayor = mas relevante',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_legal_type (context_type),
  INDEX idx_legal_active (is_active, country_code),
  INDEX idx_legal_authority (authority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_known_entities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_name VARCHAR(300) NOT NULL,
  entity_ruc VARCHAR(13),
  entity_type VARCHAR(50) COMMENT 'MINISTERIO, GAD, EMPRESA_PUBLICA, UNIVERSIDAD, HOSPITAL, etc.',
  sector_code VARCHAR(50) COMMENT 'SALUD, EDUCACION, etc.',
  sector_label VARCHAR(100),
  parent_entity_id BIGINT COMMENT 'Jerarquia: Ministerio -> Subsecretaria',
  mission_summary TEXT,
  typical_departments JSON COMMENT '["Direccion Administrativa", "Direccion Financiera", ...]',
  country_code VARCHAR(5) DEFAULT 'EC',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_entity_id) REFERENCES cp_known_entities(id),
  UNIQUE KEY uk_entity (entity_ruc),
  INDEX idx_entity_type (entity_type),
  INDEX idx_entity_sector (sector_code),
  INDEX idx_entity_active (is_active, country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_procurement_thresholds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  country_code VARCHAR(5) DEFAULT 'EC',
  fiscal_year INT NOT NULL,
  pie_value DECIMAL(18,2) NOT NULL COMMENT 'Presupuesto Inicial del Estado',
  threshold_code VARCHAR(50) NOT NULL COMMENT 'INFIMA_CUANTIA, MENOR_CUANTIA, etc.',
  procedure_name VARCHAR(200) NOT NULL,
  min_coefficient DECIMAL(10,6) COMMENT 'Multiplicador PIE minimo',
  max_coefficient DECIMAL(10,6) COMMENT 'Multiplicador PIE maximo',
  min_value DECIMAL(18,2) COMMENT 'Valor calculado minimo',
  max_value DECIMAL(18,2) COMMENT 'Valor calculado maximo',
  applicable_types JSON COMMENT '["BIEN", "SERVICIO", "OBRA", "CONSULTORIA"]',
  legal_reference VARCHAR(200) COMMENT 'Art. 51 LOSNCP',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_threshold (country_code, fiscal_year, threshold_code),
  INDEX idx_threshold_year (fiscal_year, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos para PAA Methodology y Workspace
INSERT IGNORE INTO permission_read_model (code, name, description, module, created_at) VALUES
    ('CP_PAA_METHODOLOGY_VIEW', 'Ver Metodologias PAA', 'Permite ver metodologias de PAA configuradas', 'CP', NOW()),
    ('CP_PAA_WORKSPACE_VIEW', 'Ver Workspaces PAA', 'Permite ver workspaces colaborativos de PAA', 'CP', NOW()),
    ('CP_PAA_WORKSPACE_MANAGE', 'Gestionar Workspaces PAA', 'Permite crear y gestionar workspaces de PAA', 'CP', NOW()),
    ('CP_PAA_WORKSPACE_COORDINATE', 'Coordinar Workspaces PAA', 'Permite consolidar y aprobar planes departamentales', 'CP', NOW());

-- Assign to ADMIN role
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' AND p.code IN ('CP_PAA_METHODOLOGY_VIEW', 'CP_PAA_WORKSPACE_VIEW', 'CP_PAA_WORKSPACE_MANAGE', 'CP_PAA_WORKSPACE_COORDINATE');
