-- ================================================
-- Seed Data: swift_field_config_readmodel - All Trade Finance SWIFT Messages
-- Description: Complete configuration for all trade finance SWIFT message types
-- Author: GlobalCMX Architecture
-- Date: 2025-11-13
-- ================================================

-- ============================================
-- MT707 - AMENDMENT TO A DOCUMENTARY CREDIT
-- ============================================

-- Campo: 20 - Sender's Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia del Remitente', 'Referencia única de la enmienda',
    'MT707', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia única',
    '{"maxLength": 16, "pattern": "^[A-Z0-9/-?:().,''+ ]{1,16}$", "required": true}',
    'Referencia única que identifica esta enmienda a la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia Relacionada', 'Referencia de la LC original',
    'MT707', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia LC original',
    '{"maxLength": 16, "required": true}',
    'Referencia del MT700 original que se está enmendando', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31D - Date of Issue
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Nueva Fecha de Vencimiento', 'Nueva fecha de vencimiento de la LC',
    'MT707', 'FECHAS', 3, false, true, 'DATE', 'DATE_PICKER', 'Nueva fecha de vencimiento',
    'Nueva fecha de vencimiento si la enmienda modifica la fecha original', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32B - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Incremento/Decremento de Monto', 'Cambio en el monto de la LC',
    'MT707', 'MONTOS', 4, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto del cambio',
    '{"minValue": -99999999.99, "maxValue": 99999999.99}',
    'Incremento (positivo) o decremento (negativo) del monto de la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 50 - Applicant
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Ordenante', 'Nuevo ordenante si cambia',
    'MT707', 'PARTES', 5, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Nuevo ordenante',
    'Nuevo ordenante solo si la enmienda cambia al ordenante original', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 59 - Beneficiary
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiario', 'Nuevo beneficiario si cambia',
    'MT707', 'PARTES', 6, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Nuevo beneficiario',
    'Nuevo beneficiario solo si la enmienda lo modifica', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 45A - Description of Goods
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':45A:', 'Cambios en Descripción de Mercancías', 'Modificaciones a la descripción',
    'MT707', 'MERCANCIAS', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'Cambios en descripción',
    'Nuevos términos o cambios en la descripción de las mercancías', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 47A - Additional Conditions
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':47A:', 'Condiciones Adicionales', 'Nuevas condiciones adicionales',
    'MT707', 'CONDICIONES', 8, false, true, 'TEXTAREA', 'TEXTAREA', 'Nuevas condiciones',
    'Condiciones adicionales o modificadas en esta enmienda', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT710 - ADVICE OF A THIRD BANK'S DOCUMENTARY CREDIT
-- ============================================

-- Campo: 20 - Documentary Credit Number
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Número de Crédito Documentario', 'Número de la LC del tercer banco',
    'MT710', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número de referencia de la LC emitida por el tercer banco', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 27 - Sequence of Total
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':27:', 'Secuencia del Total', 'Secuencia del mensaje',
    'MT710', 'BASICA', 2, true, true, 'TEXT', 'INPUT', 'Ej: 1/1',
    '{"maxLength": 5, "pattern": "^[0-9]{1,2}/[0-9]{1,2}$", "required": true}',
    'Número de secuencia del mensaje, formato: n/n', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 40A - Form of Documentary Credit
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':40A:', 'Forma del Crédito Documentario', 'Tipo de LC',
    'MT710', 'BASICA', 3, true, true, 'TEXT', 'SELECT', 'Tipo de LC',
    '{"options": ["IRREVOCABLE", "IRREVOCABLE TRANSFERABLE", "IRREVOCABLE STANDBY"], "required": true}',
    'Forma del crédito documentario: Irrevocable, Transferible, Standby', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31C - Date of Issue
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31C:', 'Fecha de Emisión', 'Fecha de emisión de la LC',
    'MT710', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha de emisión',
    'Fecha en que el tercer banco emitió la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31D - Expiry Date
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Fecha de Vencimiento', 'Fecha de vencimiento de la LC',
    'MT710', 'FECHAS', 5, true, true, 'DATE', 'DATE_PICKER', 'Fecha de vencimiento',
    'Fecha de expiración de la LC del tercer banco', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 51a - Applicant Bank
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':51a:', 'Banco del Solicitante', 'Banco del solicitante de la LC',
    'MT710', 'BANCOS', 6, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco solicitante',
    'Banco que representa al solicitante (tercer banco)', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 50 - Applicant
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Ordenante', 'Ordenante de la LC',
    'MT710', 'PARTES', 7, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Cliente que solicita la emisión de la LC por el tercer banco', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 59 - Beneficiary
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiario', 'Beneficiario de la LC',
    'MT710', 'PARTES', 8, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario de la LC del tercer banco', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32B - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Monto de la LC', 'Monto y moneda de la LC',
    'MT710', 'MONTOS', 9, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto de la LC emitida por el tercer banco', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 45A - Description of Goods
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':45A:', 'Descripción de Mercancías', 'Descripción de las mercancías',
    'MT710', 'MERCANCIAS', 10, true, true, 'TEXTAREA', 'TEXTAREA', 'Descripción',
    'Descripción de las mercancías o servicios cubiertos por la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 46A - Documents Required
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':46A:', 'Documentos Requeridos', 'Lista de documentos requeridos',
    'MT710', 'DOCUMENTOS', 11, true, true, 'TEXTAREA', 'TEXTAREA', 'Documentos',
    'Documentos que debe presentar el beneficiario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 47A - Additional Conditions
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':47A:', 'Condiciones Adicionales', 'Términos y condiciones',
    'MT710', 'CONDICIONES', 12, false, true, 'TEXTAREA', 'TEXTAREA', 'Condiciones',
    'Condiciones adicionales de la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT720 - TRANSFER OF A DOCUMENTARY CREDIT
