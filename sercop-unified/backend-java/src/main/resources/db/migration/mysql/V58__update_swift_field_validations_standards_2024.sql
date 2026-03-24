-- ==================================================
-- Migración V58: Actualización de Validaciones SWIFT según Normativa Vigente 2024
-- ==================================================
-- Esta migración actualiza todas las reglas de validación de campos SWIFT
-- para cumplir con los estándares ISO 15022 y las especificaciones SWIFT 2024
--
-- Tipos de Mensaje Cubiertos:
-- - MT700: Issue of a Documentary Credit
-- - MT707: Amendment to a Documentary Credit
-- - MT710: Advice of a Third Bank's Documentary Credit
-- - MT720: Transfer of a Documentary Credit
-- - MT730: Acknowledgement
-- - MT760: Guarantee/Standby Letter of Credit
-- - MT767: Guarantee/Standby LC Amendment
-- - MT400: Advice of Payment (Collections)
-- - MT410: Acknowledgement (Collections)
-- - MT412: Advice of Acceptance
-- - MT416: Advice of Non-Payment/Non-Acceptance
-- - MT420: Tracer
--
-- Referencia: SWIFT ISO15022, Category 7 - Documentary Credits and Guarantees
-- ==================================================

-- ============================================
-- SECCIÓN 1: ACTUALIZACIONES MT700
-- Issue of a Documentary Credit
-- ============================================

-- Campo :27: Sequence of Total - Formato: 1!n/1!n (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^[1-9][0-9]?/[1-9][0-9]?$',
    'patternMessage', 'Formato requerido: n/n (ejemplo: 1/1, 1/3). Máximo 99 mensajes.',
    'maxLength', 5
)
WHERE field_code = ':27:' AND message_type = 'MT700';

-- Campo :20: Documentary Credit Number - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Máximo 16 caracteres. Caracteres permitidos: a-z, A-Z, 0-9, /, -, ?, :, (, ), ., ,, '', +, espacio',
    'swiftCharacterSet', 'x'
)
WHERE field_code = ':20:' AND message_type = 'MT700';

-- Campo :23: Reference to Pre-Advice - Formato: 16x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,16}$',
    'patternMessage', 'Máximo 16 caracteres alfanuméricos',
    'swiftCharacterSet', 'x'
)
WHERE field_code = ':23:' AND message_type = 'MT700';

-- Campo :31C: Date of Issue - Formato: 6!n (YYMMDD) (Opcional)
-- Acepta formato ISO (YYYY-MM-DD) para facilitar entrada desde formularios
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Formato de fecha: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10
)
WHERE field_code = ':31C:' AND message_type = 'MT700';

-- Campo :31D: Date and Place of Expiry - Formato: 6!n29x (Obligatorio)
-- minDateField: La fecha de vencimiento debe ser posterior a la fecha de emisión (:31C:)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,29}$',
    'patternMessage', 'Formato: YYMMDD o YYYY-MM-DD seguido de lugar de vencimiento (máx 29 caracteres)',
    'maxLength', 39,
    'dateFormat', 'YYMMDD',
    'minDateField', ':31C:',
    'minDateMessage', 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':31D:' AND message_type = 'MT700';

-- Campo :40A: Form of Documentary Credit - Formato: 24x (Obligatorio)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Irrevocable', 'value', 'IRREVOCABLE'),
        JSON_OBJECT('label', 'Irrevocable Transferible', 'value', 'IRREVOCABLE TRANSFERABLE'),
        JSON_OBJECT('label', 'Irrevocable Standby', 'value', 'IRREVOCABLE STANDBY'),
        JSON_OBJECT('label', 'Irrevocable Transferible Standby', 'value', 'IRREVOC TRANS STANDBY'),
        JSON_OBJECT('label', 'Revocable', 'value', 'REVOCABLE'),
        JSON_OBJECT('label', 'Revocable Transferible', 'value', 'REVOCABLE TRANSFERABLE')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'allowedValues', JSON_ARRAY(
            'IRREVOCABLE',
            'IRREVOCABLE TRANSFERABLE',
            'IRREVOCABLE STANDBY',
            'IRREVOC TRANS STANDBY',
            'REVOCABLE',
            'REVOCABLE TRANSFERABLE'
        ),
        'maxLength', 24
    )
WHERE field_code = ':40A:' AND message_type = 'MT700';

-- Campo :40E: Applicable Rules - Formato: 30x[/35x] (Obligatorio)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'UCP Vigente (UCP600)', 'value', 'UCP LATEST VERSION'),
        JSON_OBJECT('label', 'eUCP Vigente', 'value', 'EUCP LATEST VERSION'),
        JSON_OBJECT('label', 'ISP Vigente (ISP98)', 'value', 'ISP LATEST VERSION'),
        JSON_OBJECT('label', 'UCP 600', 'value', 'UCP600'),
        JSON_OBJECT('label', 'UCP 500', 'value', 'UCP500'),
        JSON_OBJECT('label', 'Otras Reglas', 'value', 'OTHR'),
        JSON_OBJECT('label', 'URR Vigente', 'value', 'URR LATEST VERSION'),
        JSON_OBJECT('label', 'UCPURR Vigente', 'value', 'UCPURR LATEST VERSION')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'maxLength', 66,
        'patternMessage', 'Código de reglas aplicables + narrativa opcional (máx 35 caracteres)'
    )
