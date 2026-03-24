-- ============================================================================
-- V20260305_3: Seed - Metodologias PAA, Fases, Prompts, Marco Legal, Entidades
-- ============================================================================

-- ============================================================================
-- 1. METODOLOGIAS PAA (dos metodologias: completa y simplificada)
-- ============================================================================

INSERT INTO cp_paa_methodology (code, name, description, source_framework, country_code, welcome_message, total_phases, is_default, is_active)
VALUES (
  'CIPS_KEARNEY_LOSNCP',
  'Metodologia CIPS-Kearney adaptada LOSNCP',
  'Metodologia integral de planificacion de adquisiciones basada en el marco CIPS-Kearney, adaptada al Sistema Nacional de Contratacion Publica del Ecuador. Incluye 7 fases desde el contexto institucional hasta la calendarizacion y validacion final.',
  'CIPS (Chartered Institute of Procurement & Supply) + A.T. Kearney Procurement Framework',
  'EC',
  'Bienvenido al Asistente Inteligente para elaboracion del Plan Anual de Adquisiciones (PAA).\n\nUtilizaremos la **Metodologia CIPS-Kearney** adaptada a la normativa ecuatoriana (LOSNCP, RGLOSNCP y Resoluciones SERCOP) para guiarte en 7 fases:\n\n1. Contexto Institucional\n2. Marco Presupuestario\n3. Levantamiento de Necesidades\n4. Inteligencia de Mercado\n5. Consolidacion por Categorias\n6. Estrategia de Contratacion\n7. Calendarizacion y Validacion\n\nLa IA te asistira en cada paso, validando datos, sugiriendo items y verificando cumplimiento legal.\n\nComencemos: **¿Cual es el nombre de la entidad contratante?**',
  7, TRUE, TRUE
);

INSERT INTO cp_paa_methodology (code, name, description, source_framework, country_code, welcome_message, total_phases, is_default, is_active)
VALUES (
  'SIMPLIFICADA_LOSNCP',
  'Metodologia Simplificada LOSNCP',
  'Metodologia rapida de 4 fases para entidades con procesos sencillos o PAA de bajo volumen. Cumple con los requisitos minimos del Art. 22 LOSNCP pero agiliza el proceso de planificacion.',
  'LOSNCP Art. 22 - Requisitos minimos',
  'EC',
  'Bienvenido al Asistente PAA - **Modo Simplificado**.\n\nEsta metodologia te guiara en 4 pasos rapidos para elaborar tu Plan Anual de Adquisiciones cumpliendo con el Art. 22 LOSNCP:\n\n1. Datos de la Entidad\n2. Necesidades y Presupuesto\n3. Clasificacion y Procedimientos\n4. Revision y Validacion\n\nIdeal para entidades con volumen bajo de contrataciones o PAA de actualizacion.\n\nComencemos: **¿Cual es el nombre de la entidad contratante?**',
  4, FALSE, TRUE
);

-- ============================================================================
-- 2. FASES - Metodologia CIPS-Kearney (7 fases)
-- ============================================================================

SET @meth_cips_id = (SELECT id FROM cp_paa_methodology WHERE code = 'CIPS_KEARNEY_LOSNCP');

INSERT INTO cp_paa_methodology_phase (methodology_id, phase_number, phase_code, phase_name, phase_subtitle, icon, color, guidance_prompt_key, validation_prompt_key, extraction_prompt_key, confirmation_prompt_key, result_display_type, input_type, input_placeholder, options_source, is_required, can_skip, auto_advance, requires_ai_call, display_order) VALUES
(@meth_cips_id, 1, 'CONTEXTO_INSTITUCIONAL', 'Contexto Institucional', 'Identifica la entidad, su mision y sector estrategico', 'FiTarget', 'purple', 'cp_paa_phase1_guidance', 'cp_paa_phase1_validation', 'cp_paa_phase1_extraction', NULL, 'BADGES', 'TEXT', 'Escriba el nombre de la entidad contratante...', NULL, TRUE, FALSE, FALSE, TRUE, 1),
(@meth_cips_id, 2, 'MARCO_PRESUPUESTARIO', 'Marco Presupuestario', 'Define presupuesto total y distribucion por fuentes', 'FiDollarSign', 'green', 'cp_paa_phase2_guidance', NULL, 'cp_paa_phase2_extraction', NULL, 'STATS', 'TEXT', 'Indique el presupuesto asignado para contrataciones...', NULL, TRUE, FALSE, FALSE, TRUE, 2),
(@meth_cips_id, 3, 'LEVANTAMIENTO_NECESIDADES', 'Levantamiento de Necesidades', 'Describe bienes, servicios, obras y consultorias requeridos', 'FiPackage', 'blue', 'cp_paa_phase3_guidance', NULL, 'cp_paa_phase3_extraction', 'cp_paa_phase3_confirmation', 'TABLE', 'TEXTAREA', 'Describa las necesidades de contratacion: bienes, servicios, obras...', NULL, TRUE, FALSE, FALSE, TRUE, 3),
(@meth_cips_id, 4, 'INTELIGENCIA_MERCADO', 'Inteligencia de Mercado', 'La IA analiza precios de referencia y disponibilidad', 'FiTrendingUp', 'cyan', 'cp_paa_phase4_guidance', NULL, 'cp_paa_phase4_extraction', NULL, 'STATS', 'NONE', NULL, NULL, TRUE, FALSE, TRUE, TRUE, 4),
(@meth_cips_id, 5, 'CONSOLIDACION_CATEGORIAS', 'Consolidacion por Categorias', 'Agrupa items por CPC, detecta fraccionamiento, optimiza lotes', 'FiLayers', 'orange', 'cp_paa_phase5_guidance', NULL, 'cp_paa_phase5_extraction', NULL, 'BADGES', 'NONE', NULL, NULL, TRUE, FALSE, TRUE, TRUE, 5),
(@meth_cips_id, 6, 'ESTRATEGIA_CONTRATACION', 'Estrategia de Contratacion', 'Asigna procedimiento LOSNCP segun montos y umbrales', 'FiShield', 'red', 'cp_paa_phase6_guidance', NULL, 'cp_paa_phase6_extraction', NULL, 'TABLE', 'OPTIONS', 'Seleccione la estrategia preferida...', '["Optimizar costos", "Priorizar tiempo", "Maximizar participacion MIPYMES", "Equilibrado"]', TRUE, FALSE, FALSE, TRUE, 6),
(@meth_cips_id, 7, 'CALENDARIZACION_VALIDACION', 'Calendarizacion y Validacion', 'Programa trimestral y valida cumplimiento normativo', 'FiCalendar', 'teal', 'cp_paa_phase7_guidance', NULL, 'cp_paa_phase7_extraction', NULL, 'BADGES', 'OPTIONS', 'Seleccione la estrategia de calendarizacion...', '["Primer trimestre mayoritario", "Distribuido uniforme", "Segundo semestre", "Segun urgencia"]', TRUE, FALSE, FALSE, TRUE, 7);

