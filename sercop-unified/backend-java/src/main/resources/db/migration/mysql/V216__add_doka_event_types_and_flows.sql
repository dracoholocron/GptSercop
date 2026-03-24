-- ================================================
-- V216: Add Doka Event Types and Flows
-- Description: New events based on Doka SWIFT message mappings
-- Author: GlobalCMX Architecture
-- Date: 2026-01-30
--
-- Doka LC Import Issuance Rules:
--   S (Standard)     → MT700 or MT700_EXT
--   A/M (Amendment)  → MT700
--   T (Transferable) → MT700
--   B (Back-to-Back) → MT460
-- ================================================

-- =============================================
-- 1. NEW EVENT TYPES FOR LC_IMPORT
-- =============================================

-- PRE_ADVISE event - MT705
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('PRE_ADVISE', 'LC_IMPORT', 'en', 'Pre-Advise LC', 'Send pre-advice notification of the LC',
 'Send MT705 pre-advice to notify upcoming LC issuance',
 'MT705', NULL, '["DRAFT"]', '["PENDING"]', 'PRE_ADVISED', 'ACTIVE',
 'FiBell', 'blue', 0, TRUE, FALSE, FALSE, NOW(), NOW()),
('PRE_ADVISE', 'LC_IMPORT', 'es', 'Pre-Avisar LC', 'Enviar notificación de pre-aviso de la LC',
 'Enviar MT705 para notificar próxima emisión de LC',
 'MT705', NULL, '["DRAFT"]', '["PENDING"]', 'PRE_ADVISED', 'ACTIVE',
 'FiBell', 'blue', 0, TRUE, FALSE, FALSE, NOW(), NOW());

-- TRANSFER event - MT722
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('TRANSFER', 'LC_IMPORT', 'en', 'Transfer LC', 'Transfer the letter of credit to second beneficiary',
 'Send MT722 to transfer LC',
 'MT722', 'MT730', '["ADVISED","CONFIRMED"]', '["ACTIVE"]', 'TRANSFERRED', 'ACTIVE',
 'FiShare2', 'purple', 13, TRUE, TRUE, FALSE, NOW(), NOW()),
('TRANSFER', 'LC_IMPORT', 'es', 'Transferir LC', 'Transferir la carta de crédito al segundo beneficiario',
 'Enviar MT722 para transferir LC',
 'MT722', 'MT730', '["ADVISED","CONFIRMED"]', '["ACTIVE"]', 'TRANSFERRED', 'ACTIVE',
 'FiShare2', 'purple', 13, TRUE, TRUE, FALSE, NOW(), NOW());

-- REFUSE_AMENDMENT event - MT726
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('REFUSE_AMENDMENT', 'LC_IMPORT', 'en', 'Refuse Amendment', 'Formally refuse an amendment',
 'Send MT726 to refuse amendment terms',
 'MT726', NULL, '["PENDING_AMENDMENT"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiXOctagon', 'red', 14, TRUE, FALSE, FALSE, NOW(), NOW()),
('REFUSE_AMENDMENT', 'LC_IMPORT', 'es', 'Rechazar Enmienda', 'Rechazar formalmente una enmienda',
 'Enviar MT726 para rechazar términos de enmienda',
 'MT726', NULL, '["PENDING_AMENDMENT"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiXOctagon', 'red', 14, TRUE, FALSE, FALSE, NOW(), NOW());

-- REIMBURSEMENT_CLAIM event - MT742
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('REIMBURSEMENT_CLAIM', 'LC_IMPORT', 'en', 'Claim Reimbursement', 'Claim reimbursement from issuing bank',
 'Send MT742 reimbursement claim',
 'MT742', 'MT749', '["DOCUMENTS_ACCEPTED","PAID"]', '["ACTIVE"]', 'REIMBURSEMENT_CLAIMED', 'ACTIVE',
 'FiRefreshCw', 'orange', 15, TRUE, TRUE, FALSE, NOW(), NOW()),
('REIMBURSEMENT_CLAIM', 'LC_IMPORT', 'es', 'Reclamar Reembolso', 'Reclamar reembolso al banco emisor',
 'Enviar MT742 reclamo de reembolso',
 'MT742', 'MT749', '["DOCUMENTS_ACCEPTED","PAID"]', '["ACTIVE"]', 'REIMBURSEMENT_CLAIMED', 'ACTIVE',
 'FiRefreshCw', 'orange', 15, TRUE, TRUE, FALSE, NOW(), NOW());

-- CHARGE_ADVICE event - MT790
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CHARGE_ADVICE', 'LC_IMPORT', 'en', 'Advise Charges', 'Advise charges, interest and adjustments',
 'Send MT790 charge advice',
 'MT790', NULL, '["ISSUED","ADVISED","CONFIRMED","PAID"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiPercent', 'yellow', 16, TRUE, FALSE, FALSE, NOW(), NOW()),
