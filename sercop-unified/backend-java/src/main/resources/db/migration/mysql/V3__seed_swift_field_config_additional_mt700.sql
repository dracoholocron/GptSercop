-- ================================================
-- Seed Data: swift_field_config_readmodel - Additional MT700 Fields
-- Description: Additional SWIFT MT700 field configurations
-- Author: GlobalCMX Architecture
-- Date: 2025-11-05
-- ================================================

-- ============================
-- SECCIÓN: MONTOS (Continuación)
-- ============================

-- Campo: 39A - Tolerancia Porcentual (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, dependencies, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':39A:',
    'Tolerancia Porcentual',
    'Porcentaje de tolerancia permitido (+/-)',
    'MT700',
    'MONTOS',
    2,
    false,
    true,
    'TEXT',
    'INPUT',
    'Ej: +10%, -5%, +10/-5%',
    '{"maxLength": 20}',
    '{"triggers": [":32B:"], "disabledIf": {"field": ":39B:", "condition": "NOT_EMPTY"}}',
    'Tolerancia permitida para el monto de la LC. No se puede usar junto con Monto Máximo',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 39B - Monto Máximo (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, dependencies, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':39B:',
    'Monto Máximo',
    'Monto máximo permitido',
    'MT700',
    'MONTOS',
    3,
    false,
    true,
    'DECIMAL',
    'INPUT',
    'Ingrese el monto máximo',
    '{"minValue": 0.01}',
    '{"triggers": [":32B:"], "disabledIf": {"field": ":39A:", "condition": "NOT_EMPTY"}}',
    'Monto máximo permitido para la LC. No se puede usar junto con Tolerancia Porcentual',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 39C - Monto Adicional (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':39C:',
    'Monto Adicional',
    'Monto adicional cubierto',
    'MT700',
    'MONTOS',
    4,
    false,
    true,
    'DECIMAL',
    'INPUT',
    'Ingrese el monto adicional si aplica',
    '{"minValue": 0}',
    'Monto adicional que puede ser incluido en la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ============================
-- SECCIÓN: BANCOS
-- ============================

-- Campo: 51a - Banco Emisor (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':51a:',
    'Banco Emisor',
    'Banco que emite la carta de crédito',
    'MT700',
    'BANCOS',
    20,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'Seleccione el banco emisor',
    'Institución financiera que emite la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 52a - Banco Avisador (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':52a:',
    'Banco Avisador',
    'Banco que avisa al beneficiario',
    'MT700',
    'BANCOS',
    21,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'Seleccione el banco avisador',
    'Banco que notifica al beneficiario de la apertura de la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 53a - Banco Confirmador (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':53a:',
    'Banco Confirmador',
    'Banco que confirma la carta de crédito',
    'MT700',
    'BANCOS',
    22,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'Seleccione el banco confirmador si aplica',
    'Banco que añade su confirmación a la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 54a - Banco Pagador (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':54a:',
    'Banco Pagador/Negociador',
    'Banco autorizado para pagar o negociar',
    'MT700',
    'BANCOS',
    23,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'Seleccione el banco pagador',
    'Banco donde los documentos deben ser presentados',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 58a - Banco Corresponsal (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':58a:',
    'Banco Corresponsal',
    'Banco corresponsal del emisor',
    'MT700',
    'BANCOS',
    24,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'Seleccione banco corresponsal si aplica',
    'Banco a través del cual se efectuará el reembolso',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ============================
-- SECCIÓN: TÉRMINOS Y CONDICIONES
-- ============================

-- Campo: 40A - Tipo de Crédito Disponible (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, field_options, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':40A:',
    'Tipo de Crédito Disponible',
    'Forma en que el crédito está disponible',
    'MT700',
    'TERMINOS',
    30,
    true,
    true,
    'SELECT',
    'SELECT',
    'Seleccione el tipo',
    '{"required": true}',
    '[{"value": "BY PAYMENT", "label": "Por Pago"}, {"value": "BY ACCEPTANCE", "label": "Por Aceptación"}, {"value": "BY NEGOTIATION", "label": "Por Negociación"}, {"value": "BY DEF PAYMENT", "label": "Por Pago Diferido"}]',
    'Forma en que el crédito está disponible para el beneficiario',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 41a - Forma de Disponibilidad (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':41a:',
    'Banco Disponible',
    'Banco donde el crédito está disponible',
    'MT700',
    'TERMINOS',
    31,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'Banco donde el crédito está disponible',
    'Especifica el banco con el cual el crédito está disponible',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ============================
-- SECCIÓN: EMBARQUE/TRANSPORTE
-- ============================

-- Campo: 42C - Embarque Desde/Hacia (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':42C:',
    'Lugar de Embarque/Destino',
    'Lugar de embarque y destino final',
    'MT700',
    'TRANSPORTE',
    35,
    false,
    true,
    'TEXT',
    'INPUT',
    'Puerto/Ciudad de embarque y destino',
    'Lugar desde donde se embarca y destino final de las mercancías',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 43P - Embarques Parciales (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, field_options, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':43P:',
    'Embarques Parciales',
    'Indica si se permiten embarques parciales',
    'MT700',
    'TRANSPORTE',
    36,
    true,
    true,
    'SELECT',
    'SELECT',
    'Seleccione',
    '{"required": true}',
    '[{"value": "ALLOWED", "label": "Permitido"}, {"value": "NOT ALLOWED", "label": "No Permitido"}]',
    'Indica si las mercancías pueden embarcarse parcialmente',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 43T - Transbordos (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, field_options, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':43T:',
    'Transbordos',
    'Indica si se permiten transbordos',
    'MT700',
    'TRANSPORTE',
    37,
    true,
    true,
    'SELECT',
    'SELECT',
    'Seleccione',
    '{"required": true}',
    '[{"value": "ALLOWED", "label": "Permitido"}, {"value": "NOT ALLOWED", "label": "No Permitido"}]',
    'Indica si se permite el transbordo de las mercancías',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 44C - Último Embarque (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':44C:',
    'Fecha Último Embarque',
    'Fecha límite para el embarque',
    'MT700',
    'TRANSPORTE',
    38,
    false,
    true,
    'DATE',
    'DATE_PICKER',
    'Seleccione la fecha límite de embarque',
    'Fecha límite para efectuar el embarque de las mercancías',
    'SYSTEM',
    CURRENT_TIMESTAMP
);