-- ============================================================================
-- 2b. FASES - Metodologia Simplificada (4 fases)
-- ============================================================================

SET @meth_simple_id = (SELECT id FROM cp_paa_methodology WHERE code = 'SIMPLIFICADA_LOSNCP');

INSERT INTO cp_paa_methodology_phase (methodology_id, phase_number, phase_code, phase_name, phase_subtitle, icon, color, guidance_prompt_key, validation_prompt_key, extraction_prompt_key, confirmation_prompt_key, result_display_type, input_type, input_placeholder, options_source, is_required, can_skip, auto_advance, requires_ai_call, display_order) VALUES
(@meth_simple_id, 1, 'DATOS_ENTIDAD', 'Datos de la Entidad', 'Nombre, RUC, sector y presupuesto', 'FiUser', 'purple', 'cp_paa_phase1_guidance', 'cp_paa_phase1_validation', 'cp_paa_phase1_extraction', NULL, 'BADGES', 'TEXT', 'Nombre de la entidad contratante, RUC y presupuesto...', NULL, TRUE, FALSE, FALSE, TRUE, 1),
(@meth_simple_id, 2, 'NECESIDADES_PRESUPUESTO', 'Necesidades y Presupuesto', 'Lista de bienes, servicios y obras con montos', 'FiPackage', 'blue', 'cp_paa_phase3_guidance', NULL, 'cp_paa_phase3_extraction', 'cp_paa_phase3_confirmation', 'TABLE', 'TEXTAREA', 'Describa todas las necesidades de contratacion con montos estimados...', NULL, TRUE, FALSE, FALSE, TRUE, 2),
(@meth_simple_id, 3, 'CLASIFICACION_PROCEDIMIENTOS', 'Clasificacion y Procedimientos', 'CPC, umbrales y procedimientos LOSNCP', 'FiShield', 'orange', 'cp_paa_phase6_guidance', NULL, 'cp_paa_phase6_extraction', NULL, 'TABLE', 'NONE', NULL, NULL, TRUE, FALSE, TRUE, TRUE, 3),
(@meth_simple_id, 4, 'REVISION_VALIDACION', 'Revision y Validacion', 'Verificacion normativa y calendarizacion', 'FiCheckCircle', 'green', 'cp_paa_phase7_guidance', NULL, 'cp_paa_phase7_extraction', NULL, 'BADGES', 'OPTIONS', 'Seleccione estrategia de calendarizacion...', '["Primer trimestre", "Distribuido", "Segundo semestre"]', TRUE, FALSE, FALSE, TRUE, 4);

-- ============================================================================
-- 3. PROMPTS DE IA PARA METODOLOGIA PAA
-- ============================================================================

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase1_guidance', 'PAA Fase 1 - Guia Contexto Institucional', 'Prompt de guia para identificar la entidad contratante', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Eres un experto en contratacion publica ecuatoriana. Guia al usuario para identificar correctamente la entidad contratante segun el Art. 1 LOSNCP.

Pregunta el nombre de la entidad y proporciona contexto sobre por que es importante identificar correctamente la institucion para el PAA.

{{legal_context}}',
'["legal_context"]', '{"maxTokens": 1000, "temperature": 0.3}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase1_validation', 'PAA Fase 1 - Validacion de Entidad', 'Prompt para validar si una entidad es real/plausible', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'VALIDACION COMPLETA DE ENTIDAD CONTRATANTE para un PAA segun la LOSNCP ecuatoriana.

NOMBRE INGRESADO: "{{entity_name}}"

Determina si este nombre corresponde a una entidad del sector publico ecuatoriano REAL o PLAUSIBLE segun el Art. 1 de la LOSNCP.

ENTIDADES CONOCIDAS EN BASE DE DATOS:
{{known_entities}}

{{legal_context}}

====================================================================
SI LA ENTIDAD ES REAL O PLAUSIBLE:
====================================================================
- En "title" pon "ENTIDAD VALIDA"
- En "content" escribe un PERFIL INSTITUCIONAL breve (4-6 lineas) que incluya:
  * Tipo de entidad (ministerio, GAD, hospital, universidad, empresa publica, etc.)
  * Mision institucional resumida
  * Principales areas de accion
  * Como deben alinearse las compras publicas con su mision

- En "examples" pon EXACTAMENTE 4 elementos:
  * examples[0]: NOMBRE OFICIAL COMPLETO corregido (mayusculas, tildes, nombre completo)
  * examples[1]: RUC si lo conoces (13 digitos) o "DESCONOCIDO"
  * examples[2]: SECTOR (usa exactamente uno de: SALUD, EDUCACION, INFRAESTRUCTURA, TECNOLOGIA, GOBIERNO, SEGURIDAD, TRANSPORTE, OTRO)
  * examples[3]: Etiqueta descriptiva del sector

====================================================================
SI LA ENTIDAD NO EXISTE O ES FICTICIA:
====================================================================
- En "title" pon "ENTIDAD NO RECONOCIDA"
- En "content" explica brevemente por que
- En "tips" sugiere entidades reales similares
- En "examples" pon las entidades sugeridas

====================================================================
SI ES AMBIGUO:
====================================================================
- En "title" pon "ENTIDAD NO VERIFICADA"
- En "content" indica la duda
- En "examples" pon [nombre probable, "DESCONOCIDO", sector probable, etiqueta sector]

FORMATO DE RESPUESTA JSON:
{
  "help": {
    "title": "...",
    "content": "...",
    "examples": ["nombre", "ruc", "sector_code", "sector_label"],
    "tips": ["sugerencia1"],
    "legalReferences": [],
    "requirements": [],
    "commonErrors": []
  }
}',
'["entity_name", "known_entities", "legal_context"]', '{"maxTokens": 2000, "temperature": 0.2}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase1_extraction', 'PAA Fase 1 - Extraccion de Datos Entidad', 'Prompt para extraer datos estructurados de la entidad', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Extrae los datos de la entidad contratante de la conversacion del usuario.

Datos a extraer:
- entityName: nombre oficial completo
- entityRuc: RUC de 13 digitos
- sectorCode: codigo del sector
- sectorLabel: etiqueta del sector
- missionSummary: resumen de mision institucional
- entityType: tipo (MINISTERIO, GAD, EMPRESA_PUBLICA, UNIVERSIDAD, HOSPITAL, etc.)

