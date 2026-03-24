-- V41: Add Free Format Message (MT799/MT999) events for all operation types
-- These events allow sending free text messages at any stage of an operation

-- =============================================
-- FREE FORMAT MESSAGE EVENT TYPES
-- =============================================

-- LC_IMPORT - Free Format Message (English)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'LC_IMPORT', 'en', 'Send Free Format Message', 'Send a free format SWIFT message (MT799/MT999)',
 'Send MT799 or MT999 free text message to counterparty bank for inquiries, clarifications, or additional information',
 'MT799', NULL, '["ISSUED","ADVISED","CONFIRMED","DOCUMENTS_PRESENTED","DISCREPANT","DOCUMENTS_ACCEPTED","PENDING_AMENDMENT"]', '["ACTIVE"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- LC_IMPORT - Free Format Message (Spanish)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'LC_IMPORT', 'es', 'Enviar Mensaje Texto Libre', 'Enviar mensaje SWIFT de formato libre (MT799/MT999)',
 'Enviar mensaje MT799 o MT999 de texto libre al banco contraparte para consultas, aclaraciones o informacion adicional',
 'MT799', NULL, '["ISSUED","ADVISED","CONFIRMED","DOCUMENTS_PRESENTED","DISCREPANT","DOCUMENTS_ACCEPTED","PENDING_AMENDMENT"]', '["ACTIVE"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- LC_EXPORT - Free Format Message (English)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'LC_EXPORT', 'en', 'Send Free Format Message', 'Send a free format SWIFT message (MT799/MT999)',
 'Send MT799 or MT999 free text message to counterparty bank for inquiries, clarifications, or additional information',
 'MT799', NULL, '["DRAFT","ISSUED","ADVISED","DOCUMENTS_RECEIVED","UNDER_EXAMINATION","DISCREPANT","DOCUMENTS_ACCEPTED","PENDING_AMENDMENT"]', '["ACTIVE","PENDING"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- LC_EXPORT - Free Format Message (Spanish)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'LC_EXPORT', 'es', 'Enviar Mensaje Texto Libre', 'Enviar mensaje SWIFT de formato libre (MT799/MT999)',
 'Enviar mensaje MT799 o MT999 de texto libre al banco contraparte para consultas, aclaraciones o informacion adicional',
 'MT799', NULL, '["DRAFT","ISSUED","ADVISED","DOCUMENTS_RECEIVED","UNDER_EXAMINATION","DISCREPANT","DOCUMENTS_ACCEPTED","PENDING_AMENDMENT"]', '["ACTIVE","PENDING"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- GUARANTEE - Free Format Message (English)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'GUARANTEE', 'en', 'Send Free Format Message', 'Send a free format SWIFT message (MT799/MT999)',
 'Send MT799 or MT999 free text message to counterparty bank for inquiries about guarantee status, claims, or amendments',
 'MT799', NULL, '["DRAFT","ISSUED","EXTENDED","CLAIMED","PENDING_AMENDMENT"]', '["ACTIVE","PENDING"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- GUARANTEE - Free Format Message (Spanish)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'GUARANTEE', 'es', 'Enviar Mensaje Texto Libre', 'Enviar mensaje SWIFT de formato libre (MT799/MT999)',
 'Enviar mensaje MT799 o MT999 de texto libre al banco contraparte para consultas sobre estado de garantia, reclamos o enmiendas',
 'MT799', NULL, '["DRAFT","ISSUED","EXTENDED","CLAIMED","PENDING_AMENDMENT"]', '["ACTIVE","PENDING"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- COLLECTION - Free Format Message (English)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'COLLECTION', 'en', 'Send Free Format Message', 'Send a free format SWIFT message (MT799/MT999)',
 'Send MT799 or MT999 free text message to collecting bank for inquiries about collection status, drawee response, or instructions',
 'MT799', NULL, '["ISSUED","SENT","PRESENTED","ACCEPTED","REFUSED"]', '["ACTIVE"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- COLLECTION - Free Format Message (Spanish)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_FREE_FORMAT', 'COLLECTION', 'es', 'Enviar Mensaje Texto Libre', 'Enviar mensaje SWIFT de formato libre (MT799/MT999)',
 'Enviar mensaje MT799 o MT999 de texto libre al banco cobrador para consultas sobre estado de cobranza, respuesta del girado o instrucciones',
 'MT799', NULL, '["ISSUED","SENT","PRESENTED","ACCEPTED","REFUSED"]', '["ACTIVE"]', NULL, NULL,
 'FiMessageSquare', 'teal', 20, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- EVENT FLOWS FOR FREE FORMAT MESSAGES
