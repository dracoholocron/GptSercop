-- ============================================================================
-- V20260305_8: Demo data - Ministerio de Salud Publica del Ecuador
-- Workspace PAA 2026 con 5 departamentos realistas, datos completos
-- para demostracion del sistema de edicion inline y visualizacion
-- ============================================================================

-- 1. Workspace: Ministerio de Salud Publica
INSERT INTO cp_paa_workspace (workspace_code, entity_ruc, entity_name, fiscal_year, sector_code, total_budget, coordinator_user_id, coordinator_user_name, status, created_at)
VALUES (
  'PAA-2026-176320',
  '1760013210001',
  'Ministerio de Salud Publica del Ecuador',
  2026,
  'SALUD',
  85000000.00,
  'admin',
  'Dr. Carlos Mendoza - Coordinador PAA',
  'ABIERTO',
  NOW()
);

SET @ws_id = LAST_INSERT_ID();

-- ============================================================================
-- 2. Departamentos (5 subsecretarias/direcciones reales del MSP)
-- ============================================================================

-- 2a. Subsecretaria de Provision de Servicios de Salud
INSERT INTO cp_paa_department_plan (
  workspace_id, department_name, department_code, assigned_user_id, assigned_user_name,
  department_budget, current_phase, total_phases, status, phase_data, items_data,
  items_count, items_total_budget, submitted_at, created_at
) VALUES (
  @ws_id,
  'Subsecretaria de Provision de Servicios de Salud',
  'SPSS',
  'admin',
  'Dra. Maria Elena Paredes',
  35000000.00,
  7, 7,
  'ENVIADO',
  JSON_OBJECT(
    'fase1', JSON_OBJECT(
      'needs', 'La Subsecretaria de Provision de Servicios de Salud requiere garantizar el abastecimiento continuo de medicamentos esenciales, dispositivos medicos, equipamiento hospitalario y servicios de mantenimiento para la red publica de salud.\n\nPrioridades criticas:\n- Medicamentos del Cuadro Nacional de Medicamentos Basicos (CNMB)\n- Insumos medicos para hospitales de segundo y tercer nivel\n- Equipamiento de imagenologia y laboratorio clinico\n- Servicios de mantenimiento preventivo y correctivo de equipos medicos\n- Reactivos de laboratorio para diagnostico',
      'enrichedNeeds', '1 | 33631000 | Medicamentos esenciales del CNMB - Antibioticos, analgesicos, antihipertensivos | B | Comun | Subasta Inversa Electronica | 500000 | Unidades | $2.50 | $1,250,000.00 | SPSS | Q1-Q4\n2 | 33140000 | Dispositivos medicos - jeringas, cateteres, guantes quirurgicos | B | Comun | Subasta Inversa Electronica | 2000000 | Unidades | $0.85 | $1,700,000.00 | SPSS | Q1-Q4\n3 | 33111000 | Equipo de imagenologia - tomografo, resonancia magnetica | B | Comun | Licitacion | 5 | Equipos | $450,000.00 | $2,250,000.00 | SPSS | Q1-Q2\n4 | 33124000 | Equipos de laboratorio clinico automatizado | B | Comun | Cotizacion | 15 | Equipos | $85,000.00 | $1,275,000.00 | SPSS | Q1-Q2\n5 | 50421000 | Mantenimiento preventivo de equipos medicos hospitalarios | S | Comun | Menor Cuantia | 12 | Contratos | $45,000.00 | $540,000.00 | SPSS | Q1-Q4\n6 | 33696000 | Reactivos de laboratorio para diagnostico clinico | B | Comun | Subasta Inversa Electronica | 100000 | Kits | $15.00 | $1,500,000.00 | SPSS | Q1-Q4\n\nITEMS ADICIONALES RECOMENDADOS:\n- Equipos de proteccion personal (EPP)\n- Material de sutura quirurgica\n- Oxigeno medicinal\n\nRESUMEN: 6 items principales por $8,515,000.00',
      'entityName', 'Ministerio de Salud Publica del Ecuador',
      'entityRuc', '1760013210001',
      'priorities', 'CRITICA: Medicamentos esenciales - desabastecimiento afecta directamente a pacientes\nALTA: Dispositivos medicos - continuidad operativa de hospitales\nALTA: Equipamiento de imagenologia - listas de espera de pacientes\nMEDIA: Mantenimiento preventivo - evitar danios mayores\nMEDIA: Reactivos de laboratorio - diagnostico oportuno',
      'timeline', 'Q1 2026: Inicio procesos de Subasta Inversa para medicamentos e insumos (procesos precontractuales Ene-Feb, adjudicacion Mar)\nQ1-Q2 2026: Licitacion para equipos de imagenologia (preparacion pliegos Ene, convocatoria Feb, evaluacion Mar, adjudicacion Abr)\nQ2 2026: Cotizacion para equipos de laboratorio\nQ1-Q4 2026: Contratos de mantenimiento con entregas mensuales\nQ3-Q4 2026: Procesos complementarios y reformas al PAA si requerido',
      'missionSummary', 'El MSP tiene como mision ejercer la rectoria, regulacion, planificacion, coordinacion, control y gestion de la Salud Publica ecuatoriana. Las contrataciones de esta subsecretaria se alinean directamente con el objetivo de garantizar el acceso universal a servicios de salud con calidad, calidez y eficiencia, conforme al Art. 32 de la Constitucion.'
    ),
    'fase2', 'MARCO_PRESUPUESTARIO',
    'fase3', 'LEVANTAMIENTO_NECESIDADES',
    'fase4', 'INTELIGENCIA_MERCADO',
    'fase5', 'CONSOLIDACION_CATEGORIAS',
    'fase6', 'ESTRATEGIA_CONTRATACION',
    'fase7', 'CALENDARIZACION_VALIDACION'
  ),
  JSON_OBJECT('examples', JSON_ARRAY(
    JSON_OBJECT('cpcCode', '33631000', 'description', 'Medicamentos esenciales del CNMB - Antibioticos, analgesicos, antihipertensivos, antiinflamatorios', 'processType', 'Bien', 'procedure', 'Subasta Inversa Electronica', 'quantity', 500000, 'unitCost', 2.50, 'budgetAmount', 1250000, 'period', 'Q1-Q4 2026', 'cpcDescription', 'Productos farmaceuticos'),
    JSON_OBJECT('cpcCode', '33140000', 'description', 'Dispositivos medicos desechables - jeringas, cateteres, guantes quirurgicos, mascarillas', 'processType', 'Bien', 'procedure', 'Subasta Inversa Electronica', 'quantity', 2000000, 'unitCost', 0.85, 'budgetAmount', 1700000, 'period', 'Q1-Q4 2026', 'cpcDescription', 'Dispositivos medicos'),
    JSON_OBJECT('cpcCode', '33111000', 'description', 'Equipo de imagenologia - Tomografo computarizado 128 cortes y Resonancia Magnetica 1.5T', 'processType', 'Bien', 'procedure', 'Licitacion', 'quantity', 5, 'unitCost', 450000, 'budgetAmount', 2250000, 'period', 'Q1-Q2 2026', 'cpcDescription', 'Equipos de imagenologia medica'),
    JSON_OBJECT('cpcCode', '33124000', 'description', 'Equipos de laboratorio clinico - Analizadores hematologicos y bioquimicos automatizados', 'processType', 'Bien', 'procedure', 'Cotizacion', 'quantity', 15, 'unitCost', 85000, 'budgetAmount', 1275000, 'period', 'Q1-Q2 2026', 'cpcDescription', 'Equipos de laboratorio'),
    JSON_OBJECT('cpcCode', '50421000', 'description', 'Servicio de mantenimiento preventivo y correctivo de equipos medicos hospitalarios', 'processType', 'Servicio', 'procedure', 'Menor Cuantia', 'quantity', 12, 'unitCost', 45000, 'budgetAmount', 540000, 'period', 'Q1-Q4 2026', 'cpcDescription', 'Mantenimiento de equipos medicos'),
    JSON_OBJECT('cpcCode', '33696000', 'description', 'Reactivos de laboratorio para diagnostico clinico - hematologia, bioquimica, inmunologia', 'processType', 'Bien', 'procedure', 'Subasta Inversa Electronica', 'quantity', 100000, 'unitCost', 15.00, 'budgetAmount', 1500000, 'period', 'Q1-Q4 2026', 'cpcDescription', 'Reactivos de diagnostico'),
    JSON_OBJECT('cpcCode', '33171000', 'description', 'Equipos de proteccion personal - batas, gorros, protectores faciales para personal medico', 'processType', 'Bien', 'procedure', 'Catalogo Electronico', 'quantity', 500000, 'unitCost', 1.20, 'budgetAmount', 600000, 'period', 'Q1-Q4 2026', 'cpcDescription', 'EPP medico'),
    JSON_OBJECT('cpcCode', '33141000', 'description', 'Material de sutura quirurgica - seda, nylon, poliglactina, catgut cromico', 'processType', 'Bien', 'procedure', 'Subasta Inversa Electronica', 'quantity', 50000, 'unitCost', 8.50, 'budgetAmount', 425000, 'period', 'Q1-Q4 2026', 'cpcDescription', 'Material de sutura')
  )),
  8,
  9540000.00,
  NOW(),
  NOW()
);

