-- ===========================================================================
-- Migración: Corrección completa de campos SWIFT MT700 según especificación
-- ===========================================================================
-- Basado en auditoría vs SWIFT MT700 Format Specifications (Nov 2025)
-- Campos oficiales MT700:
--   27, 40A, 20, 23, 31C, 40E, 31D, 51a, 50, 59, 32B, 39A, 39C, 41a,
--   42C, 42a, 42M, 42P, 43P, 43T, 44A, 44E, 44F, 44B, 44C, 44D,
--   45A, 46A, 47A, 49G, 49H, 71D, 48, 49, 58a, 53a, 78, 57a, 72Z
-- ===========================================================================

-- =============================================
-- 1. DESACTIVAR CAMPOS EXTRA (no existen en spec MT700)
-- =============================================

-- :54a: NO existe en MT700 spec
UPDATE swift_field_config_readmodel
SET is_active = false
WHERE field_code = ':54a:' AND message_type = 'MT700';

-- :56a: NO existe en MT700 spec
UPDATE swift_field_config_readmodel
SET is_active = false
WHERE field_code = ':56a:' AND message_type = 'MT700';

-- :79: NO existe en MT700 spec (existe en MT420, no en MT700)
UPDATE swift_field_config_readmodel
SET is_active = false
WHERE field_code = ':79:' AND message_type = 'MT700';

-- :71B: NO existe en MT700 spec (en MT700 el campo de cargos es :71D:)
-- Desactivar en vez de renombrar para evitar conflicto de unique key
UPDATE swift_field_config_readmodel
SET is_active = false
WHERE field_code = ':71B:' AND message_type = 'MT700';

-- :72: NO existe en MT700 spec (en MT700 es :72Z:, :72: se usa en Category 4)
-- Desactivar en vez de renombrar para evitar conflicto de unique key
UPDATE swift_field_config_readmodel
SET is_active = false
WHERE field_code = ':72:' AND message_type = 'MT700';

-- =============================================
-- 2. ACTUALIZAR CAMPOS :71D: y :72Z: EXISTENTES
--    (ya existen en DB, solo corregir formato/nombre)
-- =============================================

-- :71D: Charges (formato 6*35z) - asegurar que está activo y con formato correcto
UPDATE swift_field_config_readmodel
SET is_active = true,
    field_name_key = 'swift.mt700.71D.fieldName',
    description_key = 'swift.mt700.71D.description',
    swift_format = '6*35z',
    field_type = 'TEXT',
    component_type = 'TEXTAREA',
    validation_rules = JSON_OBJECT(
        'maxLines', 6,
        'maxLineLength', 35,
        'inputMode', 'text'
    )
WHERE field_code = ':71D:' AND message_type = 'MT700';

-- :72Z: Sender to Receiver Information (formato 6*35z) - asegurar que está activo
UPDATE swift_field_config_readmodel
SET is_active = true,
    field_name_key = 'swift.mt700.72Z.fieldName',
    description_key = 'swift.mt700.72Z.description',
    swift_format = '6*35z',
    field_type = 'TEXT',
    component_type = 'TEXTAREA',
    validation_rules = JSON_OBJECT(
        'maxLines', 6,
        'maxLineLength', 35,
        'inputMode', 'text'
    )
WHERE field_code = ':72Z:' AND message_type = 'MT700';

-- =============================================
-- 3. CORREGIR NOMBRES INCORRECTOS
-- =============================================

-- :51a: dice "Banco Emisor" pero en MT700 es "Applicant Bank" (tag 8)
UPDATE swift_field_config_readmodel
SET field_name_key = 'swift.mt700.51a.fieldName',
    description_key = 'swift.mt700.51a.description'
WHERE field_code = ':51a:' AND message_type = 'MT700';

-- :53a: dice "Banco Confirmador" pero en MT700 es "Reimbursing Bank" (tag 36)
UPDATE swift_field_config_readmodel
SET field_name_key = 'swift.mt700.53a.fieldName',
    description_key = 'swift.mt700.53a.description'
WHERE field_code = ':53a:' AND message_type = 'MT700';

-- :58a: dice "Banco Corresponsal" pero en MT700 es "Requested Confirmation Party" (tag 35)
UPDATE swift_field_config_readmodel
SET field_name_key = 'swift.mt700.58a.fieldName',
    description_key = 'swift.mt700.58a.description'
