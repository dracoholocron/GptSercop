-- =====================================================================
-- V20260303_5: Seed event types, flows, and fields for remaining CP types
-- Types: CONTRATACION_DIRECTA, CONSULTORIA, CONTRATACION_SEGUROS, ARRENDAMIENTO_INMUEBLES
-- =====================================================================

-- =====================================================================
-- 1. EVENT TYPES (Spanish + English)
-- =====================================================================

-- CONTRATACION_DIRECTA (Art. 92-94 LOSNCP)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_CD_PREPARACION', 'Fase Preparatoria', 'CONTRATACION_DIRECTA', 1, 'Justificación, resolución de inicio y documentos habilitantes', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'es'),
('CP_CD_PREPARACION', 'Preparation Phase', 'CONTRATACION_DIRECTA', 1, 'Justification, start resolution and enabling documents', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'en'),
('CP_CD_INVITACION', 'Invitación al Proveedor', 'CONTRATACION_DIRECTA', 2, 'Invitación directa al proveedor seleccionado', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'es'),
('CP_CD_INVITACION', 'Supplier Invitation', 'CONTRATACION_DIRECTA', 2, 'Direct invitation to selected supplier', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'en'),
('CP_CD_NEGOCIACION', 'Negociación', 'CONTRATACION_DIRECTA', 3, 'Negociación de condiciones con el proveedor', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'es'),
('CP_CD_NEGOCIACION', 'Negotiation', 'CONTRATACION_DIRECTA', 3, 'Negotiation of conditions with supplier', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'en'),
('CP_CD_ADJUDICACION', 'Adjudicación', 'CONTRATACION_DIRECTA', 4, 'Resolución de adjudicación directa', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'es'),
('CP_CD_ADJUDICACION', 'Award', 'CONTRATACION_DIRECTA', 4, 'Direct award resolution', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'en'),
('CP_CD_CONTRATACION', 'Contratación', 'CONTRATACION_DIRECTA', 5, 'Firma de contrato y garantías', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'es'),
('CP_CD_CONTRATACION', 'Contracting', 'CONTRATACION_DIRECTA', 5, 'Contract signing and guarantees', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'en'),
('CP_CD_EJECUCION', 'Ejecución', 'CONTRATACION_DIRECTA', 6, 'Ejecución contractual y recepción', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'es'),
('CP_CD_EJECUCION', 'Execution', 'CONTRATACION_DIRECTA', 6, 'Contract execution and delivery', 'CONTRATACION_DIRECTA', 'CONTRATACION_DIRECTA', 1, 'en');

-- CONSULTORIA (Art. 36-40 LOSNCP)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_CON_PREPARACION', 'Fase Preparatoria', 'CONSULTORIA', 1, 'Términos de referencia y documentos precontractuales', 'CONSULTORIA', 'CONSULTORIA', 1, 'es'),
('CP_CON_PREPARACION', 'Preparation Phase', 'CONSULTORIA', 1, 'Terms of reference and pre-contractual documents', 'CONSULTORIA', 'CONSULTORIA', 1, 'en'),
('CP_CON_CONVOCATORIA', 'Convocatoria', 'CONSULTORIA', 2, 'Publicación de convocatoria en portal SERCOP', 'CONSULTORIA', 'CONSULTORIA', 1, 'es'),
('CP_CON_CONVOCATORIA', 'Call for Proposals', 'CONSULTORIA', 2, 'Publication of call on SERCOP portal', 'CONSULTORIA', 'CONSULTORIA', 1, 'en'),
('CP_CON_OFERTAS', 'Recepción de Ofertas', 'CONSULTORIA', 3, 'Recepción de propuestas técnicas y económicas', 'CONSULTORIA', 'CONSULTORIA', 1, 'es'),
('CP_CON_OFERTAS', 'Proposal Reception', 'CONSULTORIA', 3, 'Reception of technical and economic proposals', 'CONSULTORIA', 'CONSULTORIA', 1, 'en'),
('CP_CON_EVALUACION', 'Evaluación', 'CONSULTORIA', 4, 'Evaluación técnica sobre 80% y económica sobre 20%', 'CONSULTORIA', 'CONSULTORIA', 1, 'es'),
('CP_CON_EVALUACION', 'Evaluation', 'CONSULTORIA', 4, 'Technical evaluation 80% and economic evaluation 20%', 'CONSULTORIA', 'CONSULTORIA', 1, 'en'),
('CP_CON_NEGOCIACION', 'Negociación', 'CONSULTORIA', 5, 'Negociación con el mejor evaluado', 'CONSULTORIA', 'CONSULTORIA', 1, 'es'),
('CP_CON_NEGOCIACION', 'Negotiation', 'CONSULTORIA', 5, 'Negotiation with highest-ranked bidder', 'CONSULTORIA', 'CONSULTORIA', 1, 'en'),
('CP_CON_ADJUDICACION', 'Adjudicación', 'CONSULTORIA', 6, 'Resolución de adjudicación', 'CONSULTORIA', 'CONSULTORIA', 1, 'es'),
('CP_CON_ADJUDICACION', 'Award', 'CONSULTORIA', 6, 'Award resolution', 'CONSULTORIA', 'CONSULTORIA', 1, 'en'),
('CP_CON_CONTRATACION', 'Contratación', 'CONSULTORIA', 7, 'Firma de contrato de consultoría', 'CONSULTORIA', 'CONSULTORIA', 1, 'es'),
('CP_CON_CONTRATACION', 'Contracting', 'CONSULTORIA', 7, 'Consultancy contract signing', 'CONSULTORIA', 'CONSULTORIA', 1, 'en');

