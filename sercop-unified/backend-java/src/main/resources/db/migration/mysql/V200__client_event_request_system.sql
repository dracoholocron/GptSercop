-- =============================================================================
-- V200: Client Event Request System
-- =============================================================================
-- Purpose: Enable clients to request post-issuance events through the portal
-- =============================================================================

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v200;
DELIMITER //
CREATE PROCEDURE add_col_if_not_exists_v200(
    IN p_table VARCHAR(100),
    IN p_column VARCHAR(100),
    IN p_definition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Helper procedure to add index if not exists
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v200;
DELIMITER //
CREATE PROCEDURE add_idx_if_not_exists_v200(
    IN p_table VARCHAR(100),
    IN p_index VARCHAR(100),
    IN p_columns VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND INDEX_NAME = p_index
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, '(', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- -----------------------------------------------------------------------------
-- 1. Add is_client_requestable column to event_type_config_readmodel
-- -----------------------------------------------------------------------------
CALL add_col_if_not_exists_v200('event_type_config_readmodel', 'is_client_requestable', 'TINYINT(1) DEFAULT 0');
CALL add_idx_if_not_exists_v200('event_type_config_readmodel', 'idx_event_type_client_requestable', 'is_client_requestable, operation_type, is_active');

-- -----------------------------------------------------------------------------
-- 2. Create client_event_request table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_event_request (
    request_id VARCHAR(36) PRIMARY KEY,
    operation_id VARCHAR(36) NOT NULL,
    operation_reference VARCHAR(50),
    event_code VARCHAR(50) NOT NULL,
    event_category VARCHAR(50),
    client_id BIGINT NOT NULL,
    client_name VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    justification TEXT,
    requested_changes JSON,
    current_amount DECIMAL(18,2),
    new_amount DECIMAL(18,2),
    current_expiry_date DATE,
    new_expiry_date DATE,
    cancellation_reason TEXT,
    payment_amount DECIMAL(18,2),
    debit_account_number VARCHAR(50),
    requires_approval TINYINT(1) DEFAULT 1,
    approval_levels INT DEFAULT 1,
    current_approval_level INT DEFAULT 0,
    requested_by VARCHAR(100),
    requested_by_name VARCHAR(200),
    requested_at DATETIME NOT NULL,
    processed_by VARCHAR(100),
    processed_by_name VARCHAR(200),
    processed_at DATETIME,
    rejection_reason TEXT,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cer_operation (operation_id),
    INDEX idx_cer_client (client_id),
    INDEX idx_cer_status (status),
    INDEX idx_cer_event (event_code),
    INDEX idx_cer_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Configure which events are client-requestable
-- -----------------------------------------------------------------------------
UPDATE event_type_config_readmodel
SET is_client_requestable = 1
WHERE operation_type = 'LC_IMPORT'
AND event_code IN ('AMEND', 'CLOSE', 'PAYMENT')
AND is_active = 1;

UPDATE event_type_config_readmodel
SET is_client_requestable = 1
WHERE operation_type = 'LC_EXPORT'
AND event_code IN ('AMEND', 'CLOSE', 'PAYMENT')
AND is_active = 1;

UPDATE event_type_config_readmodel
SET is_client_requestable = 1
WHERE operation_type = 'GUARANTEE'
AND event_code IN ('AMEND', 'EXTEND', 'RELEASE', 'CLAIM')
AND is_active = 1;

UPDATE event_type_config_readmodel
SET is_client_requestable = 1
WHERE operation_type = 'COLLECTION'
AND event_code IN ('PAYMENT', 'CLOSE')
AND is_active = 1;

-- -----------------------------------------------------------------------------
-- 4. Add event_source column
-- -----------------------------------------------------------------------------
CALL add_col_if_not_exists_v200('event_type_config_readmodel', 'event_source', "VARCHAR(30) DEFAULT 'BACKOFFICE'");
CALL add_idx_if_not_exists_v200('event_type_config_readmodel', 'idx_event_type_source', 'event_source, operation_type, is_active');

UPDATE event_type_config_readmodel
SET event_source = 'CLIENT_AND_BACKOFFICE'
WHERE is_client_requestable = 1;

-- -----------------------------------------------------------------------------
-- 5. Create form config table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_event_form_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_code VARCHAR(50) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    field_label_es VARCHAR(100) NOT NULL,
    field_label_en VARCHAR(100) NOT NULL,
    field_type VARCHAR(30) NOT NULL DEFAULT 'text',
    is_required TINYINT(1) DEFAULT 0,
    placeholder_es VARCHAR(200),
    placeholder_en VARCHAR(200),
    validation_regex VARCHAR(200),
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_event_form_field (event_code, operation_type, field_name),
    INDEX idx_event_form_event (event_code, operation_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Insert form configuration
-- -----------------------------------------------------------------------------
INSERT INTO client_event_form_config (event_code, operation_type, field_name, field_label_es, field_label_en, field_type, is_required, placeholder_es, placeholder_en, display_order)
VALUES
('AMEND', 'LC_IMPORT', 'justification', 'Justificación', 'Justification', 'textarea', 1, 'Explique el motivo de la enmienda...', 'Explain the reason for the amendment...', 1),
('AMEND', 'LC_IMPORT', 'newAmount', 'Nuevo Monto', 'New Amount', 'number', 0, NULL, NULL, 2),
('AMEND', 'LC_IMPORT', 'newExpiryDate', 'Nueva Fecha de Vencimiento', 'New Expiry Date', 'date', 0, NULL, NULL, 3),
('AMEND', 'LC_EXPORT', 'justification', 'Justificación', 'Justification', 'textarea', 1, 'Explique el motivo de la enmienda...', 'Explain the reason for the amendment...', 1),
('AMEND', 'LC_EXPORT', 'newAmount', 'Nuevo Monto', 'New Amount', 'number', 0, NULL, NULL, 2),
('AMEND', 'LC_EXPORT', 'newExpiryDate', 'Nueva Fecha de Vencimiento', 'New Expiry Date', 'date', 0, NULL, NULL, 3),
('AMEND', 'GUARANTEE', 'justification', 'Justificación', 'Justification', 'textarea', 1, 'Explique el motivo de la enmienda...', 'Explain the reason for the amendment...', 1),
('AMEND', 'GUARANTEE', 'newAmount', 'Nuevo Monto', 'New Amount', 'number', 0, NULL, NULL, 2),
('EXTEND', 'GUARANTEE', 'justification', 'Justificación', 'Justification', 'textarea', 1, 'Explique el motivo de la extensión...', 'Explain the reason for the extension...', 1),
('EXTEND', 'GUARANTEE', 'newExpiryDate', 'Nueva Fecha de Vencimiento', 'New Expiry Date', 'date', 1, NULL, NULL, 2),
('CLOSE', 'LC_IMPORT', 'cancellationReason', 'Motivo de Cancelación', 'Cancellation Reason', 'textarea', 1, 'Indique el motivo del cierre...', 'Indicate the reason for closing...', 1),
('CLOSE', 'LC_EXPORT', 'cancellationReason', 'Motivo de Cancelación', 'Cancellation Reason', 'textarea', 1, 'Indique el motivo del cierre...', 'Indicate the reason for closing...', 1),
('CLOSE', 'COLLECTION', 'cancellationReason', 'Motivo de Cancelación', 'Cancellation Reason', 'textarea', 1, 'Indique el motivo del cierre...', 'Indicate the reason for closing...', 1),
('RELEASE', 'GUARANTEE', 'cancellationReason', 'Motivo de Liberación', 'Release Reason', 'textarea', 1, 'Indique el motivo de la liberación...', 'Indicate the reason for releasing...', 1),
('PAYMENT', 'LC_IMPORT', 'paymentAmount', 'Monto a Pagar', 'Payment Amount', 'number', 1, NULL, NULL, 1),
('PAYMENT', 'LC_IMPORT', 'debitAccountNumber', 'Cuenta de Débito', 'Debit Account', 'text', 1, 'Número de cuenta...', 'Account number...', 2),
('PAYMENT', 'LC_IMPORT', 'justification', 'Instrucciones', 'Instructions', 'textarea', 0, 'Instrucciones adicionales...', 'Additional instructions...', 3),
('PAYMENT', 'LC_EXPORT', 'paymentAmount', 'Monto a Pagar', 'Payment Amount', 'number', 1, NULL, NULL, 1),
('PAYMENT', 'LC_EXPORT', 'justification', 'Instrucciones', 'Instructions', 'textarea', 0, 'Instrucciones adicionales...', 'Additional instructions...', 2),
('PAYMENT', 'COLLECTION', 'paymentAmount', 'Monto a Pagar', 'Payment Amount', 'number', 1, NULL, NULL, 1),
('PAYMENT', 'COLLECTION', 'debitAccountNumber', 'Cuenta de Débito', 'Debit Account', 'text', 1, 'Número de cuenta...', 'Account number...', 2),
('CLAIM', 'GUARANTEE', 'paymentAmount', 'Monto del Reclamo', 'Claim Amount', 'number', 1, NULL, NULL, 1),
('CLAIM', 'GUARANTEE', 'justification', 'Descripción del Reclamo', 'Claim Description', 'textarea', 1, 'Describa el reclamo y su fundamento...', 'Describe the claim and its basis...', 2)
ON DUPLICATE KEY UPDATE field_label_es = VALUES(field_label_es);

-- Cleanup helper procedures
DROP PROCEDURE IF EXISTS add_col_if_not_exists_v200;
DROP PROCEDURE IF EXISTS add_idx_if_not_exists_v200;
