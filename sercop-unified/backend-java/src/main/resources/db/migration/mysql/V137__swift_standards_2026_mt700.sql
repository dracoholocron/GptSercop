-- ==================================================
-- Migration V137: SWIFT Standards November 2026 - MT700
-- ==================================================
-- This migration adds the new field specifications for MT700
-- according to SWIFT Standards Release November 2026 (SRG2026)
--
-- Key Changes in 2026:
-- 1. Applicant (field 50) replaced by Sequence A with structured fields
-- 2. Beneficiary (field 59) replaced by Sequence B with structured fields
-- 3. New field 44I: Incoterms
-- 4. New field 45H: HS Code
-- 5. Field 78 replaced by 78K with expanded format
-- 6. Several format changes (44A, 44E, 44F, 44B, 42C)
--
-- Reference: SRG2026 Category 7 - Documentary Credits
-- ==================================================

-- ==================================================
-- SECTION 1: Mark Deprecated Fields in 2024 Version
-- ==================================================

-- Mark field 50 (Applicant) as deprecated - replaced by Sequence A
UPDATE swift_field_config_readmodel
SET deprecated_date = '2026-11-15',
    successor_field_code = ':50N:',
    spec_notes = 'Deprecated in SRG2026. Replaced by Sequence A (fields 50N, 50S, 50T, 50P, 50R)'
WHERE field_code = ':50:' AND message_type = 'MT700' AND spec_version = '2024';

-- Mark field 59 (Beneficiary) as deprecated - replaced by Sequence B
UPDATE swift_field_config_readmodel
SET deprecated_date = '2026-11-15',
    successor_field_code = ':59N:',
    spec_notes = 'Deprecated in SRG2026. Replaced by Sequence B (fields 59N, 59S, 59T, 59P, 59R)'
WHERE field_code = ':59:' AND message_type = 'MT700' AND spec_version = '2024';

-- Mark field 78 as deprecated - replaced by 78K
UPDATE swift_field_config_readmodel
SET deprecated_date = '2026-11-15',
    successor_field_code = ':78K:',
    spec_notes = 'Deprecated in SRG2026. Replaced by field 78K with expanded format (30*65z)'
WHERE field_code = ':78:' AND message_type = 'MT700' AND spec_version = '2024';

-- ==================================================
-- SECTION 2: Insert New 2026 Sequence A - Applicant Fields
-- ==================================================