-- CONTRATACION_SEGUROS (Art. 2 numeral 14 LOSNCP)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_SEG_PREPARACION', 'Fase Preparatoria', 'CONTRATACION_SEGUROS', 1, 'Definición de riesgos y coberturas requeridas', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'es'),
('CP_SEG_PREPARACION', 'Preparation Phase', 'CONTRATACION_SEGUROS', 1, 'Risk definition and required coverage', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'en'),
('CP_SEG_CONVOCATORIA', 'Convocatoria', 'CONTRATACION_SEGUROS', 2, 'Invitación a aseguradoras calificadas', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'es'),
('CP_SEG_CONVOCATORIA', 'Call for Proposals', 'CONTRATACION_SEGUROS', 2, 'Invitation to qualified insurers', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'en'),
('CP_SEG_EVALUACION', 'Evaluación de Ofertas', 'CONTRATACION_SEGUROS', 3, 'Evaluación técnica y económica de pólizas ofertadas', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'es'),
('CP_SEG_EVALUACION', 'Proposal Evaluation', 'CONTRATACION_SEGUROS', 3, 'Technical and economic evaluation of insurance proposals', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'en'),
('CP_SEG_ADJUDICACION', 'Adjudicación', 'CONTRATACION_SEGUROS', 4, 'Resolución de adjudicación de póliza', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'es'),
('CP_SEG_ADJUDICACION', 'Award', 'CONTRATACION_SEGUROS', 4, 'Insurance policy award resolution', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'en'),
('CP_SEG_CONTRATACION', 'Contratación', 'CONTRATACION_SEGUROS', 5, 'Emisión de póliza y firma de contrato', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'es'),
('CP_SEG_CONTRATACION', 'Contracting', 'CONTRATACION_SEGUROS', 5, 'Policy issuance and contract signing', 'CONTRATACION_SEGUROS', 'CONTRATACION_SEGUROS', 1, 'en');

-- ARRENDAMIENTO_INMUEBLES (Art. 59 LOSNCP)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_ARR_PREPARACION', 'Fase Preparatoria', 'ARRENDAMIENTO_INMUEBLES', 1, 'Informe de necesidad, estudio de mercado y avalúo', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'es'),
('CP_ARR_PREPARACION', 'Preparation Phase', 'ARRENDAMIENTO_INMUEBLES', 1, 'Needs report, market study and appraisal', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'en'),
('CP_ARR_BUSQUEDA', 'Búsqueda de Inmueble', 'ARRENDAMIENTO_INMUEBLES', 2, 'Identificación y verificación de inmuebles disponibles', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'es'),
('CP_ARR_BUSQUEDA', 'Property Search', 'ARRENDAMIENTO_INMUEBLES', 2, 'Identification and verification of available properties', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'en'),
('CP_ARR_NEGOCIACION', 'Negociación', 'ARRENDAMIENTO_INMUEBLES', 3, 'Negociación de condiciones y canon de arrendamiento', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'es'),
('CP_ARR_NEGOCIACION', 'Negotiation', 'ARRENDAMIENTO_INMUEBLES', 3, 'Negotiation of conditions and lease terms', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'en'),
('CP_ARR_CONTRATACION', 'Contratación', 'ARRENDAMIENTO_INMUEBLES', 4, 'Firma de contrato de arrendamiento', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'es'),
('CP_ARR_CONTRATACION', 'Contracting', 'ARRENDAMIENTO_INMUEBLES', 4, 'Lease contract signing', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'en'),
('CP_ARR_EJECUCION', 'Ejecución', 'ARRENDAMIENTO_INMUEBLES', 5, 'Vigencia del arrendamiento y pagos periódicos', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'es'),
('CP_ARR_EJECUCION', 'Execution', 'ARRENDAMIENTO_INMUEBLES', 5, 'Lease term and periodic payments', 'ARRENDAMIENTO_INMUEBLES', 'ARRENDAMIENTO_INMUEBLES', 1, 'en');


-- =====================================================================
-- 2. EVENT FLOWS (Spanish + English)
-- =====================================================================

-- CONTRATACION_DIRECTA flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_CD_PREPARACION', 'CP_CD_INVITACION', 'CONTRATACION_DIRECTA', 1, 'es', 'Iniciar Invitación'),
('CP_CD_PREPARACION', 'CP_CD_INVITACION', 'CONTRATACION_DIRECTA', 1, 'en', 'Start Invitation'),
('CP_CD_INVITACION', 'CP_CD_NEGOCIACION', 'CONTRATACION_DIRECTA', 1, 'es', 'Iniciar Negociación'),
('CP_CD_INVITACION', 'CP_CD_NEGOCIACION', 'CONTRATACION_DIRECTA', 1, 'en', 'Start Negotiation'),
('CP_CD_NEGOCIACION', 'CP_CD_ADJUDICACION', 'CONTRATACION_DIRECTA', 1, 'es', 'Adjudicar'),
('CP_CD_NEGOCIACION', 'CP_CD_ADJUDICACION', 'CONTRATACION_DIRECTA', 1, 'en', 'Award'),
('CP_CD_ADJUDICACION', 'CP_CD_CONTRATACION', 'CONTRATACION_DIRECTA', 1, 'es', 'Firmar Contrato'),
('CP_CD_ADJUDICACION', 'CP_CD_CONTRATACION', 'CONTRATACION_DIRECTA', 1, 'en', 'Sign Contract'),
('CP_CD_CONTRATACION', 'CP_CD_EJECUCION', 'CONTRATACION_DIRECTA', 1, 'es', 'Iniciar Ejecución'),
('CP_CD_CONTRATACION', 'CP_CD_EJECUCION', 'CONTRATACION_DIRECTA', 1, 'en', 'Start Execution');

-- CONSULTORIA flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_CON_PREPARACION', 'CP_CON_CONVOCATORIA', 'CONSULTORIA', 1, 'es', 'Publicar Convocatoria'),
('CP_CON_PREPARACION', 'CP_CON_CONVOCATORIA', 'CONSULTORIA', 1, 'en', 'Publish Call'),
('CP_CON_CONVOCATORIA', 'CP_CON_OFERTAS', 'CONSULTORIA', 1, 'es', 'Recibir Ofertas'),
('CP_CON_CONVOCATORIA', 'CP_CON_OFERTAS', 'CONSULTORIA', 1, 'en', 'Receive Proposals'),
('CP_CON_OFERTAS', 'CP_CON_EVALUACION', 'CONSULTORIA', 1, 'es', 'Evaluar'),
('CP_CON_OFERTAS', 'CP_CON_EVALUACION', 'CONSULTORIA', 1, 'en', 'Evaluate'),
('CP_CON_EVALUACION', 'CP_CON_NEGOCIACION', 'CONSULTORIA', 1, 'es', 'Negociar'),
('CP_CON_EVALUACION', 'CP_CON_NEGOCIACION', 'CONSULTORIA', 1, 'en', 'Negotiate'),
('CP_CON_NEGOCIACION', 'CP_CON_ADJUDICACION', 'CONSULTORIA', 1, 'es', 'Adjudicar'),
('CP_CON_NEGOCIACION', 'CP_CON_ADJUDICACION', 'CONSULTORIA', 1, 'en', 'Award'),
('CP_CON_ADJUDICACION', 'CP_CON_CONTRATACION', 'CONSULTORIA', 1, 'es', 'Firmar Contrato'),
('CP_CON_ADJUDICACION', 'CP_CON_CONTRATACION', 'CONSULTORIA', 1, 'en', 'Sign Contract');

