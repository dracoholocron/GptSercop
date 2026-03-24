-- V203: Add form_fields_config column to event_type_config_readmodel
-- This allows configuring which form fields should appear for each event type in the client portal

-- Add column only if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'event_type_config_readmodel' AND column_name = 'form_fields_config');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE event_type_config_readmodel ADD COLUMN form_fields_config JSON NULL COMMENT ''JSON array defining form fields for client portal event requests''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update AMENDMENT events with appropriate form fields
UPDATE event_type_config_readmodel
SET form_fields_config = JSON_ARRAY(
    JSON_OBJECT(
        'name', 'justification',
        'labelEs', 'Justificacion',
        'labelEn', 'Justification',
        'type', 'textarea',
        'required', TRUE,
        'placeholderEs', 'Por favor explique la razon de esta solicitud...',
        'placeholderEn', 'Please explain the reason for this request...',
        'rows', 3
    ),
    JSON_OBJECT(
        'name', 'newAmount',
        'labelEs', 'Nuevo Monto',
        'labelEn', 'New Amount',
        'type', 'number',
        'required', FALSE,
        'useOperationAmountAsPlaceholder', TRUE
    ),
    JSON_OBJECT(
        'name', 'newExpiryDate',
        'labelEs', 'Nueva Fecha de Vencimiento',
        'labelEn', 'New Expiry Date',
        'type', 'date',
        'required', FALSE
    )
)
WHERE event_category = 'AMENDMENT'
  AND is_client_requestable = TRUE;

-- Update CLOSURE/CANCELLATION events
UPDATE event_type_config_readmodel
SET form_fields_config = JSON_ARRAY(
    JSON_OBJECT(
        'name', 'justification',
        'labelEs', 'Justificacion',
        'labelEn', 'Justification',
        'type', 'textarea',
        'required', TRUE,
        'placeholderEs', 'Por favor explique la razon de esta solicitud...',
        'placeholderEn', 'Please explain the reason for this request...',
        'rows', 3
    ),
    JSON_OBJECT(
        'name', 'cancellationReason',
        'labelEs', 'Razon de Cancelacion',
        'labelEn', 'Cancellation Reason',
        'type', 'textarea',
        'required', TRUE,
        'placeholderEs', 'Por favor proporcione la razon de la cancelacion...',
        'placeholderEn', 'Please provide the reason for cancellation...',
        'rows', 3
    )
)
WHERE event_category = 'CLOSURE'
  AND is_client_requestable = TRUE;

-- Update PAYMENT events
UPDATE event_type_config_readmodel
SET form_fields_config = JSON_ARRAY(
    JSON_OBJECT(
        'name', 'justification',
        'labelEs', 'Justificacion',
        'labelEn', 'Justification',
        'type', 'textarea',
        'required', TRUE,
        'placeholderEs', 'Por favor explique la razon de esta solicitud...',
        'placeholderEn', 'Please explain the reason for this request...',
        'rows', 3
    ),
    JSON_OBJECT(
        'name', 'paymentAmount',
        'labelEs', 'Monto del Pago',
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
WHERE event_category = 'PAYMENT'
  AND is_client_requestable = TRUE;

-- Update other POST_ISSUANCE events with basic justification field
UPDATE event_type_config_readmodel
SET form_fields_config = JSON_ARRAY(
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
WHERE is_client_requestable = TRUE
  AND form_fields_config IS NULL
  AND event_category NOT IN ('ISSUANCE');
