-- =============================================================================
-- Migration V192: Internal Processing Workflow
-- Configures the internal bank processing steps for client requests
-- Steps: Recepcion -> Validacion -> Compliance -> Aprobacion -> Comisiones -> Registro -> Finalizado
-- Uses existing event framework tables - no new tables created
-- =============================================================================

-- ============================================
-- 0. Clean up existing INTERNAL_PROCESSING data (idempotent)
-- ============================================
DELETE FROM event_flow_config_readmodel WHERE operation_type = 'INTERNAL_PROCESSING';
DELETE FROM event_type_config_readmodel WHERE operation_type = 'INTERNAL_PROCESSING';

-- ============================================
-- 1. Event Types for Internal Processing (Spanish)
-- ============================================

INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
-- Step 1: Recepcion (Reception)
('INTERNAL_RECEPCION', 'INTERNAL_PROCESSING', 'es', 'Recepción',
 'Solicitud recibida en el área de procesamiento',
 'La solicitud ha sido recibida y está lista para ser procesada por el equipo interno del banco.',
 NULL, NULL, '["SUBMITTED"]', '["ACTIVE"]', 'RECEPCION', 'ACTIVE',
 'FiClipboard', 'blue', 1,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 2: Validacion (Validation)
('INTERNAL_VALIDACION', 'INTERNAL_PROCESSING', 'es', 'Validación',
 'Validación de datos y documentos',
 'Se verifican todos los datos de la solicitud y se validan los documentos adjuntos.',
 NULL, NULL, '["RECEPCION"]', '["ACTIVE"]', 'VALIDACION', 'ACTIVE',
 'FiUserCheck', 'yellow', 2,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 3: Compliance
('INTERNAL_COMPLIANCE', 'INTERNAL_PROCESSING', 'es', 'Compliance',
 'Revisión de cumplimiento regulatorio',
 'Se realiza la verificación de compliance, AML, KYC y listas de control.',
 NULL, NULL, '["VALIDACION"]', '["ACTIVE"]', 'COMPLIANCE', 'ACTIVE',
 'FiShield', 'purple', 3,
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Step 4: Aprobacion (Approval)
('INTERNAL_APROBACION', 'INTERNAL_PROCESSING', 'es', 'Aprobación',
 'Aprobación por nivel autorizado',
 'La solicitud es revisada y aprobada por el nivel de autorización correspondiente.',
 NULL, NULL, '["COMPLIANCE"]', '["ACTIVE"]', 'APROBACION', 'ACTIVE',
 'FiCheckCircle', 'orange', 4,
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Step 5: Comisiones (Commissions)
('INTERNAL_COMISIONES', 'INTERNAL_PROCESSING', 'es', 'Comisiones',
 'Cálculo y aplicación de comisiones',
 'Se calculan las comisiones aplicables y se preparan los cargos bancarios.',
 NULL, NULL, '["APROBACION"]', '["ACTIVE"]', 'COMISIONES', 'ACTIVE',
 'FiDollarSign', 'teal', 5,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 6: Registro (Registration)
('INTERNAL_REGISTRO', 'INTERNAL_PROCESSING', 'es', 'Registro',
 'Registro de la operación en el sistema',
 'Se crea la operación en Global CMX y se registran los movimientos contables.',
 NULL, NULL, '["COMISIONES"]', '["ACTIVE"]', 'REGISTRO', 'ACTIVE',
 'FiDatabase', 'indigo', 6,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 7: Finalizado (Completed)
('INTERNAL_FINALIZADO', 'INTERNAL_PROCESSING', 'es', 'Finalizado',
 'Procesamiento interno completado',
 'El procesamiento interno ha sido completado. La operación está lista.',
 NULL, NULL, '["REGISTRO"]', '["ACTIVE"]', 'FINALIZADO', 'COMPLETED',
 'FiCheck', 'green', 7,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step: Rechazado (Rejected) - Can happen from any step
('INTERNAL_RECHAZADO', 'INTERNAL_PROCESSING', 'es', 'Rechazado',
 'Solicitud rechazada en el proceso interno',
 'La solicitud ha sido rechazada durante el procesamiento interno.',
 NULL, NULL, '["RECEPCION", "VALIDACION", "COMPLIANCE", "APROBACION", "COMISIONES"]', '["ACTIVE"]', 'RECHAZADO', 'REJECTED',
 'FiX', 'red', 8,
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Step: Devuelto (Returned) - Return to client for more info
('INTERNAL_DEVUELTO', 'INTERNAL_PROCESSING', 'es', 'Devuelto',
 'Solicitud devuelta al cliente',
 'La solicitud ha sido devuelta al cliente para corrección o información adicional.',
 NULL, NULL, '["RECEPCION", "VALIDACION", "COMPLIANCE"]', '["ACTIVE"]', 'DEVUELTO', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 9,
 TRUE, FALSE, FALSE, NOW(), NOW());

-- ============================================
-- 2. Event Types for Internal Processing (English)
-- ============================================

INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
-- Step 1: Reception
('INTERNAL_RECEPCION', 'INTERNAL_PROCESSING', 'en', 'Reception',
 'Request received in processing area',
 'The request has been received and is ready to be processed by the bank internal team.',
 NULL, NULL, '["SUBMITTED"]', '["ACTIVE"]', 'RECEPCION', 'ACTIVE',
 'FiClipboard', 'blue', 1,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 2: Validation
('INTERNAL_VALIDACION', 'INTERNAL_PROCESSING', 'en', 'Validation',
 'Data and document validation',
 'All request data is verified and attached documents are validated.',
 NULL, NULL, '["RECEPCION"]', '["ACTIVE"]', 'VALIDACION', 'ACTIVE',
 'FiUserCheck', 'yellow', 2,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 3: Compliance
('INTERNAL_COMPLIANCE', 'INTERNAL_PROCESSING', 'en', 'Compliance',
 'Regulatory compliance review',
 'Compliance verification is performed: AML, KYC and control lists.',
 NULL, NULL, '["VALIDACION"]', '["ACTIVE"]', 'COMPLIANCE', 'ACTIVE',
 'FiShield', 'purple', 3,
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Step 4: Approval
('INTERNAL_APROBACION', 'INTERNAL_PROCESSING', 'en', 'Approval',
 'Authorization level approval',
 'The request is reviewed and approved by the corresponding authorization level.',
 NULL, NULL, '["COMPLIANCE"]', '["ACTIVE"]', 'APROBACION', 'ACTIVE',
 'FiCheckCircle', 'orange', 4,
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Step 5: Commissions
('INTERNAL_COMISIONES', 'INTERNAL_PROCESSING', 'en', 'Commissions',
 'Commission calculation and application',
 'Applicable commissions are calculated and bank charges are prepared.',
 NULL, NULL, '["APROBACION"]', '["ACTIVE"]', 'COMISIONES', 'ACTIVE',
 'FiDollarSign', 'teal', 5,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 6: Registration
('INTERNAL_REGISTRO', 'INTERNAL_PROCESSING', 'en', 'Registration',
 'Operation registration in the system',
 'The operation is created in Global CMX and accounting entries are recorded.',
 NULL, NULL, '["COMISIONES"]', '["ACTIVE"]', 'REGISTRO', 'ACTIVE',
 'FiDatabase', 'indigo', 6,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step 7: Completed
('INTERNAL_FINALIZADO', 'INTERNAL_PROCESSING', 'en', 'Completed',
 'Internal processing completed',
 'Internal processing has been completed. The operation is ready.',
 NULL, NULL, '["REGISTRO"]', '["ACTIVE"]', 'FINALIZADO', 'COMPLETED',
 'FiCheck', 'green', 7,
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Step: Rejected
('INTERNAL_RECHAZADO', 'INTERNAL_PROCESSING', 'en', 'Rejected',
 'Request rejected in internal process',
 'The request has been rejected during internal processing.',
 NULL, NULL, '["RECEPCION", "VALIDACION", "COMPLIANCE", "APROBACION", "COMISIONES"]', '["ACTIVE"]', 'RECHAZADO', 'REJECTED',
 'FiX', 'red', 8,
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Step: Returned
('INTERNAL_DEVUELTO', 'INTERNAL_PROCESSING', 'en', 'Returned',
 'Request returned to client',
 'The request has been returned to the client for correction or additional information.',
 NULL, NULL, '["RECEPCION", "VALIDACION", "COMPLIANCE"]', '["ACTIVE"]', 'DEVUELTO', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 9,
 TRUE, FALSE, FALSE, NOW(), NOW());

-- ============================================
-- 3. Internal Processing Flow Configurations (Spanish)
-- ============================================

INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    conditions, is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
-- Initial: Start -> Recepcion
('INTERNAL_PROCESSING', NULL, 'SUBMITTED', 'INTERNAL_RECEPCION',
 NULL, TRUE, FALSE, 1, 'es',
 'Iniciar Recepción', 'Marcar solicitud como recibida en el área de procesamiento', TRUE),

-- Recepcion -> Validacion
('INTERNAL_PROCESSING', 'INTERNAL_RECEPCION', 'RECEPCION', 'INTERNAL_VALIDACION',
 NULL, TRUE, FALSE, 2, 'es',
 'Pasar a Validación', 'Enviar solicitud para validación de datos y documentos', TRUE),

-- Recepcion -> Devuelto (optional)
('INTERNAL_PROCESSING', 'INTERNAL_RECEPCION', 'RECEPCION', 'INTERNAL_DEVUELTO',
 NULL, FALSE, TRUE, 3, 'es',
 'Devolver al Cliente', 'Devolver solicitud al cliente para corrección', TRUE),

-- Validacion -> Compliance
('INTERNAL_PROCESSING', 'INTERNAL_VALIDACION', 'VALIDACION', 'INTERNAL_COMPLIANCE',
 NULL, TRUE, FALSE, 4, 'es',
 'Pasar a Compliance', 'Enviar solicitud para revisión de cumplimiento', TRUE),

-- Validacion -> Devuelto (optional)
('INTERNAL_PROCESSING', 'INTERNAL_VALIDACION', 'VALIDACION', 'INTERNAL_DEVUELTO',
 NULL, FALSE, TRUE, 5, 'es',
 'Devolver al Cliente', 'Devolver solicitud al cliente por datos incorrectos', TRUE),

-- Validacion -> Rechazado (optional)
('INTERNAL_PROCESSING', 'INTERNAL_VALIDACION', 'VALIDACION', 'INTERNAL_RECHAZADO',
 NULL, FALSE, TRUE, 6, 'es',
 'Rechazar Solicitud', 'Rechazar solicitud por incumplimiento de requisitos', TRUE),

-- Compliance -> Aprobacion
('INTERNAL_PROCESSING', 'INTERNAL_COMPLIANCE', 'COMPLIANCE', 'INTERNAL_APROBACION',
 NULL, TRUE, FALSE, 7, 'es',
 'Pasar a Aprobación', 'Enviar solicitud para aprobación por nivel autorizado', TRUE),

-- Compliance -> Devuelto (optional)
('INTERNAL_PROCESSING', 'INTERNAL_COMPLIANCE', 'COMPLIANCE', 'INTERNAL_DEVUELTO',
 NULL, FALSE, TRUE, 8, 'es',
 'Devolver al Cliente', 'Devolver solicitud al cliente por temas de compliance', TRUE),

-- Compliance -> Rechazado (optional)
('INTERNAL_PROCESSING', 'INTERNAL_COMPLIANCE', 'COMPLIANCE', 'INTERNAL_RECHAZADO',
 NULL, FALSE, TRUE, 9, 'es',
 'Rechazar por Compliance', 'Rechazar solicitud por incumplimiento de compliance', TRUE),

-- Aprobacion -> Comisiones
('INTERNAL_PROCESSING', 'INTERNAL_APROBACION', 'APROBACION', 'INTERNAL_COMISIONES',
 NULL, TRUE, FALSE, 10, 'es',
 'Aprobar y Calcular Comisiones', 'Aprobar solicitud y pasar a cálculo de comisiones', TRUE),

-- Aprobacion -> Rechazado (optional)
('INTERNAL_PROCESSING', 'INTERNAL_APROBACION', 'APROBACION', 'INTERNAL_RECHAZADO',
 NULL, FALSE, TRUE, 11, 'es',
 'Rechazar Solicitud', 'Rechazar solicitud en etapa de aprobación', TRUE),

-- Comisiones -> Registro
('INTERNAL_PROCESSING', 'INTERNAL_COMISIONES', 'COMISIONES', 'INTERNAL_REGISTRO',
 NULL, TRUE, FALSE, 12, 'es',
 'Registrar Operación', 'Crear operación en Global CMX', TRUE),

-- Registro -> Finalizado
('INTERNAL_PROCESSING', 'INTERNAL_REGISTRO', 'REGISTRO', 'INTERNAL_FINALIZADO',
 NULL, TRUE, FALSE, 13, 'es',
 'Finalizar Proceso', 'Completar el procesamiento interno', TRUE);

-- ============================================
-- 4. Internal Processing Flow Configurations (English)
-- ============================================

INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    conditions, is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
-- Initial: Start -> Reception
('INTERNAL_PROCESSING', NULL, 'SUBMITTED', 'INTERNAL_RECEPCION',
 NULL, TRUE, FALSE, 1, 'en',
 'Start Reception', 'Mark request as received in processing area', TRUE),

-- Reception -> Validation
('INTERNAL_PROCESSING', 'INTERNAL_RECEPCION', 'RECEPCION', 'INTERNAL_VALIDACION',
 NULL, TRUE, FALSE, 2, 'en',
 'Send to Validation', 'Send request for data and document validation', TRUE),

-- Reception -> Returned (optional)
('INTERNAL_PROCESSING', 'INTERNAL_RECEPCION', 'RECEPCION', 'INTERNAL_DEVUELTO',
 NULL, FALSE, TRUE, 3, 'en',
 'Return to Client', 'Return request to client for correction', TRUE),

-- Validation -> Compliance
('INTERNAL_PROCESSING', 'INTERNAL_VALIDACION', 'VALIDACION', 'INTERNAL_COMPLIANCE',
 NULL, TRUE, FALSE, 4, 'en',
 'Send to Compliance', 'Send request for compliance review', TRUE),

-- Validation -> Returned (optional)
('INTERNAL_PROCESSING', 'INTERNAL_VALIDACION', 'VALIDACION', 'INTERNAL_DEVUELTO',
 NULL, FALSE, TRUE, 5, 'en',
 'Return to Client', 'Return request to client for incorrect data', TRUE),

-- Validation -> Rejected (optional)
('INTERNAL_PROCESSING', 'INTERNAL_VALIDACION', 'VALIDACION', 'INTERNAL_RECHAZADO',
 NULL, FALSE, TRUE, 6, 'en',
 'Reject Request', 'Reject request for not meeting requirements', TRUE),

-- Compliance -> Approval
('INTERNAL_PROCESSING', 'INTERNAL_COMPLIANCE', 'COMPLIANCE', 'INTERNAL_APROBACION',
 NULL, TRUE, FALSE, 7, 'en',
 'Send to Approval', 'Send request for authorized level approval', TRUE),

-- Compliance -> Returned (optional)
('INTERNAL_PROCESSING', 'INTERNAL_COMPLIANCE', 'COMPLIANCE', 'INTERNAL_DEVUELTO',
 NULL, FALSE, TRUE, 8, 'en',
 'Return to Client', 'Return request to client for compliance issues', TRUE),

-- Compliance -> Rejected (optional)
('INTERNAL_PROCESSING', 'INTERNAL_COMPLIANCE', 'COMPLIANCE', 'INTERNAL_RECHAZADO',
 NULL, FALSE, TRUE, 9, 'en',
 'Reject for Compliance', 'Reject request for compliance failure', TRUE),

-- Approval -> Commissions
('INTERNAL_PROCESSING', 'INTERNAL_APROBACION', 'APROBACION', 'INTERNAL_COMISIONES',
 NULL, TRUE, FALSE, 10, 'en',
 'Approve and Calculate Commissions', 'Approve request and proceed to commission calculation', TRUE),

-- Approval -> Rejected (optional)
('INTERNAL_PROCESSING', 'INTERNAL_APROBACION', 'APROBACION', 'INTERNAL_RECHAZADO',
 NULL, FALSE, TRUE, 11, 'en',
 'Reject Request', 'Reject request at approval stage', TRUE),

-- Commissions -> Registration
('INTERNAL_PROCESSING', 'INTERNAL_COMISIONES', 'COMISIONES', 'INTERNAL_REGISTRO',
 NULL, TRUE, FALSE, 12, 'en',
 'Register Operation', 'Create operation in Global CMX', TRUE),

-- Registration -> Completed
('INTERNAL_PROCESSING', 'INTERNAL_REGISTRO', 'REGISTRO', 'INTERNAL_FINALIZADO',
 NULL, TRUE, FALSE, 13, 'en',
 'Complete Process', 'Complete internal processing', TRUE);

-- ============================================
-- 5. Add internal_processing_stage to client_request table (write model)
-- ============================================

-- Add column if not exists (for tracking which internal processing step the request is at)
SET @columnExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request'
    AND COLUMN_NAME = 'internal_processing_stage'
);

SET @sql = IF(@columnExists = 0,
    'ALTER TABLE client_request ADD COLUMN internal_processing_stage VARCHAR(50) DEFAULT NULL COMMENT ''Current stage in internal processing workflow''',
    'SELECT ''Column already exists'' as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add column for internal processing started timestamp
SET @columnExists2 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request'
    AND COLUMN_NAME = 'internal_processing_started_at'
);

SET @sql2 = IF(@columnExists2 = 0,
    'ALTER TABLE client_request ADD COLUMN internal_processing_started_at TIMESTAMP NULL COMMENT ''When internal processing started''',
    'SELECT ''Column already exists'' as message');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Add index for internal processing stage
SET @indexExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request'
    AND INDEX_NAME = 'idx_internal_processing_stage'
);

SET @sql3 = IF(@indexExists = 0,
    'ALTER TABLE client_request ADD INDEX idx_internal_processing_stage (internal_processing_stage)',
    'SELECT ''Index already exists'' as message');

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- ============================================
-- 5b. Add internal_processing_stage to client_request_readmodel table (read model - CQRS)
-- ============================================

-- Add column if not exists
SET @columnExistsRM = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'internal_processing_stage'
);

SET @sqlRM = IF(@columnExistsRM = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN internal_processing_stage VARCHAR(50) DEFAULT NULL COMMENT ''Current stage in internal processing workflow''',
    'SELECT ''Column already exists'' as message');

PREPARE stmtRM FROM @sqlRM;
EXECUTE stmtRM;
DEALLOCATE PREPARE stmtRM;

-- Add column for internal processing started timestamp
SET @columnExistsRM2 = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND COLUMN_NAME = 'internal_processing_started_at'
);

SET @sqlRM2 = IF(@columnExistsRM2 = 0,
    'ALTER TABLE client_request_readmodel ADD COLUMN internal_processing_started_at TIMESTAMP NULL COMMENT ''When internal processing started''',
    'SELECT ''Column already exists'' as message');

PREPARE stmtRM2 FROM @sqlRM2;
EXECUTE stmtRM2;
DEALLOCATE PREPARE stmtRM2;

-- Add index for internal processing stage on read model
SET @indexExistsRM = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'client_request_readmodel'
    AND INDEX_NAME = 'idx_rm_internal_processing_stage'
);

SET @sqlRM3 = IF(@indexExistsRM = 0,
    'ALTER TABLE client_request_readmodel ADD INDEX idx_rm_internal_processing_stage (internal_processing_stage)',
    'SELECT ''Index already exists'' as message');

PREPARE stmtRM3 FROM @sqlRM3;
EXECUTE stmtRM3;
DEALLOCATE PREPARE stmtRM3;

-- ============================================
-- 6. Create internal processing event log table
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_internal_processing_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    request_id CHAR(36) NOT NULL COMMENT 'FK to client_request',
    event_code VARCHAR(50) NOT NULL COMMENT 'Internal processing event code',
    from_stage VARCHAR(50) NULL,
    to_stage VARCHAR(50) NOT NULL,
    executed_by VARCHAR(100) NOT NULL,
    executed_by_name VARCHAR(200) NULL,
    comments TEXT NULL,
    execution_time_ms INT NULL COMMENT 'Time spent in previous stage (ms)',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_request_id (request_id),
    INDEX idx_event_code (event_code),
    INDEX idx_executed_by (executed_by),
    INDEX idx_created_at (created_at),

    CONSTRAINT fk_internal_log_request
        FOREIGN KEY (request_id) REFERENCES client_request(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log of internal processing events for client requests';