-- 2b. Direccion Nacional de Tecnologias de la Informacion y Comunicaciones (TIC)
INSERT INTO cp_paa_department_plan (
  workspace_id, department_name, department_code, assigned_user_id, assigned_user_name,
  department_budget, current_phase, total_phases, status, phase_data, items_data,
  items_count, items_total_budget, submitted_at, created_at
) VALUES (
  @ws_id,
  'Direccion Nacional de Tecnologias de la Informacion (TIC)',
  'DNTIC',
  'admin',
  'Ing. Roberto Aguirre Suarez',
  12000000.00,
  7, 7,
  'ENVIADO',
  JSON_OBJECT(
    'fase1', JSON_OBJECT(
      'needs', 'La Direccion Nacional de TIC requiere modernizar la infraestructura tecnologica del MSP, incluyendo servidores, redes, licenciamiento de software, desarrollo de sistemas de informacion en salud y servicios de conectividad para hospitales y centros de salud a nivel nacional.\n\nNecesidades criticas:\n- Renovacion de servidores de data center principal y respaldo\n- Licencias de software institucional (Microsoft, Oracle, antivirus)\n- Desarrollo del Sistema Integrado de Salud (SIS) - Historia Clinica Electronica\n- Conectividad de fibra optica para 150 establecimientos de salud\n- Equipos de computo para personal administrativo y medico',
      'enrichedNeeds', '1 | 45233000 | Servidores blade para data center - HP/Dell PowerEdge con redundancia | B | Comun | Cotizacion | 20 | Equipos | $35,000.00 | $700,000.00 | DNTIC | Q1\n2 | 48900000 | Licencias Microsoft 365 E3 y Windows Server 2025 | B | Comun | Catalogo Electronico | 5000 | Licencias | $180.00 | $900,000.00 | DNTIC | Q1\n3 | 72212000 | Desarrollo Sistema Integrado de Salud - Historia Clinica Electronica | C | Comun | Concurso Publico | 1 | Proyecto | $2,800,000.00 | $2,800,000.00 | DNTIC | Q1-Q4\n4 | 64210000 | Servicio de conectividad fibra optica para establecimientos de salud | S | Comun | Licitacion | 150 | Enlaces | $8,000.00 | $1,200,000.00 | DNTIC | Q1-Q4\n5 | 30213000 | Computadoras de escritorio y laptops para personal MSP | B | Comun | Subasta Inversa Electronica | 500 | Equipos | $950.00 | $475,000.00 | DNTIC | Q1-Q2\n6 | 48761000 | Software antivirus y ciberseguridad endpoint | B | Comun | Catalogo Electronico | 5000 | Licencias | $45.00 | $225,000.00 | DNTIC | Q1\n\nRESUMEN: 6 items por $6,300,000.00',
      'entityName', 'Ministerio de Salud Publica del Ecuador',
      'entityRuc', '1760013210001',
      'priorities', 'CRITICA: Sistema de Historia Clinica Electronica - mandato presidencial\nCRITICA: Conectividad de establecimientos - telemedecina\nALTA: Renovacion de servidores - riesgo de falla\nMEDIA: Licenciamiento - cumplimiento normativo\nMEDIA: Equipos de computo - productividad',
      'timeline', 'Q1 2026: Procesos de Catalogo Electronico para licencias y antivirus (inmediato)\nQ1 2026: Inicio Cotizacion servidores (Ene-Mar)\nQ1-Q2 2026: Concurso Publico para desarrollo SIS (prep. TDR Ene, convocatoria Feb, evaluacion Mar-Abr)\nQ2 2026: Subasta Inversa para equipos de computo\nQ1-Q4 2026: Contrato de conectividad con entregas progresivas',
      'missionSummary', 'La Direccion de TIC soporta la transformacion digital del MSP, habilitando servicios de salud electronica, telemedicina, interoperabilidad de sistemas y gestion de datos de salud publica. Las contrataciones se alinean con la Agenda Digital Ecuador 2026 y la Estrategia Nacional de Salud Electronica.'
    ),
    'fase2', 'MARCO_PRESUPUESTARIO',
    'fase3', 'LEVANTAMIENTO_NECESIDADES',
    'fase4', 'INTELIGENCIA_MERCADO',
    'fase5', 'CONSOLIDACION_CATEGORIAS',
    'fase6', 'ESTRATEGIA_CONTRATACION',
    'fase7', 'CALENDARIZACION_VALIDACION'
  ),
  JSON_OBJECT('examples', JSON_ARRAY(
    JSON_OBJECT('cpcCode', '45233000', 'description', 'Servidores blade para data center - HP ProLiant/Dell PowerEdge con redundancia N+1', 'processType', 'Bien', 'procedure', 'Cotizacion', 'quantity', 20, 'unitCost', 35000, 'budgetAmount', 700000, 'period', 'Q1 2026'),
    JSON_OBJECT('cpcCode', '48900000', 'description', 'Licencias Microsoft 365 E3 y Windows Server 2025 para 5000 usuarios', 'processType', 'Bien', 'procedure', 'Catalogo Electronico', 'quantity', 5000, 'unitCost', 180, 'budgetAmount', 900000, 'period', 'Q1 2026'),
    JSON_OBJECT('cpcCode', '72212000', 'description', 'Desarrollo e implementacion del Sistema Integrado de Salud - Historia Clinica Electronica', 'processType', 'Consultoria', 'procedure', 'Concurso Publico', 'quantity', 1, 'unitCost', 2800000, 'budgetAmount', 2800000, 'period', 'Q1-Q4 2026'),
    JSON_OBJECT('cpcCode', '64210000', 'description', 'Servicio de conectividad fibra optica para 150 establecimientos de salud', 'processType', 'Servicio', 'procedure', 'Licitacion', 'quantity', 150, 'unitCost', 8000, 'budgetAmount', 1200000, 'period', 'Q1-Q4 2026'),
    JSON_OBJECT('cpcCode', '30213000', 'description', 'Computadoras de escritorio All-in-One y laptops para personal medico y administrativo', 'processType', 'Bien', 'procedure', 'Subasta Inversa Electronica', 'quantity', 500, 'unitCost', 950, 'budgetAmount', 475000, 'period', 'Q1-Q2 2026'),
    JSON_OBJECT('cpcCode', '48761000', 'description', 'Licencias de software antivirus y plataforma de ciberseguridad endpoint', 'processType', 'Bien', 'procedure', 'Catalogo Electronico', 'quantity', 5000, 'unitCost', 45, 'budgetAmount', 225000, 'period', 'Q1 2026')
  )),
  6,
  6300000.00,
  NOW(),
  NOW()
);

