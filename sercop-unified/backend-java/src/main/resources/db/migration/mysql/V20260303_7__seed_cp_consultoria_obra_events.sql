-- =============================================================================
-- V20260303_7: Seed events, flows, and fields for CP_CONSULTORIA_* and CP_OBRA_*
-- These are specific sub-types of consultoria and construction processes per LOSNCP
-- =============================================================================

-- =============================================================================
-- 1. EVENT TYPES
-- =============================================================================

-- CP_CONSULTORIA_DIRECTA (Art. 36 LOSNCP - Hasta $72,634.22)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_CDD_PREPARACION', 'Fase Preparatoria', 'CP_CONSULTORIA_DIRECTA', 1, 'TDR, resolución de inicio y selección del consultor', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'es'),
('CP_CDD_PREPARACION', 'Preparation Phase', 'CP_CONSULTORIA_DIRECTA', 1, 'TOR, start resolution and consultant selection', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'en'),
('CP_CDD_INVITACION', 'Invitación', 'CP_CONSULTORIA_DIRECTA', 2, 'Invitación directa al consultor seleccionado', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'es'),
('CP_CDD_INVITACION', 'Invitation', 'CP_CONSULTORIA_DIRECTA', 2, 'Direct invitation to selected consultant', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'en'),
('CP_CDD_NEGOCIACION', 'Negociación', 'CP_CONSULTORIA_DIRECTA', 3, 'Negociación de condiciones técnicas y económicas', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'es'),
('CP_CDD_NEGOCIACION', 'Negotiation', 'CP_CONSULTORIA_DIRECTA', 3, 'Technical and economic negotiation', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'en'),
('CP_CDD_ADJUDICACION', 'Adjudicación', 'CP_CONSULTORIA_DIRECTA', 4, 'Resolución de adjudicación', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'es'),
('CP_CDD_ADJUDICACION', 'Award', 'CP_CONSULTORIA_DIRECTA', 4, 'Award resolution', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'en'),
('CP_CDD_CONTRATACION', 'Contratación', 'CP_CONSULTORIA_DIRECTA', 5, 'Firma de contrato', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'es'),
('CP_CDD_CONTRATACION', 'Contracting', 'CP_CONSULTORIA_DIRECTA', 5, 'Contract signing', 'CP_CONSULTORIA_DIRECTA', 'CP_CONSULTORIA_DIRECTA', 1, 'en');