-- CONTRATACION_SEGUROS flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_SEG_PREPARACION', 'CP_SEG_CONVOCATORIA', 'CONTRATACION_SEGUROS', 1, 'es', 'Publicar Convocatoria'),
('CP_SEG_PREPARACION', 'CP_SEG_CONVOCATORIA', 'CONTRATACION_SEGUROS', 1, 'en', 'Publish Call'),
('CP_SEG_CONVOCATORIA', 'CP_SEG_EVALUACION', 'CONTRATACION_SEGUROS', 1, 'es', 'Evaluar Ofertas'),
('CP_SEG_CONVOCATORIA', 'CP_SEG_EVALUACION', 'CONTRATACION_SEGUROS', 1, 'en', 'Evaluate Proposals'),
('CP_SEG_EVALUACION', 'CP_SEG_ADJUDICACION', 'CONTRATACION_SEGUROS', 1, 'es', 'Adjudicar'),
('CP_SEG_EVALUACION', 'CP_SEG_ADJUDICACION', 'CONTRATACION_SEGUROS', 1, 'en', 'Award'),
('CP_SEG_ADJUDICACION', 'CP_SEG_CONTRATACION', 'CONTRATACION_SEGUROS', 1, 'es', 'Emitir Póliza'),
('CP_SEG_ADJUDICACION', 'CP_SEG_CONTRATACION', 'CONTRATACION_SEGUROS', 1, 'en', 'Issue Policy');

-- ARRENDAMIENTO_INMUEBLES flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_ARR_PREPARACION', 'CP_ARR_BUSQUEDA', 'ARRENDAMIENTO_INMUEBLES', 1, 'es', 'Buscar Inmueble'),
('CP_ARR_PREPARACION', 'CP_ARR_BUSQUEDA', 'ARRENDAMIENTO_INMUEBLES', 1, 'en', 'Search Property'),
('CP_ARR_BUSQUEDA', 'CP_ARR_NEGOCIACION', 'ARRENDAMIENTO_INMUEBLES', 1, 'es', 'Negociar'),
('CP_ARR_BUSQUEDA', 'CP_ARR_NEGOCIACION', 'ARRENDAMIENTO_INMUEBLES', 1, 'en', 'Negotiate'),
('CP_ARR_NEGOCIACION', 'CP_ARR_CONTRATACION', 'ARRENDAMIENTO_INMUEBLES', 1, 'es', 'Firmar Contrato'),
('CP_ARR_NEGOCIACION', 'CP_ARR_CONTRATACION', 'ARRENDAMIENTO_INMUEBLES', 1, 'en', 'Sign Contract'),
('CP_ARR_CONTRATACION', 'CP_ARR_EJECUCION', 'ARRENDAMIENTO_INMUEBLES', 1, 'es', 'Iniciar Vigencia'),
('CP_ARR_CONTRATACION', 'CP_ARR_EJECUCION', 'ARRENDAMIENTO_INMUEBLES', 1, 'en', 'Start Term');


-- =====================================================================
-- 3. FIELD CONFIGS (with AI prompts and validations)
-- =====================================================================

-- ----- CONTRATACION_DIRECTA fields -----

-- PREPARACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_OBJETO:', 'cp.field.objeto', 'cp.field.objeto.desc', 'CONTRATACION_DIRECTA', 'PREPARACION', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.objeto.placeholder',
 '{"required":true,"minLength":20,"maxLength":500}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el OBJETO DE CONTRATACIÓN para Contratación Directa (Art. 92-94 LOSNCP). Debe:\n1. Justificar por qué aplica contratación directa (proveedor único, exclusividad, etc.)\n2. Ser claro y específico sobre el bien/servicio\n3. Indicar la causal legal aplicable\nResponde en español.',
 'Valida que el objeto sea específico, no genérico, y justifique la contratación directa según LOSNCP Art. 92-94.', '2024', NOW()),

(UUID(), ':CP_JUSTIFICACION_DIRECTA:', 'cp.field.justificacionDirecta', 'cp.field.justificacionDirecta.desc', 'CONTRATACION_DIRECTA', 'PREPARACION', 2, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.justificacionDirecta.placeholder',
 '{"required":true,"minLength":50,"maxLength":2000}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con la JUSTIFICACIÓN DE CONTRATACIÓN DIRECTA. Las causales del Art. 92 LOSNCP son:\n1. Proveedor único (monopolio legal o de hecho)\n2. Bienes/servicios únicos en el mercado con un solo proveedor\n3. Transporte de correo internacional\n4. Adquisición de repuestos/accesorios del fabricante o distribuidores autorizados\n5. Bienes o servicios específicos para defensa nacional\nLa justificación debe demostrar documentadamente por qué no existe otro proveedor.\nResponde en español.',
 'Valida que la justificación cite una causal válida del Art. 92 LOSNCP y sea sustentada documentalmente.', '2024', NOW()),

(UUID(), ':CP_PRESUPUESTO:', 'cp.field.presupuesto', 'cp.field.presupuesto.desc', 'CONTRATACION_DIRECTA', 'PREPARACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.presupuesto.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el PRESUPUESTO REFERENCIAL para Contratación Directa. No hay límite máximo de monto para este proceso. Debe basarse en estudio de mercado o cotización del proveedor único. Incluir certificación presupuestaria.\nResponde en español.',
 'Valida que el presupuesto sea positivo y tenga respaldo documental.', '2024', NOW()),

(UUID(), ':CP_CERT_PRESUP:', 'cp.field.certPresup', 'cp.field.certPresup.desc', 'CONTRATACION_DIRECTA', 'PREPARACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.certPresup.placeholder',
 '{"required":true,"pattern":"^[A-Za-z0-9\\\\-/]+$"}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con la CERTIFICACIÓN PRESUPUESTARIA para Contratación Directa. Es obligatoria según Art. 24 LOSNCP. Debe ser emitida por la Dirección Financiera antes de iniciar el proceso.\nResponde en español.',
 'Valida formato de certificación presupuestaria.', '2024', NOW()),

