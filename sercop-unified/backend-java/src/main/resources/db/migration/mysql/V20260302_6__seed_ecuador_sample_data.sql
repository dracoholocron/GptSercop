-- ============================================================================
-- V20260302_6: Datos de Ejemplo Completos para Ecuador
-- ============================================================================
-- Incluye datos realistas para todas las tablas del sistema de Compras Públicas
-- ============================================================================

-- ============================================================================
-- 1. PROCESO DE EJEMPLO: Catálogo Electrónico - Laptops para Min. Educación
-- ============================================================================

INSERT IGNORE INTO cp_process_data (id, process_id, country_code, process_type, process_code, entity_ruc, entity_name, status, form_data, version, created_at, created_by)
VALUES (
    'proc-001', 'proc-id-001', 'EC', 'CE', 'CE-MINEDUC-2026-001',
    '1760000160001', 'Ministerio de Educación',
    'APROBADO',
    '{
        "OBJETO_CONTRATACION": "Adquisición de computadores portátiles para docentes del programa de digitalización educativa",
        "CODIGO_CPC": "43211503",
        "PRESUPUESTO_REFERENCIAL": 425000.00,
        "TIPO_PROCESO": "CE",
        "RUC_ENTIDAD": "1760000160001",
        "NOMBRE_ENTIDAD": "Ministerio de Educación",
        "DIRECCION_ENTIDAD": "Av. Amazonas N34-451 y Av. Atahualpa, Quito",
        "ADMINISTRADOR_CONTRATO": "Ing. María Fernanda López",
        "ANIO_PAC": 2026,
        "NUMERO_PARTIDA": "530801-0001",
        "FECHA_APROBACION_PAC": "2026-01-15",
        "NUMERO_CDP": "CDP-2026-0145",
        "FECHA_CDP": "2026-02-10",
        "MONTO_CDP": 425000.00,
        "PARTIDA_PRESUPUESTARIA": "530801",
        "FUENTE_FINANCIAMIENTO": "Recursos Fiscales",
        "METODOLOGIA_ESTUDIO": "Catálogo Electrónico SERCOP",
        "NUMERO_PROFORMAS": 3,
        "PRECIO_REFERENCIAL_CALC": 850.00,
        "JUSTIFICACION_PRECIO": "Precio promedio de 3 proformas del portal de Catálogo Electrónico SERCOP",
        "ITEMS": [
            {"CPC_ITEM": "43211503", "DESCRIPCION_ITEM": "Laptop Core i5 14va Gen, 8GB RAM, 256GB SSD, pantalla 14 FHD", "CANTIDAD": 300, "UNIDAD": "Unidad", "PRECIO_UNITARIO": 890.00, "SUBTOTAL": 267000.00},
            {"CPC_ITEM": "43211503", "DESCRIPCION_ITEM": "Laptop Core i7 14va Gen, 16GB RAM, 512GB SSD, pantalla 15.6 FHD", "CANTIDAD": 100, "UNIDAD": "Unidad", "PRECIO_UNITARIO": 1280.00, "SUBTOTAL": 128000.00},
            {"CPC_ITEM": "43211507", "DESCRIPCION_ITEM": "Mouse inalámbrico ergonómico USB", "CANTIDAD": 400, "UNIDAD": "Unidad", "PRECIO_UNITARIO": 15.00, "SUBTOTAL": 6000.00},
            {"CPC_ITEM": "43211508", "DESCRIPCION_ITEM": "Maletín para laptop 14-15.6 pulgadas", "CANTIDAD": 400, "UNIDAD": "Unidad", "PRECIO_UNITARIO": 25.00, "SUBTOTAL": 10000.00}
        ]
    }',
    1, NOW(), 'admin'
);

