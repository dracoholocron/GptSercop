-- V44: Add initial event fields to event_type_config_readmodel
-- These fields support multiple entry points in event flows (e.g., Issuing Bank vs Advising Bank)

-- =============================================
-- 1. Add new columns to event_type_config_readmodel
-- =============================================

ALTER TABLE event_type_config_readmodel
ADD COLUMN is_initial_event BOOLEAN DEFAULT FALSE COMMENT 'True if this event can start a flow (entry point)',
ADD COLUMN initial_event_role VARCHAR(30) NULL COMMENT 'Bank role that uses this as entry point: ISSUING_BANK, ADVISING_BANK, CONFIRMING_BANK, REIMBURSING_BANK';

-- Add index for initial events lookup
CREATE INDEX idx_event_initial ON event_type_config_readmodel(is_initial_event, initial_event_role);

-- =============================================
-- 2. Configure initial events for LC_IMPORT
-- For LC Import, entry points depend on bank role:
-- - ISSUING_BANK: Starts with ISSUE (sends MT700)
-- - ADVISING_BANK: Starts with ADVISE (receives MT700, sends MT710)
-- =============================================

-- Add ISSUE event for LC_IMPORT (when GlobalCMX is Issuing Bank)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, approval_levels, is_reversible, generates_notification,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_initial_event, initial_event_role,
    created_at, modified_at
) VALUES
('ISSUE', 'LC_IMPORT', 'en', 'Issue LC', 'Issue new Letter of Credit to beneficiary via advising bank',
 'Create and send MT700 to the advising bank to issue a new documentary credit. This is the starting point when acting as the Issuing Bank.',
 'MT700', NULL, NULL, NULL, 'ISSUED', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, TRUE, 2, FALSE, TRUE,
 'ISSUING_BANK', 'ADVISING_BANK', 'SENDER', TRUE, 'ISSUANCE',
 TRUE, 'ISSUING_BANK',
 NOW(), NOW()),

('ISSUE', 'LC_IMPORT', 'es', 'Emitir LC', 'Emitir nueva Carta de Crédito al beneficiario a través del banco avisador',
 'Crear y enviar MT700 al banco avisador para emitir un nuevo crédito documentario. Este es el punto de inicio cuando se actúa como Banco Emisor.',
 'MT700', NULL, NULL, NULL, 'ISSUED', 'ACTIVE',
 'FiSend', 'blue', 1, TRUE, TRUE, 2, FALSE, TRUE,
 'ISSUING_BANK', 'ADVISING_BANK', 'SENDER', TRUE, 'ISSUANCE',
 TRUE, 'ISSUING_BANK',
 NOW(), NOW());

-- Update existing ADVISE event to be an initial event for ADVISING_BANK role
UPDATE event_type_config_readmodel
SET is_initial_event = TRUE,
    initial_event_role = 'ADVISING_BANK',
    valid_from_stages = NULL,
    valid_from_statuses = NULL,
    help_text = CASE
        WHEN language = 'en' THEN 'Receive MT700 from issuing bank and advise the LC to the beneficiary. Send MT710 advice. This is the starting point when acting as the Advising Bank.'
        WHEN language = 'es' THEN 'Recibir MT700 del banco emisor y avisar la LC al beneficiario. Enviar aviso MT710. Este es el punto de inicio cuando se actúa como Banco Avisador.'
        ELSE help_text
    END,
    inbound_message_type = 'MT700',
    outbound_message_type = 'MT710'
WHERE event_code = 'ADVISE' AND operation_type = 'LC_IMPORT';

-- =============================================
-- 3. Configure initial events for LC_EXPORT
-- For LC Export, entry points depend on bank role:
-- - ISSUING_BANK: Starts with ISSUE (sends MT700)
-- - ADVISING_BANK: Starts with RECEIVE_LC (receives MT700)
-- =============================================

-- Update existing ISSUE event for LC_EXPORT
UPDATE event_type_config_readmodel
SET is_initial_event = TRUE,
    initial_event_role = 'ISSUING_BANK'
WHERE event_code = 'ISSUE' AND operation_type = 'LC_EXPORT';

-- Add RECEIVE_LC event for LC_EXPORT (when GlobalCMX is Advising Bank)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, approval_levels, is_reversible, generates_notification,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_initial_event, initial_event_role,
    created_at, modified_at
) VALUES
('RECEIVE_LC', 'LC_EXPORT', 'en', 'Receive LC', 'Receive incoming Letter of Credit from issuing bank',
 'Receive and process incoming MT700 from the issuing bank. This is the starting point when acting as the Advising Bank.',
 NULL, 'MT700', NULL, NULL, 'ADVISED', 'ACTIVE',
 'FiFileText', 'green', 1, TRUE, FALSE, 1, FALSE, TRUE,
 'ISSUING_BANK', 'ADVISING_BANK', 'RECEIVER', TRUE, 'ISSUANCE',
 TRUE, 'ADVISING_BANK',
 NOW(), NOW()),

