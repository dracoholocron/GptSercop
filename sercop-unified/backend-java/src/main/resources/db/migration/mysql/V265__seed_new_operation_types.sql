-- V265: Seed new operation types - events, flows, menu items, SWIFT response configs
-- New types: STANDBY_LC, COLLECTION_IMPORT, COLLECTION_EXPORT, GUARANTEE_MANDATARIA, TRADE_FINANCING, AVAL_DESCUENTO
-- Note: STANDBY_LC, COLLECTION_IMPORT, COLLECTION_EXPORT already exist in product_type_config
-- We add the 3 truly new ones and seed events/flows for all 6

-- =============================================================================
-- 1. Product Type Config - 3 new product types
-- =============================================================================

INSERT INTO product_type_config (product_type, base_url, wizard_url, view_mode_title_key,
  description, swift_message_type, category, display_order, active, id_prefix, accounting_nature, created_at)
SELECT 'GUARANTEE_MANDATARIA', '/guarantee-mandataria', '/guarantee-mandataria/wizard',
  'guaranteeMandatariaWizard.viewModeTitle', 'Garantias Mandatarias', 'MT760', 'GUARANTEES', 12, TRUE, 'GAM', 'DEBIT', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_type_config WHERE product_type = 'GUARANTEE_MANDATARIA');

INSERT INTO product_type_config (product_type, base_url, wizard_url, view_mode_title_key,
  description, swift_message_type, category, display_order, active, id_prefix, accounting_nature, created_at)
SELECT 'TRADE_FINANCING', '/trade-financing', '/trade-financing/wizard',
  'tradeFinancingWizard.viewModeTitle', 'Financiamientos con el Exterior', 'MT799', 'TRADE_FINANCE', 30, TRUE, 'TRF', 'DEBIT', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_type_config WHERE product_type = 'TRADE_FINANCING');

INSERT INTO product_type_config (product_type, base_url, wizard_url, view_mode_title_key,
  description, swift_message_type, category, display_order, active, id_prefix, accounting_nature, created_at)
SELECT 'AVAL_DESCUENTO', '/aval-descuento', '/aval-descuento/wizard',
  'avalDescuentoWizard.viewModeTitle', 'Avales Descontados en el Exterior', 'MT760', 'GUARANTEES', 13, TRUE, 'AVD', 'DEBIT', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_type_config WHERE product_type = 'AVAL_DESCUENTO');

-- Update existing types that may have incorrect URLs
UPDATE product_type_config SET base_url = '/standby-lc', wizard_url = '/standby-lc/wizard',
  view_mode_title_key = 'standbyLcWizard.viewModeTitle', description = 'Cartas de Credito Standby'
WHERE product_type = 'STANDBY_LC' AND base_url = '/guarantees';

UPDATE product_type_config SET base_url = '/collection-imports', wizard_url = '/collection-imports/wizard',
  view_mode_title_key = 'collectionImportWizard.viewModeTitle', description = 'Cobranzas de Importacion'
WHERE product_type = 'COLLECTION_IMPORT' AND base_url = '/collections';

UPDATE product_type_config SET base_url = '/collection-exports', wizard_url = '/collection-exports/wizard',
  view_mode_title_key = 'collectionExportWizard.viewModeTitle', description = 'Cobranzas de Exportacion'
WHERE product_type = 'COLLECTION_EXPORT' AND base_url = '/collections';

-- =============================================================================
-- 2. Event Type Configurations
-- =============================================================================

-- Cleanup any previously-inserted data (makes migration idempotent)
DELETE FROM event_type_config_readmodel WHERE operation_type IN ('STANDBY_LC','COLLECTION_IMPORT','COLLECTION_EXPORT','GUARANTEE_MANDATARIA','TRADE_FINANCING','AVAL_DESCUENTO');

-- =============================================
-- 2.1 STANDBY_LC Events
-- =============================================

-- English
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'STANDBY_LC', 'en', 'Issue Standby LC', 'Issue the standby letter of credit',
 'Send MT760 to issue the standby LC', 'MT760', NULL, '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),