WHERE field_code = ':40E:' AND message_type = 'MT700';

-- Campo :32B: Currency Code, Amount - Formato: 3!a15d (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'currencyMessage', 'Código de moneda ISO 4217 de 3 letras (ej: USD, EUR, MXN)',
    'amountPattern', '^[0-9]{1,12},[0-9]{1,3}$',
    'amountMessage', 'Monto con coma decimal. Máximo 12 dígitos enteros y 3 decimales',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':32B:' AND message_type = 'MT700';

-- Campo :39A: Percentage Credit Amount Tolerance - Formato: 2n/2n (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^[0-9]{1,2}/[0-9]{1,2}$',
    'patternMessage', 'Formato: NN/NN donde NN es el porcentaje (00-99). Ejemplo: 05/05 para +/-5%',
    'maxLength', 5,
    'minValue', 0,
    'maxValue', 99,
    'customValidator', 'toleranceValidator',
    'swiftFormat', '2n/2n'
)
WHERE field_code = ':39A:' AND message_type = 'MT700';

-- Campo :39B: Maximum Credit Amount - Formato: 13x (Condicional)
-- NOTA: Este campo ha sido marcado para eliminación en estándares recientes
-- pero se mantiene por compatibilidad con sistemas legacy
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'No Excede', 'value', 'NOT EXCEEDING')
    ),
    validation_rules = JSON_OBJECT(
        'required', false,
        'allowedValues', JSON_ARRAY('NOT EXCEEDING'),
        'maxLength', 13,
        'deprecationWarning', 'Este campo será eliminado en futuras versiones del estándar SWIFT',
        'swiftFormat', '13x'
    )
WHERE field_code = ':39B:' AND message_type = 'MT700';

-- Campo :39C: Additional Amounts Covered - Formato: 4*35x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'patternMessage', 'Máximo 4 líneas de 35 caracteres cada una',
    'swiftFormat', '4*35x'
)
WHERE field_code = ':39C:' AND message_type = 'MT700';

-- Campo :41a: Available With...By... - Formato: Opción A (BIC) o D (4*35x) (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres. Formato: 4!a2!a2!c[3!c]',
    'availabilityOptions', JSON_ARRAY(
        'BY ACCEPTANCE',
        'BY DEF PAYMENT',
        'BY MIXED PYMT',
        'BY NEGOTIATION',
        'BY PAYMENT'
    ),
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':41a:' AND message_type = 'MT700';

-- Campo :42C: Drafts at... - Formato: 3*35x (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 3,
    'maxLineLength', 35,
    'patternMessage', 'Tenor de giros. Máximo 3 líneas de 35 caracteres',
    'swiftFormat', '3*35x'
)
WHERE field_code = ':42C:' AND message_type = 'MT700';

-- Campo :42a: Drawee - Formato: Opción A (BIC) o D (4*35x) (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':42a:' AND message_type = 'MT700';

-- Campo :42M: Mixed Payment Details - Formato: 4*35x (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'patternMessage', 'Detalles de pago mixto. Máximo 4 líneas de 35 caracteres',
    'swiftFormat', '4*35x'
)
WHERE field_code = ':42M:' AND message_type = 'MT700';

-- Campo :42P: Negotiation/Deferred Payment Details - Formato: 4*35x (Condicional)
-- NOTA: El título cambió de "Deferred Payment Details" a "Negotiation/Deferred Payment Details"
UPDATE swift_field_config_readmodel
SET field_name = CASE
        WHEN language = 'es' THEN 'Detalles de Negociación/Pago Diferido'
        ELSE 'Negotiation/Deferred Payment Details'
    END,
    validation_rules = JSON_OBJECT(
        'required', false,
        'maxLines', 4,
        'maxLineLength', 35,
        'patternMessage', 'Detalles de negociación o pago diferido. Máximo 4 líneas de 35 caracteres',
        'swiftFormat', '4*35x'
    )
WHERE field_code = ':42P:' AND message_type = 'MT700';

-- Campo :43P: Partial Shipments - Formato: 35x (Opcional)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Permitidos', 'value', 'ALLOWED'),
        JSON_OBJECT('label', 'Condicional', 'value', 'CONDITIONAL'),
        JSON_OBJECT('label', 'No Permitidos', 'value', 'NOT ALLOWED')
    ),
    validation_rules = JSON_OBJECT(
        'required', false,
        'allowedValues', JSON_ARRAY('ALLOWED', 'CONDITIONAL', 'NOT ALLOWED'),
        'maxLength', 35,
        'conditionalNote', 'Si se selecciona CONDITIONAL, especificar detalles en campo 47A',
        'swiftFormat', '35x'
    )
WHERE field_code = ':43P:' AND message_type = 'MT700';

-- Campo :43T: Transshipment (ortografía corregida) - Formato: 35x (Opcional)
UPDATE swift_field_config_readmodel
SET field_name = CASE
        WHEN language = 'es' THEN 'Transbordo'
        ELSE 'Transshipment'
    END,
    component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Permitido', 'value', 'ALLOWED'),
        JSON_OBJECT('label', 'Condicional', 'value', 'CONDITIONAL'),
        JSON_OBJECT('label', 'No Permitido', 'value', 'NOT ALLOWED')
    ),
    validation_rules = JSON_OBJECT(
        'required', false,
        'allowedValues', JSON_ARRAY('ALLOWED', 'CONDITIONAL', 'NOT ALLOWED'),
        'maxLength', 35,
        'conditionalNote', 'Si se selecciona CONDITIONAL, especificar detalles en campo 47A',
        'swiftFormat', '35x'
    )