-- These flows allow sending free format from any active stage
-- =============================================

-- LC_IMPORT flows for free format (English)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_IMPORT', 'CONFIRM', 'CONFIRMED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_IMPORT', 'PRESENT_DOCS', 'DOCUMENTS_PRESENTED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_IMPORT', 'DISCREPANCY', 'DISCREPANT', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_IMPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry about amendment status', TRUE);

-- LC_IMPORT flows for free format (Spanish)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_IMPORT', 'CONFIRM', 'CONFIRMED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_IMPORT', 'PRESENT_DOCS', 'DOCUMENTS_PRESENTED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_IMPORT', 'DISCREPANCY', 'DISCREPANT', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_IMPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta sobre estado de enmienda', TRUE);

-- LC_EXPORT flows for free format (English)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('LC_EXPORT', NULL, 'DRAFT', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_EXPORT', 'ISSUE', 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_EXPORT', 'RECEIVE_DOCS', 'DOCUMENTS_RECEIVED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_EXPORT', 'EXAMINE_DOCS', 'UNDER_EXAMINATION', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_EXPORT', 'DISCREPANCY', 'DISCREPANT', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('LC_EXPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE);

-- LC_EXPORT flows for free format (Spanish)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('LC_EXPORT', NULL, 'DRAFT', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_EXPORT', 'ISSUE', 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_EXPORT', 'RECEIVE_DOCS', 'DOCUMENTS_RECEIVED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_EXPORT', 'EXAMINE_DOCS', 'UNDER_EXAMINATION', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_EXPORT', 'DISCREPANCY', 'DISCREPANT', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('LC_EXPORT', 'ACCEPT_DOCS', 'DOCUMENTS_ACCEPTED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE);

-- GUARANTEE flows for free format (English)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('GUARANTEE', NULL, 'DRAFT', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry about guarantee', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('GUARANTEE', 'EXTEND', 'EXTENDED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry or clarification', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 regarding claim status', TRUE),
('GUARANTEE', 'AMEND', 'PENDING_AMENDMENT', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry about amendment', TRUE);

-- GUARANTEE flows for free format (Spanish)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('GUARANTEE', NULL, 'DRAFT', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta sobre garantia', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('GUARANTEE', 'EXTEND', 'EXTENDED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta o aclaracion', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 sobre estado de reclamo', TRUE),
('GUARANTEE', 'AMEND', 'PENDING_AMENDMENT', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 para consulta sobre enmienda', TRUE);

-- COLLECTION flows for free format (English)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('COLLECTION', NULL, 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry to collecting bank', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry about collection status', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 inquiry about drawee response', TRUE),
('COLLECTION', 'ACCEPT', 'ACCEPTED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 follow-up message', TRUE),
('COLLECTION', 'REFUSE', 'REFUSED', 'SEND_FREE_FORMAT', FALSE, 100, 'en', 'Send Free Format Message', 'Send MT799 regarding refusal', TRUE);

-- COLLECTION flows for free format (Spanish)
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, transition_help, is_active) VALUES
('COLLECTION', NULL, 'ISSUED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 al banco cobrador', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 sobre estado de cobranza', TRUE),
('COLLECTION', 'PRESENT_DRAWEE', 'PRESENTED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 sobre respuesta del girado', TRUE),
('COLLECTION', 'ACCEPT', 'ACCEPTED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 de seguimiento', TRUE),
('COLLECTION', 'REFUSE', 'REFUSED', 'SEND_FREE_FORMAT', FALSE, 100, 'es', 'Enviar Mensaje Texto Libre', 'Enviar MT799 sobre el rechazo', TRUE);
