-- =====================================================
-- V148: Standardize all SWIFT section codes to English
-- =====================================================
-- Updates section codes from Spanish to English across all message types
-- for consistency and maintainability
-- =====================================================

-- BASICA -> BASIC
UPDATE swift_field_config_readmodel SET section = 'BASIC' WHERE section = 'BASICA';

-- MONTOS -> AMOUNTS
UPDATE swift_field_config_readmodel SET section = 'AMOUNTS' WHERE section = 'MONTOS';

-- FECHAS -> DATES
UPDATE swift_field_config_readmodel SET section = 'DATES' WHERE section = 'FECHAS';

-- BANCOS -> BANKS
UPDATE swift_field_config_readmodel SET section = 'BANKS' WHERE section = 'BANCOS';

-- PARTES -> PARTIES
UPDATE swift_field_config_readmodel SET section = 'PARTIES' WHERE section = 'PARTES';

-- CONDICIONES -> CONDITIONS
UPDATE swift_field_config_readmodel SET section = 'CONDITIONS' WHERE section = 'CONDICIONES';

-- DOCUMENTOS -> DOCUMENTS
UPDATE swift_field_config_readmodel SET section = 'DOCUMENTS' WHERE section = 'DOCUMENTOS';

-- TRANSPORTE -> TRANSPORT
UPDATE swift_field_config_readmodel SET section = 'TRANSPORT' WHERE section = 'TRANSPORTE';

-- MERCANCIAS -> GOODS
UPDATE swift_field_config_readmodel SET section = 'GOODS' WHERE section = 'MERCANCIAS';

-- TERMINOS -> TERMS
UPDATE swift_field_config_readmodel SET section = 'TERMS' WHERE section = 'TERMINOS';

-- INSTRUCCIONES -> INSTRUCTIONS
UPDATE swift_field_config_readmodel SET section = 'INSTRUCTIONS' WHERE section = 'INSTRUCCIONES';

-- ADICIONAL -> ADDITIONAL
UPDATE swift_field_config_readmodel SET section = 'ADDITIONAL' WHERE section = 'ADICIONAL';

-- PARTICIPANTES -> PARTICIPANTS
UPDATE swift_field_config_readmodel SET section = 'PARTICIPANTS' WHERE section = 'PARTICIPANTES';

-- REFERENCIAS -> REFERENCES
UPDATE swift_field_config_readmodel SET section = 'REFERENCES' WHERE section = 'REFERENCIAS';

-- GENERAL stays as GENERAL (already in English)
-- AMENDMENT_DETAILS stays as is (already in English)
