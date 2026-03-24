-- ================================================
-- V219: Fix SWIFT Field Sections to match swift_section_config
-- Description: Corrects section names to match the codes in swift_section_config table
-- Author: GlobalCMX Architecture
-- Date: 2026-01-31
-- ================================================

-- V218 incorrectly used Spanish names (BASICA, PARTES, etc.)
-- swift_section_config uses English codes (BASIC, PARTIES, etc.)
-- This migration fixes the mismatch

-- BASICA -> BASIC
UPDATE swift_field_config_readmodel SET section = 'BASIC' WHERE section = 'BASICA';

-- PARTES -> PARTIES
UPDATE swift_field_config_readmodel SET section = 'PARTIES' WHERE section = 'PARTES';

-- MONTOS -> AMOUNTS
UPDATE swift_field_config_readmodel SET section = 'AMOUNTS' WHERE section = 'MONTOS';

-- FECHAS -> DATES
UPDATE swift_field_config_readmodel SET section = 'DATES' WHERE section = 'FECHAS';

-- BANCOS -> BANKS
UPDATE swift_field_config_readmodel SET section = 'BANKS' WHERE section = 'BANCOS';

-- TRANSPORTE -> TRANSPORT
UPDATE swift_field_config_readmodel SET section = 'TRANSPORT' WHERE section = 'TRANSPORTE';

-- DOCUMENTOS -> DOCUMENTS
UPDATE swift_field_config_readmodel SET section = 'DOCUMENTS' WHERE section = 'DOCUMENTOS';

-- CONDICIONES -> CONDITIONS
UPDATE swift_field_config_readmodel SET section = 'CONDITIONS' WHERE section = 'CONDICIONES';

-- INSTRUCCIONES -> INSTRUCTIONS
UPDATE swift_field_config_readmodel SET section = 'INSTRUCTIONS' WHERE section = 'INSTRUCCIONES';

-- Log summary
SELECT
    section,
    COUNT(*) as field_count
FROM swift_field_config_readmodel
WHERE section IN ('BASIC', 'PARTIES', 'AMOUNTS', 'DATES', 'BANKS', 'TRANSPORT', 'DOCUMENTS', 'CONDITIONS', 'INSTRUCTIONS')
GROUP BY section
ORDER BY section;