('CHARGE_ADVICE', 'LC_IMPORT', 'es', 'Avisar Comisiones', 'Avisar comisiones, intereses y ajustes',
 'Enviar MT790 aviso de comisiones',
 'MT790', NULL, '["ISSUED","ADVISED","CONFIRMED","PAID"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiPercent', 'yellow', 16, TRUE, FALSE, FALSE, NOW(), NOW());

-- CHARGE_REQUEST event - MT791
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CHARGE_REQUEST', 'LC_IMPORT', 'en', 'Request Charge Payment', 'Request payment of charges',
 'Send MT791 charge payment request',
 'MT791', NULL, '["ISSUED","ADVISED","CONFIRMED","PAID"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCreditCard', 'yellow', 17, TRUE, FALSE, FALSE, NOW(), NOW()),
('CHARGE_REQUEST', 'LC_IMPORT', 'es', 'Solicitar Pago Comisiones', 'Solicitar pago de comisiones',
 'Enviar MT791 solicitud de pago de comisiones',
 'MT791', NULL, '["ISSUED","ADVISED","CONFIRMED","PAID"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCreditCard', 'yellow', 17, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 2. NEW EVENT TYPES FOR LC_EXPORT
-- =============================================

-- PRE_ADVISE for LC_EXPORT
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('PRE_ADVISE', 'LC_EXPORT', 'en', 'Pre-Advise LC', 'Send pre-advice of the LC',
 'Send MT705 pre-advice notification',
 'MT705', NULL, '["DRAFT"]', '["PENDING"]', 'PRE_ADVISED', 'ACTIVE',
 'FiBell', 'blue', 0, TRUE, FALSE, FALSE, NOW(), NOW()),
('PRE_ADVISE', 'LC_EXPORT', 'es', 'Pre-Avisar LC', 'Enviar pre-aviso de la LC',
 'Enviar notificación de pre-aviso MT705',
 'MT705', NULL, '["DRAFT"]', '["PENDING"]', 'PRE_ADVISED', 'ACTIVE',
 'FiBell', 'blue', 0, TRUE, FALSE, FALSE, NOW(), NOW());

-- REIMBURSEMENT_ADVICE event - MT735
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('REIMBURSEMENT_ADVICE', 'LC_EXPORT', 'en', 'Advise Reimbursement', 'Advise reimbursement or payment',
 'Send MT735 reimbursement advice',
 'MT735', NULL, '["PAID"]', '["ACTIVE"]', 'REIMBURSED', 'ACTIVE',
 'FiRefreshCw', 'green', 9, TRUE, FALSE, FALSE, NOW(), NOW()),
('REIMBURSEMENT_ADVICE', 'LC_EXPORT', 'es', 'Avisar Reembolso', 'Avisar reembolso o pago',
 'Enviar MT735 aviso de reembolso',
 'MT735', NULL, '["PAID"]', '["ACTIVE"]', 'REIMBURSED', 'ACTIVE',
 'FiRefreshCw', 'green', 9, TRUE, FALSE, FALSE, NOW(), NOW());

-- DEFER_PAYMENT event - MT738
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('DEFER_PAYMENT', 'LC_EXPORT', 'en', 'Defer Payment', 'Authorize deferred payment',
 'Send MT738 deferred payment authorization',
 'MT738', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'DEFERRED', 'ACTIVE',
 'FiClock', 'orange', 10, TRUE, TRUE, FALSE, NOW(), NOW()),
('DEFER_PAYMENT', 'LC_EXPORT', 'es', 'Diferir Pago', 'Autorizar pago diferido',
 'Enviar MT738 autorización de pago diferido',
 'MT738', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'DEFERRED', 'ACTIVE',
 'FiClock', 'orange', 10, TRUE, TRUE, FALSE, NOW(), NOW());

-- CHARGE_ADVICE for LC_EXPORT
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CHARGE_ADVICE', 'LC_EXPORT', 'en', 'Advise Charges', 'Advise charges and fees',
 'Send MT790 charge advice',
 'MT790', NULL, '["ISSUED","PAID"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiPercent', 'yellow', 11, TRUE, FALSE, FALSE, NOW(), NOW()),
('CHARGE_ADVICE', 'LC_EXPORT', 'es', 'Avisar Comisiones', 'Avisar comisiones y gastos',
 'Enviar MT790 aviso de comisiones',
 'MT790', NULL, '["ISSUED","PAID"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiPercent', 'yellow', 11, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 3. NEW EVENT TYPES FOR GUARANTEE
-- =============================================

-- ADVISE_THIRD_BANK event - MT719
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ADVISE_THIRD_BANK', 'GUARANTEE', 'en', 'Advise via Third Bank', 'Advise guarantee through third bank',
 'Send MT719 third bank guarantee advice',
 'MT719', 'MT768', '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiShare', 'blue', 8, TRUE, FALSE, FALSE, NOW(), NOW()),