-- 2c. Direccion Nacional de Infraestructura Sanitaria
INSERT INTO cp_paa_department_plan (
  workspace_id, department_name, department_code, assigned_user_id, assigned_user_name,
  department_budget, current_phase, total_phases, status, phase_data, items_data,
  items_count, items_total_budget, submitted_at, created_at
) VALUES (
  @ws_id,
  'Direccion Nacional de Infraestructura Sanitaria',
  'DNIS',
  'admin',
  'Arq. Patricia Velasco Nunez',
  25000000.00,
  7, 7,
  'ENVIADO',
  JSON_OBJECT(
    'fase1', JSON_OBJECT(
      'needs', 'La Direccion de Infraestructura Sanitaria requiere ejecutar obras de construccion, ampliacion y repotenciacion de establecimientos de salud prioritarios, asi como mantenimiento de la infraestructura existente.\n\nProyectos prioritarios:\n- Construccion de nuevo Hospital Basico en canton Durán (120 camas)\n- Ampliacion de emergencias del Hospital Eugenio Espejo\n- Repotenciacion de 10 Centros de Salud Tipo C\n- Mantenimiento correctivo de hospitales provinciales\n- Estudios y disenos para Hospital de Especialidades zona sur',
      'enrichedNeeds', '1 | 45215100 | Construccion Hospital Basico Duran - 120 camas, 4 quirofanos, UCI | O | Comun | Licitacion | 1 | Obra | $12,000,000.00 | $12,000,000.00 | DNIS | Q1-Q4\n2 | 45215120 | Ampliacion area de emergencias Hospital Eugenio Espejo - 800m2 | O | Comun | Cotizacion | 1 | Obra | $1,800,000.00 | $1,800,000.00 | DNIS | Q1-Q3\n3 | 45215140 | Repotenciacion de 10 Centros de Salud Tipo C a nivel nacional | O | Comun | Menor Cuantia | 10 | Obras | $350,000.00 | $3,500,000.00 | DNIS | Q1-Q4\n4 | 45454000 | Mantenimiento correctivo de hospitales provinciales - sistemas electricos, plomeria, HVAC | O | Comun | Menor Cuantia | 24 | Contratos | $125,000.00 | $3,000,000.00 | DNIS | Q1-Q4\n5 | 71320000 | Estudios y disenos del Hospital de Especialidades zona sur - fase 1 | C | Comun | Concurso Publico | 1 | Estudio | $2,500,000.00 | $2,500,000.00 | DNIS | Q1-Q3\n\nRESUMEN: 5 items por $22,800,000.00',
      'entityName', 'Ministerio de Salud Publica del Ecuador',
      'entityRuc', '1760013210001',
      'priorities', 'CRITICA: Hospital Basico Duran - deficit de camas hospitalarias en la zona\nALTA: Ampliacion emergencias Eugenio Espejo - saturacion actual del 180%\nALTA: Repotenciacion centros de salud - primer nivel resolutivo\nMEDIA: Mantenimiento correctivo - evitar deterioro de infraestructura\nMEDIA: Estudios Hospital Especialidades - planificacion a mediano plazo',
      'timeline', 'Q1 2026: Publicacion Licitacion Hospital Duran (Feb), inicio Concurso Publico estudios Hospital Especialidades (Mar)\nQ1-Q2 2026: Cotizacion ampliacion Eugenio Espejo, inicio obras Q2\nQ1-Q4 2026: Procesos Menor Cuantia repotenciacion centros de salud (3 por trimestre)\nQ1-Q4 2026: Contratos mantenimiento correctivo trimestrales\nQ3 2026: Adjudicacion Hospital Duran, inicio de obra',
      'missionSummary', 'La Direccion de Infraestructura Sanitaria planifica, ejecuta y supervisa la construccion y mantenimiento de la red de establecimientos de salud publica, garantizando espacios seguros y funcionales para la atencion de la poblacion, en cumplimiento del Plan Nacional de Salud y el Art. 360 de la Constitucion.'
    ),
    'fase2', 'MARCO_PRESUPUESTARIO',
    'fase3', 'LEVANTAMIENTO_NECESIDADES',
    'fase4', 'INTELIGENCIA_MERCADO',
    'fase5', 'CONSOLIDACION_CATEGORIAS',
    'fase6', 'ESTRATEGIA_CONTRATACION',
    'fase7', 'CALENDARIZACION_VALIDACION'
  ),
  JSON_OBJECT('examples', JSON_ARRAY(
    JSON_OBJECT('cpcCode', '45215100', 'description', 'Construccion Hospital Basico Duran - 120 camas, 4 quirofanos, UCI, neonatologia', 'processType', 'Obra', 'procedure', 'Licitacion', 'quantity', 1, 'unitCost', 12000000, 'budgetAmount', 12000000, 'period', 'Q1-Q4 2026'),
    JSON_OBJECT('cpcCode', '45215120', 'description', 'Ampliacion area de emergencias Hospital Eugenio Espejo - 800m2 con triage Manchester', 'processType', 'Obra', 'procedure', 'Cotizacion', 'quantity', 1, 'unitCost', 1800000, 'budgetAmount', 1800000, 'period', 'Q1-Q3 2026'),
    JSON_OBJECT('cpcCode', '45215140', 'description', 'Repotenciacion de 10 Centros de Salud Tipo C - obras civiles, instalaciones y equipamiento basico', 'processType', 'Obra', 'procedure', 'Menor Cuantia', 'quantity', 10, 'unitCost', 350000, 'budgetAmount', 3500000, 'period', 'Q1-Q4 2026'),
    JSON_OBJECT('cpcCode', '45454000', 'description', 'Mantenimiento correctivo de hospitales provinciales - sistemas electricos, plomeria, HVAC', 'processType', 'Obra', 'procedure', 'Menor Cuantia', 'quantity', 24, 'unitCost', 125000, 'budgetAmount', 3000000, 'period', 'Q1-Q4 2026'),
    JSON_OBJECT('cpcCode', '71320000', 'description', 'Estudios y disenos arquitectonicos del Hospital de Especialidades zona sur - fase 1', 'processType', 'Consultoria', 'procedure', 'Concurso Publico', 'quantity', 1, 'unitCost', 2500000, 'budgetAmount', 2500000, 'period', 'Q1-Q3 2026')
  )),
  5,
  22800000.00,
  NOW(),
  NOW()
);