FORMATO JSON:
{
  "entityName": "...",
  "entityRuc": "...",
  "sectorCode": "...",
  "sectorLabel": "...",
  "missionSummary": "...",
  "entityType": "..."
}',
'["conversation_context"]', '{"maxTokens": 500, "temperature": 0.1}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase2_guidance', 'PAA Fase 2 - Guia Marco Presupuestario', 'Prompt para guiar definicion del presupuesto', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Eres un experto en presupuesto publico ecuatoriano. Guia al usuario para definir el marco presupuestario del PAA.

ENTIDAD: {{entity_name}}
SECTOR: {{sector_label}}

{{legal_context}}

Pregunta sobre:
- Presupuesto total asignado para contrataciones del anio fiscal {{fiscal_year}}
- Fuentes de financiamiento (fiscal, autofinanciado, credito, cooperacion)
- Distribucion por tipo de gasto (corriente vs inversion)

El presupuesto debe ser coherente con el tipo y tamano de la entidad.',
'["entity_name", "sector_label", "fiscal_year", "legal_context"]', '{"maxTokens": 1000, "temperature": 0.3}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase2_extraction', 'PAA Fase 2 - Extraccion Marco Presupuestario', 'Prompt para extraer datos de presupuesto', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Extrae datos del marco presupuestario de la conversacion.

FORMATO JSON:
{
  "totalBudget": 0,
  "budgetBySource": {"fiscal": 0, "autofinanciado": 0, "credito": 0, "cooperacion": 0},
  "budgetByType": {"corriente": 0, "inversion": 0},
  "departments": ["dept1", "dept2"]
}',
'["conversation_context"]', '{"maxTokens": 500, "temperature": 0.1}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase3_guidance', 'PAA Fase 3 - Guia Levantamiento Necesidades', 'Prompt para guiar el levantamiento de necesidades', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Eres un consultor experto en contratacion publica ecuatoriana. Guia al usuario para describir las necesidades de contratacion.

ENTIDAD: {{entity_name}} ({{sector_label}})
PRESUPUESTO: ${{total_budget}}
DEPARTAMENTOS: {{departments}}
ANO FISCAL: {{fiscal_year}}

{{legal_context}}

Pide al usuario que describa las necesidades de cada departamento: bienes, servicios, obras y consultorias.
Sugiere categorias tipicas para el sector {{sector_label}}.',
'["entity_name", "sector_label", "total_budget", "departments", "fiscal_year", "legal_context"]', '{"maxTokens": 1500, "temperature": 0.3}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase3_extraction', 'PAA Fase 3 - Extraccion de Items PAA', 'Prompt para convertir descripciones en items PAA concretos', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'ERES UN CONSULTOR EXPERTO EN CONTRATACION PUBLICA ECUATORIANA. Tu trabajo es generar items CONCRETOS para un PAA.

DESCRIPCION DEL USUARIO:
"{{user_input}}"

CONTEXTO:
- Entidad: {{entity_name}}
- Sector: {{sector_label}}
- Presupuesto: ${{total_budget}}
- Departamentos: {{departments}}
- Anio fiscal: {{fiscal_year}}

{{legal_context}}
{{procurement_thresholds}}

====================================================================
EVALUA si la descripcion tiene suficiente detalle para generar items concretos.

**SI LA DESCRIPCION ES VAGA** (ej: "equipos", "necesitamos cosas"):
- En "title" pon: "CLARIFICACION NECESARIA"
- En "content" pon 4-6 PREGUNTAS ESPECIFICAS

**SI LA DESCRIPCION TIENE DETALLE**:
- En "title" pon: "PROPUESTA PAA {{fiscal_year}}"
- En "content" genera una TABLA con formato:

ITEMS PROPUESTOS:

# | CPC | Descripcion | Tipo | Regimen | Procedimiento | Cant | U.Medida | C.Unit. | Total | Depto | Periodo
1 | [codigo real] | [descripcion tecnica] | B/S/O/C | Comun/Especial | [proceso LOSNCP] | [n] | [unidad] | $[monto] | $[total] | [depto] | Q1/Q2/Q3/Q4

ITEMS ADICIONALES RECOMENDADOS:
[items tipicos del sector que no fueron mencionados]

RESUMEN: [n] items por $[total]

REGLAS:
- Codigo CPC REAL de 8 digitos
- Procedimiento segun umbrales vigentes
- Art. 22 LOSNCP: el PAA contiene bienes, servicios incluidos los de consultoria y obras
- Verificar que la suma no exceda el presupuesto
- Detectar posible fraccionamiento (Art. 6 num. 15 LOSNCP)',
'["user_input", "entity_name", "sector_label", "total_budget", "departments", "fiscal_year", "legal_context", "procurement_thresholds"]', '{"maxTokens": 4000, "temperature": 0.2}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase3_confirmation', 'PAA Fase 3 - Confirmacion Items', 'Prompt para confirmar o refinar items propuestos', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'El usuario reviso la propuesta de items PAA y solicita cambios.

PROPUESTA ANTERIOR:
{{previous_proposal}}

CAMBIOS SOLICITADOS:
"{{user_input}}"

Aplica SOLO los cambios solicitados. Mantiene los items no mencionados. Genera la tabla completa actualizada con el mismo formato.',
'["previous_proposal", "user_input"]', '{"maxTokens": 4000, "temperature": 0.2}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase4_guidance', 'PAA Fase 4 - Inteligencia de Mercado', 'Prompt para analisis de mercado de items PAA', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Analiza los items propuestos del PAA desde una perspectiva de inteligencia de mercado.

ITEMS:
{{items_data}}

DATOS HISTORICOS DISPONIBLES:
{{historical_prices}}

{{legal_context}}

Analiza para cada item o categoria:
1. Disponibilidad en Catalogo Electronico SERCOP
2. Precios referenciales del mercado (comparar con historicos)
3. Numero de proveedores potenciales
4. Estacionalidad de precios
5. Recomendaciones de consolidacion

FORMATO JSON:
{
  "help": {
    "title": "ANALISIS DE MERCADO",
    "content": "Tabla con analisis por item...",
    "tips": ["recomendacion1", "recomendacion2"],
    "legalReferences": []
  }
}',
'["items_data", "historical_prices", "legal_context"]', '{"maxTokens": 3000, "temperature": 0.2}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase5_guidance', 'PAA Fase 5 - Consolidacion Categorias', 'Prompt para consolidar items por categorias CPC', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Consolida los items del PAA por categorias CPC y detecta oportunidades de optimizacion.

ITEMS:
{{items_data}}

{{legal_context}}

Realiza:
1. Agrupar items por categoria CPC (primeros 4 digitos)
2. Sumar montos por categoria
3. Detectar FRACCIONAMIENTO (Art. 6 num. 15 LOSNCP): items similares divididos en multiples compras menores para evadir umbrales
4. Sugerir consolidacion de lotes para mejores precios
5. Identificar items que podrian comprarse via Catalogo Electronico