WHERE field_code = ':43T:' AND message_type = 'MT700';

-- Campo :44A: Place of Taking in Charge/Dispatch from.../Place of Receipt - Formato: 65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 65,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,65}$',
    'patternMessage', 'Lugar de recepción/despacho. Máximo 65 caracteres',
    'swiftFormat', '65x'
)
WHERE field_code = ':44A:' AND message_type = 'MT700';

-- Campo :44E: Port of Loading/Airport of Departure - Formato: 65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 65,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,65}$',
    'patternMessage', 'Puerto de carga o aeropuerto de salida. Máximo 65 caracteres',
    'swiftFormat', '65x'
)
WHERE field_code = ':44E:' AND message_type = 'MT700';

-- Campo :44F: Port of Discharge/Airport of Destination - Formato: 65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 65,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,65}$',
    'patternMessage', 'Puerto de descarga o aeropuerto de destino. Máximo 65 caracteres',
    'swiftFormat', '65x'
)
WHERE field_code = ':44F:' AND message_type = 'MT700';

-- Campo :44B: Place of Final Destination/For Transportation to.../Place of Delivery - Formato: 65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 65,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,65}$',
    'patternMessage', 'Lugar de destino final/entrega. Máximo 65 caracteres',
    'swiftFormat', '65x'
)
WHERE field_code = ':44B:' AND message_type = 'MT700';

-- Campo :44C: Latest Date of Shipment - Formato: 6!n (Condicional)
-- minDateField: La fecha de embarque debe ser posterior a la fecha de emisión (:31C:)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Fecha límite de embarque. Formato: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10,
    'swiftFormat', '6!n',
    'minDateField', ':31C:',
    'minDateMessage', 'La fecha de embarque debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':44C:' AND message_type = 'MT700';

-- Campo :44D: Shipment Period - Formato: 6*65x (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 65,
    'patternMessage', 'Período de embarque. Máximo 6 líneas de 65 caracteres',
    'swiftFormat', '6*65x'
)
WHERE field_code = ':44D:' AND message_type = 'MT700';

-- Campo :45A: Description of Goods and/or Services - Formato: 100*65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 100,
    'maxLineLength', 65,
    'patternMessage', 'Descripción de mercancías/servicios. Máximo 100 líneas de 65 caracteres',
    'swiftFormat', '100*65x'
)
WHERE field_code = ':45A:' AND message_type = 'MT700';

-- Campo :46A: Documents Required - Formato: 100*65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 100,
    'maxLineLength', 65,
    'patternMessage', 'Documentos requeridos. Máximo 100 líneas de 65 caracteres',
    'swiftFormat', '100*65x'
)
WHERE field_code = ':46A:' AND message_type = 'MT700';

-- Campo :47A: Additional Conditions - Formato: 100*65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 100,
    'maxLineLength', 65,
    'patternMessage', 'Condiciones adicionales. Máximo 100 líneas de 65 caracteres',
    'swiftFormat', '100*65x'
)
WHERE field_code = ':47A:' AND message_type = 'MT700';

-- Campo :48: Period for Presentation - Formato: 4*35x (Opcional)
-- NOTA: Renombrado a "Period for Presentation in Days" - solo números de días
UPDATE swift_field_config_readmodel
SET field_name = CASE
        WHEN language = 'es' THEN 'Período de Presentación (Días)'
        ELSE 'Period for Presentation in Days'
    END,
    validation_rules = JSON_OBJECT(
        'required', false,
        'maxLines', 4,
        'maxLineLength', 35,
        'patternMessage', 'Máximo 4 líneas de 35 caracteres. Si solo días, usar hasta 3 dígitos',
        'daysOnlyPattern', '^[0-9]{1,3}$',
        'daysOnlyMessage', 'Número de días calendario después de la fecha de embarque (máx 999)',
        'swiftFormat', '4*35x'
    )
WHERE field_code = ':48:' AND message_type = 'MT700';

-- Campo :49: Confirmation Instructions - Formato: 7!x (Obligatorio)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Confirmar', 'value', 'CONFIRM'),
        JSON_OBJECT('label', 'Puede Agregar', 'value', 'MAY ADD'),
        JSON_OBJECT('label', 'Sin Instrucciones', 'value', 'WITHOUT')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'allowedValues', JSON_ARRAY('CONFIRM', 'MAY ADD', 'WITHOUT'),
        'maxLength', 7,
        'swiftFormat', '7!x'
    )
WHERE field_code = ':49:' AND message_type = 'MT700';

-- Campo :50: Applicant - Formato: 4*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'lineLabels', JSON_ARRAY('Nombre/Razón Social', 'Dirección', 'Ciudad', 'País'),
    'patternMessage', 'Datos del ordenante. Máximo 4 líneas de 35 caracteres',
    'swiftFormat', '4*35x'
)
WHERE field_code = ':50:' AND message_type = 'MT700';