(UUID(), ':CP_RESOLUCION_INICIO:', 'cp.field.resolucionInicio', 'cp.field.resolucionInicio.desc', 'CONTRATACION_DIRECTA', 'PREPARACION', 5, 1, 1, 'TEXT', 'INPUT', 'cp.field.resolucionInicio.placeholder',
 '{"required":true}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con la RESOLUCIÓN DE INICIO para Contratación Directa. La máxima autoridad o su delegado emite resolución motivada que aprueba los pliegos y cronograma.\nResponde en español.',
 'Valida que se ingrese el número de resolución.', '2024', NOW());

-- INVITACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_PROVEEDOR_RUC:', 'cp.field.proveedorRuc', 'cp.field.proveedorRuc.desc', 'CONTRATACION_DIRECTA', 'INVITACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.proveedorRuc.placeholder',
 '{"required":true,"pattern":"^[0-9]{13}$","maxLength":13}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el RUC DEL PROVEEDOR invitado directamente. Debe ser un RUC válido de 13 dígitos registrado en el RUP (Registro Único de Proveedores) del SERCOP y estar habilitado para contratar con el Estado.\nResponde en español.',
 'Valida que sea un RUC de 13 dígitos numéricos.', '2024', NOW()),

(UUID(), ':CP_PROVEEDOR_NOMBRE:', 'cp.field.proveedorNombre', 'cp.field.proveedorNombre.desc', 'CONTRATACION_DIRECTA', 'INVITACION', 2, 1, 1, 'TEXT', 'INPUT', 'cp.field.proveedorNombre.placeholder',
 '{"required":true,"minLength":3,"maxLength":200}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el NOMBRE DEL PROVEEDOR para Contratación Directa. Debe coincidir exactamente con la razón social registrada en el RUP del SERCOP.\nResponde en español.',
 'Valida nombre del proveedor.', '2024', NOW()),

(UUID(), ':CP_FECHA_INVITACION:', 'cp.field.fechaInvitacion', 'cp.field.fechaInvitacion.desc', 'CONTRATACION_DIRECTA', 'INVITACION', 3, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaInvitacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE INVITACIÓN al proveedor en Contratación Directa. La invitación se realiza a través del portal de SERCOP.\nResponde en español.',
 'Valida que sea una fecha válida.', '2024', NOW());

-- ADJUDICACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_RESOLUCION_ADJUDICACION:', 'cp.field.resolucionAdjudicacion', 'cp.field.resolucionAdjudicacion.desc', 'CONTRATACION_DIRECTA', 'ADJUDICACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.resolucionAdjudicacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la RESOLUCIÓN DE ADJUDICACIÓN para Contratación Directa. La máxima autoridad emite resolución motivada adjudicando al proveedor invitado.\nResponde en español.',
 'Valida número de resolución.', '2024', NOW()),

(UUID(), ':CP_MONTO_ADJUDICADO:', 'cp.field.montoAdjudicado', 'cp.field.montoAdjudicado.desc', 'CONTRATACION_DIRECTA', 'ADJUDICACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoAdjudicado.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO ADJUDICADO en Contratación Directa. Debe ser igual o menor al presupuesto referencial negociado.\nResponde en español.',
 'Valida que el monto sea positivo.', '2024', NOW());

-- CONTRATACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_NUMERO_CONTRATO:', 'cp.field.numeroContrato', 'cp.field.numeroContrato.desc', 'CONTRATACION_DIRECTA', 'CONTRATACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.numeroContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con el NÚMERO DE CONTRATO para Contratación Directa. El contrato debe suscribirse dentro del plazo establecido en los pliegos.\nResponde en español.',
 'Valida número de contrato.', '2024', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'cp.field.fechaContrato', 'cp.field.fechaContrato.desc', 'CONTRATACION_DIRECTA', 'CONTRATACION', 2, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE CONTRATO. Debe ser posterior a la resolución de adjudicación.\nResponde en español.',
 'Valida fecha de contrato.', '2024', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'cp.field.montoContrato', 'cp.field.montoContrato.desc', 'CONTRATACION_DIRECTA', 'CONTRATACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoContrato.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO DEL CONTRATO. Debe coincidir con el monto adjudicado.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()),

(UUID(), ':CP_PLAZO_CONTRATO:', 'cp.field.plazoContrato', 'cp.field.plazoContrato.desc', 'CONTRATACION_DIRECTA', 'CONTRATACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.plazoContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con el PLAZO DEL CONTRATO. Expresar en días calendario. El plazo comienza a partir de la fecha establecida en el contrato o la entrega del anticipo si corresponde.\nResponde en español.',
 'Valida plazo del contrato.', '2024', NOW());

-- EJECUCION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_ACTA_RECEPCION:', 'cp.field.actaRecepcion', 'cp.field.actaRecepcion.desc', 'CONTRATACION_DIRECTA', 'EJECUCION', 1, 0, 1, 'TEXT', 'INPUT', 'cp.field.actaRecepcion.placeholder',
 '{"required":false}', 1,
 'Ayuda con el ACTA DE RECEPCIÓN para Contratación Directa. Puede ser provisional o definitiva según Art. 81 LOSNCP.\nResponde en español.',
 'Valida número de acta.', '2024', NOW()),

(UUID(), ':CP_FECHA_RECEPCION:', 'cp.field.fechaRecepcion', 'cp.field.fechaRecepcion.desc', 'CONTRATACION_DIRECTA', 'EJECUCION', 2, 0, 1, 'DATE', 'INPUT', 'cp.field.fechaRecepcion.placeholder',
 '{"required":false}', 1,
 'Ayuda con la FECHA DE RECEPCIÓN del bien/servicio.\nResponde en español.',
 'Valida fecha.', '2024', NOW());


-- ----- CONSULTORIA fields -----

-- PREPARACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_OBJETO:', 'cp.field.objeto', 'cp.field.objeto.desc', 'CONSULTORIA', 'PREPARACION', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.objeto.placeholder',
 '{"required":true,"minLength":20,"maxLength":500}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el OBJETO DE CONSULTORÍA (Art. 36 LOSNCP). La consultoría comprende:\n1. Estudios de prefactibilidad y factibilidad\n2. Estudios y diseños de proyectos\n3. Fiscalización de proyectos\n4. Asesoría y asistencia técnica\n5. Auditoría\nEl objeto debe ser claro y describir los entregables esperados.\nResponde en español.',
 'Valida que el objeto sea específico y corresponda a servicios de consultoría según LOSNCP.', '2024', NOW()),

