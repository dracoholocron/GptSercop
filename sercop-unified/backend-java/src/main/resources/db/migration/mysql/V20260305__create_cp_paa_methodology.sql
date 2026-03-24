-- ============================================================================
-- V20260305: PAA Methodology - Fases, prompts y mapeos configurables
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_paa_methodology (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  source_framework VARCHAR(200) COMMENT 'Marco de referencia: CIPS, Kearney, etc.',
  country_code VARCHAR(5) DEFAULT 'EC',
  welcome_message TEXT COMMENT 'Mensaje de bienvenida del wizard',
  total_phases INT DEFAULT 0 COMMENT 'Numero total de fases',
  is_default BOOLEAN DEFAULT FALSE COMMENT 'Metodologia por defecto si usuario no elige',
  is_active BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_methodology_active (is_active, country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_paa_methodology_phase (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  methodology_id BIGINT NOT NULL,
  phase_number INT NOT NULL,
  phase_code VARCHAR(50) NOT NULL,
  phase_name VARCHAR(200) NOT NULL,
  phase_subtitle VARCHAR(300),
  icon VARCHAR(50) COMMENT 'Icon component name: FiTarget, FiDollarSign, etc.',
  color VARCHAR(30) COMMENT 'Color scheme: purple, green, blue, etc.',
  guidance_prompt_key VARCHAR(100) COMMENT 'FK ai_prompt_config.prompt_key for guidance',
  validation_prompt_key VARCHAR(100) COMMENT 'FK ai_prompt_config.prompt_key for validation',
  extraction_prompt_key VARCHAR(100) COMMENT 'FK ai_prompt_config.prompt_key for data extraction',
  confirmation_prompt_key VARCHAR(100) COMMENT 'FK ai_prompt_config.prompt_key for confirmation',
  result_display_type VARCHAR(30) DEFAULT 'BADGES' COMMENT 'BADGES, STATS, TABLE',
  result_template TEXT COMMENT 'Template for rendering results',
  input_type VARCHAR(30) DEFAULT 'TEXT' COMMENT 'TEXT, TEXTAREA, OPTIONS, NONE',
  input_placeholder VARCHAR(300) COMMENT 'Placeholder for input field',
  options_source VARCHAR(200) COMMENT 'Catalog code or JSON for dynamic options',
  is_required BOOLEAN DEFAULT TRUE,
  can_skip BOOLEAN DEFAULT FALSE,
  auto_advance BOOLEAN DEFAULT FALSE COMMENT 'Auto advance to next phase after AI response',
  requires_ai_call BOOLEAN DEFAULT TRUE COMMENT 'Whether this phase calls AI',
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (methodology_id) REFERENCES cp_paa_methodology(id),
  UNIQUE KEY uk_phase (methodology_id, phase_code),
  INDEX idx_phase_methodology (methodology_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_paa_phase_field_mapping (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phase_id BIGINT NOT NULL,
  field_code VARCHAR(100) NOT NULL COMMENT 'Maps to cp_process_field_config.field_code',
  extraction_path VARCHAR(200) COMMENT 'JSON path to extract from phase results',
  transform_type VARCHAR(30) DEFAULT 'DIRECT' COMMENT 'DIRECT, CONCATENATE, LOOKUP, SUM',
  default_value VARCHAR(500),
  display_order INT DEFAULT 0,
  FOREIGN KEY (phase_id) REFERENCES cp_paa_methodology_phase(id),
  INDEX idx_mapping_phase (phase_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