-- Campo :51a: Applicant Bank - Formato: Opción A (BIC) o D (4*35x) (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':51a:' AND message_type = 'MT700';

-- Campo :52a: Issuing Bank - Formato: Opción A (BIC) o D (4*35x) (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':52a:' AND message_type = 'MT700';

-- Campo :53a: Reimbursing Bank - Formato: Opción A (BIC) o D (4*35x) (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':53a:' AND message_type = 'MT700';

-- Campo :54a: Receiver's Correspondent - Formato: Opción A (BIC) o D (4*35x) (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':54a:' AND message_type = 'MT700';

-- Campo :56a: Intermediary Bank - Formato: Opción A (BIC) o D (4*35x) (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':56a:' AND message_type = 'MT700';

-- Campo :57a: 'Advise Through' Bank - Formato: Opción A, B o D (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | B: [/34x]35x | D: 4*35x'
)
WHERE field_code = ':57a:' AND message_type = 'MT700';

-- Campo :58a: Beneficiary's Bank - Formato: Opción A (BIC) o D (4*35x) (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':58a:' AND message_type = 'MT700';

-- Campo :59: Beneficiary - Formato: [/34x]4*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'accountPattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,34}$',
    'maxLines', 4,
    'maxLineLength', 35,
    'lineLabels', JSON_ARRAY('Nombre/Razón Social', 'Dirección', 'Ciudad', 'País'),
    'patternMessage', 'Datos del beneficiario. Cuenta opcional (34 chars) + 4 líneas de 35 caracteres',
    'swiftFormat', '[/34x]4*35x'
)
WHERE field_code = ':59:' AND message_type = 'MT700';

-- Campo :71B: Charges - Formato: 6*35x (Opcional)
-- NOTA: En estándares recientes el campo cambió a :71D: con códigos específicos
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 35,
    'patternMessage', 'Cargos al beneficiario. Máximo 6 líneas de 35 caracteres',
    'chargeCodes', JSON_ARRAY('AGENT', 'COMM', 'CORCOM', 'DISC', 'INSUR', 'POST', 'STAMP', 'TELECHAR', 'WAREHOUS'),
    'swiftFormat', '6*35x',
    'noteNewFormat', 'En mensajes nuevos use códigos: AGENT, COMM, CORCOM, DISC, INSUR, POST, STAMP, TELECHAR, WAREHOUS seguidos de moneda y monto'
)
WHERE field_code = ':71B:' AND message_type = 'MT700';

-- Campo :72: Sender to Receiver Information - Formato: 6*35x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 35,
    'patternMessage', 'Información adicional banco a banco. Máximo 6 líneas de 35 caracteres',
    'swiftFormat', '6*35x'
)
WHERE field_code = ':72:' AND message_type = 'MT700';

-- Campo :78: Instructions to Paying/Accepting/Negotiating Bank - Formato: 12*65x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 12,
    'maxLineLength', 65,
    'patternMessage', 'Instrucciones al banco pagador/aceptante/negociador. Máximo 12 líneas de 65 caracteres',
    'swiftFormat', '12*65x'
)
WHERE field_code = ':78:' AND message_type = 'MT700';

-- ============================================
-- SECCIÓN 2: ACTUALIZACIONES MT707
-- Amendment to a Documentary Credit
-- ============================================

-- Campo :20: Sender's Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia del remitente. Máximo 16 caracteres',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT707';

-- Campo :21: Receiver's Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia de la LC original. Máximo 16 caracteres',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT707';

-- Campo :23: Issuing Bank's Reference - Formato: 16x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,16}$',
    'patternMessage', 'Referencia del banco emisor. Máximo 16 caracteres',
    'swiftFormat', '16x'
)
WHERE field_code = ':23:' AND message_type = 'MT707';

-- Campo :26E: Number of Amendment - Formato: 2n (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^[0-9]{1,2}$',
    'patternMessage', 'Número de enmienda (1-99)',
    'minValue', 1,
    'maxValue', 99,
    'swiftFormat', '2n'
)
WHERE field_code = ':26E:' AND message_type = 'MT707';

-- Campo :30: Date of Amendment - Formato: 6!n (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Fecha de enmienda. Formato: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10,
    'swiftFormat', '6!n'
)
WHERE field_code = ':30:' AND message_type = 'MT707';

-- Campo :31C: Date of Issue - Formato: 6!n (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Fecha de emisión original. Formato: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10,
    'swiftFormat', '6!n'
)
WHERE field_code = ':31C:' AND message_type = 'MT707';

-- Campo :31E: New Date of Expiry - Formato: 6!n (Condicional)
-- minDateField: La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda (:30:)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Nueva fecha de vencimiento. Formato: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10,
    'swiftFormat', '6!n',
    'minDateField', ':30:',
    'minDateMessage', 'La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda'
)
WHERE field_code = ':31E:' AND message_type = 'MT707';