FORMATO JSON:
{
  "help": {
    "title": "CONSOLIDACION POR CATEGORIAS",
    "content": "Tabla con categorias, montos, alertas...",
    "tips": ["alerta fraccionamiento", "sugerencia consolidacion"],
    "commonErrors": ["error de fraccionamiento detectado"],
    "legalReferences": [{"law": "LOSNCP", "article": "Art. 6 num. 15", "summary": "..."}]
  }
}',
'["items_data", "legal_context"]', '{"maxTokens": 3000, "temperature": 0.2}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase6_guidance', 'PAA Fase 6 - Estrategia de Contratacion', 'Prompt para definir estrategia y procedimientos', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Asigna el procedimiento de contratacion correcto a cada item/categoria del PAA segun la LOSNCP.

ITEMS CONSOLIDADOS:
{{items_data}}

ESTRATEGIA SELECCIONADA: {{strategy}}

UMBRALES DE CONTRATACION VIGENTES:
{{procurement_thresholds}}

{{legal_context}}

Para cada item/lote:
1. Determinar tipo (Bien, Servicio, Obra, Consultoria)
2. Verificar monto contra umbrales del PIE vigente
3. Asignar procedimiento: Catalogo Electronico, Infima Cuantia, Menor Cuantia, Cotizacion, Licitacion, SIE, Regimen Especial
4. Verificar si aplica Feria Inclusiva (participacion MIPYMES)
5. Considerar la estrategia seleccionada por el usuario

FORMATO JSON:
{
  "help": {
    "title": "ESTRATEGIA DE CONTRATACION",
    "content": "Tabla con items, procedimientos asignados, justificacion...",
    "tips": ["recomendacion estrategica"],
    "legalReferences": [{"law": "LOSNCP", "article": "Art. 51", "summary": "Umbrales..."}]
  }
}',
'["items_data", "strategy", "procurement_thresholds", "legal_context"]', '{"maxTokens": 3000, "temperature": 0.2}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_phase7_guidance', 'PAA Fase 7 - Calendarizacion y Validacion', 'Prompt para calendarizar y validar el PAA', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Calendariza y valida el PAA completo segun normativa LOSNCP.

ITEMS CON PROCEDIMIENTOS:
{{items_data}}

ESTRATEGIA TEMPORAL: {{timeline_strategy}}

{{legal_context}}

Realiza:
1. Asignar trimestre de inicio a cada proceso (Q1, Q2, Q3, Q4)
2. Estimar duracion de cada procedimiento
3. Calcular fecha estimada de adjudicacion
4. Verificar que no se concentren demasiados procesos en un trimestre
5. Validar cumplimiento del Art. 22 LOSNCP (PAC debe publicarse en enero)
6. Verificar Art. 25 RGLOSNCP (publicacion en portal institucional)
7. Confirmar que el presupuesto total no excede el asignado

FORMATO JSON:
{
  "help": {
    "title": "CALENDARIZACION Y VALIDACION",
    "content": "Cronograma trimestral con validaciones...",
    "tips": ["validacion1", "validacion2"],
    "legalReferences": [{"law": "LOSNCP", "article": "Art. 22", "summary": "..."}]
  }
}',
'["items_data", "timeline_strategy", "legal_context"]', '{"maxTokens": 3000, "temperature": 0.2}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_dept_suggestion', 'PAA - Sugerencia de Departamentos', 'Prompt para sugerir departamentos de una entidad', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Para la entidad publica ecuatoriana "{{entity_name}}" del sector {{sector_label}}, necesito la lista de unidades administrativas/departamentos/direcciones principales que tipicamente generan necesidades de contratacion publica.

{{known_entity_departments}}

INSTRUCCIONES:
- Devuelve en "examples" un array con los nombres FORMALES de los departamentos principales (entre 6 y 15 departamentos)
- Adapta los departamentos al tipo especifico de entidad y sector
- Usa la nomenclatura oficial ecuatoriana (Direccion, Coordinacion, Subsecretaria, etc.)
- Incluye siempre las areas transversales: Administrativa, Financiera, Talento Humano, TI, Planificacion
- Agrega las areas misionales especificas del sector

En "content" pon una breve explicacion (1-2 lineas) de por que se sugieren estos departamentos.

FORMATO JSON:
{
  "help": {
    "title": "Departamentos sugeridos",
    "content": "Explicacion breve...",
    "examples": ["Departamento 1", "Departamento 2", "..."]
  }
}',
'["entity_name", "sector_label", "known_entity_departments"]', '{"maxTokens": 1500, "temperature": 0.3}', 'system');

INSERT IGNORE INTO ai_prompt_config (prompt_key, display_name, description, category, language, message_type, prompt_template, available_variables, config, created_by) VALUES
('cp_paa_final_generation', 'PAA - Generacion Final', 'Prompt para generar el PAA final consolidado', 'CP_PAA_METHODOLOGY', 'es', 'ALL',
'Genera el Plan Anual de Adquisiciones (PAA) final consolidado.

DATOS RECOPILADOS:
- Entidad: {{entity_name}} (RUC: {{entity_ruc}})
- Sector: {{sector_label}}
- Presupuesto: ${{total_budget}}
- Anio fiscal: {{fiscal_year}}

ITEMS VALIDADOS:
{{items_data}}

CALENDARIZACION:
{{calendar_data}}

{{legal_context}}

Genera el PAA final con:
1. Tabla completa de items con todos los campos
2. Resumen ejecutivo
3. Certificacion de cumplimiento normativo
4. Alertas o recomendaciones pendientes

FORMATO JSON completo del PAA para guardar en base de datos.',
'["entity_name", "entity_ruc", "sector_label", "total_budget", "fiscal_year", "items_data", "calendar_data", "legal_context"]', '{"maxTokens": 5000, "temperature": 0.1}', 'system');

-- ============================================================================
-- 4. CONTEXTO LEGAL (Art. LOSNCP, RGLOSNCP, Resoluciones SERCOP)
-- ============================================================================

