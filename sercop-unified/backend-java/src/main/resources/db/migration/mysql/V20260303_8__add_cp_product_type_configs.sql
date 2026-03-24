-- ============================================================================
-- Consolidar tipos de proceso de Compras Públicas en product_type_config
-- Centraliza los 18 operation_types CP existentes en event_type_config_readmodel
-- como registros en product_type_config con category = 'COMPRAS_PUBLICAS'
-- ============================================================================

-- Ampliar swift_message_type para soportar NULL sin restricción de tamaño
-- (algunos product types no usan SWIFT)

INSERT INTO product_type_config
  (product_type, base_url, wizard_url, view_mode_title_key, description, swift_message_type, category, display_order)
VALUES
-- Bienes y Servicios Normalizados
('CP_CATALOGO_ELECTRONICO', '/cp/procesos', '/cp/nuevo/CP_CATALOGO_ELECTRONICO',
 'cp.processType.catalogoElectronico', 'Catálogo Electrónico - Compras mediante convenio marco - Art. 44 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 100),

('CP_SUBASTA_INVERSA', '/cp/procesos', '/cp/nuevo/CP_SUBASTA_INVERSA',
 'cp.processType.subastaInversa', 'Subasta Inversa Electrónica - Para bienes y servicios normalizados - Art. 47 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 101),

('CP_MENOR_CUANTIA', '/cp/procesos', '/cp/nuevo/CP_MENOR_CUANTIA',
 'cp.processType.menorCuantia', 'Menor Cuantía - Procedimiento simplificado por montos menores - Art. 51 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 102),

('CP_COTIZACION', '/cp/procesos', '/cp/nuevo/CP_COTIZACION',
 'cp.processType.cotizacion', 'Cotización - Proceso de cotización - Art. 50 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 103),

('CP_LICITACION', '/cp/procesos', '/cp/nuevo/CP_LICITACION',
 'cp.processType.licitacion', 'Licitación Pública - Para montos mayores - Art. 48 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 104),

('CP_INFIMA_CUANTIA', '/cp/procesos', '/cp/nuevo/CP_INFIMA_CUANTIA',
 'cp.processType.infimaCuantia', 'Ínfima Cuantía - Contrataciones de menor valor - Art. 52.1 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 105),

('CP_REGIMEN_ESPECIAL', '/cp/procesos', '/cp/nuevo/CP_REGIMEN_ESPECIAL',
 'cp.processType.regimenEspecial', 'Régimen Especial - Procedimientos especiales - Art. 2 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 106),

('CP_FERIA_INCLUSIVA', '/cp/procesos', '/cp/nuevo/CP_FERIA_INCLUSIVA',
 'cp.processType.feriaInclusiva', 'Feria Inclusiva - Participación de micro y pequeñas empresas - Art. 6 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 107),

-- Contratación Directa y Especial
('CONTRATACION_DIRECTA', '/cp/procesos', '/cp/nuevo/CONTRATACION_DIRECTA',
 'cp.processType.contratacionDirecta', 'Contratación Directa - Adjudicación directa por excepción - Art. 92-94 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 110),

('CONSULTORIA', '/cp/procesos', '/cp/nuevo/CONSULTORIA',
 'cp.processType.consultoria', 'Consultoría - Servicios de consultoría general - Art. 36-40 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 111),

('CONTRATACION_SEGUROS', '/cp/procesos', '/cp/nuevo/CONTRATACION_SEGUROS',
 'cp.processType.contratacionSeguros', 'Contratación de Seguros - Art. 2 num. 14 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 112),

('ARRENDAMIENTO_INMUEBLES', '/cp/procesos', '/cp/nuevo/ARRENDAMIENTO_INMUEBLES',
 'cp.processType.arrendamientoInmuebles', 'Arrendamiento de Inmuebles - Art. 59 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 113),

-- Consultoría (subtipos)
('CP_CONSULTORIA_DIRECTA', '/cp/procesos', '/cp/nuevo/CP_CONSULTORIA_DIRECTA',
 'cp.processType.consultoriaDirecta', 'Consultoría Directa - Contratación directa de consultor - Art. 36 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 120),

('CP_CONSULTORIA_LISTA_CORTA', '/cp/procesos', '/cp/nuevo/CP_CONSULTORIA_LISTA_CORTA',
 'cp.processType.consultoriaListaCorta', 'Consultoría Lista Corta - Selección de lista corta - Art. 36 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 121),

('CP_CONSULTORIA_CONCURSO', '/cp/procesos', '/cp/nuevo/CP_CONSULTORIA_CONCURSO',
 'cp.processType.consultoriaConcurso', 'Consultoría Concurso Público - Concurso público de consultoría - Art. 36 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 122),

-- Obras
('CP_OBRA_MENOR_CUANTIA', '/cp/procesos', '/cp/nuevo/CP_OBRA_MENOR_CUANTIA',
 'cp.processType.obraMenorCuantia', 'Obra - Menor Cuantía - Obras por montos menores - Art. 51 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 130),

('CP_OBRA_COTIZACION', '/cp/procesos', '/cp/nuevo/CP_OBRA_COTIZACION',
 'cp.processType.obraCotizacion', 'Obra - Cotización - Obras por cotización - Art. 50 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 131),

('CP_OBRA_LICITACION', '/cp/procesos', '/cp/nuevo/CP_OBRA_LICITACION',
 'cp.processType.obraLicitacion', 'Obra - Licitación - Obras por licitación pública - Art. 48 LOSNCP',
 NULL, 'COMPRAS_PUBLICAS', 132)
ON DUPLICATE KEY UPDATE
  base_url = VALUES(base_url),
  wizard_url = VALUES(wizard_url),
  view_mode_title_key = VALUES(view_mode_title_key),
  description = VALUES(description),
  category = VALUES(category),
  display_order = VALUES(display_order);
