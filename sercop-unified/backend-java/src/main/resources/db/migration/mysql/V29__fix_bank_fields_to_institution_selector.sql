-- ==================================================
-- Migración V29: Corregir campos de banco para usar selector de instituciones
-- ==================================================
-- Los campos de banco deben usar FINANCIAL_INSTITUTION_SELECTOR
-- en lugar de SWIFT_PARTY (que busca personas)
-- ==================================================

-- Campo :41a: Banco Disponible - Usar selector de instituciones financieras
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':41a:' AND message_type = 'MT700';

-- Campo :51a: Banco Emisor Solicitante
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':51a:' AND message_type = 'MT700';

-- Campo :52a: Banco Avisador
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':52a:' AND message_type = 'MT700';

-- Campo :53a: Banco Confirmador
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':53a:' AND message_type = 'MT700';

-- Campo :54a: Banco Pagador/Negociador
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':54a:' AND message_type = 'MT700';

-- Campo :56a: Banco Intermediario
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':56a:' AND message_type = 'MT700';

-- Campo :57a: Banco de Aviso (si existe)
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':57a:' AND message_type = 'MT700';

-- Campo :58a: Banco Corresponsal
UPDATE swift_field_config_readmodel
SET component_type = 'FINANCIAL_INSTITUTION_SELECTOR',
    validation_rules = JSON_OBJECT(
        'maxLines', 4,
        'maxLineLength', 35,
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    )
WHERE field_code = ':58a:' AND message_type = 'MT700';

-- Verificar las actualizaciones
SELECT
    field_code,
    field_name,
    component_type,
    JSON_EXTRACT(validation_rules, '$.maxLines') as max_lines,
    JSON_EXTRACT(validation_rules, '$.maxLineLength') as max_line_length
FROM swift_field_config_readmodel
WHERE field_code IN (':41a:', ':51a:', ':52a:', ':53a:', ':54a:', ':56a:', ':57a:', ':58a:')
  AND message_type = 'MT700'
  AND language = 'es'
ORDER BY display_order;
