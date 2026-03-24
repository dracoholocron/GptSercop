-- ==================================================
-- Migration: SWIFT Fields for Version 2024
-- Generated: 2026-01-15T11:35:43.239812
-- Effective Date: 2024-11-17
-- ==================================================

-- MT798 Fields (3 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transaction Reference Number', 'This field specifies the reference assigned by the Sender to unambiguously identify the message.',
    'MT798', 'es', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference assigned by the Sender to unambiguously identify the message.', '2024', '2024-11-17', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT798'
    AND language = 'es'
    AND spec_version = '2024'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transaction Reference Number', 'This field specifies the reference assigned by the Sender to unambiguously identify the message.',
    'MT798', 'en', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference assigned by the Sender to unambiguously identify the message.', '2024', '2024-11-17', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT798'
    AND language = 'en'
    AND spec_version = '2024'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':12:', 'Sub-Message Type', 'This field is used to specify the message type number, as agreed by the Sender and Receiver, or as defined by SWIFT (for messages being used in advance of implementation), for the proprietary message contained in the MT n98.',
    'MT798', 'es', 'GENERAL', 2,
    1, 1,
    'NUMBER', 'INPUT', '3!n', 'M',
    'This field is used to specify the message type number, as agreed by the Sender and Receiver, or as defined by SWIFT (for messages being used in advance of implementation), for the proprietary message contained in the MT n98.', '2024', '2024-11-17', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':12:'
    AND message_type = 'MT798'
    AND language = 'es'
    AND spec_version = '2024'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':12:', 'Sub-Message Type', 'This field is used to specify the message type number, as agreed by the Sender and Receiver, or as defined by SWIFT (for messages being used in advance of implementation), for the proprietary message contained in the MT n98.',
    'MT798', 'en', 'GENERAL', 2,
    1, 1,
    'NUMBER', 'INPUT', '3!n', 'M',
    'This field is used to specify the message type number, as agreed by the Sender and Receiver, or as defined by SWIFT (for messages being used in advance of implementation), for the proprietary message contained in the MT n98.', '2024', '2024-11-17', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':12:'
    AND message_type = 'MT798'
    AND language = 'en'
    AND spec_version = '2024'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77E:', 'Proprietary Message', 'This field is used to convey the message contents in a format agreed to by the Sender and the Receiver. In defining the format to be sent within field 77E, the following rules apply: All characters and codes described in the Standards MT General Information are allowed. The following exceptions are allowed: Carriage return, Line feed, Colon ''CrLf:'' may be used to separate fields included in field 77E, for example, :77E::20:ref1''CrLf'' :21:ref2''CrLf'' :79:test''CrLf'' etc. Line 1 (that is, 73',
    'MT798', 'es', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '73z', 'M',
    'This field is used to convey the message contents in a format agreed to by the Sender and the Receiver. In defining the format to be sent within field 77E, the following rules apply: All characters and codes described in the Standards MT General Information are allowed. The following exceptions are allowed: Carriage return, Line feed, Colon ''CrLf:'' may be used to separate fields included in field 77E, for example, :77E::20:ref1''CrLf'' :21:ref2''CrLf'' :79:test''CrLf'' etc. Line 1 (that is, 73z) may c', '2024', '2024-11-17', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77E:'
    AND message_type = 'MT798'
    AND language = 'es'
    AND spec_version = '2024'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77E:', 'Proprietary Message', 'This field is used to convey the message contents in a format agreed to by the Sender and the Receiver. In defining the format to be sent within field 77E, the following rules apply: All characters and codes described in the Standards MT General Information are allowed. The following exceptions are allowed: Carriage return, Line feed, Colon ''CrLf:'' may be used to separate fields included in field 77E, for example, :77E::20:ref1''CrLf'' :21:ref2''CrLf'' :79:test''CrLf'' etc. Line 1 (that is, 73',
    'MT798', 'en', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '73z', 'M',
    'This field is used to convey the message contents in a format agreed to by the Sender and the Receiver. In defining the format to be sent within field 77E, the following rules apply: All characters and codes described in the Standards MT General Information are allowed. The following exceptions are allowed: Carriage return, Line feed, Colon ''CrLf:'' may be used to separate fields included in field 77E, for example, :77E::20:ref1''CrLf'' :21:ref2''CrLf'' :79:test''CrLf'' etc. Line 1 (that is, 73z) may c', '2024', '2024-11-17', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77E:'
    AND message_type = 'MT798'
    AND language = 'en'
    AND spec_version = '2024'
);
