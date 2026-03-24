-- ================================================
-- Seed Data: swift_field_config_readmodel - Missing Trade Finance SWIFT Messages
-- Description: MT705, MT740, MT768 configurations
-- Author: GlobalCMX Architecture
-- Date: 2025-11-13
-- ================================================

-- ============================================
-- MT705 - PRE-ADVICE OF A DOCUMENTARY CREDIT
-- ============================================

-- Campo: 27 - Sequence of Total
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':27:', 'Secuencia del Total', 'Número de secuencia del mensaje',
    'MT705', 'BASICA', 1, true, true, 'TEXT', 'INPUT', 'Ej: 1/1',
    '{"maxLength": 5, "pattern": "^[0-9]{1,2}/[0-9]{1,2}$", "required": true}',
    'Secuencia del mensaje en formato n/n', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 40A - Form of Documentary Credit
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':40A:', 'Forma del Crédito Documentario', 'Tipo de LC',
    'MT705', 'BASICA', 2, true, true, 'TEXT', 'SELECT', 'Tipo de LC',
    '{"options": ["IRREVOCABLE", "IRREVOCABLE TRANSFERABLE", "IRREVOCABLE STANDBY"], "required": true}',
    'Forma del crédito: Irrevocable, Transferible, Standby', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 20 - Documentary Credit Number
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Número de Crédito Documentario', 'Número de referencia de la LC',
    'MT705', 'BASICA', 3, true, true, 'TEXT', 'TEXT_INPUT', 'Número de LC',
    '{"maxLength": 16, "required": true}',
    'Número de referencia del crédito documentario pre-avisado', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31C - Date of Issue
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31C:', 'Fecha de Emisión', 'Fecha aproximada de emisión',
    'MT705', 'FECHAS', 4, true, true, 'DATE', 'DATE_PICKER', 'Fecha emisión',
    'Fecha aproximada en que se emitirá la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31D - Date and Place of Expiry
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Fecha de Vencimiento', 'Fecha de vencimiento de la LC',
    'MT705', 'FECHAS', 5, true, true, 'DATE', 'DATE_PICKER', 'Fecha vencimiento',
    'Fecha de expiración del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 50 - Applicant
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Ordenante', 'Ordenante de la LC',
    'MT705', 'PARTES', 6, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Cliente que solicita la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 59 - Beneficiary
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiario', 'Beneficiario de la LC',
    'MT705', 'PARTES', 7, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32B - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Monto de la LC', 'Monto y moneda aproximada',
    'MT705', 'MONTOS', 8, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto aproximado del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 39A - Percentage Credit Amount Tolerance
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':39A:', 'Tolerancia Porcentual', 'Tolerancia en el monto',
    'MT705', 'MONTOS', 9, false, true, 'TEXT', 'INPUT', 'Ej: +10%, -5%',
    '{"maxLength": 20}',
    'Porcentaje de tolerancia permitido en el monto', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 41a - Available With...By...
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':41a:', 'Disponible Con', 'Banco donde es disponible',
    'MT705', 'BANCOS', 10, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco disponible',
    'Banco con quien está disponible la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 44A - Place of Taking in Charge
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':44A:', 'Lugar de Toma a Cargo', 'Puerto de embarque',
    'MT705', 'TRANSPORTE', 11, false, true, 'TEXT', 'TEXT_INPUT', 'Puerto embarque',
    'Lugar donde se toman las mercancías a cargo', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 44B - Place of Final Destination
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':44B:', 'Lugar de Destino Final', 'Puerto de destino',
    'MT705', 'TRANSPORTE', 12, false, true, 'TEXT', 'TEXT_INPUT', 'Puerto destino',
    'Lugar de destino final de las mercancías', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 45A - Description of Goods and/or Services
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':45A:', 'Descripción de Mercancías', 'Descripción general',
    'MT705', 'MERCANCIAS', 13, false, true, 'TEXTAREA', 'TEXTAREA', 'Descripción',
    'Descripción aproximada de las mercancías o servicios', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 46A - Documents Required
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':46A:', 'Documentos Requeridos', 'Lista de documentos',
    'MT705', 'DOCUMENTOS', 14, false, true, 'TEXTAREA', 'TEXTAREA', 'Documentos',
    'Documentos que probablemente se requerirán', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 47A - Additional Conditions
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':47A:', 'Condiciones Adicionales', 'Términos y condiciones',
    'MT705', 'CONDICIONES', 15, false, true, 'TEXTAREA', 'TEXTAREA', 'Condiciones',
    'Condiciones adicionales anticipadas', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 49 - Confirmation Instructions
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':49:', 'Instrucciones de Confirmación', 'Si requiere confirmación',
    'MT705', 'CONDICIONES', 16, false, true, 'TEXT', 'SELECT', 'Confirmación',
    '{"options": ["CONFIRM", "MAY ADD", "WITHOUT"]}',
    'Instrucciones sobre confirmación de la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT740 - AUTHORIZATION TO REIMBURSE
