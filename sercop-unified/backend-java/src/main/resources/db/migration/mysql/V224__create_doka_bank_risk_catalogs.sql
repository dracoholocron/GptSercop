-- =====================================================
-- V224: Create DOKA Bank Risk Data Catalogs
-- These catalogs store bank-specific regulatory data
-- imported from DOKA system for risk classification
-- IDs: 21000-22000 (reserved for DOKA catalogs)
-- =====================================================

-- =====================================================
-- 1. ACCDES - Account Descriptor (Descriptor de Cuenta)
-- IDs: 21000-21010
-- =====================================================
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    21000, 'ACCDES',
    'Descriptor de Cuenta',
    'Clasificacion del tipo de cliente o cuenta para reportes regulatorios (DOKA)',
    1, NULL, NULL, NULL, 1, 1, 20, NOW(), 'system'
);

INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
(21001, 'ACCDES-C', 'Corporativo', 'Cliente corporativo o empresa', 2, 21000, 'ACCDES', 'Descriptor de Cuenta', 1, 0, 1, NOW(), 'system'),
(21002, 'ACCDES-M', 'Microempresa', 'Microempresa o pequeño negocio', 2, 21000, 'ACCDES', 'Descriptor de Cuenta', 1, 0, 2, NOW(), 'system'),
(21003, 'ACCDES-V', 'Vivienda', 'Credito de vivienda', 2, 21000, 'ACCDES', 'Descriptor de Cuenta', 1, 0, 3, NOW(), 'system'),
(21004, 'ACCDES-N', 'Persona Natural', 'Persona natural o consumo', 2, 21000, 'ACCDES', 'Descriptor de Cuenta', 1, 0, 4, NOW(), 'system'),
(21005, 'ACCDES-P', 'PYME', 'Pequena y mediana empresa', 2, 21000, 'ACCDES', 'Descriptor de Cuenta', 1, 0, 5, NOW(), 'system');

-- =====================================================
-- 2. FINDES - Financial Destination (Destino Financiero)
-- IDs: 21100-21199
-- =====================================================
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    21100, 'FINDES',
    'Destino Financiero',
    'Codigo de finalidad del credito segun normativa SBS Ecuador (DOKA)',
    1, NULL, NULL, NULL, 1, 1, 21, NOW(), 'system'
);

INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
(21101, 'FINDES-210', 'Comercio Exterior - Importaciones', 'Financiamiento de importaciones de bienes y servicios', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 1, NOW(), 'system'),
(21102, 'FINDES-220', 'Comercio Exterior - Exportaciones', 'Financiamiento de exportaciones de bienes y servicios', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 2, NOW(), 'system'),
(21103, 'FINDES-230', 'Capital de Trabajo', 'Financiamiento para capital de trabajo operativo', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 3, NOW(), 'system'),
(21104, 'FINDES-240', 'Activos Fijos', 'Adquisicion de maquinaria, equipos y activos fijos', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 4, NOW(), 'system'),
(21105, 'FINDES-250', 'Reestructuracion de Pasivos', 'Refinanciamiento o reestructuracion de deudas', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 5, NOW(), 'system'),
(21106, 'FINDES-260', 'Contingentes', 'Garantias bancarias y contingentes', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 6, NOW(), 'system'),
(21107, 'FINDES-270', 'Cartas de Credito Stand-By', 'Stand-by Letters of Credit', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 7, NOW(), 'system'),
(21108, 'FINDES-290', 'Otros Comercio Exterior', 'Otras operaciones de comercio exterior', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 8, NOW(), 'system'),
(21109, 'FINDES-300', 'Inversion', 'Proyectos de inversion', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 9, NOW(), 'system'),
(21110, 'FINDES-310', 'Construccion', 'Proyectos de construccion', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 10, NOW(), 'system'),
(21111, 'FINDES-340', 'Consumo', 'Creditos de consumo', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 11, NOW(), 'system'),
(21112, 'FINDES-350', 'Vivienda', 'Creditos hipotecarios de vivienda', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 12, NOW(), 'system'),
(21113, 'FINDES-360', 'Vehiculos', 'Financiamiento de vehiculos', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 13, NOW(), 'system'),
(21114, 'FINDES-999', 'Otros', 'Otros destinos no clasificados', 2, 21100, 'FINDES', 'Destino Financiero', 1, 0, 99, NOW(), 'system');

-- =====================================================
-- 3. SOURES - Source of Resources (Origen de Recursos)
-- IDs: 21200-21210
-- =====================================================
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    21200, 'SOURES',
    'Origen de Recursos',
    'Fuente de fondos para la operacion (DOKA)',
    1, NULL, NULL, NULL, 1, 1, 22, NOW(), 'system'
);

INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
(21201, 'SOURES-P', 'Recursos Propios', 'Financiamiento con recursos propios del banco', 2, 21200, 'SOURES', 'Origen de Recursos', 1, 0, 1, NOW(), 'system'),
(21202, 'SOURES-I', 'Recursos Internos', 'Financiamiento con recursos internos/operativos', 2, 21200, 'SOURES', 'Origen de Recursos', 1, 0, 2, NOW(), 'system'),
(21203, 'SOURES-M', 'Recursos Mixtos', 'Combinacion de fuentes propias y externas', 2, 21200, 'SOURES', 'Origen de Recursos', 1, 0, 3, NOW(), 'system'),
(21204, 'SOURES-R', 'Refinanciado', 'Operacion refinanciada o reestructurada', 2, 21200, 'SOURES', 'Origen de Recursos', 1, 0, 4, NOW(), 'system'),
(21205, 'SOURES-E', 'Recursos Externos', 'Financiamiento con recursos externos (lineas)', 2, 21200, 'SOURES', 'Origen de Recursos', 1, 0, 5, NOW(), 'system'),
(21206, 'SOURES-C', 'CFN/BDE', 'Recursos de Corporacion Financiera Nacional o Banca de Desarrollo', 2, 21200, 'SOURES', 'Origen de Recursos', 1, 0, 6, NOW(), 'system');

-- =====================================================
-- 4. CRESEC - Credit Sector (Sector de Credito)
-- IDs: 21300-21399
-- =====================================================
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    21300, 'CRESEC',
    'Sector de Credito',
    'Clasificacion del sector crediticio segun SBS Ecuador (DOKA)',
    1, NULL, NULL, NULL, 1, 1, 23, NOW(), 'system'
);

INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
(21301, 'CRESEC-100', 'Comercial Corporativo', 'Credito comercial corporativo', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 1, NOW(), 'system'),
(21302, 'CRESEC-101', 'Comercial Empresarial', 'Credito comercial empresarial', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 2, NOW(), 'system'),
(21303, 'CRESEC-102', 'Comercial PYMES', 'Credito comercial PYMES', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 3, NOW(), 'system'),
(21304, 'CRESEC-200', 'Consumo Ordinario', 'Credito de consumo ordinario', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 4, NOW(), 'system'),
(21305, 'CRESEC-201', 'Consumo Prioritario', 'Credito de consumo prioritario', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 5, NOW(), 'system'),
(21306, 'CRESEC-300', 'Inmobiliario', 'Credito inmobiliario', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 6, NOW(), 'system'),
(21307, 'CRESEC-301', 'Vivienda de Interes Publico', 'Credito para vivienda de interes publico', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 7, NOW(), 'system'),
(21308, 'CRESEC-400', 'Microempresa Minorista', 'Microempresa - subsegmento minorista', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 8, NOW(), 'system'),
(21309, 'CRESEC-401', 'Microempresa Simple', 'Microempresa - subsegmento simple', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 9, NOW(), 'system'),
(21310, 'CRESEC-402', 'Microempresa Ampliada', 'Microempresa - subsegmento ampliada', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 10, NOW(), 'system'),
(21311, 'CRESEC-500', 'Productivo Corporativo', 'Credito productivo corporativo', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 11, NOW(), 'system'),
(21312, 'CRESEC-501', 'Productivo Empresarial', 'Credito productivo empresarial', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 12, NOW(), 'system'),
(21313, 'CRESEC-502', 'Productivo PYMES', 'Credito productivo PYMES', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 13, NOW(), 'system'),
(21314, 'CRESEC-600', 'Educativo', 'Credito educativo', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 14, NOW(), 'system'),
(21315, 'CRESEC-700', 'Contingentes', 'Operaciones contingentes', 2, 21300, 'CRESEC', 'Sector de Credito', 1, 0, 15, NOW(), 'system');

-- =====================================================
-- 5. DOMFLG - Domestic Flag (Indicador Domestico)
-- IDs: 21400-21410
-- =====================================================
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    21400, 'DOMFLG',
    'Indicador Domestico',
    'Indica si la operacion es domestica o internacional (DOKA)',
    1, NULL, NULL, NULL, 1, 1, 24, NOW(), 'system'
);

INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
(21401, 'DOMFLG-X', 'Domestico', 'Operacion domestica/nacional', 2, 21400, 'DOMFLG', 'Indicador Domestico', 1, 0, 1, NOW(), 'system'),
(21402, 'DOMFLG-I', 'Internacional', 'Operacion internacional/exterior', 2, 21400, 'DOMFLG', 'Indicador Domestico', 1, 0, 2, NOW(), 'system');

-- =====================================================
-- 6. ECOACT - Economic Activity (Actividad Economica CIIU)
-- IDs: 21500-21599 (sample codes)
-- =====================================================
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    21500, 'ECOACT',
    'Actividad Economica CIIU',
    'Clasificacion Industrial Internacional Uniforme para reportes SBS (DOKA)',
    1, NULL, NULL, NULL, 1, 1, 25, NOW(), 'system'
);

INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
-- Seccion A: Agricultura
(21501, 'ECOACT-0111', 'Cultivo de cereales', 'Cultivo de trigo, maiz, arroz, cebada y otros cereales', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 1, NOW(), 'system'),
(21502, 'ECOACT-0112', 'Cultivo de arroz', 'Cultivo de arroz con cascarilla', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 2, NOW(), 'system'),
(21503, 'ECOACT-0113', 'Cultivo de legumbres', 'Cultivo de legumbres y hortalizas', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 3, NOW(), 'system'),
(21504, 'ECOACT-0121', 'Cultivo de frutas tropicales', 'Banano, platano, piña, papaya y otras frutas tropicales', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 4, NOW(), 'system'),
(21505, 'ECOACT-0130', 'Propagacion de plantas', 'Viveros y cultivo de plantulas', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 5, NOW(), 'system'),
-- Seccion B: Explotacion de minas
(21506, 'ECOACT-0510', 'Extraccion de carbon', 'Extraccion de carbon de piedra y lignito', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 10, NOW(), 'system'),
(21507, 'ECOACT-0610', 'Extraccion de petroleo', 'Extraccion de petroleo crudo', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 11, NOW(), 'system'),
(21508, 'ECOACT-0620', 'Extraccion de gas', 'Extraccion de gas natural', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 12, NOW(), 'system'),
(21509, 'ECOACT-0710', 'Extraccion minerales hierro', 'Extraccion de minerales de hierro', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 13, NOW(), 'system'),
(21510, 'ECOACT-0729', 'Extraccion otros minerales', 'Extraccion de otros minerales metaliferos', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 14, NOW(), 'system'),
-- Seccion C: Industrias manufactureras
(21511, 'ECOACT-1010', 'Procesamiento carnes', 'Procesamiento y conservacion de carnes', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 20, NOW(), 'system'),
(21512, 'ECOACT-1020', 'Procesamiento pescado', 'Procesamiento y conservacion de pescado', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 21, NOW(), 'system'),
(21513, 'ECOACT-1030', 'Procesamiento frutas', 'Procesamiento y conservacion de frutas y legumbres', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 22, NOW(), 'system'),
(21514, 'ECOACT-1040', 'Aceites y grasas', 'Elaboracion de aceites y grasas', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 23, NOW(), 'system'),
(21515, 'ECOACT-1050', 'Productos lacteos', 'Elaboracion de productos lacteos', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 24, NOW(), 'system'),
-- Seccion G: Comercio
(21516, 'ECOACT-4510', 'Venta vehiculos', 'Venta de vehiculos automotores', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 30, NOW(), 'system'),
(21517, 'ECOACT-4610', 'Comercio al por mayor', 'Intermediacion del comercio al por mayor', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 31, NOW(), 'system'),
(21518, 'ECOACT-4711', 'Comercio al por menor', 'Venta al por menor en almacenes no especializados', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 32, NOW(), 'system'),
-- Seccion H: Transporte
(21519, 'ECOACT-4911', 'Transporte ferroviario', 'Transporte de pasajeros por ferrocarril', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 40, NOW(), 'system'),
(21520, 'ECOACT-4921', 'Transporte terrestre', 'Transporte urbano y suburbano de pasajeros', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 41, NOW(), 'system'),
(21521, 'ECOACT-5011', 'Transporte maritimo', 'Transporte maritimo de pasajeros', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 42, NOW(), 'system'),
(21522, 'ECOACT-5110', 'Transporte aereo', 'Transporte de pasajeros por via aerea', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 43, NOW(), 'system'),
-- Seccion K: Actividades financieras
(21523, 'ECOACT-6411', 'Banca central', 'Banca central', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 50, NOW(), 'system'),
(21524, 'ECOACT-6419', 'Intermediacion monetaria', 'Otros tipos de intermediacion monetaria', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 51, NOW(), 'system'),
(21525, 'ECOACT-6511', 'Seguros de vida', 'Seguros de vida', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 52, NOW(), 'system'),
(21526, 'ECOACT-6512', 'Seguros generales', 'Seguros generales', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 53, NOW(), 'system'),
-- Seccion F: Construccion
(21527, 'ECOACT-4100', 'Construccion edificios', 'Construccion de edificios', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 60, NOW(), 'system'),
(21528, 'ECOACT-4210', 'Construccion carreteras', 'Construccion de carreteras y vias ferreas', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 61, NOW(), 'system'),
(21529, 'ECOACT-4220', 'Construccion proyectos', 'Construccion de proyectos de servicio publico', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 62, NOW(), 'system'),
(21530, 'ECOACT-4290', 'Otras construcciones', 'Construccion de otras obras de ingenieria civil', 2, 21500, 'ECOACT', 'Actividad Economica CIIU', 1, 0, 63, NOW(), 'system');

-- =====================================================
-- 7. CSTBCH - Branch Code (Codigo de Agencia)
-- IDs: 21600-21610
-- =====================================================
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES (
    21600, 'CSTBCH',
    'Codigo de Agencia',
    'Codigo de la agencia o sucursal que origina la operacion (DOKA) - Referencia al catalogo AGENCIAS',
    1, NULL, NULL, NULL, 1, 1, 26, NOW(), 'system'
);

INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code,
    parent_catalog_name, active, is_system, display_order, created_at, created_by
) VALUES
(21601, 'CSTBCH-REF', 'Referencia a AGENCIAS', 'Este campo debe usar los valores del catalogo AGENCIAS', 2, 21600, 'CSTBCH', 'Codigo de Agencia', 1, 0, 1, NOW(), 'system');
