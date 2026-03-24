-- ============================================================================
-- V20260302_3: Integración Presupuestaria (CDP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_budget_certificate (
    id CHAR(36) PRIMARY KEY,
    process_id CHAR(36) COMMENT 'FK a cp_process_data.process_id',
    paa_item_id CHAR(36) COMMENT 'FK a cp_paa_item.id',
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    certificate_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    budget_partition VARCHAR(50),
    funding_source VARCHAR(100),
    fiscal_year INT NOT NULL,
    status VARCHAR(30) DEFAULT 'SOLICITADO' COMMENT 'SOLICITADO, APROBADO, BLOQUEADO, LIBERADO, CANCELADO',
    erp_reference VARCHAR(100) COMMENT 'Referencia en sistema ERP',
    erp_response JSON COMMENT 'Respuesta del ERP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_budget_cert_process (process_id),
    INDEX idx_budget_cert_paa (paa_item_id),
    INDEX idx_budget_cert_status (status),
    INDEX idx_budget_cert_year (fiscal_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_budget_execution (
    id CHAR(36) PRIMARY KEY,
    certificate_id CHAR(36) NOT NULL,
    execution_type VARCHAR(30) NOT NULL COMMENT 'COMPROMISO, DEVENGADO, PAGO',
    amount DECIMAL(15,2) NOT NULL,
    execution_date DATE NOT NULL,
    document_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_budget_exec_cert (certificate_id),
    INDEX idx_budget_exec_type (execution_type),
    CONSTRAINT fk_budget_exec_cert FOREIGN KEY (certificate_id) REFERENCES cp_budget_certificate(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
