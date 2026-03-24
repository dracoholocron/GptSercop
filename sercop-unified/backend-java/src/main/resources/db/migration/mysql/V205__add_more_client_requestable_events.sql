-- V205: Add more client-requestable events and enable existing ones
-- Enable CLOSE and PAYMENT events for client portal

-- =====================================================
-- LC_IMPORT - Enable CLOSE (Cancellation/Closure)
-- =====================================================
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'CLOSURE',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de cierre/cancelacion...',
            'placeholderEn', 'Please explain the reason for this closure/cancellation request...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'cancellationReason',
            'labelEs', 'Razon de Cancelacion',
            'labelEn', 'Cancellation Reason',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Detalle la razon especifica...',
            'placeholderEn', 'Detail the specific reason...',
            'rows', 2
        )
    )
WHERE event_code = 'CLOSE'
  AND operation_type = 'LC_IMPORT';

-- =====================================================
-- LC_IMPORT - Enable PAYMENT (Payment Instruction)
-- =====================================================
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'PAYMENT',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Instrucciones de Pago',
            'labelEn', 'Payment Instructions',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Proporcione instrucciones detalladas para el pago...',
            'placeholderEn', 'Provide detailed payment instructions...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'paymentAmount',
            'labelEs', 'Monto a Pagar',
            'labelEn', 'Payment Amount',
            'type', 'number',
            'required', TRUE,
            'useOperationAmountAsPlaceholder', TRUE
        ),
        JSON_OBJECT(
            'name', 'debitAccountNumber',
            'labelEs', 'Cuenta de Debito',
            'labelEn', 'Debit Account',
            'type', 'text',
            'required', TRUE,
            'placeholderEs', 'Ingrese el numero de cuenta',
            'placeholderEn', 'Enter account number'
        )
    )
WHERE event_code = 'PAYMENT'
  AND operation_type = 'LC_IMPORT';

-- =====================================================
-- Add event flow entries to allow client requests from ISSUED stage
-- These flows allow clients to request these events even if operation is in ISSUED stage
-- =====================================================

-- Add flow for CLOSE from ISSUED stage (client cancellation request)
INSERT IGNORE INTO event_flow_config_readmodel
(operation_type, from_event_code, from_stage, to_event_code, conditions, is_required, is_optional, sequence_order, language, transition_label, transition_help, is_active)
VALUES
('LC_IMPORT', NULL, 'ISSUED', 'CLOSE', NULL, FALSE, TRUE, 100, 'es', 'Solicitar Cancelacion', 'Solicitar cancelacion de la carta de credito', TRUE),
('LC_IMPORT', NULL, 'ISSUED', 'CLOSE', NULL, FALSE, TRUE, 100, 'en', 'Request Cancellation', 'Request cancellation of the letter of credit', TRUE),
('LC_IMPORT', NULL, 'ADVISED', 'CLOSE', NULL, FALSE, TRUE, 100, 'es', 'Solicitar Cancelacion', 'Solicitar cancelacion de la carta de credito', TRUE),
('LC_IMPORT', NULL, 'ADVISED', 'CLOSE', NULL, FALSE, TRUE, 100, 'en', 'Request Cancellation', 'Request cancellation of the letter of credit', TRUE);

-- =====================================================
-- LC_EXPORT - Enable similar events
-- =====================================================
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'CLOSURE',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud...',
            'placeholderEn', 'Please explain the reason for this request...',
            'rows', 3
        )
    )
WHERE event_code = 'CLOSE'
  AND operation_type = 'LC_EXPORT';

UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'PAYMENT',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Instrucciones de Pago',
            'labelEn', 'Payment Instructions',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Proporcione instrucciones detalladas...',
            'placeholderEn', 'Provide detailed instructions...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'paymentAmount',
            'labelEs', 'Monto',
            'labelEn', 'Amount',
            'type', 'number',
            'required', TRUE,
            'useOperationAmountAsPlaceholder', TRUE
        )
    )
WHERE event_code = 'PAYMENT'
  AND operation_type = 'LC_EXPORT';

-- Add flows for LC_EXPORT
INSERT IGNORE INTO event_flow_config_readmodel
(operation_type, from_event_code, from_stage, to_event_code, conditions, is_required, is_optional, sequence_order, language, transition_label, transition_help, is_active)
VALUES
('LC_EXPORT', NULL, 'ISSUED', 'CLOSE', NULL, FALSE, TRUE, 100, 'es', 'Solicitar Cancelacion', 'Solicitar cancelacion', TRUE),
('LC_EXPORT', NULL, 'ISSUED', 'CLOSE', NULL, FALSE, TRUE, 100, 'en', 'Request Cancellation', 'Request cancellation', TRUE);