-- Proceso 2: Subasta Inversa Electrónica - Papel para SRI
INSERT IGNORE INTO cp_process_data (id, process_id, country_code, process_type, process_code, entity_ruc, entity_name, status, form_data, version, created_at, created_by)
VALUES (
    'proc-002', 'proc-id-002', 'EC', 'SIE', 'SIE-SRI-2026-042',
    '1760003770001', 'Servicio de Rentas Internas',
    'PUBLICADO',
    '{
        "OBJETO_CONTRATACION": "Adquisición de resmas de papel bond A4 75g para uso institucional del SRI a nivel nacional",
        "CODIGO_CPC": "44121615",
        "PRESUPUESTO_REFERENCIAL": 175000.00,
        "TIPO_PROCESO": "SIE",
        "RUC_ENTIDAD": "1760003770001",
        "NOMBRE_ENTIDAD": "Servicio de Rentas Internas",
        "ADMINISTRADOR_CONTRATO": "Abg. Carlos Ramírez",
        "ANIO_PAC": 2026,
        "NUMERO_PARTIDA": "530802-0003",
        "NUMERO_CDP": "CDP-2026-0089",
        "FECHA_CDP": "2026-01-28",
        "MONTO_CDP": 175000.00,
        "ITEMS": [
            {"CPC_ITEM": "44121615", "DESCRIPCION_ITEM": "Resma papel bond A4 75g blanco, 500 hojas", "CANTIDAD": 50000, "UNIDAD": "Resma", "PRECIO_UNITARIO": 3.50, "SUBTOTAL": 175000.00}
        ]
    }',
    1, NOW(), 'admin'
);

-- Proceso 3: Menor Cuantía - Servicios de limpieza GAD Pichincha
INSERT IGNORE INTO cp_process_data (id, process_id, country_code, process_type, process_code, entity_ruc, entity_name, status, form_data, version, created_at, created_by)
VALUES (
    'proc-003', 'proc-id-003', 'EC', 'MC', 'MC-GADPP-2026-015',
    '1768001520001', 'GAD Provincial de Pichincha',
    'BORRADOR',
    '{
        "OBJETO_CONTRATACION": "Contratación de servicios de limpieza integral para el edificio principal del GAD Provincial de Pichincha",
        "CODIGO_CPC": "72154066",
        "PRESUPUESTO_REFERENCIAL": 54000.00,
        "TIPO_PROCESO": "MC",
        "RUC_ENTIDAD": "1768001520001",
        "NOMBRE_ENTIDAD": "GAD Provincial de Pichincha",
        "ANIO_PAC": 2026,
        "ITEMS": [
            {"CPC_ITEM": "72154066", "DESCRIPCION_ITEM": "Servicio de limpieza integral mensual, incluye insumos y personal", "CANTIDAD": 12, "UNIDAD": "Mes", "PRECIO_UNITARIO": 4500.00, "SUBTOTAL": 54000.00}
        ]
    }',
    1, NOW(), 'admin'
);

-- ============================================================================
-- 2. PAA DE EJEMPLO: Ministerio de Educación 2026
-- ============================================================================

INSERT IGNORE INTO cp_paa (id, entity_ruc, entity_name, country_code, fiscal_year, version, status, total_budget, approval_date, approved_by, created_at, created_by)
VALUES ('paa-mineduc-2026', '1760000160001', 'Ministerio de Educación', 'EC', 2026, 1, 'APROBADO', 2850000.00, '2026-01-15', 'Ministro de Educación', NOW(), 'admin');

