-- ==================================================
-- Migración V16: Corregir component_type del campo :40A:
-- ==================================================
-- El campo :40A: tenía component_type = 'SELECT' pero debería ser 'DROPDOWN'
-- para ser consistente con :40E: y otros campos de selección.
-- El componente DynamicSwiftField.tsx solo reconoce 'DROPDOWN' para
-- renderizar listas de opciones.
-- ==================================================

-- Actualizar campo :40A: para que use component_type = 'DROPDOWN'
UPDATE swift_field_config_readmodel
SET
    component_type = 'DROPDOWN',
    field_type = 'SELECT'
WHERE field_code = ':40A:'
  AND message_type = 'MT700';

-- Verificar el cambio
SELECT
    field_code,
    field_name,
    component_type,
    field_type,
    CASE
        WHEN field_options IS NOT NULL THEN 'Sí'
        ELSE 'No'
    END as 'Tiene Opciones'
FROM swift_field_config_readmodel
WHERE field_code IN (':40A:', ':40E:')
  AND message_type = 'MT700';