('ADVISE_THIRD_BANK', 'GUARANTEE', 'es', 'Avisar vía Tercer Banco', 'Avisar garantía a través de tercer banco',
 'Enviar MT719 aviso de garantía de tercer banco',
 'MT719', 'MT768', '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiShare', 'blue', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- AMEND_REQUEST event - MT763
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('AMEND_REQUEST', 'GUARANTEE', 'en', 'Request Amendment', 'Request guarantee amendment',
 'Send MT763 amendment request',
 'MT763', 'MT767', '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit3', 'orange', 9, TRUE, TRUE, TRUE, NOW(), NOW()),
('AMEND_REQUEST', 'GUARANTEE', 'es', 'Solicitar Enmienda', 'Solicitar enmienda de garantía',
 'Enviar MT763 solicitud de enmienda',
 'MT763', 'MT767', '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit3', 'orange', 9, TRUE, TRUE, TRUE, NOW(), NOW());

-- REDUCE event - MT769
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('REDUCE', 'GUARANTEE', 'en', 'Reduce Amount', 'Reduce guarantee amount',
 'Send MT769 reduction advice',
 'MT769', NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'REDUCED', 'ACTIVE',
 'FiMinusCircle', 'orange', 10, TRUE, TRUE, FALSE, NOW(), NOW()),
('REDUCE', 'GUARANTEE', 'es', 'Reducir Monto', 'Reducir monto de garantía',
 'Enviar MT769 aviso de reducción',
 'MT769', NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', 'REDUCED', 'ACTIVE',
 'FiMinusCircle', 'orange', 10, TRUE, TRUE, FALSE, NOW(), NOW());

-- RELEASE_REQUEST event - MT783
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RELEASE_REQUEST', 'GUARANTEE', 'en', 'Request Release', 'Request guarantee release',
 'Send MT783 release request',
 'MT783', 'MT769', '["ISSUED","EXTENDED","REDUCED"]', '["ACTIVE"]', 'PENDING_RELEASE', 'ACTIVE',
 'FiUnlock', 'green', 11, TRUE, FALSE, FALSE, NOW(), NOW()),
('RELEASE_REQUEST', 'GUARANTEE', 'es', 'Solicitar Liberación', 'Solicitar liberación de garantía',
 'Enviar MT783 solicitud de liberación',
 'MT783', 'MT769', '["ISSUED","EXTENDED","REDUCED"]', '["ACTIVE"]', 'PENDING_RELEASE', 'ACTIVE',
 'FiUnlock', 'green', 11, TRUE, FALSE, FALSE, NOW(), NOW());

-- CLAIM_REJECT event - MT786
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CLAIM_REJECT', 'GUARANTEE', 'en', 'Reject Claim', 'Reject a claim under the guarantee',
 'Send MT786 claim rejection',
 'MT786', NULL, '["CLAIMED"]', '["ACTIVE"]', 'CLAIM_REJECTED', 'ACTIVE',
 'FiXCircle', 'red', 12, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLAIM_REJECT', 'GUARANTEE', 'es', 'Rechazar Reclamo', 'Rechazar reclamo bajo la garantía',
 'Enviar MT786 rechazo de reclamo',
 'MT786', NULL, '["CLAIMED"]', '["ACTIVE"]', 'CLAIM_REJECTED', 'ACTIVE',
 'FiXCircle', 'red', 12, TRUE, TRUE, FALSE, NOW(), NOW());

-- ATTACHMENT event - MT728/MT787
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ATTACHMENT', 'GUARANTEE', 'en', 'Send Attachment', 'Send guarantee attachment',
 'Send MT728/MT787 attachment message',
 'MT728', NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiPaperclip', 'gray', 13, TRUE, FALSE, FALSE, NOW(), NOW()),
('ATTACHMENT', 'GUARANTEE', 'es', 'Enviar Adjunto', 'Enviar adjunto de garantía',
 'Enviar mensaje de adjunto MT728/MT787',
 'MT728', NULL, '["ISSUED","EXTENDED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiPaperclip', 'gray', 13, TRUE, FALSE, FALSE, NOW(), NOW());