-- Field :50N: Applicant Name (Mandatory in Sequence A)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':50N:',
    CASE WHEN l.lang = 'es' THEN 'Nombre del Ordenante' ELSE 'Applicant Name' END,
    CASE WHEN l.lang = 'es' THEN 'Nombre o razón social del ordenante de la carta de crédito' ELSE 'Name or company name of the documentary credit applicant' END,
    'MT700',
    l.lang,
    'PARTES',
    9,
    true,
    true,
    'TEXTAREA',
    'TEXTAREA',
    CASE WHEN l.lang = 'es' THEN 'Nombre completo del ordenante...' ELSE 'Full applicant name...' END,
    JSON_OBJECT(
        'required', true,
        'maxLines', 4,
        'maxLineLength', 35,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 4 líneas de 35 caracteres. Conjunto de caracteres SWIFT z.' ELSE 'Maximum 4 lines of 35 characters. SWIFT character set z.' END,
        'swiftFormat', '4*35z',
        'sequenceA', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia A del Ordenante.' ELSE 'New field SRG2026. Part of Applicant Sequence A.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50N:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :50S: Applicant Address (Mandatory in Sequence A)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':50S:',
    CASE WHEN l.lang = 'es' THEN 'Dirección del Ordenante' ELSE 'Applicant Address' END,
    CASE WHEN l.lang = 'es' THEN 'Dirección física del ordenante' ELSE 'Physical address of the applicant' END,
    'MT700',
    l.lang,
    'PARTES',
    10,
    true,
    true,
    'TEXTAREA',
    'TEXTAREA',
    CASE WHEN l.lang = 'es' THEN 'Dirección completa...' ELSE 'Full address...' END,
    JSON_OBJECT(
        'required', true,
        'maxLines', 4,
        'maxLineLength', 35,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 4 líneas de 35 caracteres.' ELSE 'Maximum 4 lines of 35 characters.' END,
        'swiftFormat', '4*35z',
        'sequenceA', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia A del Ordenante.' ELSE 'New field SRG2026. Part of Applicant Sequence A.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50S:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :50T: Applicant Town/City/State (Mandatory in Sequence A)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':50T:',
    CASE WHEN l.lang = 'es' THEN 'Ciudad/Estado del Ordenante' ELSE 'Applicant Town/City/State' END,
    CASE WHEN l.lang = 'es' THEN 'Ciudad y estado/provincia del ordenante' ELSE 'Town, city and state/province of the applicant' END,
    'MT700',
    l.lang,
    'PARTES',
    11,
    true,
    true,
    'TEXT',
    'INPUT',
    CASE WHEN l.lang = 'es' THEN 'Ciudad, Estado...' ELSE 'City, State...' END,
    JSON_OBJECT(
        'required', true,
        'maxLength', 35,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 35 caracteres.' ELSE 'Maximum 35 characters.' END,
        'swiftFormat', '35z',
        'sequenceA', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia A del Ordenante.' ELSE 'New field SRG2026. Part of Applicant Sequence A.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50T:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :50P: Applicant Post Code (Optional in Sequence A)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':50P:',
    CASE WHEN l.lang = 'es' THEN 'Código Postal del Ordenante' ELSE 'Applicant Post Code' END,
    CASE WHEN l.lang = 'es' THEN 'Código postal del ordenante' ELSE 'Postal code of the applicant' END,
    'MT700',
    l.lang,
    'PARTES',
    12,
    false,
    true,
    'TEXT',
    'INPUT',
    CASE WHEN l.lang = 'es' THEN 'Código postal...' ELSE 'Post code...' END,
    JSON_OBJECT(
        'required', false,
        'maxLength', 16,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 16 caracteres.' ELSE 'Maximum 16 characters.' END,
        'swiftFormat', '16z',
        'sequenceA', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia A del Ordenante.' ELSE 'New field SRG2026. Part of Applicant Sequence A.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50P:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :50R: Applicant Country (Mandatory in Sequence A)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, field_options, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':50R:',
    CASE WHEN l.lang = 'es' THEN 'País del Ordenante' ELSE 'Applicant Country' END,
    CASE WHEN l.lang = 'es' THEN 'Código ISO de país del ordenante' ELSE 'ISO country code of the applicant' END,
    'MT700',
    l.lang,
    'PARTES',
    13,
    true,
    true,
    'SELECT',
    'COUNTRY_SELECTOR',
    CASE WHEN l.lang = 'es' THEN 'Seleccione país...' ELSE 'Select country...' END,
    JSON_OBJECT(
        'required', true,
        'pattern', '^[A-Z]{2}$',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Código ISO 3166-1 alpha-2 de 2 letras' ELSE 'ISO 3166-1 alpha-2 code (2 letters)' END,
        'swiftFormat', '2!a',
        'sequenceA', true
    ),
    NULL,
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia A del Ordenante.' ELSE 'New field SRG2026. Part of Applicant Sequence A.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50R:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- ==================================================
-- SECTION 3: Insert New 2026 Sequence B - Beneficiary Fields
-- ==================================================

-- Field :59N: Beneficiary Name (Mandatory in Sequence B)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':59N:',
    CASE WHEN l.lang = 'es' THEN 'Nombre del Beneficiario' ELSE 'Beneficiary Name' END,
    CASE WHEN l.lang = 'es' THEN 'Nombre o razón social del beneficiario de la carta de crédito' ELSE 'Name or company name of the documentary credit beneficiary' END,
    'MT700',
    l.lang,
    'PARTES',
    14,
    true,
    true,
    'TEXTAREA',
    'TEXTAREA',
    CASE WHEN l.lang = 'es' THEN 'Nombre completo del beneficiario...' ELSE 'Full beneficiary name...' END,
    JSON_OBJECT(
        'required', true,
        'maxLines', 4,
        'maxLineLength', 35,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 4 líneas de 35 caracteres.' ELSE 'Maximum 4 lines of 35 characters.' END,
        'swiftFormat', '4*35z',
        'sequenceB', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia B del Beneficiario.' ELSE 'New field SRG2026. Part of Beneficiary Sequence B.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59N:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :59S: Beneficiary Address (Mandatory in Sequence B)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':59S:',
    CASE WHEN l.lang = 'es' THEN 'Dirección del Beneficiario' ELSE 'Beneficiary Address' END,
    CASE WHEN l.lang = 'es' THEN 'Dirección física del beneficiario' ELSE 'Physical address of the beneficiary' END,
    'MT700',
    l.lang,
    'PARTES',
    15,
    true,
    true,
    'TEXTAREA',
    'TEXTAREA',
    CASE WHEN l.lang = 'es' THEN 'Dirección completa...' ELSE 'Full address...' END,
    JSON_OBJECT(
        'required', true,
        'maxLines', 4,
        'maxLineLength', 35,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 4 líneas de 35 caracteres.' ELSE 'Maximum 4 lines of 35 characters.' END,
        'swiftFormat', '4*35z',
        'sequenceB', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia B del Beneficiario.' ELSE 'New field SRG2026. Part of Beneficiary Sequence B.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59S:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :59T: Beneficiary Town/City/State (Mandatory in Sequence B)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':59T:',
    CASE WHEN l.lang = 'es' THEN 'Ciudad/Estado del Beneficiario' ELSE 'Beneficiary Town/City/State' END,
    CASE WHEN l.lang = 'es' THEN 'Ciudad y estado/provincia del beneficiario' ELSE 'Town, city and state/province of the beneficiary' END,
    'MT700',
    l.lang,
    'PARTES',
    16,
    true,
    true,
    'TEXT',
    'INPUT',
    CASE WHEN l.lang = 'es' THEN 'Ciudad, Estado...' ELSE 'City, State...' END,
    JSON_OBJECT(
        'required', true,
        'maxLength', 35,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 35 caracteres.' ELSE 'Maximum 35 characters.' END,
        'swiftFormat', '35z',
        'sequenceB', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia B del Beneficiario.' ELSE 'New field SRG2026. Part of Beneficiary Sequence B.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59T:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :59P: Beneficiary Post Code (Optional in Sequence B)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':59P:',
    CASE WHEN l.lang = 'es' THEN 'Código Postal del Beneficiario' ELSE 'Beneficiary Post Code' END,
    CASE WHEN l.lang = 'es' THEN 'Código postal del beneficiario' ELSE 'Postal code of the beneficiary' END,
    'MT700',
    l.lang,
    'PARTES',
    17,
    false,
    true,
    'TEXT',
    'INPUT',
    CASE WHEN l.lang = 'es' THEN 'Código postal...' ELSE 'Post code...' END,
    JSON_OBJECT(
        'required', false,
        'maxLength', 16,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 16 caracteres.' ELSE 'Maximum 16 characters.' END,
        'swiftFormat', '16z',
        'sequenceB', true
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia B del Beneficiario.' ELSE 'New field SRG2026. Part of Beneficiary Sequence B.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59P:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- Field :59R: Beneficiary Country (Mandatory in Sequence B)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, field_options, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':59R:',
    CASE WHEN l.lang = 'es' THEN 'País del Beneficiario' ELSE 'Beneficiary Country' END,
    CASE WHEN l.lang = 'es' THEN 'Código ISO de país del beneficiario' ELSE 'ISO country code of the beneficiary' END,
    'MT700',
    l.lang,
    'PARTES',
    18,
    true,
    true,
    'SELECT',
    'COUNTRY_SELECTOR',
    CASE WHEN l.lang = 'es' THEN 'Seleccione país...' ELSE 'Select country...' END,
    JSON_OBJECT(
        'required', true,
        'pattern', '^[A-Z]{2}$',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Código ISO 3166-1 alpha-2 de 2 letras' ELSE 'ISO 3166-1 alpha-2 code (2 letters)' END,
        'swiftFormat', '2!a',
        'sequenceB', true
    ),
    NULL,
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Parte de la Secuencia B del Beneficiario.' ELSE 'New field SRG2026. Part of Beneficiary Sequence B.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59R:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- ==================================================
-- SECTION 4: Insert New 2026 Field - 44I Incoterms
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, field_options, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':44I:',
    'Incoterms',
    CASE WHEN l.lang = 'es' THEN 'Términos comerciales internacionales (Incoterms) aplicables al embarque' ELSE 'International commercial terms (Incoterms) applicable to the shipment' END,
    'MT700',
    l.lang,
    'TRANSPORTE',
    35,
    false,
    true,
    'COMPOSITE',
    'INCOTERMS_SELECTOR',
    CASE WHEN l.lang = 'es' THEN 'Seleccione Incoterm...' ELSE 'Select Incoterm...' END,
    JSON_OBJECT(
        'required', false,
        'incotermsCode', JSON_OBJECT(
            'pattern', '^[A-Z]{3}$',
            'required', true,
            'patternMessage', CASE WHEN l.lang = 'es' THEN 'Código Incoterm de 3 letras' ELSE 'Incoterm code (3 letters)' END
        ),
        'namedPlace', JSON_OBJECT(
            'maxLines', 2,
            'maxLineLength', 70,
            'required', false,
            'patternMessage', CASE WHEN l.lang = 'es' THEN 'Lugar nombrado opcional (máx 2 líneas de 70 caracteres)' ELSE 'Optional named place (max 2 lines of 70 characters)' END
        ),
        'swiftFormat', '3!a[2*70z]'
    ),
    JSON_ARRAY(
        JSON_OBJECT('label', 'EXW - Ex Works', 'value', 'EXW'),
        JSON_OBJECT('label', 'FCA - Free Carrier', 'value', 'FCA'),
        JSON_OBJECT('label', 'CPT - Carriage Paid To', 'value', 'CPT'),
        JSON_OBJECT('label', 'CIP - Carriage Insurance Paid', 'value', 'CIP'),
        JSON_OBJECT('label', 'DAP - Delivered at Place', 'value', 'DAP'),
        JSON_OBJECT('label', 'DPU - Delivered at Place Unloaded', 'value', 'DPU'),
        JSON_OBJECT('label', 'DDP - Delivered Duty Paid', 'value', 'DDP'),
        JSON_OBJECT('label', 'FAS - Free Alongside Ship', 'value', 'FAS'),
        JSON_OBJECT('label', 'FOB - Free on Board', 'value', 'FOB'),
        JSON_OBJECT('label', 'CFR - Cost and Freight', 'value', 'CFR'),
        JSON_OBJECT('label', 'CIF - Cost Insurance Freight', 'value', 'CIF')
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Especifica los términos comerciales internacionales según Incoterms 2020.' ELSE 'New field SRG2026. Specifies international commercial terms according to Incoterms 2020.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44I:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- ==================================================
-- SECTION 5: Insert New 2026 Field - 45H HS Code
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':45H:',
    CASE WHEN l.lang = 'es' THEN 'Código HS' ELSE 'HS Code' END,
    CASE WHEN l.lang = 'es' THEN 'Código del Sistema Armonizado para clasificación arancelaria de mercancías' ELSE 'Harmonized System code for customs tariff classification of goods' END,
    'MT700',
    l.lang,
    'MERCANCIAS',
    39,
    false,
    true,
    'TEXT',
    'INPUT',
    CASE WHEN l.lang = 'es' THEN 'Ej: 8471.30.0000' ELSE 'E.g.: 8471.30.0000' END,
    JSON_OBJECT(
        'required', false,
        'maxLength', 65,
        'characterSet', 'x',
        'pattern', '^[0-9\\.\\-\\s]{0,65}$',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Código HS (máximo 65 caracteres). Formato típico: nnnn.nn.nnnn' ELSE 'HS Code (max 65 characters). Typical format: nnnn.nn.nnnn' END,
        'swiftFormat', '65x'
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Código del Sistema Armonizado de Designación y Codificación de Mercancías de la OMA.' ELSE 'New field SRG2026. World Customs Organization Harmonized System code for goods classification.' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45H:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- ==================================================
-- SECTION 6: Insert New 2026 Field - 78K (replaces 78)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    ':78K:',
    CASE WHEN l.lang = 'es' THEN 'Instrucciones al Banco Pagador/Aceptante/Negociador' ELSE 'Instructions to the Paying/Accepting/Negotiating Bank' END,
    CASE WHEN l.lang = 'es' THEN 'Instrucciones específicas para el banco que pagará, aceptará o negociará' ELSE 'Specific instructions for the bank that will pay, accept, or negotiate' END,
    'MT700',
    l.lang,
    'INSTRUCCIONES',
    47,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    CASE WHEN l.lang = 'es' THEN 'Instrucciones al banco...' ELSE 'Bank instructions...' END,
    JSON_OBJECT(
        'required', false,
        'maxLines', 30,
        'maxLineLength', 65,
        'characterSet', 'z',
        'patternMessage', CASE WHEN l.lang = 'es' THEN 'Máximo 30 líneas de 65 caracteres. Conjunto de caracteres SWIFT z.' ELSE 'Maximum 30 lines of 65 characters. SWIFT character set z.' END,
        'swiftFormat', '30*65z'
    ),
    CASE WHEN l.lang = 'es' THEN 'Nuevo campo SRG2026. Reemplaza al campo 78 con formato expandido (30 líneas en lugar de 12).' ELSE 'New field SRG2026. Replaces field 78 with expanded format (30 lines instead of 12).' END,
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM (SELECT 'es' AS lang UNION SELECT 'en') l
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78K:' AND message_type = 'MT700' AND language = l.lang AND spec_version = '2026'
);

-- ==================================================
-- SECTION 7: Update Format Changes for 2026 (44A, 44E, 44F, 44B, 42C)
-- Create 2026 versions with updated formats
-- ==================================================

-- Copy and update field :44A: for 2026 (format change from 140z to 2*70z)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    field_code,
    field_name,
    description,
    message_type,
    language,
    section,
    display_order,
    is_required,
    true,
    field_type,
    component_type,
    placeholder,
    JSON_OBJECT(
        'required', false,
        'maxLines', 2,
        'maxLineLength', 70,
        'characterSet', 'z',
        'patternMessage', 'Máximo 2 líneas de 70 caracteres (formato actualizado SRG2026)',
        'swiftFormat', '2*70z'
    ),
    CONCAT(IFNULL(help_text, ''), ' [Formato actualizado en SRG2026: 2*70z]'),
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM swift_field_config_readmodel
WHERE field_code = ':44A:' AND message_type = 'MT700' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = ':44A:' AND s2.message_type = 'MT700' AND s2.spec_version = '2026' AND s2.language = swift_field_config_readmodel.language
);

-- Copy and update field :44E: for 2026 (format change from 140z to 2*70z)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    field_code,
    field_name,
    description,
    message_type,
    language,
    section,
    display_order,
    is_required,
    true,
    field_type,
    component_type,
    placeholder,
    JSON_OBJECT(
        'required', false,
        'maxLines', 2,
        'maxLineLength', 70,
        'characterSet', 'z',
        'patternMessage', 'Máximo 2 líneas de 70 caracteres (formato actualizado SRG2026)',
        'swiftFormat', '2*70z'
    ),
    CONCAT(IFNULL(help_text, ''), ' [Formato actualizado en SRG2026: 2*70z]'),
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM swift_field_config_readmodel
WHERE field_code = ':44E:' AND message_type = 'MT700' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = ':44E:' AND s2.message_type = 'MT700' AND s2.spec_version = '2026' AND s2.language = swift_field_config_readmodel.language
);

-- Copy and update field :44F: for 2026 (format change from 140z to 2*70z)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    field_code,
    field_name,
    description,
    message_type,
    language,
    section,
    display_order,
    is_required,
    true,
    field_type,
    component_type,
    placeholder,
    JSON_OBJECT(
        'required', false,
        'maxLines', 2,
        'maxLineLength', 70,
        'characterSet', 'z',
        'patternMessage', 'Máximo 2 líneas de 70 caracteres (formato actualizado SRG2026)',
        'swiftFormat', '2*70z'
    ),
    CONCAT(IFNULL(help_text, ''), ' [Formato actualizado en SRG2026: 2*70z]'),
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM swift_field_config_readmodel
WHERE field_code = ':44F:' AND message_type = 'MT700' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = ':44F:' AND s2.message_type = 'MT700' AND s2.spec_version = '2026' AND s2.language = swift_field_config_readmodel.language
);

-- Copy and update field :44B: for 2026 (format change from 140z to 2*70z)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    field_code,
    field_name,
    description,
    message_type,
    language,
    section,
    display_order,
    is_required,
    true,
    field_type,
    component_type,
    placeholder,
    JSON_OBJECT(
        'required', false,
        'maxLines', 2,
        'maxLineLength', 70,
        'characterSet', 'z',
        'patternMessage', 'Máximo 2 líneas de 70 caracteres (formato actualizado SRG2026)',
        'swiftFormat', '2*70z'
    ),
    CONCAT(IFNULL(help_text, ''), ' [Formato actualizado en SRG2026: 2*70z]'),
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM swift_field_config_readmodel
WHERE field_code = ':44B:' AND message_type = 'MT700' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = ':44B:' AND s2.message_type = 'MT700' AND s2.spec_version = '2026' AND s2.language = swift_field_config_readmodel.language
);

-- Copy and update field :42C: for 2026 (format change from 3*35x to 3*35z)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type, placeholder,
    validation_rules, help_text, spec_version, effective_date, created_by, created_at
)
SELECT
    UUID(),
    field_code,
    field_name,
    description,
    message_type,
    language,
    section,
    display_order,
    is_required,
    true,
    field_type,
    component_type,
    placeholder,
    JSON_OBJECT(
        'required', false,
        'maxLines', 3,
        'maxLineLength', 35,
        'characterSet', 'z',
        'patternMessage', 'Máximo 3 líneas de 35 caracteres. Conjunto de caracteres z (SRG2026)',
        'swiftFormat', '3*35z'
    ),
    CONCAT(IFNULL(help_text, ''), ' [Formato actualizado en SRG2026: 3*35z (character set z)]'),
    '2026',
    '2026-11-15',
    'SYSTEM',
    CURRENT_TIMESTAMP
FROM swift_field_config_readmodel
WHERE field_code = ':42C:' AND message_type = 'MT700' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = ':42C:' AND s2.message_type = 'MT700' AND s2.spec_version = '2026' AND s2.language = swift_field_config_readmodel.language
);

-- ==================================================
-- SECTION 8: Summary Query
-- ==================================================

SELECT
    spec_version,
    COUNT(*) as total_fields,
    SUM(CASE WHEN deprecated_date IS NOT NULL THEN 1 ELSE 0 END) as deprecated_fields,
    SUM(CASE WHEN is_required = true THEN 1 ELSE 0 END) as mandatory_fields
FROM swift_field_config_readmodel
WHERE message_type = 'MT700'
GROUP BY spec_version
ORDER BY spec_version;

-- ==================================================
-- End of Migration V137
-- ==================================================