(UUID(), ':CP_TDR:', 'cp.field.tdr', 'cp.field.tdr.desc', 'CONSULTORIA', 'PREPARACION', 2, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.tdr.placeholder',
 '{"required":true,"minLength":100,"maxLength":5000}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con los TÉRMINOS DE REFERENCIA (TDR) para consultoría. Los TDR deben incluir:\n1. Antecedentes\n2. Objetivos (general y específicos)\n3. Alcance del trabajo\n4. Metodología sugerida\n5. Personal técnico requerido (perfiles)\n6. Plazo de ejecución\n7. Productos/entregables esperados\n8. Presupuesto referencial desglosado\n9. Forma de pago\nResponde en español con estructura recomendada.',
 'Valida que los TDR contengan al menos objetivos, alcance y entregables.', '2024', NOW()),

(UUID(), ':CP_PRESUPUESTO:', 'cp.field.presupuesto', 'cp.field.presupuesto.desc', 'CONSULTORIA', 'PREPARACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.presupuesto.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el PRESUPUESTO REFERENCIAL para consultoría. Los montos definen el tipo de proceso:\n- Consultoría Directa: hasta $72,634.22\n- Consultoría Lista Corta: entre $72,634.22 y $544,756.64\n- Consultoría Concurso Público: mayor a $544,756.64\nDebe incluir desglose de costos directos e indirectos.\nResponde en español.',
 'Valida monto positivo coherente con el tipo de consultoría.', '2024', NOW()),

(UUID(), ':CP_CERT_PRESUP:', 'cp.field.certPresup', 'cp.field.certPresup.desc', 'CONSULTORIA', 'PREPARACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.certPresup.placeholder',
 '{"required":true,"pattern":"^[A-Za-z0-9\\\\-/]+$"}', 1,
 'Ayuda con la CERTIFICACIÓN PRESUPUESTARIA para consultoría. Obligatoria según Art. 24 LOSNCP.\nResponde en español.',
 'Valida formato de certificación.', '2024', NOW()),

(UUID(), ':CP_RESOLUCION_INICIO:', 'cp.field.resolucionInicio', 'cp.field.resolucionInicio.desc', 'CONSULTORIA', 'PREPARACION', 5, 1, 1, 'TEXT', 'INPUT', 'cp.field.resolucionInicio.placeholder',
 '{"required":true}', 1,
 'Ayuda con la RESOLUCIÓN DE INICIO para consultoría. La máxima autoridad aprueba los pliegos y el cronograma del proceso.\nResponde en español.',
 'Valida número de resolución.', '2024', NOW());

-- CONVOCATORIA
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_FECHA_PUBLICACION:', 'cp.field.fechaPublicacion', 'cp.field.fechaPublicacion.desc', 'CONSULTORIA', 'CONVOCATORIA', 1, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaPublicacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE PUBLICACIÓN de la convocatoria de consultoría en el portal de SERCOP.\nResponde en español.',
 'Valida fecha.', '2024', NOW()),

(UUID(), ':CP_PLAZO_OFERTAS:', 'cp.field.plazoOfertas', 'cp.field.plazoOfertas.desc', 'CONSULTORIA', 'CONVOCATORIA', 2, 1, 1, 'TEXT', 'INPUT', 'cp.field.plazoOfertas.placeholder',
 '{"required":true}', 1,
 'Ayuda con el PLAZO PARA PRESENTAR OFERTAS de consultoría. Mínimo 10 días para lista corta, 20 días para concurso público, según resolución SERCOP.\nResponde en español.',
 'Valida plazo de ofertas.', '2024', NOW()),

(UUID(), ':CP_REQUISITOS_MINIMOS:', 'cp.field.requisitosMinimos', 'cp.field.requisitosMinimos.desc', 'CONSULTORIA', 'CONVOCATORIA', 3, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.requisitosMinimos.placeholder',
 '{"required":true,"minLength":20}', 1,
 'Ayuda con los REQUISITOS MÍNIMOS para consultores. Incluyen:\n1. Experiencia general del consultor\n2. Experiencia específica en trabajos similares\n3. Personal técnico clave con perfiles requeridos\n4. Equipamiento si aplica\n5. Metodología de trabajo\nSegún Art. 37 LOSNCP.\nResponde en español.',
 'Valida que los requisitos sean claros y no restrictivos.', '2024', NOW());

-- EVALUACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_CRITERIO_EVALUACION:', 'cp.field.criterioEvaluacion', 'cp.field.criterioEvaluacion.desc', 'CONSULTORIA', 'EVALUACION', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.criterioEvaluacion.placeholder',
 '{"required":true,"minLength":20}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con los CRITERIOS DE EVALUACIÓN para consultoría. Según Art. 38 LOSNCP:\n- Propuesta técnica: 80% (experiencia, personal clave, metodología, plan de trabajo)\n- Propuesta económica: 20%\nLa evaluación es por calidad y costo (80/20). No se puede modificar esta ponderación.\nResponde en español.',
 'Valida criterios de evaluación consistentes con ponderación 80/20.', '2024', NOW()),

(UUID(), ':CP_NUM_OFERTAS_RECIBIDAS:', 'cp.field.numOfertasRecibidas', 'cp.field.numOfertasRecibidas.desc', 'CONSULTORIA', 'EVALUACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.numOfertasRecibidas.placeholder',
 '{"required":true,"minValue":1}', 1,
 'Ayuda con el NÚMERO DE OFERTAS RECIBIDAS en consultoría. Para lista corta se invitan mínimo 3 consultores, para concurso público es abierto.\nResponde en español.',
 'Valida número positivo.', '2024', NOW()),

(UUID(), ':CP_PUNTAJE_TECNICO:', 'cp.field.puntajeTecnico', 'cp.field.puntajeTecnico.desc', 'CONSULTORIA', 'EVALUACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.puntajeTecnico.placeholder',
 '{"required":true,"minValue":0,"maxValue":80}', 1,
 'Ayuda con el PUNTAJE TÉCNICO del mejor evaluado. Máximo 80 puntos según la ponderación 80/20 de consultoría Art. 38 LOSNCP.\nResponde en español.',
 'Valida que esté entre 0 y 80.', '2024', NOW());

-- ADJUDICACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_ADJUDICATARIO_NOMBRE:', 'cp.field.adjudicatarioNombre', 'cp.field.adjudicatarioNombre.desc', 'CONSULTORIA', 'ADJUDICACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.adjudicatarioNombre.placeholder',
 '{"required":true,"minLength":3}', 1,
 'Ayuda con el NOMBRE DEL CONSULTOR ADJUDICADO. Debe corresponder al mejor evaluado en la negociación según Art. 39 LOSNCP.\nResponde en español.',
 'Valida nombre del adjudicatario.', '2024', NOW()),

