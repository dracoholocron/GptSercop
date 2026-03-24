-- Fix encoding issues in CP product_type_config descriptions
-- Uses CONCAT with CHAR() for reliable Unicode character insertion

UPDATE product_type_config SET description = CONCAT('Cat', CHAR(0xC3, 0xA1 USING utf8mb4), 'logo Electr', CHAR(0xC3, 0xB3 USING utf8mb4), 'nico - Compras mediante convenio marco - Art. 44 LOSNCP')
WHERE product_type = 'CP_CATALOGO_ELECTRONICO';

UPDATE product_type_config SET description = CONCAT('Subasta Inversa Electr', CHAR(0xC3, 0xB3 USING utf8mb4), 'nica - Para bienes y servicios normalizados - Art. 47 LOSNCP')
WHERE product_type = 'CP_SUBASTA_INVERSA';

UPDATE product_type_config SET description = CONCAT('Menor Cuant', CHAR(0xC3, 0xAD USING utf8mb4), 'a - Procedimiento simplificado por montos menores - Art. 51 LOSNCP')
WHERE product_type = 'CP_MENOR_CUANTIA';

UPDATE product_type_config SET description = CONCAT('Cotizaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n - Proceso de cotizaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n - Art. 50 LOSNCP')
WHERE product_type = 'CP_COTIZACION';

UPDATE product_type_config SET description = CONCAT('Licitaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n P', CHAR(0xC3, 0xBA USING utf8mb4), 'blica - Para montos mayores - Art. 48 LOSNCP')
WHERE product_type = 'CP_LICITACION';

UPDATE product_type_config SET description = CONCAT(CHAR(0xC3, 0x8D USING utf8mb4), 'nfima Cuant', CHAR(0xC3, 0xAD USING utf8mb4), 'a - Contrataciones de menor valor - Art. 52.1 LOSNCP')
WHERE product_type = 'CP_INFIMA_CUANTIA';

UPDATE product_type_config SET description = CONCAT('R', CHAR(0xC3, 0xA9 USING utf8mb4), 'gimen Especial - Procedimientos especiales - Art. 2 LOSNCP')
WHERE product_type = 'CP_REGIMEN_ESPECIAL';

UPDATE product_type_config SET description = CONCAT('Feria Inclusiva - Participaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n de micro y peque', CHAR(0xC3, 0xB1 USING utf8mb4), 'as empresas - Art. 6 LOSNCP')
WHERE product_type = 'CP_FERIA_INCLUSIVA';

UPDATE product_type_config SET description = CONCAT('Contrataci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n Directa - Adjudicaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n directa por excepci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n - Art. 92-94 LOSNCP')
WHERE product_type = 'CONTRATACION_DIRECTA';

UPDATE product_type_config SET description = CONCAT('Consultor', CHAR(0xC3, 0xAD USING utf8mb4), 'a - Servicios de consultor', CHAR(0xC3, 0xAD USING utf8mb4), 'a general - Art. 36-40 LOSNCP')
WHERE product_type = 'CONSULTORIA';

UPDATE product_type_config SET description = CONCAT('Contrataci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n de Seguros - Art. 2 num. 14 LOSNCP')
WHERE product_type = 'CONTRATACION_SEGUROS';

UPDATE product_type_config SET description = 'Arrendamiento de Inmuebles - Art. 59 LOSNCP'
WHERE product_type = 'ARRENDAMIENTO_INMUEBLES';

UPDATE product_type_config SET description = CONCAT('Consultor', CHAR(0xC3, 0xAD USING utf8mb4), 'a Directa - Contrataci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n directa de consultor - Art. 36 LOSNCP')
WHERE product_type = 'CP_CONSULTORIA_DIRECTA';

UPDATE product_type_config SET description = CONCAT('Consultor', CHAR(0xC3, 0xAD USING utf8mb4), 'a Lista Corta - Selecci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n de lista corta - Art. 36 LOSNCP')
WHERE product_type = 'CP_CONSULTORIA_LISTA_CORTA';

UPDATE product_type_config SET description = CONCAT('Consultor', CHAR(0xC3, 0xAD USING utf8mb4), 'a Concurso P', CHAR(0xC3, 0xBA USING utf8mb4), 'blico - Concurso p', CHAR(0xC3, 0xBA USING utf8mb4), 'blico de consultor', CHAR(0xC3, 0xAD USING utf8mb4), 'a - Art. 36 LOSNCP')
WHERE product_type = 'CP_CONSULTORIA_CONCURSO';

UPDATE product_type_config SET description = CONCAT('Obra - Menor Cuant', CHAR(0xC3, 0xAD USING utf8mb4), 'a - Obras por montos menores - Art. 51 LOSNCP')
WHERE product_type = 'CP_OBRA_MENOR_CUANTIA';

UPDATE product_type_config SET description = CONCAT('Obra - Cotizaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n - Obras por cotizaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n - Art. 50 LOSNCP')
WHERE product_type = 'CP_OBRA_COTIZACION';

UPDATE product_type_config SET description = CONCAT('Obra - Licitaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n - Obras por licitaci', CHAR(0xC3, 0xB3 USING utf8mb4), 'n p', CHAR(0xC3, 0xBA USING utf8mb4), 'blica - Art. 48 LOSNCP')
WHERE product_type = 'CP_OBRA_LICITACION';
