-- ==================================================
-- Migración V28: Corregir campo :39A: Tolerancia Porcentual
-- ==================================================
-- El campo :39A: solo debe permitir formato NN/NN (ej: 05/05 para +/-5%)
-- Se cambia a TEXT_INPUT con validación de patrón estricto
-- ==================================================

-- Campo :39A: Tolerancia Porcentual - Formato estricto NN/NN
UPDATE swift_field_config_readmodel
SET component_type = 'TEXT_INPUT',
    validation_rules = JSON_OBJECT(
        'pattern', '^[0-9]{1,2}/[0-9]{1,2}$',
        'patternMessage', 'Formato requerido: NN/NN (ejemplo: 05/05 para tolerancia de +/-5%)',
        'maxLength', 5,
        'inputMode', 'numeric',
        'placeholder', '05/05'
    ),
    placeholder = 'Ej: 05/05'
WHERE field_code = ':39A:' AND message_type = 'MT700';

-- Verificar la actualización
SELECT
    field_code,
    field_name,
    component_type,
    placeholder,
    validation_rules
FROM swift_field_config_readmodel
WHERE field_code = ':39A:'
  AND message_type = 'MT700'
  AND language = 'es';