(UUID(), ':CP_MONTO_ADJUDICADO:', 'cp.field.montoAdjudicado', 'cp.field.montoAdjudicado.desc', 'CONSULTORIA', 'ADJUDICACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoAdjudicado.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO ADJUDICADO de consultoría. Resultado de la negociación con el mejor evaluado. No puede exceder el presupuesto referencial.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()),

(UUID(), ':CP_RESOLUCION_ADJUDICACION:', 'cp.field.resolucionAdjudicacion', 'cp.field.resolucionAdjudicacion.desc', 'CONSULTORIA', 'ADJUDICACION', 3, 1, 1, 'TEXT', 'INPUT', 'cp.field.resolucionAdjudicacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la RESOLUCIÓN DE ADJUDICACIÓN de consultoría.\nResponde en español.',
 'Valida número de resolución.', '2024', NOW());

-- CONTRATACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_NUMERO_CONTRATO:', 'cp.field.numeroContrato', 'cp.field.numeroContrato.desc', 'CONSULTORIA', 'CONTRATACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.numeroContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con el NÚMERO DE CONTRATO de consultoría. Según Art. 69 LOSNCP debe incluir cláusulas de multas y garantías.\nResponde en español.',
 'Valida número de contrato.', '2024', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'cp.field.fechaContrato', 'cp.field.fechaContrato.desc', 'CONSULTORIA', 'CONTRATACION', 2, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE CONTRATO de consultoría.\nResponde en español.',
 'Valida fecha.', '2024', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'cp.field.montoContrato', 'cp.field.montoContrato.desc', 'CONSULTORIA', 'CONTRATACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoContrato.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO DEL CONTRATO de consultoría.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()),

(UUID(), ':CP_PLAZO_CONTRATO:', 'cp.field.plazoContrato', 'cp.field.plazoContrato.desc', 'CONSULTORIA', 'CONTRATACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.plazoContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con el PLAZO DEL CONTRATO de consultoría. Expresar en días calendario. Debe ser consistente con los TDR y el cronograma propuesto por el consultor.\nResponde en español.',
 'Valida plazo.', '2024', NOW());


-- ----- CONTRATACION_SEGUROS fields -----

-- PREPARACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_OBJETO:', 'cp.field.objeto', 'cp.field.objeto.desc', 'CONTRATACION_SEGUROS', 'PREPARACION', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.objeto.placeholder',
 '{"required":true,"minLength":20,"maxLength":500}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el OBJETO para Contratación de Seguros (Art. 2 numeral 14 LOSNCP). Debe especificar:\n1. Tipo de póliza requerida (vida, vehículos, incendio, responsabilidad civil, etc.)\n2. Bienes o personas asegurados\n3. Coberturas principales requeridas\n4. Periodo de vigencia\nResponde en español.',
 'Valida que el objeto especifique tipo de seguro y cobertura.', '2024', NOW()),

(UUID(), ':CP_TIPO_POLIZA:', 'cp.field.tipoPoliza', 'cp.field.tipoPoliza.desc', 'CONTRATACION_SEGUROS', 'PREPARACION', 2, 1, 1, 'TEXT', 'SELECT', 'cp.field.tipoPoliza.placeholder',
 '{"required":true}', 1,
 'Ayuda con el TIPO DE PÓLIZA. Los principales tipos son:\n- Vida colectiva\n- Vehículos\n- Incendio y líneas aliadas\n- Responsabilidad civil\n- Fidelidad\n- Todo riesgo\n- Equipo electrónico\n- Transporte\nResponde en español.',
 'Valida tipo de póliza.', '2024', NOW()),

(UUID(), ':CP_PRESUPUESTO:', 'cp.field.presupuesto', 'cp.field.presupuesto.desc', 'CONTRATACION_SEGUROS', 'PREPARACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.presupuesto.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el PRESUPUESTO REFERENCIAL para seguros. Basado en cotizaciones de al menos 3 aseguradoras o broker de seguros. Incluir prima neta e impuestos.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()),

(UUID(), ':CP_CERT_PRESUP:', 'cp.field.certPresup', 'cp.field.certPresup.desc', 'CONTRATACION_SEGUROS', 'PREPARACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.certPresup.placeholder',
 '{"required":true,"pattern":"^[A-Za-z0-9\\\\-/]+$"}', 1,
 'Ayuda con la CERTIFICACIÓN PRESUPUESTARIA para contratación de seguros.\nResponde en español.',
 'Valida formato de certificación.', '2024', NOW()),

(UUID(), ':CP_VALOR_ASEGURADO:', 'cp.field.valorAsegurado', 'cp.field.valorAsegurado.desc', 'CONTRATACION_SEGUROS', 'PREPARACION', 5, 1, 1, 'NUMBER', 'INPUT', 'cp.field.valorAsegurado.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el VALOR TOTAL ASEGURADO. Es la suma de los valores de todos los bienes o personas a asegurar. Debe basarse en avalúos actualizados para bienes.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW());

-- CONVOCATORIA
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_FECHA_PUBLICACION:', 'cp.field.fechaPublicacion', 'cp.field.fechaPublicacion.desc', 'CONTRATACION_SEGUROS', 'CONVOCATORIA', 1, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaPublicacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE PUBLICACIÓN de la convocatoria para contratación de seguros.\nResponde en español.',
 'Valida fecha.', '2024', NOW()),

(UUID(), ':CP_PLAZO_OFERTAS:', 'cp.field.plazoOfertas', 'cp.field.plazoOfertas.desc', 'CONTRATACION_SEGUROS', 'CONVOCATORIA', 2, 1, 1, 'TEXT', 'INPUT', 'cp.field.plazoOfertas.placeholder',
 '{"required":true}', 1,
 'Ayuda con el PLAZO PARA PRESENTAR OFERTAS de seguros. Las aseguradoras deben tener plazo suficiente para evaluar riesgos y cotizar.\nResponde en español.',
 'Valida plazo.', '2024', NOW()),

(UUID(), ':CP_COBERTURAS_REQUERIDAS:', 'cp.field.coberturasRequeridas', 'cp.field.coberturasRequeridas.desc', 'CONTRATACION_SEGUROS', 'CONVOCATORIA', 3, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.coberturasRequeridas.placeholder',
 '{"required":true,"minLength":20}', 1,
 'Ayuda con las COBERTURAS REQUERIDAS para la póliza de seguro. Detallar:\n1. Coberturas básicas obligatorias\n2. Coberturas adicionales deseadas\n3. Deducibles aceptables\n4. Exclusiones no aceptables\n5. Límites de indemnización\nResponde en español.',
 'Valida que se especifiquen coberturas.', '2024', NOW());

-- EVALUACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_CRITERIO_EVALUACION:', 'cp.field.criterioEvaluacion', 'cp.field.criterioEvaluacion.desc', 'CONTRATACION_SEGUROS', 'EVALUACION', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.criterioEvaluacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con los CRITERIOS DE EVALUACIÓN para seguros. Considerar:\n1. Calificación de riesgo de la aseguradora (Superintendencia de Compañías)\n2. Coberturas ofrecidas vs. requeridas\n3. Deducibles\n4. Prima cotizada\n5. Experiencia en seguros públicos\n6. Red de servicios\nResponde en español.',
 'Valida criterios de evaluación.', '2024', NOW()),