-- Items del PAA
INSERT IGNORE INTO cp_paa_item (id, paa_id, line_number, cpc_code, cpc_description, item_description, process_type, budget_amount, budget_partition, funding_source, department, estimated_publication_date, estimated_adjudication_date, estimated_contract_duration_days, priority, status, linked_process_id) VALUES
('paa-item-001', 'paa-mineduc-2026', 1, '43211503', 'Computadores portátiles', 'Laptops para docentes programa digitalización', 'CE', 425000.00, '530801', 'Recursos Fiscales', 'Dirección Nacional de Tecnologías', '2026-02-15', '2026-03-15', 30, 'HIGH', 'EN_PROCESO', 'proc-id-001'),
('paa-item-002', 'paa-mineduc-2026', 2, '44121615', 'Papel bond', 'Resmas de papel para oficinas a nivel nacional', 'CE', 85000.00, '530802', 'Recursos Fiscales', 'Dirección Administrativa', '2026-03-01', '2026-03-20', 15, 'MEDIUM', 'PLANIFICADO', NULL),
('paa-item-003', 'paa-mineduc-2026', 3, '81112200', 'Servicios de internet', 'Internet dedicado para 200 instituciones educativas rurales', 'SIE', 960000.00, '530502', 'Recursos Fiscales', 'Dirección Nacional de Tecnologías', '2026-04-01', '2026-05-15', 365, 'HIGH', 'PLANIFICADO', NULL),
('paa-item-004', 'paa-mineduc-2026', 4, '72154066', 'Servicios de limpieza', 'Limpieza edificio principal planta central', 'MC', 72000.00, '530208', 'Recursos Fiscales', 'Dirección Administrativa', '2026-03-15', '2026-04-15', 365, 'MEDIUM', 'PLANIFICADO', NULL),
('paa-item-005', 'paa-mineduc-2026', 5, '43211503', 'Computadores portátiles', 'Laptops para personal administrativo Zona 9', 'CE', 180000.00, '530801', 'Recursos Fiscales', 'Coordinación Zonal 9', '2026-06-01', '2026-07-01', 30, 'LOW', 'PLANIFICADO', NULL),
('paa-item-006', 'paa-mineduc-2026', 6, '80111601', 'Servicios de consultoría', 'Consultoría para plan estratégico tecnológico 2027-2030', 'CDC', 350000.00, '530601', 'Recursos Fiscales', 'Dirección Nacional de Tecnologías', '2026-05-01', '2026-07-01', 180, 'MEDIUM', 'PLANIFICADO', NULL),
('paa-item-007', 'paa-mineduc-2026', 7, '43231512', 'Servidores', 'Servidores para data center educativo', 'SIE', 520000.00, '840103', 'Inversión', 'Dirección Nacional de Tecnologías', '2026-07-01', '2026-08-15', 60, 'HIGH', 'PLANIFICADO', NULL),
('paa-item-008', 'paa-mineduc-2026', 8, '55121704', 'Mobiliario escolar', 'Pupitres ergonómicos para 50 escuelas rurales', 'SIE', 258000.00, '840104', 'Inversión', 'Dirección de Infraestructura', '2026-08-01', '2026-09-15', 90, 'MEDIUM', 'PLANIFICADO', NULL);

-- PAA del SRI
INSERT IGNORE INTO cp_paa (id, entity_ruc, entity_name, country_code, fiscal_year, version, status, total_budget, approval_date, approved_by, created_at, created_by)
VALUES ('paa-sri-2026', '1760003770001', 'Servicio de Rentas Internas', 'EC', 2026, 1, 'APROBADO', 1200000.00, '2026-01-10', 'Director General del SRI', NOW(), 'admin');

INSERT IGNORE INTO cp_paa_item (id, paa_id, line_number, cpc_code, cpc_description, item_description, process_type, budget_amount, budget_partition, funding_source, department, estimated_publication_date, estimated_adjudication_date, priority, status, linked_process_id) VALUES
('paa-item-sri-001', 'paa-sri-2026', 1, '44121615', 'Papel bond', 'Papel bond A4 uso institucional nacional', 'SIE', 175000.00, '530802', 'Recursos Fiscales', 'Dirección Administrativa', '2026-02-01', '2026-03-01', 'HIGH', 'EN_PROCESO', 'proc-id-002'),
('paa-item-sri-002', 'paa-sri-2026', 2, '43211503', 'Equipos de cómputo', 'Renovación equipos de cómputo oficinas', 'CE', 450000.00, '530801', 'Recursos Fiscales', 'Dirección de Tecnología', '2026-04-01', '2026-05-01', 'HIGH', 'PLANIFICADO', NULL),
('paa-item-sri-003', 'paa-sri-2026', 3, '81112200', 'Telecomunicaciones', 'Enlaces de datos entre agencias', 'SIE', 380000.00, '530502', 'Recursos Fiscales', 'Dirección de Tecnología', '2026-05-01', '2026-06-15', 'MEDIUM', 'PLANIFICADO', NULL),
('paa-item-sri-004', 'paa-sri-2026', 4, '72154066', 'Servicios de limpieza', 'Limpieza agencias nivel nacional', 'MC', 195000.00, '530208', 'Recursos Fiscales', 'Dirección Administrativa', '2026-03-01', '2026-04-01', 'MEDIUM', 'PLANIFICADO', NULL);