-- Campo :32B: Increase of Credit Amount - Formato: 3!a15d (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'currencyMessage', 'Código de moneda ISO 4217',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':32B:' AND message_type = 'MT707';

-- Campo :33B: Decrease of Credit Amount - Formato: 3!a15d (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'currencyMessage', 'Código de moneda ISO 4217',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':33B:' AND message_type = 'MT707';

-- Campo :34B: New Credit Amount After Amendment - Formato: 3!a15d (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'currencyMessage', 'Código de moneda ISO 4217',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':34B:' AND message_type = 'MT707';

-- Campo :39A: Percentage Credit Amount Tolerance - Formato: 2n/2n (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^[0-9]{1,2}/[0-9]{1,2}$',
    'patternMessage', 'Formato: NN/NN (ejemplo: 05/05 para +/-5%)',
    'maxLength', 5,
    'swiftFormat', '2n/2n'
)
WHERE field_code = ':39A:' AND message_type = 'MT707';

-- Campo :52a: Issuing Bank - Formato: Opción A o D (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC de 8 u 11 caracteres',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':52a:' AND message_type = 'MT707';

-- Campo :59: Beneficiary (before amendment) - Formato: [/34x]4*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'accountPattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,34}$',
    'maxLines', 4,
    'maxLineLength', 35,
    'patternMessage', 'Beneficiario antes de la enmienda',
    'swiftFormat', '[/34x]4*35x'
)
WHERE field_code = ':59:' AND message_type = 'MT707';

-- Campo :79: Narrative - Formato: 35*50x (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 35,
    'maxLineLength', 50,
    'patternMessage', 'Texto narrativo de la enmienda. Máximo 35 líneas de 50 caracteres',
    'swiftFormat', '35*50x'
)
WHERE field_code = ':79:' AND message_type = 'MT707';

-- Campo :72: Sender to Receiver Information - Formato: 6*35x (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 35,
    'patternMessage', 'Información banco a banco. Máximo 6 líneas de 35 caracteres',
    'swiftFormat', '6*35x'
)
WHERE field_code = ':72:' AND message_type = 'MT707';

-- ============================================
-- SECCIÓN 3: ACTUALIZACIONES MT710
-- Advice of a Third Bank's Documentary Credit
-- ============================================

-- Campo :27: Sequence of Total - Formato: 1!n/1!n (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^[1-9][0-9]?/[1-9][0-9]?$',
    'patternMessage', 'Formato: n/n (ejemplo: 1/1)',
    'maxLength', 5,
    'swiftFormat', '1!n/1!n'
)
WHERE field_code = ':27:' AND message_type = 'MT710';

-- Campo :40B: Form of Documentary Credit - Formato: 24x/24x (Obligatorio)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Irrevocable / Agregar Confirmación', 'value', 'IRREVOCABLE/ADD CONFIRMATION'),
        JSON_OBJECT('label', 'Irrevocable / Sin Agregar', 'value', 'IRREVOCABLE/WITHOUT'),
        JSON_OBJECT('label', 'Irrevocable / Puede Agregar', 'value', 'IRREVOCABLE/MAY ADD'),
        JSON_OBJECT('label', 'Irrevocable Transferible / Agregar', 'value', 'IRREVOCABLE TRANSFERABLE/ADD CONFIRMATION'),
        JSON_OBJECT('label', 'Irrevocable Transferible / Sin', 'value', 'IRREVOCABLE TRANSFERABLE/WITHOUT'),
        JSON_OBJECT('label', 'Irrevocable Standby / Agregar', 'value', 'IRREVOCABLE STANDBY/ADD CONFIRMATION'),
        JSON_OBJECT('label', 'Irrevocable Standby / Sin', 'value', 'IRREVOCABLE STANDBY/WITHOUT')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'maxLength', 49,
        'swiftFormat', '24x/24x'
    )
WHERE field_code = ':40B:' AND message_type = 'MT710';

-- Campo :20: Sender's Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT710';

-- Campo :21: Documentary Credit Number - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Número de LC asignado por banco emisor. Máximo 16 caracteres',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT710';

-- Campo :31C: Date of Issue - Formato: 6!n (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Fecha de emisión. Formato: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10,
    'swiftFormat', '6!n'
)
WHERE field_code = ':31C:' AND message_type = 'MT710';

-- Campo :40E: Applicable Rules - Formato: 30x[/35x] (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 66,
    'swiftFormat', '30x[/35x]'
)
WHERE field_code = ':40E:' AND message_type = 'MT710';

-- Campo :31D: Date and Place of Expiry - Formato: 6!n29x (Obligatorio)
-- minDateField: La fecha de vencimiento debe ser posterior a la fecha de emisión (:31C:)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,29}$',
    'patternMessage', 'Formato: YYMMDD o YYYY-MM-DD + lugar (máx 29 chars)',
    'maxLength', 39,
    'dateFormat', 'YYMMDD',
    'swiftFormat', '6!n29x',
    'minDateField', ':31C:',
    'minDateMessage', 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':31D:' AND message_type = 'MT710';

-- Campo :52a: Issuing Bank - Formato: Opción A o D (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':52a:' AND message_type = 'MT710';

-- Campo :50B: Non-Bank Issuer - Formato: 4*35x (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'patternMessage', 'Emisor no bancario. Máximo 4 líneas de 35 caracteres',
    'swiftFormat', '4*35x'
)
WHERE field_code = ':50B:' AND message_type = 'MT710';

-- Campo :51a: Applicant Bank - Formato: Opción A o D (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':51a:' AND message_type = 'MT710';

-- Campo :50: Applicant - Formato: 4*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'swiftFormat', '4*35x'
)
WHERE field_code = ':50:' AND message_type = 'MT710';

-- Campo :59: Beneficiary - Formato: [/34x]4*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'accountPattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,34}$',
    'maxLines', 4,
    'maxLineLength', 35,
    'swiftFormat', '[/34x]4*35x'
)
WHERE field_code = ':59:' AND message_type = 'MT710';

-- Campo :32B: Currency Code, Amount - Formato: 3!a15d (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':32B:' AND message_type = 'MT710';

-- Campo :41a: Available With...By... - Formato: Opción A o D (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':41a:' AND message_type = 'MT710';

-- Campo :49: Confirmation Instructions - Formato: 7!x (Obligatorio)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Confirmar', 'value', 'CONFIRM'),
        JSON_OBJECT('label', 'Puede Agregar', 'value', 'MAY ADD'),
        JSON_OBJECT('label', 'Sin Instrucciones', 'value', 'WITHOUT')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'allowedValues', JSON_ARRAY('CONFIRM', 'MAY ADD', 'WITHOUT'),
        'maxLength', 7,
        'swiftFormat', '7!x'
    )
WHERE field_code = ':49:' AND message_type = 'MT710';

-- ============================================
-- SECCIÓN 4: ACTUALIZACIONES MT720
-- Transfer of a Documentary Credit
-- ============================================

-- Campo :20: Sender's Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT720';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia de la LC transferible original',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT720';

-- Campo :32B: Amount Transferred - Formato: 3!a15d (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':32B:' AND message_type = 'MT720';

-- Campo :50: First Beneficiary - Formato: 4*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'patternMessage', 'Primer beneficiario que transfiere',
    'swiftFormat', '4*35x'
)
WHERE field_code = ':50:' AND message_type = 'MT720';

-- Campo :59: Second Beneficiary - Formato: [/34x]4*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'accountPattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,34}$',
    'maxLines', 4,
    'maxLineLength', 35,
    'patternMessage', 'Segundo beneficiario receptor de la transferencia',
    'swiftFormat', '[/34x]4*35x'
)
WHERE field_code = ':59:' AND message_type = 'MT720';

-- ============================================
-- SECCIÓN 5: ACTUALIZACIONES MT760
-- Guarantee/Standby Letter of Credit
-- ============================================

-- Campo :27: Sequence of Total - Formato: 1!n/1!n (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^[1-9][0-9]?/[1-9][0-9]?$',
    'patternMessage', 'Formato: n/n (ejemplo: 1/1). Máx 8 MT761 adicionales',
    'maxLength', 5,
    'swiftFormat', '1!n/1!n'
)
WHERE field_code = ':27:' AND message_type = 'MT760';

-- Campo :20: Transaction Reference Number - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Número de garantía. Máximo 16 caracteres',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT760';

-- Campo :23: Further Identification - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Emitir Garantía', 'value', 'ISSUE'),
        JSON_OBJECT('label', 'Solicitar Emisión', 'value', 'REQUEST'),
        JSON_OBJECT('label', 'Garantía de Licitación', 'value', 'ISSBID'),
        JSON_OBJECT('label', 'Garantía de Anticipo', 'value', 'ISSADV'),
        JSON_OBJECT('label', 'Garantía de Cumplimiento', 'value', 'ISSPER'),
        JSON_OBJECT('label', 'Garantía de Pago', 'value', 'ISSPAY')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'maxLength', 16,
        'swiftFormat', '16x'
    )
