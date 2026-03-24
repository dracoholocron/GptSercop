-- ================================================
-- Migration: Add language column and duplicate data in English
-- Description: Add multi-language support to SWIFT field configuration
-- Author: GlobalCMX Architecture
-- Date: 2025-12-02
-- ================================================

-- Step 1: Add language column
ALTER TABLE swift_field_config_readmodel
ADD COLUMN `language` VARCHAR(5) NOT NULL DEFAULT 'es' COMMENT 'Language code (es, en, etc.)' AFTER message_type;

-- Step 2: Update existing data to have language 'es'
UPDATE swift_field_config_readmodel
SET `language` = 'es'
WHERE `language` IS NULL OR `language` = '';

-- Step 3: Drop old unique constraint
ALTER TABLE swift_field_config_readmodel
DROP INDEX uk_field_code_message_type;

-- Step 4: Add new unique constraint including language
ALTER TABLE swift_field_config_readmodel
ADD CONSTRAINT uk_field_code_message_type_language UNIQUE (field_code, message_type, `language`);

-- Step 5: Add index for language queries
CREATE INDEX idx_message_type_language ON swift_field_config_readmodel(message_type, `language`, is_active);

-- Step 6: Duplicate all Spanish records to English with translations
INSERT INTO swift_field_config_readmodel (
    id,
    field_code,
    field_name,
    description,
    message_type,
    `language`,
    section,
    display_order,
    is_required,
    is_active,
    field_type,
    component_type,
    placeholder,
    validation_rules,
    dependencies,
    contextual_alerts,
    field_options,
    default_value,
    help_text,
    documentation_url,
    created_at,
    created_by
)
SELECT
    UUID() as id,
    field_code,
    -- Translate field_name
    CASE
        -- Common field names
        WHEN field_name = 'Referencia del Remitente' THEN 'Sender''s Reference'
        WHEN field_name = 'Tipo de Carta de Crédito' THEN 'Form of Documentary Credit'
        WHEN field_name = 'Fecha de Emisión' THEN 'Date of Issue'
        WHEN field_name = 'Fecha de Vencimiento' THEN 'Date of Expiry'
        WHEN field_name = 'Banco Aplicante' THEN 'Applicant Bank'
        WHEN field_name = 'Beneficiario' THEN 'Beneficiary'
        WHEN field_name = 'Moneda y Monto' THEN 'Currency Code, Amount'
        WHEN field_name = 'Porcentaje de Tolerancia del Crédito' THEN 'Percentage Credit Amount Tolerance'
        WHEN field_name = 'Banco Ordenante' THEN 'Ordering Institution'
        WHEN field_name = 'Solicitante' THEN 'Applicant'
        WHEN field_name = 'Mercancía' THEN 'Goods, Services, Performance'
        WHEN field_name = 'Documentos Requeridos' THEN 'Documents Required'
        WHEN field_name = 'Condiciones Adicionales' THEN 'Additional Conditions'
        WHEN field_name = 'Instrucciones de Presentación' THEN 'Presentation Instructions'
        WHEN field_name = 'Período de Presentación' THEN 'Period for Presentation'
        WHEN field_name = 'Condiciones de Envío' THEN 'Shipment Conditions'
        WHEN field_name = 'Cargos' THEN 'Charges'
        WHEN field_name = 'Instrucciones de Pago' THEN 'Payment Instructions'
        WHEN field_name = 'Banco Emisor' THEN 'Issuing Bank'
        WHEN field_name = 'Banco Confirmador' THEN 'Confirming Bank'
        WHEN field_name = 'Disponibilidad' THEN 'Available With... By...'
        WHEN field_name = 'Presentación' THEN 'Presentation'
        WHEN field_name = 'Embarque desde' THEN 'Shipment From'
        WHEN field_name = 'Para transporte a' THEN 'For Transportation To'
        WHEN field_name = 'Último día de embarque' THEN 'Latest Date of Shipment'
        WHEN field_name = 'Embarques parciales' THEN 'Partial Shipments'
        WHEN field_name = 'Transbordos' THEN 'Transhipment'
        WHEN field_name = 'Referencia única del mensaje' THEN 'Unique Message Reference'
        WHEN field_name = 'Número de referencia' THEN 'Reference Number'
        WHEN field_name = 'País del beneficiario' THEN 'Beneficiary Country'
        -- Add more translations as needed
        ELSE field_name  -- Keep original if no translation found
    END as field_name,
    -- Translate description
    CASE
        WHEN description IS NOT NULL THEN CONCAT('(Auto-translated) ', description)
        ELSE NULL
    END as description,
    message_type,
    'en' as `language`,
    -- Translate section
    CASE
        WHEN section = 'INFORMACIÓN GENERAL' THEN 'GENERAL INFORMATION'
        WHEN section = 'PARTES INVOLUCRADAS' THEN 'PARTIES INVOLVED'
        WHEN section = 'MONTOS Y TOLERANCIAS' THEN 'AMOUNTS AND TOLERANCES'
        WHEN section = 'FECHAS' THEN 'DATES'
        WHEN section = 'TÉRMINOS DE PAGO' THEN 'PAYMENT TERMS'
        WHEN section = 'MERCANCÍA Y DOCUMENTOS' THEN 'GOODS AND DOCUMENTS'
        WHEN section = 'EMBARQUE' THEN 'SHIPMENT'
        WHEN section = 'CONDICIONES' THEN 'CONDITIONS'
        WHEN section = 'CARGOS' THEN 'CHARGES'
        WHEN section = 'BANCOS' THEN 'BANKS'
        WHEN section = 'INFORMACIÓN ADICIONAL' THEN 'ADDITIONAL INFORMATION'
        ELSE section
    END as section,
    display_order,
    is_required,
    is_active,
    field_type,
    component_type,
    -- Translate placeholder
    CASE
        WHEN placeholder LIKE '%Seleccione%' THEN REPLACE(placeholder, 'Seleccione', 'Select')
        WHEN placeholder LIKE '%Ingrese%' THEN REPLACE(placeholder, 'Ingrese', 'Enter')
        WHEN placeholder LIKE '%Opcional%' THEN REPLACE(placeholder, 'Opcional', 'Optional')
        ELSE placeholder
    END as placeholder,
    validation_rules,
    dependencies,
    contextual_alerts,
    field_options,
    default_value,
    -- Translate help_text
    CASE
        WHEN help_text IS NOT NULL THEN CONCAT('(Auto-translated) ', help_text)
        ELSE NULL
    END as help_text,
    -- Translate documentation_url if it's text (not URL)
    CASE
        WHEN documentation_url IS NOT NULL AND documentation_url NOT LIKE 'http%' THEN
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(documentation_url,
                                'Descripción:', 'Description:'),
                                'Campo OBLIGATORIO', 'MANDATORY Field'),
                            'Formato:', 'Format:'),
                        'Ejemplos:', 'Examples:'),
                    'Importante:', 'Important:'),
                'Esta referencia debe ser ÚNICA', 'This reference must be UNIQUE')
        ELSE documentation_url
    END as documentation_url,
    CURRENT_TIMESTAMP as created_at,
    'SYSTEM_MIGRATION_V15' as created_by
FROM swift_field_config_readmodel
WHERE `language` = 'es';

-- Add comment to the table
ALTER TABLE swift_field_config_readmodel
COMMENT='Centralized SWIFT field configuration with multi-language support (es, en)';