WHERE field_code = ':58a:' AND message_type = 'MT700';

-- =============================================
-- 4. AGREGAR CAMPOS FALTANTES (solo si no existen)
-- =============================================

-- :27: Sequence of Total (OBLIGATORIO) - formato 1!n/1!n - tag 1
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    swift_format, validation_rules, created_by, created_at
) SELECT
    UUID(),
    ':27:',
    'swift.mt700.27.fieldName',
    'swift.mt700.27.description',
    'MT700',
    'BASICA',
    0,
    true,
    true,
    'TEXT',
    'TEXT_INPUT',
    'swift.mt700.27.placeholder',
    '1!n/1!n',
    JSON_OBJECT(
        'pattern', '^[1-9]/[1-9]$',
        'maxLength', 3,
        'required', true,
        'patternMessage', 'Formato: n/n (ej: 1/1)'
    ),
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:' AND message_type = 'MT700'
);

-- :42a: Drawee (OPCIONAL) - Option A o D - tag 16
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    swift_format, validation_rules, created_by, created_at
) SELECT
    UUID(),
    ':42a:',
    'swift.mt700.42a.fieldName',
    'swift.mt700.42a.description',
    'MT700',
    'TERMINOS',
    32,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'swift.mt700.42a.placeholder',
    'A: [/1!a][/34x]4!a2!a2!c[3!c] | D: [/1!a][/34x]4*35x',
    JSON_OBJECT(
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    ),
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:' AND message_type = 'MT700'
);

-- :44D: Shipment Period (OPCIONAL) - formato 6*65x - tag 26
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    swift_format, validation_rules, created_by, created_at
) SELECT
    UUID(),
    ':44D:',
    'swift.mt700.44D.fieldName',
    'swift.mt700.44D.description',
    'MT700',
    'TRANSPORTE',
    43,
    false,
    true,
    'TEXT',
    'TEXTAREA',
    'swift.mt700.44D.placeholder',
    '6*65x',
    JSON_OBJECT(
        'maxLines', 6,
        'maxLineLength', 65,
        'inputMode', 'text'
    ),
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:' AND message_type = 'MT700'
);

-- :49G: Special Payment Conditions for Beneficiary (OPCIONAL) - formato 100*65z - tag 30
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    swift_format, validation_rules, created_by, created_at
) SELECT
    UUID(),
    ':49G:',
    'swift.mt700.49G.fieldName',
    'swift.mt700.49G.description',
    'MT700',
    'CONDICIONES',
    56,
    false,
    true,
    'TEXT',
    'TEXTAREA',
    'swift.mt700.49G.placeholder',
    '100*65z',
    JSON_OBJECT(
        'maxLines', 100,
        'maxLineLength', 65,
        'inputMode', 'text'
    ),
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49G:' AND message_type = 'MT700'
);

-- :49H: Special Payment Conditions for Bank Only (OPCIONAL) - formato 100*65z - tag 31
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    swift_format, validation_rules, created_by, created_at
) SELECT
    UUID(),
    ':49H:',
    'swift.mt700.49H.fieldName',
    'swift.mt700.49H.description',
    'MT700',
    'CONDICIONES',
    57,
    false,
    true,
    'TEXT',
    'TEXTAREA',
    'swift.mt700.49H.placeholder',
    '100*65z',
    JSON_OBJECT(
        'maxLines', 100,
        'maxLineLength', 65,
        'inputMode', 'text'
    ),
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49H:' AND message_type = 'MT700'
);

-- :57a: 'Advise Through' Bank (OPCIONAL) - Option A, B o D - tag 38
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    swift_format, validation_rules, created_by, created_at
) SELECT
    UUID(),
    ':57a:',
    'swift.mt700.57a.fieldName',
    'swift.mt700.57a.description',
    'MT700',
    'BANCOS',
    25,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'swift.mt700.57a.placeholder',
    'A: [/1!a][/34x]4!a2!a2!c[3!c] | B: [/1!a][/34x] | D: [/1!a][/34x]4*35x',
    JSON_OBJECT(
        'bicPattern', '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'bicMessage', 'Código BIC debe tener 8 u 11 caracteres'
    ),
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:' AND message_type = 'MT700'
);