WHERE field_code = ':23:' AND message_type = 'MT760';

-- Campo :30: Date - Formato: 6!n (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Fecha de emisión. Formato: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10,
    'swiftFormat', '6!n'
)
WHERE field_code = ':30:' AND message_type = 'MT760';

-- Campo :40C: Applicable Rules - Formato: 4!a[/35x] (Obligatorio)
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'URDG 758', 'value', 'URDG'),
        JSON_OBJECT('label', 'ISP98', 'value', 'ISPR'),
        JSON_OBJECT('label', 'UCP 600', 'value', 'UCPR'),
        JSON_OBJECT('label', 'Otras Reglas', 'value', 'OTHR'),
        JSON_OBJECT('label', 'Sin Reglas Específicas', 'value', 'NONE')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'allowedValues', JSON_ARRAY('URDG', 'ISPR', 'UCPR', 'OTHR', 'NONE'),
        'maxLength', 40,
        'patternMessage', 'Reglas aplicables: URDG (URDG 758), ISPR (ISP98), UCPR (UCP), OTHR, NONE',
        'swiftFormat', '4!a[/35x]'
    )
WHERE field_code = ':40C:' AND message_type = 'MT760';

-- Campo :77C: Details of Guarantee - Formato: 150*65x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 150,
    'maxLineLength', 65,
    'patternMessage', 'Términos y condiciones de la garantía. Máximo 150 líneas de 65 caracteres',
    'swiftFormat', '150*65x'
)
WHERE field_code = ':77C:' AND message_type = 'MT760';

-- Campo :72: Sender to Receiver Information - Formato: 6*35x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 35,
    'patternMessage', 'Información adicional. Máximo 6 líneas de 35 caracteres',
    'swiftFormat', '6*35x'
)
WHERE field_code = ':72:' AND message_type = 'MT760';

-- Actualizar otros campos MT760 existentes
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'swiftFormat', '4*35x'
)
WHERE field_code = ':50:' AND message_type = 'MT760';

UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'accountPattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,34}$',
    'maxLines', 4,
    'maxLineLength', 35,
    'swiftFormat', '[/34x]4*35x'
)
WHERE field_code = ':59:' AND message_type = 'MT760';

UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':32B:' AND message_type = 'MT760';

-- ============================================
-- SECCIÓN 6: ACTUALIZACIONES MT767
-- Guarantee/Standby LC Amendment
-- ============================================

-- Campo :20: Sender's Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT767';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia del MT760 original',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT767';

-- Campo :31D: New Expiry Date - Formato: 6!n (Condicional)
-- minDateField: La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda (:30:)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'pattern', '^([0-9]{6}|[0-9]{4}-[0-9]{2}-[0-9]{2})$',
    'patternMessage', 'Nueva fecha de vencimiento. Formato: YYMMDD o YYYY-MM-DD',
    'dateFormat', 'YYMMDD',
    'maxLength', 10,
    'swiftFormat', '6!n',
    'minDateField', ':30:',
    'minDateMessage', 'La nueva fecha de vencimiento debe ser posterior a la fecha de enmienda'
)
WHERE field_code = ':31D:' AND message_type = 'MT767';

-- Campo :32B: Increase/Decrease Amount - Formato: 3!a15d (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'minValue', -999999999999.999,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'patternMessage', 'Incremento (positivo) o decremento (negativo) del monto',
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':32B:' AND message_type = 'MT767';

-- Campo :77C: Terms and Conditions - Formato: 150*65x (Condicional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 150,
    'maxLineLength', 65,
    'patternMessage', 'Nuevos términos y condiciones. Máximo 150 líneas de 65 caracteres',
    'swiftFormat', '150*65x'
)
WHERE field_code = ':77C:' AND message_type = 'MT767';

-- ============================================
-- SECCIÓN 7: ACTUALIZACIONES MT730
-- Acknowledgement
-- ============================================

-- Campo :20: Transaction Reference Number - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT730';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia del mensaje reconocido (MT700, MT707, etc.)',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT730';

-- Campo :25: Account Identification - Formato: 35x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 35,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,35}$',
    'swiftFormat', '35x'
)
WHERE field_code = ':25:' AND message_type = 'MT730';

-- ============================================
-- SECCIÓN 8: ACTUALIZACIONES MT400
-- Advice of Payment (Collections)
-- ============================================

-- Campo :20: Sending Bank's TRN - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia del banco remitente',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT400';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia de la cobranza',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT400';

-- Campo :32a: Amount Collected - Formato: Opción A, B o K (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'patternMessage', 'Monto cobrado con fecha de vencimiento',
    'swiftFormat', 'A: 6!n3!a15d | B: 3!a15d | K: 1!a3!n2!a3!a15d'
)
WHERE field_code = ':32a:' AND message_type = 'MT400';

-- Campo :33A: Proceeds Remitted - Formato: 6!n3!a15d (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'patternMessage', 'Monto remitido con fecha valor',
    'swiftFormat', '6!n3!a15d'
)
WHERE field_code = ':33A:' AND message_type = 'MT400';

-- Campo :52a: Ordering Bank - Formato: Opción A o D (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'swiftFormat', 'A: [/34x]4!a2!a2!c[3!c] | D: 4*35x'
)
WHERE field_code = ':52a:' AND message_type = 'MT400';

-- Campo :71B: Details of Charges - Formato: 6*35x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 35,
    'patternMessage', 'Detalles de cargos deducidos',
    'swiftFormat', '6*35x'
)
WHERE field_code = ':71B:' AND message_type = 'MT400';

-- Campo :72: Sender to Receiver Information - Formato: 6*35x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 35,
    'patternMessage', 'Información adicional',
    'swiftFormat', '6*35x'
)
WHERE field_code = ':72:' AND message_type = 'MT400';

-- Campo :73: Details of Amounts Added - Formato: 6*35x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLines', 6,
    'maxLineLength', 35,
    'patternMessage', 'Montos adicionales al capital',
    'swiftFormat', '6*35x'
)
WHERE field_code = ':73:' AND message_type = 'MT400';

-- ============================================
-- SECCIÓN 9: ACTUALIZACIONES MT410
-- Acknowledgement (Collections)
-- ============================================

-- Campo :20: Transaction Reference Number - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT410';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia de la cobranza reconocida',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT410';

-- Campo :23: Further Identification - Formato: 16x (Opcional)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', false,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{0,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':23:' AND message_type = 'MT410';

-- ============================================
-- SECCIÓN 10: ACTUALIZACIONES MT412
-- Advice of Acceptance
-- ============================================

-- Campo :20: Sender's Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT412';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia de la cobranza aceptada',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT412';

-- Campo :32a: Amount Accepted - Formato: 3!a15d (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'currencyRequired', true,
    'currencyPattern', '^[A-Z]{3}$',
    'minValue', 0.01,
    'maxValue', 999999999999.999,
    'decimalSeparator', ',',
    'maxDecimals', 3,
    'swiftFormat', '3!a15d'
)
WHERE field_code = ':32a:' AND message_type = 'MT412';