('ADVISE', 'STANDBY_LC', 'en', 'Advise Standby LC', 'Advise the standby LC to the beneficiary',
 'Send advice to beneficiary bank', 'MT710', NULL, '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiSend', 'blue', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('AMEND', 'STANDBY_LC', 'en', 'Amend Standby LC', 'Request amendment to standby LC terms',
 'Send MT767 amendment', 'MT767', 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit2', 'orange', 3, TRUE, TRUE, TRUE, NOW(), NOW()),
('PRESENT_DEMAND', 'STANDBY_LC', 'en', 'Present Demand', 'Demand for payment under standby LC',
 'Beneficiary presents demand with required documents', NULL, NULL, '["ADVISED","ISSUED"]', '["ACTIVE"]', 'DEMAND_PRESENTED', 'ACTIVE',
 'FiFileText', 'purple', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAY_DEMAND', 'STANDBY_LC', 'en', 'Pay Demand', 'Effect payment of demand',
 'Pay the demand presented under the standby LC', 'MT756', NULL, '["DEMAND_PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),
('EXTEND', 'STANDBY_LC', 'en', 'Extend Validity', 'Extend the standby LC expiry date',
 'Send MT767 to extend validity period', 'MT767', NULL, '["ISSUED","ADVISED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'teal', 6, TRUE, TRUE, FALSE, NOW(), NOW()),
('CANCEL', 'STANDBY_LC', 'en', 'Cancel Standby LC', 'Cancel the standby LC',
 'Cancel with agreement of all parties', NULL, NULL, '["ISSUED","ADVISED","EXTENDED"]', '["ACTIVE"]', 'CANCELLED', 'CANCELLED',
 'FiXCircle', 'red', 7, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'STANDBY_LC', 'en', 'Close Standby LC', 'Close the standby letter of credit',
 'Mark as fully utilized or expired', NULL, NULL, '["PAID","CANCELLED","EXPIRED"]', '["ACTIVE","CANCELLED"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'STANDBY_LC', 'es', 'Emitir Standby LC', 'Emitir la carta de credito standby',
 'Enviar MT760 para emitir la standby LC', 'MT760', NULL, '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),
('ADVISE', 'STANDBY_LC', 'es', 'Avisar Standby LC', 'Avisar la standby LC al beneficiario',
 'Enviar aviso al banco del beneficiario', 'MT710', NULL, '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiSend', 'blue', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('AMEND', 'STANDBY_LC', 'es', 'Enmendar Standby LC', 'Solicitar enmienda a terminos de la standby LC',
 'Enviar enmienda MT767', 'MT767', 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit2', 'orange', 3, TRUE, TRUE, TRUE, NOW(), NOW()),
('PRESENT_DEMAND', 'STANDBY_LC', 'es', 'Presentar Demanda', 'Demanda de pago bajo standby LC',
 'El beneficiario presenta demanda con documentos requeridos', NULL, NULL, '["ADVISED","ISSUED"]', '["ACTIVE"]', 'DEMAND_PRESENTED', 'ACTIVE',
 'FiFileText', 'purple', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAY_DEMAND', 'STANDBY_LC', 'es', 'Pagar Demanda', 'Efectuar pago de la demanda',
 'Pagar la demanda presentada bajo la standby LC', 'MT756', NULL, '["DEMAND_PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),
('EXTEND', 'STANDBY_LC', 'es', 'Extender Vigencia', 'Extender fecha de vencimiento de la standby LC',
 'Enviar MT767 para extender periodo de vigencia', 'MT767', NULL, '["ISSUED","ADVISED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'teal', 6, TRUE, TRUE, FALSE, NOW(), NOW()),
('CANCEL', 'STANDBY_LC', 'es', 'Cancelar Standby LC', 'Cancelar la standby LC',
 'Cancelar con acuerdo de todas las partes', NULL, NULL, '["ISSUED","ADVISED","EXTENDED"]', '["ACTIVE"]', 'CANCELLED', 'CANCELLED',
 'FiXCircle', 'red', 7, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'STANDBY_LC', 'es', 'Cerrar Standby LC', 'Cerrar la carta de credito standby',
 'Marcar como totalmente utilizada o expirada', NULL, NULL, '["PAID","CANCELLED","EXPIRED"]', '["ACTIVE","CANCELLED"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 2.2 COLLECTION_IMPORT Events
-- =============================================

-- English
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RECEIVE_COLLECTION', 'COLLECTION_IMPORT', 'en', 'Receive Collection', 'Receive documentary collection from remitting bank',
 'Register incoming collection with documents', NULL, 'MT400', '["DRAFT"]', '["PENDING"]', 'RECEIVED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('PRESENT_DRAWEE', 'COLLECTION_IMPORT', 'en', 'Present to Drawee', 'Present documents to the drawee for payment/acceptance',
 'Notify drawee and present documents', NULL, NULL, '["RECEIVED"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiSend', 'blue', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('ACCEPT', 'COLLECTION_IMPORT', 'en', 'Accept Documents', 'Drawee accepts the documents',
 'Record acceptance by the drawee', 'MT412', NULL, '["PRESENTED"]', '["ACTIVE"]', 'ACCEPTED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, FALSE, FALSE, NOW(), NOW()),
('REFUSE', 'COLLECTION_IMPORT', 'en', 'Refuse Documents', 'Drawee refuses the documents',
 'Record refusal and notify remitting bank', 'MT416', NULL, '["PRESENTED"]', '["ACTIVE"]', 'REFUSED', 'ACTIVE',
 'FiAlertTriangle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAYMENT', 'COLLECTION_IMPORT', 'en', 'Make Payment', 'Effect payment for the collection',
 'Process payment from drawee', 'MT400', NULL, '["ACCEPTED","PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),
('RETURN_DOCS', 'COLLECTION_IMPORT', 'en', 'Return Documents', 'Return documents to remitting bank',
 'Return unpaid documents', 'MT422', NULL, '["REFUSED","PRESENTED"]', '["ACTIVE"]', 'DOCS_RETURNED', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 6, TRUE, FALSE, FALSE, NOW(), NOW()),
('TRACER', 'COLLECTION_IMPORT', 'en', 'Send Tracer', 'Send tracer message for status update',
 'Send MT420 tracer to request status', 'MT420', NULL, '["RECEIVED","PRESENTED","ACCEPTED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiClock', 'yellow', 7, TRUE, FALSE, FALSE, NOW(), NOW()),
('CLOSE', 'COLLECTION_IMPORT', 'en', 'Close Collection', 'Close the documentary collection',
 'Mark collection as settled', NULL, NULL, '["PAID","DOCS_RETURNED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RECEIVE_COLLECTION', 'COLLECTION_IMPORT', 'es', 'Recibir Cobranza', 'Recibir cobranza documental del banco remitente',
 'Registrar cobranza entrante con documentos', NULL, 'MT400', '["DRAFT"]', '["PENDING"]', 'RECEIVED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('PRESENT_DRAWEE', 'COLLECTION_IMPORT', 'es', 'Presentar al Girado', 'Presentar documentos al girado para pago/aceptacion',
 'Notificar al girado y presentar documentos', NULL, NULL, '["RECEIVED"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiSend', 'blue', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('ACCEPT', 'COLLECTION_IMPORT', 'es', 'Aceptar Documentos', 'El girado acepta los documentos',
 'Registrar aceptacion del girado', 'MT412', NULL, '["PRESENTED"]', '["ACTIVE"]', 'ACCEPTED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, FALSE, FALSE, NOW(), NOW()),
('REFUSE', 'COLLECTION_IMPORT', 'es', 'Rechazar Documentos', 'El girado rechaza los documentos',
 'Registrar rechazo y notificar al banco remitente', 'MT416', NULL, '["PRESENTED"]', '["ACTIVE"]', 'REFUSED', 'ACTIVE',
 'FiAlertTriangle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAYMENT', 'COLLECTION_IMPORT', 'es', 'Efectuar Pago', 'Efectuar pago de la cobranza',
 'Procesar pago del girado', 'MT400', NULL, '["ACCEPTED","PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, TRUE, FALSE, NOW(), NOW()),
('RETURN_DOCS', 'COLLECTION_IMPORT', 'es', 'Devolver Documentos', 'Devolver documentos al banco remitente',
 'Devolver documentos no pagados', 'MT422', NULL, '["REFUSED","PRESENTED"]', '["ACTIVE"]', 'DOCS_RETURNED', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 6, TRUE, FALSE, FALSE, NOW(), NOW()),
('TRACER', 'COLLECTION_IMPORT', 'es', 'Enviar Tracer', 'Enviar mensaje tracer para actualizacion de estado',
 'Enviar MT420 tracer para solicitar estado', 'MT420', NULL, '["RECEIVED","PRESENTED","ACCEPTED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiClock', 'yellow', 7, TRUE, FALSE, FALSE, NOW(), NOW()),
('CLOSE', 'COLLECTION_IMPORT', 'es', 'Cerrar Cobranza', 'Cerrar la cobranza documental',
 'Marcar cobranza como liquidada', NULL, NULL, '["PAID","DOCS_RETURNED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 2.3 COLLECTION_EXPORT Events
-- =============================================

-- English
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_COLLECTION', 'COLLECTION_EXPORT', 'en', 'Send Collection', 'Send documentary collection to collecting bank',
 'Send MT400 with documents to collecting bank', 'MT400', NULL, '["DRAFT"]', '["PENDING"]', 'SENT', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('PRESENT_DRAWEE', 'COLLECTION_EXPORT', 'en', 'Present to Drawee', 'Collecting bank presents to drawee',
 'Await presentation by collecting bank', NULL, NULL, '["SENT"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiFileText', 'blue', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('ACCEPT', 'COLLECTION_EXPORT', 'en', 'Drawee Accepts', 'Drawee accepts the documents',
 'Record acceptance notification from collecting bank', NULL, 'MT412', '["PRESENTED"]', '["ACTIVE"]', 'ACCEPTED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, FALSE, FALSE, NOW(), NOW()),
('REFUSE', 'COLLECTION_EXPORT', 'en', 'Drawee Refuses', 'Drawee refuses the documents',
 'Record refusal from collecting bank', NULL, 'MT416', '["PRESENTED"]', '["ACTIVE"]', 'REFUSED', 'ACTIVE',
 'FiAlertTriangle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAYMENT', 'COLLECTION_EXPORT', 'en', 'Receive Payment', 'Receive payment from collecting bank',
 'Process incoming payment', NULL, 'MT400', '["ACCEPTED","PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, FALSE, FALSE, NOW(), NOW()),
('RETURN_DOCS', 'COLLECTION_EXPORT', 'en', 'Documents Returned', 'Receive returned documents',
 'Process returned unpaid documents', NULL, 'MT422', '["REFUSED","PRESENTED"]', '["ACTIVE"]', 'DOCS_RETURNED', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 6, TRUE, FALSE, FALSE, NOW(), NOW()),
('TRACER', 'COLLECTION_EXPORT', 'en', 'Send Tracer', 'Send tracer to collecting bank',
 'Send MT420 tracer for status', 'MT420', NULL, '["SENT","PRESENTED","ACCEPTED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiClock', 'yellow', 7, TRUE, FALSE, FALSE, NOW(), NOW()),
('REMIT_PROCEEDS', 'COLLECTION_EXPORT', 'en', 'Remit Proceeds', 'Remit collection proceeds to principal',
 'Transfer proceeds to the exporter', NULL, NULL, '["PAID"]', '["ACTIVE"]', 'PROCEEDS_REMITTED', 'ACTIVE',
 'FiDollarSign', 'teal', 8, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'COLLECTION_EXPORT', 'en', 'Close Collection', 'Close the documentary collection',
 'Mark collection as settled', NULL, NULL, '["PROCEEDS_REMITTED","DOCS_RETURNED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 9, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('SEND_COLLECTION', 'COLLECTION_EXPORT', 'es', 'Enviar Cobranza', 'Enviar cobranza documental al banco cobrador',
 'Enviar MT400 con documentos al banco cobrador', 'MT400', NULL, '["DRAFT"]', '["PENDING"]', 'SENT', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('PRESENT_DRAWEE', 'COLLECTION_EXPORT', 'es', 'Presentar al Girado', 'El banco cobrador presenta al girado',
 'Esperar presentacion del banco cobrador', NULL, NULL, '["SENT"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiFileText', 'blue', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('ACCEPT', 'COLLECTION_EXPORT', 'es', 'Girado Acepta', 'El girado acepta los documentos',
 'Registrar notificacion de aceptacion del banco cobrador', NULL, 'MT412', '["PRESENTED"]', '["ACTIVE"]', 'ACCEPTED', 'ACTIVE',
 'FiCheckCircle', 'green', 3, TRUE, FALSE, FALSE, NOW(), NOW()),
('REFUSE', 'COLLECTION_EXPORT', 'es', 'Girado Rechaza', 'El girado rechaza los documentos',
 'Registrar rechazo del banco cobrador', NULL, 'MT416', '["PRESENTED"]', '["ACTIVE"]', 'REFUSED', 'ACTIVE',
 'FiAlertTriangle', 'red', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAYMENT', 'COLLECTION_EXPORT', 'es', 'Recibir Pago', 'Recibir pago del banco cobrador',
 'Procesar pago entrante', NULL, 'MT400', '["ACCEPTED","PRESENTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 5, TRUE, FALSE, FALSE, NOW(), NOW()),
('RETURN_DOCS', 'COLLECTION_EXPORT', 'es', 'Documentos Devueltos', 'Recibir documentos devueltos',
 'Procesar documentos devueltos sin pago', NULL, 'MT422', '["REFUSED","PRESENTED"]', '["ACTIVE"]', 'DOCS_RETURNED', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 6, TRUE, FALSE, FALSE, NOW(), NOW()),
('TRACER', 'COLLECTION_EXPORT', 'es', 'Enviar Tracer', 'Enviar tracer al banco cobrador',
 'Enviar MT420 tracer para estado', 'MT420', NULL, '["SENT","PRESENTED","ACCEPTED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiClock', 'yellow', 7, TRUE, FALSE, FALSE, NOW(), NOW()),
('REMIT_PROCEEDS', 'COLLECTION_EXPORT', 'es', 'Remitir Fondos', 'Remitir fondos de cobranza al principal',
 'Transferir fondos al exportador', NULL, NULL, '["PAID"]', '["ACTIVE"]', 'PROCEEDS_REMITTED', 'ACTIVE',
 'FiDollarSign', 'teal', 8, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'COLLECTION_EXPORT', 'es', 'Cerrar Cobranza', 'Cerrar la cobranza documental',
 'Marcar cobranza como liquidada', NULL, NULL, '["PROCEEDS_REMITTED","DOCS_RETURNED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 9, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 2.4 GUARANTEE_MANDATARIA Events
-- =============================================

-- English
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RECEIVE_MANDATE', 'GUARANTEE_MANDATARIA', 'en', 'Receive Mandate', 'Receive mandate to issue guarantee on behalf of correspondent',
 'Register incoming mandate from correspondent bank', NULL, 'MT760', '["DRAFT"]', '["PENDING"]', 'MANDATE_RECEIVED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('ISSUE', 'GUARANTEE_MANDATARIA', 'en', 'Issue Guarantee', 'Issue the guarantee as mandated',
 'Issue guarantee on behalf of the mandating bank', 'MT760', NULL, '["MANDATE_RECEIVED"]', '["ACTIVE"]', 'ISSUED', 'ACTIVE',
 'FiSend', 'blue', 2, TRUE, TRUE, FALSE, NOW(), NOW()),
('AMEND', 'GUARANTEE_MANDATARIA', 'en', 'Amend Guarantee', 'Amend the mandated guarantee',
 'Send MT767 amendment', 'MT767', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit2', 'orange', 3, TRUE, TRUE, TRUE, NOW(), NOW()),
('EXTEND', 'GUARANTEE_MANDATARIA', 'en', 'Extend Validity', 'Extend the guarantee validity',
 'Extend expiry date of mandated guarantee', 'MT767', NULL, '["ISSUED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'teal', 4, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLAIM', 'GUARANTEE_MANDATARIA', 'en', 'Receive Claim', 'Receive a claim under the guarantee',
 'Process claim from beneficiary', NULL, NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'CLAIMED', 'ACTIVE',
 'FiAlertTriangle', 'red', 5, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAY_CLAIM', 'GUARANTEE_MANDATARIA', 'en', 'Pay Claim', 'Effect payment of the claim',
 'Pay the claim and debit mandating bank', 'MT799', NULL, '["CLAIMED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 6, TRUE, TRUE, FALSE, NOW(), NOW()),
('RELEASE', 'GUARANTEE_MANDATARIA', 'en', 'Release Guarantee', 'Release the guarantee upon expiry or agreement',
 'Release guarantee and notify parties', NULL, NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'RELEASED', 'ACTIVE',
 'FiUnlock', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'GUARANTEE_MANDATARIA', 'en', 'Close', 'Close the mandated guarantee',
 'Mark guarantee as closed', NULL, NULL, '["PAID","RELEASED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RECEIVE_MANDATE', 'GUARANTEE_MANDATARIA', 'es', 'Recibir Mandato', 'Recibir mandato para emitir garantia en nombre de corresponsal',
 'Registrar mandato entrante del banco corresponsal', NULL, 'MT760', '["DRAFT"]', '["PENDING"]', 'MANDATE_RECEIVED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('ISSUE', 'GUARANTEE_MANDATARIA', 'es', 'Emitir Garantia', 'Emitir la garantia segun el mandato',
 'Emitir garantia en nombre del banco mandante', 'MT760', NULL, '["MANDATE_RECEIVED"]', '["ACTIVE"]', 'ISSUED', 'ACTIVE',
 'FiSend', 'blue', 2, TRUE, TRUE, FALSE, NOW(), NOW()),
('AMEND', 'GUARANTEE_MANDATARIA', 'es', 'Enmendar Garantia', 'Enmendar la garantia mandataria',
 'Enviar enmienda MT767', 'MT767', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit2', 'orange', 3, TRUE, TRUE, TRUE, NOW(), NOW()),
('EXTEND', 'GUARANTEE_MANDATARIA', 'es', 'Extender Vigencia', 'Extender la vigencia de la garantia',
 'Extender fecha de vencimiento de garantia mandataria', 'MT767', NULL, '["ISSUED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'teal', 4, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLAIM', 'GUARANTEE_MANDATARIA', 'es', 'Recibir Reclamo', 'Recibir reclamo bajo la garantia',
 'Procesar reclamo del beneficiario', NULL, NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'CLAIMED', 'ACTIVE',
 'FiAlertTriangle', 'red', 5, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAY_CLAIM', 'GUARANTEE_MANDATARIA', 'es', 'Pagar Reclamo', 'Efectuar pago del reclamo',
 'Pagar el reclamo y debitar al banco mandante', 'MT799', NULL, '["CLAIMED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 6, TRUE, TRUE, FALSE, NOW(), NOW()),
('RELEASE', 'GUARANTEE_MANDATARIA', 'es', 'Liberar Garantia', 'Liberar la garantia por vencimiento o acuerdo',
 'Liberar garantia y notificar a las partes', NULL, NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'RELEASED', 'ACTIVE',
 'FiUnlock', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'GUARANTEE_MANDATARIA', 'es', 'Cerrar', 'Cerrar la garantia mandataria',
 'Marcar garantia como cerrada', NULL, NULL, '["PAID","RELEASED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 2.5 TRADE_FINANCING Events
-- =============================================

-- English
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CREATE_FINANCING', 'TRADE_FINANCING', 'en', 'Create Financing', 'Create new trade financing facility',
 'Register the financing request and terms', NULL, NULL, '["DRAFT"]', '["PENDING"]', 'CREATED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('APPROVE', 'TRADE_FINANCING', 'en', 'Approve Financing', 'Approve the financing facility',
 'Approve credit committee decision', NULL, NULL, '["CREATED"]', '["ACTIVE"]', 'APPROVED', 'ACTIVE',
 'FiCheckCircle', 'green', 2, TRUE, TRUE, FALSE, NOW(), NOW()),
('DISBURSE', 'TRADE_FINANCING', 'en', 'Disburse Funds', 'Disburse financing funds',
 'Transfer funds to the borrower', 'MT799', NULL, '["APPROVED"]', '["ACTIVE"]', 'DISBURSED', 'ACTIVE',
 'FiDollarSign', 'green', 3, TRUE, TRUE, FALSE, NOW(), NOW()),
('PAYMENT', 'TRADE_FINANCING', 'en', 'Receive Payment', 'Receive repayment installment',
 'Process loan repayment', NULL, NULL, '["DISBURSED"]', '["ACTIVE"]', 'DISBURSED', 'ACTIVE',
 'FiDollarSign', 'teal', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('ROLLOVER', 'TRADE_FINANCING', 'en', 'Rollover', 'Rollover the financing at maturity',
 'Extend financing with new terms', 'MT799', NULL, '["DISBURSED"]', '["ACTIVE"]', 'ROLLED_OVER', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 5, TRUE, TRUE, FALSE, NOW(), NOW()),
('RESTRUCTURE', 'TRADE_FINANCING', 'en', 'Restructure', 'Restructure the financing terms',
 'Modify terms due to borrower circumstances', NULL, NULL, '["DISBURSED","ROLLED_OVER"]', '["ACTIVE"]', 'RESTRUCTURED', 'ACTIVE',
 'FiEdit2', 'purple', 6, TRUE, TRUE, FALSE, NOW(), NOW()),
('SETTLE', 'TRADE_FINANCING', 'en', 'Settle', 'Full settlement of the financing',
 'Complete final repayment', NULL, NULL, '["DISBURSED","ROLLED_OVER","RESTRUCTURED"]', '["ACTIVE"]', 'SETTLED', 'ACTIVE',
 'FiCheck', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'TRADE_FINANCING', 'en', 'Close', 'Close the financing facility',
 'Mark financing as fully settled', NULL, NULL, '["SETTLED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CREATE_FINANCING', 'TRADE_FINANCING', 'es', 'Crear Financiamiento', 'Crear nueva facilidad de financiamiento comercial',
 'Registrar solicitud de financiamiento y terminos', NULL, NULL, '["DRAFT"]', '["PENDING"]', 'CREATED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('APPROVE', 'TRADE_FINANCING', 'es', 'Aprobar Financiamiento', 'Aprobar la facilidad de financiamiento',
 'Aprobar decision del comite de credito', NULL, NULL, '["CREATED"]', '["ACTIVE"]', 'APPROVED', 'ACTIVE',
 'FiCheckCircle', 'green', 2, TRUE, TRUE, FALSE, NOW(), NOW()),
('DISBURSE', 'TRADE_FINANCING', 'es', 'Desembolsar Fondos', 'Desembolsar fondos del financiamiento',
 'Transferir fondos al prestatario', 'MT799', NULL, '["APPROVED"]', '["ACTIVE"]', 'DISBURSED', 'ACTIVE',
 'FiDollarSign', 'green', 3, TRUE, TRUE, FALSE, NOW(), NOW()),
('PAYMENT', 'TRADE_FINANCING', 'es', 'Recibir Pago', 'Recibir cuota de pago',
 'Procesar pago del prestamo', NULL, NULL, '["DISBURSED"]', '["ACTIVE"]', 'DISBURSED', 'ACTIVE',
 'FiDollarSign', 'teal', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('ROLLOVER', 'TRADE_FINANCING', 'es', 'Renovar', 'Renovar el financiamiento al vencimiento',
 'Extender financiamiento con nuevos terminos', 'MT799', NULL, '["DISBURSED"]', '["ACTIVE"]', 'ROLLED_OVER', 'ACTIVE',
 'FiCornerUpLeft', 'orange', 5, TRUE, TRUE, FALSE, NOW(), NOW()),
('RESTRUCTURE', 'TRADE_FINANCING', 'es', 'Reestructurar', 'Reestructurar los terminos del financiamiento',
 'Modificar terminos por circunstancias del prestatario', NULL, NULL, '["DISBURSED","ROLLED_OVER"]', '["ACTIVE"]', 'RESTRUCTURED', 'ACTIVE',
 'FiEdit2', 'purple', 6, TRUE, TRUE, FALSE, NOW(), NOW()),
('SETTLE', 'TRADE_FINANCING', 'es', 'Liquidar', 'Liquidacion total del financiamiento',
 'Completar pago final', NULL, NULL, '["DISBURSED","ROLLED_OVER","RESTRUCTURED"]', '["ACTIVE"]', 'SETTLED', 'ACTIVE',
 'FiCheck', 'green', 7, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'TRADE_FINANCING', 'es', 'Cerrar', 'Cerrar la facilidad de financiamiento',
 'Marcar financiamiento como totalmente liquidado', NULL, NULL, '["SETTLED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 2.6 AVAL_DESCUENTO Events
-- =============================================

-- English
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RECEIVE_DRAFT', 'AVAL_DESCUENTO', 'en', 'Receive Draft', 'Receive the draft/bill for endorsement',
 'Register the incoming draft for aval processing', NULL, NULL, '["DRAFT"]', '["PENDING"]', 'DRAFT_RECEIVED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('ENDORSE', 'AVAL_DESCUENTO', 'en', 'Endorse Draft', 'Add bank endorsement (aval) to the draft',
 'Bank endorses the draft as guarantor', 'MT760', NULL, '["DRAFT_RECEIVED"]', '["ACTIVE"]', 'ENDORSED', 'ACTIVE',
 'FiCheckCircle', 'green', 2, TRUE, TRUE, FALSE, NOW(), NOW()),
('DISCOUNT', 'AVAL_DESCUENTO', 'en', 'Discount Draft', 'Send draft for discount abroad',
 'Send endorsed draft to foreign bank for discount', 'MT799', NULL, '["ENDORSED"]', '["ACTIVE"]', 'DISCOUNTED', 'ACTIVE',
 'FiDollarSign', 'green', 3, TRUE, TRUE, FALSE, NOW(), NOW()),
('PRESENT', 'AVAL_DESCUENTO', 'en', 'Present for Payment', 'Present draft at maturity for payment',
 'Present the draft for collection at maturity', NULL, NULL, '["DISCOUNTED"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiSend', 'purple', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAYMENT', 'AVAL_DESCUENTO', 'en', 'Receive Payment', 'Receive payment at maturity',
 'Process payment of the draft', NULL, NULL, '["PRESENTED","DISCOUNTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'teal', 5, TRUE, FALSE, FALSE, NOW(), NOW()),
('PROTEST', 'AVAL_DESCUENTO', 'en', 'Protest', 'Protest non-payment of the draft',
 'Initiate protest proceedings for non-payment', NULL, NULL, '["PRESENTED"]', '["ACTIVE"]', 'PROTESTED', 'ACTIVE',
 'FiAlertTriangle', 'red', 6, TRUE, FALSE, FALSE, NOW(), NOW()),
('CLOSE', 'AVAL_DESCUENTO', 'en', 'Close', 'Close the aval operation',
 'Mark the operation as settled', NULL, NULL, '["PAID","PROTESTED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 7, TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RECEIVE_DRAFT', 'AVAL_DESCUENTO', 'es', 'Recibir Letra', 'Recibir la letra/pagare para endoso',
 'Registrar la letra entrante para procesamiento de aval', NULL, NULL, '["DRAFT"]', '["PENDING"]', 'DRAFT_RECEIVED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('ENDORSE', 'AVAL_DESCUENTO', 'es', 'Endosar Letra', 'Agregar endoso bancario (aval) a la letra',
 'El banco endosa la letra como garante', 'MT760', NULL, '["DRAFT_RECEIVED"]', '["ACTIVE"]', 'ENDORSED', 'ACTIVE',
 'FiCheckCircle', 'green', 2, TRUE, TRUE, FALSE, NOW(), NOW()),
('DISCOUNT', 'AVAL_DESCUENTO', 'es', 'Descontar Letra', 'Enviar letra para descuento en el exterior',
 'Enviar letra endosada a banco del exterior para descuento', 'MT799', NULL, '["ENDORSED"]', '["ACTIVE"]', 'DISCOUNTED', 'ACTIVE',
 'FiDollarSign', 'green', 3, TRUE, TRUE, FALSE, NOW(), NOW()),
('PRESENT', 'AVAL_DESCUENTO', 'es', 'Presentar al Cobro', 'Presentar letra al vencimiento para cobro',
 'Presentar la letra para cobro al vencimiento', NULL, NULL, '["DISCOUNTED"]', '["ACTIVE"]', 'PRESENTED', 'ACTIVE',
 'FiSend', 'purple', 4, TRUE, FALSE, FALSE, NOW(), NOW()),
('PAYMENT', 'AVAL_DESCUENTO', 'es', 'Recibir Pago', 'Recibir pago al vencimiento',
 'Procesar pago de la letra', NULL, NULL, '["PRESENTED","DISCOUNTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'teal', 5, TRUE, FALSE, FALSE, NOW(), NOW()),
('PROTEST', 'AVAL_DESCUENTO', 'es', 'Protestar', 'Protestar la letra por falta de pago',
 'Iniciar procedimiento de protesto por falta de pago', NULL, NULL, '["PRESENTED"]', '["ACTIVE"]', 'PROTESTED', 'ACTIVE',
 'FiAlertTriangle', 'red', 6, TRUE, FALSE, FALSE, NOW(), NOW()),
('CLOSE', 'AVAL_DESCUENTO', 'es', 'Cerrar', 'Cerrar la operacion de aval',
 'Marcar la operacion como liquidada', NULL, NULL, '["PAID","PROTESTED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiArchive', 'gray', 7, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================================================
-- 3. Event Flow Configurations
-- =============================================================================

-- Cleanup any previously-inserted flows (idempotent)
DELETE FROM event_flow_config_readmodel WHERE operation_type IN ('STANDBY_LC','COLLECTION_IMPORT','COLLECTION_EXPORT','GUARANTEE_MANDATARIA','TRADE_FINANCING','AVAL_DESCUENTO');

-- STANDBY_LC flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('STANDBY_LC', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'en', 'Issue Standby LC', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'ADVISE', FALSE, 2, 'en', 'Advise to Beneficiary', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 3, 'en', 'Amend Terms', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'EXTEND', FALSE, 4, 'en', 'Extend Validity', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'PRESENT_DEMAND', FALSE, 5, 'en', 'Present Demand', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'CANCEL', FALSE, 6, 'en', 'Cancel', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'AMEND', FALSE, 7, 'en', 'Amend Terms', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'PRESENT_DEMAND', FALSE, 8, 'en', 'Present Demand', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'EXTEND', FALSE, 9, 'en', 'Extend Validity', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'CANCEL', FALSE, 10, 'en', 'Cancel', TRUE),
('STANDBY_LC', 'PRESENT_DEMAND', 'DEMAND_PRESENTED', 'PAY_DEMAND', TRUE, 11, 'en', 'Pay Demand', TRUE),
('STANDBY_LC', 'PAY_DEMAND', 'PAID', 'CLOSE', FALSE, 12, 'en', 'Close', TRUE),
('STANDBY_LC', 'EXTEND', 'EXTENDED', 'PRESENT_DEMAND', FALSE, 13, 'en', 'Present Demand', TRUE),
('STANDBY_LC', 'EXTEND', 'EXTENDED', 'CANCEL', FALSE, 14, 'en', 'Cancel', TRUE),
('STANDBY_LC', 'CANCEL', 'CANCELLED', 'CLOSE', FALSE, 15, 'en', 'Close', TRUE);

-- STANDBY_LC flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('STANDBY_LC', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'es', 'Emitir Standby LC', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'ADVISE', FALSE, 2, 'es', 'Avisar al Beneficiario', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 3, 'es', 'Enmendar Terminos', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'EXTEND', FALSE, 4, 'es', 'Extender Vigencia', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'PRESENT_DEMAND', FALSE, 5, 'es', 'Presentar Demanda', TRUE),
('STANDBY_LC', 'ISSUE', 'ISSUED', 'CANCEL', FALSE, 6, 'es', 'Cancelar', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'AMEND', FALSE, 7, 'es', 'Enmendar Terminos', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'PRESENT_DEMAND', FALSE, 8, 'es', 'Presentar Demanda', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'EXTEND', FALSE, 9, 'es', 'Extender Vigencia', TRUE),
('STANDBY_LC', 'ADVISE', 'ADVISED', 'CANCEL', FALSE, 10, 'es', 'Cancelar', TRUE),
('STANDBY_LC', 'PRESENT_DEMAND', 'DEMAND_PRESENTED', 'PAY_DEMAND', TRUE, 11, 'es', 'Pagar Demanda', TRUE),
('STANDBY_LC', 'PAY_DEMAND', 'PAID', 'CLOSE', FALSE, 12, 'es', 'Cerrar', TRUE),
('STANDBY_LC', 'EXTEND', 'EXTENDED', 'PRESENT_DEMAND', FALSE, 13, 'es', 'Presentar Demanda', TRUE),
('STANDBY_LC', 'EXTEND', 'EXTENDED', 'CANCEL', FALSE, 14, 'es', 'Cancelar', TRUE),
('STANDBY_LC', 'CANCEL', 'CANCELLED', 'CLOSE', FALSE, 15, 'es', 'Cerrar', TRUE);

-- COLLECTION_IMPORT flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('COLLECTION_IMPORT', NULL, 'DRAFT', 'RECEIVE_COLLECTION', TRUE, 1, 'en', 'Receive Collection', TRUE),
('COLLECTION_IMPORT', 'RECEIVE_COLLECTION', 'RECEIVED', 'PRESENT_DRAWEE', TRUE, 2, 'en', 'Present to Drawee', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'ACCEPT', FALSE, 3, 'en', 'Accept', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'REFUSE', FALSE, 4, 'en', 'Refuse', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'PAYMENT', FALSE, 5, 'en', 'Make Payment', TRUE),
('COLLECTION_IMPORT', 'ACCEPT', 'ACCEPTED', 'PAYMENT', TRUE, 6, 'en', 'Make Payment', TRUE),
('COLLECTION_IMPORT', 'REFUSE', 'REFUSED', 'RETURN_DOCS', TRUE, 7, 'en', 'Return Documents', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'RETURN_DOCS', FALSE, 8, 'en', 'Return Documents', TRUE),
('COLLECTION_IMPORT', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 9, 'en', 'Close', TRUE),
('COLLECTION_IMPORT', 'RETURN_DOCS', 'DOCS_RETURNED', 'CLOSE', FALSE, 10, 'en', 'Close', TRUE);

-- COLLECTION_IMPORT flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('COLLECTION_IMPORT', NULL, 'DRAFT', 'RECEIVE_COLLECTION', TRUE, 1, 'es', 'Recibir Cobranza', TRUE),
('COLLECTION_IMPORT', 'RECEIVE_COLLECTION', 'RECEIVED', 'PRESENT_DRAWEE', TRUE, 2, 'es', 'Presentar al Girado', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'ACCEPT', FALSE, 3, 'es', 'Aceptar', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'REFUSE', FALSE, 4, 'es', 'Rechazar', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'PAYMENT', FALSE, 5, 'es', 'Efectuar Pago', TRUE),
('COLLECTION_IMPORT', 'ACCEPT', 'ACCEPTED', 'PAYMENT', TRUE, 6, 'es', 'Efectuar Pago', TRUE),
('COLLECTION_IMPORT', 'REFUSE', 'REFUSED', 'RETURN_DOCS', TRUE, 7, 'es', 'Devolver Documentos', TRUE),
('COLLECTION_IMPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'RETURN_DOCS', FALSE, 8, 'es', 'Devolver Documentos', TRUE),
('COLLECTION_IMPORT', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 9, 'es', 'Cerrar', TRUE),
('COLLECTION_IMPORT', 'RETURN_DOCS', 'DOCS_RETURNED', 'CLOSE', FALSE, 10, 'es', 'Cerrar', TRUE);

-- COLLECTION_EXPORT flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('COLLECTION_EXPORT', NULL, 'DRAFT', 'SEND_COLLECTION', TRUE, 1, 'en', 'Send Collection', TRUE),
('COLLECTION_EXPORT', 'SEND_COLLECTION', 'SENT', 'PRESENT_DRAWEE', FALSE, 2, 'en', 'Present to Drawee', TRUE),
('COLLECTION_EXPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'ACCEPT', FALSE, 3, 'en', 'Drawee Accepts', TRUE),
('COLLECTION_EXPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'REFUSE', FALSE, 4, 'en', 'Drawee Refuses', TRUE),
('COLLECTION_EXPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'PAYMENT', FALSE, 5, 'en', 'Receive Payment', TRUE),
('COLLECTION_EXPORT', 'ACCEPT', 'ACCEPTED', 'PAYMENT', TRUE, 6, 'en', 'Receive Payment', TRUE),
('COLLECTION_EXPORT', 'REFUSE', 'REFUSED', 'RETURN_DOCS', TRUE, 7, 'en', 'Documents Returned', TRUE),
('COLLECTION_EXPORT', 'PAYMENT', 'PAID', 'REMIT_PROCEEDS', TRUE, 8, 'en', 'Remit Proceeds', TRUE),
('COLLECTION_EXPORT', 'REMIT_PROCEEDS', 'PROCEEDS_REMITTED', 'CLOSE', FALSE, 9, 'en', 'Close', TRUE),
('COLLECTION_EXPORT', 'RETURN_DOCS', 'DOCS_RETURNED', 'CLOSE', FALSE, 10, 'en', 'Close', TRUE);

-- COLLECTION_EXPORT flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('COLLECTION_EXPORT', NULL, 'DRAFT', 'SEND_COLLECTION', TRUE, 1, 'es', 'Enviar Cobranza', TRUE),
('COLLECTION_EXPORT', 'SEND_COLLECTION', 'SENT', 'PRESENT_DRAWEE', FALSE, 2, 'es', 'Presentar al Girado', TRUE),
('COLLECTION_EXPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'ACCEPT', FALSE, 3, 'es', 'Girado Acepta', TRUE),
('COLLECTION_EXPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'REFUSE', FALSE, 4, 'es', 'Girado Rechaza', TRUE),
('COLLECTION_EXPORT', 'PRESENT_DRAWEE', 'PRESENTED', 'PAYMENT', FALSE, 5, 'es', 'Recibir Pago', TRUE),
('COLLECTION_EXPORT', 'ACCEPT', 'ACCEPTED', 'PAYMENT', TRUE, 6, 'es', 'Recibir Pago', TRUE),
('COLLECTION_EXPORT', 'REFUSE', 'REFUSED', 'RETURN_DOCS', TRUE, 7, 'es', 'Documentos Devueltos', TRUE),
('COLLECTION_EXPORT', 'PAYMENT', 'PAID', 'REMIT_PROCEEDS', TRUE, 8, 'es', 'Remitir Fondos', TRUE),
('COLLECTION_EXPORT', 'REMIT_PROCEEDS', 'PROCEEDS_REMITTED', 'CLOSE', FALSE, 9, 'es', 'Cerrar', TRUE),
('COLLECTION_EXPORT', 'RETURN_DOCS', 'DOCS_RETURNED', 'CLOSE', FALSE, 10, 'es', 'Cerrar', TRUE);

-- GUARANTEE_MANDATARIA flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('GUARANTEE_MANDATARIA', NULL, 'DRAFT', 'RECEIVE_MANDATE', TRUE, 1, 'en', 'Receive Mandate', TRUE),
('GUARANTEE_MANDATARIA', 'RECEIVE_MANDATE', 'MANDATE_RECEIVED', 'ISSUE', TRUE, 2, 'en', 'Issue Guarantee', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 3, 'en', 'Amend Terms', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'EXTEND', FALSE, 4, 'en', 'Extend Validity', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'CLAIM', FALSE, 5, 'en', 'Receive Claim', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'RELEASE', FALSE, 6, 'en', 'Release', TRUE),
('GUARANTEE_MANDATARIA', 'EXTEND', 'EXTENDED', 'CLAIM', FALSE, 7, 'en', 'Receive Claim', TRUE),
('GUARANTEE_MANDATARIA', 'EXTEND', 'EXTENDED', 'RELEASE', FALSE, 8, 'en', 'Release', TRUE),
('GUARANTEE_MANDATARIA', 'CLAIM', 'CLAIMED', 'PAY_CLAIM', TRUE, 9, 'en', 'Pay Claim', TRUE),
('GUARANTEE_MANDATARIA', 'PAY_CLAIM', 'PAID', 'CLOSE', FALSE, 10, 'en', 'Close', TRUE),
('GUARANTEE_MANDATARIA', 'RELEASE', 'RELEASED', 'CLOSE', FALSE, 11, 'en', 'Close', TRUE);

-- GUARANTEE_MANDATARIA flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('GUARANTEE_MANDATARIA', NULL, 'DRAFT', 'RECEIVE_MANDATE', TRUE, 1, 'es', 'Recibir Mandato', TRUE),
('GUARANTEE_MANDATARIA', 'RECEIVE_MANDATE', 'MANDATE_RECEIVED', 'ISSUE', TRUE, 2, 'es', 'Emitir Garantia', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 3, 'es', 'Enmendar Terminos', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'EXTEND', FALSE, 4, 'es', 'Extender Vigencia', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'CLAIM', FALSE, 5, 'es', 'Recibir Reclamo', TRUE),
('GUARANTEE_MANDATARIA', 'ISSUE', 'ISSUED', 'RELEASE', FALSE, 6, 'es', 'Liberar', TRUE),
('GUARANTEE_MANDATARIA', 'EXTEND', 'EXTENDED', 'CLAIM', FALSE, 7, 'es', 'Recibir Reclamo', TRUE),
('GUARANTEE_MANDATARIA', 'EXTEND', 'EXTENDED', 'RELEASE', FALSE, 8, 'es', 'Liberar', TRUE),
('GUARANTEE_MANDATARIA', 'CLAIM', 'CLAIMED', 'PAY_CLAIM', TRUE, 9, 'es', 'Pagar Reclamo', TRUE),
('GUARANTEE_MANDATARIA', 'PAY_CLAIM', 'PAID', 'CLOSE', FALSE, 10, 'es', 'Cerrar', TRUE),
('GUARANTEE_MANDATARIA', 'RELEASE', 'RELEASED', 'CLOSE', FALSE, 11, 'es', 'Cerrar', TRUE);

-- TRADE_FINANCING flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('TRADE_FINANCING', NULL, 'DRAFT', 'CREATE_FINANCING', TRUE, 1, 'en', 'Create Financing', TRUE),
('TRADE_FINANCING', 'CREATE_FINANCING', 'CREATED', 'APPROVE', TRUE, 2, 'en', 'Approve', TRUE),
('TRADE_FINANCING', 'APPROVE', 'APPROVED', 'DISBURSE', TRUE, 3, 'en', 'Disburse Funds', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'PAYMENT', FALSE, 4, 'en', 'Receive Payment', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'ROLLOVER', FALSE, 5, 'en', 'Rollover', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'RESTRUCTURE', FALSE, 6, 'en', 'Restructure', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'SETTLE', FALSE, 7, 'en', 'Settle', TRUE),
('TRADE_FINANCING', 'ROLLOVER', 'ROLLED_OVER', 'SETTLE', FALSE, 8, 'en', 'Settle', TRUE),
('TRADE_FINANCING', 'ROLLOVER', 'ROLLED_OVER', 'RESTRUCTURE', FALSE, 9, 'en', 'Restructure', TRUE),
('TRADE_FINANCING', 'RESTRUCTURE', 'RESTRUCTURED', 'SETTLE', FALSE, 10, 'en', 'Settle', TRUE),
('TRADE_FINANCING', 'SETTLE', 'SETTLED', 'CLOSE', FALSE, 11, 'en', 'Close', TRUE);

-- TRADE_FINANCING flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('TRADE_FINANCING', NULL, 'DRAFT', 'CREATE_FINANCING', TRUE, 1, 'es', 'Crear Financiamiento', TRUE),
('TRADE_FINANCING', 'CREATE_FINANCING', 'CREATED', 'APPROVE', TRUE, 2, 'es', 'Aprobar', TRUE),
('TRADE_FINANCING', 'APPROVE', 'APPROVED', 'DISBURSE', TRUE, 3, 'es', 'Desembolsar Fondos', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'PAYMENT', FALSE, 4, 'es', 'Recibir Pago', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'ROLLOVER', FALSE, 5, 'es', 'Renovar', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'RESTRUCTURE', FALSE, 6, 'es', 'Reestructurar', TRUE),
('TRADE_FINANCING', 'DISBURSE', 'DISBURSED', 'SETTLE', FALSE, 7, 'es', 'Liquidar', TRUE),
('TRADE_FINANCING', 'ROLLOVER', 'ROLLED_OVER', 'SETTLE', FALSE, 8, 'es', 'Liquidar', TRUE),
('TRADE_FINANCING', 'ROLLOVER', 'ROLLED_OVER', 'RESTRUCTURE', FALSE, 9, 'es', 'Reestructurar', TRUE),
('TRADE_FINANCING', 'RESTRUCTURE', 'RESTRUCTURED', 'SETTLE', FALSE, 10, 'es', 'Liquidar', TRUE),
('TRADE_FINANCING', 'SETTLE', 'SETTLED', 'CLOSE', FALSE, 11, 'es', 'Cerrar', TRUE);

-- AVAL_DESCUENTO flows - English
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('AVAL_DESCUENTO', NULL, 'DRAFT', 'RECEIVE_DRAFT', TRUE, 1, 'en', 'Receive Draft', TRUE),
('AVAL_DESCUENTO', 'RECEIVE_DRAFT', 'DRAFT_RECEIVED', 'ENDORSE', TRUE, 2, 'en', 'Endorse Draft', TRUE),
('AVAL_DESCUENTO', 'ENDORSE', 'ENDORSED', 'DISCOUNT', TRUE, 3, 'en', 'Discount Abroad', TRUE),
('AVAL_DESCUENTO', 'DISCOUNT', 'DISCOUNTED', 'PRESENT', FALSE, 4, 'en', 'Present for Payment', TRUE),
('AVAL_DESCUENTO', 'DISCOUNT', 'DISCOUNTED', 'PAYMENT', FALSE, 5, 'en', 'Receive Payment', TRUE),
('AVAL_DESCUENTO', 'PRESENT', 'PRESENTED', 'PAYMENT', FALSE, 6, 'en', 'Receive Payment', TRUE),
('AVAL_DESCUENTO', 'PRESENT', 'PRESENTED', 'PROTEST', FALSE, 7, 'en', 'Protest', TRUE),
('AVAL_DESCUENTO', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 8, 'en', 'Close', TRUE),
('AVAL_DESCUENTO', 'PROTEST', 'PROTESTED', 'CLOSE', FALSE, 9, 'en', 'Close', TRUE);

-- AVAL_DESCUENTO flows - Spanish
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('AVAL_DESCUENTO', NULL, 'DRAFT', 'RECEIVE_DRAFT', TRUE, 1, 'es', 'Recibir Letra', TRUE),
('AVAL_DESCUENTO', 'RECEIVE_DRAFT', 'DRAFT_RECEIVED', 'ENDORSE', TRUE, 2, 'es', 'Endosar Letra', TRUE),
('AVAL_DESCUENTO', 'ENDORSE', 'ENDORSED', 'DISCOUNT', TRUE, 3, 'es', 'Descontar en Exterior', TRUE),
('AVAL_DESCUENTO', 'DISCOUNT', 'DISCOUNTED', 'PRESENT', FALSE, 4, 'es', 'Presentar al Cobro', TRUE),
('AVAL_DESCUENTO', 'DISCOUNT', 'DISCOUNTED', 'PAYMENT', FALSE, 5, 'es', 'Recibir Pago', TRUE),
('AVAL_DESCUENTO', 'PRESENT', 'PRESENTED', 'PAYMENT', FALSE, 6, 'es', 'Recibir Pago', TRUE),
('AVAL_DESCUENTO', 'PRESENT', 'PRESENTED', 'PROTEST', FALSE, 7, 'es', 'Protestar', TRUE),
('AVAL_DESCUENTO', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 8, 'es', 'Cerrar', TRUE),
('AVAL_DESCUENTO', 'PROTEST', 'PROTESTED', 'CLOSE', FALSE, 9, 'es', 'Cerrar', TRUE);

-- =============================================================================
-- 4. Menu Items for new product types
-- =============================================================================

-- Workbox items under SECTION_WORKBOX
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'WORKBOX_STANDBY_LC', id, 'menu.workbox.standbyLc', 'FileText', '/workbox/standby-lc', 17, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_WORKBOX'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'WORKBOX_STANDBY_LC');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'WORKBOX_COLLECTION_IMPORT', id, 'menu.workbox.collectionImports', 'FileInput', '/workbox/collection-imports', 18, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_WORKBOX'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'WORKBOX_COLLECTION_IMPORT');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'WORKBOX_COLLECTION_EXPORT', id, 'menu.workbox.collectionExports', 'FileOutput', '/workbox/collection-exports', 19, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_WORKBOX'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'WORKBOX_COLLECTION_EXPORT');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'WORKBOX_GUARANTEE_MANDATARIA', id, 'menu.workbox.guaranteeMandataria', 'Shield', '/workbox/guarantee-mandataria', 20, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_WORKBOX'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'WORKBOX_GUARANTEE_MANDATARIA');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'WORKBOX_TRADE_FINANCING', id, 'menu.workbox.tradeFinancing', 'DollarSign', '/workbox/trade-financing', 21, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_WORKBOX'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'WORKBOX_TRADE_FINANCING');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'WORKBOX_AVAL_DESCUENTO', id, 'menu.workbox.avalDescuento', 'Award', '/workbox/aval-descuento', 22, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_WORKBOX'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'WORKBOX_AVAL_DESCUENTO');

-- Sidebar sections for new products
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'SECTION_GUARANTEE_MANDATARIA', NULL, 'menu.section.guaranteeMandataria', 'Shield', NULL, 42, TRUE, TRUE, 'system', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'SECTION_GUARANTEE_MANDATARIA');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'SECTION_AVAL_DESCUENTO', NULL, 'menu.section.avalDescuento', 'Award', NULL, 43, TRUE, TRUE, 'system', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'SECTION_AVAL_DESCUENTO');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'SECTION_STANDBY_LC', NULL, 'menu.section.standbyLc', 'FileText', NULL, 45, TRUE, TRUE, 'system', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'SECTION_STANDBY_LC');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'SECTION_COLLECTION_IMPORTS', NULL, 'menu.section.collectionImports', 'FileInput', NULL, 52, TRUE, TRUE, 'system', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'SECTION_COLLECTION_IMPORTS');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'SECTION_COLLECTION_EXPORTS', NULL, 'menu.section.collectionExports', 'FileOutput', NULL, 54, TRUE, TRUE, 'system', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'SECTION_COLLECTION_EXPORTS');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'SECTION_TRADE_FINANCING', NULL, 'menu.section.tradeFinancing', 'DollarSign', NULL, 56, TRUE, TRUE, 'system', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'SECTION_TRADE_FINANCING');

-- Wizard sub-items under each section
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'STANDBY_LC_WIZARD', id, 'menu.standbyLc.wizard', 'Zap', '/standby-lc/wizard', 1, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_STANDBY_LC'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'STANDBY_LC_WIZARD');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'COLLECTION_IMPORTS_WIZARD', id, 'menu.collectionImports.wizard', 'Zap', '/collection-imports/wizard', 1, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_COLLECTION_IMPORTS'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'COLLECTION_IMPORTS_WIZARD');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'COLLECTION_EXPORTS_WIZARD', id, 'menu.collectionExports.wizard', 'Zap', '/collection-exports/wizard', 1, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_COLLECTION_EXPORTS'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'COLLECTION_EXPORTS_WIZARD');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'GUARANTEE_MANDATARIA_WIZARD', id, 'menu.guaranteeMandataria.wizard', 'Zap', '/guarantee-mandataria/wizard', 1, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_GUARANTEE_MANDATARIA'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'GUARANTEE_MANDATARIA_WIZARD');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'TRADE_FINANCING_WIZARD', id, 'menu.tradeFinancing.wizard', 'Zap', '/trade-financing/wizard', 1, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_TRADE_FINANCING'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'TRADE_FINANCING_WIZARD');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'AVAL_DESCUENTO_WIZARD', id, 'menu.avalDescuento.wizard', 'Zap', '/aval-descuento/wizard', 1, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_AVAL_DESCUENTO'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'AVAL_DESCUENTO_WIZARD');

-- Expert sub-items under each section
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'STANDBY_LC_EXPERT', id, 'menu.standbyLc.expert', 'FiEdit', '/standby-lc/expert', 2, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_STANDBY_LC'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'STANDBY_LC_EXPERT');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'COLLECTION_IMPORTS_EXPERT', id, 'menu.collectionImports.expert', 'FiEdit', '/collection-imports/expert', 2, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_COLLECTION_IMPORTS'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'COLLECTION_IMPORTS_EXPERT');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'COLLECTION_EXPORTS_EXPERT', id, 'menu.collectionExports.expert', 'FiEdit', '/collection-exports/expert', 2, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_COLLECTION_EXPORTS'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'COLLECTION_EXPORTS_EXPERT');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'GUARANTEE_MANDATARIA_EXPERT', id, 'menu.guaranteeMandataria.expert', 'FiEdit', '/guarantee-mandataria/expert', 2, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_GUARANTEE_MANDATARIA'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'GUARANTEE_MANDATARIA_EXPERT');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'TRADE_FINANCING_EXPERT', id, 'menu.tradeFinancing.expert', 'FiEdit', '/trade-financing/expert', 2, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_TRADE_FINANCING'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'TRADE_FINANCING_EXPERT');

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'AVAL_DESCUENTO_EXPERT', id, 'menu.avalDescuento.expert', 'FiEdit', '/aval-descuento/expert', 2, FALSE, TRUE, 'system', NOW()
FROM menu_item WHERE code = 'SECTION_AVAL_DESCUENTO'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'AVAL_DESCUENTO_EXPERT');

-- =============================================================================
-- 5. SWIFT Response Configurations
-- =============================================================================

-- Cleanup any previously-inserted SWIFT response configs (idempotent)
DELETE FROM swift_response_config_readmodel WHERE operation_type IN ('STANDBY_LC','COLLECTION_IMPORT','COLLECTION_EXPORT','GUARANTEE_MANDATARIA','TRADE_FINANCING','AVAL_DESCUENTO');

-- STANDBY_LC
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT760', 'STANDBY_LC', 'MT730', 'ISSUE', 5, 3, 7, 'en', 'Standby LC issuance acknowledgment', 'Issuance acknowledgment overdue', TRUE),
('MT760', 'STANDBY_LC', 'MT730', 'ISSUE', 5, 3, 7, 'es', 'Acuse de emision de standby LC', 'Acuse de emision vencido', TRUE),
('MT767', 'STANDBY_LC', 'MT730', 'AMEND', 5, 3, 7, 'en', 'Amendment acknowledgment', 'Amendment acknowledgment overdue', TRUE),
('MT767', 'STANDBY_LC', 'MT730', 'AMEND', 5, 3, 7, 'es', 'Acuse de enmienda', 'Acuse de enmienda vencido', TRUE);

-- COLLECTION_IMPORT
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT412', 'COLLECTION_IMPORT', 'MT430', 'ACCEPT', 5, 3, 7, 'en', 'Acceptance advice acknowledgment', 'Acceptance acknowledgment overdue', TRUE),
('MT412', 'COLLECTION_IMPORT', 'MT430', 'ACCEPT', 5, 3, 7, 'es', 'Acuse de aviso de aceptacion', 'Acuse de aceptacion vencido', TRUE);

-- COLLECTION_EXPORT
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT400', 'COLLECTION_EXPORT', 'MT410', 'SEND_COLLECTION', 5, 3, 7, 'en', 'Collection acknowledgment from collecting bank', 'Collection acknowledgment overdue', TRUE),
('MT400', 'COLLECTION_EXPORT', 'MT410', 'SEND_COLLECTION', 5, 3, 7, 'es', 'Acuse de cobranza del banco cobrador', 'Acuse de cobranza vencido', TRUE);

-- GUARANTEE_MANDATARIA
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT760', 'GUARANTEE_MANDATARIA', 'MT730', 'ISSUE', 5, 3, 7, 'en', 'Mandated guarantee issuance acknowledgment', 'Issuance acknowledgment overdue', TRUE),
('MT760', 'GUARANTEE_MANDATARIA', 'MT730', 'ISSUE', 5, 3, 7, 'es', 'Acuse de emision de garantia mandataria', 'Acuse de emision vencido', TRUE),
('MT767', 'GUARANTEE_MANDATARIA', 'MT730', 'AMEND', 5, 3, 7, 'en', 'Amendment acknowledgment', 'Amendment acknowledgment overdue', TRUE),
('MT767', 'GUARANTEE_MANDATARIA', 'MT730', 'AMEND', 5, 3, 7, 'es', 'Acuse de enmienda', 'Acuse de enmienda vencido', TRUE);

-- TRADE_FINANCING
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT799', 'TRADE_FINANCING', 'MT799', 'DISBURSE', 5, 3, 7, 'en', 'Disbursement confirmation', 'Disbursement confirmation overdue', TRUE),
('MT799', 'TRADE_FINANCING', 'MT799', 'DISBURSE', 5, 3, 7, 'es', 'Confirmacion de desembolso', 'Confirmacion de desembolso vencida', TRUE);

-- AVAL_DESCUENTO
INSERT INTO swift_response_config_readmodel (sent_message_type, operation_type, expected_response_type, response_event_code, expected_response_days, alert_after_days, escalate_after_days, language, response_description, timeout_message, is_active) VALUES
('MT760', 'AVAL_DESCUENTO', 'MT730', 'ENDORSE', 5, 3, 7, 'en', 'Endorsement acknowledgment', 'Endorsement acknowledgment overdue', TRUE),
('MT760', 'AVAL_DESCUENTO', 'MT730', 'ENDORSE', 5, 3, 7, 'es', 'Acuse de endoso', 'Acuse de endoso vencido', TRUE),
('MT799', 'AVAL_DESCUENTO', 'MT799', 'DISCOUNT', 5, 3, 7, 'en', 'Discount confirmation', 'Discount confirmation overdue', TRUE),
('MT799', 'AVAL_DESCUENTO', 'MT799', 'DISCOUNT', 5, 3, 7, 'es', 'Confirmacion de descuento', 'Confirmacion de descuento vencida', TRUE);
