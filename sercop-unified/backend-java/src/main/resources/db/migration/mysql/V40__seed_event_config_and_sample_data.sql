-- V40: Seed event configurations and sample data for testing

-- =============================================
-- 0. Fix swift_message_readmodel table if operation_id has wrong type
-- =============================================

-- Drop and recreate swift_message_readmodel with correct VARCHAR types
DROP TABLE IF EXISTS swift_message_readmodel;

CREATE TABLE swift_message_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL UNIQUE,
    message_type VARCHAR(10) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    operation_id VARCHAR(50),
    operation_type VARCHAR(50),
    sender_bic VARCHAR(11) NOT NULL,
    receiver_bic VARCHAR(11) NOT NULL,
    swift_content TEXT NOT NULL,
    field_20_reference VARCHAR(35),
    field_21_related_ref VARCHAR(35),
    currency VARCHAR(3),
    amount DECIMAL(18,2),
    value_date DATE,
    status VARCHAR(30) NOT NULL,
    ack_received BOOLEAN DEFAULT FALSE,
    ack_content TEXT,
    ack_received_at DATETIME,
    expects_response BOOLEAN DEFAULT FALSE,
    expected_response_type VARCHAR(10),
    response_due_date DATE,
    response_received BOOLEAN DEFAULT FALSE,
    response_message_id VARCHAR(50),
    triggered_by_event VARCHAR(50),
    generates_event VARCHAR(50),
    created_by VARCHAR(100),
    created_at DATETIME,
    sent_at DATETIME,
    delivered_at DATETIME,
    received_at DATETIME,
    processed_at DATETIME,
    processed_by VARCHAR(100),
    version INT DEFAULT 1,
    INDEX idx_swift_operation (operation_id),
    INDEX idx_swift_direction (direction),
    INDEX idx_swift_type (message_type),
    INDEX idx_swift_status (status),
    INDEX idx_swift_pending_response (expects_response, response_received)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 1. Event Type Configurations for LC_IMPORT
-- =============================================

