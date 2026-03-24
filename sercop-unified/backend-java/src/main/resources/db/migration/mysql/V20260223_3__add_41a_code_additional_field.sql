-- Add additionalFields to :41a: validation_rules with BY codes
-- Also ensure swift_usage_notes has the correct format with 14x trailing code
-- This enables the select dropdown for BY ACCEPTANCE, BY DEF PAYMENT, etc.

UPDATE swift_field_config_readmodel
SET validation_rules = JSON_SET(
    COALESCE(validation_rules, '{}'),
    '$.additionalFields',
    JSON_ARRAY(
        JSON_OBJECT(
            'name', 'code',
            'label', 'Disponible Por',
            'type', 'select',
            'required', true,
            'options', JSON_ARRAY(
                JSON_OBJECT('value', 'BY ACCEPTANCE', 'label', 'BY ACCEPTANCE'),
                JSON_OBJECT('value', 'BY DEF PAYMENT', 'label', 'BY DEF PAYMENT'),
                JSON_OBJECT('value', 'BY MIXED PYMT', 'label', 'BY MIXED PYMT'),
                JSON_OBJECT('value', 'BY NEGOTIATION', 'label', 'BY NEGOTIATION'),
                JSON_OBJECT('value', 'BY PAYMENT', 'label', 'BY PAYMENT')
            )
        )
    )
),
    swift_usage_notes = COALESCE(NULLIF(swift_usage_notes, ''), 'Option A: 4!a2!a2!c[3!c]14x | Option D: 4*35x14x')
WHERE field_code = ':41a:' AND message_type = 'MT700';
