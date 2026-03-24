-- ================================================
-- Seed Data: swift_field_config_readmodel - MT760 Fields (Guarantees/Standby LC)
-- Description: Configuration for SWIFT MT760 message fields (Bank Guarantee / Standby Letter of Credit)
-- Author: GlobalCMX Architecture
-- Date: 2025-11-13
-- ================================================

-- ============================================
-- SECCIÓN: INFORMACIÓN BÁSICA
-- ============================================

-- Campo: 20 - Sender's Reference (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, documentation_url, created_by, created_at
) VALUES (
    UUID(),
    ':20:',
    'Referencia del Remitente',
    'Referencia única del emisor de la garantía',
    'MT760',
    'BASICA',
    1,
    true,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Ingrese referencia única',
    '{"maxLength": 16, "pattern": "^[A-Z0-9/-?:().,''+ ]{1,16}$", "required": true}',
    'Referencia alfanumérica única que identifica la garantía bancaria',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_20.htm',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 23 - Type of Undertaking (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':23:',
    'Tipo de Garantía',
    'Tipo de compromiso bancario',
    'MT760',
    'BASICA',
    2,
    true,
    true,
    'TEXT',
    'SELECT',
    'Seleccione tipo de garantía',
    '{"options": ["PERFORMANCE", "PAYMENT", "ADVANCE_PAYMENT", "BID", "RETENTION", "MAINTENANCE", "FINANCIAL", "CUSTOMS"], "required": true}',
    'Tipo de garantía: Performance Bond, Payment Guarantee, Advance Payment, Bid Bond, Retention, Maintenance, Financial, Customs',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 50 - Applicant (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':50:',
    'Solicitante',
    'Parte que solicita la garantía (Applicant)',
    'MT760',
    'BASICA',
    3,
    true,
    true,
    'PARTICIPANT',
    'PARTICIPANT_SELECTOR',
    'Seleccione el solicitante',
    'Empresa o persona que solicita la emisión de la garantía bancaria. Generalmente es el contratista o proveedor.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 59 - Beneficiary (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':59:',
    'Beneficiario',
    'Beneficiario de la garantía',
    'MT760',
    'BASICA',
    4,
    true,
    true,
    'PARTICIPANT',
    'NON_CLIENT_SELECTOR',
    'Ingrese nombre del beneficiario',
    'Entidad a favor de quien se emite la garantía. Puede reclamar si se cumplen las condiciones establecidas.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ============================================
-- SECCIÓN: MONTOS Y FECHAS
-- ============================================

-- Campo: 32B - Amount (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':32B:',
    'Monto de la Garantía',
    'Monto y moneda de la garantía bancaria',
    'MT760',
    'MONTOS',
    5,
    true,
    true,
    'CURRENCY',
    'CURRENCY_AMOUNT_INPUT',
    'Ingrese el monto',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto máximo que puede ser reclamado bajo la garantía. Típicamente 10-20% del contrato para Performance Bonds.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 31C - Date of Issue (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':31C:',
    'Fecha de Emisión',
    'Fecha de emisión de la garantía',
    'MT760',
    'FECHAS',
    6,
    true,
    true,
    'DATE',
    'DATE_PICKER',
    'Seleccione fecha de emisión',
    'Fecha en que la garantía entra en vigor y puede ser reclamada por el beneficiario.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 31D - Expiry Date (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':31D:',
    'Fecha de Vencimiento',
    'Fecha de vencimiento o expiración de la garantía',
    'MT760',
    'FECHAS',
    7,
    true,
    true,
    'DATE',
    'DATE_PICKER',
    'Seleccione fecha de vencimiento',
    'Fecha límite hasta la cual la garantía es válida y puede ser reclamada.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 31E - Date of Expiry (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':31E:',
    'Fecha de Expiración Alternativa',
    'Fecha de expiración alternativa o lugar de vencimiento',
    'MT760',
    'FECHAS',
    8,
    false,
    true,
    'DATE',
    'DATE_PICKER',
    'Fecha alternativa (opcional)',
    'Fecha de expiración alternativa cuando aplican condiciones especiales de vencimiento.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 39B - Maximum Credit Amount (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':39B:',
    'Monto Máximo',
    'Monto máximo que puede alcanzar la garantía',
    'MT760',
    'MONTOS',
    9,
    false,
    true,
    'DECIMAL',
    'INPUT',
    'Monto máximo (opcional)',
    '{"minValue": 0, "maxValue": 99999999.99}',
    'Monto máximo que puede ser reclamado considerando incrementos o ajustes permitidos.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 39C - Additional Amounts Covered (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':39C:',
    'Reducción Automática',
    'Porcentaje o términos de reducción automática del monto',
    'MT760',
    'MONTOS',
    10,
    false,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Ej: 10% mensual',
    'Especifica cómo se reduce automáticamente el monto de la garantía según avance del proyecto.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ============================================
-- SECCIÓN: BANCOS
-- ============================================

-- Campo: 53a - Sender's Correspondent (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':53a:',
    'Banco Emisor',
    'Banco que emite la garantía',
    'MT760',
    'BANCOS',
    11,
    true,
    true,
    'INSTITUTION',
    'BANK_SELECTOR',
    'Seleccione banco emisor',
    'Banco que emite y garantiza el cumplimiento del compromiso.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 57a - Advise Through Bank (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':57a:',
    'Banco Notificador',
    'Banco que notifica la garantía al beneficiario',
    'MT760',
    'BANCOS',
    12,
    true,
    true,
    'INSTITUTION',
    'BANK_SELECTOR',
    'Seleccione banco notificador',
    'Banco responsable de notificar al beneficiario sobre la emisión de la garantía.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 42a - Drawee (OPCIONAL - Banco Confirmador)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':42a:',
    'Banco Confirmador',
    'Banco que confirma la garantía (opcional)',
    'MT760',
    'BANCOS',
    13,
    false,
    true,
    'INSTITUTION',
    'BANK_SELECTOR',
    'Banco confirmador (opcional)',
    'Banco que agrega su confirmación a la garantía, asumiendo responsabilidad adicional.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 51a - Applicant Bank (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':51a:',
    'Banco del Solicitante',
    'Banco del solicitante de la garantía',
    'MT760',
    'BANCOS',
    14,
    false,
    true,
    'INSTITUTION',
    'BANK_SELECTOR',
    'Banco del solicitante (opcional)',
    'Banco que representa al solicitante en la operación.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 56a - Intermediary Bank (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':56a:',
    'Banco Intermediario',
    'Banco intermediario en la cadena de notificación',
    'MT760',
    'BANCOS',
    15,
    false,
    true,
    'INSTITUTION',
    'BANK_SELECTOR',
    'Banco intermediario (opcional)',
    'Banco que actúa como intermediario en la transmisión de la garantía.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 58a - Beneficiary's Bank (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':58a:',
    'Banco del Beneficiario',
    'Banco del beneficiario de la garantía',
    'MT760',
    'BANCOS',
    16,
    false,
    true,
    'INSTITUTION',
    'BANK_SELECTOR',
    'Banco del beneficiario (opcional)',
    'Banco donde el beneficiario mantiene su cuenta para recibir pagos en caso de ejecución.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ============================================
-- SECCIÓN: TÉRMINOS Y CONDICIONES
-- ============================================

-- Campo: 77C - Terms and Conditions (OBLIGATORIO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':77C:',
    'Términos y Condiciones',
    'Términos y condiciones de la garantía y propósito',
    'MT760',
    'TERMINOS',
    17,
    true,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Describa términos y condiciones...',
    '{"maxLength": 65000, "minLines": 3, "required": true}',
    'Descripción detallada del propósito de la garantía y las condiciones bajo las cuales puede ser reclamada.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 77A - Additional Conditions (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':77A:',
    'Condiciones Adicionales',
    'Condiciones y documentos adicionales requeridos',
    'MT760',
    'TERMINOS',
    18,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Condiciones adicionales...',
    '{"maxLength": 65000, "minLines": 2}',
    'Documentos y condiciones adicionales necesarios para ejecutar o reclamar la garantía.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 47A - Additional Conditions (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':47A:',
    'Condiciones Especiales',
    'Condiciones especiales y cláusulas particulares',
    'MT760',
    'TERMINOS',
    19,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Condiciones especiales...',
    'Cláusulas especiales o particulares que no están cubiertas en los términos estándar.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ============================================
-- SECCIÓN: INFORMACIÓN ADICIONAL
-- ============================================

-- Campo: 21 - Related Reference (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':21:',
    'Referencia Relacionada',
    'Número de contrato o referencia relacionada',
    'MT760',
    'ADICIONAL',
    20,
    false,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Número de contrato',
    '{"maxLength": 16, "pattern": "^[A-Z0-9/-?:().,''+ ]{1,16}$"}',
    'Número de contrato, licitación u otra referencia relacionada con la garantía.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 72 - Sender to Receiver Information (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(),
    ':72:',
    'Información Adicional',
    'Información del emisor al receptor',
    'MT760',
    'ADICIONAL',
    21,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Observaciones e información adicional...',
    '{"maxLength": 6000}',
    'Observaciones, instrucciones especiales o cualquier información adicional relevante.',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ================================================
-- Fin de configuración MT760
-- ================================================