-- ============================================================================
-- 3. CERTIFICACIONES PRESUPUESTARIAS
-- ============================================================================

INSERT IGNORE INTO cp_budget_certificate (id, process_id, paa_item_id, certificate_number, certificate_date, amount, budget_partition, funding_source, fiscal_year, status, created_at, created_by) VALUES
('cert-001', 'proc-id-001', 'paa-item-001', 'CDP-MINEDUC-2026-0145', '2026-02-10', 425000.00, '530801', 'Recursos Fiscales', 2026, 'APROBADO', NOW(), 'admin'),
('cert-002', 'proc-id-002', 'paa-item-sri-001', 'CDP-SRI-2026-0089', '2026-01-28', 175000.00, '530802', 'Recursos Fiscales', 2026, 'APROBADO', NOW(), 'admin'),
('cert-003', 'proc-id-003', NULL, 'CDP-GADPP-2026-0201', '2026-02-20', 54000.00, '530208', 'Recursos Fiscales', 2026, 'SOLICITADO', NOW(), 'admin');

-- Ejecuciones presupuestarias del CDP-001 (laptops - proceso adjudicado)
INSERT IGNORE INTO cp_budget_execution (id, certificate_id, execution_type, amount, execution_date, document_number) VALUES
('exec-001', 'cert-001', 'COMPROMISO', 411000.00, '2026-03-01', 'COMP-MINEDUC-2026-0145'),
('exec-002', 'cert-001', 'DEVENGADO', 267000.00, '2026-03-20', 'DEV-MINEDUC-2026-0145-1'),
('exec-003', 'cert-001', 'PAGO', 267000.00, '2026-03-25', 'PAG-MINEDUC-2026-0145-1');

-- ============================================================================
-- 4. RFI (Solicitud de Información a Proveedores)
-- ============================================================================

INSERT IGNORE INTO cp_rfi (id, process_id, title, description, cpc_code, status, publication_date, closing_date, created_at, created_by) VALUES
('rfi-001', 'proc-id-001', 'RFI - Laptops para programa de digitalización educativa',
 'Solicitud de información para adquisición de computadores portátiles. Se requieren equipos Core i5/i7 con mínimo 8GB RAM, 256GB SSD, pantalla FHD.',
 '43211503', 'CERRADO', '2026-01-20', '2026-02-05', NOW(), 'admin'),
('rfi-002', 'proc-id-002', 'RFI - Papel Bond A4 75g para SRI',
 'Solicitud de cotización para suministro de resmas de papel bond A4 75g blanco, 500 hojas por resma, entrega a nivel nacional.',
 '44121615', 'ANALIZADO', '2026-01-15', '2026-01-25', NOW(), 'admin');

