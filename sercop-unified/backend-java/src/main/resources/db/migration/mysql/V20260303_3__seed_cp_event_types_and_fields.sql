-- ============================================================================
-- CONFIGURACIÓN COMPLETA DE PROCESOS DE COMPRAS PÚBLICAS
-- Event Types, Flows y Fields para el sistema configurable
-- ============================================================================
-- message_type = tipo de proceso (CP_SUBASTA_INVERSA, CP_CATALOGO_ELECTRONICO, etc.)
-- section = etapa del proceso (PREPARACION, CONVOCATORIA, etc.)
-- Usa las tablas existentes: event_type_config_readmodel, event_flow_config_readmodel,
-- swift_field_config_readmodel
-- ============================================================================

-- ============================================================================
-- 0. ALTER COLUMNS - Ampliar columnas varchar(10) para soportar códigos CP
-- ============================================================================
ALTER TABLE event_type_config_readmodel MODIFY COLUMN outbound_message_type VARCHAR(50) NULL;
ALTER TABLE event_type_config_readmodel MODIFY COLUMN inbound_message_type VARCHAR(50) NULL;

ALTER TABLE swift_field_config_readmodel MODIFY COLUMN field_code VARCHAR(50) NOT NULL;
ALTER TABLE swift_field_config_readmodel MODIFY COLUMN message_type VARCHAR(50) NOT NULL;
ALTER TABLE swift_field_config_readmodel MODIFY COLUMN successor_field_code VARCHAR(50) NULL;

-- Drop and recreate unique constraint with new column sizes
ALTER TABLE swift_field_config_readmodel DROP INDEX uk_field_spec_version;
ALTER TABLE swift_field_config_readmodel ADD CONSTRAINT uk_field_spec_version UNIQUE (field_code, message_type, spec_version);

-- ============================================================================
-- 1. EVENT TYPES - Etapas de cada proceso como eventos
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 CATÁLOGO ELECTRÓNICO (CE)
-- ---------------------------------------------------------------------------
INSERT INTO event_type_config_readmodel
  (event_code, operation_type, language, event_name, event_description, help_text,
   outbound_message_type, valid_from_stages, resulting_stage, resulting_status,
   icon, color, display_order, event_category, is_initial_event, is_active,
   requires_approval, generates_notification, allowed_roles, form_type, requires_swift_message, created_at, modified_at, version)