INSERT INTO cp_legal_context (context_code, context_type, authority, title, summary, article_number, applicable_phases, applicable_process_types, country_code, effective_date, priority, is_active) VALUES
('LOSNCP_ART1', 'LEY', 'LOSNCP', 'Art. 1 LOSNCP - Objeto y Ambito', 'Esta Ley establece el Sistema Nacional de Contratacion Publica y determina los principios y normas para regular los procedimientos de contratacion para la adquisicion o arrendamiento de bienes, ejecucion de obras y prestacion de servicios, incluidos los de consultoria.', 'Art. 1', '["CONTEXTO_INSTITUCIONAL", "DATOS_ENTIDAD"]', NULL, 'EC', '2008-08-04', 10, TRUE),
('LOSNCP_ART22', 'LEY', 'LOSNCP', 'Art. 22 LOSNCP - Plan Anual de Contratacion', 'Las Entidades Contratantes, para cumplir con los objetivos del Plan Nacional de Desarrollo, sus objetivos y necesidades institucionales, formularan el Plan Anual de Contratacion con el presupuesto correspondiente, de conformidad a la planificacion plurianual de la Institucion, asociados al Plan Nacional de Desarrollo y a los presupuestos del Estado.', 'Art. 22', '["CONTEXTO_INSTITUCIONAL", "MARCO_PRESUPUESTARIO", "CALENDARIZACION_VALIDACION", "DATOS_ENTIDAD", "REVISION_VALIDACION"]', '["CP_PAA"]', 'EC', '2008-08-04', 100, TRUE),
('LOSNCP_ART22_2', 'LEY', 'LOSNCP', 'Art. 22 inc. 2 LOSNCP - Contenido del PAC', 'El Plan Anual de Contratacion contendra las obras, bienes o servicios incluidos los de consultoria que se contrataran durante ese ano, en funcion de sus respectivas metas institucionales y de conformidad a lo dispuesto en el articulo 22.', 'Art. 22', '["LEVANTAMIENTO_NECESIDADES", "NECESIDADES_PRESUPUESTO"]', '["CP_PAA"]', 'EC', '2008-08-04', 95, TRUE),
('LOSNCP_ART25', 'REGLAMENTO', 'RGLOSNCP', 'Art. 25 RGLOSNCP - Publicacion del PAC', 'Hasta el 15 de enero de cada ano, la maxima autoridad de cada entidad contratante o su delegado, aprobara y publicara el Plan Anual de Contratacion (PAC), el mismo que contendra las obras, bienes o servicios incluidos los de consultoria que se contrataran durante ese ano, en funcion de sus respectivas metas institucionales.', 'Art. 25', '["CALENDARIZACION_VALIDACION", "REVISION_VALIDACION"]', '["CP_PAA"]', 'EC', '2009-05-12', 90, TRUE),
('LOSNCP_ART6_15', 'LEY', 'LOSNCP', 'Art. 6 num. 15 LOSNCP - Fraccionamiento', 'Fraccionamiento: Es la division o fragmentacion de la contratacion en varias de menor cuantia para evadir procedimientos de seleccion previstos en esta ley. El fraccionamiento estara prohibido.', 'Art. 6 num. 15', '["CONSOLIDACION_CATEGORIAS", "ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 85, TRUE),
('LOSNCP_ART46', 'LEY', 'LOSNCP', 'Art. 46 LOSNCP - Catalogo Electronico', 'Las Entidades Contratantes deberan consultar el catalogo electronico previamente a establecer procesos de adquisicion de bienes y servicios. Solo en caso de que el bien o servicio requerido no se encuentre catalogado se podran realizar otros procedimientos de seleccion.', 'Art. 46', '["ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 80, TRUE),
('LOSNCP_ART47', 'LEY', 'LOSNCP', 'Art. 47 LOSNCP - Subasta Inversa Electronica', 'Para la adquisicion de bienes y servicios normalizados que no consten en el catalogo electronico, las Entidades Contratantes deberan realizar subastas inversas electronicas, siempre que el presupuesto referencial supere el monto establecido por el SERCOP.', 'Art. 47', '["ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 75, TRUE),
('LOSNCP_ART48', 'LEY', 'LOSNCP', 'Art. 48 LOSNCP - Licitacion', 'La licitacion es un procedimiento de contratacion que se utilizara en los siguientes casos: 1. Si fuera imposible aplicar los procedimientos dinamicos o si habiendose aplicado estos hubieren sido declarados desiertos, siempre que el presupuesto referencial sobrepase el valor que resulte de multiplicar el coeficiente 0,000015 por el PIE.', 'Art. 48', '["ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 70, TRUE),
('LOSNCP_ART50', 'LEY', 'LOSNCP', 'Art. 50 LOSNCP - Cotizacion', 'Este procedimiento se utilizara cuando el presupuesto referencial oscile entre el valor que resulte de multiplicar el coeficiente 0,000002 por el PIE y el valor que resulte de multiplicar el coeficiente 0,000015 por el PIE.', 'Art. 50', '["ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 68, TRUE),
('LOSNCP_ART51', 'LEY', 'LOSNCP', 'Art. 51 LOSNCP - Menor Cuantia', 'Se podra contratar bajo este sistema en cualquiera de los siguientes casos: bienes y servicios no normalizados cuyo presupuesto referencial sea inferior al valor que resulte de multiplicar el coeficiente 0,000002 por el PIE; y obras cuyo presupuesto referencial sea inferior al valor que resulte de multiplicar el coeficiente 0,000007 por el PIE.', 'Art. 51', '["ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 68, TRUE),
('LOSNCP_ART52_1', 'LEY', 'LOSNCP', 'Art. 52.1 LOSNCP - Infima Cuantia', 'Se podran realizar contrataciones de infima cuantia cuando el presupuesto referencial de la contratacion sea igual o menor al valor que resulte de multiplicar el coeficiente 0,0000002 por el PIE.', 'Art. 52.1', '["ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 65, TRUE),
('LOSNCP_ART62', 'LEY', 'LOSNCP', 'Art. 62 LOSNCP - Prohibicion de Fraccionamiento', 'Se prohibe la division de la contratacion de bienes similares, de servicios, incluidos los de consultoria, o la ejecucion de obras de una misma naturaleza, con el fin de evadir los procedimientos establecidos en esta Ley.', 'Art. 62', '["CONSOLIDACION_CATEGORIAS", "ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2008-08-04', 90, TRUE),
('SERCOP_RE_2024_001', 'RESOLUCION', 'SERCOP', 'Resolucion SERCOP-2024-0001 - Formato PAC', 'Establece el formato obligatorio para la publicacion del Plan Anual de Contratacion en el portal institucional del SERCOP. Define los campos minimos que debe contener cada item del PAC.', NULL, '["CALENDARIZACION_VALIDACION", "REVISION_VALIDACION"]', '["CP_PAA"]', 'EC', '2024-01-15', 80, TRUE),
('SERCOP_RE_UMBRALES_2026', 'RESOLUCION', 'SERCOP', 'Resolucion SERCOP - Umbrales y Coeficientes 2026', 'Establece los coeficientes y montos actualizados para la determinacion de los procedimientos de contratacion publica aplicables segun el Presupuesto Inicial del Estado del ano fiscal 2026.', NULL, '["ESTRATEGIA_CONTRATACION", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2026-01-01', 85, TRUE),
('DECRETO_AUSTERIDAD_2026', 'DECRETO', 'Presidencia de la Republica', 'Decreto Ejecutivo - Medidas de Austeridad 2026', 'Establece medidas de austeridad y optimizacion del gasto publico para el ejercicio fiscal 2026. Las entidades del sector publico deben priorizar gastos operativos esenciales y reducir gastos no prioritarios.', NULL, '["MARCO_PRESUPUESTARIO", "ESTRATEGIA_CONTRATACION", "NECESIDADES_PRESUPUESTO"]', NULL, 'EC', '2025-12-15', 70, TRUE),
('LINEAMIENTO_PLANIF_2026', 'LINEAMIENTO', 'Ministerio de Finanzas', 'Lineamientos para formulacion PAC 2026', 'Directrices para la formulacion del Plan Anual de Contratacion alineado con los techos presupuestarios aprobados y la programacion cuatrianual. Las entidades deben vincular su PAC con los objetivos del Plan de Desarrollo.', NULL, '["MARCO_PRESUPUESTARIO", "CALENDARIZACION_VALIDACION", "NECESIDADES_PRESUPUESTO", "REVISION_VALIDACION"]', '["CP_PAA"]', 'EC', '2025-11-01', 75, TRUE),
('SERCOP_CATALOGO_OBLIGATORIO', 'RESOLUCION', 'SERCOP', 'Obligatoriedad de Catalogo Electronico', 'Las entidades contratantes DEBEN consultar obligatoriamente el Catalogo Electronico antes de iniciar cualquier otro procedimiento de contratacion. Si el bien o servicio esta catalogado, la compra debe realizarse por esta via.', NULL, '["ESTRATEGIA_CONTRATACION", "INTELIGENCIA_MERCADO", "CLASIFICACION_PROCEDIMIENTOS"]', NULL, 'EC', '2020-01-01', 80, TRUE),
('LOSNCP_PARTICIPACION_NACIONAL', 'LEY', 'LOSNCP', 'Art. 25.1 LOSNCP - Participacion Nacional', 'En los procedimientos de contratacion publica se preferira a la produccion nacional. Las entidades contratantes deberan establecer criterios de valoracion que incentiven la participacion local.', 'Art. 25.1', '["ESTRATEGIA_CONTRATACION"]', NULL, 'EC', '2008-08-04', 50, TRUE),
('LOSNCP_FERIA_INCLUSIVA', 'LEY', 'LOSNCP', 'Ferias Inclusivas - Participacion MIPYMES', 'Las entidades contratantes deberan destinar un porcentaje de sus adquisiciones anuales a traves de Ferias Inclusivas para fomentar la participacion de micro y pequenas empresas, artesanos y actores de la economia popular y solidaria.', NULL, '["ESTRATEGIA_CONTRATACION"]', NULL, 'EC', '2008-08-04', 55, TRUE),
('RGLOSNCP_ESTUDIOS_MERCADO', 'REGLAMENTO', 'RGLOSNCP', 'Estudios de Mercado - RGLOSNCP', 'Antes de iniciar un procedimiento precontractual, de acuerdo a la naturaleza de la contratacion, la entidad debera contar con los estudios de mercado con el analisis de la oferta y la demanda del bien, servicio u obra a contratar.', NULL, '["INTELIGENCIA_MERCADO"]', NULL, 'EC', '2009-05-12', 60, TRUE);

-- ============================================================================
-- 5. ENTIDADES CONOCIDAS (entidades publicas ecuatorianas)
-- ============================================================================

INSERT INTO cp_known_entities (entity_name, entity_ruc, entity_type, sector_code, sector_label, mission_summary, typical_departments, country_code) VALUES
('Ministerio de Salud Publica', '1760013210001', 'MINISTERIO', 'SALUD', 'Salud Publica', 'Ente rector de la politica de salud publica. Responsable de la vigilancia epidemiologica, provisión de servicios de salud, regulacion sanitaria y acceso universal a medicamentos.', '["Subsecretaria de Vigilancia de la Salud Publica", "Subsecretaria de Promocion de la Salud", "Coordinacion General Administrativa Financiera", "Direccion de Talento Humano", "Direccion de Tecnologias de la Informacion", "Direccion de Planificacion e Inversion", "Direccion Nacional de Medicamentos e Insumos", "Direccion de Infraestructura Sanitaria", "Direccion de Control Sanitario"]', 'EC'),
('Ministerio de Educacion', '1760013370001', 'MINISTERIO', 'EDUCACION', 'Educacion', 'Ente rector de la politica educativa nacional. Responsable del sistema educativo publico, formacion docente, infraestructura educativa y acceso universal a la educacion.', '["Subsecretaria de Educacion", "Subsecretaria de Administracion Escolar", "Coordinacion General Administrativa Financiera", "Direccion de Talento Humano", "Direccion de Tecnologias", "Direccion de Planificacion", "Direccion Nacional de Infraestructura Educativa"]', 'EC'),
('Ministerio de Finanzas', '1760013490001', 'MINISTERIO', 'GOBIERNO', 'Gobierno y Administracion', 'Ente rector de las finanzas publicas. Responsable de la politica fiscal, presupuesto general del Estado, endeudamiento publico y contabilidad gubernamental.', '["Subsecretaria de Presupuesto", "Subsecretaria de Tesoreria", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias", "Direccion de Planificacion"]', 'EC'),
('Ministerio de Defensa Nacional', '1760013280001', 'MINISTERIO', 'SEGURIDAD', 'Seguridad y Defensa', 'Ente rector de la politica de defensa nacional. Coordina las Fuerzas Armadas y la defensa de la soberania nacional.', '["Subsecretaria de Defensa", "Coordinacion General Administrativa Financiera", "Direccion de Talento Humano", "Direccion de Tecnologias", "Comando Conjunto de las Fuerzas Armadas"]', 'EC'),
('Ministerio del Interior', '1760013300001', 'MINISTERIO', 'SEGURIDAD', 'Seguridad Ciudadana', 'Ente rector de la politica de seguridad interna y orden publico. Coordina la Policia Nacional y las gobernaciones.', '["Subsecretaria de Seguridad Interna", "Coordinacion General Administrativa Financiera", "Direccion de Talento Humano", "Direccion de Tecnologias", "Direccion de Planificacion"]', 'EC'),
('Ministerio de Obras Publicas y Transporte', '1760013460001', 'MINISTERIO', 'INFRAESTRUCTURA', 'Infraestructura y Obras', 'Ente rector de la politica de infraestructura vial y transporte. Responsable de la red vial estatal, puentes, puertos y aeropuertos.', '["Subsecretaria de Infraestructura del Transporte", "Subsecretaria de Transporte Terrestre", "Coordinacion General Administrativa Financiera", "Direccion de Estudios y Disenos", "Direccion de Construcciones"]', 'EC'),
('Ministerio de Inclusion Economica y Social', '1760013350001', 'MINISTERIO', 'GOBIERNO', 'Inclusion Social', 'Ente rector de la politica de inclusion economica y social. Responsable de programas de proteccion social, cuidado infantil y atencion a grupos vulnerables.', '["Subsecretaria de Inclusion Social", "Coordinacion General Administrativa Financiera", "Direccion de Talento Humano", "Direccion de Tecnologias"]', 'EC'),
('Ministerio del Ambiente, Agua y Transicion Ecologica', '1760013400001', 'MINISTERIO', 'GOBIERNO', 'Ambiente', 'Ente rector de la politica ambiental y gestion del recurso hidrico. Responsable de la conservacion de biodiversidad y transicion ecologica.', '["Subsecretaria de Calidad Ambiental", "Subsecretaria de Patrimonio Natural", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias"]', 'EC'),
('Ministerio de Agricultura y Ganaderia', '1760013430001', 'MINISTERIO', 'GOBIERNO', 'Agricultura', 'Ente rector de la politica agropecuaria. Responsable del desarrollo agricola, ganadero, acuicola y pesquero del pais.', '["Subsecretaria de Agricultura", "Subsecretaria de Ganaderia", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias"]', 'EC'),
('Ministerio de Trabajo', '1760013520001', 'MINISTERIO', 'GOBIERNO', 'Trabajo', 'Ente rector de la politica laboral. Responsable de las relaciones laborales, seguridad ocupacional y empleo.', '["Subsecretaria de Empleo", "Coordinacion General Administrativa Financiera", "Direccion de Talento Humano", "Direccion de Tecnologias"]', 'EC'),
('Ministerio de Telecomunicaciones (MINTEL)', '1768149130001', 'MINISTERIO', 'TECNOLOGIA', 'Tecnologia e Innovacion', 'Ente rector de la politica de telecomunicaciones y sociedad de la informacion. Impulsa el gobierno electronico y la transformacion digital.', '["Subsecretaria de Telecomunicaciones", "Subsecretaria de Gobierno Electronico", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias"]', 'EC'),
('Ministerio de Energia y Minas', '1760013540001', 'MINISTERIO', 'INFRAESTRUCTURA', 'Energia', 'Ente rector de la politica energetica y minera. Responsable de la generacion, transmision y distribucion de energia electrica y actividades mineras.', '["Subsecretaria de Energia", "Subsecretaria de Minas", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias"]', 'EC'),
('Ministerio de Turismo', '1760013510001', 'MINISTERIO', 'GOBIERNO', 'Turismo', 'Ente rector de la politica turistica. Responsable de la promocion turistica y desarrollo del sector.', '["Subsecretaria de Turismo", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias", "Direccion de Planificacion"]', 'EC'),
('IESS - Instituto Ecuatoriano de Seguridad Social', '1760004000001', 'EMPRESA_PUBLICA', 'SALUD', 'Seguridad Social', 'Entidad autonoma responsable de la seguridad social obligatoria. Administra prestaciones de salud, pensiones, riesgos del trabajo y seguro campesino.', '["Direccion del Seguro General de Salud", "Direccion del Seguro de Pensiones", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias", "Direccion de Talento Humano"]', 'EC'),
('SRI - Servicio de Rentas Internas', '1760013450001', 'EMPRESA_PUBLICA', 'GOBIERNO', 'Gobierno y Administracion', 'Entidad tecnica y autonoma responsable de la recaudacion de impuestos nacionales y el control del cumplimiento tributario.', '["Direccion Nacional de Recaudacion", "Direccion de Tecnologias", "Coordinacion General Administrativa Financiera", "Direccion de Planificacion"]', 'EC'),
('Contraloria General del Estado', '1760005540001', 'ORGANISMO_CONTROL', 'GOBIERNO', 'Control y Auditoria', 'Organismo tecnico superior de control. Responsable del control de los recursos publicos y la gestion publica.', '["Direccion de Auditoria", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias", "Direccion de Planificacion"]', 'EC'),
('SERCOP', '1768155430001', 'ORGANISMO_CONTROL', 'GOBIERNO', 'Contratacion Publica', 'Servicio Nacional de Contratacion Publica. Ente rector del Sistema Nacional de Contratacion Publica.', '["Direccion de Estudios", "Direccion de Normativa", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias"]', 'EC'),
('Banco Central del Ecuador', '1760002600001', 'EMPRESA_PUBLICA', 'GOBIERNO', 'Finanzas', 'Persona juridica de derecho publico, parte de la Funcion Ejecutiva. Responsable de la politica monetaria y financiera.', '["Direccion de Operaciones", "Coordinacion General Administrativa Financiera", "Direccion de Tecnologias"]', 'EC'),
('Petroecuador EP', '1768152940001', 'EMPRESA_PUBLICA', 'INFRAESTRUCTURA', 'Energia y Petroleo', 'Empresa publica de hidrocarburos. Responsable de la gestion de actividades de transporte, refinacion, almacenamiento y comercializacion de hidrocarburos.', '["Gerencia de Refinacion", "Gerencia de Transporte y Almacenamiento", "Gerencia Administrativa Financiera", "Gerencia de Tecnologias"]', 'EC'),
('CNEL EP', '1768155820001', 'EMPRESA_PUBLICA', 'INFRAESTRUCTURA', 'Energia Electrica', 'Corporacion Nacional de Electricidad. Responsable de la distribucion y comercializacion de energia electrica.', '["Gerencia de Distribucion", "Gerencia Comercial", "Gerencia Administrativa Financiera", "Gerencia de Tecnologias"]', 'EC'),
('GAD Municipal de Quito', '1760003500001', 'GAD', 'GOBIERNO', 'Gobierno Local - Quito', 'Gobierno Autonomo Descentralizado del Distrito Metropolitano de Quito. Responsable del desarrollo urbano, servicios publicos y gestion del territorio del DMQ.', '["Secretaria de Movilidad", "Secretaria de Salud", "Secretaria de Educacion", "Direccion Administrativa", "Direccion Financiera", "Direccion de Obras Publicas", "EPMMOP", "EPMAPS"]', 'EC'),
('GAD Municipal de Guayaquil', '0960000050001', 'GAD', 'GOBIERNO', 'Gobierno Local - Guayaquil', 'Gobierno Autonomo Descentralizado de Guayaquil. Responsable del desarrollo urbano y servicios publicos de Guayaquil.', '["Direccion de Urbanismo", "Direccion de Obras Publicas", "Direccion Administrativa", "Direccion Financiera", "Direccion de Accion Social"]', 'EC'),
('GAD Municipal de Cuenca', '0160000270001', 'GAD', 'GOBIERNO', 'Gobierno Local - Cuenca', 'Gobierno Autonomo Descentralizado de Cuenca. Responsable del desarrollo urbano y servicios publicos de Cuenca.', '["Direccion de Obras Publicas", "Direccion Administrativa Financiera", "ETAPA EP", "EMOV EP"]', 'EC'),
('Universidad Central del Ecuador', '1760005620001', 'UNIVERSIDAD', 'EDUCACION', 'Educacion Superior', 'Universidad publica mas antigua del pais. Ofrece formacion en multiples areas del conocimiento.', '["Direccion Administrativa", "Direccion Financiera", "Direccion de Tecnologias", "Direccion de Planificacion", "Facultades diversas"]', 'EC'),
('Escuela Politecnica Nacional', '1760005690001', 'UNIVERSIDAD', 'EDUCACION', 'Educacion Superior Tecnica', 'Universidad publica de excelencia en ciencias e ingenieria.', '["Direccion Administrativa", "Direccion Financiera", "Direccion de Tecnologias", "Direccion de Planificacion"]', 'EC'),
('Prefectura de Pichincha', '1760001550001', 'GAD', 'GOBIERNO', 'Gobierno Provincial', 'Gobierno Autonomo Descentralizado Provincial de Pichincha. Responsable de la vialidad rural, riego y desarrollo agropecuario provincial.', '["Direccion de Vialidad", "Direccion Administrativa Financiera", "Direccion de Planificacion", "Direccion de Gestion Ambiental"]', 'EC');

-- ============================================================================
-- 6. UMBRALES DE CONTRATACION 2026
-- PIE 2026 estimado: $36,600,000,000 (Presupuesto Inicial del Estado)
-- ============================================================================

INSERT INTO cp_procurement_thresholds (country_code, fiscal_year, pie_value, threshold_code, procedure_name, min_coefficient, max_coefficient, min_value, max_value, applicable_types, legal_reference, is_active) VALUES
('EC', 2026, 36600000000.00, 'INFIMA_CUANTIA', 'Infima Cuantia', 0, 0.0000002, 0.00, 7320.00, '["BIEN", "SERVICIO"]', 'Art. 52.1 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'CATALOGO_ELECTRONICO', 'Catalogo Electronico', NULL, NULL, NULL, NULL, '["BIEN", "SERVICIO"]', 'Art. 46 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'SUBASTA_INVERSA', 'Subasta Inversa Electronica', 0.0000002, NULL, 7320.00, NULL, '["BIEN", "SERVICIO"]', 'Art. 47 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'MENOR_CUANTIA_BS', 'Menor Cuantia - Bienes y Servicios', 0.0000002, 0.000002, 7320.00, 73200.00, '["BIEN", "SERVICIO"]', 'Art. 51 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'COTIZACION_BS', 'Cotizacion - Bienes y Servicios', 0.000002, 0.000015, 73200.00, 549000.00, '["BIEN", "SERVICIO"]', 'Art. 50 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'LICITACION_BS', 'Licitacion - Bienes y Servicios', 0.000015, NULL, 549000.00, NULL, '["BIEN", "SERVICIO"]', 'Art. 48 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'MENOR_CUANTIA_OBRA', 'Menor Cuantia - Obras', 0.0000002, 0.000007, 7320.00, 256200.00, '["OBRA"]', 'Art. 51 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'COTIZACION_OBRA', 'Cotizacion - Obras', 0.000007, 0.00003, 256200.00, 1098000.00, '["OBRA"]', 'Art. 50 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'LICITACION_OBRA', 'Licitacion - Obras', 0.00003, NULL, 1098000.00, NULL, '["OBRA"]', 'Art. 48 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'CONTRATACION_DIRECTA_CONSULTORIA', 'Contratacion Directa - Consultoria', 0, 0.000002, 0.00, 73200.00, '["CONSULTORIA"]', 'Art. 40 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'LISTA_CORTA_CONSULTORIA', 'Lista Corta - Consultoria', 0.000002, 0.000015, 73200.00, 549000.00, '["CONSULTORIA"]', 'Art. 40 LOSNCP', TRUE),
('EC', 2026, 36600000000.00, 'CONCURSO_PUBLICO_CONSULTORIA', 'Concurso Publico - Consultoria', 0.000015, NULL, 549000.00, NULL, '["CONSULTORIA"]', 'Art. 40 LOSNCP', TRUE);

-- ============================================================================
-- 7. FIELD MAPPINGS (fase -> campo del formulario PAA)
-- ============================================================================

-- Phase 1: Contexto Institucional -> campos de entidad
SET @phase1_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'CONTEXTO_INSTITUCIONAL');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order) VALUES
(@phase1_id, 'ENTIDAD_NOMBRE', '$.entityName', 'DIRECT', 1),
(@phase1_id, 'RUC_ENTIDAD', '$.entityRuc', 'DIRECT', 2),
(@phase1_id, 'SECTOR', '$.sectorCode', 'DIRECT', 3);

-- Phase 2: Marco Presupuestario -> campos de presupuesto
SET @phase2_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'MARCO_PRESUPUESTARIO');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order) VALUES
(@phase2_id, 'PRESUPUESTO_REFERENCIAL', '$.totalBudget', 'DIRECT', 1),
(@phase2_id, 'FUENTE_FINANCIAMIENTO', '$.budgetBySource', 'DIRECT', 2);

-- Phase 3: Necesidades -> items del PAA
SET @phase3_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'LEVANTAMIENTO_NECESIDADES');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order) VALUES
(@phase3_id, 'OBJETO_CONTRATACION', '$.items[*].description', 'DIRECT', 1),
(@phase3_id, 'CODIGO_CPC', '$.items[*].cpcCode', 'DIRECT', 2),
(@phase3_id, 'TIPO_COMPRA', '$.items[*].type', 'DIRECT', 3);

-- Phase 6: Estrategia -> procedimiento asignado
SET @phase6_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'ESTRATEGIA_CONTRATACION');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order) VALUES
(@phase6_id, 'TIPO_PROCESO', '$.items[*].procedure', 'DIRECT', 1);

-- Phase 7: Calendarizacion -> fechas
SET @phase7_id = (SELECT id FROM cp_paa_methodology_phase WHERE methodology_id = @meth_cips_id AND phase_code = 'CALENDARIZACION_VALIDACION');

INSERT INTO cp_paa_phase_field_mapping (phase_id, field_code, extraction_path, transform_type, display_order) VALUES
(@phase7_id, 'FECHA_PUBLICACION', '$.items[*].publicationDate', 'DIRECT', 1),
(@phase7_id, 'PERIODO_CONTRATACION', '$.items[*].quarter', 'DIRECT', 2);