-- English LC_IMPORT events
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
-- ADVISE event - Initial advising
('ADVISE', 'LC_IMPORT', 'en', 'Advise LC', 'Advise the letter of credit to the beneficiary',
 'Send MT710 to advise the LC through correspondent bank',
 'MT710', NULL, '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),

-- AMEND event
('AMEND', 'LC_IMPORT', 'en', 'Request Amendment', 'Request an amendment to the LC terms',
 'Initiate MT707 amendment request',
 'MT707', 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),

-- CONFIRM event
('CONFIRM', 'LC_IMPORT', 'en', 'Confirm LC', 'Add confirmation to the letter of credit',
 'Confirming bank adds their confirmation',
 'MT730', NULL, '["ADVISED"]', '["ACTIVE"]', 'CONFIRMED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, TRUE, FALSE, NOW(), NOW()),

-- PRESENT_DOCS event
('PRESENT_DOCS', 'LC_IMPORT', 'en', 'Present Documents', 'Documents presented under the LC',
 'Beneficiary presents documents for examination',
 NULL, 'MT750', '["ADVISED","CONFIRMED"]', '["ACTIVE"]', 'DOCUMENTS_PRESENTED', 'ACTIVE',
 'FiFileText', 'purple', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

-- DISCREPANCY event
('DISCREPANCY', 'LC_IMPORT', 'en', 'Report Discrepancy', 'Report discrepancies in presented documents',
 'Send MT734 to report document discrepancies',
 'MT734', NULL, '["DOCUMENTS_PRESENTED"]', '["ACTIVE"]', 'DISCREPANT', 'ACTIVE',
 'FiAlertTriangle', 'red', 5, TRUE, FALSE, FALSE, NOW(), NOW()),

-- ACCEPT_DOCS event
('ACCEPT_DOCS', 'LC_IMPORT', 'en', 'Accept Documents', 'Accept compliant or waived documents',
 'Accept documents after examination',
 'MT730', NULL, '["DOCUMENTS_PRESENTED","DISCREPANT"]', '["ACTIVE"]', 'DOCUMENTS_ACCEPTED', 'ACTIVE',
 'FiCheck', 'green', 6, TRUE, TRUE, FALSE, NOW(), NOW()),

-- PAYMENT event
('PAYMENT', 'LC_IMPORT', 'en', 'Make Payment', 'Effect payment under the LC',
 'Execute payment to beneficiary or nominated bank',
 'MT756', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),

-- CLOSE event
('CLOSE', 'LC_IMPORT', 'en', 'Close LC', 'Close the letter of credit',
 'Mark the LC as fully utilized or expired',
 NULL, NULL, '["PAID","EXPIRED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiXCircle', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW()),

-- AMEND_ACCEPTED event - Amendment was accepted by counterparty
('AMEND_ACCEPTED', 'LC_IMPORT', 'en', 'Accept Amendment', 'Amendment has been accepted',
 'Process MT730 acknowledgment - amendment confirmed by counterparty',
 NULL, 'MT730', '["PENDING_AMENDMENT"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiCheckCircle', 'green', 11, TRUE, FALSE, FALSE, NOW(), NOW()),

-- AMEND_REJECTED event - Amendment was rejected by counterparty
('AMEND_REJECTED', 'LC_IMPORT', 'en', 'Reject Amendment', 'Amendment has been rejected',
 'Amendment was rejected by the counterparty',
 NULL, NULL, '["PENDING_AMENDMENT"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiXCircle', 'red', 12, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish LC_IMPORT events
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ADVISE', 'LC_IMPORT', 'es', 'Avisar LC', 'Avisar la carta de crédito al beneficiario',
 'Enviar MT710 para avisar la LC a través del banco corresponsal',
 'MT710', NULL, '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),

('AMEND', 'LC_IMPORT', 'es', 'Solicitar Enmienda', 'Solicitar una enmienda a los términos de la LC',
 'Iniciar solicitud de enmienda MT707',
 'MT707', 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),

('CONFIRM', 'LC_IMPORT', 'es', 'Confirmar LC', 'Agregar confirmación a la carta de crédito',
 'El banco confirmador agrega su confirmación',
 'MT730', NULL, '["ADVISED"]', '["ACTIVE"]', 'CONFIRMED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, TRUE, FALSE, NOW(), NOW()),

('PRESENT_DOCS', 'LC_IMPORT', 'es', 'Presentar Documentos', 'Documentos presentados bajo la LC',
 'El beneficiario presenta documentos para examen',
 NULL, 'MT750', '["ADVISED","CONFIRMED"]', '["ACTIVE"]', 'DOCUMENTS_PRESENTED', 'ACTIVE',
 'FiFileText', 'purple', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

('DISCREPANCY', 'LC_IMPORT', 'es', 'Reportar Discrepancia', 'Reportar discrepancias en documentos presentados',
 'Enviar MT734 para reportar discrepancias en documentos',
 'MT734', NULL, '["DOCUMENTS_PRESENTED"]', '["ACTIVE"]', 'DISCREPANT', 'ACTIVE',
 'FiAlertTriangle', 'red', 5, TRUE, FALSE, FALSE, NOW(), NOW()),

('ACCEPT_DOCS', 'LC_IMPORT', 'es', 'Aceptar Documentos', 'Aceptar documentos conformes o con discrepancias dispensadas',
 'Aceptar documentos después del examen',
 'MT730', NULL, '["DOCUMENTS_PRESENTED","DISCREPANT"]', '["ACTIVE"]', 'DOCUMENTS_ACCEPTED', 'ACTIVE',
 'FiCheck', 'green', 6, TRUE, TRUE, FALSE, NOW(), NOW()),

('PAYMENT', 'LC_IMPORT', 'es', 'Efectuar Pago', 'Efectuar pago bajo la LC',
 'Ejecutar pago al beneficiario o banco nominado',
 'MT756', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),

('CLOSE', 'LC_IMPORT', 'es', 'Cerrar LC', 'Cerrar la carta de crédito',
 'Marcar la LC como totalmente utilizada o expirada',
 NULL, NULL, '["PAID","EXPIRED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiXCircle', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW()),

-- AMEND_ACCEPTED event (Spanish)
('AMEND_ACCEPTED', 'LC_IMPORT', 'es', 'Aceptar Enmienda', 'La enmienda ha sido aceptada',
 'Procesar acuse MT730 - enmienda confirmada por la contraparte',
 NULL, 'MT730', '["PENDING_AMENDMENT"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiCheckCircle', 'green', 11, TRUE, FALSE, FALSE, NOW(), NOW()),

-- AMEND_REJECTED event (Spanish)
('AMEND_REJECTED', 'LC_IMPORT', 'es', 'Rechazar Enmienda', 'La enmienda ha sido rechazada',
 'La enmienda fue rechazada por la contraparte',
 NULL, NULL, '["PENDING_AMENDMENT"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiXCircle', 'red', 12, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 2. Event Type Configurations for GUARANTEE
-- =============================================

-- English GUARANTEE events
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'GUARANTEE', 'en', 'Issue Guarantee', 'Issue the bank guarantee',
 'Send MT760 to issue the guarantee',
 'MT760', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),

('AMEND', 'GUARANTEE', 'en', 'Amend Guarantee', 'Request amendment to guarantee terms',
 'Send MT767 amendment message',
 'MT767', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),

('EXTEND', 'GUARANTEE', 'en', 'Extend Validity', 'Extend the validity period of the guarantee',
 'Extend expiry date via MT767',
 'MT767', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'blue', 3, TRUE, TRUE, FALSE, NOW(), NOW()),

('CLAIM', 'GUARANTEE', 'en', 'Receive Claim', 'Claim received under the guarantee',
 'Process MT765 claim demand',
 NULL, 'MT765', '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'CLAIMED', 'ACTIVE',
 'FiAlertCircle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

('PAY_CLAIM', 'GUARANTEE', 'en', 'Pay Claim', 'Pay the claim under the guarantee',
 'Effect payment on valid claim',
 'MT756', NULL, '["CLAIMED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),

('RELEASE', 'GUARANTEE', 'en', 'Release Guarantee', 'Release the guarantee',
 'Mark guarantee as released by beneficiary',
 NULL, 'MT799', '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'RELEASED', 'CLOSED',
 'FiUnlock', 'green', 6, TRUE, FALSE, FALSE, NOW(), NOW()),

('EXPIRE', 'GUARANTEE', 'en', 'Mark Expired', 'Mark guarantee as expired',
 'Guarantee validity has ended',
 NULL, NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'EXPIRED', 'CLOSED',
 'FiClock', 'gray', 7, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish GUARANTEE events
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'GUARANTEE', 'es', 'Emitir Garantía', 'Emitir la garantía bancaria',
 'Enviar MT760 para emitir la garantía',
 'MT760', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),

('AMEND', 'GUARANTEE', 'es', 'Enmendar Garantía', 'Solicitar enmienda a los términos de la garantía',
 'Enviar mensaje de enmienda MT767',
 'MT767', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),

('EXTEND', 'GUARANTEE', 'es', 'Extender Vigencia', 'Extender el período de vigencia de la garantía',
 'Extender fecha de vencimiento vía MT767',
 'MT767', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'blue', 3, TRUE, TRUE, FALSE, NOW(), NOW()),

('CLAIM', 'GUARANTEE', 'es', 'Recibir Reclamo', 'Reclamo recibido bajo la garantía',
 'Procesar demanda de reclamo MT765',
 NULL, 'MT765', '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'CLAIMED', 'ACTIVE',
 'FiAlertCircle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

('PAY_CLAIM', 'GUARANTEE', 'es', 'Pagar Reclamo', 'Pagar el reclamo bajo la garantía',
 'Efectuar pago por reclamo válido',
 'MT756', NULL, '["CLAIMED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),

('RELEASE', 'GUARANTEE', 'es', 'Liberar Garantía', 'Liberar la garantía',
 'Marcar garantía como liberada por el beneficiario',
 NULL, 'MT799', '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'RELEASED', 'CLOSED',
 'FiUnlock', 'green', 6, TRUE, FALSE, FALSE, NOW(), NOW()),

('EXPIRE', 'GUARANTEE', 'es', 'Marcar Expirada', 'Marcar garantía como expirada',
 'La vigencia de la garantía ha terminado',
 NULL, NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'EXPIRED', 'CLOSED',
 'FiClock', 'gray', 7, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 3. Event Type Configurations for COLLECTION
-- =============================================

-- English COLLECTION events
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_COLLECTION', 'COLLECTION', 'en', 'Send Collection', 'Send collection documents to collecting bank',
 'Send MT400/MT410 collection instruction',
 'MT400', 'MT410', '["ISSUED"]', '["ACTIVE"]', 'SENT', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),

('PRESENT_DRAWEE', 'COLLECTION', 'en', 'Present to Drawee', 'Present documents to the drawee',
 'Documents presented for acceptance/payment',
 NULL, NULL, '["SENT"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiUserCheck', 'purple', 2, TRUE, FALSE, FALSE, NOW(), NOW()),

('ACCEPT', 'COLLECTION', 'en', 'Drawee Acceptance', 'Drawee accepts the collection',
 'Record acceptance by the drawee',
 NULL, 'MT412', '["PRESENTED"]', '["ACTIVE"]', 'ACCEPTED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, FALSE, FALSE, NOW(), NOW()),

('REFUSE', 'COLLECTION', 'en', 'Drawee Refusal', 'Drawee refuses the collection',
 'Record refusal/non-payment by drawee',
 NULL, 'MT416', '["PRESENTED"]', '["ACTIVE"]', 'REFUSED', 'ACTIVE',
 'FiXCircle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

('PAYMENT', 'COLLECTION', 'en', 'Receive Payment', 'Payment received under collection',
 'Record payment from drawee',
 'MT400', NULL, '["ACCEPTED","PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),

('RETURN_DOCS', 'COLLECTION', 'en', 'Return Documents', 'Return documents to remitting bank',
 'Return unpaid documents',
 'MT410', NULL, '["REFUSED"]', '["ACTIVE"]', 'RETURNED', 'CLOSED',
 'FiCornerUpLeft', 'orange', 6, TRUE, FALSE, FALSE, NOW(), NOW()),

('CLOSE', 'COLLECTION', 'en', 'Close Collection', 'Close the collection',
 'Mark collection as completed',
 NULL, NULL, '["PAID","RETURNED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 7, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish COLLECTION events
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_COLLECTION', 'COLLECTION', 'es', 'Enviar Cobranza', 'Enviar documentos de cobranza al banco cobrador',
 'Enviar instrucción de cobranza MT400/MT410',
 'MT400', 'MT410', '["ISSUED"]', '["ACTIVE"]', 'SENT', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),

('PRESENT_DRAWEE', 'COLLECTION', 'es', 'Presentar al Girado', 'Presentar documentos al girado',
 'Documentos presentados para aceptación/pago',
 NULL, NULL, '["SENT"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiUserCheck', 'purple', 2, TRUE, FALSE, FALSE, NOW(), NOW()),

('ACCEPT', 'COLLECTION', 'es', 'Aceptación del Girado', 'El girado acepta la cobranza',
 'Registrar aceptación por el girado',
 NULL, 'MT412', '["PRESENTED"]', '["ACTIVE"]', 'ACCEPTED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, FALSE, FALSE, NOW(), NOW()),

('REFUSE', 'COLLECTION', 'es', 'Rechazo del Girado', 'El girado rechaza la cobranza',
 'Registrar rechazo/impago del girado',
 NULL, 'MT416', '["PRESENTED"]', '["ACTIVE"]', 'REFUSED', 'ACTIVE',
 'FiXCircle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

('PAYMENT', 'COLLECTION', 'es', 'Recibir Pago', 'Pago recibido bajo cobranza',
 'Registrar pago del girado',
 'MT400', NULL, '["ACCEPTED","PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),

('RETURN_DOCS', 'COLLECTION', 'es', 'Devolver Documentos', 'Devolver documentos al banco remitente',
 'Devolver documentos impagos',
 'MT410', NULL, '["REFUSED"]', '["ACTIVE"]', 'RETURNED', 'CLOSED',
 'FiCornerUpLeft', 'orange', 6, TRUE, FALSE, FALSE, NOW(), NOW()),

('CLOSE', 'COLLECTION', 'es', 'Cerrar Cobranza', 'Cerrar la cobranza',
 'Marcar cobranza como completada',
 NULL, NULL, '["PAID","RETURNED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 7, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 4. Event Flow Configurations
-- =============================================

-- LC_IMPORT flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'ADVISE', FALSE, 1, 'en', 'Advise to Beneficiary', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'AMEND', FALSE, 2, 'en', 'Request Amendment', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'CONFIRM', FALSE, 3, 'en', 'Add Confirmation', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'PRESENT_DOCS', FALSE, 4, 'en', 'Present Documents', TRUE),
('LC_IMPORT', 'CONFIRM', 'CONFIRMED', 'PRESENT_DOCS', FALSE, 5, 'en', 'Present Documents', TRUE),
('LC_IMPORT', 'PRESENT_DOCS', 'DOCUMENTS_PRESENTED', 'DISCREPANCY', FALSE, 6, 'en', 'Report Discrepancy', TRUE),
('LC_IMPORT', 'PRESENT_DOCS', 'DOCUMENTS_PRESENTED', 'ACCEPT_DOCS', FALSE, 7, 'en', 'Accept Documents', TRUE),
('LC_IMPORT', 'DISCREPANCY', 'DISCREPANT', 'ACCEPT_DOCS', FALSE, 8, 'en', 'Accept with Waiver', TRUE),
('LC_IMPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'PAYMENT', TRUE, 9, 'en', 'Make Payment', TRUE),
('LC_IMPORT', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 10, 'en', 'Close LC', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'AMEND_ACCEPTED', FALSE, 11, 'en', 'Accept Amendment', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'AMEND_REJECTED', FALSE, 12, 'en', 'Reject Amendment', TRUE);

-- LC_IMPORT flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'ADVISE', FALSE, 1, 'es', 'Avisar al Beneficiario', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'AMEND', FALSE, 2, 'es', 'Solicitar Enmienda', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'CONFIRM', FALSE, 3, 'es', 'Agregar Confirmación', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'PRESENT_DOCS', FALSE, 4, 'es', 'Presentar Documentos', TRUE),
('LC_IMPORT', 'CONFIRM', 'CONFIRMED', 'PRESENT_DOCS', FALSE, 5, 'es', 'Presentar Documentos', TRUE),
('LC_IMPORT', 'PRESENT_DOCS', 'DOCUMENTS_PRESENTED', 'DISCREPANCY', FALSE, 6, 'es', 'Reportar Discrepancia', TRUE),
('LC_IMPORT', 'PRESENT_DOCS', 'DOCUMENTS_PRESENTED', 'ACCEPT_DOCS', FALSE, 7, 'es', 'Aceptar Documentos', TRUE),
('LC_IMPORT', 'DISCREPANCY', 'DISCREPANT', 'ACCEPT_DOCS', FALSE, 8, 'es', 'Aceptar con Dispensa', TRUE),
('LC_IMPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'PAYMENT', TRUE, 9, 'es', 'Efectuar Pago', TRUE),
('LC_IMPORT', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 10, 'es', 'Cerrar LC', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'AMEND_ACCEPTED', FALSE, 11, 'es', 'Aceptar Enmienda', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'AMEND_REJECTED', FALSE, 12, 'es', 'Rechazar Enmienda', TRUE);

-- GUARANTEE flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('GUARANTEE', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'en', 'Issue Guarantee', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'en', 'Amend Terms', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'EXTEND', FALSE, 3, 'en', 'Extend Validity', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'CLAIM', FALSE, 4, 'en', 'Process Claim', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'RELEASE', FALSE, 5, 'en', 'Release', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'EXPIRE', FALSE, 6, 'en', 'Mark Expired', TRUE),
('GUARANTEE', 'EXTEND', 'EXTENDED', 'CLAIM', FALSE, 7, 'en', 'Process Claim', TRUE),
('GUARANTEE', 'EXTEND', 'EXTENDED', 'RELEASE', FALSE, 8, 'en', 'Release', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'PAY_CLAIM', TRUE, 9, 'en', 'Pay Claim', TRUE);

-- GUARANTEE flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('GUARANTEE', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'es', 'Emitir Garantía', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'es', 'Enmendar Términos', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'EXTEND', FALSE, 3, 'es', 'Extender Vigencia', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'CLAIM', FALSE, 4, 'es', 'Procesar Reclamo', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'RELEASE', FALSE, 5, 'es', 'Liberar', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'EXPIRE', FALSE, 6, 'es', 'Marcar Expirada', TRUE),
('GUARANTEE', 'EXTEND', 'EXTENDED', 'CLAIM', FALSE, 7, 'es', 'Procesar Reclamo', TRUE),
('GUARANTEE', 'EXTEND', 'EXTENDED', 'RELEASE', FALSE, 8, 'es', 'Liberar', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'PAY_CLAIM', TRUE, 9, 'es', 'Pagar Reclamo', TRUE);

-- COLLECTION flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('COLLECTION', NULL, 'ISSUED', 'SEND_COLLECTION', TRUE, 1, 'en', 'Send to Collecting Bank', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'PRESENT_DRAWEE', TRUE, 2, 'en', 'Present to Drawee', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'ACCEPT', FALSE, 3, 'en', 'Record Acceptance', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'REFUSE', FALSE, 4, 'en', 'Record Refusal', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'PAYMENT', FALSE, 5, 'en', 'Receive Payment', TRUE),
('COLLECTION', 'ACCEPT', 'ACCEPTED', 'PAYMENT', TRUE, 6, 'en', 'Receive Payment', TRUE),
('COLLECTION', 'REFUSE', 'REFUSED', 'RETURN_DOCS', TRUE, 7, 'en', 'Return Documents', TRUE),
('COLLECTION', 'PAYMENT', 'PAID', 'CLOSE', TRUE, 8, 'en', 'Close Collection', TRUE),
('COLLECTION', 'RETURN_DOCS', 'RETURNED', 'CLOSE', TRUE, 9, 'en', 'Close Collection', TRUE);

-- COLLECTION flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('COLLECTION', NULL, 'ISSUED', 'SEND_COLLECTION', TRUE, 1, 'es', 'Enviar a Banco Cobrador', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'PRESENT_DRAWEE', TRUE, 2, 'es', 'Presentar al Girado', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'ACCEPT', FALSE, 3, 'es', 'Registrar Aceptación', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'REFUSE', FALSE, 4, 'es', 'Registrar Rechazo', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'PAYMENT', FALSE, 5, 'es', 'Recibir Pago', TRUE),
('COLLECTION', 'ACCEPT', 'ACCEPTED', 'PAYMENT', TRUE, 6, 'es', 'Recibir Pago', TRUE),
('COLLECTION', 'REFUSE', 'REFUSED', 'RETURN_DOCS', TRUE, 7, 'es', 'Devolver Documentos', TRUE),
('COLLECTION', 'PAYMENT', 'PAID', 'CLOSE', TRUE, 8, 'es', 'Cerrar Cobranza', TRUE),
('COLLECTION', 'RETURN_DOCS', 'RETURNED', 'CLOSE', TRUE, 9, 'es', 'Cerrar Cobranza', TRUE);

-- LC_EXPORT event types - English
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'LC_EXPORT', 'en', 'Issue LC', 'Issue the letter of credit',
 'Create and send MT700 to advising bank',
 'MT700', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),

('AMEND', 'LC_EXPORT', 'en', 'Amend LC', 'Amend the letter of credit terms',
 'Send MT707 amendment message',
 'MT707', 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),

('RECEIVE_DOCS', 'LC_EXPORT', 'en', 'Receive Documents', 'Documents received from beneficiary',
 'Documents presented for examination',
 NULL, 'MT750', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'DOCUMENTS_RECEIVED', 'ACTIVE',
 'FiFileText', 'purple', 3, TRUE, FALSE, FALSE, NOW(), NOW()),

('EXAMINE_DOCS', 'LC_EXPORT', 'en', 'Examine Documents', 'Examine presented documents',
 'Check documents for compliance',
 NULL, NULL, '["DOCUMENTS_RECEIVED"]', '["ACTIVE"]', 'UNDER_EXAMINATION', 'ACTIVE',
 'FiSearch', 'blue', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

('DISCREPANCY', 'LC_EXPORT', 'en', 'Report Discrepancy', 'Report document discrepancies',
 'Send MT734 discrepancy notice',
 'MT734', NULL, '["UNDER_EXAMINATION"]', '["ACTIVE"]', 'DISCREPANT', 'ACTIVE',
 'FiAlertTriangle', 'red', 5, TRUE, FALSE, FALSE, NOW(), NOW()),

('ACCEPT_DOCS', 'LC_EXPORT', 'en', 'Accept Documents', 'Accept compliant documents',
 'Documents accepted for payment',
 'MT730', NULL, '["UNDER_EXAMINATION","DISCREPANT"]', '["ACTIVE"]', 'DOCUMENTS_ACCEPTED', 'ACTIVE',
 'FiCheck', 'green', 6, TRUE, TRUE, FALSE, NOW(), NOW()),

('PAYMENT', 'LC_EXPORT', 'en', 'Effect Payment', 'Make payment under the LC',
 'Execute payment to beneficiary',
 'MT756', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),

('CLOSE', 'LC_EXPORT', 'en', 'Close LC', 'Close the letter of credit',
 'Mark the LC as closed',
 NULL, NULL, '["PAID","EXPIRED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiXCircle', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- LC_EXPORT event types - Spanish
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'LC_EXPORT', 'es', 'Emitir LC', 'Emitir la carta de crédito',
 'Crear y enviar MT700 al banco avisador',
 'MT700', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),

('AMEND', 'LC_EXPORT', 'es', 'Enmendar LC', 'Enmendar los términos de la carta de crédito',
 'Enviar mensaje de enmienda MT707',
 'MT707', 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),

('RECEIVE_DOCS', 'LC_EXPORT', 'es', 'Recibir Documentos', 'Documentos recibidos del beneficiario',
 'Documentos presentados para examen',
 NULL, 'MT750', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'DOCUMENTS_RECEIVED', 'ACTIVE',
 'FiFileText', 'purple', 3, TRUE, FALSE, FALSE, NOW(), NOW()),

('EXAMINE_DOCS', 'LC_EXPORT', 'es', 'Examinar Documentos', 'Examinar documentos presentados',
 'Revisar conformidad de documentos',
 NULL, NULL, '["DOCUMENTS_RECEIVED"]', '["ACTIVE"]', 'UNDER_EXAMINATION', 'ACTIVE',
 'FiSearch', 'blue', 4, TRUE, FALSE, FALSE, NOW(), NOW()),

('DISCREPANCY', 'LC_EXPORT', 'es', 'Reportar Discrepancia', 'Reportar discrepancias en documentos',
 'Enviar aviso de discrepancia MT734',
 'MT734', NULL, '["UNDER_EXAMINATION"]', '["ACTIVE"]', 'DISCREPANT', 'ACTIVE',
 'FiAlertTriangle', 'red', 5, TRUE, FALSE, FALSE, NOW(), NOW()),

('ACCEPT_DOCS', 'LC_EXPORT', 'es', 'Aceptar Documentos', 'Aceptar documentos conformes',
 'Documentos aceptados para pago',
 'MT730', NULL, '["UNDER_EXAMINATION","DISCREPANT"]', '["ACTIVE"]', 'DOCUMENTS_ACCEPTED', 'ACTIVE',
 'FiCheck', 'green', 6, TRUE, TRUE, FALSE, NOW(), NOW()),

('PAYMENT', 'LC_EXPORT', 'es', 'Efectuar Pago', 'Realizar pago bajo la LC',
 'Ejecutar pago al beneficiario',
 'MT756', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),

('CLOSE', 'LC_EXPORT', 'es', 'Cerrar LC', 'Cerrar la carta de crédito',
 'Marcar la LC como cerrada',
 NULL, NULL, '["PAID","EXPIRED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiXCircle', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- LC_EXPORT flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('LC_EXPORT', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'en', 'Issue Letter of Credit', TRUE),
('LC_EXPORT', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'en', 'Amend Terms', TRUE),
('LC_EXPORT', 'ISSUE', 'ISSUED', 'RECEIVE_DOCS', FALSE, 3, 'en', 'Receive Documents', TRUE),
('LC_EXPORT', 'RECEIVE_DOCS', 'DOCUMENTS_RECEIVED', 'EXAMINE_DOCS', TRUE, 4, 'en', 'Examine Documents', TRUE),
('LC_EXPORT', 'EXAMINE_DOCS', 'UNDER_EXAMINATION', 'DISCREPANCY', FALSE, 5, 'en', 'Report Discrepancy', TRUE),
('LC_EXPORT', 'EXAMINE_DOCS', 'UNDER_EXAMINATION', 'ACCEPT_DOCS', FALSE, 6, 'en', 'Accept Documents', TRUE),
('LC_EXPORT', 'DISCREPANCY', 'DISCREPANT', 'ACCEPT_DOCS', FALSE, 7, 'en', 'Accept with Waiver', TRUE),
('LC_EXPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'PAYMENT', TRUE, 8, 'en', 'Make Payment', TRUE),
('LC_EXPORT', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 9, 'en', 'Close LC', TRUE);

-- LC_EXPORT flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('LC_EXPORT', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'es', 'Emitir Carta de Crédito', TRUE),
('LC_EXPORT', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'es', 'Enmendar Términos', TRUE),
('LC_EXPORT', 'ISSUE', 'ISSUED', 'RECEIVE_DOCS', FALSE, 3, 'es', 'Recibir Documentos', TRUE),
('LC_EXPORT', 'RECEIVE_DOCS', 'DOCUMENTS_RECEIVED', 'EXAMINE_DOCS', TRUE, 4, 'es', 'Examinar Documentos', TRUE),
('LC_EXPORT', 'EXAMINE_DOCS', 'UNDER_EXAMINATION', 'DISCREPANCY', FALSE, 5, 'es', 'Reportar Discrepancia', TRUE),
('LC_EXPORT', 'EXAMINE_DOCS', 'UNDER_EXAMINATION', 'ACCEPT_DOCS', FALSE, 6, 'es', 'Aceptar Documentos', TRUE),
('LC_EXPORT', 'DISCREPANCY', 'DISCREPANT', 'ACCEPT_DOCS', FALSE, 7, 'es', 'Aceptar con Dispensa', TRUE),
('LC_EXPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'PAYMENT', TRUE, 8, 'es', 'Efectuar Pago', TRUE),
('LC_EXPORT', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 9, 'es', 'Cerrar LC', TRUE);

-- =============================================
-- 5. SWIFT Response Configurations
-- =============================================

-- LC_IMPORT responses
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT700', 'LC_IMPORT', 'MT730', 'CONFIRM', 5, 3, 7, 'en', 'Acknowledgment from advising bank', 'MT730 acknowledgment overdue', TRUE),
('MT700', 'LC_IMPORT', 'MT730', 'CONFIRM', 5, 3, 7, 'es', 'Acuse de recibo del banco avisador', 'Acuse MT730 vencido', TRUE),
('MT707', 'LC_IMPORT', 'MT730', 'AMEND', 5, 3, 7, 'en', 'Amendment acknowledgment', 'Amendment acknowledgment overdue', TRUE),
('MT707', 'LC_IMPORT', 'MT730', 'AMEND', 5, 3, 7, 'es', 'Acuse de enmienda', 'Acuse de enmienda vencido', TRUE),
('MT710', 'LC_IMPORT', 'MT730', 'ADVISE', 3, 2, 5, 'en', 'Advice acknowledgment', 'Advice acknowledgment overdue', TRUE),
('MT710', 'LC_IMPORT', 'MT730', 'ADVISE', 3, 2, 5, 'es', 'Acuse de aviso', 'Acuse de aviso vencido', TRUE);

-- GUARANTEE responses
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT760', 'GUARANTEE', 'MT730', 'ISSUE', 5, 3, 7, 'en', 'Guarantee issuance acknowledgment', 'Issuance acknowledgment overdue', TRUE),
('MT760', 'GUARANTEE', 'MT730', 'ISSUE', 5, 3, 7, 'es', 'Acuse de emisión de garantía', 'Acuse de emisión vencido', TRUE),
('MT767', 'GUARANTEE', 'MT730', 'AMEND', 5, 3, 7, 'en', 'Amendment acknowledgment', 'Amendment acknowledgment overdue', TRUE),
('MT767', 'GUARANTEE', 'MT730', 'AMEND', 5, 3, 7, 'es', 'Acuse de enmienda', 'Acuse de enmienda vencido', TRUE);

-- COLLECTION responses
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT400', 'COLLECTION', 'MT410', 'SEND_COLLECTION', 5, 3, 7, 'en', 'Collection acknowledgment', 'Collection acknowledgment overdue', TRUE),
('MT400', 'COLLECTION', 'MT410', 'SEND_COLLECTION', 5, 3, 7, 'es', 'Acuse de cobranza', 'Acuse de cobranza vencido', TRUE);

-- =============================================
-- 6. Sample Test Operations
-- =============================================

-- Sample LC Import Operation
INSERT INTO operation_readmodel (
    operation_id, original_draft_id, product_type, message_type, reference, stage, status,
    creation_mode, swift_message, currency, amount, issue_date, expiry_date,
    applicant_name, beneficiary_name, issuing_bank_bic, advising_bank_bic,
    created_by, created_at, approved_by, approved_at
) VALUES
('LCI-2024-000001', 'DRAFT-LC-001', 'LC_IMPORT', 'MT700', 'LC2024001', 'ADVISED', 'ACTIVE',
 'MANUAL', '{1:F01BANKUS33AXXX0000000000}{2:O7001234567890N}{4::20:LC2024001:31C:241201:40A:IRREVOCABLE:59:BENEFICIARY NAME-}',
 'USD', 500000.00, '2024-12-01', '2025-06-01',
 'ACME IMPORTERS LLC', 'GLOBAL EXPORTS INC', 'BANKUS33XXX', 'BANKGB22XXX',
 'admin', NOW(), 'supervisor', NOW()),

('LCI-2024-000002', 'DRAFT-LC-002', 'LC_IMPORT', 'MT700', 'LC2024002', 'ISSUED', 'ACTIVE',
 'SWIFT', '{1:F01BANKUS33AXXX0000000000}{2:O7001234567890N}{4::20:LC2024002:31C:241215:40A:IRREVOCABLE:59:ANOTHER BENEFICIARY-}',
 'EUR', 250000.00, '2024-12-15', '2025-03-15',
 'EURO TRADERS SA', 'PACIFIC SUPPLIERS LTD', 'BANKUS33XXX', 'BANKFR22XXX',
 'admin', NOW(), 'supervisor', NOW());

-- Sample Guarantee Operations
INSERT INTO operation_readmodel (
    operation_id, original_draft_id, product_type, message_type, reference, stage, status,
    creation_mode, swift_message, currency, amount, issue_date, expiry_date,
    applicant_name, beneficiary_name, issuing_bank_bic,
    created_by, created_at, approved_by, approved_at
) VALUES
('GAR-2024-000001', 'DRAFT-GAR-001', 'GUARANTEE', 'MT760', 'BG2024001', 'ISSUED', 'ACTIVE',
 'MANUAL', '{1:F01BANKUS33AXXX0000000000}{2:O7601234567890N}{4::20:BG2024001:23:ISSUE:77C:GUARANTEE TEXT-}',
 'USD', 100000.00, '2024-12-01', '2025-12-01',
 'CONSTRUCTION CO INC', 'GOVERNMENT AGENCY', 'BANKUS33XXX',
 'admin', NOW(), 'supervisor', NOW()),

('GAR-2024-000002', 'DRAFT-GAR-002', 'GUARANTEE', 'MT760', 'PB2024001', 'ISSUED', 'ACTIVE',
 'MANUAL', '{1:F01BANKUS33AXXX0000000000}{2:O7601234567890N}{4::20:PB2024001:23:ISSUE:77C:PERFORMANCE BOND-}',
 'EUR', 75000.00, '2024-11-15', '2025-11-15',
 'BUILDING SERVICES LLC', 'MUNICIPAL AUTHORITY', 'BANKUS33XXX',
 'admin', NOW(), 'supervisor', NOW());

-- Sample Collection Operations
INSERT INTO operation_readmodel (
    operation_id, original_draft_id, product_type, message_type, reference, stage, status,
    creation_mode, swift_message, currency, amount, issue_date, expiry_date,
    applicant_name, beneficiary_name, issuing_bank_bic, advising_bank_bic,
    created_by, created_at, approved_by, approved_at
) VALUES
('COL-2024-000001', 'DRAFT-COL-001', 'COLLECTION', 'MT400', 'DC2024001', 'SENT', 'ACTIVE',
 'MANUAL', '{1:F01BANKUS33AXXX0000000000}{2:O4001234567890N}{4::20:DC2024001:21:INVOICE001:32A:241201USD50000,-}',
 'USD', 50000.00, '2024-12-01', '2025-01-15',
 'US EXPORTER INC', 'FOREIGN BUYER LTD', 'BANKUS33XXX', 'BANKDE33XXX',
 'admin', NOW(), 'supervisor', NOW()),

('COL-2024-000002', 'DRAFT-COL-002', 'COLLECTION', 'MT400', 'DC2024002', 'PRESENTED', 'ACTIVE',
 'MANUAL', '{1:F01BANKUS33AXXX0000000000}{2:O4001234567890N}{4::20:DC2024002:21:INVOICE002:32A:241215EUR30000,-}',
 'EUR', 30000.00, '2024-12-15', '2025-02-15',
 'EUROPEAN EXPORTER SA', 'ASIA IMPORTS CO', 'BANKUS33XXX', 'BANKHK22XXX',
 'admin', NOW(), 'supervisor', NOW());

-- =============================================
-- 7. Sample SWIFT Messages
-- =============================================

INSERT INTO swift_message_readmodel (
    message_id, message_type, direction, operation_id, operation_type,
    sender_bic, receiver_bic, swift_content, field_20_reference, currency, amount, value_date,
    status, ack_received, expects_response, expected_response_type, response_due_date,
    created_by, created_at, sent_at
) VALUES
('MSG-MT700-12345678', 'MT700', 'OUTBOUND', 'LCI-2024-000001', 'LC_IMPORT',
 'BANKUS33XXX', 'BANKGB22XXX',
 '{1:F01BANKUS33AXXX0000000000}{2:O7001234567890N}{4::20:LC2024001:31C:241201:40A:IRREVOCABLE:59:BENEFICIARY NAME-}',
 'LC2024001', 'USD', 500000.00, '2024-12-01',
 'DELIVERED', TRUE, TRUE, 'MT730', DATE_ADD(CURDATE(), INTERVAL 5 DAY),
 'admin', NOW(), NOW()),

('MSG-MT710-23456789', 'MT710', 'OUTBOUND', 'LCI-2024-000001', 'LC_IMPORT',
 'BANKGB22XXX', 'BANKUS33XXX',
 '{1:F01BANKGB22AXXX0000000000}{2:O7101234567890N}{4::20:LC2024001:21:LC2024001:59:BENEFICIARY-}',
 'LC2024001', 'USD', 500000.00, '2024-12-01',
 'SENT', FALSE, TRUE, 'MT730', DATE_ADD(CURDATE(), INTERVAL 3 DAY),
 'admin', NOW(), NOW()),

('MSG-MT760-34567890', 'MT760', 'OUTBOUND', 'GAR-2024-000001', 'GUARANTEE',
 'BANKUS33XXX', 'BANKFR22XXX',
 '{1:F01BANKUS33AXXX0000000000}{2:O7601234567890N}{4::20:BG2024001:23:ISSUE:77C:GUARANTEE-}',
 'BG2024001', 'USD', 100000.00, '2024-12-01',
 'DELIVERED', TRUE, TRUE, 'MT730', DATE_ADD(CURDATE(), INTERVAL 5 DAY),
 'admin', NOW(), NOW()),

('MSG-MT400-45678901', 'MT400', 'OUTBOUND', 'COL-2024-000001', 'COLLECTION',
 'BANKUS33XXX', 'BANKDE33XXX',
 '{1:F01BANKUS33AXXX0000000000}{2:O4001234567890N}{4::20:DC2024001:21:INVOICE001:32A:241201USD50000,-}',
 'DC2024001', 'USD', 50000.00, '2024-12-01',
 'DELIVERED', TRUE, TRUE, 'MT410', DATE_ADD(CURDATE(), INTERVAL 5 DAY),
 'admin', NOW(), NOW());

-- =============================================
-- 8. Sample Event Logs
-- =============================================

INSERT INTO operation_event_log_readmodel (
    event_id, operation_id, operation_type, event_code, event_sequence,
    previous_stage, new_stage, previous_status, new_status, executed_by, executed_at
) VALUES
(UUID(), 'LCI-2024-000001', 'LC_IMPORT', 'APPROVED', 1, 'DRAFT', 'ISSUED', 'PENDING', 'ACTIVE', 'supervisor', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(UUID(), 'LCI-2024-000001', 'LC_IMPORT', 'ADVISE', 2, 'ISSUED', 'ADVISED', 'ACTIVE', 'ACTIVE', 'admin', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(UUID(), 'GAR-2024-000001', 'GUARANTEE', 'APPROVED', 1, 'DRAFT', 'ISSUED', 'PENDING', 'ACTIVE', 'supervisor', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(UUID(), 'GAR-2024-000002', 'GUARANTEE', 'APPROVED', 1, 'DRAFT', 'ISSUED', 'PENDING', 'ACTIVE', 'supervisor', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(UUID(), 'COL-2024-000001', 'COLLECTION', 'APPROVED', 1, 'DRAFT', 'ISSUED', 'PENDING', 'ACTIVE', 'supervisor', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(UUID(), 'COL-2024-000001', 'COLLECTION', 'SEND_COLLECTION', 2, 'ISSUED', 'SENT', 'ACTIVE', 'ACTIVE', 'admin', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(UUID(), 'COL-2024-000002', 'COLLECTION', 'APPROVED', 1, 'DRAFT', 'ISSUED', 'PENDING', 'ACTIVE', 'supervisor', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(UUID(), 'COL-2024-000002', 'COLLECTION', 'SEND_COLLECTION', 2, 'ISSUED', 'SENT', 'ACTIVE', 'ACTIVE', 'admin', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(UUID(), 'COL-2024-000002', 'COLLECTION', 'PRESENT_DRAWEE', 3, 'SENT', 'PRESENTED', 'ACTIVE', 'ACTIVE', 'admin', NOW());