(UUID(), ':CP_NUM_OFERTAS_RECIBIDAS:', 'cp.field.numOfertasRecibidas', 'cp.field.numOfertasRecibidas.desc', 'CONTRATACION_SEGUROS', 'EVALUACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.numOfertasRecibidas.placeholder',
 '{"required":true,"minValue":1}', 1,
 'Ayuda con el NÚMERO DE OFERTAS RECIBIDAS de aseguradoras.\nResponde en español.',
 'Valida número positivo.', '2024', NOW());

-- ADJUDICACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_ASEGURADORA_NOMBRE:', 'cp.field.aseguradoraNombre', 'cp.field.aseguradoraNombre.desc', 'CONTRATACION_SEGUROS', 'ADJUDICACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.aseguradoraNombre.placeholder',
 '{"required":true,"minLength":3}', 1,
 'Ayuda con el NOMBRE DE LA ASEGURADORA adjudicada. Debe estar registrada y calificada por la Superintendencia de Compañías, Valores y Seguros.\nResponde en español.',
 'Valida nombre de aseguradora.', '2024', NOW()),

(UUID(), ':CP_MONTO_PRIMA:', 'cp.field.montoPrima', 'cp.field.montoPrima.desc', 'CONTRATACION_SEGUROS', 'ADJUDICACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoPrima.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO DE LA PRIMA adjudicada. Incluye prima neta, derechos de emisión, contribución Superintendencia e IVA.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()),

(UUID(), ':CP_RESOLUCION_ADJUDICACION:', 'cp.field.resolucionAdjudicacion', 'cp.field.resolucionAdjudicacion.desc', 'CONTRATACION_SEGUROS', 'ADJUDICACION', 3, 1, 1, 'TEXT', 'INPUT', 'cp.field.resolucionAdjudicacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la RESOLUCIÓN DE ADJUDICACIÓN de la póliza de seguros.\nResponde en español.',
 'Valida número de resolución.', '2024', NOW());

-- CONTRATACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_NUMERO_POLIZA:', 'cp.field.numeroPoliza', 'cp.field.numeroPoliza.desc', 'CONTRATACION_SEGUROS', 'CONTRATACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.numeroPoliza.placeholder',
 '{"required":true}', 1,
 'Ayuda con el NÚMERO DE PÓLIZA emitida por la aseguradora.\nResponde en español.',
 'Valida número de póliza.', '2024', NOW()),

(UUID(), ':CP_FECHA_INICIO_VIGENCIA:', 'cp.field.fechaInicioVigencia', 'cp.field.fechaInicioVigencia.desc', 'CONTRATACION_SEGUROS', 'CONTRATACION', 2, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaInicioVigencia.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE INICIO DE VIGENCIA de la póliza.\nResponde en español.',
 'Valida fecha.', '2024', NOW()),

(UUID(), ':CP_FECHA_FIN_VIGENCIA:', 'cp.field.fechaFinVigencia', 'cp.field.fechaFinVigencia.desc', 'CONTRATACION_SEGUROS', 'CONTRATACION', 3, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaFinVigencia.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE FIN DE VIGENCIA de la póliza. Generalmente 1 año renovable.\nResponde en español.',
 'Valida fecha posterior a inicio de vigencia.', '2024', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'cp.field.montoContrato', 'cp.field.montoContrato.desc', 'CONTRATACION_SEGUROS', 'CONTRATACION', 4, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoContrato.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO TOTAL DEL CONTRATO de seguros (prima total).\nResponde en español.',
 'Valida monto positivo.', '2024', NOW());


-- ----- ARRENDAMIENTO_INMUEBLES fields -----

-- PREPARACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_OBJETO:', 'cp.field.objeto', 'cp.field.objeto.desc', 'ARRENDAMIENTO_INMUEBLES', 'PREPARACION', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.objeto.placeholder',
 '{"required":true,"minLength":20,"maxLength":500}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el OBJETO para Arrendamiento de Inmuebles (Art. 59 LOSNCP). Debe especificar:\n1. Uso que se dará al inmueble (oficinas, bodega, etc.)\n2. Ubicación requerida (zona, sector)\n3. Área mínima requerida en m²\n4. Características especiales necesarias\nResponde en español.',
 'Valida que el objeto especifique uso y características del inmueble.', '2024', NOW()),

(UUID(), ':CP_INFORME_NECESIDAD:', 'cp.field.informeNecesidad', 'cp.field.informeNecesidad.desc', 'ARRENDAMIENTO_INMUEBLES', 'PREPARACION', 2, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.informeNecesidad.placeholder',
 '{"required":true,"minLength":50,"maxLength":2000}', 1,
 'Eres un experto en contratación pública ecuatoriana. Ayuda con el INFORME DE NECESIDAD para arrendamiento. Debe justificar:\n1. Por qué la entidad necesita arrendar (no tiene inmueble propio suficiente)\n2. Área requerida y número de funcionarios\n3. Ubicación necesaria por razones de servicio\n4. Que se verificó con INMOBILIAR la no disponibilidad de inmuebles públicos\nSegún Art. 59 LOSNCP y normativa de INMOBILIAR.\nResponde en español.',
 'Valida que el informe justifique la necesidad de arrendamiento.', '2024', NOW()),

