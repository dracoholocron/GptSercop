CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(36) PRIMARY KEY,
    aggregate_id VARCHAR(100),
    aggregate_type VARCHAR(20),
    operation_id VARCHAR(100),
    event_id VARCHAR(100),
    alert_id VARCHAR(100),
    original_file_name VARCHAR(500) NOT NULL,
    stored_file_name VARCHAR(100) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    storage_provider VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64),
    category_code VARCHAR(50) NOT NULL,
    subcategory_code VARCHAR(50),
    document_type_code VARCHAR(50) NOT NULL,
    tags TEXT,
    version INT NOT NULL DEFAULT 1,
    previous_version_id VARCHAR(36),
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    change_notes VARCHAR(1000),
    access_level VARCHAR(20) NOT NULL DEFAULT 'RESTRICTED',
    encryption_key VARCHAR(100),
    virus_scan_passed BOOLEAN,
    virus_scan_at DATETIME,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    modified_by VARCHAR(100),
    modified_at DATETIME,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_at DATETIME,
    INDEX idx_doc_operation (operation_id),
    INDEX idx_doc_event (event_id),
    INDEX idx_doc_alert (alert_id),
    INDEX idx_doc_category (category_code),
    INDEX idx_doc_type (document_type_code),
    INDEX idx_doc_uploaded_at (uploaded_at),
    INDEX idx_doc_is_latest (is_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_docs_alert_id := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'documents'
      AND column_name = 'alert_id'
);
SET @sql_docs_alert_id := IF(
    @has_docs_alert_id = 0,
    'ALTER TABLE documents ADD COLUMN alert_id VARCHAR(100)',
    'SELECT 1'
);
PREPARE stmt_docs_alert_id FROM @sql_docs_alert_id;
EXECUTE stmt_docs_alert_id;
DEALLOCATE PREPARE stmt_docs_alert_id;

SET @has_idx_doc_alert := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'documents'
      AND index_name = 'idx_doc_alert'
);
SET @sql_idx_doc_alert := IF(
    @has_idx_doc_alert = 0,
    'CREATE INDEX idx_doc_alert ON documents(alert_id)',
    'SELECT 1'
);
PREPARE stmt_idx_doc_alert FROM @sql_idx_doc_alert;
EXECUTE stmt_idx_doc_alert;
DEALLOCATE PREPARE stmt_idx_doc_alert;

SET @has_doc_rm_alert_id := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'document_readmodel'
      AND column_name = 'alert_id'
);
SET @sql_doc_rm_alert_id := IF(
    @has_doc_rm_alert_id = 0,
    'ALTER TABLE document_readmodel ADD COLUMN alert_id VARCHAR(100)',
    'SELECT 1'
);
PREPARE stmt_doc_rm_alert_id FROM @sql_doc_rm_alert_id;
EXECUTE stmt_doc_rm_alert_id;
DEALLOCATE PREPARE stmt_doc_rm_alert_id;

SET @has_idx_doc_rm_alert := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'document_readmodel'
      AND index_name = 'idx_doc_rm_alert'
);
SET @sql_idx_doc_rm_alert := IF(
    @has_idx_doc_rm_alert = 0,
    'CREATE INDEX idx_doc_rm_alert ON document_readmodel(alert_id)',
    'SELECT 1'
);
PREPARE stmt_idx_doc_rm_alert FROM @sql_idx_doc_rm_alert;
EXECUTE stmt_idx_doc_rm_alert;
DEALLOCATE PREPARE stmt_idx_doc_rm_alert;