-- EXTEND_788 event - MT788 (Alternative extension)
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('EXTEND_788', 'GUARANTEE', 'en', 'Extend (MT788)', 'Extend guarantee using MT788',
 'Send MT788 extension message',
 'MT788', NULL, '["ISSUED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'blue', 14, TRUE, TRUE, FALSE, NOW(), NOW()),
('EXTEND_788', 'GUARANTEE', 'es', 'Extender (MT788)', 'Extender garantía usando MT788',
 'Enviar mensaje de extensión MT788',
 'MT788', NULL, '["ISSUED"]', '["ACTIVE"]', 'EXTENDED', 'ACTIVE',
 'FiCalendar', 'blue', 14, TRUE, TRUE, FALSE, NOW(), NOW());

-- DEFERRED_PAYMENT event - MT778
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('DEFERRED_PAYMENT', 'GUARANTEE', 'en', 'Advise Deferred Payment', 'Advise deferred payment on claim',
 'Send MT778 deferred payment advice',
 'MT778', NULL, '["CLAIMED"]', '["ACTIVE"]', 'DEFERRED', 'ACTIVE',
 'FiClock', 'orange', 15, TRUE, TRUE, FALSE, NOW(), NOW()),
('DEFERRED_PAYMENT', 'GUARANTEE', 'es', 'Avisar Pago Diferido', 'Avisar pago diferido de reclamo',
 'Enviar MT778 aviso de pago diferido',
 'MT778', NULL, '["CLAIMED"]', '["ACTIVE"]', 'DEFERRED', 'ACTIVE',
 'FiClock', 'orange', 15, TRUE, TRUE, FALSE, NOW(), NOW());

-- =============================================
-- 4. NEW EVENT TYPES FOR COLLECTION
-- =============================================

-- TRACER event - MT420
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('TRACER', 'COLLECTION', 'en', 'Send Tracer', 'Send tracer for collection status',
 'Send MT420 tracer message',
 'MT420', NULL, '["SENT","PRESENTED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiMessageCircle', 'blue', 8, TRUE, FALSE, FALSE, NOW(), NOW()),
('TRACER', 'COLLECTION', 'es', 'Enviar Tracer', 'Enviar tracer para estado de cobranza',
 'Enviar mensaje tracer MT420',
 'MT420', NULL, '["SENT","PRESENTED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiMessageCircle', 'blue', 8, TRUE, FALSE, FALSE, NOW(), NOW());

-- AMEND event for COLLECTION - MT430
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('AMEND', 'COLLECTION', 'en', 'Amend Collection', 'Amend collection instructions',
 'Send MT430 amendment',
 'MT430', NULL, '["SENT","PRESENTED"]', '["ACTIVE"]', 'AMENDED', 'ACTIVE',
 'FiEdit', 'orange', 9, TRUE, TRUE, TRUE, NOW(), NOW()),
('AMEND', 'COLLECTION', 'es', 'Enmendar Cobranza', 'Enmendar instrucciones de cobranza',
 'Enviar enmienda MT430',
 'MT430', NULL, '["SENT","PRESENTED"]', '["ACTIVE"]', 'AMENDED', 'ACTIVE',
 'FiEdit', 'orange', 9, TRUE, TRUE, TRUE, NOW(), NOW());

-- CANCEL_REQUEST event - MT492
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CANCEL_REQUEST', 'COLLECTION', 'en', 'Request Cancellation', 'Request cancellation of collection',
 'Send MT492 cancellation request',
 'MT492', NULL, '["SENT","PRESENTED"]', '["ACTIVE"]', 'PENDING_CANCELLATION', 'ACTIVE',
 'FiXOctagon', 'red', 10, TRUE, TRUE, FALSE, NOW(), NOW()),
('CANCEL_REQUEST', 'COLLECTION', 'es', 'Solicitar Cancelación', 'Solicitar cancelación de cobranza',
 'Enviar MT492 solicitud de cancelación',
 'MT492', NULL, '["SENT","PRESENTED"]', '["ACTIVE"]', 'PENDING_CANCELLATION', 'ACTIVE',
 'FiXOctagon', 'red', 10, TRUE, TRUE, FALSE, NOW(), NOW());

-- DISCHARGE event - MT732
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('DISCHARGE', 'COLLECTION', 'en', 'Advise Discharge', 'Advise collection discharge',
 'Send MT732 discharge advice',
 'MT732', NULL, '["ACCEPTED"]', '["ACTIVE"]', 'DISCHARGED', 'ACTIVE',
 'FiCheckSquare', 'green', 11, TRUE, FALSE, FALSE, NOW(), NOW()),
('DISCHARGE', 'COLLECTION', 'es', 'Avisar Descarga', 'Avisar descarga de cobranza',
 'Enviar MT732 aviso de descarga',
 'MT732', NULL, '["ACCEPTED"]', '["ACTIVE"]', 'DISCHARGED', 'ACTIVE',
 'FiCheckSquare', 'green', 11, TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 5. NEW EVENT TYPES FOR GUARANTEE_ISSUED
-- =============================================

-- Duplicate key events for GUARANTEE_ISSUED product type
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'GUARANTEE_ISSUED', 'en', 'Issue Guarantee', 'Issue the bank guarantee',
 'Send MT760 to issue the guarantee',
 'MT760', 'MT768', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),
('ISSUE', 'GUARANTEE_ISSUED', 'es', 'Emitir Garantía', 'Emitir la garantía bancaria',
 'Enviar MT760 para emitir la garantía',
 'MT760', 'MT768', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),
('AMEND', 'GUARANTEE_ISSUED', 'en', 'Amend Guarantee', 'Amend guarantee terms',
 'Send MT767 amendment',
 'MT767', 'MT768', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),
('AMEND', 'GUARANTEE_ISSUED', 'es', 'Enmendar Garantía', 'Enmendar términos de garantía',
 'Enviar enmienda MT767',
 'MT767', 'MT768', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),
