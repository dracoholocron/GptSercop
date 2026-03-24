-- ==================================================
-- Migración V25: Corregir campos DROPDOWN y agregar validaciones
-- ==================================================
-- Corrige el component_type de SELECT a DROPDOWN para :43P: y :43T:
-- Agrega la opción CONDITIONAL a fieldOptions
-- ==================================================

-- Campo :43P: Embarques Parciales - Corregir componentType y fieldOptions
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Permitido', 'value', 'ALLOWED'),
        JSON_OBJECT('label', 'Condicional', 'value', 'CONDITIONAL'),
        JSON_OBJECT('label', 'No Permitido', 'value', 'NOT ALLOWED')
    )
WHERE field_code = ':43P:' AND message_type = 'MT700';

-- Campo :43T: Transbordos - Corregir componentType y fieldOptions
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Permitido', 'value', 'ALLOWED'),
        JSON_OBJECT('label', 'Condicional', 'value', 'CONDITIONAL'),
        JSON_OBJECT('label', 'No Permitido', 'value', 'NOT ALLOWED')
    )
WHERE field_code = ':43T:' AND message_type = 'MT700';

-- Campo :40A: Tipo de Crédito Disponible - Asegurar que sea DROPDOWN
UPDATE swift_field_config_readmodel
SET component_type = 'DROPDOWN',
    field_options = JSON_ARRAY(
        JSON_OBJECT('label', 'Irrevocable', 'value', 'IRREVOCABLE'),
        JSON_OBJECT('label', 'Por Aceptación', 'value', 'BY ACCEPTANCE'),
        JSON_OBJECT('label', 'Por Negociación', 'value', 'BY NEGOTIATION'),
        JSON_OBJECT('label', 'Por Pago Diferido', 'value', 'BY DEF PAYMENT'),
        JSON_OBJECT('label', 'Por Pago Mixto', 'value', 'BY MIXED PYMT')
    )
WHERE field_code = ':40A:' AND message_type = 'MT700';

-- Verificar las actualizaciones
SELECT
    field_code,
    field_name,
    component_type,
    field_options,
    validation_rules
FROM swift_field_config_readmodel
WHERE field_code IN (':43P:', ':43T:', ':40A:')
  AND message_type = 'MT700'
  AND language = 'es'
ORDER BY display_order;