(UUID(), ':CP_PRESUPUESTO:', 'cp.field.presupuesto', 'cp.field.presupuesto.desc', 'ARRENDAMIENTO_INMUEBLES', 'PREPARACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.presupuesto.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el PRESUPUESTO REFERENCIAL para arrendamiento. Se calcula como canon mensual × meses de arrendamiento. El canon no puede exceder el avalúo catastral dividido para 12. Basarse en estudio de mercado inmobiliario.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()),

(UUID(), ':CP_CERT_PRESUP:', 'cp.field.certPresup', 'cp.field.certPresup.desc', 'ARRENDAMIENTO_INMUEBLES', 'PREPARACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.certPresup.placeholder',
 '{"required":true,"pattern":"^[A-Za-z0-9\\\\-/]+$"}', 1,
 'Ayuda con la CERTIFICACIÓN PRESUPUESTARIA para arrendamiento de inmuebles.\nResponde en español.',
 'Valida formato de certificación.', '2024', NOW());

-- BUSQUEDA
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_DIRECCION_INMUEBLE:', 'cp.field.direccionInmueble', 'cp.field.direccionInmueble.desc', 'ARRENDAMIENTO_INMUEBLES', 'BUSQUEDA', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.direccionInmueble.placeholder',
 '{"required":true,"minLength":10}', 1,
 'Ayuda con la DIRECCIÓN DEL INMUEBLE a arrendar. Incluir dirección completa con calle principal, numeración, intersección, sector, ciudad y provincia.\nResponde en español.',
 'Valida dirección completa.', '2024', NOW()),

(UUID(), ':CP_AREA_M2:', 'cp.field.areaM2', 'cp.field.areaM2.desc', 'ARRENDAMIENTO_INMUEBLES', 'BUSQUEDA', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.areaM2.placeholder',
 '{"required":true,"minValue":1}', 1,
 'Ayuda con el ÁREA EN M² del inmueble. Debe ser verificada con medición técnica y coincidir con lo registrado en el catastro municipal.\nResponde en español.',
 'Valida área positiva.', '2024', NOW()),

(UUID(), ':CP_AVALUO_CATASTRAL:', 'cp.field.avaluoCatastral', 'cp.field.avaluoCatastral.desc', 'ARRENDAMIENTO_INMUEBLES', 'BUSQUEDA', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.avaluoCatastral.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el AVALÚO CATASTRAL del inmueble. Emitido por el GAD Municipal correspondiente. Es referencia para determinar el canon máximo de arrendamiento.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()),

(UUID(), ':CP_PROPIETARIO_NOMBRE:', 'cp.field.propietarioNombre', 'cp.field.propietarioNombre.desc', 'ARRENDAMIENTO_INMUEBLES', 'BUSQUEDA', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.propietarioNombre.placeholder',
 '{"required":true,"minLength":3}', 1,
 'Ayuda con el NOMBRE DEL PROPIETARIO del inmueble. Verificar que coincida con el certificado del Registro de la Propiedad.\nResponde en español.',
 'Valida nombre del propietario.', '2024', NOW());

-- NEGOCIACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_CANON_MENSUAL:', 'cp.field.canonMensual', 'cp.field.canonMensual.desc', 'ARRENDAMIENTO_INMUEBLES', 'NEGOCIACION', 1, 1, 1, 'NUMBER', 'INPUT', 'cp.field.canonMensual.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el CANON MENSUAL de arrendamiento. Según normativa, no debe exceder 1/12 del avalúo catastral del inmueble. El canon se negocia directamente con el propietario.\nResponde en español.',
 'Valida monto positivo dentro del rango legal.', '2024', NOW()),

(UUID(), ':CP_PLAZO_ARRENDAMIENTO:', 'cp.field.plazoArrendamiento', 'cp.field.plazoArrendamiento.desc', 'ARRENDAMIENTO_INMUEBLES', 'NEGOCIACION', 2, 1, 1, 'TEXT', 'INPUT', 'cp.field.plazoArrendamiento.placeholder',
 '{"required":true}', 1,
 'Ayuda con el PLAZO DE ARRENDAMIENTO. Generalmente se contrata por periodos anuales, renovables. Máximo permitido según normativa vigente.\nResponde en español.',
 'Valida plazo de arrendamiento.', '2024', NOW());

-- CONTRATACION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_NUMERO_CONTRATO:', 'cp.field.numeroContrato', 'cp.field.numeroContrato.desc', 'ARRENDAMIENTO_INMUEBLES', 'CONTRATACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.numeroContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con el NÚMERO DE CONTRATO de arrendamiento. Debe ser notarizado según Art. 59 LOSNCP.\nResponde en español.',
 'Valida número de contrato.', '2024', NOW()),

(UUID(), ':CP_FECHA_CONTRATO:', 'cp.field.fechaContrato', 'cp.field.fechaContrato.desc', 'ARRENDAMIENTO_INMUEBLES', 'CONTRATACION', 2, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE CONTRATO de arrendamiento.\nResponde en español.',
 'Valida fecha.', '2024', NOW()),

(UUID(), ':CP_MONTO_CONTRATO:', 'cp.field.montoContrato', 'cp.field.montoContrato.desc', 'ARRENDAMIENTO_INMUEBLES', 'CONTRATACION', 3, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoContrato.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO TOTAL DEL CONTRATO de arrendamiento (canon mensual × plazo).\nResponde en español.',
 'Valida monto positivo.', '2024', NOW());

-- EJECUCION
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
VALUES
(UUID(), ':CP_ACTA_ENTREGA:', 'cp.field.actaEntrega', 'cp.field.actaEntrega.desc', 'ARRENDAMIENTO_INMUEBLES', 'EJECUCION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.actaEntrega.placeholder',
 '{"required":true}', 1,
 'Ayuda con el ACTA DE ENTREGA-RECEPCIÓN del inmueble arrendado. Debe detallar el estado del inmueble al momento de la entrega.\nResponde en español.',
 'Valida número de acta.', '2024', NOW()),

(UUID(), ':CP_FECHA_INICIO_OCUPACION:', 'cp.field.fechaInicioOcupacion', 'cp.field.fechaInicioOcupacion.desc', 'ARRENDAMIENTO_INMUEBLES', 'EJECUCION', 2, 1, 1, 'DATE', 'INPUT', 'cp.field.fechaInicioOcupacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la FECHA DE INICIO DE OCUPACIÓN del inmueble arrendado.\nResponde en español.',
 'Valida fecha.', '2024', NOW());