-- CP_CONSULTORIA_LISTA_CORTA (Art. 36 LOSNCP - $72,634.22 a $544,756.64)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_CLC_PREPARACION', 'Fase Preparatoria', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'TDR, resolución de inicio y conformación de lista corta', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es'),
('CP_CLC_PREPARACION', 'Preparation Phase', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'TOR, start resolution and short list formation', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en'),
('CP_CLC_CONVOCATORIA', 'Convocatoria', 'CP_CONSULTORIA_LISTA_CORTA', 2, 'Invitación a consultores de lista corta (mín. 3)', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es'),
('CP_CLC_CONVOCATORIA', 'Call for Proposals', 'CP_CONSULTORIA_LISTA_CORTA', 2, 'Invitation to short-listed consultants (min. 3)', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en'),
('CP_CLC_OFERTAS', 'Recepción de Ofertas', 'CP_CONSULTORIA_LISTA_CORTA', 3, 'Recepción de propuestas técnicas y económicas', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es'),
('CP_CLC_OFERTAS', 'Proposal Reception', 'CP_CONSULTORIA_LISTA_CORTA', 3, 'Reception of technical and economic proposals', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en'),
('CP_CLC_EVALUACION', 'Evaluación', 'CP_CONSULTORIA_LISTA_CORTA', 4, 'Evaluación técnica (80%) y económica (20%)', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es'),
('CP_CLC_EVALUACION', 'Evaluation', 'CP_CONSULTORIA_LISTA_CORTA', 4, 'Technical (80%) and economic (20%) evaluation', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en'),
('CP_CLC_NEGOCIACION', 'Negociación', 'CP_CONSULTORIA_LISTA_CORTA', 5, 'Negociación con el mejor evaluado', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es'),
('CP_CLC_NEGOCIACION', 'Negotiation', 'CP_CONSULTORIA_LISTA_CORTA', 5, 'Negotiation with highest-ranked bidder', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en'),
('CP_CLC_ADJUDICACION', 'Adjudicación', 'CP_CONSULTORIA_LISTA_CORTA', 6, 'Resolución de adjudicación', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es'),
('CP_CLC_ADJUDICACION', 'Award', 'CP_CONSULTORIA_LISTA_CORTA', 6, 'Award resolution', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en'),
('CP_CLC_CONTRATACION', 'Contratación', 'CP_CONSULTORIA_LISTA_CORTA', 7, 'Firma de contrato', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es'),
('CP_CLC_CONTRATACION', 'Contracting', 'CP_CONSULTORIA_LISTA_CORTA', 7, 'Contract signing', 'CP_CONSULTORIA_LISTA_CORTA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en');

-- CP_CONSULTORIA_CONCURSO (Art. 36 LOSNCP - Mayor a $544,756.64)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_CCP_PREPARACION', 'Fase Preparatoria', 'CP_CONSULTORIA_CONCURSO', 1, 'TDR, resolución de inicio y pliegos', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_PREPARACION', 'Preparation Phase', 'CP_CONSULTORIA_CONCURSO', 1, 'TOR, start resolution and bidding documents', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en'),
('CP_CCP_CONVOCATORIA', 'Convocatoria Pública', 'CP_CONSULTORIA_CONCURSO', 2, 'Publicación abierta en portal SERCOP', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_CONVOCATORIA', 'Public Call', 'CP_CONSULTORIA_CONCURSO', 2, 'Open publication on SERCOP portal', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en'),
('CP_CCP_PREGUNTAS', 'Preguntas y Aclaraciones', 'CP_CONSULTORIA_CONCURSO', 3, 'Período de preguntas y respuestas', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_PREGUNTAS', 'Questions and Clarifications', 'CP_CONSULTORIA_CONCURSO', 3, 'Questions and answers period', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en'),
('CP_CCP_OFERTAS', 'Recepción de Ofertas', 'CP_CONSULTORIA_CONCURSO', 4, 'Recepción de propuestas técnicas y económicas', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_OFERTAS', 'Proposal Reception', 'CP_CONSULTORIA_CONCURSO', 4, 'Reception of technical and economic proposals', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en'),
('CP_CCP_EVALUACION', 'Evaluación', 'CP_CONSULTORIA_CONCURSO', 5, 'Evaluación técnica (80%) y económica (20%)', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_EVALUACION', 'Evaluation', 'CP_CONSULTORIA_CONCURSO', 5, 'Technical (80%) and economic (20%) evaluation', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en'),
('CP_CCP_NEGOCIACION', 'Negociación', 'CP_CONSULTORIA_CONCURSO', 6, 'Negociación con el mejor evaluado', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_NEGOCIACION', 'Negotiation', 'CP_CONSULTORIA_CONCURSO', 6, 'Negotiation with highest-ranked bidder', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en'),
('CP_CCP_ADJUDICACION', 'Adjudicación', 'CP_CONSULTORIA_CONCURSO', 7, 'Resolución de adjudicación', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_ADJUDICACION', 'Award', 'CP_CONSULTORIA_CONCURSO', 7, 'Award resolution', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en'),
('CP_CCP_CONTRATACION', 'Contratación', 'CP_CONSULTORIA_CONCURSO', 8, 'Firma de contrato', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'es'),
('CP_CCP_CONTRATACION', 'Contracting', 'CP_CONSULTORIA_CONCURSO', 8, 'Contract signing', 'CP_CONSULTORIA_CONCURSO', 'CP_CONSULTORIA_CONCURSO', 1, 'en');

-- CP_OBRA_MENOR_CUANTIA (Art. 51 LOSNCP - $7,263.42 a $244,640.49)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_OMC_PREPARACION', 'Fase Preparatoria', 'CP_OBRA_MENOR_CUANTIA', 1, 'Estudios, diseños, presupuesto y resolución de inicio', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es'),
('CP_OMC_PREPARACION', 'Preparation Phase', 'CP_OBRA_MENOR_CUANTIA', 1, 'Studies, designs, budget and start resolution', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en'),
('CP_OMC_SORTEO', 'Sorteo', 'CP_OBRA_MENOR_CUANTIA', 2, 'Sorteo entre proveedores habilitados por CPC', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es'),
('CP_OMC_SORTEO', 'Random Selection', 'CP_OBRA_MENOR_CUANTIA', 2, 'Random selection among qualified providers by CPC', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en'),
('CP_OMC_INVITACION', 'Invitación', 'CP_OBRA_MENOR_CUANTIA', 3, 'Invitación al proveedor seleccionado por sorteo', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es'),
('CP_OMC_INVITACION', 'Invitation', 'CP_OBRA_MENOR_CUANTIA', 3, 'Invitation to randomly selected provider', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en'),
('CP_OMC_OFERTA', 'Recepción de Oferta', 'CP_OBRA_MENOR_CUANTIA', 4, 'Recepción y evaluación de la oferta', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es'),
('CP_OMC_OFERTA', 'Offer Reception', 'CP_OBRA_MENOR_CUANTIA', 4, 'Offer reception and evaluation', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en'),
('CP_OMC_ADJUDICACION', 'Adjudicación', 'CP_OBRA_MENOR_CUANTIA', 5, 'Resolución de adjudicación', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es'),
('CP_OMC_ADJUDICACION', 'Award', 'CP_OBRA_MENOR_CUANTIA', 5, 'Award resolution', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en'),
('CP_OMC_CONTRATACION', 'Contratación', 'CP_OBRA_MENOR_CUANTIA', 6, 'Firma de contrato y garantías', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es'),
('CP_OMC_CONTRATACION', 'Contracting', 'CP_OBRA_MENOR_CUANTIA', 6, 'Contract signing and guarantees', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en'),
('CP_OMC_EJECUCION', 'Ejecución y Fiscalización', 'CP_OBRA_MENOR_CUANTIA', 7, 'Ejecución de obra con fiscalización', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es'),
('CP_OMC_EJECUCION', 'Execution and Oversight', 'CP_OBRA_MENOR_CUANTIA', 7, 'Construction execution with oversight', 'CP_OBRA_MENOR_CUANTIA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en');

-- CP_OBRA_COTIZACION (Art. 50 LOSNCP - $244,640.49 a $978,561.95)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_OC_PREPARACION', 'Fase Preparatoria', 'CP_OBRA_COTIZACION', 1, 'Estudios completos, presupuesto referencial y resolución', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_PREPARACION', 'Preparation Phase', 'CP_OBRA_COTIZACION', 1, 'Complete studies, reference budget and resolution', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en'),
('CP_OC_CONVOCATORIA', 'Convocatoria', 'CP_OBRA_COTIZACION', 2, 'Invitación a proveedores habilitados', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_CONVOCATORIA', 'Call for Bids', 'CP_OBRA_COTIZACION', 2, 'Invitation to qualified providers', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en'),
('CP_OC_PREGUNTAS', 'Preguntas y Aclaraciones', 'CP_OBRA_COTIZACION', 3, 'Período de consultas sobre los pliegos', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_PREGUNTAS', 'Questions', 'CP_OBRA_COTIZACION', 3, 'Document consultation period', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en'),
('CP_OC_OFERTAS', 'Recepción de Ofertas', 'CP_OBRA_COTIZACION', 4, 'Recepción y apertura de ofertas', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_OFERTAS', 'Offer Reception', 'CP_OBRA_COTIZACION', 4, 'Offer reception and opening', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en'),
('CP_OC_EVALUACION', 'Evaluación', 'CP_OBRA_COTIZACION', 5, 'Evaluación técnica y económica por comisión', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_EVALUACION', 'Evaluation', 'CP_OBRA_COTIZACION', 5, 'Technical and economic evaluation by committee', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en'),
('CP_OC_ADJUDICACION', 'Adjudicación', 'CP_OBRA_COTIZACION', 6, 'Resolución de adjudicación', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_ADJUDICACION', 'Award', 'CP_OBRA_COTIZACION', 6, 'Award resolution', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en'),
('CP_OC_CONTRATACION', 'Contratación', 'CP_OBRA_COTIZACION', 7, 'Firma de contrato y garantías', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_CONTRATACION', 'Contracting', 'CP_OBRA_COTIZACION', 7, 'Contract signing and guarantees', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en'),
('CP_OC_EJECUCION', 'Ejecución y Fiscalización', 'CP_OBRA_COTIZACION', 8, 'Ejecución de obra con fiscalización', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'es'),
('CP_OC_EJECUCION', 'Execution and Oversight', 'CP_OBRA_COTIZACION', 8, 'Construction execution with oversight', 'CP_OBRA_COTIZACION', 'CP_OBRA_COTIZACION', 1, 'en');

-- CP_OBRA_LICITACION (Art. 48 LOSNCP - Mayor a $978,561.95)
INSERT INTO event_type_config_readmodel (event_code, event_name, operation_type, display_order, event_description, outbound_message_type, inbound_message_type, is_active, language)
VALUES
('CP_OL_PREPARACION', 'Fase Preparatoria', 'CP_OBRA_LICITACION', 1, 'Estudios definitivos, presupuesto referencial y resolución', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_PREPARACION', 'Preparation Phase', 'CP_OBRA_LICITACION', 1, 'Final studies, reference budget and resolution', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en'),
('CP_OL_CONVOCATORIA', 'Convocatoria Pública', 'CP_OBRA_LICITACION', 2, 'Publicación en portal SERCOP', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_CONVOCATORIA', 'Public Call', 'CP_OBRA_LICITACION', 2, 'Publication on SERCOP portal', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en'),
('CP_OL_PREGUNTAS', 'Preguntas y Aclaraciones', 'CP_OBRA_LICITACION', 3, 'Período de preguntas, respuestas y aclaraciones', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_PREGUNTAS', 'Questions and Clarifications', 'CP_OBRA_LICITACION', 3, 'Questions, answers and clarifications period', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en'),
('CP_OL_OFERTAS', 'Recepción de Ofertas', 'CP_OBRA_LICITACION', 4, 'Recepción y apertura pública de ofertas', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_OFERTAS', 'Offer Reception', 'CP_OBRA_LICITACION', 4, 'Public offer reception and opening', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en'),
('CP_OL_EVALUACION', 'Evaluación', 'CP_OBRA_LICITACION', 5, 'Evaluación por comisión técnica', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_EVALUACION', 'Evaluation', 'CP_OBRA_LICITACION', 5, 'Evaluation by technical committee', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en'),
('CP_OL_ADJUDICACION', 'Adjudicación', 'CP_OBRA_LICITACION', 6, 'Resolución de adjudicación', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_ADJUDICACION', 'Award', 'CP_OBRA_LICITACION', 6, 'Award resolution', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en'),
('CP_OL_CONTRATACION', 'Contratación', 'CP_OBRA_LICITACION', 7, 'Firma de contrato y garantías', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_CONTRATACION', 'Contracting', 'CP_OBRA_LICITACION', 7, 'Contract signing and guarantees', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en'),
('CP_OL_EJECUCION', 'Ejecución y Fiscalización', 'CP_OBRA_LICITACION', 8, 'Ejecución de obra con fiscalización permanente', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'es'),
('CP_OL_EJECUCION', 'Execution and Oversight', 'CP_OBRA_LICITACION', 8, 'Construction with permanent oversight', 'CP_OBRA_LICITACION', 'CP_OBRA_LICITACION', 1, 'en');


-- =============================================================================
-- 2. EVENT FLOWS
-- =============================================================================

-- CP_CONSULTORIA_DIRECTA flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_CDD_PREPARACION', 'CP_CDD_INVITACION', 'CP_CONSULTORIA_DIRECTA', 1, 'es', 'Invitar Consultor'),
('CP_CDD_PREPARACION', 'CP_CDD_INVITACION', 'CP_CONSULTORIA_DIRECTA', 1, 'en', 'Invite Consultant'),
('CP_CDD_INVITACION', 'CP_CDD_NEGOCIACION', 'CP_CONSULTORIA_DIRECTA', 1, 'es', 'Negociar'),
('CP_CDD_INVITACION', 'CP_CDD_NEGOCIACION', 'CP_CONSULTORIA_DIRECTA', 1, 'en', 'Negotiate'),
('CP_CDD_NEGOCIACION', 'CP_CDD_ADJUDICACION', 'CP_CONSULTORIA_DIRECTA', 1, 'es', 'Adjudicar'),
('CP_CDD_NEGOCIACION', 'CP_CDD_ADJUDICACION', 'CP_CONSULTORIA_DIRECTA', 1, 'en', 'Award'),
('CP_CDD_ADJUDICACION', 'CP_CDD_CONTRATACION', 'CP_CONSULTORIA_DIRECTA', 1, 'es', 'Firmar Contrato'),
('CP_CDD_ADJUDICACION', 'CP_CDD_CONTRATACION', 'CP_CONSULTORIA_DIRECTA', 1, 'en', 'Sign Contract');

-- CP_CONSULTORIA_LISTA_CORTA flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_CLC_PREPARACION', 'CP_CLC_CONVOCATORIA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es', 'Enviar Invitaciones'),
('CP_CLC_PREPARACION', 'CP_CLC_CONVOCATORIA', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en', 'Send Invitations'),
('CP_CLC_CONVOCATORIA', 'CP_CLC_OFERTAS', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es', 'Recibir Ofertas'),
('CP_CLC_CONVOCATORIA', 'CP_CLC_OFERTAS', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en', 'Receive Proposals'),
('CP_CLC_OFERTAS', 'CP_CLC_EVALUACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es', 'Evaluar'),
('CP_CLC_OFERTAS', 'CP_CLC_EVALUACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en', 'Evaluate'),
('CP_CLC_EVALUACION', 'CP_CLC_NEGOCIACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es', 'Negociar'),
('CP_CLC_EVALUACION', 'CP_CLC_NEGOCIACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en', 'Negotiate'),
('CP_CLC_NEGOCIACION', 'CP_CLC_ADJUDICACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es', 'Adjudicar'),
('CP_CLC_NEGOCIACION', 'CP_CLC_ADJUDICACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en', 'Award'),
('CP_CLC_ADJUDICACION', 'CP_CLC_CONTRATACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'es', 'Firmar Contrato'),
('CP_CLC_ADJUDICACION', 'CP_CLC_CONTRATACION', 'CP_CONSULTORIA_LISTA_CORTA', 1, 'en', 'Sign Contract');

-- CP_CONSULTORIA_CONCURSO flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_CCP_PREPARACION', 'CP_CCP_CONVOCATORIA', 'CP_CONSULTORIA_CONCURSO', 1, 'es', 'Publicar Convocatoria'),
('CP_CCP_PREPARACION', 'CP_CCP_CONVOCATORIA', 'CP_CONSULTORIA_CONCURSO', 1, 'en', 'Publish Call'),
('CP_CCP_CONVOCATORIA', 'CP_CCP_PREGUNTAS', 'CP_CONSULTORIA_CONCURSO', 1, 'es', 'Abrir Preguntas'),
('CP_CCP_CONVOCATORIA', 'CP_CCP_PREGUNTAS', 'CP_CONSULTORIA_CONCURSO', 1, 'en', 'Open Questions'),
('CP_CCP_PREGUNTAS', 'CP_CCP_OFERTAS', 'CP_CONSULTORIA_CONCURSO', 1, 'es', 'Recibir Ofertas'),
('CP_CCP_PREGUNTAS', 'CP_CCP_OFERTAS', 'CP_CONSULTORIA_CONCURSO', 1, 'en', 'Receive Proposals'),
('CP_CCP_OFERTAS', 'CP_CCP_EVALUACION', 'CP_CONSULTORIA_CONCURSO', 1, 'es', 'Evaluar'),
('CP_CCP_OFERTAS', 'CP_CCP_EVALUACION', 'CP_CONSULTORIA_CONCURSO', 1, 'en', 'Evaluate'),
('CP_CCP_EVALUACION', 'CP_CCP_NEGOCIACION', 'CP_CONSULTORIA_CONCURSO', 1, 'es', 'Negociar'),
('CP_CCP_EVALUACION', 'CP_CCP_NEGOCIACION', 'CP_CONSULTORIA_CONCURSO', 1, 'en', 'Negotiate'),
('CP_CCP_NEGOCIACION', 'CP_CCP_ADJUDICACION', 'CP_CONSULTORIA_CONCURSO', 1, 'es', 'Adjudicar'),
('CP_CCP_NEGOCIACION', 'CP_CCP_ADJUDICACION', 'CP_CONSULTORIA_CONCURSO', 1, 'en', 'Award'),
('CP_CCP_ADJUDICACION', 'CP_CCP_CONTRATACION', 'CP_CONSULTORIA_CONCURSO', 1, 'es', 'Firmar Contrato'),
('CP_CCP_ADJUDICACION', 'CP_CCP_CONTRATACION', 'CP_CONSULTORIA_CONCURSO', 1, 'en', 'Sign Contract');

-- CP_OBRA_MENOR_CUANTIA flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_OMC_PREPARACION', 'CP_OMC_SORTEO', 'CP_OBRA_MENOR_CUANTIA', 1, 'es', 'Realizar Sorteo'),
('CP_OMC_PREPARACION', 'CP_OMC_SORTEO', 'CP_OBRA_MENOR_CUANTIA', 1, 'en', 'Perform Draw'),
('CP_OMC_SORTEO', 'CP_OMC_INVITACION', 'CP_OBRA_MENOR_CUANTIA', 1, 'es', 'Invitar'),
('CP_OMC_SORTEO', 'CP_OMC_INVITACION', 'CP_OBRA_MENOR_CUANTIA', 1, 'en', 'Invite'),
('CP_OMC_INVITACION', 'CP_OMC_OFERTA', 'CP_OBRA_MENOR_CUANTIA', 1, 'es', 'Recibir Oferta'),
('CP_OMC_INVITACION', 'CP_OMC_OFERTA', 'CP_OBRA_MENOR_CUANTIA', 1, 'en', 'Receive Offer'),
('CP_OMC_OFERTA', 'CP_OMC_ADJUDICACION', 'CP_OBRA_MENOR_CUANTIA', 1, 'es', 'Adjudicar'),
('CP_OMC_OFERTA', 'CP_OMC_ADJUDICACION', 'CP_OBRA_MENOR_CUANTIA', 1, 'en', 'Award'),
('CP_OMC_ADJUDICACION', 'CP_OMC_CONTRATACION', 'CP_OBRA_MENOR_CUANTIA', 1, 'es', 'Firmar Contrato'),
('CP_OMC_ADJUDICACION', 'CP_OMC_CONTRATACION', 'CP_OBRA_MENOR_CUANTIA', 1, 'en', 'Sign Contract'),
('CP_OMC_CONTRATACION', 'CP_OMC_EJECUCION', 'CP_OBRA_MENOR_CUANTIA', 1, 'es', 'Iniciar Obra'),
('CP_OMC_CONTRATACION', 'CP_OMC_EJECUCION', 'CP_OBRA_MENOR_CUANTIA', 1, 'en', 'Start Construction');

-- CP_OBRA_COTIZACION flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_OC_PREPARACION', 'CP_OC_CONVOCATORIA', 'CP_OBRA_COTIZACION', 1, 'es', 'Publicar Convocatoria'),
('CP_OC_PREPARACION', 'CP_OC_CONVOCATORIA', 'CP_OBRA_COTIZACION', 1, 'en', 'Publish Call'),
('CP_OC_CONVOCATORIA', 'CP_OC_PREGUNTAS', 'CP_OBRA_COTIZACION', 1, 'es', 'Abrir Preguntas'),
('CP_OC_CONVOCATORIA', 'CP_OC_PREGUNTAS', 'CP_OBRA_COTIZACION', 1, 'en', 'Open Questions'),
('CP_OC_PREGUNTAS', 'CP_OC_OFERTAS', 'CP_OBRA_COTIZACION', 1, 'es', 'Recibir Ofertas'),
('CP_OC_PREGUNTAS', 'CP_OC_OFERTAS', 'CP_OBRA_COTIZACION', 1, 'en', 'Receive Offers'),
('CP_OC_OFERTAS', 'CP_OC_EVALUACION', 'CP_OBRA_COTIZACION', 1, 'es', 'Evaluar'),
('CP_OC_OFERTAS', 'CP_OC_EVALUACION', 'CP_OBRA_COTIZACION', 1, 'en', 'Evaluate'),
('CP_OC_EVALUACION', 'CP_OC_ADJUDICACION', 'CP_OBRA_COTIZACION', 1, 'es', 'Adjudicar'),
('CP_OC_EVALUACION', 'CP_OC_ADJUDICACION', 'CP_OBRA_COTIZACION', 1, 'en', 'Award'),
('CP_OC_ADJUDICACION', 'CP_OC_CONTRATACION', 'CP_OBRA_COTIZACION', 1, 'es', 'Firmar Contrato'),
('CP_OC_ADJUDICACION', 'CP_OC_CONTRATACION', 'CP_OBRA_COTIZACION', 1, 'en', 'Sign Contract'),
('CP_OC_CONTRATACION', 'CP_OC_EJECUCION', 'CP_OBRA_COTIZACION', 1, 'es', 'Iniciar Obra'),
('CP_OC_CONTRATACION', 'CP_OC_EJECUCION', 'CP_OBRA_COTIZACION', 1, 'en', 'Start Construction');

-- CP_OBRA_LICITACION flows
INSERT INTO event_flow_config_readmodel (from_event_code, to_event_code, operation_type, is_active, language, transition_label)
VALUES
('CP_OL_PREPARACION', 'CP_OL_CONVOCATORIA', 'CP_OBRA_LICITACION', 1, 'es', 'Publicar Convocatoria'),
('CP_OL_PREPARACION', 'CP_OL_CONVOCATORIA', 'CP_OBRA_LICITACION', 1, 'en', 'Publish Call'),
('CP_OL_CONVOCATORIA', 'CP_OL_PREGUNTAS', 'CP_OBRA_LICITACION', 1, 'es', 'Abrir Preguntas'),
('CP_OL_CONVOCATORIA', 'CP_OL_PREGUNTAS', 'CP_OBRA_LICITACION', 1, 'en', 'Open Questions'),
('CP_OL_PREGUNTAS', 'CP_OL_OFERTAS', 'CP_OBRA_LICITACION', 1, 'es', 'Recibir Ofertas'),
('CP_OL_PREGUNTAS', 'CP_OL_OFERTAS', 'CP_OBRA_LICITACION', 1, 'en', 'Receive Offers'),
('CP_OL_OFERTAS', 'CP_OL_EVALUACION', 'CP_OBRA_LICITACION', 1, 'es', 'Evaluar'),
('CP_OL_OFERTAS', 'CP_OL_EVALUACION', 'CP_OBRA_LICITACION', 1, 'en', 'Evaluate'),
('CP_OL_EVALUACION', 'CP_OL_ADJUDICACION', 'CP_OBRA_LICITACION', 1, 'es', 'Adjudicar'),
('CP_OL_EVALUACION', 'CP_OL_ADJUDICACION', 'CP_OBRA_LICITACION', 1, 'en', 'Award'),
('CP_OL_ADJUDICACION', 'CP_OL_CONTRATACION', 'CP_OBRA_LICITACION', 1, 'es', 'Firmar Contrato'),
('CP_OL_ADJUDICACION', 'CP_OL_CONTRATACION', 'CP_OBRA_LICITACION', 1, 'en', 'Sign Contract'),
('CP_OL_CONTRATACION', 'CP_OL_EJECUCION', 'CP_OBRA_LICITACION', 1, 'es', 'Iniciar Obra'),
('CP_OL_CONTRATACION', 'CP_OL_EJECUCION', 'CP_OBRA_LICITACION', 1, 'en', 'Start Construction');


-- =============================================================================
-- 3. FIELD CONFIGS (reuse common CP fields + add obra-specific fields)
-- Using INSERT IGNORE to skip duplicates on uk_field_spec_version
-- =============================================================================

-- Common PREPARACION fields for all 6 types
INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_OBJETO:', 'cp.field.objeto', 'cp.field.objeto.desc', t.type_name, 'PREPARACION', 1, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.objeto.placeholder',
 '{"required":true,"minLength":20,"maxLength":500}', 1,
 CONCAT('Eres un experto en contratación pública ecuatoriana. Ayuda con el OBJETO DE CONTRATACIÓN para ', t.label, '. Debe ser claro, específico y alineado con la necesidad institucional según LOSNCP.\nResponde en español.'),
 'Valida que el objeto sea específico y no genérico.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name, 'Consultoría Directa' AS label UNION ALL
  SELECT 'CP_CONSULTORIA_LISTA_CORTA', 'Consultoría Lista Corta' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO', 'Consultoría Concurso Público' UNION ALL
  SELECT 'CP_OBRA_MENOR_CUANTIA', 'Obra Menor Cuantía' UNION ALL
  SELECT 'CP_OBRA_COTIZACION', 'Obra Cotización' UNION ALL
  SELECT 'CP_OBRA_LICITACION', 'Obra Licitación'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_PRESUPUESTO:', 'cp.field.presupuesto', 'cp.field.presupuesto.desc', t.type_name, 'PREPARACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.presupuesto.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 CONCAT('Eres un experto en contratación pública ecuatoriana. Ayuda con el PRESUPUESTO REFERENCIAL para ', t.label, '. ', t.rango, '\nResponde en español.'),
 'Valida monto positivo coherente con el tipo de proceso.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name, 'Consultoría Directa' AS label, 'Máximo $72,634.22 (coeficiente 0.000002 del PIE).' AS rango UNION ALL
  SELECT 'CP_CONSULTORIA_LISTA_CORTA', 'Consultoría Lista Corta', 'Entre $72,634.22 y $544,756.64.' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO', 'Consultoría Concurso Público', 'Mayor a $544,756.64.' UNION ALL
  SELECT 'CP_OBRA_MENOR_CUANTIA', 'Obra Menor Cuantía', 'Entre $7,263.42 y $244,640.49.' UNION ALL
  SELECT 'CP_OBRA_COTIZACION', 'Obra Cotización', 'Entre $244,640.49 y $978,561.95.' UNION ALL
  SELECT 'CP_OBRA_LICITACION', 'Obra Licitación', 'Mayor a $978,561.95.'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_CERT_PRESUP:', 'cp.field.certPresup', 'cp.field.certPresup.desc', t.type_name, 'PREPARACION', 3, 1, 1, 'TEXT', 'INPUT', 'cp.field.certPresup.placeholder',
 '{"required":true,"pattern":"^[A-Za-z0-9\\\\-/]+$"}', 1,
 'Ayuda con la CERTIFICACIÓN PRESUPUESTARIA. Obligatoria según Art. 24 LOSNCP.\nResponde en español.',
 'Valida formato de certificación.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_RESOLUCION_INICIO:', 'cp.field.resolucionInicio', 'cp.field.resolucionInicio.desc', t.type_name, 'PREPARACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.resolucionInicio.placeholder',
 '{"required":true}', 1,
 'Ayuda con la RESOLUCIÓN DE INICIO. La máxima autoridad aprueba pliegos y cronograma.\nResponde en español.',
 'Valida número de resolución.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

-- TDR for consultoria types
INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_TDR:', 'cp.field.tdr', 'cp.field.tdr.desc', t.type_name, 'PREPARACION', 5, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.tdr.placeholder',
 '{"required":true,"minLength":100}', 1,
 'Ayuda con los TÉRMINOS DE REFERENCIA (TDR) para consultoría. Incluir: antecedentes, objetivos, alcance, metodología, personal clave, plazo, entregables, presupuesto desglosado.\nResponde en español.',
 'Valida TDR completos.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL
  SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO'
) t;

-- Estudios/diseños for obra types
INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_ESTUDIOS_DISENOS:', 'cp.field.estudiosDisenos', 'cp.field.estudiosDisenos.desc', t.type_name, 'PREPARACION', 5, 1, 1, 'TEXT', 'TEXTAREA', 'cp.field.estudiosDisenos.placeholder',
 '{"required":true,"minLength":20}', 1,
 'Ayuda con ESTUDIOS Y DISEÑOS para obras. Según Art. 23 LOSNCP deben estar completos y aprobados antes de iniciar el proceso. Incluir: planos, especificaciones técnicas, cronograma valorado, análisis de precios unitarios.\nResponde en español.',
 'Valida referencia a estudios y diseños.', '2024', NOW()
FROM (
  SELECT 'CP_OBRA_MENOR_CUANTIA' AS type_name UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL
  SELECT 'CP_OBRA_LICITACION'
) t;

-- ADJUDICACION fields for all 6 types
INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_ADJUDICATARIO_NOMBRE:', 'cp.field.adjudicatarioNombre', 'cp.field.adjudicatarioNombre.desc', t.type_name, 'ADJUDICACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.adjudicatarioNombre.placeholder',
 '{"required":true,"minLength":3}', 1,
 'Ayuda con el NOMBRE DEL ADJUDICATARIO. Debe coincidir con el RUP del SERCOP.\nResponde en español.',
 'Valida nombre.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_MONTO_ADJUDICADO:', 'cp.field.montoAdjudicado', 'cp.field.montoAdjudicado.desc', t.type_name, 'ADJUDICACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoAdjudicado.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO ADJUDICADO. No puede exceder el presupuesto referencial.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_RESOLUCION_ADJUDICACION:', 'cp.field.resolucionAdjudicacion', 'cp.field.resolucionAdjudicacion.desc', t.type_name, 'ADJUDICACION', 3, 1, 1, 'TEXT', 'INPUT', 'cp.field.resolucionAdjudicacion.placeholder',
 '{"required":true}', 1,
 'Ayuda con la RESOLUCIÓN DE ADJUDICACIÓN.\nResponde en español.',
 'Valida número de resolución.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

-- CONTRATACION fields for all 6 types
INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_NUMERO_CONTRATO:', 'cp.field.numeroContrato', 'cp.field.numeroContrato.desc', t.type_name, 'CONTRATACION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.numeroContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con el NÚMERO DE CONTRATO.\nResponde en español.',
 'Valida número de contrato.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_MONTO_CONTRATO:', 'cp.field.montoContrato', 'cp.field.montoContrato.desc', t.type_name, 'CONTRATACION', 2, 1, 1, 'NUMBER', 'INPUT', 'cp.field.montoContrato.placeholder',
 '{"required":true,"minValue":0.01}', 1,
 'Ayuda con el MONTO DEL CONTRATO.\nResponde en español.',
 'Valida monto positivo.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_PLAZO_CONTRATO:', 'cp.field.plazoContrato', 'cp.field.plazoContrato.desc', t.type_name, 'CONTRATACION', 3, 1, 1, 'TEXT', 'INPUT', 'cp.field.plazoContrato.placeholder',
 '{"required":true}', 1,
 'Ayuda con el PLAZO DEL CONTRATO en días calendario.\nResponde en español.',
 'Valida plazo.', '2024', NOW()
FROM (
  SELECT 'CP_CONSULTORIA_DIRECTA' AS type_name UNION ALL SELECT 'CP_CONSULTORIA_LISTA_CORTA' UNION ALL
  SELECT 'CP_CONSULTORIA_CONCURSO' UNION ALL SELECT 'CP_OBRA_MENOR_CUANTIA' UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL SELECT 'CP_OBRA_LICITACION'
) t;

-- Garantía fiel cumplimiento for obra types (5% del monto del contrato)
INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_GARANTIA_FIEL_CUMPLIMIENTO:', 'cp.field.garantiaFielCumplimiento', 'cp.field.garantiaFielCumplimiento.desc', t.type_name, 'CONTRATACION', 4, 1, 1, 'TEXT', 'INPUT', 'cp.field.garantiaFielCumplimiento.placeholder',
 '{"required":true}', 1,
 'Ayuda con la GARANTÍA DE FIEL CUMPLIMIENTO. Según Art. 74 LOSNCP es el 5% del monto del contrato. Para obras incluye también garantía técnica.\nResponde en español.',
 'Valida garantía.', '2024', NOW()
FROM (
  SELECT 'CP_OBRA_MENOR_CUANTIA' AS type_name UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL
  SELECT 'CP_OBRA_LICITACION'
) t;

-- EJECUCION fields for obra types
INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_FISCALIZADOR:', 'cp.field.fiscalizador', 'cp.field.fiscalizador.desc', t.type_name, 'EJECUCION', 1, 1, 1, 'TEXT', 'INPUT', 'cp.field.fiscalizador.placeholder',
 '{"required":true,"minLength":3}', 1,
 'Ayuda con el FISCALIZADOR de obra. Según Art. 121 RLOSNCP toda obra requiere fiscalización. Puede ser funcionario de la entidad o consultor externo contratado.\nResponde en español.',
 'Valida nombre del fiscalizador.', '2024', NOW()
FROM (
  SELECT 'CP_OBRA_MENOR_CUANTIA' AS type_name UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL
  SELECT 'CP_OBRA_LICITACION'
) t;

INSERT IGNORE INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, placeholder_key, validation_rules, ai_enabled, ai_help_prompt, ai_validation_prompt, spec_version, created_at)
SELECT UUID(), ':CP_ACTA_RECEPCION:', 'cp.field.actaRecepcion', 'cp.field.actaRecepcion.desc', t.type_name, 'EJECUCION', 2, 0, 1, 'TEXT', 'INPUT', 'cp.field.actaRecepcion.placeholder',
 '{"required":false}', 1,
 'Ayuda con el ACTA DE RECEPCIÓN. Para obras se realiza recepción provisional y definitiva según Art. 81 LOSNCP.\nResponde en español.',
 'Valida acta.', '2024', NOW()
FROM (
  SELECT 'CP_OBRA_MENOR_CUANTIA' AS type_name UNION ALL
  SELECT 'CP_OBRA_COTIZACION' UNION ALL
  SELECT 'CP_OBRA_LICITACION'
) t;

-- Also update category of these product types to COMPRAS_PUBLICAS for consistency
UPDATE product_type_config SET category = 'COMPRAS_PUBLICAS'
WHERE product_type IN ('CP_CONSULTORIA_DIRECTA','CP_CONSULTORIA_LISTA_CORTA','CP_CONSULTORIA_CONCURSO',
                        'CP_OBRA_MENOR_CUANTIA','CP_OBRA_COTIZACION','CP_OBRA_LICITACION')
  AND category = 'PROCUREMENT';