-- ============================================

-- Campo: 20 - Sender's Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia del Remitente', 'Referencia de la transferencia',
    'MT720', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Referencia única de la transferencia de LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia de LC Original', 'Número de la LC original',
    'MT720', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'LC original',
    '{"maxLength": 16, "required": true}',
    'Número de referencia de la LC transferible original', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32B - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Monto Transferido', 'Monto y moneda transferida',
    'MT720', 'MONTOS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto que se transfiere al segundo beneficiario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 50 - First Beneficiary
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Primer Beneficiario', 'Beneficiario original de la LC',
    'MT720', 'PARTES', 4, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Primer beneficiario',
    'Beneficiario original que transfiere la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 59 - Second Beneficiary
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Segundo Beneficiario', 'Nuevo beneficiario por transferencia',
    'MT720', 'PARTES', 5, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Segundo beneficiario',
    'Beneficiario que recibe la LC por transferencia', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31D - Expiry Date
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Fecha de Vencimiento', 'Fecha de vencimiento transferida',
    'MT720', 'FECHAS', 6, false, true, 'DATE', 'DATE_PICKER', 'Vencimiento',
    'Fecha de vencimiento para el segundo beneficiario (puede ser diferente)', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 45A - Description of Goods
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':45A:', 'Descripción de Mercancías', 'Descripción modificada',
    'MT720', 'MERCANCIAS', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'Descripción',
    'Descripción modificada de mercancías para el segundo beneficiario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT730 - ACKNOWLEDGEMENT
-- ============================================

-- Campo: 20 - Transaction Reference Number
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia de Transacción', 'Número de referencia',
    'MT730', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Número de referencia del acuse de recibo', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia Relacionada', 'Referencia del mensaje original',
    'MT730', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Mensaje original',
    '{"maxLength": 16, "required": true}',
    'Referencia del mensaje que se está reconociendo (MT700, MT707, etc.)', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 25 - Account Identification
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':25:', 'Número de Cuenta', 'Identificación de cuenta',
    'MT730', 'BASICA', 3, false, true, 'TEXT', 'TEXT_INPUT', 'Número de cuenta',
    '{"maxLength": 35}',
    'Número de cuenta relacionado con la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 52a - Issuing Bank
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Banco Emisor', 'Banco que emitió la LC',
    'MT730', 'BANCOS', 4, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco que emitió el crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT767 - GUARANTEE/STANDBY LC AMENDMENT
-- ============================================

-- Campo: 20 - Sender's Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia del Remitente', 'Referencia de la enmienda',
    'MT767', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Referencia única de la enmienda a la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia de Garantía Original', 'Número de la garantía original',
    'MT767', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Garantía original',
    '{"maxLength": 16, "required": true}',
    'Referencia del MT760 original que se está enmendando', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31D - New Expiry Date
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Nueva Fecha de Vencimiento', 'Fecha de vencimiento modificada',
    'MT767', 'FECHAS', 3, false, true, 'DATE', 'DATE_PICKER', 'Nuevo vencimiento',
    'Nueva fecha de vencimiento si la enmienda la modifica', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32B - Increase/Decrease Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Incremento/Decremento de Monto', 'Cambio en el monto',
    'MT767', 'MONTOS', 4, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Cambio de monto',
    '{"minValue": -99999999.99, "maxValue": 99999999.99}',
    'Incremento (positivo) o decremento (negativo) del monto de la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 77C - Terms and Conditions
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':77C:', 'Nuevos Términos y Condiciones', 'Modificaciones a términos',
    'MT767', 'TERMINOS', 5, false, true, 'TEXTAREA', 'TEXTAREA', 'Nuevos términos',
    'Modificaciones o adiciones a los términos y condiciones originales', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT400 - ADVICE OF PAYMENT (COLLECTIONS)
-- ============================================

