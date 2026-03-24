-- ==================================================
-- Migración V30: Cambiar campo :39A: a TOLERANCE_PERCENTAGE
-- ==================================================
-- El campo :39A: ahora usa un componente especializado con
-- dos campos separados para tolerancia + y -
-- ==================================================

UPDATE swift_field_config_readmodel
SET component_type = 'TOLERANCE_PERCENTAGE',
    validation_rules = JSON_OBJECT(
        'pattern', '^[0-9]{1,2}/[0-9]{1,2}$',
        'patternMessage', 'Formato: NN/NN (ejemplo: 05/05 para +/-5%)'
    ),
    placeholder = 'Tolerancia sobre/bajo el monto'
WHERE field_code = ':39A:' AND message_type = 'MT700';

-- Verificar la actualización
SELECT
    field_code,
    field_name,
    component_type,
    placeholder
FROM swift_field_config_readmodel
WHERE field_code = ':39A:'
  AND message_type = 'MT700'
  AND language = 'es';
