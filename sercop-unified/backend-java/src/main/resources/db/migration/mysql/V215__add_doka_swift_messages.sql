-- ================================================
-- Seed Data: swift_field_config_readmodel - Doka SWIFT Messages
-- Description: Additional SWIFT messages used by Doka Trade Finance
-- Messages: MT719, MT722, MT726, MT732, MT742, MT744, MT749, MT763, MT769, MT783, MT788, MT790, MT791
-- Author: GlobalCMX Architecture
-- Date: 2026-01-30
-- ================================================

-- ============================================
-- MT719 - ADVICE OF A THIRD BANK'S GUARANTEE
-- Used in Doka: GITOPR, GITPOP
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de la transacción',
    'MT719', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "pattern": "^[A-Z0-9/-?:().,''+ ]{1,16}$", "required": true}',
    'Referencia única del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT719', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía original',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía original', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':22K:', 'Type of Undertaking', 'Tipo de garantía',
    'MT719', 'BASICA', 3, true, true, 'TEXT', 'SELECT', 'Tipo de garantía',
    'Tipo de garantía o compromiso', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':23:', 'Further Identification', 'Identificación adicional',
    'MT719', 'BASICA', 4, false, true, 'TEXT', 'TEXT_INPUT', 'Identificación adicional',
    'Información adicional de identificación', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Issue', 'Fecha de emisión',
    'MT719', 'FECHAS', 5, true, true, 'DATE', 'DATE_PICKER', 'Fecha de emisión',
    'Fecha de emisión de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'Expiry Date', 'Fecha de vencimiento',
    'MT719', 'FECHAS', 6, false, true, 'DATE', 'DATE_PICKER', 'Fecha de vencimiento',
    'Fecha de vencimiento de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Moneda y monto',
    'MT719', 'MONTOS', 7, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999999.99, "required": true}',
    'Monto y moneda de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Issuing Bank', 'Banco emisor',
    'MT719', 'BANCOS', 8, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco que emite la garantía original', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Applicant', 'Ordenante',
    'MT719', 'PARTES', 9, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Ordenante de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiary', 'Beneficiario',
    'MT719', 'PARTES', 10, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details of Undertaking', 'Detalles de la garantía',
    'MT719', 'DETALLES', 11, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Texto completo o detalles de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT722 - TRANSFER OF A DOCUMENTARY CREDIT
-- Used in Doka: LTTOPN
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':27:', 'Sequence of Total', 'Secuencia del mensaje',
    'MT722', 'BASICA', 1, true, true, 'TEXT', 'INPUT', 'Ej: 1/1',
    '{"maxLength": 5, "pattern": "^[0-9]{1,2}/[0-9]{1,2}$", "required": true}',
    'Número de secuencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':40A:', 'Form of Documentary Credit', 'Forma del crédito',
    'MT722', 'BASICA', 2, true, true, 'TEXT', 'SELECT', 'Tipo de LC',
    '{"options": ["IRREVOCABLE", "IRREVOCABLE TRANSFERABLE"], "required": true}',
    'Forma del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Documentary Credit Number', 'Número de LC',
    'MT722', 'BASICA', 3, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número de referencia del crédito documentario transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT722', 'BASICA', 4, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia LC original',
    '{"maxLength": 16, "required": true}',
    'Referencia del crédito original que se transfiere', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31C:', 'Date of Issue', 'Fecha de emisión',
    'MT722', 'FECHAS', 5, true, true, 'DATE', 'DATE_PICKER', 'Fecha de emisión',
    'Fecha de emisión del crédito transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Date and Place of Expiry', 'Fecha y lugar de vencimiento',
    'MT722', 'FECHAS', 6, true, true, 'DATE', 'DATE_PICKER', 'Fecha de vencimiento',
    'Fecha de expiración del crédito transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':50:', 'First Beneficiary', 'Primer beneficiario',
    'MT722', 'PARTES', 7, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Primer beneficiario',
    'Beneficiario original que transfiere', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Second Beneficiary', 'Segundo beneficiario',
    'MT722', 'PARTES', 8, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Segundo beneficiario',
    'Nuevo beneficiario del crédito transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Moneda y monto',
    'MT722', 'MONTOS', 9, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999999.99, "required": true}',
    'Monto transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':41a:', 'Available With...By...', 'Disponible con/por',
    'MT722', 'BANCOS', 10, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco disponible',
    'Banco donde está disponible el crédito transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':45A:', 'Description of Goods', 'Descripción de mercancías',
    'MT722', 'MERCANCIAS', 11, false, true, 'TEXTAREA', 'TEXTAREA', 'Descripción',
    'Descripción de mercancías del crédito transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':46A:', 'Documents Required', 'Documentos requeridos',
    'MT722', 'DOCUMENTOS', 12, false, true, 'TEXTAREA', 'TEXTAREA', 'Documentos',
    'Documentos requeridos para el crédito transferido', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT726 - ADVICE OF REFUSAL
