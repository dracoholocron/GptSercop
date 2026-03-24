-- ==================================================
-- Migración V32: Corregir campo :39B: a Switch/Toggle
-- ==================================================
-- El campo :39B: es un indicador booleano que señala si el
-- monto del crédito "NO EXCEDE" el valor en :32B:
-- Cuando está activo genera "NOT EXCEEDING" en el mensaje SWIFT
-- ==================================================

-- Campo :39B: Monto Máximo del Crédito - Cambiar a Switch
UPDATE swift_field_config_readmodel
SET component_type = 'NOT_EXCEEDING',
    field_name = 'No Excede el Monto',
    description = 'Indica que el crédito no debe exceder el monto especificado',
    field_options = NULL,
    placeholder = NULL,
    help_text = 'Active esta opción si el monto de la carta de crédito no debe exceder el valor especificado en el campo Monto y Moneda (:32B:)',
    validation_rules = JSON_OBJECT(
        'allowedValues', JSON_ARRAY('NOT EXCEEDING', '')
    )
WHERE field_code = ':39B:' AND message_type = 'MT700' AND language = 'es';

-- Actualizar también la versión en inglés
UPDATE swift_field_config_readmodel
SET component_type = 'NOT_EXCEEDING',
    field_name = 'Does Not Exceed Amount',
    description = 'Indicates that the credit must not exceed the specified amount',
    field_options = NULL,
    placeholder = NULL,
    help_text = 'Enable this option if the letter of credit amount must not exceed the value specified in the Currency and Amount field (:32B:)',
    validation_rules = JSON_OBJECT(
        'allowedValues', JSON_ARRAY('NOT EXCEEDING', '')
    )
WHERE field_code = ':39B:' AND message_type = 'MT700' AND language = 'en';

-- Verificar las actualizaciones
SELECT
    field_code,
    field_name,
    component_type,
    help_text,
    language
FROM swift_field_config_readmodel
WHERE field_code = ':39B:'
  AND message_type = 'MT700'
ORDER BY language;
