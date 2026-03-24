-- ==================================================
-- Migración V27: Corregir tipos de componentes y validaciones SWIFT MT700
-- ==================================================
-- Corrige campos que permiten valores incorrectos:
-- 1. :39B: Cambiar a DROPDOWN con valor NOT EXCEEDING
-- 2. :39C: Agregar validación numérica con decimales
-- 3. :40A: Corregir valores según estándar SWIFT (IRREVOCABLE, etc.)
-- 4. :41a:, :51a:, :52a:, :53a:, :54a:, :56a:, :57a:, :58a: Usar SWIFT_PARTY
-- 5. :71B: Validación de líneas y caracteres
-- ==================================================

-- Campo :39B: Monto Máximo del Crédito - Cambiar a DROPDOWN
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'NO EXCEDE', 'value', 'NOT EXCEEDING')
    ),
    validation_rules = JSON_OBJECT(
        'allowedValues', JSON_ARRAY('NOT EXCEEDING'),
        'patternMessage', 'Solo se permite el valor NOT EXCEEDING'
    )
WHERE field_code = ':39B:' AND message_type = 'MT700';

-- Campo :39C: Monto Adicional - Validación numérica
UPDATE swift_field_config_readmodel
SET component_type = 'TEXT_INPUT',
    validation_rules = JSON_OBJECT(
        'minValue', 0,
        'maxValue', 999999999999.99,
        'decimalSeparator', ',',
        'maxDecimals', 2,
        'pattern', '^[0-9]+([,][0-9]{1,2})?$',
        'patternMessage', 'Ingrese un número válido con máximo 2 decimales (usar coma)'
    )
WHERE field_code = ':39C:' AND message_type = 'MT700';

-- Campo :40A: Tipo de Crédito - Valores correctos según estándar SWIFT
-- Los valores válidos son: IRREVOCABLE, IRREVOCABLE TRANSFERABLE, etc.
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Irrevocable', 'value', 'IRREVOCABLE'),
        JSON_OBJECT('label', 'Irrevocable Transferible', 'value', 'IRREVOCABLE TRANSFERABLE'),
        JSON_OBJECT('label', 'Irrevocable Standby', 'value', 'IRREVOCABLE STANDBY'),
        JSON_OBJECT('label', 'Revocable', 'value', 'REVOCABLE'),
        JSON_OBJECT('label', 'Irrevocable Transferible Standby', 'value', 'IRREVOCABLE TRANSFERABLE STANDBY')
    ),
    validation_rules = JSON_OBJECT(
        'required', true,
        'allowedValues', JSON_ARRAY('IRREVOCABLE', 'IRREVOCABLE TRANSFERABLE', 'IRREVOCABLE STANDBY', 'REVOCABLE', 'IRREVOCABLE TRANSFERABLE STANDBY')
    )
WHERE field_code = ':40A:' AND message_type = 'MT700';

-- Campo :41a: Banco Disponible - Cambiar a SWIFT_PARTY con validación
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':41a:' AND message_type = 'MT700';

-- Campo :51a: Banco Emisor Solicitante - Cambiar a SWIFT_PARTY
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':51a:' AND message_type = 'MT700';

-- Campo :52a: Banco Emisor - Cambiar a SWIFT_PARTY
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':52a:' AND message_type = 'MT700';

-- Campo :53a: Banco del Remitente Corresponsal - Cambiar a SWIFT_PARTY
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':53a:' AND message_type = 'MT700';

-- Campo :54a: Banco del Receptor Corresponsal - Cambiar a SWIFT_PARTY
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':54a:' AND message_type = 'MT700';

-- Campo :56a: Banco Intermediario - Cambiar a SWIFT_PARTY
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':56a:' AND message_type = 'MT700';

-- Campo :57a: Banco de Aviso - Cambiar a SWIFT_PARTY
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':57a:' AND message_type = 'MT700';

-- Campo :58a: Banco Designado de Reembolso - Cambiar a SWIFT_PARTY
UPDATE swift_field_config_readmodel
SET component_type = 'SWIFT_PARTY',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'lineLabels', JSON_ARRAY('Código BIC/Nombre', 'Dirección', 'Ciudad', 'País')
    )
WHERE field_code = ':58a:' AND message_type = 'MT700';

-- Campo :71B: Cargos - Validación de líneas 6x35
UPDATE swift_field_config_readmodel
SET component_type = 'TEXTAREA',
    validation_rules = JSON_OBJECT(
        'maxLines', 6,
        'maxLineLength', 35,
        'patternMessage', 'Máximo 6 líneas de 35 caracteres cada una'
    )
WHERE field_code = ':71B:' AND message_type = 'MT700';

-- Verificar las actualizaciones
SELECT
    field_code,
    field_name,
    component_type,
    JSON_EXTRACT(validation_rules, '$.maxLines') as max_lines,
    JSON_EXTRACT(validation_rules, '$.maxLineLength') as max_line_length,
    JSON_EXTRACT(validation_rules, '$.allowedValues') as allowed_values
FROM swift_field_config_readmodel
WHERE field_code IN (':39B:', ':39C:', ':40A:', ':41a:', ':51a:', ':52a:', ':53a:', ':54a:', ':56a:', ':57a:', ':58a:', ':71B:')
  AND message_type = 'MT700'
  AND language = 'es'
ORDER BY display_order;
