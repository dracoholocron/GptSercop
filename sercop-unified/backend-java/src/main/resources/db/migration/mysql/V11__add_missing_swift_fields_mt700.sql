-- ==================================================
-- Migración V11: Agregar campos SWIFT faltantes de MT700
-- ==================================================
-- Esta migración agrega únicamente los campos que NO existen en la BD:
--
-- Campos agregados:
-- - :40E: Applicable Rules (UCP) (OBLIGATORIO) - Campo solicitado por el usuario
-- - :20: Sender's Reference (OBLIGATORIO)
--
-- Nota: Los demás campos críticos ya existen en migraciones anteriores
-- ==================================================

-- Campo: 40E - Applicable Rules (UCP) (OBLIGATORIO)
-- Define las reglas que rigen la LC (UCP 600 es el estándar actual)
-- ESTE ES EL CAMPO CRÍTICO SOLICITADO POR EL USUARIO
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, field_options, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':40E:',
    'Applicable Rules',
    'Reglas aplicables al crédito documentario (UCP)',
    'MT700',
    'BASICA',
    4,
    true,
    true,
    'SELECT',
    'DROPDOWN',
    'Seleccione las reglas aplicables',
    '{"required": true}',
    '[
        {"value": "UCP LATEST VERSION", "label": "UCP Latest Version (UCP 600)", "description": "Uniform Customs and Practice versión actual (ICC 600)", "isDefault": true},
        {"value": "UCP 600", "label": "UCP 600", "description": "Uniform Customs and Practice for Documentary Credits ICC 600"},
        {"value": "UCP 600 AND ISBP", "label": "UCP 600 and ISBP", "description": "UCP 600 con International Standard Banking Practice"},
        {"value": "EUCPV2.0", "label": "eUCP Version 2.0", "description": "Suplemento electrónico a UCP 600"},
        {"value": "ISP98", "label": "ISP98", "description": "International Standby Practices para Standby LCs"}
    ]',
    'Reglas internacionales que rigen el crédito. UCP 600 es el estándar de la ICC (International Chamber of Commerce). Campo OBLIGATORIO en MT700',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 20 - Sender's Reference (OBLIGATORIO)
-- Referencia única del mensaje
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':20:',
    'Sender''s Reference',
    'Referencia única del remitente',
    'MT700',
    'BASICA',
    1,
    true,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Referencia única del mensaje',
    '{"maxLength": 16, "pattern": "^[A-Z0-9/-?:().,''+ ]{1,16}$", "required": true}',
    'Referencia única que identifica este mensaje MT700. Máximo 16 caracteres alfanuméricos',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Agregar dependencias y alertas contextuales para el campo :40E:
UPDATE swift_field_config_readmodel
SET contextual_alerts = '[
    {
        "condition": "value === ''UCP LATEST VERSION'' || value === ''UCP 600''",
        "alertType": "INFO",
        "title": "UCP 600 - Estándar Internacional",
        "message": "UCP 600 es la versión vigente desde julio 2007 y es el estándar más utilizado en cartas de crédito documentarias internacionales. Emitido por la ICC (International Chamber of Commerce)."
    },
    {
        "condition": "value === ''ISP98''",
        "alertType": "WARNING",
        "title": "ISP98 - Solo para Standby LCs",
        "message": "ISP98 se utiliza específicamente para Standby Letters of Credit. Asegúrese de que el campo :40A: esté configurado como IRREVOCABLE STANDBY."
    }
]'
WHERE field_code = ':40E:' AND message_type = 'MT700';

-- Agregar dependencias entre :40A: y :40E:
UPDATE swift_field_config_readmodel
SET dependencies = '{
    "showWhen": [],
    "requiredWhen": [],
    "relatedFields": [":40E:"],
    "affectsFields": [":40E:"]
}'
WHERE field_code = ':40A:' AND message_type = 'MT700';

-- Verificar la inserción
SELECT COUNT(*) as 'Campos Agregados'
FROM swift_field_config_readmodel
WHERE message_type = 'MT700'
AND field_code IN (':40E:', ':20:');