('REDUCE', 'GUARANTEE_ISSUED', 'en', 'Reduce Amount', 'Reduce guarantee amount',
 'Send MT769 reduction',
 'MT769', NULL, '["ISSUED"]', '["ACTIVE"]', 'REDUCED', 'ACTIVE',
 'FiMinusCircle', 'orange', 3, TRUE, TRUE, FALSE, NOW(), NOW()),
('REDUCE', 'GUARANTEE_ISSUED', 'es', 'Reducir Monto', 'Reducir monto de garantía',
 'Enviar MT769 reducción',
 'MT769', NULL, '["ISSUED"]', '["ACTIVE"]', 'REDUCED', 'ACTIVE',
 'FiMinusCircle', 'orange', 3, TRUE, TRUE, FALSE, NOW(), NOW()),
('RELEASE', 'GUARANTEE_ISSUED', 'en', 'Release Guarantee', 'Release the guarantee',
 'Mark guarantee as released',
 'MT769', NULL, '["ISSUED","REDUCED"]', '["ACTIVE"]', 'RELEASED', 'CLOSED',
 'FiUnlock', 'green', 4, TRUE, TRUE, FALSE, NOW(), NOW()),
('RELEASE', 'GUARANTEE_ISSUED', 'es', 'Liberar Garantía', 'Liberar la garantía',
 'Marcar garantía como liberada',
 'MT769', NULL, '["ISSUED","REDUCED"]', '["ACTIVE"]', 'RELEASED', 'CLOSED',
 'FiUnlock', 'green', 4, TRUE, TRUE, FALSE, NOW(), NOW());

-- =============================================
-- 6. NEW EVENT TYPES FOR GUARANTEE_RECEIVED
-- =============================================

INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('RECEIVE', 'GUARANTEE_RECEIVED', 'en', 'Receive Guarantee', 'Receive incoming guarantee',
 'Process incoming MT760/MT719',
 NULL, 'MT760', '["DRAFT"]', '["PENDING"]', 'RECEIVED', 'ACTIVE',
 'FiDownload', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('RECEIVE', 'GUARANTEE_RECEIVED', 'es', 'Recibir Garantía', 'Recibir garantía entrante',
 'Procesar MT760/MT719 entrante',
 NULL, 'MT760', '["DRAFT"]', '["PENDING"]', 'RECEIVED', 'ACTIVE',
 'FiDownload', 'blue', 1, TRUE, FALSE, FALSE, NOW(), NOW()),
('ACKNOWLEDGE', 'GUARANTEE_RECEIVED', 'en', 'Acknowledge Receipt', 'Acknowledge guarantee receipt',
 'Send MT768 acknowledgment',
 'MT768', NULL, '["RECEIVED"]', '["ACTIVE"]', 'ACKNOWLEDGED', 'ACTIVE',
 'FiCheckCircle', 'green', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('ACKNOWLEDGE', 'GUARANTEE_RECEIVED', 'es', 'Acusar Recibo', 'Acusar recibo de garantía',
 'Enviar acuse MT768',
 'MT768', NULL, '["RECEIVED"]', '["ACTIVE"]', 'ACKNOWLEDGED', 'ACTIVE',
 'FiCheckCircle', 'green', 2, TRUE, FALSE, FALSE, NOW(), NOW()),
('CLAIM', 'GUARANTEE_RECEIVED', 'en', 'Make Claim', 'Make claim under the guarantee',
 'Send MT765 demand',
 'MT765', 'MT752', '["RECEIVED","ACKNOWLEDGED"]', '["ACTIVE"]', 'CLAIMED', 'ACTIVE',
 'FiAlertCircle', 'red', 3, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLAIM', 'GUARANTEE_RECEIVED', 'es', 'Hacer Reclamo', 'Hacer reclamo bajo la garantía',
 'Enviar demanda MT765',
 'MT765', 'MT752', '["RECEIVED","ACKNOWLEDGED"]', '["ACTIVE"]', 'CLAIMED', 'ACTIVE',
 'FiAlertCircle', 'red', 3, TRUE, TRUE, FALSE, NOW(), NOW());

-- =============================================
-- 7. NEW EVENT FLOW CONFIGURATIONS
-- =============================================

-- LC_IMPORT additional flows
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('LC_IMPORT', NULL, 'DRAFT', 'PRE_ADVISE', FALSE, 0, 'en', 'Send Pre-Advice', TRUE),
('LC_IMPORT', NULL, 'DRAFT', 'PRE_ADVISE', FALSE, 0, 'es', 'Enviar Pre-Aviso', TRUE),
('LC_IMPORT', 'PRE_ADVISE', 'PRE_ADVISED', 'ADVISE', TRUE, 1, 'en', 'Advise LC', TRUE),
('LC_IMPORT', 'PRE_ADVISE', 'PRE_ADVISED', 'ADVISE', TRUE, 1, 'es', 'Avisar LC', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'TRANSFER', FALSE, 13, 'en', 'Transfer LC', TRUE),
('LC_IMPORT', 'ADVISE', 'ADVISED', 'TRANSFER', FALSE, 13, 'es', 'Transferir LC', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'REFUSE_AMENDMENT', FALSE, 14, 'en', 'Refuse Amendment', TRUE),
('LC_IMPORT', 'AMEND', 'PENDING_AMENDMENT', 'REFUSE_AMENDMENT', FALSE, 14, 'es', 'Rechazar Enmienda', TRUE),
('LC_IMPORT', 'PAYMENT', 'PAID', 'REIMBURSEMENT_CLAIM', FALSE, 15, 'en', 'Claim Reimbursement', TRUE),
('LC_IMPORT', 'PAYMENT', 'PAID', 'REIMBURSEMENT_CLAIM', FALSE, 15, 'es', 'Reclamar Reembolso', TRUE);

-- GUARANTEE additional flows
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('GUARANTEE', 'ISSUE', 'ISSUED', 'ADVISE_THIRD_BANK', FALSE, 8, 'en', 'Advise via Third Bank', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'ADVISE_THIRD_BANK', FALSE, 8, 'es', 'Avisar vía Tercer Banco', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'AMEND_REQUEST', FALSE, 9, 'en', 'Request Amendment', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'AMEND_REQUEST', FALSE, 9, 'es', 'Solicitar Enmienda', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'REDUCE', FALSE, 10, 'en', 'Reduce Amount', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'REDUCE', FALSE, 10, 'es', 'Reducir Monto', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'RELEASE_REQUEST', FALSE, 11, 'en', 'Request Release', TRUE),
('GUARANTEE', 'ISSUE', 'ISSUED', 'RELEASE_REQUEST', FALSE, 11, 'es', 'Solicitar Liberación', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'CLAIM_REJECT', FALSE, 12, 'en', 'Reject Claim', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'CLAIM_REJECT', FALSE, 12, 'es', 'Rechazar Reclamo', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'DEFERRED_PAYMENT', FALSE, 15, 'en', 'Defer Payment', TRUE),
('GUARANTEE', 'CLAIM', 'CLAIMED', 'DEFERRED_PAYMENT', FALSE, 15, 'es', 'Diferir Pago', TRUE),
('GUARANTEE', 'REDUCE', 'REDUCED', 'RELEASE', FALSE, 16, 'en', 'Release', TRUE),
('GUARANTEE', 'REDUCE', 'REDUCED', 'RELEASE', FALSE, 16, 'es', 'Liberar', TRUE),
('GUARANTEE', 'RELEASE_REQUEST', 'PENDING_RELEASE', 'RELEASE', TRUE, 17, 'en', 'Confirm Release', TRUE),
('GUARANTEE', 'RELEASE_REQUEST', 'PENDING_RELEASE', 'RELEASE', TRUE, 17, 'es', 'Confirmar Liberación', TRUE);

-- COLLECTION additional flows
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'TRACER', FALSE, 8, 'en', 'Send Tracer', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'TRACER', FALSE, 8, 'es', 'Enviar Tracer', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'AMEND', FALSE, 9, 'en', 'Amend Instructions', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'AMEND', FALSE, 9, 'es', 'Enmendar Instrucciones', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'CANCEL_REQUEST', FALSE, 10, 'en', 'Request Cancellation', TRUE),
('COLLECTION', 'SEND_COLLECTION', 'SENT', 'CANCEL_REQUEST', FALSE, 10, 'es', 'Solicitar Cancelación', TRUE),
('COLLECTION', 'ACCEPT', 'ACCEPTED', 'DISCHARGE', FALSE, 11, 'en', 'Advise Discharge', TRUE),
('COLLECTION', 'ACCEPT', 'ACCEPTED', 'DISCHARGE', FALSE, 11, 'es', 'Avisar Descarga', TRUE);

-- GUARANTEE_ISSUED flows
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('GUARANTEE_ISSUED', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'en', 'Issue Guarantee', TRUE),
('GUARANTEE_ISSUED', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'es', 'Emitir Garantía', TRUE),
('GUARANTEE_ISSUED', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'en', 'Amend', TRUE),
('GUARANTEE_ISSUED', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'es', 'Enmendar', TRUE),
('GUARANTEE_ISSUED', 'ISSUE', 'ISSUED', 'REDUCE', FALSE, 3, 'en', 'Reduce', TRUE),
('GUARANTEE_ISSUED', 'ISSUE', 'ISSUED', 'REDUCE', FALSE, 3, 'es', 'Reducir', TRUE),
('GUARANTEE_ISSUED', 'ISSUE', 'ISSUED', 'RELEASE', FALSE, 4, 'en', 'Release', TRUE),
('GUARANTEE_ISSUED', 'ISSUE', 'ISSUED', 'RELEASE', FALSE, 4, 'es', 'Liberar', TRUE),
('GUARANTEE_ISSUED', 'REDUCE', 'REDUCED', 'RELEASE', FALSE, 5, 'en', 'Release', TRUE),
('GUARANTEE_ISSUED', 'REDUCE', 'REDUCED', 'RELEASE', FALSE, 5, 'es', 'Liberar', TRUE);

-- GUARANTEE_RECEIVED flows
INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('GUARANTEE_RECEIVED', NULL, 'DRAFT', 'RECEIVE', TRUE, 1, 'en', 'Receive Guarantee', TRUE),
('GUARANTEE_RECEIVED', NULL, 'DRAFT', 'RECEIVE', TRUE, 1, 'es', 'Recibir Garantía', TRUE),
('GUARANTEE_RECEIVED', 'RECEIVE', 'RECEIVED', 'ACKNOWLEDGE', FALSE, 2, 'en', 'Acknowledge', TRUE),
('GUARANTEE_RECEIVED', 'RECEIVE', 'RECEIVED', 'ACKNOWLEDGE', FALSE, 2, 'es', 'Acusar Recibo', TRUE),
('GUARANTEE_RECEIVED', 'RECEIVE', 'RECEIVED', 'CLAIM', FALSE, 3, 'en', 'Make Claim', TRUE),
('GUARANTEE_RECEIVED', 'RECEIVE', 'RECEIVED', 'CLAIM', FALSE, 3, 'es', 'Hacer Reclamo', TRUE),
('GUARANTEE_RECEIVED', 'ACKNOWLEDGE', 'ACKNOWLEDGED', 'CLAIM', FALSE, 4, 'en', 'Make Claim', TRUE),
('GUARANTEE_RECEIVED', 'ACKNOWLEDGE', 'ACKNOWLEDGED', 'CLAIM', FALSE, 4, 'es', 'Hacer Reclamo', TRUE);

-- =============================================
-- 8. LC_IMPORT ISSUANCE TYPES (Doka Rules)
-- S (Standard) → MT700 or MT700_EXT
-- A/M (Amendment) → MT700
-- T (Transferable) → MT700
-- B (Back-to-Back) → MT460
-- =============================================

-- ISSUE event for LC_IMPORT - MT700 (Standard, Amendment, Transferable)
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE', 'LC_IMPORT', 'en', 'Issue LC', 'Issue the letter of credit',
 'Send MT700 to issue the LC (Standard, Amendment, or Transferable)',
 'MT700', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW()),
