-- ==================================================
-- Migración V24: Agregar validaciones SWIFT MT700
-- ==================================================
-- Actualiza las reglas de validación para campos SWIFT
-- según el estándar SWIFT para mensajes MT700
-- ==================================================

-- Campo :20: Sender's Reference
-- Formato: 16x (máximo 16 caracteres alfanuméricos)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''+\\s]{1,16}$',
    'patternMessage', 'Máximo 16 caracteres. Permitidos: letras, números, /−?:().,''+ y espacios'
)
WHERE field_code = ':20:' AND message_type = 'MT700';

-- Campo :31C: Fecha de Emisión
-- Formato: YYMMDD o YYYYMMDD
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'dateFormat', 'YYYYMMDD',
    'minDate', 'today'
)
WHERE field_code = ':31C:' AND message_type = 'MT700';

-- Campo :31D: Fecha de Vencimiento
-- Formato: YYMMDD en lugar, YYYYMMDD
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'dateFormat', 'YYYYMMDD',
    'minDateField', ':31C:',
    'minDateMessage', 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
)
WHERE field_code = ':31D:' AND message_type = 'MT700';

-- Campo :32B: Monto
-- Formato: 3!a15d (3 letras moneda + hasta 15 dígitos con coma decimal)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'minValue', 0.01,
    'maxValue', 999999999999.99,
    'decimalSeparator', ',',
    'maxDecimals', 2,
    'currencyRequired', true
)
WHERE field_code = ':32B:' AND message_type = 'MT700';

-- Campo :40A: Tipo de Crédito Disponible
-- Valores: IRREVOCABLE, BY ACCEPTANCE, BY NEGOTIATION, BY DEF PAYMENT, BY MIXED PYMT
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'allowedValues', JSON_ARRAY('IRREVOCABLE', 'BY ACCEPTANCE', 'BY NEGOTIATION', 'BY DEF PAYMENT', 'BY MIXED PYMT')
)
WHERE field_code = ':40A:' AND message_type = 'MT700';

-- Campo :41a: Banco Disponible
-- Formato: Opción A = código BIC (8 u 11 caracteres), Opción D = 4 líneas x 35 caracteres
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':41a:' AND message_type = 'MT700';

-- Campo :43P: Embarques Parciales
-- Valores: ALLOWED, CONDITIONAL, NOT ALLOWED
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'allowedValues', JSON_ARRAY('ALLOWED', 'CONDITIONAL', 'NOT ALLOWED')
)
WHERE field_code = ':43P:' AND message_type = 'MT700';

-- Campo :43T: Transbordos
-- Valores: ALLOWED, CONDITIONAL, NOT ALLOWED
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'allowedValues', JSON_ARRAY('ALLOWED', 'CONDITIONAL', 'NOT ALLOWED')
)
WHERE field_code = ':43T:' AND message_type = 'MT700';

-- Campo :44A: Puerto/Lugar de Embarque
-- Formato: 65x (máximo 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLength', 65,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''+\\s]{0,65}$'
)
WHERE field_code = ':44A:' AND message_type = 'MT700';

-- Campo :44B: Puerto/Lugar de Destino
-- Formato: 65x (máximo 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLength', 65,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''+\\s]{0,65}$'
)
WHERE field_code = ':44B:' AND message_type = 'MT700';

-- Campo :45A: Descripción de Mercancías
-- Formato: 100*65x (hasta 100 líneas de 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 100,
    'maxLineLength', 65
)
WHERE field_code = ':45A:' AND message_type = 'MT700';

-- Campo :46A: Documentos Requeridos
-- Formato: 100*65x (hasta 100 líneas de 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 100,
    'maxLineLength', 65
)
WHERE field_code = ':46A:' AND message_type = 'MT700';

-- Campo :50: Ordenante (SWIFT_PARTY)
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'lineLabels', JSON_ARRAY('Nombre/Razón Social', 'Dirección', 'Ciudad', 'País')
)
WHERE field_code = ':50:' AND message_type = 'MT700';

-- Campo :59: Beneficiario (SWIFT_PARTY)
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'required', true,
    'maxLines', 4,
    'maxLineLength', 35,
    'lineLabels', JSON_ARRAY('Nombre/Razón Social', 'Dirección', 'Ciudad', 'País')
)
WHERE field_code = ':59:' AND message_type = 'MT700';

-- Campo :39A: Tolerancia Porcentual
-- Formato: 2n/2n (ejemplo: 05/05 para +/-5%)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'pattern', '^[0-9]{1,2}/[0-9]{1,2}$',
    'patternMessage', 'Formato: NN/NN (ejemplo: 05/05 para +/-5%)',
    'maxLength', 5
)
WHERE field_code = ':39A:' AND message_type = 'MT700';

-- Campo :39B: Monto Máximo del Crédito
-- Formato: BOOLEAN + monto opcional
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'allowedValues', JSON_ARRAY('NOT EXCEEDING'),
    'amountOptional', true
)
WHERE field_code = ':39B:' AND message_type = 'MT700';

-- Verificar las actualizaciones
SELECT
    field_code,
    field_name,
    field_type,
    validation_rules
FROM swift_field_config_readmodel
WHERE message_type = 'MT700'
  AND language = 'es'
  AND validation_rules IS NOT NULL
ORDER BY display_order;
