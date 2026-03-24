-- ============================================================================
-- V20260305_4: PAA Workspace Colaborativo - Planes por Departamento
-- ============================================================================

-- PAA institucional (contenedor colaborativo)
CREATE TABLE IF NOT EXISTS cp_paa_workspace (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workspace_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Ej: PAA-2026-MINSA',
  entity_ruc VARCHAR(13) NOT NULL,
  entity_name VARCHAR(300) NOT NULL,
  fiscal_year INT NOT NULL,
  sector_code VARCHAR(50),
  methodology_id BIGINT COMMENT 'Metodologia seleccionada por el coordinador',
  coordinator_user_id VARCHAR(100) COMMENT 'Usuario que coordina y consolida',
  coordinator_user_name VARCHAR(200),
  total_budget DECIMAL(18,2),
  status VARCHAR(30) DEFAULT 'ABIERTO' COMMENT 'ABIERTO, EN_REVISION, CONSOLIDADO, APROBADO, PUBLICADO',
  consolidated_data JSON COMMENT 'PAA final consolidado de todos los departamentos',
  consolidated_paa_id CHAR(36) COMMENT 'FK al PAA final generado en cp_paa',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (methodology_id) REFERENCES cp_paa_methodology(id),
  UNIQUE KEY uk_workspace (entity_ruc, fiscal_year),
  INDEX idx_workspace_status (status),
  INDEX idx_workspace_coordinator (coordinator_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sub-plan por departamento
CREATE TABLE IF NOT EXISTS cp_paa_department_plan (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT NOT NULL,
  department_name VARCHAR(200) NOT NULL,
  department_code VARCHAR(50),
  assigned_user_id VARCHAR(100) COMMENT 'Responsable del departamento',
  assigned_user_name VARCHAR(200),
  department_budget DECIMAL(18,2),
  current_phase INT DEFAULT 0 COMMENT 'Fase actual en la metodologia',
  total_phases INT DEFAULT 7 COMMENT 'Total de fases de la metodologia asignada',
  phase_data JSON COMMENT '{"1": {...}, "2": {...}} datos recopilados por fase',
  items_data JSON COMMENT 'Items PAA del departamento',
  items_count INT DEFAULT 0,
  items_total_budget DECIMAL(18,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'PENDIENTE' COMMENT 'PENDIENTE, EN_PROGRESO, ENVIADO, APROBADO, RECHAZADO, CONSOLIDADO',
  rejection_reason TEXT,
  notes TEXT,
  submitted_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  approved_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES cp_paa_workspace(id) ON DELETE CASCADE,
  UNIQUE KEY uk_dept (workspace_id, department_code),
  INDEX idx_dept_workspace (workspace_id),
  INDEX idx_dept_status (status),
  INDEX idx_dept_user (assigned_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
