-- V75: Create tables for post-approval automatic actions
-- This migration creates the infrastructure for executing automatic actions after event approval

-- Table for tracking execution of automatic actions
CREATE TABLE IF NOT EXISTS event_action_execution_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(50) NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    operation_id VARCHAR(50),
    trigger_event VARCHAR(50) NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    action_order INT NOT NULL,
    action_config JSON,
    status ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    started_at DATETIME,
    completed_at DATETIME,
    duration_ms INT,
    result_data JSON,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_execution_id (execution_id),
    INDEX idx_operation_id (operation_id),
    INDEX idx_status (status),
    INDEX idx_rule_code (rule_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for action type configurations with i18n support
CREATE TABLE IF NOT EXISTS action_type_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(30) NOT NULL,
    language VARCHAR(5) NOT NULL DEFAULT 'es',
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    success_message VARCHAR(200),
    error_message VARCHAR(200),
    retry_message VARCHAR(200),
    skip_message VARCHAR(200),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_action_type_lang (action_type, language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert action type configurations (Spanish)
INSERT INTO action_type_config (action_type, language, display_name, description, icon, color, success_message, error_message, display_order) VALUES
('SWIFT_MESSAGE', 'es', 'Generar Mensaje SWIFT', 'Genera y registra el mensaje SWIFT para transmisión', 'FiSend', 'blue', 'Mensaje SWIFT generado correctamente', 'Error al generar el mensaje SWIFT', 1),
('API_CALL', 'es', 'Llamar API Externa', 'Realiza una llamada a un servicio externo', 'FiGlobe', 'purple', 'Llamada API exitosa', 'Error en la llamada API', 2),
('EMAIL', 'es', 'Enviar Notificación Email', 'Envía una notificación por correo electrónico', 'FiMail', 'green', 'Email enviado correctamente', 'Error al enviar email', 3),
('AUDITORIA', 'es', 'Registro de Auditoría', 'Registra una entrada en el log de auditoría', 'FiFileText', 'gray', 'Auditoría registrada', 'Error al registrar auditoría', 4)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), description=VALUES(description);

-- Insert action type configurations (English)
INSERT INTO action_type_config (action_type, language, display_name, description, icon, color, success_message, error_message, display_order) VALUES
('SWIFT_MESSAGE', 'en', 'Generate SWIFT Message', 'Generates and registers the SWIFT message for transmission', 'FiSend', 'blue', 'SWIFT message generated successfully', 'Error generating SWIFT message', 1),
('API_CALL', 'en', 'Call External API', 'Makes a call to an external service', 'FiGlobe', 'purple', 'API call successful', 'API call error', 2),
('EMAIL', 'en', 'Send Email Notification', 'Sends an email notification', 'FiMail', 'green', 'Email sent successfully', 'Error sending email', 3),
('AUDITORIA', 'en', 'Audit Log Entry', 'Records an entry in the audit log', 'FiFileText', 'gray', 'Audit logged', 'Error logging audit', 4)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), description=VALUES(description);

-- Insert event rules for LC_IMPORT
CREATE TABLE IF NOT EXISTS event_rules_read_model (
    id BIGINT NOT NULL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    operation_type VARCHAR(100) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    conditions_drl TEXT,
    actions_json TEXT,
    priority INT DEFAULT 100,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,
    INDEX idx_event_rules_code (code),
    INDEX idx_event_rules_operation_type (operation_type),
    INDEX idx_event_rules_trigger_event (trigger_event),
    INDEX idx_event_rules_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure the optimistic lock column exists for JPA @Version mapping.
SET @event_rules_has_version := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'event_rules_read_model'
      AND column_name = 'version'
);
SET @event_rules_version_sql := IF(
    @event_rules_has_version = 0,
    'ALTER TABLE event_rules_read_model ADD COLUMN version BIGINT DEFAULT 0',
    'SELECT 1'
);
PREPARE stmt_event_rules_version FROM @event_rules_version_sql;
EXECUTE stmt_event_rules_version;
DEALLOCATE PREPARE stmt_event_rules_version;

INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(100, 'LC_IMPORT_ISSUE_APPROVED', 'Acciones post-aprobación de Emisión LC Import', 'Genera mensaje SWIFT MT700 cuando se aprueba la emisión de una LC Import', 'LC_IMPORT', 'ISSUE_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT700","direction":"OUTBOUND","description":"Generar y registrar mensaje MT700"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"LC_EMITIDA","severidad":"INFO","mensaje":"LC Import emitida y mensaje MT700 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_IMPORT_ISSUE_APPROVED', 1),
(101, 'LC_IMPORT_AMEND_APPROVED', 'Acciones post-aprobación de Enmienda LC Import', 'Genera mensaje SWIFT MT707 cuando se aprueba la enmienda de una LC Import', 'LC_IMPORT', 'AMEND_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT707","direction":"OUTBOUND","description":"Generar mensaje MT707 de enmienda"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"LC_ENMENDADA","severidad":"INFO","mensaje":"LC Import enmendada y mensaje MT707 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_IMPORT_AMEND_APPROVED', 1),
(102, 'LC_IMPORT_ACCEPT_DOCS_APPROVED', 'Acciones post-aprobación de Aceptación Documentos LC Import', 'Genera mensaje SWIFT MT730 cuando se aceptan documentos', 'LC_IMPORT', 'ACCEPT_DOCS_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT730","direction":"OUTBOUND","description":"Generar mensaje MT730 de aceptación"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"DOCS_ACEPTADOS","severidad":"INFO","mensaje":"Documentos aceptados y mensaje MT730 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_IMPORT_ACCEPT_DOCS_APPROVED', 1),
(103, 'LC_IMPORT_PAYMENT_APPROVED', 'Acciones post-aprobación de Pago LC Import', 'Genera mensaje SWIFT MT756 cuando se efectúa el pago', 'LC_IMPORT', 'PAYMENT_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT756","direction":"OUTBOUND","description":"Generar mensaje MT756 de pago"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"PAGO_EFECTUADO","severidad":"INFO","mensaje":"Pago efectuado y mensaje MT756 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_IMPORT_PAYMENT_APPROVED', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), actions_json=VALUES(actions_json);

-- Insert event rules for LC_EXPORT
INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(110, 'LC_EXPORT_ISSUE_APPROVED', 'Acciones post-aprobación de Emisión LC Export', 'Genera mensaje SWIFT MT700 cuando se aprueba la emisión de una LC Export', 'LC_EXPORT', 'ISSUE_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT700","direction":"OUTBOUND","description":"Generar mensaje MT700"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"LC_EMITIDA","severidad":"INFO","mensaje":"LC Export emitida y mensaje MT700 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_EXPORT_ISSUE_APPROVED', 1),
(111, 'LC_EXPORT_AMEND_APPROVED', 'Acciones post-aprobación de Enmienda LC Export', 'Genera mensaje SWIFT MT707 cuando se aprueba la enmienda', 'LC_EXPORT', 'AMEND_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT707","direction":"OUTBOUND","description":"Generar mensaje MT707 de enmienda"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"LC_ENMENDADA","severidad":"INFO","mensaje":"LC Export enmendada y mensaje MT707 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_EXPORT_AMEND_APPROVED', 1),
(112, 'LC_EXPORT_ACCEPT_DOCS_APPROVED', 'Acciones post-aprobación de Aceptación Documentos LC Export', 'Genera mensaje SWIFT MT730 cuando se aceptan documentos', 'LC_EXPORT', 'ACCEPT_DOCS_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT730","direction":"OUTBOUND","description":"Generar mensaje MT730 de aceptación"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"DOCS_ACEPTADOS","severidad":"INFO","mensaje":"Documentos aceptados y mensaje MT730 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_EXPORT_ACCEPT_DOCS_APPROVED', 1),
(113, 'LC_EXPORT_PAYMENT_APPROVED', 'Acciones post-aprobación de Pago LC Export', 'Genera mensaje SWIFT MT756 cuando se efectúa el pago', 'LC_EXPORT', 'PAYMENT_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT756","direction":"OUTBOUND","description":"Generar mensaje MT756 de pago"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"PAGO_EFECTUADO","severidad":"INFO","mensaje":"Pago efectuado y mensaje MT756 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_EXPORT_PAYMENT_APPROVED', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), actions_json=VALUES(actions_json);

