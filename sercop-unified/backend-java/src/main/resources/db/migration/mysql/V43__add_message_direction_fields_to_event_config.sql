-- V43: Add message direction fields to event_type_config_readmodel
-- These fields clarify who sends and receives messages in each event

-- =============================================
-- 1. Add new columns to event_type_config_readmodel
-- =============================================

ALTER TABLE event_type_config_readmodel
ADD COLUMN message_sender VARCHAR(30) NULL COMMENT 'Who sends the message: ISSUING_BANK, ADVISING_BANK, CONFIRMING_BANK, BENEFICIARY, APPLICANT, COLLECTING_BANK, PRESENTING_BANK',
ADD COLUMN message_receiver VARCHAR(30) NULL COMMENT 'Who receives the message: ISSUING_BANK, ADVISING_BANK, CONFIRMING_BANK, BENEFICIARY, APPLICANT, COLLECTING_BANK, PRESENTING_BANK',
ADD COLUMN our_role VARCHAR(10) NULL COMMENT 'GlobalCMX role in this event: SENDER or RECEIVER',
ADD COLUMN requires_swift_message BOOLEAN DEFAULT FALSE COMMENT 'Whether this event requires sending/receiving a SWIFT message',
ADD COLUMN event_category VARCHAR(30) NULL COMMENT 'Category: ISSUANCE, ADVICE, AMENDMENT, DOCUMENTS, PAYMENT, CLAIM, CLOSURE';

-- Add indexes for new columns
CREATE INDEX idx_event_our_role ON event_type_config_readmodel(our_role);
CREATE INDEX idx_event_category ON event_type_config_readmodel(event_category);

-- =============================================
-- 2. Update LC_IMPORT events (GlobalCMX as Issuing Bank)
-- =============================================

-- ADVISE: Issuing bank sends MT710 to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'ADVICE'
WHERE event_code = 'ADVISE' AND operation_type = 'LC_IMPORT';

-- AMEND: Issuing bank sends MT707 to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'LC_IMPORT';

