-- ==================================================
-- Migración V34: Actualizar validación de Documentos Requeridos
-- ==================================================
-- Asegura que el campo :46A: tenga la configuración correcta
-- de maxLineLength para el control de caracteres por línea
-- ==================================================

-- Campo :46A: Documentos Requeridos
-- Formato: 100*65x (hasta 100 líneas de 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 100,
    'maxLineLength', 65
)
WHERE field_code = ':46A:' AND message_type = 'MT700';

-- Verificar la actualización
SELECT
    field_code,
    field_name,
    field_type,
    validation_rules
FROM swift_field_config_readmodel
WHERE field_code = ':46A:'
  AND message_type = 'MT700'
  AND language = 'es';