-- ============================================

-- Campo: 27 - Sequence of Total
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':27:', 'Secuencia del Total', 'Secuencia del mensaje',
    'MT740', 'BASICA', 1, true, true, 'TEXT', 'INPUT', 'Ej: 1/1',
    '{"maxLength": 5, "pattern": "^[0-9]{1,2}/[0-9]{1,2}$", "required": true}',
    'Número de secuencia, formato n/n', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 20 - Documentary Credit Number
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Número de LC', 'Número del crédito documentario',
    'MT740', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Número LC',
    '{"maxLength": 16, "required": true}',
    'Número de referencia de la carta de crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Reference to Pre-Advice
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia al Pre-Aviso', 'Referencia del MT705',
    'MT740', 'BASICA', 3, false, true, 'TEXT', 'TEXT_INPUT', 'Ref. pre-aviso',
    '{"maxLength": 16}',
    'Referencia al pre-aviso previo (MT705)', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 25 - Account Identification
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':25:', 'Número de Cuenta', 'Cuenta para reembolso',
    'MT740', 'BASICA', 4, false, true, 'TEXT', 'TEXT_INPUT', 'Cuenta',
    '{"maxLength": 35}',
    'Número de cuenta a debitar para el reembolso', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31C - Date of Issue
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31C:', 'Fecha de Emisión', 'Fecha de emisión de la LC',
    'MT740', 'FECHAS', 5, true, true, 'DATE', 'DATE_PICKER', 'Fecha emisión',
    'Fecha en que se emitió la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31D - Date and Place of Expiry
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Fecha de Vencimiento', 'Fecha de vencimiento',
    'MT740', 'FECHAS', 6, true, true, 'DATE', 'DATE_PICKER', 'Vencimiento',
    'Fecha de expiración de la LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 51a - Applicant Bank
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':51a:', 'Banco del Ordenante', 'Banco emisor de la LC',
    'MT740', 'BANCOS', 7, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco emisor',
    'Banco que emitió el crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 50 - Applicant
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Ordenante', 'Ordenante de la LC',
    'MT740', 'PARTES', 8, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Ordenante',
    'Cliente ordenante del crédito', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 59 - Beneficiary
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiario', 'Beneficiario de la LC',
    'MT740', 'PARTES', 9, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32B - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Monto de la LC', 'Monto y moneda',
    'MT740', 'MONTOS', 10, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}',
    'Monto del crédito documentario', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 39A - Percentage Credit Amount Tolerance
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':39A:', 'Tolerancia Porcentual', 'Tolerancia en el monto',
    'MT740', 'MONTOS', 11, false, true, 'TEXT', 'INPUT', 'Ej: +10%/-5%',
    '{"maxLength": 20}',
    'Porcentaje de tolerancia en el monto', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 41a - Available With...By...
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':41a:', 'Disponible Con', 'Banco pagador/negociador',
    'MT740', 'BANCOS', 12, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco disponible',
    '{"options": ["BY PAYMENT", "BY ACCEPTANCE", "BY NEGOTIATION", "BY DEF PAYMENT"]}',
    'Banco con quien está disponible y método', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 42a - Drawee
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':42a:', 'Librado', 'Banco librado',
    'MT740', 'BANCOS', 13, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco librado',
    'Banco contra quien se giran los giros', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 53a - Reimbursing Bank
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':53a:', 'Banco Reembolsador', 'Banco que reembolsa',
    'MT740', 'BANCOS', 14, true, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco reembolsador',
    'Banco autorizado para efectuar reembolsos', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 78 - Instructions to the Paying/Accepting/Negotiating Bank
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':78:', 'Instrucciones al Banco', 'Instrucciones de reembolso',
    'MT740', 'CONDICIONES', 15, false, true, 'TEXTAREA', 'TEXTAREA', 'Instrucciones',
    '{"maxLength": 6000}',
    'Instrucciones específicas al banco pagador/negociador', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ============================================