-- Campo: 20 - Sender's Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia del Remitente', 'Referencia del aviso de pago',
    'MT400', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Referencia única del aviso de pago', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia de Cobranza', 'Número de la cobranza',
    'MT400', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número cobranza',
    '{"maxLength": 16, "required": true}',
    'Número de referencia de la cobranza documentaria', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32a - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32a:', 'Monto Pagado', 'Monto y moneda del pago',
    'MT400', 'MONTOS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto pagado por el librado', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 52a - Drawee
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Librado', 'Quien realiza el pago',
    'MT400', 'PARTES', 4, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Librado',
    'Parte que realiza el pago de la cobranza', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 72 - Sender to Receiver Information
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Información Adicional', 'Detalles del pago',
    'MT400', 'ADICIONAL', 5, false, true, 'TEXTAREA', 'TEXTAREA', 'Información',
    '{"maxLength": 6000}',
    'Información adicional sobre el pago o instrucciones', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT410 - ACKNOWLEDGEMENT (COLLECTIONS)
-- ============================================

-- Campo: 20 - Transaction Reference Number
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia de Transacción', 'Referencia del acuse',
    'MT410', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Número de referencia del acuse de recibo', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia Relacionada', 'Referencia de la cobranza',
    'MT410', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Cobranza',
    '{"maxLength": 16, "required": true}',
    'Referencia de la cobranza que se reconoce', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 23 - Further Identification
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':23:', 'Identificación Adicional', 'Código de identificación',
    'MT410', 'BASICA', 3, false, true, 'TEXT', 'TEXT_INPUT', 'Código',
    '{"maxLength": 16}',
    'Código de identificación adicional de la operación', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 52a - Drawee
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Librado', 'Datos del librado',
    'MT410', 'PARTES', 4, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Librado',
    'Parte contra quien se gira la cobranza', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT412 - ADVICE OF ACCEPTANCE (COLLECTIONS)
-- ============================================

-- Campo: 20 - Sender's Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia del Remitente', 'Referencia del aviso',
    'MT412', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Referencia única del aviso de aceptación', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia de Cobranza', 'Número de cobranza',
    'MT412', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Cobranza',
    '{"maxLength": 16, "required": true}',
    'Número de la cobranza documentaria aceptada', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32a - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32a:', 'Monto Aceptado', 'Monto y moneda aceptada',
    'MT412', 'MONTOS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto aceptado por el librado', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 33a - Date of Acceptance
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':33a:', 'Fecha de Aceptación', 'Fecha en que se aceptó',
    'MT412', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha aceptación',
    'Fecha en que el librado aceptó la cobranza', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 52a - Drawee
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Librado', 'Quien acepta',
    'MT412', 'PARTES', 5, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Librado',
    'Parte que acepta la cobranza documentaria', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT416 - ADVICE OF NON-PAYMENT/NON-ACCEPTANCE (COLLECTIONS)
-- ============================================

-- Campo: 20 - Sender's Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia del Remitente', 'Referencia del aviso',
    'MT416', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Referencia única del aviso de no pago/no aceptación', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia de Cobranza', 'Número de cobranza',
    'MT416', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Cobranza',
    '{"maxLength": 16, "required": true}',
    'Número de la cobranza no pagada o no aceptada', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 77A - Reason for Non-Payment/Non-Acceptance
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':77A:', 'Razón de No Pago/No Aceptación', 'Motivo del rechazo',
    'MT416', 'ADICIONAL', 3, true, true, 'TEXTAREA', 'TEXTAREA', 'Razón',
    '{"maxLength": 2000, "required": true}',
    'Razones por las cuales no se pagó o aceptó la cobranza', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 52a - Drawee
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Librado', 'Quien rechaza',
    'MT416', 'PARTES', 4, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Librado',
    'Parte que no paga o no acepta', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT420 - TRACER (COLLECTIONS)
-- ============================================

-- Campo: 20 - Transaction Reference Number
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia de Transacción', 'Referencia del tracer',
    'MT420', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Número de referencia del mensaje tracer', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia a Rastrear', 'Operación a rastrear',
    'MT420', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Operación',
    '{"maxLength": 16, "required": true}',
    'Número de la cobranza u operación que se está rastreando', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 11S - MT and Date of the Original Message
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':11S:', 'Tipo de Mensaje y Fecha', 'MT y fecha del mensaje original',
    'MT420', 'BASICA', 3, true, true, 'TEXT', 'TEXT_INPUT', 'Ej: MT400 250115',
    '{"maxLength": 16, "pattern": "^MT[0-9]{3} [0-9]{6}$", "required": true}',
    'Tipo de mensaje SWIFT y fecha del mensaje que se rastrea (formato: MTnnn YYMMDD)', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 79 - Narrative
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':79:', 'Narrativa', 'Descripción del seguimiento',
    'MT420', 'ADICIONAL', 4, true, true, 'TEXTAREA', 'TEXTAREA', 'Descripción',
    '{"maxLength": 6000, "required": true}',
    'Descripción detallada de la consulta o seguimiento que se solicita', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ================================================
-- Fin de configuración de mensajes SWIFT
-- ================================================
