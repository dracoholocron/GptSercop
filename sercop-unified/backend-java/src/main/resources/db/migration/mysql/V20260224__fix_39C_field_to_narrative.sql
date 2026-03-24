-- Fix field :39C: (Additional Amounts Covered) - MT700
-- Per SWIFT MT700 spec: Field 39C is Option C, format 4*35x (Narrative)
-- It was incorrectly configured as DECIMAL / CURRENCY_AMOUNT_INPUT
-- Correct: TEXT / TEXTAREA (free-text narrative, up to 4 lines of 35 chars)

UPDATE swift_field_config_readmodel
SET field_type = 'TEXT',
    component_type = 'TEXTAREA',
    swift_format = '4*35x',
    validation_rules = JSON_OBJECT(
        'maxLength', 140,
        'maxLines', 4,
        'maxLineLength', 35,
        'inputMode', 'text',
        'patternMessage', 'Máximo 4 líneas de 35 caracteres cada una'
    ),
    description_key = 'swift.mt700.39C.description'
WHERE field_code = ':39C:' AND message_type = 'MT700';