-- 2d. Coordinacion General Administrativa Financiera
INSERT INTO cp_paa_department_plan (
  workspace_id, department_name, department_code, assigned_user_id, assigned_user_name,
  department_budget, current_phase, total_phases, status, phase_data, items_data,
  items_count, items_total_budget, created_at
) VALUES (
  @ws_id,
  'Coordinacion General Administrativa Financiera',
  'CGAF',
  'admin',
  'Econ. Andrea Salazar Vega',
  8000000.00,
  3, 7,
  'EN_PROGRESO',
  JSON_OBJECT(
    'fase1', JSON_OBJECT(
      'needs', 'La Coordinacion Administrativa Financiera requiere contratar servicios y bienes para el funcionamiento operativo del Ministerio: mobiliario, vehiculos, servicios de limpieza, seguridad, seguros, suministros de oficina y servicios generales.',
      'entityName', 'Ministerio de Salud Publica del Ecuador',
      'entityRuc', '1760013210001',
      'priorities', 'ALTA: Servicio de seguridad y vigilancia - contratos vencen en Q1\nALTA: Flota vehicular - 15 vehiculos con mas de 200,000 km\nMEDIA: Mobiliario de oficina - Plan de renovacion\nMEDIA: Suministros de oficina y papeleria\nBAJA: Servicios de mensajeria',
      'timeline', 'Q1: Procesos urgentes (seguridad, limpieza)\nQ2: Adquisicion vehiculos\nQ3-Q4: Mobiliario y otros',
      'missionSummary', 'La CGAF gestiona los recursos administrativos y financieros del MSP, asegurando la disponibilidad de bienes y servicios necesarios para el funcionamiento operativo de todas las dependencias ministeriales.'
    ),
    'fase2', 'MARCO_PRESUPUESTARIO',
    'fase3', JSON_OBJECT(
      'needs', 'Detalle de necesidades en proceso de levantamiento con las unidades administrativas...'
    )
  ),
  NULL,
  0,
  0.00,
  NOW()
);

-- 2e. Subsecretaria de Vigilancia de la Salud Publica
INSERT INTO cp_paa_department_plan (
  workspace_id, department_name, department_code, assigned_user_id, assigned_user_name,
  department_budget, current_phase, total_phases, status, phase_data, items_data,
  items_count, items_total_budget, created_at
) VALUES (
  @ws_id,
  'Subsecretaria de Vigilancia de la Salud Publica',
  'SVSP',
  'admin',
  'Dr. Fernando Gutierrez Lara',
  5000000.00,
  1, 7,
  'PENDIENTE',
  NULL,
  NULL,
  0,
  0.00,
  NOW()
);