-- Respuestas al RFI de Laptops
INSERT IGNORE INTO cp_rfi_response (id, rfi_id, supplier_ruc, supplier_name, unit_price, total_price, delivery_days, observations, response_date) VALUES
('rfi-resp-001', 'rfi-001', '1791234567001', 'TechStore S.A.', 870.00, 348000.00, 15, 'Disponibilidad inmediata en stock. Garantía 3 años. Incluye soporte on-site.', '2026-01-25'),
('rfi-resp-002', 'rfi-001', '1792345678001', 'CompuWorld Cia. Ltda.', 845.00, 338000.00, 20, 'Importación directa. Garantía 2 años. Precio incluye IVA.', '2026-01-28'),
('rfi-resp-003', 'rfi-001', '1793456789001', 'DigitalEc S.A.', 910.00, 364000.00, 10, 'Entrega inmediata. Garantía 3 años on-site. Capacitación incluida.', '2026-01-30'),
('rfi-resp-004', 'rfi-001', '1794567890001', 'MicroTech Ecuador', 825.00, 330000.00, 25, 'Precio especial por volumen. Garantía 2 años.', '2026-02-01');

-- Respuestas al RFI de Papel
INSERT IGNORE INTO cp_rfi_response (id, rfi_id, supplier_ruc, supplier_name, unit_price, total_price, delivery_days, observations, response_date) VALUES
('rfi-resp-005', 'rfi-002', '0990012345001', 'Papelera Nacional S.A.', 3.45, 172500.00, 5, 'Fabricante nacional. Entrega en todas las ciudades del país. Certificado FSC.', '2026-01-20'),
('rfi-resp-006', 'rfi-002', '1791122334001', 'DistPapel S.A.', 3.55, 177500.00, 7, 'Distribución garantizada a nivel nacional. Papel de alta calidad ISO 9001.', '2026-01-22'),
('rfi-resp-007', 'rfi-002', '0992233445001', 'Suministros Express Cia. Ltda.', 3.40, 170000.00, 10, 'Mejor precio por volumen mayor a 30,000 resmas. Entrega fraccionada.', '2026-01-23');

-- ============================================================================
-- 5. EVALUACIONES DE RIESGO
-- ============================================================================

-- Evaluación de riesgo para el proceso de laptops
INSERT IGNORE INTO cp_risk_assessment (id, process_id, assessment_date, overall_score, risk_level, assessor, status, created_at, created_by) VALUES
('risk-assess-001', 'proc-id-001', '2026-02-15', 28, 'MEDIUM', 'Ing. Roberto García - Auditor Interno', 'REVISADO', NOW(), 'admin');

INSERT IGNORE INTO cp_risk_item (id, assessment_id, indicator_code, probability, impact, risk_score, detected, evidence, mitigation_plan, responsible, allocation, status) VALUES
('risk-item-001', 'risk-assess-001', 'SINGLE_BIDDER', 1, 2, 2, FALSE, 'Se recibieron 4 ofertas de proveedores distintos. No aplica riesgo de oferente único.', NULL, NULL, 'ESTADO', 'IDENTIFICADO'),
('risk-item-002', 'risk-assess-001', 'IDENTICAL_PRICES', 1, 4, 4, FALSE, 'Los precios presentan variación significativa ($825-$910). No hay indicios de colusión.', NULL, NULL, 'ESTADO', 'IDENTIFICADO'),
('risk-item-003', 'risk-assess-001', 'REPEAT_WINNER', 3, 3, 9, TRUE, 'TechStore S.A. ha ganado 3 de los últimos 5 procesos de equipos de cómputo del MINEDUC. Se recomienda vigilancia.', 'Diversificar proveedores invitados. Verificar que las especificaciones no favorezcan a un proveedor específico.', 'Comisión Técnica', 'ESTADO', 'MITIGADO'),
('risk-item-004', 'risk-assess-001', 'FRACTIONING', 2, 4, 8, FALSE, 'El presupuesto de $425,000 corresponde a una sola necesidad identificada en el PAC. No hay evidencia de fraccionamiento.', NULL, NULL, 'ESTADO', 'IDENTIFICADO'),
('risk-item-005', 'risk-assess-001', 'SHORT_DEADLINE', 1, 2, 2, FALSE, 'Plazo de presentación de ofertas: 15 días. Cumple con mínimos legales para Catálogo Electrónico.', NULL, NULL, 'ESTADO', 'IDENTIFICADO'),
('risk-item-006', 'risk-assess-001', 'SPECIFIC_SPECS', 2, 3, 6, FALSE, 'Especificaciones técnicas son genéricas (Core i5/i7, 8/16GB RAM). Múltiples marcas cumplen.', NULL, NULL, 'ESTADO', 'IDENTIFICADO'),
('risk-item-007', 'risk-assess-001', 'CONFLICT_INTEREST', 1, 5, 5, FALSE, 'No se detectaron relaciones entre funcionarios del MINEDUC y representantes de los proveedores oferentes.', NULL, NULL, 'ESTADO', 'IDENTIFICADO'),
('risk-item-008', 'risk-assess-001', 'PRICE_ANOMALY', 2, 3, 6, FALSE, 'Precio referencial de $850/unidad está dentro del rango de mercado ($820-$1,150 según datos históricos SERCOP).', NULL, NULL, 'ESTADO', 'IDENTIFICADO');

