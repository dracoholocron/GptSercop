-- Event Alert Templates: Define which alerts should be suggested/required when a specific event is executed
CREATE TABLE IF NOT EXISTS event_alert_template (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operation_type VARCHAR(30) NOT NULL COMMENT 'LC_IMPORT, LC_EXPORT, GUARANTEE, COLLECTION',
    event_code VARCHAR(50) NOT NULL COMMENT 'Event code that triggers this alert template',
    alert_type VARCHAR(30) NOT NULL COMMENT 'FOLLOW_UP, REMINDER, DEADLINE, TASK, etc.',
    requirement_level VARCHAR(20) NOT NULL DEFAULT 'RECOMMENDED' COMMENT 'MANDATORY, RECOMMENDED, OPTIONAL',
    title_template VARCHAR(200) NOT NULL COMMENT 'Alert title - supports #{variable} placeholders',
    description_template TEXT COMMENT 'Alert description - supports #{variable} placeholders',
    default_priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL' COMMENT 'LOW, NORMAL, HIGH, URGENT',
    assigned_role VARCHAR(50) COMMENT 'Role to assign (ROLE_OPERATOR, ROLE_MANAGER, etc.)',
    due_days_offset INT NOT NULL DEFAULT 3 COMMENT 'Days after event execution to set due date',
    tags JSON COMMENT 'Default tags to apply to the alert',
    language VARCHAR(5) NOT NULL DEFAULT 'es',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_eat_operation_event (operation_type, event_code),
    INDEX idx_eat_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data: LC_IMPORT alert templates
INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, tags, language, display_order) VALUES
-- When LC is issued
('LC_IMPORT', 'ISSUE_LC', 'FOLLOW_UP', 'RECOMMENDED', 'Dar seguimiento al aviso de LC', 'Verificar que el banco avisador confirme recepción de la LC #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 3, '["seguimiento"]', 'es', 1),
('LC_IMPORT', 'ISSUE_LC', 'REMINDER', 'OPTIONAL', 'Revisar condiciones de LC', 'Revisar las condiciones especiales de la LC #{operationReference} con el cliente', 'LOW', 'ROLE_OPERATOR', 5, '["revision"]', 'es', 2),
-- When documents are presented
('LC_IMPORT', 'PRESENT_DOCS', 'DEADLINE', 'MANDATORY', 'Plazo revisión de documentos', 'Revisar documentos presentados para LC #{operationReference} dentro del plazo bancario', 'HIGH', 'ROLE_OPERATOR', 5, '["documentacion","urgente"]', 'es', 1),
('LC_IMPORT', 'PRESENT_DOCS', 'TASK', 'RECOMMENDED', 'Verificar compliance documental', 'Validar que los documentos cumplen con las regulaciones de compliance', 'NORMAL', 'ROLE_MANAGER', 3, '["compliance","documentacion"]', 'es', 2),
-- When amendment is requested
('LC_IMPORT', 'REQUEST_AMENDMENT', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a enmienda', 'Dar seguimiento a la respuesta de enmienda de LC #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 2, '["seguimiento","urgente"]', 'es', 1),
-- When payment is made
('LC_IMPORT', 'MAKE_PAYMENT', 'TASK', 'MANDATORY', 'Confirmar aplicación contable', 'Verificar que el pago de LC #{operationReference} fue aplicado correctamente en contabilidad', 'HIGH', 'ROLE_MANAGER', 1, '["pago"]', 'es', 1),
('LC_IMPORT', 'MAKE_PAYMENT', 'CLIENT_CONTACT', 'RECOMMENDED', 'Notificar al cliente sobre pago', 'Comunicar al cliente que se realizó el pago de la LC #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 1, '["cliente-vip"]', 'es', 2),

-- LC_EXPORT templates
('LC_EXPORT', 'ISSUE_LC', 'FOLLOW_UP', 'RECOMMENDED', 'Seguimiento aviso LC exportación', 'Verificar aviso de LC de exportación #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 3, '["seguimiento"]', 'es', 1),
('LC_EXPORT', 'PRESENT_DOCS', 'DEADLINE', 'MANDATORY', 'Plazo envío de documentos', 'Enviar documentos de exportación dentro del plazo para LC #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 5, '["documentacion","urgente"]', 'es', 1),

-- GUARANTEE templates
('GUARANTEE', 'ISSUE_GUARANTEE', 'FOLLOW_UP', 'RECOMMENDED', 'Seguimiento emisión garantía', 'Confirmar recepción de garantía #{operationReference} por el beneficiario', 'NORMAL', 'ROLE_OPERATOR', 5, '["seguimiento"]', 'es', 1),
('GUARANTEE', 'ISSUE_GUARANTEE', 'REMINDER', 'OPTIONAL', 'Recordar vencimiento de garantía', 'Programar recordatorio de vencimiento de garantía #{operationReference}', 'LOW', 'ROLE_OPERATOR', 30, '["revision"]', 'es', 2),

-- COLLECTION templates
('COLLECTION', 'SEND_COLLECTION', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento cobranza enviada', 'Dar seguimiento a la cobranza #{operationReference} enviada al banco cobrador', 'HIGH', 'ROLE_OPERATOR', 7, '["seguimiento"]', 'es', 1);
