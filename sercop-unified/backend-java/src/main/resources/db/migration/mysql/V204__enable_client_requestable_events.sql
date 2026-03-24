-- V204: Enable client-requestable events for the client portal
-- This migration marks specific post-issuance events as available for client requests

-- =====================================================
-- LC_IMPORT EVENTS
-- =====================================================

-- LC_IMPORT - Amendment (AMEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'AMENDMENT',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de enmienda...',
            'placeholderEn', 'Please explain the reason for this amendment request...',
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
WHERE event_code = 'AMEND'
  AND operation_type = 'LC_IMPORT';

-- =====================================================
-- LC_EXPORT EVENTS
-- =====================================================

-- LC_EXPORT - Amendment (AMEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'AMENDMENT',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de enmienda...',
            'placeholderEn', 'Please explain the reason for this amendment request...',
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
WHERE event_code = 'AMEND'
  AND operation_type = 'LC_EXPORT';

-- =====================================================
-- GUARANTEE EVENTS (Garantias Bancarias)
-- =====================================================

-- GUARANTEE - Amendment (AMEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'AMENDMENT',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de enmienda...',
            'placeholderEn', 'Please explain the reason for this amendment request...',
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
WHERE event_code = 'AMEND'
  AND operation_type = 'GUARANTEE';

-- GUARANTEE - Extension/Renewal (EXTEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'EXTENSION',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de renovacion...',
            'placeholderEn', 'Please explain the reason for this renewal request...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'newExpiryDate',
            'labelEs', 'Nueva Fecha de Vencimiento',
            'labelEn', 'New Expiry Date',
            'type', 'date',
            'required', TRUE
        ),
        JSON_OBJECT(
            'name', 'newAmount',
            'labelEs', 'Nuevo Monto (opcional)',
            'labelEn', 'New Amount (optional)',
            'type', 'number',
            'required', FALSE,
            'useOperationAmountAsPlaceholder', TRUE
        )
    )
WHERE event_code = 'EXTEND'
  AND operation_type = 'GUARANTEE';

-- GUARANTEE - Release/Cancellation (RELEASE)
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
            'placeholderEs', 'Por favor explique la razon de esta solicitud de liberacion/cancelacion...',
            'placeholderEn', 'Please explain the reason for this release/cancellation request...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'cancellationReason',
            'labelEs', 'Razon de Cancelacion',
            'labelEn', 'Cancellation Reason',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Detalle la razon especifica de la liberacion...',
            'placeholderEn', 'Detail the specific reason for release...',
            'rows', 2
        )
    )
WHERE event_code = 'RELEASE'
  AND operation_type = 'GUARANTEE';

-- =====================================================
-- COLLECTION EVENTS (Cobranzas)
-- =====================================================

-- COLLECTION - Close (CLOSE) - acts as cancellation
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
            'labelEs', 'Razon de Cierre',
            'labelEn', 'Closure Reason',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Detalle la razon especifica del cierre...',
            'placeholderEn', 'Detail the specific reason for closure...',
            'rows', 2
        )
    )
WHERE event_code = 'CLOSE'
  AND operation_type = 'COLLECTION';

-- =====================================================
-- GUARANTEE_ISSUED EVENTS (Garantias Emitidas)
-- =====================================================

-- GUARANTEE_ISSUED - Amendment (AMEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'AMENDMENT',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de enmienda...',
            'placeholderEn', 'Please explain the reason for this amendment request...',
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
WHERE event_code = 'AMEND'
  AND operation_type = 'GUARANTEE_ISSUED';

-- GUARANTEE_ISSUED - Extension (EXTEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'EXTENSION',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de renovacion...',
            'placeholderEn', 'Please explain the reason for this renewal request...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'newExpiryDate',
            'labelEs', 'Nueva Fecha de Vencimiento',
            'labelEn', 'New Expiry Date',
            'type', 'date',
            'required', TRUE
        ),
        JSON_OBJECT(
            'name', 'newAmount',
            'labelEs', 'Nuevo Monto (opcional)',
            'labelEn', 'New Amount (optional)',
            'type', 'number',
            'required', FALSE,
            'useOperationAmountAsPlaceholder', TRUE
        )
    )