-- Evaluación de riesgo para proceso de papel (con riesgos reales detectados)
INSERT IGNORE INTO cp_risk_assessment (id, process_id, assessment_date, overall_score, risk_level, assessor, status, created_at, created_by) VALUES
('risk-assess-002', 'proc-id-002', '2026-02-01', 62, 'HIGH', 'Dra. Ana Martínez - Contraloría', 'APROBADO', NOW(), 'admin');

INSERT IGNORE INTO cp_risk_item (id, assessment_id, indicator_code, probability, impact, risk_score, detected, evidence, mitigation_plan, responsible, allocation, status) VALUES
('risk-item-009', 'risk-assess-002', 'SINGLE_BIDDER', 1, 3, 3, FALSE, 'Se esperan al menos 5 proveedores calificados para papel bond.', NULL, NULL, 'ESTADO', 'IDENTIFICADO'),
('risk-item-010', 'risk-assess-002', 'IDENTICAL_PRICES', 3, 5, 15, TRUE, 'ALERTA: En los últimos 3 procesos similares del SRI, los 2 primeros oferentes presentaron precios con diferencia menor al 0.5%. Patrón sospechoso de colusión.', 'Solicitar desglose detallado de costos. Verificar independencia entre oferentes. Reportar a SERCOP si se confirma.', 'Comisión Técnica + Auditoría', 'ESTADO', 'IDENTIFICADO'),
('risk-item-011', 'risk-assess-002', 'REPEAT_WINNER', 4, 3, 12, TRUE, 'Papelera Nacional S.A. ha ganado los últimos 4 procesos consecutivos de papel del SRI desde 2024.', 'Ampliar invitación a más proveedores. Considerar división en lotes por zona geográfica.', 'Dirección de Compras', 'ESTADO', 'IDENTIFICADO'),
('risk-item-012', 'risk-assess-002', 'FRACTIONING', 4, 5, 20, TRUE, 'ALERTA CRÍTICA: Se detectaron 3 procesos de ínfima cuantía de papel en los últimos 2 meses (cada uno por $6,800). Posible fraccionamiento para evitar Subasta Inversa.', 'Consolidar todas las necesidades de papel en un solo proceso. Iniciar investigación de los 3 procesos de ínfima.', 'Auditoría Interna + SERCOP', 'ESTADO', 'IDENTIFICADO'),
('risk-item-013', 'risk-assess-002', 'PRICE_ANOMALY', 2, 3, 6, FALSE, 'Precio referencial de $3.50/resma está dentro del rango histórico ($3.40-$3.60).', NULL, NULL, 'ESTADO', 'IDENTIFICADO');

-- ============================================================================
-- 6. PRECIOS HISTÓRICOS ADICIONALES (más datos para mejores análisis)
-- ============================================================================

