-- ================================================
-- V20260219_2: Ensure all product events exist with event_category
-- Description: Idempotent migration that ensures events for newer product types
--   exist in production. Uses DELETE + INSERT to guarantee clean state.
--   Covers: STANDBY_LC, COLLECTION_IMPORT, COLLECTION_EXPORT,
--           GUARANTEE_MANDATARIA, TRADE_FINANCING, AVAL_DESCUENTO,
--           GUARANTEE_ISSUED, GUARANTEE_RECEIVED, BACK_TO_BACK_LC
-- ================================================

-- =============================================================================
-- 1. Clean slate for newer product types (idempotent)
-- =============================================================================
DELETE FROM event_type_config_readmodel WHERE operation_type IN (
  'STANDBY_LC','COLLECTION_IMPORT','COLLECTION_EXPORT',
  'GUARANTEE_MANDATARIA','TRADE_FINANCING','AVAL_DESCUENTO'
);

-- Also ensure GUARANTEE_ISSUED, GUARANTEE_RECEIVED, BACK_TO_BACK_LC have events
DELETE FROM event_type_config_readmodel WHERE operation_type IN (
  'GUARANTEE_ISSUED','GUARANTEE_RECEIVED','BACK_TO_BACK_LC'
);

-- =============================================================================
-- 2. GUARANTEE_ISSUED events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('ISSUE','GUARANTEE_ISSUED','en','Issue Guarantee','Issue the bank guarantee','Send MT760 to issue the guarantee','MT760','MT768','["DRAFT"]','["PENDING"]','ISSUED','ACTIVE','FiFileText','blue',1,TRUE,TRUE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ISSUE','GUARANTEE_ISSUED','es','Emitir Garantía','Emitir la garantía bancaria','Enviar MT760 para emitir la garantía','MT760','MT768','["DRAFT"]','["PENDING"]','ISSUED','ACTIVE','FiFileText','blue',1,TRUE,TRUE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('AMEND','GUARANTEE_ISSUED','en','Amend Guarantee','Amend guarantee terms','Send MT767 amendment','MT767','MT768','["ISSUED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit','orange',2,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('AMEND','GUARANTEE_ISSUED','es','Enmendar Garantía','Enmendar términos de garantía','Enviar enmienda MT767','MT767','MT768','["ISSUED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit','orange',2,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('REDUCE','GUARANTEE_ISSUED','en','Reduce Amount','Reduce guarantee amount','Send MT769 reduction','MT769',NULL,'["ISSUED"]','["ACTIVE"]','REDUCED','ACTIVE','FiMinusCircle','orange',3,TRUE,TRUE,FALSE,'AMENDMENT',FALSE,NOW(),NOW()),
('REDUCE','GUARANTEE_ISSUED','es','Reducir Monto','Reducir monto de garantía','Enviar MT769 reducción','MT769',NULL,'["ISSUED"]','["ACTIVE"]','REDUCED','ACTIVE','FiMinusCircle','orange',3,TRUE,TRUE,FALSE,'AMENDMENT',FALSE,NOW(),NOW()),
('RELEASE','GUARANTEE_ISSUED','en','Release Guarantee','Release the guarantee','Mark guarantee as released','MT769',NULL,'["ISSUED","REDUCED"]','["ACTIVE"]','RELEASED','CLOSED','FiUnlock','green',4,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('RELEASE','GUARANTEE_ISSUED','es','Liberar Garantía','Liberar la garantía','Marcar garantía como liberada','MT769',NULL,'["ISSUED","REDUCED"]','["ACTIVE"]','RELEASED','CLOSED','FiUnlock','green',4,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 3. GUARANTEE_RECEIVED events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('RECEIVE','GUARANTEE_RECEIVED','en','Receive Guarantee','Receive incoming guarantee','Process incoming MT760/MT719',NULL,'MT760','["DRAFT"]','["PENDING"]','RECEIVED','ACTIVE','FiDownload','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('RECEIVE','GUARANTEE_RECEIVED','es','Recibir Garantía','Recibir garantía entrante','Procesar MT760/MT719 entrante',NULL,'MT760','["DRAFT"]','["PENDING"]','RECEIVED','ACTIVE','FiDownload','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ACKNOWLEDGE','GUARANTEE_RECEIVED','en','Acknowledge Receipt','Acknowledge guarantee receipt','Send MT768 acknowledgment','MT768',NULL,'["RECEIVED"]','["ACTIVE"]','ACKNOWLEDGED','ACTIVE','FiCheckCircle','green',2,TRUE,FALSE,FALSE,'ADVICE',FALSE,NOW(),NOW()),
('ACKNOWLEDGE','GUARANTEE_RECEIVED','es','Acusar Recibo','Acusar recibo de garantía','Enviar acuse MT768','MT768',NULL,'["RECEIVED"]','["ACTIVE"]','ACKNOWLEDGED','ACTIVE','FiCheckCircle','green',2,TRUE,FALSE,FALSE,'ADVICE',FALSE,NOW(),NOW()),
('CLAIM','GUARANTEE_RECEIVED','en','Make Claim','Make claim under the guarantee','Send MT765 demand','MT765','MT752','["RECEIVED","ACKNOWLEDGED"]','["ACTIVE"]','CLAIMED','ACTIVE','FiAlertCircle','red',3,TRUE,TRUE,FALSE,'CLAIM',FALSE,NOW(),NOW()),
('CLAIM','GUARANTEE_RECEIVED','es','Hacer Reclamo','Hacer reclamo bajo la garantía','Enviar demanda MT765','MT765','MT752','["RECEIVED","ACKNOWLEDGED"]','["ACTIVE"]','CLAIMED','ACTIVE','FiAlertCircle','red',3,TRUE,TRUE,FALSE,'CLAIM',FALSE,NOW(),NOW());

-- =============================================================================
-- 4. BACK_TO_BACK_LC events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('ISSUE','BACK_TO_BACK_LC','en','Issue Back-to-Back LC','Issue back-to-back letter of credit','Send MT460 bank-to-bank advice','MT460','MT730','["DRAFT"]','["PENDING"]','ISSUED','ACTIVE','FiLayers','indigo',1,TRUE,TRUE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ISSUE','BACK_TO_BACK_LC','es','Emitir LC Back-to-Back','Emitir carta de crédito back-to-back','Enviar aviso banco-a-banco MT460','MT460','MT730','["DRAFT"]','["PENDING"]','ISSUED','ACTIVE','FiLayers','indigo',1,TRUE,TRUE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('AMEND','BACK_TO_BACK_LC','en','Amend Back-to-Back LC','Amend the back-to-back LC terms','Send MT707 amendment','MT707','MT730','["ISSUED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit','orange',2,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('AMEND','BACK_TO_BACK_LC','es','Enmendar LC Back-to-Back','Enmendar términos de la LC back-to-back','Enviar enmienda MT707','MT707','MT730','["ISSUED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit','orange',2,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('PRESENT_DOCUMENTS','BACK_TO_BACK_LC','en','Present Documents','Present documents under the LC','Present shipping and commercial documents','MT750','MT752','["ISSUED"]','["ACTIVE"]','DOCUMENTS_PRESENTED','ACTIVE','FiFileText','blue',3,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('PRESENT_DOCUMENTS','BACK_TO_BACK_LC','es','Presentar Documentos','Presentar documentos bajo la LC','Presentar documentos de embarque y comerciales','MT750','MT752','["ISSUED"]','["ACTIVE"]','DOCUMENTS_PRESENTED','ACTIVE','FiFileText','blue',3,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('PAYMENT','BACK_TO_BACK_LC','en','Process Payment','Process payment under the LC','Process payment against accepted documents','MT756',NULL,'["DOCUMENTS_ACCEPTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',4,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('PAYMENT','BACK_TO_BACK_LC','es','Procesar Pago','Procesar pago bajo la LC','Procesar pago contra documentos aceptados','MT756',NULL,'["DOCUMENTS_ACCEPTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',4,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('CLOSE','BACK_TO_BACK_LC','en','Close LC','Close the back-to-back LC','Close the LC after all obligations fulfilled',NULL,NULL,'["PAID","EXPIRED"]','["ACTIVE"]','CLOSED','CLOSED','FiCheckCircle','gray',5,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','BACK_TO_BACK_LC','es','Cerrar LC','Cerrar la LC back-to-back','Cerrar la LC después de cumplir todas las obligaciones',NULL,NULL,'["PAID","EXPIRED"]','["ACTIVE"]','CLOSED','CLOSED','FiCheckCircle','gray',5,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 5. STANDBY_LC events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('ISSUE','STANDBY_LC','en','Issue Standby LC','Issue the standby letter of credit','Send MT760 to issue the standby LC','MT760',NULL,'["DRAFT"]','["PENDING"]','ISSUED','ACTIVE','FiFileText','blue',1,TRUE,TRUE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ISSUE','STANDBY_LC','es','Emitir Standby LC','Emitir la carta de credito standby','Enviar MT760 para emitir la standby LC','MT760',NULL,'["DRAFT"]','["PENDING"]','ISSUED','ACTIVE','FiFileText','blue',1,TRUE,TRUE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ADVISE','STANDBY_LC','en','Advise Standby LC','Advise the standby LC to the beneficiary','Send advice to beneficiary bank','MT710',NULL,'["ISSUED"]','["ACTIVE"]','ADVISED','ACTIVE','FiSend','blue',2,TRUE,FALSE,FALSE,'ADVICE',FALSE,NOW(),NOW()),
('ADVISE','STANDBY_LC','es','Avisar Standby LC','Avisar la standby LC al beneficiario','Enviar aviso al banco del beneficiario','MT710',NULL,'["ISSUED"]','["ACTIVE"]','ADVISED','ACTIVE','FiSend','blue',2,TRUE,FALSE,FALSE,'ADVICE',FALSE,NOW(),NOW()),
('AMEND','STANDBY_LC','en','Amend Standby LC','Request amendment to standby LC terms','Send MT767 amendment','MT767','MT730','["ISSUED","ADVISED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit2','orange',3,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('AMEND','STANDBY_LC','es','Enmendar Standby LC','Solicitar enmienda a terminos de la standby LC','Enviar enmienda MT767','MT767','MT730','["ISSUED","ADVISED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit2','orange',3,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('PRESENT_DEMAND','STANDBY_LC','en','Present Demand','Demand for payment under standby LC','Beneficiary presents demand with required documents',NULL,NULL,'["ADVISED","ISSUED"]','["ACTIVE"]','DEMAND_PRESENTED','ACTIVE','FiFileText','purple',4,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('PRESENT_DEMAND','STANDBY_LC','es','Presentar Demanda','Demanda de pago bajo standby LC','El beneficiario presenta demanda con documentos requeridos',NULL,NULL,'["ADVISED","ISSUED"]','["ACTIVE"]','DEMAND_PRESENTED','ACTIVE','FiFileText','purple',4,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('PAY_DEMAND','STANDBY_LC','en','Pay Demand','Effect payment of demand','Pay the demand presented under the standby LC','MT756',NULL,'["DEMAND_PRESENTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',5,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('PAY_DEMAND','STANDBY_LC','es','Pagar Demanda','Efectuar pago de la demanda','Pagar la demanda presentada bajo la standby LC','MT756',NULL,'["DEMAND_PRESENTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',5,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('EXTEND','STANDBY_LC','en','Extend Validity','Extend the standby LC expiry date','Send MT767 to extend validity period','MT767',NULL,'["ISSUED","ADVISED"]','["ACTIVE"]','EXTENDED','ACTIVE','FiCalendar','teal',6,TRUE,TRUE,FALSE,'AMENDMENT',FALSE,NOW(),NOW()),
('EXTEND','STANDBY_LC','es','Extender Vigencia','Extender fecha de vencimiento de la standby LC','Enviar MT767 para extender periodo de vigencia','MT767',NULL,'["ISSUED","ADVISED"]','["ACTIVE"]','EXTENDED','ACTIVE','FiCalendar','teal',6,TRUE,TRUE,FALSE,'AMENDMENT',FALSE,NOW(),NOW()),
('CANCEL','STANDBY_LC','en','Cancel Standby LC','Cancel the standby LC','Cancel with agreement of all parties',NULL,NULL,'["ISSUED","ADVISED","EXTENDED"]','["ACTIVE"]','CANCELLED','CANCELLED','FiXCircle','red',7,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CANCEL','STANDBY_LC','es','Cancelar Standby LC','Cancelar la standby LC','Cancelar con acuerdo de todas las partes',NULL,NULL,'["ISSUED","ADVISED","EXTENDED"]','["ACTIVE"]','CANCELLED','CANCELLED','FiXCircle','red',7,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','STANDBY_LC','en','Close Standby LC','Close the standby letter of credit','Mark as fully utilized or expired',NULL,NULL,'["PAID","CANCELLED","EXPIRED"]','["ACTIVE","CANCELLED"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','STANDBY_LC','es','Cerrar Standby LC','Cerrar la carta de credito standby','Marcar como totalmente utilizada o expirada',NULL,NULL,'["PAID","CANCELLED","EXPIRED"]','["ACTIVE","CANCELLED"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 6. COLLECTION_IMPORT events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('RECEIVE_COLLECTION','COLLECTION_IMPORT','en','Receive Collection','Receive documentary collection from remitting bank','Register incoming collection with documents',NULL,'MT400','["DRAFT"]','["PENDING"]','RECEIVED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('RECEIVE_COLLECTION','COLLECTION_IMPORT','es','Recibir Cobranza','Recibir cobranza documental del banco remitente','Registrar cobranza entrante con documentos',NULL,'MT400','["DRAFT"]','["PENDING"]','RECEIVED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('PRESENT_DRAWEE','COLLECTION_IMPORT','en','Present to Drawee','Present documents to the drawee for payment/acceptance','Notify drawee and present documents',NULL,NULL,'["RECEIVED"]','["ACTIVE"]','PRESENTED','ACTIVE','FiSend','blue',2,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('PRESENT_DRAWEE','COLLECTION_IMPORT','es','Presentar al Girado','Presentar documentos al girado para pago/aceptacion','Notificar al girado y presentar documentos',NULL,NULL,'["RECEIVED"]','["ACTIVE"]','PRESENTED','ACTIVE','FiSend','blue',2,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('ACCEPT','COLLECTION_IMPORT','en','Accept Documents','Drawee accepts the documents','Record acceptance by the drawee','MT412',NULL,'["PRESENTED"]','["ACTIVE"]','ACCEPTED','ACTIVE','FiCheckCircle','green',3,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('ACCEPT','COLLECTION_IMPORT','es','Aceptar Documentos','El girado acepta los documentos','Registrar aceptacion del girado','MT412',NULL,'["PRESENTED"]','["ACTIVE"]','ACCEPTED','ACTIVE','FiCheckCircle','green',3,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('REFUSE','COLLECTION_IMPORT','en','Refuse Documents','Drawee refuses the documents','Record refusal and notify remitting bank','MT416',NULL,'["PRESENTED"]','["ACTIVE"]','REFUSED','ACTIVE','FiAlertTriangle','red',4,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('REFUSE','COLLECTION_IMPORT','es','Rechazar Documentos','El girado rechaza los documentos','Registrar rechazo y notificar al banco remitente','MT416',NULL,'["PRESENTED"]','["ACTIVE"]','REFUSED','ACTIVE','FiAlertTriangle','red',4,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('PAYMENT','COLLECTION_IMPORT','en','Make Payment','Effect payment for the collection','Process payment from drawee','MT400',NULL,'["ACCEPTED","PRESENTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',5,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('PAYMENT','COLLECTION_IMPORT','es','Efectuar Pago','Efectuar pago de la cobranza','Procesar pago del girado','MT400',NULL,'["ACCEPTED","PRESENTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',5,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('CLOSE','COLLECTION_IMPORT','en','Close Collection','Close the documentary collection','Mark collection as settled',NULL,NULL,'["PAID","DOCS_RETURNED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','COLLECTION_IMPORT','es','Cerrar Cobranza','Cerrar la cobranza documental','Marcar cobranza como liquidada',NULL,NULL,'["PAID","DOCS_RETURNED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 7. COLLECTION_EXPORT events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('SEND_COLLECTION','COLLECTION_EXPORT','en','Send Collection','Send documentary collection to collecting bank','Send MT400 with documents to collecting bank','MT400',NULL,'["DRAFT"]','["PENDING"]','SENT','ACTIVE','FiSend','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('SEND_COLLECTION','COLLECTION_EXPORT','es','Enviar Cobranza','Enviar cobranza documental al banco cobrador','Enviar MT400 con documentos al banco cobrador','MT400',NULL,'["DRAFT"]','["PENDING"]','SENT','ACTIVE','FiSend','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ACCEPT','COLLECTION_EXPORT','en','Drawee Accepts','Drawee accepts the documents','Record acceptance notification from collecting bank',NULL,'MT412','["PRESENTED"]','["ACTIVE"]','ACCEPTED','ACTIVE','FiCheckCircle','green',3,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('ACCEPT','COLLECTION_EXPORT','es','Girado Acepta','El girado acepta los documentos','Registrar notificacion de aceptacion del banco cobrador',NULL,'MT412','["PRESENTED"]','["ACTIVE"]','ACCEPTED','ACTIVE','FiCheckCircle','green',3,TRUE,FALSE,FALSE,'DOCUMENTS',FALSE,NOW(),NOW()),
('PAYMENT','COLLECTION_EXPORT','en','Receive Payment','Receive payment from collecting bank','Process incoming payment',NULL,'MT400','["ACCEPTED","PRESENTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',5,TRUE,FALSE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('PAYMENT','COLLECTION_EXPORT','es','Recibir Pago','Recibir pago del banco cobrador','Procesar pago entrante',NULL,'MT400','["ACCEPTED","PRESENTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',5,TRUE,FALSE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('REMIT_PROCEEDS','COLLECTION_EXPORT','en','Remit Proceeds','Remit collection proceeds to principal','Transfer proceeds to the exporter',NULL,NULL,'["PAID"]','["ACTIVE"]','PROCEEDS_REMITTED','ACTIVE','FiDollarSign','teal',8,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('REMIT_PROCEEDS','COLLECTION_EXPORT','es','Remitir Fondos','Remitir fondos de cobranza al principal','Transferir fondos al exportador',NULL,NULL,'["PAID"]','["ACTIVE"]','PROCEEDS_REMITTED','ACTIVE','FiDollarSign','teal',8,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('CLOSE','COLLECTION_EXPORT','en','Close Collection','Close the documentary collection','Mark collection as settled',NULL,NULL,'["PROCEEDS_REMITTED","DOCS_RETURNED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',9,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','COLLECTION_EXPORT','es','Cerrar Cobranza','Cerrar la cobranza documental','Marcar cobranza como liquidada',NULL,NULL,'["PROCEEDS_REMITTED","DOCS_RETURNED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',9,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 8. GUARANTEE_MANDATARIA events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('RECEIVE_MANDATE','GUARANTEE_MANDATARIA','en','Receive Mandate','Receive mandate to issue guarantee on behalf of correspondent','Register incoming mandate from correspondent bank',NULL,'MT760','["DRAFT"]','["PENDING"]','MANDATE_RECEIVED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('RECEIVE_MANDATE','GUARANTEE_MANDATARIA','es','Recibir Mandato','Recibir mandato para emitir garantia en nombre de corresponsal','Registrar mandato entrante del banco corresponsal',NULL,'MT760','["DRAFT"]','["PENDING"]','MANDATE_RECEIVED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ISSUE','GUARANTEE_MANDATARIA','en','Issue Guarantee','Issue the guarantee as mandated','Issue guarantee on behalf of the mandating bank','MT760',NULL,'["MANDATE_RECEIVED"]','["ACTIVE"]','ISSUED','ACTIVE','FiSend','blue',2,TRUE,TRUE,FALSE,'ISSUANCE',FALSE,NOW(),NOW()),
('ISSUE','GUARANTEE_MANDATARIA','es','Emitir Garantia','Emitir la garantia segun el mandato','Emitir garantia en nombre del banco mandante','MT760',NULL,'["MANDATE_RECEIVED"]','["ACTIVE"]','ISSUED','ACTIVE','FiSend','blue',2,TRUE,TRUE,FALSE,'ISSUANCE',FALSE,NOW(),NOW()),
('AMEND','GUARANTEE_MANDATARIA','en','Amend Guarantee','Amend the mandated guarantee','Send MT767 amendment','MT767','MT730','["ISSUED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit2','orange',3,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('AMEND','GUARANTEE_MANDATARIA','es','Enmendar Garantia','Enmendar la garantia mandataria','Enviar enmienda MT767','MT767','MT730','["ISSUED"]','["ACTIVE"]','PENDING_AMENDMENT','ACTIVE','FiEdit2','orange',3,TRUE,TRUE,TRUE,'AMENDMENT',FALSE,NOW(),NOW()),
('CLAIM','GUARANTEE_MANDATARIA','en','Receive Claim','Receive a claim under the guarantee','Process claim from beneficiary',NULL,NULL,'["ISSUED","EXTENDED"]','["ACTIVE"]','CLAIMED','ACTIVE','FiAlertTriangle','red',5,TRUE,FALSE,FALSE,'CLAIM',FALSE,NOW(),NOW()),
('CLAIM','GUARANTEE_MANDATARIA','es','Recibir Reclamo','Recibir reclamo bajo la garantia','Procesar reclamo del beneficiario',NULL,NULL,'["ISSUED","EXTENDED"]','["ACTIVE"]','CLAIMED','ACTIVE','FiAlertTriangle','red',5,TRUE,FALSE,FALSE,'CLAIM',FALSE,NOW(),NOW()),
('PAY_CLAIM','GUARANTEE_MANDATARIA','en','Pay Claim','Effect payment of the claim','Pay the claim and debit mandating bank','MT799',NULL,'["CLAIMED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',6,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('PAY_CLAIM','GUARANTEE_MANDATARIA','es','Pagar Reclamo','Efectuar pago del reclamo','Pagar el reclamo y debitar al banco mandante','MT799',NULL,'["CLAIMED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','green',6,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('RELEASE','GUARANTEE_MANDATARIA','en','Release Guarantee','Release the guarantee upon expiry or agreement','Release guarantee and notify parties',NULL,NULL,'["ISSUED","EXTENDED"]','["ACTIVE"]','RELEASED','ACTIVE','FiUnlock','green',7,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('RELEASE','GUARANTEE_MANDATARIA','es','Liberar Garantia','Liberar la garantia por vencimiento o acuerdo','Liberar garantia y notificar a las partes',NULL,NULL,'["ISSUED","EXTENDED"]','["ACTIVE"]','RELEASED','ACTIVE','FiUnlock','green',7,TRUE,TRUE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','GUARANTEE_MANDATARIA','en','Close','Close the mandated guarantee','Mark guarantee as closed',NULL,NULL,'["PAID","RELEASED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','GUARANTEE_MANDATARIA','es','Cerrar','Cerrar la garantia mandataria','Marcar garantia como cerrada',NULL,NULL,'["PAID","RELEASED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 9. TRADE_FINANCING events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('CREATE_FINANCING','TRADE_FINANCING','en','Create Financing','Create new trade financing facility','Register the financing request and terms',NULL,NULL,'["DRAFT"]','["PENDING"]','CREATED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('CREATE_FINANCING','TRADE_FINANCING','es','Crear Financiamiento','Crear nueva facilidad de financiamiento comercial','Registrar solicitud de financiamiento y terminos',NULL,NULL,'["DRAFT"]','["PENDING"]','CREATED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('APPROVE','TRADE_FINANCING','en','Approve Financing','Approve the financing facility','Approve credit committee decision',NULL,NULL,'["CREATED"]','["ACTIVE"]','APPROVED','ACTIVE','FiCheckCircle','green',2,TRUE,TRUE,FALSE,'ISSUANCE',FALSE,NOW(),NOW()),
('APPROVE','TRADE_FINANCING','es','Aprobar Financiamiento','Aprobar la facilidad de financiamiento','Aprobar decision del comite de credito',NULL,NULL,'["CREATED"]','["ACTIVE"]','APPROVED','ACTIVE','FiCheckCircle','green',2,TRUE,TRUE,FALSE,'ISSUANCE',FALSE,NOW(),NOW()),
('DISBURSE','TRADE_FINANCING','en','Disburse Funds','Disburse financing funds','Transfer funds to the borrower','MT799',NULL,'["APPROVED"]','["ACTIVE"]','DISBURSED','ACTIVE','FiDollarSign','green',3,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('DISBURSE','TRADE_FINANCING','es','Desembolsar Fondos','Desembolsar fondos del financiamiento','Transferir fondos al prestatario','MT799',NULL,'["APPROVED"]','["ACTIVE"]','DISBURSED','ACTIVE','FiDollarSign','green',3,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('SETTLE','TRADE_FINANCING','en','Settle','Full settlement of the financing','Complete final repayment',NULL,NULL,'["DISBURSED","ROLLED_OVER","RESTRUCTURED"]','["ACTIVE"]','SETTLED','ACTIVE','FiCheck','green',7,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('SETTLE','TRADE_FINANCING','es','Liquidar','Liquidacion total del financiamiento','Completar pago final',NULL,NULL,'["DISBURSED","ROLLED_OVER","RESTRUCTURED"]','["ACTIVE"]','SETTLED','ACTIVE','FiCheck','green',7,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('CLOSE','TRADE_FINANCING','en','Close','Close the financing facility','Mark financing as fully settled',NULL,NULL,'["SETTLED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','TRADE_FINANCING','es','Cerrar','Cerrar la facilidad de financiamiento','Marcar financiamiento como totalmente liquidado',NULL,NULL,'["SETTLED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',8,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 10. AVAL_DESCUENTO events (with event_category)
-- =============================================================================
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, event_category, is_initial_event, created_at, modified_at
) VALUES
('RECEIVE_DRAFT','AVAL_DESCUENTO','en','Receive Draft','Receive the draft/bill for endorsement','Register the incoming draft for aval processing',NULL,NULL,'["DRAFT"]','["PENDING"]','DRAFT_RECEIVED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('RECEIVE_DRAFT','AVAL_DESCUENTO','es','Recibir Letra','Recibir la letra/pagare para endoso','Registrar la letra entrante para procesamiento de aval',NULL,NULL,'["DRAFT"]','["PENDING"]','DRAFT_RECEIVED','ACTIVE','FiFileText','blue',1,TRUE,FALSE,FALSE,'ISSUANCE',TRUE,NOW(),NOW()),
('ENDORSE','AVAL_DESCUENTO','en','Endorse Draft','Add bank endorsement (aval) to the draft','Bank endorses the draft as guarantor','MT760',NULL,'["DRAFT_RECEIVED"]','["ACTIVE"]','ENDORSED','ACTIVE','FiCheckCircle','green',2,TRUE,TRUE,FALSE,'ISSUANCE',FALSE,NOW(),NOW()),
('ENDORSE','AVAL_DESCUENTO','es','Endosar Letra','Agregar endoso bancario (aval) a la letra','El banco endosa la letra como garante','MT760',NULL,'["DRAFT_RECEIVED"]','["ACTIVE"]','ENDORSED','ACTIVE','FiCheckCircle','green',2,TRUE,TRUE,FALSE,'ISSUANCE',FALSE,NOW(),NOW()),
('DISCOUNT','AVAL_DESCUENTO','en','Discount Draft','Send draft for discount abroad','Send endorsed draft to foreign bank for discount','MT799',NULL,'["ENDORSED"]','["ACTIVE"]','DISCOUNTED','ACTIVE','FiDollarSign','green',3,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('DISCOUNT','AVAL_DESCUENTO','es','Descontar Letra','Enviar letra para descuento en el exterior','Enviar letra endosada a banco del exterior para descuento','MT799',NULL,'["ENDORSED"]','["ACTIVE"]','DISCOUNTED','ACTIVE','FiDollarSign','green',3,TRUE,TRUE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('PAYMENT','AVAL_DESCUENTO','en','Receive Payment','Receive payment at maturity','Process payment of the draft',NULL,NULL,'["PRESENTED","DISCOUNTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','teal',5,TRUE,FALSE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('PAYMENT','AVAL_DESCUENTO','es','Recibir Pago','Recibir pago al vencimiento','Procesar pago de la letra',NULL,NULL,'["PRESENTED","DISCOUNTED"]','["ACTIVE"]','PAID','ACTIVE','FiDollarSign','teal',5,TRUE,FALSE,FALSE,'PAYMENT',FALSE,NOW(),NOW()),
('CLOSE','AVAL_DESCUENTO','en','Close','Close the aval operation','Mark the operation as settled',NULL,NULL,'["PAID","PROTESTED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',7,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW()),
('CLOSE','AVAL_DESCUENTO','es','Cerrar','Cerrar la operacion de aval','Marcar la operacion como liquidada',NULL,NULL,'["PAID","PROTESTED"]','["ACTIVE"]','CLOSED','CLOSED','FiArchive','gray',7,TRUE,FALSE,FALSE,'CLOSURE',FALSE,NOW(),NOW());

-- =============================================================================
-- 11. Ensure product_type_config has all products
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

INSERT INTO product_type_config (product_type, base_url, wizard_url, view_mode_title_key,
  description, swift_message_type, category, display_order, active, id_prefix, accounting_nature, created_at)
SELECT 'BACK_TO_BACK_LC', '/back-to-back-lc', '/back-to-back-lc/wizard',
  'backToBackLcWizard.viewModeTitle', 'LC Back-to-Back', 'MT460', 'LETTERS_OF_CREDIT', 3, TRUE, 'BTB', 'DEBIT', NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_type_config WHERE product_type = 'BACK_TO_BACK_LC');