VALUES
('CP_CE_PREPARACION', 'CP_CATALOGO_ELECTRONICO', 'es', 'Fase Preparatoria',
 'Elaboración de documentos preparatorios: certificación presupuestaria, estudios de mercado, especificaciones técnicas.',
 'Art. 22 LOSNCP: Toda contratación requiere certificación presupuestaria previa. Verificar que el bien conste en el Catálogo Electrónico vigente.',
 'CP_CATALOGO_ELECTRONICO', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CE_SELECCION', 'CP_CATALOGO_ELECTRONICO', 'es', 'Selección de Productos',
 'Selección de bienes o servicios normalizados del Catálogo Electrónico en el portal SERCOP.',
 'Art. 44 LOSNCP: Las entidades contratantes deberán consultar el catálogo electrónico previamente a establecer procesos de adquisición.',
 'CP_CATALOGO_ELECTRONICO', '["PREPARACION"]', 'SELECCION', 'EN_PROCESO',
 'FiSearch', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CE_ORDEN_COMPRA', 'CP_CATALOGO_ELECTRONICO', 'es', 'Generación Orden de Compra',
 'Generación de la orden de compra a través del portal de Compras Públicas.',
 'Art. 44 LOSNCP: La orden de compra formaliza la adquisición. Requiere autorización del ordenador de gasto.',
 'CP_CATALOGO_ELECTRONICO', '["SELECCION"]', 'ORDEN_COMPRA', 'EN_PROCESO',
 'FiShoppingCart', 'green', 3, 'CONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_ANALISTA", "CP_DIRECTOR"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CE_RECEPCION', 'CP_CATALOGO_ELECTRONICO', 'es', 'Recepción y Liquidación',
 'Recepción de bienes/servicios, verificación de conformidad y liquidación del proceso.',
 'Art. 81 LOSNCP: La entidad designará una comisión de recepción. Suscripción de acta de entrega-recepción.',
 'CP_CATALOGO_ELECTRONICO', '["ORDEN_COMPRA"]', 'RECEPCION', 'COMPLETADO',
 'FiCheckCircle', 'teal', 4, 'EJECUCION', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA", "CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

-- ---------------------------------------------------------------------------
-- 1.2 SUBASTA INVERSA ELECTRÓNICA (SIE)
-- ---------------------------------------------------------------------------
('CP_SIE_PREPARACION', 'CP_SUBASTA_INVERSA', 'es', 'Fase Preparatoria',
 'Elaboración de pliegos, estudios de mercado, certificación presupuestaria y resolución de inicio.',
 'Art. 22-23 LOSNCP: Estudios previos, certificación presupuestaria, estudio de mercado con al menos 3 proformas. Art. 47: Para bienes/servicios normalizados.',
 'CP_SUBASTA_INVERSA', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 TRUE, TRUE, '["CP_ANALISTA", "CP_DIRECTOR"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_SIE_CONVOCATORIA', 'CP_SUBASTA_INVERSA', 'es', 'Convocatoria',
 'Publicación de la convocatoria en el portal de Compras Públicas. Mínimo 7 días para presentación de ofertas.',
 'Art. 47 LOSNCP: La convocatoria se publicará en el Portal de Compras Públicas. Res. SERCOP-2016-0000072: Plazos mínimos.',
 'CP_SUBASTA_INVERSA', '["PREPARACION"]', 'CONVOCATORIA', 'PUBLICADO',
 'FiSend', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_SIE_PREGUNTAS', 'CP_SUBASTA_INVERSA', 'es', 'Preguntas y Respuestas',
 'Período para que los oferentes realicen consultas sobre los pliegos. La entidad debe responder todas las preguntas.',
 'Art. 21 RGLOSNCP: Las preguntas se formularán a través del Portal. La Comisión Técnica absolverá las consultas.',
 'CP_SUBASTA_INVERSA', '["CONVOCATORIA"]', 'PREGUNTAS', 'EN_PROCESO',
 'FiMessageCircle', 'orange', 3, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA", "CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_SIE_OFERTAS', 'CP_SUBASTA_INVERSA', 'es', 'Recepción de Ofertas',
 'Recepción de ofertas técnicas y económicas a través del portal.',
 'Art. 47 LOSNCP: Las ofertas se presentarán a través del Portal SERCOP.',
 'CP_SUBASTA_INVERSA', '["PREGUNTAS"]', 'OFERTAS', 'EN_PROCESO',
 'FiInbox', 'blue', 4, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_SIE_CALIFICACION', 'CP_SUBASTA_INVERSA', 'es', 'Calificación',
 'Evaluación y calificación de las ofertas técnicas por la Comisión Técnica.',
 'Art. 47 LOSNCP: La Comisión Técnica calificará las ofertas. Solo los oferentes calificados participan en la puja.',
 'CP_SUBASTA_INVERSA', '["OFERTAS"]', 'CALIFICACION', 'EN_EVALUACION',
 'FiCheckSquare', 'yellow', 5, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_SIE_PUJA', 'CP_SUBASTA_INVERSA', 'es', 'Puja Electrónica',
 'Puja hacia la baja entre los oferentes calificados. Duración mínima 15 minutos con extensiones.',
 'Art. 47 LOSNCP: La puja será hacia la baja. Res. SERCOP: Duración mínima 15 min, extensión automática de 2 min.',
 'CP_SUBASTA_INVERSA', '["CALIFICACION"]', 'SUBASTA', 'EN_PROCESO',
 'FiTrendingDown', 'red', 6, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA", "CP_COMISION"]', 'NONE', FALSE, NOW(), NOW(), 1),

('CP_SIE_ADJUDICACION', 'CP_SUBASTA_INVERSA', 'es', 'Adjudicación',
 'Resolución de adjudicación al oferente ganador de la puja. Firmada por la máxima autoridad.',
 'Art. 32 LOSNCP: La máxima autoridad adjudicará. Art. 47: Se adjudicará al oferente con precio más bajo de la puja.',
 'CP_SUBASTA_INVERSA', '["SUBASTA"]', 'ADJUDICACION', 'ADJUDICADO',
 'FiAward', 'green', 7, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_MAXIMA_AUTORIDAD"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_SIE_CONTRATACION', 'CP_SUBASTA_INVERSA', 'es', 'Suscripción de Contrato',
 'Firma del contrato con el adjudicatario. Incluye garantías y documentos habilitantes.',
 'Art. 69-74 LOSNCP: Garantías requeridas. Art. 68: El contrato se suscribirá dentro de 15 días posteriores a la adjudicación.',
 'CP_SUBASTA_INVERSA', '["ADJUDICACION"]', 'CONTRATACION', 'CONTRATADO',
 'FiEdit3', 'teal', 8, 'CONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_DIRECTOR", "CP_JURIDICO"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

-- ---------------------------------------------------------------------------
-- 1.3 MENOR CUANTÍA (MC) - Bienes y Servicios
-- ---------------------------------------------------------------------------
('CP_MC_PREPARACION', 'CP_MENOR_CUANTIA', 'es', 'Fase Preparatoria',
 'Estudios previos, certificación presupuestaria, estudio de mercado y pliegos.',
 'Art. 51 LOSNCP: Menor Cuantía para bienes/servicios cuyo presupuesto referencial sea inferior al 0,000002 del PIE.',
 'CP_MENOR_CUANTIA', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 TRUE, TRUE, '["CP_ANALISTA", "CP_DIRECTOR"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_MC_CONVOCATORIA', 'CP_MENOR_CUANTIA', 'es', 'Convocatoria',
 'Invitación directa a un proveedor registrado en el RUP seleccionado por sorteo.',
 'Art. 51 LOSNCP: Se invitará a un proveedor registrado en el RUP. Selección por sorteo del portal.',
 'CP_MENOR_CUANTIA', '["PREPARACION"]', 'CONVOCATORIA', 'PUBLICADO',
 'FiSend', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_MC_OFERTAS', 'CP_MENOR_CUANTIA', 'es', 'Recepción de Oferta',
 'El proveedor invitado presenta su oferta técnica y económica.',
 'Art. 51 LOSNCP: El proveedor presentará su oferta según las condiciones de los pliegos.',
 'CP_MENOR_CUANTIA', '["CONVOCATORIA"]', 'OFERTAS', 'EN_PROCESO',
 'FiInbox', 'blue', 3, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_MC_EVALUACION', 'CP_MENOR_CUANTIA', 'es', 'Evaluación',
 'Evaluación de la oferta por la Comisión Técnica.',
 'Art. 51 LOSNCP: La evaluación verificará cumplimiento técnico y económico.',
 'CP_MENOR_CUANTIA', '["OFERTAS"]', 'EVALUACION', 'EN_EVALUACION',
 'FiCheckSquare', 'yellow', 4, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_MC_ADJUDICACION', 'CP_MENOR_CUANTIA', 'es', 'Adjudicación',
 'Resolución de adjudicación o declaratoria de desierto.',
 'Art. 32 LOSNCP: La máxima autoridad adjudicará o declarará desierto el proceso.',
 'CP_MENOR_CUANTIA', '["EVALUACION"]', 'ADJUDICACION', 'ADJUDICADO',
 'FiAward', 'green', 5, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_MAXIMA_AUTORIDAD"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_MC_CONTRATACION', 'CP_MENOR_CUANTIA', 'es', 'Contratación',
 'Suscripción de contrato, garantías y ejecución contractual.',
 'Art. 68-74 LOSNCP: Garantías, suscripción dentro de 15 días, garantía técnica para bienes.',
 'CP_MENOR_CUANTIA', '["ADJUDICACION"]', 'CONTRATACION', 'CONTRATADO',
 'FiEdit3', 'teal', 6, 'CONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_DIRECTOR", "CP_JURIDICO"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

-- ---------------------------------------------------------------------------
-- 1.4 COTIZACIÓN (CDC)
-- ---------------------------------------------------------------------------
('CP_CDC_PREPARACION', 'CP_COTIZACION', 'es', 'Fase Preparatoria',
 'Estudios previos, pliegos, certificación presupuestaria y resolución de inicio.',
 'Art. 50 LOSNCP: Cotización para bienes/servicios no normalizados entre 0,000002 y 0,000015 del PIE.',
 'CP_COTIZACION', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 TRUE, TRUE, '["CP_ANALISTA", "CP_DIRECTOR"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CDC_CONVOCATORIA', 'CP_COTIZACION', 'es', 'Convocatoria',
 'Publicación en portal y sorteo de mínimo 5 proveedores del RUP.',
 'Art. 50 LOSNCP: Se invitará mínimo a 5 proveedores registrados en el RUP mediante sorteo.',
 'CP_COTIZACION', '["PREPARACION"]', 'CONVOCATORIA', 'PUBLICADO',
 'FiSend', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CDC_PREGUNTAS', 'CP_COTIZACION', 'es', 'Preguntas y Respuestas',
 'Período de consultas y aclaraciones sobre los pliegos.',
 'Art. 21 RGLOSNCP: Plazo para preguntas según calendario del proceso.',
 'CP_COTIZACION', '["CONVOCATORIA"]', 'PREGUNTAS', 'EN_PROCESO',
 'FiMessageCircle', 'orange', 3, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA", "CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CDC_OFERTAS', 'CP_COTIZACION', 'es', 'Recepción de Ofertas',
 'Recepción de ofertas técnicas y económicas de los proveedores invitados.',
 'Art. 50 LOSNCP: Las ofertas se presentarán según lo establecido en los pliegos.',
 'CP_COTIZACION', '["PREGUNTAS"]', 'OFERTAS', 'EN_PROCESO',
 'FiInbox', 'blue', 4, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CDC_EVALUACION', 'CP_COTIZACION', 'es', 'Evaluación',
 'Evaluación técnica y económica por la Comisión Técnica. Mejor costo según pliegos.',
 'Art. 50 LOSNCP: Se seleccionará la oferta de mejor costo conforme a los parámetros establecidos.',
 'CP_COTIZACION', '["OFERTAS"]', 'EVALUACION', 'EN_EVALUACION',
 'FiCheckSquare', 'yellow', 5, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CDC_ADJUDICACION', 'CP_COTIZACION', 'es', 'Adjudicación',
 'Resolución de adjudicación firmada por la máxima autoridad.',
 'Art. 32 LOSNCP: La máxima autoridad adjudicará mediante resolución motivada.',
 'CP_COTIZACION', '["EVALUACION"]', 'ADJUDICACION', 'ADJUDICADO',
 'FiAward', 'green', 6, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_MAXIMA_AUTORIDAD"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_CDC_CONTRATACION', 'CP_COTIZACION', 'es', 'Contratación',
 'Firma de contrato, presentación de garantías y ejecución.',
 'Art. 68-74 LOSNCP: Garantías técnica, fiel cumplimiento y buen uso del anticipo.',
 'CP_COTIZACION', '["ADJUDICACION"]', 'CONTRATACION', 'CONTRATADO',
 'FiEdit3', 'teal', 7, 'CONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_DIRECTOR", "CP_JURIDICO"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

-- ---------------------------------------------------------------------------
-- 1.5 LICITACIÓN PÚBLICA (LP)
-- ---------------------------------------------------------------------------
('CP_LP_PREPARACION', 'CP_LICITACION', 'es', 'Fase Preparatoria',
 'Estudios completos: necesidad, mercado, presupuesto, especificaciones técnicas, TDR, pliegos.',
 'Art. 48 LOSNCP: Licitación para bienes/servicios no normalizados que superen 0,000015 del PIE. Requiere comisión técnica.',
 'CP_LICITACION', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 TRUE, TRUE, '["CP_ANALISTA", "CP_DIRECTOR", "CP_JURIDICO"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_LP_CONVOCATORIA', 'CP_LICITACION', 'es', 'Convocatoria',
 'Publicación en portal SERCOP. Mínimo 22 días para presentación de ofertas.',
 'Art. 48 LOSNCP: La convocatoria se publicará en el Portal. Plazo mínimo 22 días para ofertas.',
 'CP_LICITACION', '["PREPARACION"]', 'CONVOCATORIA', 'PUBLICADO',
 'FiSend', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_LP_PREGUNTAS', 'CP_LICITACION', 'es', 'Preguntas y Aclaraciones',
 'Audiencia de preguntas y respuestas. La entidad puede emitir aclaraciones de oficio.',
 'Art. 22 RGLOSNCP: Audiencia de preguntas dentro del plazo señalado en el cronograma.',
 'CP_LICITACION', '["CONVOCATORIA"]', 'PREGUNTAS', 'EN_PROCESO',
 'FiMessageCircle', 'orange', 3, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA", "CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_LP_OFERTAS', 'CP_LICITACION', 'es', 'Recepción de Ofertas',
 'Recepción de ofertas técnicas y económicas. Acto público de apertura.',
 'Art. 48 LOSNCP: Apertura pública de ofertas en día y hora señalados.',
 'CP_LICITACION', '["PREGUNTAS"]', 'OFERTAS', 'EN_PROCESO',
 'FiInbox', 'blue', 4, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_LP_EVALUACION', 'CP_LICITACION', 'es', 'Evaluación',
 'Evaluación técnica y económica por la Comisión Técnica. Informe de evaluación.',
 'Art. 48 LOSNCP: La Comisión Técnica evaluará y presentará informe de resultados.',
 'CP_LICITACION', '["OFERTAS"]', 'EVALUACION', 'EN_EVALUACION',
 'FiCheckSquare', 'yellow', 5, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_LP_ADJUDICACION', 'CP_LICITACION', 'es', 'Adjudicación',
 'Resolución de adjudicación por la máxima autoridad basada en informe de la Comisión.',
 'Art. 32 LOSNCP: La máxima autoridad adjudicará. Puede declarar desierto motivadamente.',
 'CP_LICITACION', '["EVALUACION"]', 'ADJUDICACION', 'ADJUDICADO',
 'FiAward', 'green', 6, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_MAXIMA_AUTORIDAD"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_LP_CONTRATACION', 'CP_LICITACION', 'es', 'Suscripción de Contrato',
 'Firma del contrato, garantías de fiel cumplimiento (5%) y anticipo si aplica.',
 'Art. 68-74 LOSNCP: Garantías requeridas. Contrato dentro de 15 días de adjudicación.',
 'CP_LICITACION', '["ADJUDICACION"]', 'CONTRATACION', 'CONTRATADO',
 'FiEdit3', 'teal', 7, 'CONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_DIRECTOR", "CP_JURIDICO"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_LP_EJECUCION', 'CP_LICITACION', 'es', 'Ejecución Contractual',
 'Seguimiento de la ejecución, administrador de contrato, recepciones parciales/definitiva.',
 'Art. 80-81 LOSNCP: Administrador de contrato. Actas de entrega-recepción parcial y definitiva.',
 'CP_LICITACION', '["CONTRATACION"]', 'EJECUCION', 'EN_EJECUCION',
 'FiActivity', 'cyan', 8, 'EJECUCION', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA", "CP_ADMINISTRADOR_CONTRATO"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

-- ---------------------------------------------------------------------------
-- 1.6 ÍNFIMA CUANTÍA (IC)
-- ---------------------------------------------------------------------------
('CP_IC_PREPARACION', 'CP_INFIMA_CUANTIA', 'es', 'Preparación',
 'Verificación de necesidad, disponibilidad presupuestaria y no fraccionamiento.',
 'Art. 52.1 LOSNCP: Ínfima Cuantía para bienes/servicios cuyo monto no supere el 0,0000002 del PIE. Verificar Art. 62 (no fraccionamiento).',
 'CP_INFIMA_CUANTIA', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_IC_COTIZACION', 'CP_INFIMA_CUANTIA', 'es', 'Cotización',
 'Obtener al menos 3 proformas. Comparar y seleccionar la mejor opción.',
 'Res. SERCOP RE-2018-000083: Procedimiento de Ínfima Cuantía. Se requiere al menos 3 proformas.',
 'CP_INFIMA_CUANTIA', '["PREPARACION"]', 'COTIZACION', 'EN_PROCESO',
 'FiDollarSign', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_IC_SELECCION', 'CP_INFIMA_CUANTIA', 'es', 'Selección y Compra',
 'Selección del proveedor con mejor oferta. Generación de factura.',
 'Art. 52.1 LOSNCP: Se selecciona libremente. No requiere proceso precontractual formal.',
 'CP_INFIMA_CUANTIA', '["COTIZACION"]', 'SELECCION', 'ADJUDICADO',
 'FiShoppingCart', 'green', 3, 'CONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_IC_PAGO', 'CP_INFIMA_CUANTIA', 'es', 'Recepción y Pago',
 'Recepción del bien/servicio, conformidad y trámite de pago.',
 'La entidad debe registrar la compra en el portal SERCOP dentro de 5 días.',
 'CP_INFIMA_CUANTIA', '["SELECCION"]', 'PAGO', 'COMPLETADO',
 'FiCheckCircle', 'teal', 4, 'EJECUCION', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

-- ---------------------------------------------------------------------------
-- 1.7 RÉGIMEN ESPECIAL (RE)
-- ---------------------------------------------------------------------------
('CP_RE_PREPARACION', 'CP_REGIMEN_ESPECIAL', 'es', 'Fase Preparatoria',
 'Justificación del régimen especial, estudios previos y documentos habilitantes.',
 'Art. 2 LOSNCP: Régimen Especial aplica a seguridad, comunicación, asesoría, sector estratégico, etc.',
 'CP_REGIMEN_ESPECIAL', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 TRUE, TRUE, '["CP_ANALISTA", "CP_DIRECTOR"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_RE_INVITACION', 'CP_REGIMEN_ESPECIAL', 'es', 'Invitación',
 'Invitación directa al proveedor o publicación según el tipo de régimen especial.',
 'Res. SERCOP: El procedimiento varía según el tipo de régimen especial aplicable.',
 'CP_REGIMEN_ESPECIAL', '["PREPARACION"]', 'INVITACION', 'PUBLICADO',
 'FiSend', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_RE_EVALUACION', 'CP_REGIMEN_ESPECIAL', 'es', 'Evaluación y Negociación',
 'Evaluación de la oferta y/o negociación con el proveedor.',
 'El tipo de evaluación depende del régimen especial aplicable.',
 'CP_REGIMEN_ESPECIAL', '["INVITACION"]', 'EVALUACION', 'EN_EVALUACION',
 'FiCheckSquare', 'yellow', 3, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_RE_ADJUDICACION', 'CP_REGIMEN_ESPECIAL', 'es', 'Adjudicación',
 'Resolución de adjudicación por la máxima autoridad.',
 'Art. 32 LOSNCP: Resolución motivada de adjudicación.',
 'CP_REGIMEN_ESPECIAL', '["EVALUACION"]', 'ADJUDICACION', 'ADJUDICADO',
 'FiAward', 'green', 4, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_MAXIMA_AUTORIDAD"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_RE_CONTRATACION', 'CP_REGIMEN_ESPECIAL', 'es', 'Contratación',
 'Suscripción de contrato y presentación de garantías.',
 'Art. 68-74 LOSNCP: Garantías según aplique al tipo de régimen especial.',
 'CP_REGIMEN_ESPECIAL', '["ADJUDICACION"]', 'CONTRATACION', 'CONTRATADO',
 'FiEdit3', 'teal', 5, 'CONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_DIRECTOR", "CP_JURIDICO"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

-- ---------------------------------------------------------------------------
-- 1.8 FERIA INCLUSIVA (FI)
-- ---------------------------------------------------------------------------
('CP_FI_PREPARACION', 'CP_FERIA_INCLUSIVA', 'es', 'Fase Preparatoria',
 'Estudios previos, definición de bienes/servicios para actores de la economía popular y solidaria.',
 'Art. 6 LOSNCP: Feria Inclusiva para micro y pequeñas empresas, artesanos, actores EPS.',
 'CP_FERIA_INCLUSIVA', '["INICIO"]', 'PREPARACION', 'BORRADOR',
 'FiFileText', 'blue', 1, 'PREPARATORIA', TRUE, TRUE,
 TRUE, TRUE, '["CP_ANALISTA", "CP_DIRECTOR"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_FI_CONVOCATORIA', 'CP_FERIA_INCLUSIVA', 'es', 'Convocatoria',
 'Publicación de la convocatoria para actores de la economía popular y solidaria.',
 'Res. SERCOP: La convocatoria debe dirigirse a actores EPS registrados en el RUP.',
 'CP_FERIA_INCLUSIVA', '["PREPARACION"]', 'CONVOCATORIA', 'PUBLICADO',
 'FiSend', 'purple', 2, 'PRECONTRACTUAL', FALSE, TRUE,
 FALSE, TRUE, '["CP_ANALISTA"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_FI_EVALUACION', 'CP_FERIA_INCLUSIVA', 'es', 'Evaluación',
 'Evaluación de ofertas priorizando actores EPS según criterios de Feria Inclusiva.',
 'Se priorizará a micro y pequeñas empresas, artesanos y actores de la EPS.',
 'CP_FERIA_INCLUSIVA', '["CONVOCATORIA"]', 'EVALUACION', 'EN_EVALUACION',
 'FiCheckSquare', 'yellow', 3, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_COMISION"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_FI_ADJUDICACION', 'CP_FERIA_INCLUSIVA', 'es', 'Adjudicación',
 'Adjudicación a los oferentes ganadores de la Feria Inclusiva.',
 'Art. 32 LOSNCP: Resolución de adjudicación.',
 'CP_FERIA_INCLUSIVA', '["EVALUACION"]', 'ADJUDICACION', 'ADJUDICADO',
 'FiAward', 'green', 4, 'PRECONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_MAXIMA_AUTORIDAD"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1),

('CP_FI_CONTRATACION', 'CP_FERIA_INCLUSIVA', 'es', 'Contratación',
 'Suscripción de contratos con los adjudicatarios.',
 'Art. 68-74 LOSNCP: Contrato y garantías según el monto.',
 'CP_FERIA_INCLUSIVA', '["ADJUDICACION"]', 'CONTRATACION', 'CONTRATADO',
 'FiEdit3', 'teal', 5, 'CONTRACTUAL', FALSE, TRUE,
 TRUE, TRUE, '["CP_DIRECTOR"]', 'SWIFT_FORM', FALSE, NOW(), NOW(), 1);

-- ============================================================================
-- 2. EVENT FLOWS - Transiciones entre etapas
-- ============================================================================

-- CE - Catálogo Electrónico
INSERT INTO event_flow_config_readmodel
  (operation_type, from_event_code, from_stage, to_event_code, conditions, is_required, sequence_order, language, transition_label, transition_help, is_active)
VALUES
('CP_CATALOGO_ELECTRONICO', 'CP_CE_PREPARACION', 'INICIO', 'CP_CE_SELECCION', '{"requiresCertPresupuestaria": true}', TRUE, 1, 'es', 'Iniciar selección', 'Requiere certificación presupuestaria aprobada', TRUE),
('CP_CATALOGO_ELECTRONICO', 'CP_CE_SELECCION', 'PREPARACION', 'CP_CE_ORDEN_COMPRA', '{"requiresProductSelection": true}', TRUE, 2, 'es', 'Generar orden', 'Productos seleccionados del catálogo', TRUE),
('CP_CATALOGO_ELECTRONICO', 'CP_CE_ORDEN_COMPRA', 'SELECCION', 'CP_CE_RECEPCION', '{"requiresOrderApproval": true}', TRUE, 3, 'es', 'Confirmar recepción', 'Orden de compra aprobada', TRUE),

-- SIE - Subasta Inversa
('CP_SUBASTA_INVERSA', 'CP_SIE_PREPARACION', 'INICIO', 'CP_SIE_CONVOCATORIA', '{"requiresResolucionInicio": true, "requiresCertPresupuestaria": true}', TRUE, 1, 'es', 'Publicar convocatoria', 'Requiere resolución de inicio y cert. presupuestaria', TRUE),
('CP_SUBASTA_INVERSA', 'CP_SIE_CONVOCATORIA', 'PREPARACION', 'CP_SIE_PREGUNTAS', '{"minDaysPublished": 7}', TRUE, 2, 'es', 'Abrir preguntas', 'Mín. 7 días de publicación', TRUE),
('CP_SUBASTA_INVERSA', 'CP_SIE_PREGUNTAS', 'CONVOCATORIA', 'CP_SIE_OFERTAS', '{"allQuestionsAnswered": true}', TRUE, 3, 'es', 'Recibir ofertas', 'Todas las preguntas respondidas', TRUE),
('CP_SUBASTA_INVERSA', 'CP_SIE_OFERTAS', 'PREGUNTAS', 'CP_SIE_CALIFICACION', '{"minOffers": 1}', TRUE, 4, 'es', 'Calificar ofertas', 'Al menos 1 oferta recibida', TRUE),
('CP_SUBASTA_INVERSA', 'CP_SIE_CALIFICACION', 'OFERTAS', 'CP_SIE_PUJA', '{"minQualifiedOffers": 2}', TRUE, 5, 'es', 'Iniciar puja', 'Mín. 2 oferentes calificados', TRUE),
('CP_SUBASTA_INVERSA', 'CP_SIE_PUJA', 'CALIFICACION', 'CP_SIE_ADJUDICACION', '{"pujaCompleted": true}', TRUE, 6, 'es', 'Adjudicar', 'Puja finalizada', TRUE),
('CP_SUBASTA_INVERSA', 'CP_SIE_ADJUDICACION', 'SUBASTA', 'CP_SIE_CONTRATACION', '{"resolucionFirmada": true}', TRUE, 7, 'es', 'Suscribir contrato', 'Resolución de adjudicación firmada', TRUE),

-- MC - Menor Cuantía
('CP_MENOR_CUANTIA', 'CP_MC_PREPARACION', 'INICIO', 'CP_MC_CONVOCATORIA', '{"requiresResolucionInicio": true}', TRUE, 1, 'es', 'Invitar proveedor', 'Sorteo de proveedor del RUP', TRUE),
('CP_MENOR_CUANTIA', 'CP_MC_CONVOCATORIA', 'PREPARACION', 'CP_MC_OFERTAS', '{"invitationSent": true}', TRUE, 2, 'es', 'Recibir oferta', 'Invitación enviada al proveedor', TRUE),
('CP_MENOR_CUANTIA', 'CP_MC_OFERTAS', 'CONVOCATORIA', 'CP_MC_EVALUACION', '{"offerReceived": true}', TRUE, 3, 'es', 'Evaluar oferta', 'Oferta recibida', TRUE),
('CP_MENOR_CUANTIA', 'CP_MC_EVALUACION', 'OFERTAS', 'CP_MC_ADJUDICACION', '{"evaluationComplete": true}', TRUE, 4, 'es', 'Adjudicar', 'Evaluación completada', TRUE),
('CP_MENOR_CUANTIA', 'CP_MC_ADJUDICACION', 'EVALUACION', 'CP_MC_CONTRATACION', '{"resolucionFirmada": true}', TRUE, 5, 'es', 'Contratar', 'Resolución firmada', TRUE),

-- CDC - Cotización
('CP_COTIZACION', 'CP_CDC_PREPARACION', 'INICIO', 'CP_CDC_CONVOCATORIA', '{"requiresResolucionInicio": true}', TRUE, 1, 'es', 'Publicar convocatoria', 'Sorteo de mín. 5 proveedores', TRUE),
('CP_COTIZACION', 'CP_CDC_CONVOCATORIA', 'PREPARACION', 'CP_CDC_PREGUNTAS', '{"minInvitations": 5}', TRUE, 2, 'es', 'Abrir preguntas', 'Mín. 5 proveedores invitados', TRUE),
('CP_COTIZACION', 'CP_CDC_PREGUNTAS', 'CONVOCATORIA', 'CP_CDC_OFERTAS', '{"allQuestionsAnswered": true}', TRUE, 3, 'es', 'Recibir ofertas', 'Preguntas respondidas', TRUE),
('CP_COTIZACION', 'CP_CDC_OFERTAS', 'PREGUNTAS', 'CP_CDC_EVALUACION', '{"minOffers": 1}', TRUE, 4, 'es', 'Evaluar ofertas', 'Ofertas recibidas', TRUE),
('CP_COTIZACION', 'CP_CDC_EVALUACION', 'OFERTAS', 'CP_CDC_ADJUDICACION', '{"evaluationComplete": true}', TRUE, 5, 'es', 'Adjudicar', 'Evaluación completada', TRUE),
('CP_COTIZACION', 'CP_CDC_ADJUDICACION', 'EVALUACION', 'CP_CDC_CONTRATACION', '{"resolucionFirmada": true}', TRUE, 6, 'es', 'Contratar', 'Resolución firmada', TRUE),

-- LP - Licitación
('CP_LICITACION', 'CP_LP_PREPARACION', 'INICIO', 'CP_LP_CONVOCATORIA', '{"requiresResolucionInicio": true, "requiresComisionTecnica": true}', TRUE, 1, 'es', 'Publicar convocatoria', 'Resolución de inicio y comisión técnica', TRUE),
('CP_LICITACION', 'CP_LP_CONVOCATORIA', 'PREPARACION', 'CP_LP_PREGUNTAS', '{"minDaysPublished": 22}', TRUE, 2, 'es', 'Abrir preguntas', 'Mín. 22 días de publicación', TRUE),
('CP_LICITACION', 'CP_LP_PREGUNTAS', 'CONVOCATORIA', 'CP_LP_OFERTAS', '{"allQuestionsAnswered": true}', TRUE, 3, 'es', 'Recibir ofertas', 'Preguntas respondidas', TRUE),
('CP_LICITACION', 'CP_LP_OFERTAS', 'PREGUNTAS', 'CP_LP_EVALUACION', '{"minOffers": 1}', TRUE, 4, 'es', 'Evaluar ofertas', 'Ofertas recibidas', TRUE),
('CP_LICITACION', 'CP_LP_EVALUACION', 'OFERTAS', 'CP_LP_ADJUDICACION', '{"evaluationComplete": true}', TRUE, 5, 'es', 'Adjudicar', 'Informe de evaluación', TRUE),
('CP_LICITACION', 'CP_LP_ADJUDICACION', 'EVALUACION', 'CP_LP_CONTRATACION', '{"resolucionFirmada": true}', TRUE, 6, 'es', 'Contratar', 'Resolución firmada', TRUE),
('CP_LICITACION', 'CP_LP_CONTRATACION', 'ADJUDICACION', 'CP_LP_EJECUCION', '{"contratoFirmado": true}', TRUE, 7, 'es', 'Iniciar ejecución', 'Contrato firmado', TRUE),

-- IC - Ínfima Cuantía
('CP_INFIMA_CUANTIA', 'CP_IC_PREPARACION', 'INICIO', 'CP_IC_COTIZACION', '{"requiresDisponibilidad": true}', TRUE, 1, 'es', 'Cotizar', 'Disponibilidad presupuestaria', TRUE),
('CP_INFIMA_CUANTIA', 'CP_IC_COTIZACION', 'PREPARACION', 'CP_IC_SELECCION', '{"minProformas": 3}', TRUE, 2, 'es', 'Seleccionar proveedor', 'Mín. 3 proformas', TRUE),
('CP_INFIMA_CUANTIA', 'CP_IC_SELECCION', 'COTIZACION', 'CP_IC_PAGO', '{"facturaRecibida": true}', TRUE, 3, 'es', 'Pagar', 'Factura recibida', TRUE),

-- RE - Régimen Especial
('CP_REGIMEN_ESPECIAL', 'CP_RE_PREPARACION', 'INICIO', 'CP_RE_INVITACION', '{"justificacionAprobada": true}', TRUE, 1, 'es', 'Invitar', 'Justificación de régimen especial', TRUE),
('CP_REGIMEN_ESPECIAL', 'CP_RE_INVITACION', 'PREPARACION', 'CP_RE_EVALUACION', '{"invitationSent": true}', TRUE, 2, 'es', 'Evaluar', 'Invitación enviada', TRUE),
('CP_REGIMEN_ESPECIAL', 'CP_RE_EVALUACION', 'INVITACION', 'CP_RE_ADJUDICACION', '{"evaluationComplete": true}', TRUE, 3, 'es', 'Adjudicar', 'Evaluación completada', TRUE),
('CP_REGIMEN_ESPECIAL', 'CP_RE_ADJUDICACION', 'EVALUACION', 'CP_RE_CONTRATACION', '{"resolucionFirmada": true}', TRUE, 4, 'es', 'Contratar', 'Resolución firmada', TRUE),

-- FI - Feria Inclusiva
('CP_FERIA_INCLUSIVA', 'CP_FI_PREPARACION', 'INICIO', 'CP_FI_CONVOCATORIA', '{"requiresResolucionInicio": true}', TRUE, 1, 'es', 'Convocar', 'Resolución de inicio', TRUE),
('CP_FERIA_INCLUSIVA', 'CP_FI_CONVOCATORIA', 'PREPARACION', 'CP_FI_EVALUACION', '{"convocatoriaPublished": true}', TRUE, 2, 'es', 'Evaluar', 'Convocatoria publicada', TRUE),
('CP_FERIA_INCLUSIVA', 'CP_FI_EVALUACION', 'CONVOCATORIA', 'CP_FI_ADJUDICACION', '{"evaluationComplete": true}', TRUE, 3, 'es', 'Adjudicar', 'Evaluación completada', TRUE),
('CP_FERIA_INCLUSIVA', 'CP_FI_ADJUDICACION', 'EVALUACION', 'CP_FI_CONTRATACION', '{"resolucionFirmada": true}', TRUE, 4, 'es', 'Contratar', 'Resolución firmada', TRUE);

-- ============================================================================
-- 3. SWIFT FIELD CONFIG - Campos por proceso (message_type = proceso)
--    section = etapa del proceso
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 CAMPOS COMUNES - PREPARACIÓN (aplican a todos los procesos)
-- ---------------------------------------------------------------------------

-- CP_SUBASTA_INVERSA - Etapa PREPARACION
INSERT INTO swift_field_config_readmodel
  (field_code, field_name_key, description_key, message_type, section, display_order,
   is_required, is_active, field_type, component_type, placeholder_key,
   validation_rules, field_options, help_text_key, created_at, updated_at)
VALUES
-- SIE PREPARACION
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del objeto de la contratación', 'CP_SUBASTA_INVERSA', 'PREPARACION', 1,
 TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Describa el objeto de la contratación...',
 '{"maxLength": 2000, "minLength": 50}', NULL, 'Art. 22 LOSNCP: Definir claramente el objeto de contratación', NOW(), NOW()),

(':CP_CPC:', 'Código CPC', 'Clasificador Central de Productos', 'CP_SUBASTA_INVERSA', 'PREPARACION', 2,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Ej: 44211000',
 '{"pattern": "^[0-9]{8,10}$"}', NULL, 'Código CPC del Clasificador Central de Productos', NOW(), NOW()),

(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto del presupuesto referencial con IVA', 'CP_SUBASTA_INVERSA', 'PREPARACION', 3,
 TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00',
 '{"min": 0.01, "currency": "USD"}', NULL, 'Art. 23 LOSNCP: Presupuesto referencial actualizado', NOW(), NOW()),

(':CP_CERT_PRESUP:', 'No. Certificación Presupuestaria', 'Número de la certificación presupuestaria', 'CP_SUBASTA_INVERSA', 'PREPARACION', 4,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Ej: CDP-2026-001',
 NULL, NULL, 'Art. 24 LOSNCP: Certificación de disponibilidad presupuestaria', NOW(), NOW()),

(':CP_PARTIDA:', 'Partida Presupuestaria', 'Partida del presupuesto institucional', 'CP_SUBASTA_INVERSA', 'PREPARACION', 5,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Ej: 530801',
 NULL, NULL, 'Partida presupuestaria del clasificador', NOW(), NOW()),

(':CP_FUENTE_FINANC:', 'Fuente de Financiamiento', 'Fuente de financiamiento del proceso', 'CP_SUBASTA_INVERSA', 'PREPARACION', 6,
 TRUE, TRUE, 'SELECT', 'SELECT', NULL,
 NULL, '[{"value":"FISCAL","label":"Recursos Fiscales"},{"value":"AUTOGEST","label":"Autogestión"},{"value":"CREDITO","label":"Crédito Público"},{"value":"PREASIG","label":"Preasignaciones"},{"value":"ASIST","label":"Asistencia Técnica"}]',
 'Fuente de financiamiento según clasificador presupuestario', NOW(), NOW()),

(':CP_RESOLUCION_INICIO:', 'No. Resolución de Inicio', 'Número de resolución de inicio del proceso', 'CP_SUBASTA_INVERSA', 'PREPARACION', 7,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Ej: RES-2026-001',
 NULL, NULL, 'Art. 22 LOSNCP: Resolución de inicio firmada por la máxima autoridad', NOW(), NOW()),

-- SIE CONVOCATORIA
(':CP_FECHA_PUBLICACION:', 'Fecha de Publicación', 'Fecha de publicación en el portal SERCOP', 'CP_SUBASTA_INVERSA', 'CONVOCATORIA', 1,
 TRUE, TRUE, 'DATE', 'DATE_PICKER', NULL,
 NULL, NULL, 'Fecha de publicación en el Portal de Compras Públicas', NOW(), NOW()),

(':CP_FECHA_LIMITE_PREGUNTAS:', 'Fecha Límite Preguntas', 'Fecha límite para realizar preguntas', 'CP_SUBASTA_INVERSA', 'CONVOCATORIA', 2,
 TRUE, TRUE, 'DATE', 'DATE_PICKER', NULL,
 NULL, NULL, 'Fecha límite para formular consultas', NOW(), NOW()),

(':CP_FECHA_LIMITE_OFERTAS:', 'Fecha Límite Ofertas', 'Fecha límite para presentar ofertas', 'CP_SUBASTA_INVERSA', 'CONVOCATORIA', 3,
 TRUE, TRUE, 'DATE', 'DATE_PICKER', NULL,
 NULL, NULL, 'Art. 47: Mínimo 7 días desde la convocatoria', NOW(), NOW()),

(':CP_PLAZO_ENTREGA:', 'Plazo de Entrega', 'Plazo de entrega en días', 'CP_SUBASTA_INVERSA', 'CONVOCATORIA', 4,
 TRUE, TRUE, 'NUMBER', 'NUMBER_INPUT', 'Días',
 '{"min": 1, "max": 365}', NULL, 'Plazo de entrega del bien o servicio', NOW(), NOW()),

-- SIE CALIFICACION
(':CP_NUM_OFERTAS:', 'Número de Ofertas Recibidas', 'Total de ofertas presentadas', 'CP_SUBASTA_INVERSA', 'CALIFICACION', 1,
 TRUE, TRUE, 'NUMBER', 'NUMBER_INPUT', '0',
 '{"min": 0}', NULL, 'Total de ofertas recibidas en el portal', NOW(), NOW()),

(':CP_OFERTAS_CALIFICADAS:', 'Ofertas Calificadas', 'Número de ofertas que cumplen requisitos técnicos', 'CP_SUBASTA_INVERSA', 'CALIFICACION', 2,
 TRUE, TRUE, 'NUMBER', 'NUMBER_INPUT', '0',
 '{"min": 0}', NULL, 'Art. 47: Solo oferentes calificados participan en puja', NOW(), NOW()),

(':CP_INFORME_CALIFICACION:', 'Informe de Calificación', 'Documento del informe de calificación', 'CP_SUBASTA_INVERSA', 'CALIFICACION', 3,
 FALSE, TRUE, 'TEXT', 'FILE_UPLOAD', NULL,
 NULL, NULL, 'Informe de la Comisión Técnica', NOW(), NOW()),

-- SIE SUBASTA/PUJA
(':CP_FECHA_PUJA:', 'Fecha y Hora de Puja', 'Fecha y hora programada para la puja electrónica', 'CP_SUBASTA_INVERSA', 'SUBASTA', 1,
 TRUE, TRUE, 'DATE', 'DATE_PICKER', NULL,
 NULL, NULL, 'Fecha y hora de inicio de la puja', NOW(), NOW()),

(':CP_PRECIO_INICIAL:', 'Precio Inicial Puja', 'Precio de arranque de la puja', 'CP_SUBASTA_INVERSA', 'SUBASTA', 2,
 TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00',
 '{"min": 0.01}', NULL, 'Presupuesto referencial como precio inicial', NOW(), NOW()),

(':CP_PRECIO_FINAL:', 'Precio Final Puja', 'Precio ganador al cierre de la puja', 'CP_SUBASTA_INVERSA', 'SUBASTA', 3,
 FALSE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00',
 NULL, NULL, 'Precio más bajo al cierre de la puja', NOW(), NOW()),

(':CP_AHORRO:', 'Ahorro Generado', 'Diferencia entre presupuesto referencial y precio adjudicado', 'CP_SUBASTA_INVERSA', 'SUBASTA', 4,
 FALSE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00',
 NULL, NULL, 'Ahorro para la entidad contratante', NOW(), NOW()),

-- SIE ADJUDICACION
(':CP_ADJUDICATARIO_RUC:', 'RUC Adjudicatario', 'RUC del proveedor adjudicado', 'CP_SUBASTA_INVERSA', 'ADJUDICACION', 1,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', '1234567890001',
 '{"pattern": "^[0-9]{13}$"}', NULL, 'RUC del proveedor ganador', NOW(), NOW()),

(':CP_ADJUDICATARIO_NOMBRE:', 'Nombre Adjudicatario', 'Razón social del proveedor adjudicado', 'CP_SUBASTA_INVERSA', 'ADJUDICACION', 2,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Nombre del proveedor',
 NULL, NULL, 'Razón social completa', NOW(), NOW()),

(':CP_MONTO_ADJUDICADO:', 'Monto Adjudicado', 'Valor total adjudicado con IVA', 'CP_SUBASTA_INVERSA', 'ADJUDICACION', 3,
 TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00',
 '{"min": 0.01}', NULL, 'Monto total del contrato adjudicado', NOW(), NOW()),

(':CP_RESOLUCION_ADJUDICACION:', 'No. Resolución Adjudicación', 'Número de resolución de adjudicación', 'CP_SUBASTA_INVERSA', 'ADJUDICACION', 4,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'RES-ADJ-2026-001',
 NULL, NULL, 'Art. 32 LOSNCP: Resolución de adjudicación motivada', NOW(), NOW()),

-- SIE CONTRATACION
(':CP_NUMERO_CONTRATO:', 'Número de Contrato', 'Número del contrato suscrito', 'CP_SUBASTA_INVERSA', 'CONTRATACION', 1,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'CONT-2026-001',
 NULL, NULL, 'Número único del contrato', NOW(), NOW()),

(':CP_FECHA_CONTRATO:', 'Fecha de Contrato', 'Fecha de suscripción del contrato', 'CP_SUBASTA_INVERSA', 'CONTRATACION', 2,
 TRUE, TRUE, 'DATE', 'DATE_PICKER', NULL,
 NULL, NULL, 'Art. 68: Dentro de 15 días de la adjudicación', NOW(), NOW()),

(':CP_GARANTIA_FIEL:', 'Garantía Fiel Cumplimiento', 'Monto de garantía de fiel cumplimiento (5%)', 'CP_SUBASTA_INVERSA', 'CONTRATACION', 3,
 TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00',
 NULL, NULL, 'Art. 73 LOSNCP: 5% del valor del contrato', NOW(), NOW()),

(':CP_GARANTIA_ANTICIPO:', 'Garantía Buen Uso Anticipo', 'Garantía por el anticipo entregado', 'CP_SUBASTA_INVERSA', 'CONTRATACION', 4,
 FALSE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00',
 NULL, NULL, 'Art. 73 LOSNCP: 100% del anticipo si aplica', NOW(), NOW()),

(':CP_PLAZO_CONTRACTUAL:', 'Plazo Contractual', 'Plazo de ejecución del contrato en días', 'CP_SUBASTA_INVERSA', 'CONTRATACION', 5,
 TRUE, TRUE, 'NUMBER', 'NUMBER_INPUT', 'Días',
 '{"min": 1}', NULL, 'Plazo total para la ejecución del contrato', NOW(), NOW()),

(':CP_ADMINISTRADOR:', 'Administrador de Contrato', 'Nombre del administrador designado', 'CP_SUBASTA_INVERSA', 'CONTRATACION', 6,
 TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Nombre completo',
 NULL, NULL, 'Art. 80 LOSNCP: Administrador del contrato', NOW(), NOW());

-- ---------------------------------------------------------------------------
-- 3.2 Copiar campos comunes para otros tipos de proceso
-- ---------------------------------------------------------------------------

-- CATÁLOGO ELECTRÓNICO - Campos de preparación
INSERT INTO swift_field_config_readmodel
  (field_code, field_name_key, description_key, message_type, section, display_order,
   is_required, is_active, field_type, component_type, placeholder_key,
   validation_rules, field_options, help_text_key, created_at, updated_at)
VALUES
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del objeto', 'CP_CATALOGO_ELECTRONICO', 'PREPARACION', 1, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Describa el objeto...', '{"maxLength": 2000}', NULL, 'Art. 44 LOSNCP', NOW(), NOW()),
(':CP_CPC:', 'Código CPC', 'Clasificador CPC', 'CP_CATALOGO_ELECTRONICO', 'PREPARACION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Código CPC', '{"pattern": "^[0-9]{8,10}$"}', NULL, 'Código del Catálogo Electrónico', NOW(), NOW()),
(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto con IVA', 'CP_CATALOGO_ELECTRONICO', 'PREPARACION', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', '{"min": 0.01}', NULL, 'Presupuesto referencial', NOW(), NOW()),
(':CP_CERT_PRESUP:', 'No. Cert. Presupuestaria', 'Certificación presupuestaria', 'CP_CATALOGO_ELECTRONICO', 'PREPARACION', 4, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'CDP-2026-001', NULL, NULL, 'Art. 24 LOSNCP', NOW(), NOW()),
-- CE SELECCION
(':CP_CATALOGO_ID:', 'ID Catálogo', 'Identificador del producto en catálogo', 'CP_CATALOGO_ELECTRONICO', 'SELECCION', 1, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'CAT-001', NULL, NULL, 'Código del producto en el catálogo SERCOP', NOW(), NOW()),
(':CP_PROVEEDOR_CAT:', 'Proveedor del Catálogo', 'Proveedor seleccionado del catálogo', 'CP_CATALOGO_ELECTRONICO', 'SELECCION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Nombre del proveedor', NULL, NULL, 'Proveedor catalogado', NOW(), NOW()),
(':CP_CANTIDAD:', 'Cantidad', 'Cantidad a adquirir', 'CP_CATALOGO_ELECTRONICO', 'SELECCION', 3, TRUE, TRUE, 'NUMBER', 'NUMBER_INPUT', '0', '{"min": 1}', NULL, 'Cantidad de unidades', NOW(), NOW()),
(':CP_PRECIO_CAT:', 'Precio Catálogo', 'Precio unitario en catálogo', 'CP_CATALOGO_ELECTRONICO', 'SELECCION', 4, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', NULL, NULL, 'Precio vigente en catálogo', NOW(), NOW()),
-- CE ORDEN_COMPRA
(':CP_NUM_ORDEN:', 'Número Orden de Compra', 'Número de la orden generada', 'CP_CATALOGO_ELECTRONICO', 'ORDEN_COMPRA', 1, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'OC-2026-001', NULL, NULL, 'Número de orden del portal', NOW(), NOW()),
(':CP_FECHA_ORDEN:', 'Fecha Orden', 'Fecha de generación de la orden', 'CP_CATALOGO_ELECTRONICO', 'ORDEN_COMPRA', 2, TRUE, TRUE, 'DATE', 'DATE_PICKER', NULL, NULL, NULL, 'Fecha de la orden de compra', NOW(), NOW()),
(':CP_MONTO_ORDEN:', 'Monto Total Orden', 'Valor total de la orden', 'CP_CATALOGO_ELECTRONICO', 'ORDEN_COMPRA', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', NULL, NULL, 'Monto total con IVA', NOW(), NOW()),
-- CE RECEPCION
(':CP_FECHA_RECEPCION:', 'Fecha Recepción', 'Fecha de recepción del bien/servicio', 'CP_CATALOGO_ELECTRONICO', 'RECEPCION', 1, TRUE, TRUE, 'DATE', 'DATE_PICKER', NULL, NULL, NULL, 'Fecha del acta de recepción', NOW(), NOW()),
(':CP_ACTA_RECEPCION:', 'Acta de Recepción', 'Documento de acta de entrega-recepción', 'CP_CATALOGO_ELECTRONICO', 'RECEPCION', 2, FALSE, TRUE, 'TEXT', 'FILE_UPLOAD', NULL, NULL, NULL, 'Art. 81 LOSNCP', NOW(), NOW()),
(':CP_CONFORMIDAD:', 'Conformidad', 'Estado de conformidad', 'CP_CATALOGO_ELECTRONICO', 'RECEPCION', 3, TRUE, TRUE, 'SELECT', 'SELECT', NULL, NULL, '[{"value":"CONFORME","label":"Conforme"},{"value":"NO_CONFORME","label":"No Conforme"},{"value":"PARCIAL","label":"Recepción Parcial"}]', 'Verificación de conformidad', NOW(), NOW()),

-- MENOR CUANTÍA
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del objeto', 'CP_MENOR_CUANTIA', 'PREPARACION', 1, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Objeto de contratación...', '{"maxLength": 2000}', NULL, 'Art. 51 LOSNCP', NOW(), NOW()),
(':CP_CPC:', 'Código CPC', 'Clasificador CPC', 'CP_MENOR_CUANTIA', 'PREPARACION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Código CPC', NULL, NULL, 'CPC del bien/servicio', NOW(), NOW()),
(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto referencial', 'CP_MENOR_CUANTIA', 'PREPARACION', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', '{"min": 0.01}', NULL, 'Monto < 0,000002 del PIE', NOW(), NOW()),
(':CP_CERT_PRESUP:', 'Certificación Presupuestaria', 'No. certificación', 'CP_MENOR_CUANTIA', 'PREPARACION', 4, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'CDP-2026-001', NULL, NULL, 'Art. 24 LOSNCP', NOW(), NOW()),
(':CP_RESOLUCION_INICIO:', 'Resolución de Inicio', 'No. resolución', 'CP_MENOR_CUANTIA', 'PREPARACION', 5, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'RES-2026-001', NULL, NULL, 'Resolución motivada', NOW(), NOW()),

-- LICITACIÓN
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del objeto', 'CP_LICITACION', 'PREPARACION', 1, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Objeto de contratación...', '{"maxLength": 2000}', NULL, 'Art. 48 LOSNCP', NOW(), NOW()),
(':CP_CPC:', 'Código CPC', 'Clasificador CPC', 'CP_LICITACION', 'PREPARACION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Código CPC', NULL, NULL, 'CPC', NOW(), NOW()),
(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto referencial', 'CP_LICITACION', 'PREPARACION', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', '{"min": 0.01}', NULL, 'Monto > 0,000015 del PIE', NOW(), NOW()),
(':CP_CERT_PRESUP:', 'Certificación Presupuestaria', 'No. certificación', 'CP_LICITACION', 'PREPARACION', 4, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'CDP-2026-001', NULL, NULL, 'Art. 24 LOSNCP', NOW(), NOW()),
(':CP_RESOLUCION_INICIO:', 'Resolución de Inicio', 'No. resolución', 'CP_LICITACION', 'PREPARACION', 5, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'RES-2026-001', NULL, NULL, 'Resolución motivada', NOW(), NOW()),
(':CP_COMISION_TECNICA:', 'Comisión Técnica', 'Miembros de la comisión técnica', 'CP_LICITACION', 'PREPARACION', 6, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Nombres de los miembros...', NULL, NULL, 'Art. 18 RGLOSNCP: Comisión Técnica obligatoria', NOW(), NOW()),

-- ÍNFIMA CUANTÍA
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del bien/servicio', 'CP_INFIMA_CUANTIA', 'PREPARACION', 1, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Describa el bien/servicio...', '{"maxLength": 1000}', NULL, 'Art. 52.1 LOSNCP', NOW(), NOW()),
(':CP_CPC:', 'Código CPC', 'Clasificador CPC', 'CP_INFIMA_CUANTIA', 'PREPARACION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Código CPC', NULL, NULL, 'CPC', NOW(), NOW()),
(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto estimado', 'CP_INFIMA_CUANTIA', 'PREPARACION', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', '{"min": 0.01, "max": 7263.42}', NULL, 'Monto < 0,0000002 del PIE (aprox. $7,263)', NOW(), NOW()),
(':CP_JUSTIFICACION:', 'Justificación', 'Justificación de la necesidad', 'CP_INFIMA_CUANTIA', 'PREPARACION', 4, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Justifique la necesidad...', NULL, NULL, 'Justificación de la contratación', NOW(), NOW()),

-- COTIZACIÓN
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del objeto', 'CP_COTIZACION', 'PREPARACION', 1, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Objeto de contratación...', '{"maxLength": 2000}', NULL, 'Art. 50 LOSNCP', NOW(), NOW()),
(':CP_CPC:', 'Código CPC', 'Clasificador CPC', 'CP_COTIZACION', 'PREPARACION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Código CPC', NULL, NULL, 'CPC', NOW(), NOW()),
(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto referencial', 'CP_COTIZACION', 'PREPARACION', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', '{"min": 0.01}', NULL, 'Entre 0,000002 y 0,000015 del PIE', NOW(), NOW()),
(':CP_CERT_PRESUP:', 'Certificación Presupuestaria', 'No. certificación', 'CP_COTIZACION', 'PREPARACION', 4, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'CDP-2026-001', NULL, NULL, 'Art. 24 LOSNCP', NOW(), NOW()),
(':CP_RESOLUCION_INICIO:', 'Resolución de Inicio', 'No. resolución', 'CP_COTIZACION', 'PREPARACION', 5, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'RES-2026-001', NULL, NULL, 'Resolución motivada', NOW(), NOW()),

-- RÉGIMEN ESPECIAL
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del objeto', 'CP_REGIMEN_ESPECIAL', 'PREPARACION', 1, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Objeto de contratación...', '{"maxLength": 2000}', NULL, 'Art. 2 LOSNCP', NOW(), NOW()),
(':CP_CPC:', 'Código CPC', 'Clasificador CPC', 'CP_REGIMEN_ESPECIAL', 'PREPARACION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Código CPC', NULL, NULL, 'CPC', NOW(), NOW()),
(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto referencial', 'CP_REGIMEN_ESPECIAL', 'PREPARACION', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', NULL, NULL, 'Presupuesto referencial', NOW(), NOW()),
(':CP_TIPO_REGIMEN:', 'Tipo Régimen Especial', 'Tipo de régimen especial aplicable', 'CP_REGIMEN_ESPECIAL', 'PREPARACION', 4, TRUE, TRUE, 'SELECT', 'SELECT', NULL, NULL, '[{"value":"SEGURIDAD","label":"Seguridad Nacional"},{"value":"COMUNICACION","label":"Comunicación Social"},{"value":"ASESORIA","label":"Asesoría/Consultoría"},{"value":"ESTRATEGICO","label":"Sector Estratégico"},{"value":"EMPRESA_PUBLICA","label":"Entre Entidades Públicas"},{"value":"INMUEBLE","label":"Adquisición de Inmuebles"},{"value":"FARMACEUTICO","label":"Bienes Farmacéuticos"}]', 'Tipo de régimen especial según Art. 2 LOSNCP', NOW(), NOW()),
(':CP_JUSTIFICACION_RE:', 'Justificación Régimen Especial', 'Justificación del uso de régimen especial', 'CP_REGIMEN_ESPECIAL', 'PREPARACION', 5, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Justifique el uso de Régimen Especial...', '{"minLength": 100}', NULL, 'Motivación legal y técnica del régimen especial', NOW(), NOW()),

-- FERIA INCLUSIVA
(':CP_OBJETO:', 'Objeto de Contratación', 'Descripción del objeto', 'CP_FERIA_INCLUSIVA', 'PREPARACION', 1, TRUE, TRUE, 'TEXTAREA', 'TEXTAREA', 'Objeto de contratación...', '{"maxLength": 2000}', NULL, 'Art. 6 LOSNCP: Feria Inclusiva', NOW(), NOW()),
(':CP_CPC:', 'Código CPC', 'Clasificador CPC', 'CP_FERIA_INCLUSIVA', 'PREPARACION', 2, TRUE, TRUE, 'TEXT', 'TEXT_INPUT', 'Código CPC', NULL, NULL, 'CPC', NOW(), NOW()),
(':CP_PRESUPUESTO:', 'Presupuesto Referencial', 'Monto referencial', 'CP_FERIA_INCLUSIVA', 'PREPARACION', 3, TRUE, TRUE, 'NUMBER', 'CURRENCY_INPUT', '$0.00', NULL, NULL, 'Presupuesto para EPS', NOW(), NOW()),
(':CP_TIPO_ACTOR_EPS:', 'Tipo Actor EPS', 'Tipo de actor de la Economía Popular y Solidaria', 'CP_FERIA_INCLUSIVA', 'PREPARACION', 4, TRUE, TRUE, 'SELECT', 'SELECT', NULL, NULL, '[{"value":"MICRO","label":"Microempresa"},{"value":"PEQUEÑA","label":"Pequeña Empresa"},{"value":"ARTESANO","label":"Artesano"},{"value":"EPS","label":"Organización EPS"},{"value":"ASOCIACION","label":"Asociación Productiva"}]', 'Tipo de actor para Feria Inclusiva', NOW(), NOW());
