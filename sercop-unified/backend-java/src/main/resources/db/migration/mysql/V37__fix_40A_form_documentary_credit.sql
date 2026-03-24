-- ==================================================
-- Migración V37: Corregir campo :40A: (Form of Documentary Credit)
-- ==================================================
-- El campo :40A: debe tener valores SWIFT válidos según estándar MT700
-- Valores correctos: IRREVOCABLE, IRREVOCABLE TRANSFERABLE, REVOCABLE, etc.
-- También asegura que el component_type sea DROPDOWN para que funcione
-- correctamente en el frontend.
-- ==================================================

-- Actualizar :40A: para MT700 con valores SWIFT correctos
UPDATE swift_field_config_readmodel
SET
    component_type = 'DROPDOWN',
    field_type = 'SELECT',
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
WHERE field_code = ':40A:'
  AND message_type = 'MT700';

-- Verificar la actualización
SELECT
    field_code,
    field_name,
    component_type,
    field_options,
    validation_rules
FROM swift_field_config_readmodel
WHERE field_code = ':40A:'
  AND message_type = 'MT700';