-- Used in Doka: LITFRE, LETFRE, GITFRE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT726', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia única del mensaje de rechazo', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT726', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia LC/Garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia del documento original rechazado', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Refusal', 'Fecha de rechazo',
    'MT726', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha de rechazo',
    'Fecha en que se emite el rechazo', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Reason for Refusal', 'Motivo del rechazo',
    'MT726', 'DETALLES', 4, true, true, 'TEXTAREA', 'TEXTAREA', 'Motivo del rechazo',
    'Razones detalladas del rechazo', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT726', 'DETALLES', 5, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información adicional del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT732 - ADVICE OF DISCHARGE
-- Used in Doka: BRTACP
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sending Bank''s Reference', 'Referencia del banco remitente',
    'MT732', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del banco que envía el aviso', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Documentary Credit Number', 'Número de crédito documentario',
    'MT732', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito documentario relacionado', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date', 'Fecha',
    'MT732', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha de descarga',
    'Fecha del aviso de descarga', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Moneda y monto',
    'MT732', 'MONTOS', 4, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999999.99, "required": true}',
    'Monto de la descarga', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Issuing Bank', 'Banco emisor',
    'MT732', 'BANCOS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco emisor del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT732', 'DETALLES', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT742 - REIMBURSEMENT CLAIM
-- Used in Doka: RCTSET
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Claiming Bank''s Reference', 'Referencia del banco reclamante',
    'MT742', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del banco que reclama el reembolso', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Documentary Credit Number', 'Número de crédito documentario',
    'MT742', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito documentario relacionado', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount Claimed', 'Monto reclamado',
    'MT742', 'MONTOS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto reclamado',
    'Monto del reembolso reclamado', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':33B:', 'Additional Amount Covered', 'Monto adicional cubierto',
    'MT742', 'MONTOS', 4, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto adicional',
    'Monto adicional cubierto por el reclamo', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Issuing Bank', 'Banco emisor',
    'MT742', 'BANCOS', 5, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco emisor del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':57a:', 'Account With Bank', 'Banco de la cuenta',
    'MT742', 'BANCOS', 6, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco cuenta',
    'Banco donde se acreditará el reembolso', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT742', 'DETALLES', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT744 - REIMBURSEMENT AUTHORIZATION FREE FORMAT
-- Used in Doka: RCTFRE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT744', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT744', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia autorización',
    '{"maxLength": 16, "required": true}',
    'Referencia de la autorización de reembolso relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Narrative', 'Narrativa',
    'MT744', 'DETALLES', 3, true, true, 'TEXTAREA', 'TEXTAREA', 'Mensaje libre',
    'Contenido del mensaje de formato libre', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT744', 'DETALLES', 4, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT749 - ADVICE OF CLAIMING BANK'S PAYMENT
-- Used in Doka: BRTPAY
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de transacción',
    'MT749', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia única del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT749', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia LC',
    '{"maxLength": 16, "required": true}',
    'Referencia del crédito documentario relacionado', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Payment', 'Fecha de pago',
    'MT749', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha de pago',
    'Fecha del pago efectuado', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Monto pagado',
    'MT749', 'MONTOS', 4, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto pagado',
    'Monto del pago efectuado', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Issuing Bank', 'Banco emisor',
    'MT749', 'BANCOS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco emisor del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT749', 'DETALLES', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT763 - GUARANTEE / STANDBY LC AMENDMENT REQUEST