-- Insert event rules for GUARANTEE
INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(120, 'GUARANTEE_ISSUE_APPROVED', 'Acciones post-aprobación de Emisión Garantía', 'Genera mensaje SWIFT MT760 cuando se aprueba la emisión de una garantía', 'GUARANTEE', 'ISSUE_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT760","direction":"OUTBOUND","description":"Generar mensaje MT760"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_EMITIDA","severidad":"INFO","mensaje":"Garantía emitida y mensaje MT760 generado"}}]', 10, 1, NOW(), 'system', 'RULE-GUARANTEE_ISSUE_APPROVED', 1),
(121, 'GUARANTEE_AMEND_APPROVED', 'Acciones post-aprobación de Enmienda Garantía', 'Genera mensaje SWIFT MT767 cuando se aprueba la enmienda', 'GUARANTEE', 'AMEND_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT767","direction":"OUTBOUND","description":"Generar mensaje MT767 de enmienda"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_ENMENDADA","severidad":"INFO","mensaje":"Garantía enmendada y mensaje MT767 generado"}}]', 10, 1, NOW(), 'system', 'RULE-GUARANTEE_AMEND_APPROVED', 1),
(122, 'GUARANTEE_EXTEND_APPROVED', 'Acciones post-aprobación de Extensión Garantía', 'Genera mensaje SWIFT MT767 cuando se extiende la vigencia', 'GUARANTEE', 'EXTEND_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT767","direction":"OUTBOUND","description":"Generar mensaje MT767 de extensión"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_EXTENDIDA","severidad":"INFO","mensaje":"Garantía extendida y mensaje MT767 generado"}}]', 10, 1, NOW(), 'system', 'RULE-GUARANTEE_EXTEND_APPROVED', 1),
(123, 'GUARANTEE_PAY_CLAIM_APPROVED', 'Acciones post-aprobación de Pago Reclamo Garantía', 'Genera mensaje SWIFT MT756 cuando se paga un reclamo', 'GUARANTEE', 'PAY_CLAIM_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT756","direction":"OUTBOUND","description":"Generar mensaje MT756 de pago"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"RECLAMO_PAGADO","severidad":"INFO","mensaje":"Reclamo pagado y mensaje MT756 generado"}}]', 10, 1, NOW(), 'system', 'RULE-GUARANTEE_PAY_CLAIM_APPROVED', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), actions_json=VALUES(actions_json);

-- Insert event rules for NEW_OPERATION_APPROVED (when new drafts are approved)
INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(200, 'LC_IMPORT_NEW_APPROVED', 'Acciones post-aprobación de Nueva LC Import', 'Genera mensaje SWIFT MT700 cuando se aprueba una nueva LC Import', 'LC_IMPORT', 'NEW_OPERATION_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT700","direction":"OUTBOUND","description":"Generar y registrar mensaje MT700"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"LC_EMITIDA","severidad":"INFO","mensaje":"Nueva LC Import aprobada y mensaje MT700 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_IMPORT_NEW_APPROVED', 1),
(201, 'LC_EXPORT_NEW_APPROVED', 'Acciones post-aprobación de Nueva LC Export', 'Genera mensaje SWIFT MT700 cuando se aprueba una nueva LC Export', 'LC_EXPORT', 'NEW_OPERATION_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT700","direction":"OUTBOUND","description":"Generar y registrar mensaje MT700"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"LC_EMITIDA","severidad":"INFO","mensaje":"Nueva LC Export aprobada y mensaje MT700 generado"}}]', 10, 1, NOW(), 'system', 'RULE-LC_EXPORT_NEW_APPROVED', 1),
(202, 'GUARANTEE_NEW_APPROVED', 'Acciones post-aprobación de Nueva Garantía', 'Genera mensaje SWIFT MT760 cuando se aprueba una nueva garantía', 'GUARANTEE', 'NEW_OPERATION_APPROVED', '[{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT760","direction":"OUTBOUND","description":"Generar y registrar mensaje MT760"}},{"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_EMITIDA","severidad":"INFO","mensaje":"Nueva garantía aprobada y mensaje MT760 generado"}}]', 10, 1, NOW(), 'system', 'RULE-GUARANTEE_NEW_APPROVED', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), actions_json=VALUES(actions_json);
