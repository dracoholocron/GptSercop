-- ==================================================
-- Migración V26: Agregar validaciones SWIFT faltantes para MT700
-- ==================================================
-- Agrega validaciones para todos los campos MT700 según estándar SWIFT
-- ==================================================

-- Campo :23: Identificador Secundario
-- Formato: 16x (máximo 16 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLength', 16,
    'pattern', '^[A-Za-z0-9/\\-\\?:\\(\\)\\.,''+\\s]{0,16}$',
    'patternMessage', 'Máximo 16 caracteres alfanuméricos'
)
WHERE field_code = ':23:' AND message_type = 'MT700';

-- Campo :39A: Tolerancia Porcentual (ya existe pero reforzar)
-- Formato: 2n/2n (ejemplo: 05/05 para +/-5%)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'pattern', '^[0-9]{1,2}/[0-9]{1,2}$',
    'patternMessage', 'Formato requerido: NN/NN (ejemplo: 05/05 para +/-5%)',
    'maxLength', 5
)
WHERE field_code = ':39A:' AND message_type = 'MT700';

-- Campo :39B: Monto Máximo del Crédito
-- Valor: NOT EXCEEDING
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'allowedValues', JSON_ARRAY('NOT EXCEEDING'),
    'patternMessage', 'Valor permitido: NOT EXCEEDING'
)
WHERE field_code = ':39B:' AND message_type = 'MT700';

-- Campo :39C: Monto Adicional
-- Formato: numérico con decimales
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'minValue', 0,
    'maxValue', 999999999999.99,
    'decimalSeparator', ',',
    'maxDecimals', 2
)
WHERE field_code = ':39C:' AND message_type = 'MT700';

-- Campo :41a: Banco Disponible (reforzar)
-- Formato: 4 líneas x 35 caracteres
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':41a:' AND message_type = 'MT700';

-- Campo :42C: Giros a
-- Formato: 3*35x (3 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 3,
    'maxLineLength', 35
)
WHERE field_code = ':42C:' AND message_type = 'MT700';

-- Campo :42P: Negociación/Pago Diferido
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35
)
WHERE field_code = ':42P:' AND message_type = 'MT700';

-- Campo :42M: Pago Mixto
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35
)
WHERE field_code = ':42M:' AND message_type = 'MT700';

-- Campo :44E: Puerto de Carga/Aeropuerto de Salida
-- Formato: 65x (máximo 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLength', 65,
    'maxLineLength', 65
)
WHERE field_code = ':44E:' AND message_type = 'MT700';

-- Campo :44F: Puerto de Descarga/Aeropuerto de Destino
-- Formato: 65x (máximo 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLength', 65,
    'maxLineLength', 65
)
WHERE field_code = ':44F:' AND message_type = 'MT700';

-- Campo :47A: Condiciones Adicionales
-- Formato: 100*65x (hasta 100 líneas de 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 100,
    'maxLineLength', 65
)
WHERE field_code = ':47A:' AND message_type = 'MT700';

-- Campo :48: Período de Presentación
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35
)
WHERE field_code = ':48:' AND message_type = 'MT700';

-- Campo :49: Instrucciones de Confirmación
-- Formato: 100*65x (hasta 100 líneas de 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 100,
    'maxLineLength', 65
)
WHERE field_code = ':49:' AND message_type = 'MT700';

-- Campo :51a: Banco Emisor Solicitante
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':51a:' AND message_type = 'MT700';

-- Campo :52a: Banco Emisor
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':52a:' AND message_type = 'MT700';

-- Campo :53a: Banco del Remitente Corresponsal
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':53a:' AND message_type = 'MT700';

-- Campo :54a: Banco del Receptor Corresponsal
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':54a:' AND message_type = 'MT700';

-- Campo :56a: Banco Intermediario
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':56a:' AND message_type = 'MT700';

-- Campo :57a: Banco de Aviso
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':57a:' AND message_type = 'MT700';

-- Campo :58a: Banco Designado de Reembolso
-- Formato: 4*35x (4 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 4,
    'maxLineLength', 35,
    'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
    'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
)
WHERE field_code = ':58a:' AND message_type = 'MT700';

-- Campo :71B: Cargos
-- Formato: 6*35x (6 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 6,
    'maxLineLength', 35
)
WHERE field_code = ':71B:' AND message_type = 'MT700';

-- Campo :72: Información Banco a Banco
-- Formato: 6*35x (6 líneas de máximo 35 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 6,
    'maxLineLength', 35
)
WHERE field_code = ':72:' AND message_type = 'MT700';

-- Campo :78: Instrucciones al Banco Pagador/Aceptante/Negociador
-- Formato: 12*65x (12 líneas de máximo 65 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 12,
    'maxLineLength', 65
)
WHERE field_code = ':78:' AND message_type = 'MT700';

-- Campo :79: Narrativa
-- Formato: 35*50x (35 líneas de máximo 50 caracteres)
UPDATE swift_field_config_readmodel
SET validation_rules = JSON_OBJECT(
    'maxLines', 35,
    'maxLineLength', 50
)
WHERE field_code = ':79:' AND message_type = 'MT700';

-- Verificar las actualizaciones
SELECT
    field_code,
    field_name,
    field_type,
    JSON_EXTRACT(validation_rules, '$.maxLines') as max_lines,
    JSON_EXTRACT(validation_rules, '$.maxLineLength') as max_line_length,
    JSON_EXTRACT(validation_rules, '$.maxLength') as max_length
FROM swift_field_config_readmodel
WHERE message_type = 'MT700'
  AND language = 'es'
  AND validation_rules IS NOT NULL
ORDER BY display_order;
