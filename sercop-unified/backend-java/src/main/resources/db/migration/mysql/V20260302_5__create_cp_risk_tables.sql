-- ============================================================================
-- V20260302_5: Matriz de Riesgos mejorada
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_risk_assessment (
    id CHAR(36) PRIMARY KEY,
    process_id CHAR(36) NOT NULL COMMENT 'FK a cp_process_data.process_id',
    assessment_date DATE NOT NULL,
    overall_score INT DEFAULT 0 COMMENT '0-100',
    risk_level VARCHAR(20) DEFAULT 'LOW',
    ai_analysis_id VARCHAR(36) COMMENT 'FK a cp_ai_analysis_history.id',
    assessor VARCHAR(100),
    status VARCHAR(30) DEFAULT 'BORRADOR' COMMENT 'BORRADOR, REVISADO, APROBADO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_risk_assess_process (process_id),
    INDEX idx_risk_assess_level (risk_level),
    INDEX idx_risk_assess_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_risk_item (
    id CHAR(36) PRIMARY KEY,
    assessment_id CHAR(36) NOT NULL,
    indicator_code VARCHAR(50) NOT NULL,
    probability INT DEFAULT 1 COMMENT '1-5',
    impact INT DEFAULT 1 COMMENT '1-5',
    risk_score INT COMMENT 'probability * impact',
    detected BOOLEAN DEFAULT FALSE,
    evidence TEXT,
    mitigation_plan TEXT,
    responsible VARCHAR(200),
    allocation VARCHAR(30) DEFAULT 'ESTADO' COMMENT 'ESTADO, CONTRATISTA, COMPARTIDO',
    status VARCHAR(30) DEFAULT 'IDENTIFICADO' COMMENT 'IDENTIFICADO, MITIGADO, ACEPTADO, TRANSFERIDO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_risk_item_assess (assessment_id),
    INDEX idx_risk_item_indicator (indicator_code),
    INDEX idx_risk_item_detected (detected),
    CONSTRAINT fk_risk_item_assess FOREIGN KEY (assessment_id) REFERENCES cp_risk_assessment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
