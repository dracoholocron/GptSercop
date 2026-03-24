-- =============================================================================
-- AI Extraction History Readmodel Table
-- Almacena el historial de extracciones de documentos con IA
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_extraction_history_readmodel (
    id VARCHAR(36) PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    message_type VARCHAR(10),
    provider VARCHAR(20) NOT NULL,
    model VARCHAR(50),
    fields_extracted INT DEFAULT 0,
    fields_approved INT DEFAULT 0,
    fields_rejected INT DEFAULT 0,
    fields_edited INT DEFAULT 0,
    processing_time_ms BIGINT,
    input_tokens INT,
    output_tokens INT,
    estimated_cost DECIMAL(10, 6),
    status VARCHAR(20) DEFAULT 'PENDING_REVIEW',
    raw_response TEXT,
    errors TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    operation_id BIGINT,

    INDEX idx_ai_extraction_message_type (message_type),
    INDEX idx_ai_extraction_provider (provider),
    INDEX idx_ai_extraction_status (status),
    INDEX idx_ai_extraction_created_at (created_at),
    INDEX idx_ai_extraction_created_by (created_by),
    INDEX idx_ai_extraction_operation_id (operation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios
ALTER TABLE ai_extraction_history_readmodel
    COMMENT = 'Historial de extracciones de documentos con IA';