-- CONFIRM: Advising/Confirming bank sends MT730 to issuing bank (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'ADVISING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'ADVICE',
    outbound_message_type = NULL,
    inbound_message_type = 'MT730'
WHERE event_code = 'CONFIRM' AND operation_type = 'LC_IMPORT';

-- PRESENT_DOCS: Advising bank sends MT750 to issuing bank (we receive documents)
UPDATE event_type_config_readmodel
SET message_sender = 'ADVISING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'PRESENT_DOCS' AND operation_type = 'LC_IMPORT';

-- DISCREPANCY: Issuing bank sends MT734 to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'DISCREPANCY' AND operation_type = 'LC_IMPORT';

-- ACCEPT_DOCS: Issuing bank sends MT730 acceptance to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'ACCEPT_DOCS' AND operation_type = 'LC_IMPORT';

-- PAYMENT: Issuing bank sends MT756 payment advice
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'PAYMENT'
WHERE event_code = 'PAYMENT' AND operation_type = 'LC_IMPORT';

-- CLOSE: Internal event, no SWIFT message
UPDATE event_type_config_readmodel
SET message_sender = NULL,
    message_receiver = NULL,
    our_role = NULL,
    requires_swift_message = FALSE,
    event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'LC_IMPORT';

-- AMEND_ACCEPTED: Advising bank sends MT730 accepting amendment (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'ADVISING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'AMENDMENT'
WHERE event_code = 'AMEND_ACCEPTED' AND operation_type = 'LC_IMPORT';

-- AMEND_REJECTED: Internal or we receive rejection
UPDATE event_type_config_readmodel
SET message_sender = 'ADVISING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = FALSE,
    event_category = 'AMENDMENT'
WHERE event_code = 'AMEND_REJECTED' AND operation_type = 'LC_IMPORT';

-- =============================================
-- 3. Update LC_EXPORT events (GlobalCMX as Issuing Bank)
-- =============================================

-- ISSUE: Issuing bank sends MT700 to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'ISSUANCE'
WHERE event_code = 'ISSUE' AND operation_type = 'LC_EXPORT';

-- AMEND: Issuing bank sends MT707 to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'LC_EXPORT';

-- RECEIVE_DOCS: Advising bank sends MT750 to issuing bank (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'ADVISING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'RECEIVE_DOCS' AND operation_type = 'LC_EXPORT';

-- EXAMINE_DOCS: Internal event, no SWIFT message
UPDATE event_type_config_readmodel
SET message_sender = NULL,
    message_receiver = NULL,
    our_role = NULL,
    requires_swift_message = FALSE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'EXAMINE_DOCS' AND operation_type = 'LC_EXPORT';

-- DISCREPANCY: Issuing bank sends MT734 to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'DISCREPANCY' AND operation_type = 'LC_EXPORT';

-- ACCEPT_DOCS: Issuing bank sends MT730 to advising bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'ACCEPT_DOCS' AND operation_type = 'LC_EXPORT';

-- PAYMENT: Issuing bank sends MT756 payment advice
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'PAYMENT'
WHERE event_code = 'PAYMENT' AND operation_type = 'LC_EXPORT';

-- CLOSE: Internal event
UPDATE event_type_config_readmodel
SET message_sender = NULL,
    message_receiver = NULL,
    our_role = NULL,
    requires_swift_message = FALSE,
    event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'LC_EXPORT';

-- =============================================
-- 4. Update GUARANTEE events (GlobalCMX as Issuing Bank)
-- =============================================

-- ISSUE: Issuing bank sends MT760 to advising/beneficiary bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'ISSUANCE'
WHERE event_code = 'ISSUE' AND operation_type = 'GUARANTEE';

-- AMEND: Issuing bank sends MT767 amendment
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'AMENDMENT'
WHERE event_code = 'AMEND' AND operation_type = 'GUARANTEE';

-- EXTEND: Issuing bank sends MT767 extension
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'AMENDMENT'
WHERE event_code = 'EXTEND' AND operation_type = 'GUARANTEE';

-- CLAIM: Beneficiary/advising bank sends MT765 claim (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'ADVISING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'CLAIM'
WHERE event_code = 'CLAIM' AND operation_type = 'GUARANTEE';

-- PAY_CLAIM: Issuing bank sends MT756 payment
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'ADVISING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'PAYMENT'
WHERE event_code = 'PAY_CLAIM' AND operation_type = 'GUARANTEE';

-- RELEASE: Beneficiary sends release (we receive MT799)
UPDATE event_type_config_readmodel
SET message_sender = 'ADVISING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'CLOSURE'
WHERE event_code = 'RELEASE' AND operation_type = 'GUARANTEE';

-- EXPIRE: Internal event
UPDATE event_type_config_readmodel
SET message_sender = NULL,
    message_receiver = NULL,
    our_role = NULL,
    requires_swift_message = FALSE,
    event_category = 'CLOSURE'
WHERE event_code = 'EXPIRE' AND operation_type = 'GUARANTEE';

-- =============================================
-- 5. Update COLLECTION events (GlobalCMX as Remitting Bank)
-- =============================================

-- SEND_COLLECTION: Remitting bank sends MT400 to collecting bank
UPDATE event_type_config_readmodel
SET message_sender = 'ISSUING_BANK',
    message_receiver = 'COLLECTING_BANK',
    our_role = 'SENDER',
    requires_swift_message = TRUE,
    event_category = 'ISSUANCE'
WHERE event_code = 'SEND_COLLECTION' AND operation_type = 'COLLECTION';

-- PRESENT_DRAWEE: Internal event at collecting bank
UPDATE event_type_config_readmodel
SET message_sender = NULL,
    message_receiver = NULL,
    our_role = NULL,
    requires_swift_message = FALSE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'PRESENT_DRAWEE' AND operation_type = 'COLLECTION';

-- ACCEPT: Collecting bank sends MT412 acceptance (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'COLLECTING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'ACCEPT' AND operation_type = 'COLLECTION';

-- REFUSE: Collecting bank sends MT416 refusal (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'COLLECTING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS'
WHERE event_code = 'REFUSE' AND operation_type = 'COLLECTION';

-- PAYMENT: Collecting bank sends payment advice (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'COLLECTING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'PAYMENT',
    outbound_message_type = NULL,
    inbound_message_type = 'MT400'
WHERE event_code = 'PAYMENT' AND operation_type = 'COLLECTION';

-- RETURN_DOCS: Collecting bank sends MT410 returning documents (we receive)
UPDATE event_type_config_readmodel
SET message_sender = 'COLLECTING_BANK',
    message_receiver = 'ISSUING_BANK',
    our_role = 'RECEIVER',
    requires_swift_message = TRUE,
    event_category = 'DOCUMENTS',
    outbound_message_type = NULL,
    inbound_message_type = 'MT410'
WHERE event_code = 'RETURN_DOCS' AND operation_type = 'COLLECTION';

-- CLOSE: Internal event
UPDATE event_type_config_readmodel
SET message_sender = NULL,
    message_receiver = NULL,
    our_role = NULL,
    requires_swift_message = FALSE,
    event_category = 'CLOSURE'
WHERE event_code = 'CLOSE' AND operation_type = 'COLLECTION';

-- =============================================
-- 6. Add new events that were missing
-- =============================================

-- LC_IMPORT: Add RECEIVE_ACK event (receive MT730 acknowledgment after sending MT700/MT710)
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    created_at, modified_at
) VALUES
('RECEIVE_ACK', 'LC_IMPORT', 'en', 'Receive Acknowledgment', 'Receive MT730 acknowledgment from advising bank',
 'Process incoming MT730 acknowledgment confirming receipt of LC',
 NULL, 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCheck', 'green', 15, TRUE, FALSE, FALSE,
 'ADVISING_BANK', 'ISSUING_BANK', 'RECEIVER', TRUE, 'ADVICE',
 NOW(), NOW()),

('RECEIVE_ACK', 'LC_IMPORT', 'es', 'Recibir Acuse', 'Recibir acuse MT730 del banco avisador',
 'Procesar acuse MT730 entrante confirmando recepción de LC',
 NULL, 'MT730', '["ISSUED","ADVISED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCheck', 'green', 15, TRUE, FALSE, FALSE,
 'ADVISING_BANK', 'ISSUING_BANK', 'RECEIVER', TRUE, 'ADVICE',
 NOW(), NOW());

-- LC_EXPORT: Add RECEIVE_ACK event
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    created_at, modified_at
) VALUES
('RECEIVE_ACK', 'LC_EXPORT', 'en', 'Receive Acknowledgment', 'Receive MT730 acknowledgment from advising bank',
 'Process incoming MT730 acknowledgment confirming receipt of LC',
 NULL, 'MT730', '["ISSUED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCheck', 'green', 15, TRUE, FALSE, FALSE,
 'ADVISING_BANK', 'ISSUING_BANK', 'RECEIVER', TRUE, 'ADVICE',
 NOW(), NOW()),

('RECEIVE_ACK', 'LC_EXPORT', 'es', 'Recibir Acuse', 'Recibir acuse MT730 del banco avisador',
 'Procesar acuse MT730 entrante confirmando recepción de LC',
 NULL, 'MT730', '["ISSUED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCheck', 'green', 15, TRUE, FALSE, FALSE,
 'ADVISING_BANK', 'ISSUING_BANK', 'RECEIVER', TRUE, 'ADVICE',
 NOW(), NOW());

-- GUARANTEE: Add RECEIVE_ACK event
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    is_active, requires_approval, is_reversible,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    created_at, modified_at
) VALUES
('RECEIVE_ACK', 'GUARANTEE', 'en', 'Receive Acknowledgment', 'Receive MT730 acknowledgment',
 'Process incoming MT730 acknowledgment confirming receipt of guarantee',
 NULL, 'MT730', '["ISSUED","EXTENDED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCheck', 'green', 15, TRUE, FALSE, FALSE,
 'ADVISING_BANK', 'ISSUING_BANK', 'RECEIVER', TRUE, 'ADVICE',
 NOW(), NOW()),

('RECEIVE_ACK', 'GUARANTEE', 'es', 'Recibir Acuse', 'Recibir acuse MT730',
 'Procesar acuse MT730 entrante confirmando recepción de garantía',
 NULL, 'MT730', '["ISSUED","EXTENDED"]', '["ACTIVE"]', NULL, 'ACTIVE',
 'FiCheck', 'green', 15, TRUE, FALSE, FALSE,
 'ADVISING_BANK', 'ISSUING_BANK', 'RECEIVER', TRUE, 'ADVICE',
 NOW(), NOW());