-- Used in Doka: GITAME, GITAMR, GITRAM
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT763', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje de solicitud de enmienda', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT763', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía original',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía original a enmendar', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':23:', 'Type of Amendment', 'Tipo de enmienda',
    'MT763', 'BASICA', 3, true, true, 'TEXT', 'SELECT', 'Tipo de enmienda',
    'Tipo de enmienda solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Amendment', 'Fecha de enmienda',
    'MT763', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha de enmienda',
    'Fecha de la solicitud de enmienda', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'New Expiry Date', 'Nueva fecha de vencimiento',
    'MT763', 'FECHAS', 5, false, true, 'DATE', 'DATE_PICKER', 'Nueva fecha vencimiento',
    'Nueva fecha de vencimiento propuesta', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Increase of Amount', 'Incremento del monto',
    'MT763', 'MONTOS', 6, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Incremento',
    'Incremento en el monto de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':33B:', 'Decrease of Amount', 'Decremento del monto',
    'MT763', 'MONTOS', 7, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Decremento',
    'Decremento en el monto de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details of Amendment', 'Detalles de la enmienda',
    'MT763', 'DETALLES', 8, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles de la enmienda solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT763', 'DETALLES', 9, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT769 - ADVICE OF REDUCTION OR RELEASE
-- Used in Doka: GITCAN
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT769', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT769', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':23:', 'Type of Action', 'Tipo de acción',
    'MT769', 'BASICA', 3, true, true, 'TEXT', 'SELECT', 'Tipo de acción',
    'Tipo de acción: reducción o liberación', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date', 'Fecha',
    'MT769', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de la reducción o liberación', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Amount Reduced', 'Monto reducido',
    'MT769', 'MONTOS', 5, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto reducido',
    'Monto de la reducción', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':33B:', 'Remaining Amount', 'Monto remanente',
    'MT769', 'MONTOS', 6, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto remanente',
    'Monto remanente de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details', 'Detalles',
    'MT769', 'DETALLES', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles de la reducción o liberación', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT783 - REQUEST FOR REDUCTION OR RELEASE
-- Used in Doka: GITCAN, GITRAM
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT783', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia de la solicitud', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT783', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':23:', 'Type of Request', 'Tipo de solicitud',
    'MT783', 'BASICA', 3, true, true, 'TEXT', 'SELECT', 'Tipo de solicitud',
    'Tipo de solicitud: reducción o liberación', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date', 'Fecha',
    'MT783', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de la solicitud', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Amount to Reduce', 'Monto a reducir',
    'MT783', 'MONTOS', 5, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto a reducir',
    'Monto solicitado para reducción', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Reason for Request', 'Motivo de la solicitud',
    'MT783', 'DETALLES', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'Motivo',
    'Razón de la solicitud de reducción o liberación', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT788 - GUARANTEE / STANDBY LC EXTENSION
-- Used in Doka: GCTFRE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT788', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje de extensión', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT788', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía original', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'New Expiry Date', 'Nueva fecha de vencimiento',
    'MT788', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Nueva fecha vencimiento',
    'Nueva fecha de vencimiento de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details of Extension', 'Detalles de la extensión',
    'MT788', 'DETALLES', 4, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles de la extensión de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT788', 'DETALLES', 5, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT790 - ADVICE OF CHARGES, INTEREST AND OTHER ADJUSTMENTS
-- Used in Doka: LITFEE, LETFEE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de transacción',
    'MT790', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del aviso de cargos', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT790', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia LC/Garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la operación relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32A:', 'Value Date, Currency Code, Amount', 'Fecha valor y monto',
    'MT790', 'MONTOS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto total',
    'Fecha valor y monto total de los cargos', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Ordering Institution', 'Institución ordenante',
    'MT790', 'BANCOS', 4, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco ordenante',
    'Banco que ordena el cobro de cargos', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':57a:', 'Account With Institution', 'Institución de la cuenta',
    'MT790', 'BANCOS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco cuenta',
    'Banco donde se debitarán los cargos', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':71B:', 'Details of Charges', 'Detalle de cargos',
    'MT790', 'DETALLES', 6, true, true, 'TEXTAREA', 'TEXTAREA', 'Detalle de cargos',
    'Detalle de los cargos, intereses y ajustes', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT790', 'DETALLES', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT791 - REQUEST FOR PAYMENT OF CHARGES, INTEREST, ETC.