WHERE event_code = 'EXTEND'
  AND operation_type = 'GUARANTEE_ISSUED';

-- GUARANTEE_ISSUED - Release (RELEASE)
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
            'placeholderEs', 'Por favor explique la razon de esta solicitud de liberacion/cancelacion...',
            'placeholderEn', 'Please explain the reason for this release/cancellation request...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'cancellationReason',
            'labelEs', 'Razon de Cancelacion',
            'labelEn', 'Cancellation Reason',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Detalle la razon especifica de la liberacion...',
            'placeholderEn', 'Detail the specific reason for release...',
            'rows', 2
        )
    )
WHERE event_code = 'RELEASE'
  AND operation_type = 'GUARANTEE_ISSUED';

-- =====================================================
-- AVAL EVENTS (Avales)
-- =====================================================

-- AVAL - Amendment (AMEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'AMENDMENT',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de enmienda...',
            'placeholderEn', 'Please explain the reason for this amendment request...',
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
WHERE event_code = 'AMEND'
  AND operation_type = 'AVAL';

-- AVAL - Extension (EXTEND)
UPDATE event_type_config_readmodel
SET is_client_requestable = TRUE,
    event_source = 'CLIENT_PORTAL',
    event_category = 'EXTENSION',
    form_fields_config = JSON_ARRAY(
        JSON_OBJECT(
            'name', 'justification',
            'labelEs', 'Justificacion',
            'labelEn', 'Justification',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Por favor explique la razon de esta solicitud de renovacion...',
            'placeholderEn', 'Please explain the reason for this renewal request...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'newExpiryDate',
            'labelEs', 'Nueva Fecha de Vencimiento',
            'labelEn', 'New Expiry Date',
            'type', 'date',
            'required', TRUE
        ),
        JSON_OBJECT(
            'name', 'newAmount',
            'labelEs', 'Nuevo Monto (opcional)',
            'labelEn', 'New Amount (optional)',
            'type', 'number',
            'required', FALSE,
            'useOperationAmountAsPlaceholder', TRUE
        )
    )
WHERE event_code = 'EXTEND'
  AND operation_type = 'AVAL';

-- AVAL - Release (RELEASE)
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
            'placeholderEs', 'Por favor explique la razon de esta solicitud de liberacion/cancelacion...',
            'placeholderEn', 'Please explain the reason for this release/cancellation request...',
            'rows', 3
        ),
        JSON_OBJECT(
            'name', 'cancellationReason',
            'labelEs', 'Razon de Cancelacion',
            'labelEn', 'Cancellation Reason',
            'type', 'textarea',
            'required', TRUE,
            'placeholderEs', 'Detalle la razon especifica de la liberacion...',
            'placeholderEn', 'Detail the specific reason for release...',
            'rows', 2
        )
    )
WHERE event_code = 'RELEASE'
  AND operation_type = 'AVAL';

-- =====================================================
-- COLLECTION_IMPORT / COLLECTION_EXPORT EVENTS
-- =====================================================

-- COLLECTION_IMPORT - Close
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
            'placeholderEs', 'Por favor explique la razon de esta solicitud de cierre...',
            'placeholderEn', 'Please explain the reason for this closure request...',
            'rows', 3
        )
    )
WHERE event_code = 'CLOSE'
  AND operation_type = 'COLLECTION_IMPORT';

-- COLLECTION_EXPORT - Close
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
            'placeholderEs', 'Por favor explique la razon de esta solicitud de cierre...',
            'placeholderEn', 'Please explain the reason for this closure request...',
            'rows', 3
        )
    )
WHERE event_code = 'CLOSE'
  AND operation_type = 'COLLECTION_EXPORT';