-- MT768 - ACKNOWLEDGEMENT OF A GUARANTEE/STANDBY LC
-- ============================================

-- Campo: 20 - Transaction Reference Number
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':20:', 'Referencia de Transacción', 'Referencia del acuse',
    'MT768', 'BASICA', 1, true, true, 'TEXT', 'TEXT_INPUT', 'Referencia',
    '{"maxLength": 16, "required": true}',
    'Número de referencia del acuse de recibo', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 21 - Related Reference
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':21:', 'Referencia Relacionada', 'Referencia de la garantía',
    'MT768', 'BASICA', 2, true, true, 'TEXT', 'TEXT_INPUT', 'Ref. garantía',
    '{"maxLength": 16, "required": true}',
    'Referencia del MT760 o MT767 que se reconoce', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 23 - Further Identification
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':23:', 'Identificación Adicional', 'Tipo de mensaje reconocido',
    'MT768', 'BASICA', 3, false, true, 'TEXT', 'SELECT', 'Tipo mensaje',
    '{"options": ["ISSUE", "AMENDMENT", "INCREASE", "DECREASE", "EXTEND", "CANCEL"]}',
    'Tipo de operación que se está reconociendo', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 52a - Guarantor
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':52a:', 'Garante', 'Banco emisor de la garantía',
    'MT768', 'BANCOS', 4, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', 'Banco garante',
    'Banco que emitió la garantía o standby LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 50 - Applicant
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':50:', 'Solicitante', 'Solicitante de la garantía',
    'MT768', 'PARTES', 5, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Solicitante',
    'Parte que solicitó la garantía', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 59 - Beneficiary
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':59:', 'Beneficiario', 'Beneficiario de la garantía',
    'MT768', 'PARTES', 6, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'Beneficiario',
    'Beneficiario de la garantía o standby LC', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 32B - Currency Code, Amount
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':32B:', 'Monto de la Garantía', 'Monto reconocido',
    'MT768', 'MONTOS', 7, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'Monto',
    '{"minValue": 0.01, "maxValue": 99999999.99}',
    'Monto de la garantía que se reconoce', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 31D - Expiry Date
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(), ':31D:', 'Fecha de Vencimiento', 'Fecha de vencimiento reconocida',
    'MT768', 'FECHAS', 8, false, true, 'DATE', 'DATE_PICKER', 'Vencimiento',
    'Fecha de vencimiento de la garantía reconocida', 'SYSTEM', CURRENT_TIMESTAMP
);

-- Campo: 72 - Sender to Receiver Information
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, created_by, created_at
) VALUES (
    UUID(), ':72:', 'Información Adicional', 'Comentarios o instrucciones',
    'MT768', 'ADICIONAL', 9, false, true, 'TEXTAREA', 'TEXTAREA', 'Información',
    '{"maxLength": 6000}',
    'Información adicional o comentarios sobre el acuse', 'SYSTEM', CURRENT_TIMESTAMP
);

-- ================================================
-- Fin de configuración de mensajes faltantes
-- ================================================