-- Used in Doka: LITFEE, LETFEE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de transacción',
    'MT791', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia de la solicitud de pago', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT791', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia LC/Garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la operación relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Monto solicitado',
    'MT791', 'MONTOS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto solicitado para pago', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Requesting Institution', 'Institución solicitante',
    'MT791', 'BANCOS', 4, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco solicitante',
    'Banco que solicita el pago de cargos', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':57a:', 'Account With Institution', 'Institución de la cuenta',
    'MT791', 'BANCOS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco cuenta',
    'Banco donde se acreditará el pago', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':71B:', 'Details of Charges Requested', 'Detalle de cargos solicitados',
    'MT791', 'DETALLES', 6, true, true, 'TEXTAREA', 'TEXTAREA', 'Detalle de cargos',
    'Detalle de los cargos solicitados', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT791', 'DETALLES', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT419 - UNDERTAKING AMENDMENT REQUEST (Bank-to-Bank)
-- Used in Doka: GITAME, GITRAM
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT419', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT419', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía a enmendar', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Request', 'Fecha de solicitud',
    'MT419', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de la solicitud de enmienda', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'New Expiry Date', 'Nueva fecha de vencimiento',
    'MT419', 'FECHAS', 4, false, true, 'DATE', 'DATE_PICKER', 'Nueva fecha',
    'Nueva fecha de vencimiento solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Amount Change', 'Cambio de monto',
    'MT419', 'MONTOS', 5, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Incremento o decremento del monto', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details of Amendment Request', 'Detalles de la solicitud',
    'MT419', 'DETALLES', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles de la enmienda solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT429 - REQUEST FOR UNDERTAKING/STANDBY (Bank-to-Bank)
-- Used in Doka: GITOPN
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de transacción',
    'MT429', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':22K:', 'Type of Undertaking', 'Tipo de garantía',
    'MT429', 'BASICA', 2, true, true, 'TEXT', 'SELECT', 'Tipo',
    'Tipo de garantía solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Issue', 'Fecha de emisión',
    'MT429', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de la solicitud', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'Expiry Date', 'Fecha de vencimiento',
    'MT429', 'FECHAS', 4, false, true, 'DATE', 'DATE_PICKER', 'Vencimiento',
    'Fecha de vencimiento solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Moneda y monto',
    'MT429', 'MONTOS', 5, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto de la garantía solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Applicant', 'Ordenante',
    'MT429', 'PARTES', 6, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Ordenante de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiary', 'Beneficiario',
    'MT429', 'PARTES', 7, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details of Undertaking', 'Detalles de la garantía',
    'MT429', 'DETALLES', 8, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Texto y condiciones de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT460 - ADVICE TO PAY/ACCEPT/NEGOTIATE (Bank-to-Bank)
-- Used in Doka: LITOPN
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de transacción',
    'MT460', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Documentary Credit Number', 'Número de LC',
    'MT460', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Advice', 'Fecha del aviso',
    'MT460', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha del aviso', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Moneda y monto',
    'MT460', 'MONTOS', 4, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto a pagar/aceptar/negociar', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Issuing Bank', 'Banco emisor',
    'MT460', 'BANCOS', 5, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco emisor del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiary', 'Beneficiario',
    'MT460', 'PARTES', 6, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT460', 'DETALLES', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'Información',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT470 - REQUEST TO AMEND DOCUMENTARY CREDIT (Bank-to-Bank)
-- Used in Doka: LITAME, LITRAM
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT470', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia de la solicitud de enmienda', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Documentary Credit Number', 'Número de LC',
    'MT470', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito a enmendar', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Request', 'Fecha de solicitud',
    'MT470', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de la solicitud', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'New Expiry Date', 'Nueva fecha de vencimiento',
    'MT470', 'FECHAS', 4, false, true, 'DATE', 'DATE_PICKER', 'Nueva fecha',
    'Nueva fecha de vencimiento solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Amount Change', 'Cambio de monto',
    'MT470', 'MONTOS', 5, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Incremento o decremento del monto', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Issuing Bank', 'Banco emisor',
    'MT470', 'BANCOS', 6, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco emisor del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Details of Amendment Request', 'Detalles de la solicitud',
    'MT470', 'DETALLES', 7, true, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles de la enmienda solicitada', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT488 - REQUEST FOR MULTIPLE UNDERTAKINGS
-- Used in Doka: GITFRE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de transacción',
    'MT488', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Request', 'Fecha de solicitud',
    'MT488', 'FECHAS', 2, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de la solicitud', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Applicant', 'Ordenante',
    'MT488', 'PARTES', 3, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Ordenante de las garantías', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details of Request', 'Detalles de la solicitud',
    'MT488', 'DETALLES', 4, true, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles de las garantías solicitadas', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT492 - REQUEST FOR CANCELLATION