-- Campo :33a: Date of Acceptance - Formato: 6!n (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^[0-9]{6}$',
    'patternMessage', 'Fecha de aceptación. Formato: YYMMDD',
    'dateFormat', 'YYMMDD',
    'maxLength', 6,
    'swiftFormat', '6!n'
)
WHERE field_code = ':33a:' AND message_type = 'MT412';

-- ============================================
-- SECCIÓN 11: ACTUALIZACIONES MT416
-- Advice of Non-Payment/Non-Acceptance
-- ============================================

-- Campo :20: Sender's Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT416';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia de la cobranza rechazada',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT416';

-- Campo :77A: Reason for Non-Payment/Non-Acceptance - Formato: 20*35x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 20,
    'maxLineLength', 35,
    'patternMessage', 'Razones del rechazo. Máximo 20 líneas de 35 caracteres',
    'swiftFormat', '20*35x'
)
WHERE field_code = ':77A:' AND message_type = 'MT416';

-- ============================================
-- SECCIÓN 12: ACTUALIZACIONES MT420
-- Tracer (Collections)
-- ============================================

-- Campo :20: Transaction Reference Number - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'swiftFormat', '16x'
)
WHERE field_code = ':20:' AND message_type = 'MT420';

-- Campo :21: Related Reference - Formato: 16x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''\\+ ]{1,16}$',
    'patternMessage', 'Referencia de la operación a rastrear',
    'swiftFormat', '16x'
)
WHERE field_code = ':21:' AND message_type = 'MT420';

-- Campo :11S: MT and Date of the Original Message - Formato: 3!n6!n (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'pattern', '^[0-9]{3}[0-9]{6}$',
    'patternMessage', 'Tipo de mensaje SWIFT y fecha. Formato: nnnYYMMDD (ej: 400251215)',
    'maxLength', 9,
    'swiftFormat', '3!n6!n'
)
WHERE field_code = ':11S:' AND message_type = 'MT420';

-- Campo :79: Narrative - Formato: 35*50x (Obligatorio)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 35,
    'maxLineLength', 50,
    'patternMessage', 'Descripción del seguimiento. Máximo 35 líneas de 50 caracteres',
    'swiftFormat', '35*50x'
)
WHERE field_code = ':79:' AND message_type = 'MT420';

-- ============================================
-- SECCIÓN 13: CAMPOS ADICIONALES Y CORRECCIONES
-- ============================================

-- Agregar campo :49G: Special Payment Conditions for Beneficiary (Nuevo en SR2018)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, language, created_by, created_at
)
SELECT
    UUID(),
    ':49G:',
    CASE WHEN language = 'es' THEN 'Condiciones Especiales de Pago para Beneficiario' ELSE 'Special Payment Conditions for Beneficiary' END,
    CASE WHEN language = 'es' THEN 'Condiciones especiales de pago aplicables al beneficiario' ELSE 'Special payment conditions applicable to the beneficiary' END,
    'MT700',
    'CONDICIONES',
    35,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    CASE WHEN language = 'es' THEN 'Condiciones especiales...' ELSE 'Special conditions...' END,
    '{"required": false, "maxLines": 100, "maxLineLength": 65, "swiftFormat": "100*65x"}',
    CASE WHEN language = 'es' THEN 'Condiciones especiales de pago para el beneficiario (campo introducido en SR2018)' ELSE 'Special payment conditions for the beneficiary (field introduced in SR2018)' END,
    language,
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM swift_field_config_readmodel
WHERE field_code = ':49:' AND message_type = 'MT700'
AND NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE field_code = ':49G:' AND message_type = 'MT700');

-- Agregar campo :49H: Special Payment Conditions for Receiving Bank (Nuevo en SR2018)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, language, created_by, created_at
)
SELECT
    UUID(),
    ':49H:',
    CASE WHEN language = 'es' THEN 'Condiciones Especiales de Pago para Banco Receptor' ELSE 'Special Payment Conditions for Receiving Bank' END,
    CASE WHEN language = 'es' THEN 'Condiciones especiales de pago aplicables al banco receptor' ELSE 'Special payment conditions applicable to the receiving bank' END,
    'MT700',
    'CONDICIONES',
    36,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    CASE WHEN language = 'es' THEN 'Condiciones especiales...' ELSE 'Special conditions...' END,
    '{"required": false, "maxLines": 100, "maxLineLength": 65, "swiftFormat": "100*65x"}',
    CASE WHEN language = 'es' THEN 'Condiciones especiales de pago para el banco receptor (campo introducido en SR2018)' ELSE 'Special payment conditions for the receiving bank (field introduced in SR2018)' END,
    language,
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM swift_field_config_readmodel
WHERE field_code = ':49:' AND message_type = 'MT700'
AND NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE field_code = ':49H:' AND message_type = 'MT700');

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Contar campos actualizados por tipo de mensaje
SELECT
    message_type,
    COUNT(*) as total_fields,
    SUM(CASE WHEN validation_rules IS NOT NULL THEN 1 ELSE 0 END) as fields_with_validation
FROM swift_field_config_readmodel
WHERE message_type IN ('MT700', 'MT707', 'MT710', 'MT720', 'MT730', 'MT760', 'MT767', 'MT400', 'MT410', 'MT412', 'MT416', 'MT420')
GROUP BY message_type
ORDER BY message_type;

-- ================================================
-- Fin de migración V58
-- ================================================
