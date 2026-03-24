-- ================================================
-- V218: Normalize SWIFT Field Sections
-- Description: Ensures all fields with the same code have the same section
-- Author: GlobalCMX Architecture
-- Date: 2026-01-31
-- ================================================

-- Normalize sections based on most common usage and SWIFT standards

-- Reference fields -> BASICA
UPDATE swift_field_config_readmodel SET section = 'BASICA' WHERE field_code = ':20:';
UPDATE swift_field_config_readmodel SET section = 'BASICA' WHERE field_code = ':21:';
UPDATE swift_field_config_readmodel SET section = 'BASICA' WHERE field_code = ':23:';
UPDATE swift_field_config_readmodel SET section = 'BASICA' WHERE field_code = ':25:';
UPDATE swift_field_config_readmodel SET section = 'BASICA' WHERE field_code = ':27:';

-- Date fields -> FECHAS
UPDATE swift_field_config_readmodel SET section = 'FECHAS' WHERE field_code = ':30:';
UPDATE swift_field_config_readmodel SET section = 'FECHAS' WHERE field_code = ':31C:';
UPDATE swift_field_config_readmodel SET section = 'FECHAS' WHERE field_code = ':31D:';
UPDATE swift_field_config_readmodel SET section = 'FECHAS' WHERE field_code = ':31E:';
UPDATE swift_field_config_readmodel SET section = 'FECHAS' WHERE field_code = ':33a:';

-- Amount fields -> MONTOS
UPDATE swift_field_config_readmodel SET section = 'MONTOS' WHERE field_code = ':32B:';
UPDATE swift_field_config_readmodel SET section = 'MONTOS' WHERE field_code = ':32a:';
UPDATE swift_field_config_readmodel SET section = 'MONTOS' WHERE field_code = ':33B:';
UPDATE swift_field_config_readmodel SET section = 'MONTOS' WHERE field_code = ':39A:';
UPDATE swift_field_config_readmodel SET section = 'MONTOS' WHERE field_code = ':39C:';

-- Form of credit / LC type -> BASICA
UPDATE swift_field_config_readmodel SET section = 'BASICA' WHERE field_code = ':40A:';
UPDATE swift_field_config_readmodel SET section = 'BASICA' WHERE field_code = ':40E:';

-- Available with / Payment terms -> CONDICIONES
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':41a:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':42C:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':42M:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':42P:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':42a:';

-- Partial/Transshipment -> CONDICIONES
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':43P:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':43T:';

-- Transport fields -> TRANSPORTE
UPDATE swift_field_config_readmodel SET section = 'TRANSPORTE' WHERE field_code = ':44A:';
UPDATE swift_field_config_readmodel SET section = 'TRANSPORTE' WHERE field_code = ':44B:';
UPDATE swift_field_config_readmodel SET section = 'TRANSPORTE' WHERE field_code = ':44C:';
UPDATE swift_field_config_readmodel SET section = 'TRANSPORTE' WHERE field_code = ':44D:';
UPDATE swift_field_config_readmodel SET section = 'TRANSPORTE' WHERE field_code = ':44E:';
UPDATE swift_field_config_readmodel SET section = 'TRANSPORTE' WHERE field_code = ':44F:';
UPDATE swift_field_config_readmodel SET section = 'TRANSPORTE' WHERE field_code = ':44I:';

-- Goods/Documents -> DOCUMENTOS
UPDATE swift_field_config_readmodel SET section = 'DOCUMENTOS' WHERE field_code = ':45A:';
UPDATE swift_field_config_readmodel SET section = 'DOCUMENTOS' WHERE field_code = ':45H:';
UPDATE swift_field_config_readmodel SET section = 'DOCUMENTOS' WHERE field_code = ':46A:';
UPDATE swift_field_config_readmodel SET section = 'DOCUMENTOS' WHERE field_code = ':47A:';

-- Periods -> CONDICIONES
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':48:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':49:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':49G:';
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':49H:';

-- Parties -> PARTES
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':50:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':50N:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':50P:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':50R:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':50S:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':50T:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':59:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':59N:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':59P:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':59R:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':59S:';
UPDATE swift_field_config_readmodel SET section = 'PARTES' WHERE field_code = ':59T:';

-- Banks -> BANCOS
UPDATE swift_field_config_readmodel SET section = 'BANCOS' WHERE field_code = ':51a:';
UPDATE swift_field_config_readmodel SET section = 'BANCOS' WHERE field_code = ':52a:';
UPDATE swift_field_config_readmodel SET section = 'BANCOS' WHERE field_code = ':53a:';
UPDATE swift_field_config_readmodel SET section = 'BANCOS' WHERE field_code = ':57a:';
UPDATE swift_field_config_readmodel SET section = 'BANCOS' WHERE field_code = ':58a:';

-- Charges -> CONDICIONES
UPDATE swift_field_config_readmodel SET section = 'CONDICIONES' WHERE field_code = ':71D:';

-- Additional info -> INSTRUCCIONES
UPDATE swift_field_config_readmodel SET section = 'INSTRUCCIONES' WHERE field_code = ':72:';
UPDATE swift_field_config_readmodel SET section = 'INSTRUCCIONES' WHERE field_code = ':72Z:';
UPDATE swift_field_config_readmodel SET section = 'INSTRUCCIONES' WHERE field_code = ':77A:';
UPDATE swift_field_config_readmodel SET section = 'INSTRUCCIONES' WHERE field_code = ':78:';
UPDATE swift_field_config_readmodel SET section = 'INSTRUCCIONES' WHERE field_code = ':78K:';

-- Log summary
SELECT CONCAT('Normalized sections for ', COUNT(DISTINCT field_code), ' field codes') AS migration_summary
FROM swift_field_config_readmodel
WHERE field_code IN (':20:', ':21:', ':23:', ':25:', ':27:', ':30:', ':31C:', ':31D:', ':31E:', ':32B:', ':32a:', ':33B:', ':33a:', ':39A:', ':39C:', ':40A:', ':40E:', ':41a:', ':42C:', ':42M:', ':42P:', ':42a:', ':43P:', ':43T:', ':44A:', ':44B:', ':44C:', ':44D:', ':44E:', ':44F:', ':44I:', ':45A:', ':45H:', ':46A:', ':47A:', ':48:', ':49:', ':49G:', ':49H:', ':50:', ':50N:', ':50P:', ':50R:', ':50S:', ':50T:', ':51a:', ':52a:', ':53a:', ':57a:', ':58a:', ':59:', ':59N:', ':59P:', ':59R:', ':59S:', ':59T:', ':71D:', ':72:', ':72Z:', ':77A:', ':78:', ':78K:');