INSERT IGNORE INTO cp_historical_prices (cpc_code, cpc_description, item_description, unit, unit_price, quantity, total_value, process_type, entity_ruc, entity_name, supplier_ruc, supplier_name, adjudication_date, publication_date, province, canton, source, data_quality) VALUES
-- Más laptops
('43211503', 'Computadores portátiles', 'Laptop Core i5 12va Gen 8GB 256GB SSD', 'Unidad', 780.00, 200, 156000.00, 'CE', '1760000160001', 'Ministerio de Educación', '1791234567001', 'TechStore S.A.', '2024-06-15', '2024-05-20', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
('43211503', 'Computadores portátiles', 'Laptop Core i5 13va Gen 8GB 256GB SSD', 'Unidad', 810.00, 150, 121500.00, 'SIE', '1760003770001', 'SRI', '1792345678001', 'CompuWorld Cia. Ltda.', '2024-09-10', '2024-08-15', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
('43211503', 'Computadores portátiles', 'Laptop Core i7 13va Gen 16GB 512GB SSD', 'Unidad', 1180.00, 50, 59000.00, 'CE', '1760000160001', 'Ministerio de Educación', '1793456789001', 'DigitalEc S.A.', '2024-11-20', '2024-10-25', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
('43211503', 'Computadores portátiles', 'Laptop Core i5 14va Gen 8GB 256GB SSD', 'Unidad', 860.00, 100, 86000.00, 'CE', '1768001520001', 'GAD Pichincha', '1791234567001', 'TechStore S.A.', '2025-02-15', '2025-01-20', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
('43211503', 'Computadores portátiles', 'Laptop Core i5 14va Gen 16GB 512GB SSD', 'Unidad', 950.00, 80, 76000.00, 'SIE', '1760004280001', 'Contraloría General', '1794567890001', 'MicroTech Ecuador', '2025-05-10', '2025-04-15', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
-- Más papel
('44121615', 'Papel bond', 'Resma papel bond A4 75g', 'Resma', 3.48, 20000, 69600.00, 'SIE', '1760000160001', 'Min. Educación', '0990012345001', 'Papelera Nacional', '2024-07-15', '2024-06-20', 'Guayas', 'Guayaquil', 'SERCOP', 'HIGH'),
('44121615', 'Papel bond', 'Resma papel bond A4 75g', 'Resma', 3.52, 15000, 52800.00, 'CE', '1768001520001', 'GAD Pichincha', '1791122334001', 'DistPapel S.A.', '2024-10-01', '2024-09-10', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
('44121615', 'Papel bond', 'Resma papel bond A4 75g', 'Resma', 3.55, 8000, 28400.00, 'MC', '1760003770001', 'SRI', '0990012345001', 'Papelera Nacional', '2025-01-20', '2025-01-05', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
-- Medicamentos adicionales
('51471901', 'Medicamentos', 'Ibuprofeno 400mg tabletas x 100', 'Caja', 3.20, 30000, 96000.00, 'SIE', '1760000650001', 'MSP', '0991234567001', 'Laboratorios Life', '2024-05-15', '2024-04-20', 'Guayas', 'Guayaquil', 'SERCOP', 'HIGH'),
('51471901', 'Medicamentos', 'Amoxicilina 500mg cápsulas x 100', 'Caja', 4.50, 20000, 90000.00, 'SIE', '1760000650001', 'MSP', '0992345678001', 'FarmaDistrib S.A.', '2024-08-10', '2024-07-15', 'Pichincha', 'Quito', 'SERCOP', 'HIGH'),
-- Servicios de limpieza adicionales
('72154066', 'Servicios de limpieza', 'Servicio de limpieza mensual oficinas', 'Mes', 4350.00, 12, 52200.00, 'MC', '1760003770001', 'SRI', '1795678901001', 'CleanPro S.A.', '2024-06-01', '2024-05-10', 'Pichincha', 'Quito', 'SERCOP', 'MEDIUM'),
('72154066', 'Servicios de limpieza', 'Servicio de limpieza mensual', 'Mes', 4800.00, 12, 57600.00, 'MC', '1760004280001', 'Contraloría General', '1796789012001', 'ServiLimp Cia. Ltda.', '2025-01-15', '2024-12-20', 'Pichincha', 'Quito', 'SERCOP', 'MEDIUM');
