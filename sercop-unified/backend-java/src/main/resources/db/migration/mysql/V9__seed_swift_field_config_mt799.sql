-- V9: Configuración de campos SWIFT para MT799 (Mensaje de Texto Libre)
-- Descripción: MT799 es un mensaje de formato libre utilizado para comunicaciones entre bancos
-- relacionadas con cartas de crédito, garantías y otras operaciones de comercio exterior.

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, documentation_url, created_by, created_at
) VALUES

-- ===============================================
-- CAMPOS OBLIGATORIOS
-- ===============================================

-- Campo :20: - Referencia de la Transacción (Obligatorio)
(
    UUID(), ':20:', 'Referencia de la Transacción',
    'Referencia única asignada por el remitente del mensaje',
    'MT799', 'BASICA', 1,
    true, true, 'TEXT', 'TEXT_INPUT', 'Ingrese referencia única del mensaje',
    '{"maxLength": 16, "pattern": "^[A-Z0-9/-?:().,''+ ]{1,16}$", "required": true}',
    'Identificador alfanumérico único del mensaje MT799. Máximo 16 caracteres.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_20.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :79: - Narrativa (Obligatorio - Campo Principal del MT799)
(
    UUID(), ':79:', 'Narrativa',
    'Texto libre del mensaje MT799',
    'MT799', 'BASICA', 2,
    true, true, 'TEXTAREA', 'TEXTAREA', 'Ingrese el contenido del mensaje libre',
    '{"maxLength": 35000, "required": true, "lines": 50}',
    'Contenido de texto libre del mensaje. Puede incluir hasta 50 líneas de 35 caracteres cada una (máximo 1750 caracteres en total). Se usa para comunicaciones bancarias, pre-avisos, confirmaciones, etc.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_79.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- ===============================================
-- CAMPOS OPCIONALES
-- ===============================================

-- Campo :21: - Referencia Relacionada (Opcional)
(
    UUID(), ':21:', 'Referencia Relacionada',
    'Referencia del mensaje o transacción relacionada',
    'MT799', 'REFERENCIAS', 3,
    false, true, 'TEXT', 'TEXT_INPUT', 'Ingrese referencia de mensaje relacionado',
    '{"maxLength": 16, "pattern": "^[A-Z0-9/-?:().,''+ ]{1,16}$"}',
    'Referencia de un mensaje anterior o transacción relacionada (ej: LC, garantía). Máximo 16 caracteres.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_21.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :23: - Código de Instrucción Bancaria (Opcional)
(
    UUID(), ':23:', 'Código de Instrucción Bancaria',
    'Código que indica el tipo de mensaje o instrucción',
    'MT799', 'REFERENCIAS', 4,
    false, true, 'TEXT', 'SELECT', 'Seleccione tipo de instrucción',
    '{"maxLength": 16, "options": ["PREADVICE", "CONFIRMATION", "QUERY", "RESPONSE", "INFO", "URGENT"]}',
    'Código opcional que clasifica el propósito del mensaje MT799 (ej: PREADVICE para pre-aviso de LC)',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_23.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :30: - Fecha de Ejecución (Opcional)
(
    UUID(), ':30:', 'Fecha de Ejecución',
    'Fecha relevante para el mensaje',
    'MT799', 'FECHAS', 5,
    false, true, 'DATE', 'DATE_PICKER', 'Seleccione fecha',
    '{"format": "YYMMDD"}',
    'Fecha en formato AAMMDD (Año, Mes, Día) relevante para el contenido del mensaje',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_30.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :50: - Ordenante/Remitente (Opcional)
(
    UUID(), ':50:', 'Ordenante',
    'Información del ordenante o cliente del banco remitente',
    'MT799', 'PARTICIPANTES', 6,
    false, true, 'PARTICIPANT', 'PARTY_SELECT', 'Seleccione ordenante',
    '{"maxLength": 140, "lines": 4}',
    'Identificación del cliente u ordenante. Hasta 4 líneas de 35 caracteres cada una.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_50.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :52a: - Banco Ordenante (Opcional)
(
    UUID(), ':52A:', 'Banco Ordenante',
    'Banco que envía el mensaje por cuenta del ordenante',
    'MT799', 'PARTICIPANTES', 7,
    false, true, 'INSTITUTION', 'BANK_SELECT', 'Seleccione banco ordenante',
    '{"identifierType": "BIC", "maxLength": 35}',
    'Banco que actúa por cuenta del ordenante. Identificado por BIC (Business Identifier Code).',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_52a.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :53a: - Banco del Remitente (Opcional)
(
    UUID(), ':53A:', 'Banco del Remitente',
    'Banco reembolsador o banco del remitente',
    'MT799', 'PARTICIPANTES', 8,
    false, true, 'INSTITUTION', 'BANK_SELECT', 'Seleccione banco del remitente',
    '{"identifierType": "BIC", "maxLength": 35}',
    'Banco que actúa como intermediario o reembolsador. Identificado por BIC.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_53a.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :56a: - Banco Intermediario (Opcional)
(
    UUID(), ':56A:', 'Banco Intermediario',
    'Banco intermediario en la comunicación',
    'MT799', 'PARTICIPANTES', 9,
    false, true, 'INSTITUTION', 'BANK_SELECT', 'Seleccione banco intermediario',
    '{"identifierType": "BIC", "maxLength": 35}',
    'Banco que actúa como intermediario en el flujo del mensaje. Identificado por BIC.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_56a.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :57a: - Banco Destinatario/Avisador (Opcional)
(
    UUID(), ':57A:', 'Banco Destinatario',
    'Banco que recibe el aviso o confirmación',
    'MT799', 'PARTICIPANTES', 10,
    false, true, 'INSTITUTION', 'BANK_SELECT', 'Seleccione banco destinatario',
    '{"identifierType": "BIC", "maxLength": 35}',
    'Banco destinatario del mensaje MT799. Identificado por BIC.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_57a.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :59: - Beneficiario (Opcional)
(
    UUID(), ':59:', 'Beneficiario',
    'Beneficiario o parte destinataria de la comunicación',
    'MT799', 'PARTICIPANTES', 11,
    false, true, 'PARTICIPANT', 'PARTY_SELECT', 'Seleccione beneficiario',
    '{"maxLength": 140, "lines": 4}',
    'Identificación del beneficiario o parte interesada. Hasta 4 líneas de 35 caracteres cada una.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_59.htm',
    'SYSTEM', CURRENT_TIMESTAMP
),

-- Campo :72: - Información al Remitente/Destinatario (Opcional)
(
    UUID(), ':72:', 'Información al Banco',
    'Información adicional dirigida al banco remitente o destinatario',
    'MT799', 'ADICIONAL', 12,
    false, true, 'TEXTAREA', 'TEXTAREA', 'Ingrese información adicional',
    '{"maxLength": 210, "lines": 6}',
    'Información adicional o instrucciones para los bancos involucrados. Hasta 6 líneas de 35 caracteres.',
    'https://www2.swift.com/knowledgecentre/publications/us9m_20230720/2.0?topic=idx_fld_tag_72.htm',
    'SYSTEM', CURRENT_TIMESTAMP
);

-- Resumen de la configuración:
-- Mensaje: MT799 - Mensaje de Texto Libre
-- Total de campos: 12
-- Campos obligatorios: 2 (:20:, :79:)
-- Campos opcionales: 10
-- Uso principal: Pre-avisos de LC, confirmaciones bancarias, consultas, comunicaciones relacionadas con operaciones de comercio exterior
