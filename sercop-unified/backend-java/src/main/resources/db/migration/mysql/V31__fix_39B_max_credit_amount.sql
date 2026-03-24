-- ==================================================
-- Migración V31: Corregir campo :39B: Monto Máximo del Crédito
-- ==================================================
-- El campo :39B: captura el monto máximo que NO EXCEDE.
-- Según SWIFT MT700:
-- - Formato: 13d (monto numérico hasta 13 dígitos + decimales)
-- - El mensaje SWIFT incluye "NOT EXCEEDING" + el monto
-- - El UI debe capturar el monto, no un dropdown
-- ==================================================

-- Campo :39B: Monto Máximo del Crédito
-- Cambiar a CURRENCY_AMOUNT con validación numérica apropiada
UPDATE swift_field_config_readmodel
SET component_type = 'CURRENCY_AMOUNT',
    field_name = 'Monto Máximo (No Excede)',
    description = 'Monto máximo que el crédito no debe exceder',
    field_options = NULL,
    placeholder = 'Ingrese el monto máximo',
    help_text = 'El monto máximo que la carta de crédito no debe exceder. Este campo genera "NOT EXCEEDING [monto]" en el mensaje SWIFT.',
    validation_rules = JSON_OBJECT(
        'minValue', 0.01,
        'maxValue', 9999999999999.99,
        'maxDecimals', 2,
        'decimalSeparator', ',',
        'pattern', '^[0-9]+([,][0-9]{1,2})?$',
        'patternMessage', 'Ingrese un monto válido con máximo 2 decimales (usar coma)'
    )
WHERE field_code = ':39B:' AND message_type = 'MT700';

-- Actualizar también la versión en inglés
UPDATE swift_field_config_readmodel
SET component_type = 'CURRENCY_AMOUNT',
    field_name = 'Maximum Amount (Not Exceeding)',
    description = 'Maximum amount the credit must not exceed',
    field_options = NULL,
    placeholder = 'Enter maximum amount',
    help_text = 'The maximum amount the letter of credit must not exceed. This field generates "NOT EXCEEDING [amount]" in the SWIFT message.',
    validation_rules = JSON_OBJECT(
        'minValue', 0.01,
        'maxValue', 9999999999999.99,
        'maxDecimals', 2,
        'decimalSeparator', ',',
        'pattern', '^[0-9]+([,][0-9]{1,2})?$',
        'patternMessage', 'Enter a valid amount with maximum 2 decimals (use comma)'
    )
WHERE field_code = ':39B:' AND message_type = 'MT700' AND language = 'en';

-- Verificar las actualizaciones
SELECT
    field_code,
    field_name,
    component_type,
    placeholder,
    help_text,
    language
FROM swift_field_config_readmodel
WHERE field_code = ':39B:'
  AND message_type = 'MT700'
ORDER BY language;