-- Used in Doka: BOTFRE, BCTFRE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT492', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia de la solicitud de cancelación', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT492', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia cobranza',
    '{"maxLength": 16, "required": true}',
    'Referencia de la cobranza a cancelar', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Reason for Cancellation', 'Motivo de cancelación',
    'MT492', 'DETALLES', 3, true, true, 'TEXTAREA', 'TEXTAREA', 'Motivo',
    'Razón de la solicitud de cancelación', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT712 - CLAIM AGAINST A DOCUMENTARY CREDIT
-- Used in Doka: GITCRQ
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT712', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del reclamo', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Documentary Credit Number', 'Número de LC',
    'MT712', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Claim', 'Fecha del reclamo',
    'MT712', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha del reclamo', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Amount Claimed', 'Monto reclamado',
    'MT712', 'MONTOS', 4, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto del reclamo', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Issuing Bank', 'Banco emisor',
    'MT712', 'BANCOS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco emisor del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Details of Claim', 'Detalles del reclamo',
    'MT712', 'DETALLES', 6, true, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles y justificación del reclamo', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT728 - GUARANTEE ATTACHMENT
-- Used in Doka: GITATT
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT728', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT728', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Attachment Details', 'Detalles del adjunto',
    'MT728', 'DETALLES', 3, true, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Contenido o descripción del adjunto', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT735 - ADVICE OF REIMBURSEMENT OR PAYMENT
-- Used in Doka: LETATT, LETFRE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT735', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del aviso', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Documentary Credit Number', 'Número de LC',
    'MT735', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Payment', 'Fecha de pago',
    'MT735', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha del reembolso o pago', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Amount Paid', 'Monto pagado',
    'MT735', 'MONTOS', 4, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto del reembolso o pago', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Claiming Bank', 'Banco reclamante',
    'MT735', 'BANCOS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco',
    'Banco que reclama el reembolso', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT735', 'DETALLES', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'Información',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT738 - AUTHORISATION TO DEFER PAYMENT
-- Used in Doka: BETDCR
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT738', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia de la autorización', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Documentary Credit Number', 'Número de LC',
    'MT738', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Authorization', 'Fecha de autorización',
    'MT738', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de la autorización', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'Deferred Payment Date', 'Fecha de pago diferido',
    'MT738', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha pago',
    'Fecha en que se realizará el pago', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Deferred Amount', 'Monto diferido',
    'MT738', 'MONTOS', 5, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto del pago diferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT738', 'DETALLES', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'Información',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT700_EXT - EXTENDED DOCUMENTARY CREDIT (Doka specific)
-- Internal message type for LCs with extended TAGs (24D, 42M, 46A/B)
-- NOT a standard SWIFT message - converts to MT700 for transmission
-- Used in Doka: LITOPN, LITOPR
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':27:', 'Sequence of Total', 'Secuencia del mensaje',
    'MT700_EXT', 'BASICA', 1, true, true, 'TEXT', 'INPUT', 'Ej: 1/1',
    '{"maxLength": 5, "pattern": "^[0-9]{1,2}/[0-9]{1,2}$", "required": true}',
    'Número de secuencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':40A:', 'Form of Documentary Credit', 'Forma del crédito',
    'MT700_EXT', 'BASICA', 2, true, true, 'TEXT', 'SELECT', 'Tipo de LC',
    '{"options": ["IRREVOCABLE", "IRREVOCABLE TRANSFERABLE", "IRREVOCABLE STANDBY"], "required": true}',
    'Forma del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Documentary Credit Number', 'Número de LC',
    'MT700_EXT', 'BASICA', 3, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31C:', 'Date of Issue', 'Fecha de emisión',
    'MT700_EXT', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha de emisión',
    'Fecha de emisión del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Expiry Date', 'Fecha de vencimiento',
    'MT700_EXT', 'FECHAS', 5, true, true, 'DATE', 'DATE_PICKER', 'Fecha de vencimiento',
    'Fecha de expiración del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Applicant', 'Ordenante',
    'MT700_EXT', 'PARTES', 6, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Ordenante de la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiary', 'Beneficiario',
    'MT700_EXT', 'PARTES', 7, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario de la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Moneda y monto',
    'MT700_EXT', 'MONTOS', 8, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Extended Narrative', 'Narrativa extendida',
    'MT700_EXT', 'DETALLES', 9, false, true, 'TEXTAREA', 'TEXTAREA', 'Narrativa',
    'Campos extendidos y narrativa adicional', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT772 - AMENDMENT TO DOCUMENTARY CREDIT (Extended)
