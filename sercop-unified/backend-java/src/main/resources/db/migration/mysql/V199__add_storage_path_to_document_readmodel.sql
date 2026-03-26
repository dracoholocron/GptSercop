-- =============================================================================
-- V199: Add storage_path and storage_provider to document_readmodel
-- =============================================================================
-- Purpose: Enable file existence validation in document queries
-- Note: CQRS architecture - document_entity is in eventstore, document_readmodel is in read DB
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_readmodel (
    document_id VARCHAR(36) PRIMARY KEY,
    operation_id VARCHAR(100),
    event_id VARCHAR(100),
    alert_id VARCHAR(100),
    original_file_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    formatted_file_size VARCHAR(50),
    category_code VARCHAR(50) NOT NULL,
    category_name_es VARCHAR(100),
    category_name_en VARCHAR(100),
    subcategory_code VARCHAR(50),
    document_type_code VARCHAR(50) NOT NULL,
    document_type_name_es VARCHAR(100),
    document_type_name_en VARCHAR(100),
    tags TEXT,
    version INT NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    change_notes VARCHAR(1000),
    storage_path VARCHAR(1000),
    storage_provider VARCHAR(20),
    access_level VARCHAR(20) NOT NULL DEFAULT 'RESTRICTED',
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_by_name VARCHAR(200),
    uploaded_at DATETIME NOT NULL,
    modified_by VARCHAR(100),
    modified_at DATETIME,
    can_preview BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    INDEX idx_doc_rm_operation (operation_id),
    INDEX idx_doc_rm_event (event_id),
    INDEX idx_doc_rm_alert (alert_id),
    INDEX idx_doc_rm_category (category_code),
    INDEX idx_doc_rm_type (document_type_code),
    INDEX idx_doc_rm_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_doc_rm_storage_path := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'document_readmodel'
      AND column_name = 'storage_path'
);
SET @sql_doc_rm_storage_path := IF(
    @has_doc_rm_storage_path = 0,
    'ALTER TABLE document_readmodel ADD COLUMN storage_path VARCHAR(1000) NULL',
    'SELECT 1'
);
PREPARE stmt_doc_rm_storage_path FROM @sql_doc_rm_storage_path;
EXECUTE stmt_doc_rm_storage_path;
DEALLOCATE PREPARE stmt_doc_rm_storage_path;

SET @has_doc_rm_storage_provider := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'document_readmodel'
      AND column_name = 'storage_provider'
);
SET @sql_doc_rm_storage_provider := IF(
    @has_doc_rm_storage_provider = 0,
    'ALTER TABLE document_readmodel ADD COLUMN storage_provider VARCHAR(20) NULL',
    'SELECT 1'
);
PREPARE stmt_doc_rm_storage_provider FROM @sql_doc_rm_storage_provider;
EXECUTE stmt_doc_rm_storage_provider;
DEALLOCATE PREPARE stmt_doc_rm_storage_provider;

SET @has_documents_table := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'documents'
);
SET @sql_doc_rm_backfill := IF(
    @has_documents_table > 0,
    'UPDATE document_readmodel rm INNER JOIN documents de ON rm.document_id = de.document_id SET rm.storage_path = de.storage_path, rm.storage_provider = de.storage_provider WHERE rm.storage_path IS NULL',
    'SELECT 1'
);
PREPARE stmt_doc_rm_backfill FROM @sql_doc_rm_backfill;
EXECUTE stmt_doc_rm_backfill;
DEALLOCATE PREPARE stmt_doc_rm_backfill;

SET @has_idx_doc_rm_storage_provider := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'document_readmodel'
      AND index_name = 'idx_doc_rm_storage_provider'
);
SET @sql_idx_doc_rm_storage_provider := IF(
    @has_idx_doc_rm_storage_provider = 0,
    'CREATE INDEX idx_doc_rm_storage_provider ON document_readmodel(storage_provider)',
    'SELECT 1'
);
PREPARE stmt_idx_doc_rm_storage_provider FROM @sql_idx_doc_rm_storage_provider;
EXECUTE stmt_idx_doc_rm_storage_provider;
DEALLOCATE PREPARE stmt_idx_doc_rm_storage_provider;