('RECEIVE_LC', 'LC_EXPORT', 'es', 'Recibir LC', 'Recibir Carta de Crédito entrante del banco emisor',
 'Recibir y procesar MT700 entrante del banco emisor. Este es el punto de inicio cuando se actúa como Banco Avisador.',
 NULL, 'MT700', NULL, NULL, 'ADVISED', 'ACTIVE',
 'FiFileText', 'green', 1, TRUE, FALSE, 1, FALSE, TRUE,
 'ISSUING_BANK', 'ADVISING_BANK', 'RECEIVER', TRUE, 'ISSUANCE',
 TRUE, 'ADVISING_BANK',
 NOW(), NOW());

-- =============================================
-- 4. Configure initial events for GUARANTEE
-- For Guarantees, entry points depend on bank role:
-- - ISSUING_BANK: Starts with ISSUE (sends MT760)
-- - ADVISING_BANK: Starts with RECEIVE_GUARANTEE (receives MT760)
-- =============================================

-- Update existing ISSUE event for GUARANTEE
UPDATE event_type_config_readmodel
SET is_initial_event = TRUE,
    initial_event_role = 'ISSUING_BANK'
WHERE event_code = 'ISSUE' AND operation_type = 'GUARANTEE';

-- Add RECEIVE_GUARANTEE event for GUARANTEE (when GlobalCMX is Advising Bank)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, approval_levels, is_reversible, generates_notification,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_initial_event, initial_event_role,
    created_at, modified_at
) VALUES
('RECEIVE_GUARANTEE', 'GUARANTEE', 'en', 'Receive Guarantee', 'Receive incoming guarantee from issuing bank',
 'Receive and process incoming MT760 from the issuing bank. This is the starting point when acting as the Advising Bank.',
 NULL, 'MT760', NULL, NULL, 'ADVISED', 'ACTIVE',
 'FiFileText', 'green', 1, TRUE, FALSE, 1, FALSE, TRUE,
 'ISSUING_BANK', 'ADVISING_BANK', 'RECEIVER', TRUE, 'ISSUANCE',
 TRUE, 'ADVISING_BANK',
 NOW(), NOW()),

('RECEIVE_GUARANTEE', 'GUARANTEE', 'es', 'Recibir Garantía', 'Recibir garantía entrante del banco emisor',
 'Recibir y procesar MT760 entrante del banco emisor. Este es el punto de inicio cuando se actúa como Banco Avisador.',
 NULL, 'MT760', NULL, NULL, 'ADVISED', 'ACTIVE',
 'FiFileText', 'green', 1, TRUE, FALSE, 1, FALSE, TRUE,
 'ISSUING_BANK', 'ADVISING_BANK', 'RECEIVER', TRUE, 'ISSUANCE',
 TRUE, 'ADVISING_BANK',
 NOW(), NOW());

-- =============================================
-- 5. Configure initial events for COLLECTION
-- For Collections, entry points depend on bank role:
-- - REMITTING_BANK: Starts with SEND_COLLECTION (sends MT400)
-- - COLLECTING_BANK: Starts with RECEIVE_COLLECTION (receives MT400)
-- =============================================

-- Update existing SEND_COLLECTION event
UPDATE event_type_config_readmodel
SET is_initial_event = TRUE,
    initial_event_role = 'ISSUING_BANK'
WHERE event_code = 'SEND_COLLECTION' AND operation_type = 'COLLECTION';

-- Add RECEIVE_COLLECTION event for COLLECTION (when GlobalCMX is Collecting Bank)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, approval_levels, is_reversible, generates_notification,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_initial_event, initial_event_role,
    created_at, modified_at
) VALUES
('RECEIVE_COLLECTION', 'COLLECTION', 'en', 'Receive Collection', 'Receive incoming collection from remitting bank',
 'Receive and process incoming MT400 from the remitting bank. This is the starting point when acting as the Collecting Bank.',
 NULL, 'MT400', NULL, NULL, 'RECEIVED', 'ACTIVE',
 'FiFileText', 'green', 1, TRUE, FALSE, 1, FALSE, TRUE,
 'ISSUING_BANK', 'COLLECTING_BANK', 'RECEIVER', TRUE, 'ISSUANCE',
 TRUE, 'COLLECTING_BANK',
 NOW(), NOW()),

('RECEIVE_COLLECTION', 'COLLECTION', 'es', 'Recibir Cobranza', 'Recibir cobranza entrante del banco remitente',
 'Recibir y procesar MT400 entrante del banco remitente. Este es el punto de inicio cuando se actúa como Banco Cobrador.',
 NULL, 'MT400', NULL, NULL, 'RECEIVED', 'ACTIVE',
 'FiFileText', 'green', 1, TRUE, FALSE, 1, FALSE, TRUE,
 'ISSUING_BANK', 'COLLECTING_BANK', 'RECEIVER', TRUE, 'ISSUANCE',
 TRUE, 'COLLECTING_BANK',
 NOW(), NOW());