-- Used in Doka: LITAME, LITAMR
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT772', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia de la enmienda extendida', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT772', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia LC original',
    '{"maxLength": 16, "required": true}',
    'Referencia del crédito original', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'New Expiry Date', 'Nueva fecha de vencimiento',
    'MT772', 'FECHAS', 3, false, true, 'DATE', 'DATE_PICKER', 'Nueva fecha',
    'Nueva fecha de vencimiento', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Amount Change', 'Cambio de monto',
    'MT772', 'MONTOS', 4, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Incremento o decremento del monto', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Extended Amendment Details', 'Detalles extendidos',
    'MT772', 'DETALLES', 5, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles extendidos de la enmienda', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT778 - ADVICE OF DEFERRED PAYMENT
-- Used in Doka: GITAME, GITSET
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT778', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del aviso de pago diferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT778', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía o LC relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Advice', 'Fecha del aviso',
    'MT778', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha del aviso de pago diferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'Deferred Payment Date', 'Fecha de pago diferido',
    'MT778', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha pago',
    'Fecha en que se realizará el pago', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Deferred Amount', 'Monto diferido',
    'MT778', 'MONTOS', 5, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto del pago diferido', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details', 'Detalles',
    'MT778', 'DETALLES', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Detalles del pago diferido', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT784 - EXTENDED GUARANTEE
-- Used in Doka: GITOPN, GITOPR
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Transaction Reference Number', 'Referencia de transacción',
    'MT784', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia de la garantía extendida', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':22K:', 'Type of Undertaking', 'Tipo de garantía',
    'MT784', 'BASICA', 2, true, true, 'TEXT', 'SELECT', 'Tipo',
    'Tipo de garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':30:', 'Date of Issue', 'Fecha de emisión',
    'MT784', 'FECHAS', 3, true, true, 'DATE', 'DATE_PICKER', 'Fecha',
    'Fecha de emisión de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':31E:', 'Expiry Date', 'Fecha de vencimiento',
    'MT784', 'FECHAS', 4, false, true, 'DATE', 'DATE_PICKER', 'Vencimiento',
    'Fecha de vencimiento de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Currency Code, Amount', 'Moneda y monto',
    'MT784', 'MONTOS', 5, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    'Monto de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Applicant', 'Ordenante',
    'MT784', 'PARTES', 6, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Ordenante de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiary', 'Beneficiario',
    'MT784', 'PARTES', 7, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Details of Undertaking', 'Detalles de la garantía',
    'MT784', 'DETALLES', 8, false, true, 'TEXTAREA', 'TEXTAREA', 'Detalles',
    'Texto completo y condiciones extendidas de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Extended Fields', 'Campos extendidos',
    'MT784', 'DETALLES', 9, false, true, 'TEXTAREA', 'TEXTAREA', 'Campos adicionales',
    'Campos adicionales de la garantía extendida', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT797 - AUTHORIZATION TO PAY, ACCEPT OR NEGOTIATE (Free Format)
-- Used in Doka: LITFRE, LETFRE, GITFRE
-- ============================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Sender''s Reference', 'Referencia del remitente',
    'MT797', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Related Reference', 'Referencia relacionada',
    'MT797', 'BASICA', 2, false, true, 'TEXT', 'TEXT_INPUT', 'Referencia relacionada',
    '{"maxLength": 16}',
    'Referencia de la operación relacionada', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Narrative', 'Narrativa',
    'MT797', 'DETALLES', 3, true, true, 'TEXTAREA', 'TEXTAREA', 'Mensaje libre',
    'Contenido del mensaje de autorización en formato libre', 'SYSTEM', CURRENT_TIMESTAMP
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    help_text_key, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Sender to Receiver Information', 'Información adicional',
    'MT797', 'DETALLES', 4, false, true, 'TEXTAREA', 'TEXTAREA', 'Información adicional',
    'Información del remitente al receptor', 'SYSTEM', CURRENT_TIMESTAMP
);

