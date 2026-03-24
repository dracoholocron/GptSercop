-- ================================================
-- Seed Data: swift_field_config_readmodel - Basic MT700 Fields
-- Description: Initial configuration for essential SWIFT MT700 fields
-- Author: GlobalCMX Architecture
-- Date: 2025-11-05
-- ================================================

-- Campo: 32B - Monto de la Carta de Crédito (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, documentation_url, created_by, created_at
) VALUES (
    UUID(),
    ':32B:',
    'Monto de la LC',
    'Monto y moneda de la carta de crédito',
    'MT700',
    'MONTOS',
    1,
    true,
    true,
    'CURRENCY',
    'CURRENCY_AMOUNT_INPUT',
    'Ingrese el monto de la LC',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto principal de la carta de crédito según norma SWIFT MT700',
    'https://www2.swift.com/knowledgecentre/publications/us7m_20230720/2.0?topic=idx_fld_tag_32B.htm',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 31C - Fecha de Emisión (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':31C:',
    'Fecha de Emisión',
    'Fecha de emisión de la carta de crédito',
    'MT700',
    'FECHAS',
    10,
    true,
    true,
    'DATE',
    'DATE_PICKER',
    'Seleccione la fecha de emisión',
    'Fecha en que se emite la carta de crédito',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 31D - Fecha de Vencimiento (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':31D:',
    'Fecha de Vencimiento',
    'Fecha de vencimiento de la carta de crédito',
    'MT700',
    'FECHAS',
    11,
    true,
    true,
    'DATE',
    'DATE_PICKER',
    'Seleccione la fecha de vencimiento',
    '{"minDateField": ":31C:"}',
    'Fecha de expiración de la carta de crédito',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 50 - Ordenante/Aplicante (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':50:',
    'Ordenante',
    'Datos del ordenante de la carta de crédito',
    'MT700',
    'PARTES',
    20,
    true,
    true,
    'PARTICIPANT',
    'PARTICIPANT_SELECTOR',
    'Seleccione el ordenante',
    'Cliente que solicita la emisión de la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 59 - Beneficiario (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':59:',
    'Beneficiario',
    'Datos del beneficiario de la carta de crédito',
    'MT700',
    'PARTES',
    21,
    true,
    true,
    'PARTICIPANT',
    'PARTICIPANT_SELECTOR',
    'Seleccione el beneficiario',
    'Entidad a favor de quien se emite la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 45A - Descripción de Mercancías (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':45A:',
    'Descripción de Mercancías',
    'Descripción detallada de las mercancías',
    'MT700',
    'MERCANCIAS',
    30,
    true,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Describa las mercancías objeto de la LC',
    'Descripción clara y completa de las mercancías a embarcar',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 46A - Documentos Requeridos (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':46A:',
    'Documentos Requeridos',
    'Listado de documentos que debe presentar el beneficiario',
    'MT700',
    'DOCUMENTOS',
    40,
    true,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Liste los documentos requeridos',
    'Documentos necesarios para el pago bajo la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 47A - Condiciones Adicionales (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':47A:',
    'Condiciones Adicionales',
    'Condiciones adicionales de la carta de crédito',
    'MT700',
    'CONDICIONES',
    50,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Especifique condiciones adicionales si las hay',
    'Términos y condiciones especiales aplicables a la LC',
    'SYSTEM',
    CURRENT_TIMESTAMP
);