('ISSUE', 'LC_IMPORT', 'es', 'Emitir LC', 'Emitir la carta de crédito',
 'Enviar MT700 para emitir la LC (Estándar, Enmienda o Transferible)',
 'MT700', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFileText', 'blue', 1, TRUE, TRUE, FALSE, NOW(), NOW());

-- ISSUE_EXTENDED event for LC_IMPORT - MT700_EXT (Alternative for Standard LC)
INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('ISSUE_EXTENDED', 'LC_IMPORT', 'en', 'Issue Extended LC', 'Issue LC with extended format',
 'Send MT700_EXT to issue LC with extended narrative fields',
 'MT700_EXT', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFilePlus', 'blue', 2, TRUE, TRUE, FALSE, NOW(), NOW()),
('ISSUE_EXTENDED', 'LC_IMPORT', 'es', 'Emitir LC Extendida', 'Emitir LC con formato extendido',
 'Enviar MT700_EXT para emitir LC con campos narrativos extendidos',
 'MT700_EXT', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiFilePlus', 'blue', 2, TRUE, TRUE, FALSE, NOW(), NOW());

-- =============================================
-- 9. BACK_TO_BACK_LC PRODUCT TYPE
-- Uses MT460 for issuance (Bank-to-Bank advice)
-- =============================================

INSERT IGNORE INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
-- ISSUE for Back-to-Back LC using MT460
('ISSUE', 'BACK_TO_BACK_LC', 'en', 'Issue Back-to-Back LC', 'Issue back-to-back letter of credit',
 'Send MT460 bank-to-bank advice to issue back-to-back LC',
 'MT460', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiLayers', 'indigo', 1, TRUE, TRUE, FALSE, NOW(), NOW()),
('ISSUE', 'BACK_TO_BACK_LC', 'es', 'Emitir LC Back-to-Back', 'Emitir carta de crédito back-to-back',
 'Enviar aviso banco-a-banco MT460 para emitir LC back-to-back',
 'MT460', 'MT730', '["DRAFT"]', '["PENDING"]', 'ISSUED', 'ACTIVE',
 'FiLayers', 'indigo', 1, TRUE, TRUE, FALSE, NOW(), NOW()),

-- AMEND for Back-to-Back LC
('AMEND', 'BACK_TO_BACK_LC', 'en', 'Amend Back-to-Back LC', 'Amend the back-to-back LC terms',
 'Send MT707 amendment',
 'MT707', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),
('AMEND', 'BACK_TO_BACK_LC', 'es', 'Enmendar LC Back-to-Back', 'Enmendar términos de la LC back-to-back',
 'Enviar enmienda MT707',
 'MT707', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'PENDING_AMENDMENT', 'ACTIVE',
 'FiEdit', 'orange', 2, TRUE, TRUE, TRUE, NOW(), NOW()),

-- PRESENT_DOCUMENTS for Back-to-Back LC
('PRESENT_DOCUMENTS', 'BACK_TO_BACK_LC', 'en', 'Present Documents', 'Present documents under the LC',
 'Present shipping and commercial documents',
 'MT750', 'MT752', '["ISSUED"]', '["ACTIVE"]', 'DOCUMENTS_PRESENTED', 'ACTIVE',
 'FiFileText', 'blue', 3, TRUE, FALSE, FALSE, NOW(), NOW()),
('PRESENT_DOCUMENTS', 'BACK_TO_BACK_LC', 'es', 'Presentar Documentos', 'Presentar documentos bajo la LC',
 'Presentar documentos de embarque y comerciales',
 'MT750', 'MT752', '["ISSUED"]', '["ACTIVE"]', 'DOCUMENTS_PRESENTED', 'ACTIVE',
 'FiFileText', 'blue', 3, TRUE, FALSE, FALSE, NOW(), NOW()),

-- PAYMENT for Back-to-Back LC
('PAYMENT', 'BACK_TO_BACK_LC', 'en', 'Process Payment', 'Process payment under the LC',
 'Process payment against accepted documents',
 'MT756', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 4, TRUE, TRUE, FALSE, NOW(), NOW()),
('PAYMENT', 'BACK_TO_BACK_LC', 'es', 'Procesar Pago', 'Procesar pago bajo la LC',
 'Procesar pago contra documentos aceptados',
 'MT756', NULL, '["DOCUMENTS_ACCEPTED"]', '["ACTIVE"]', 'PAID', 'ACTIVE',
 'FiDollarSign', 'green', 4, TRUE, TRUE, FALSE, NOW(), NOW()),

-- CLOSE for Back-to-Back LC
('CLOSE', 'BACK_TO_BACK_LC', 'en', 'Close LC', 'Close the back-to-back LC',
 'Close the LC after all obligations fulfilled',
 NULL, NULL, '["PAID","EXPIRED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiCheckCircle', 'gray', 5, TRUE, TRUE, FALSE, NOW(), NOW()),
('CLOSE', 'BACK_TO_BACK_LC', 'es', 'Cerrar LC', 'Cerrar la LC back-to-back',
 'Cerrar la LC después de cumplir todas las obligaciones',
 NULL, NULL, '["PAID","EXPIRED"]', '["ACTIVE"]', 'CLOSED', 'CLOSED',
 'FiCheckCircle', 'gray', 5, TRUE, TRUE, FALSE, NOW(), NOW());

-- =============================================
-- 10. LC_IMPORT ISSUANCE FLOWS (Doka Rules)
-- =============================================

INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
-- From DRAFT can issue with MT700 or MT700_EXT
('LC_IMPORT', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'en', 'Issue LC (MT700)', TRUE),
('LC_IMPORT', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'es', 'Emitir LC (MT700)', TRUE),
('LC_IMPORT', NULL, 'DRAFT', 'ISSUE_EXTENDED', FALSE, 2, 'en', 'Issue Extended LC (MT700_EXT)', TRUE),
('LC_IMPORT', NULL, 'DRAFT', 'ISSUE_EXTENDED', FALSE, 2, 'es', 'Emitir LC Extendida (MT700_EXT)', TRUE);

-- =============================================
-- 11. BACK_TO_BACK_LC FLOWS
-- =============================================

INSERT INTO event_flow_config_readmodel (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active) VALUES
('BACK_TO_BACK_LC', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'en', 'Issue Back-to-Back LC', TRUE),
('BACK_TO_BACK_LC', NULL, 'DRAFT', 'ISSUE', TRUE, 1, 'es', 'Emitir LC Back-to-Back', TRUE),
('BACK_TO_BACK_LC', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'en', 'Amend', TRUE),
('BACK_TO_BACK_LC', 'ISSUE', 'ISSUED', 'AMEND', FALSE, 2, 'es', 'Enmendar', TRUE),
('BACK_TO_BACK_LC', 'ISSUE', 'ISSUED', 'PRESENT_DOCUMENTS', FALSE, 3, 'en', 'Present Documents', TRUE),
('BACK_TO_BACK_LC', 'ISSUE', 'ISSUED', 'PRESENT_DOCUMENTS', FALSE, 3, 'es', 'Presentar Documentos', TRUE),
('BACK_TO_BACK_LC', 'PRESENT_DOCUMENTS', 'DOCUMENTS_ACCEPTED', 'PAYMENT', FALSE, 4, 'en', 'Process Payment', TRUE),
('BACK_TO_BACK_LC', 'PRESENT_DOCUMENTS', 'DOCUMENTS_ACCEPTED', 'PAYMENT', FALSE, 4, 'es', 'Procesar Pago', TRUE),
('BACK_TO_BACK_LC', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 5, 'en', 'Close', TRUE),
('BACK_TO_BACK_LC', 'PAYMENT', 'PAID', 'CLOSE', FALSE, 5, 'es', 'Cerrar', TRUE);
