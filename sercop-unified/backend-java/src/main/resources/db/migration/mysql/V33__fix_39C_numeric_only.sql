-- ==================================================
-- Migración V33: Corregir campo :39C: Monto Adicional
-- ==================================================
-- El campo :39C: es un monto numérico que representa
-- un monto adicional cubierto por la carta de crédito.
-- Debe usar inputMode numeric para filtrar letras.
-- ==================================================

-- Campo :39C: Monto Adicional - Solo números
UPDATE swift_field_config_readmodel
SET component_type = 'CURRENCY_AMOUNT',
    validation_rules = JSON_OBJECT(
        'minValue', 0,
        'maxValue', 9999999999999.99,
        'maxDecimals', 2,
        'decimalSeparator', ',',
        'pattern', '^[0-9]+([,][0-9]{1,2})?$',
        'patternMessage', 'Ingrese un monto válido (solo números, usar coma para decimales)',
        'inputMode', 'decimal'
    ),
    placeholder = 'Ej: 10000,00'
WHERE field_code = ':39C:' AND message_type = 'MT700' AND language = 'es';

-- Actualizar versión en inglés
UPDATE swift_field_config_readmodel
SET component_type = 'CURRENCY_AMOUNT',
    validation_rules = JSON_OBJECT(
        'minValue', 0,
        'maxValue', 9999999999999.99,
        'maxDecimals', 2,
        'decimalSeparator', ',',
        'pattern', '^[0-9]+([,][0-9]{1,2})?$',
        'patternMessage', 'Enter a valid amount (numbers only, use comma for decimals)',
        'inputMode', 'decimal'
    ),
    placeholder = 'E.g.: 10000,00'
WHERE field_code = ':39C:' AND message_type = 'MT700' AND language = 'en';

-- Verificar la actualización
SELECT
    field_code,
    field_name,
    component_type,
    placeholder,
    language
FROM swift_field_config_readmodel
WHERE field_code = ':39C:'
  AND message_type = 'MT700'
ORDER BY language;
