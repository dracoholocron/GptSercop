-- ================================================
-- V255: Fix Collections (MT4xx) section names
-- Description: V219 missed ADICIONAL -> ADDITIONAL mapping
-- This caused "No fields configured for this section" in Collections wizard
-- ================================================

-- Fix ADICIONAL -> ADDITIONAL (missed in V219)
UPDATE swift_field_config_readmodel SET section = 'ADDITIONAL' WHERE section = 'ADICIONAL';

-- Safety: also fix any remaining Spanish section names that might have been missed
UPDATE swift_field_config_readmodel SET section = 'BASIC' WHERE section = 'BASICA';
UPDATE swift_field_config_readmodel SET section = 'PARTIES' WHERE section = 'PARTES';
UPDATE swift_field_config_readmodel SET section = 'AMOUNTS' WHERE section = 'MONTOS';
UPDATE swift_field_config_readmodel SET section = 'DATES' WHERE section = 'FECHAS';
