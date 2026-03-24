-- V45: Add sample operation and event log data for LC2025123456
-- This allows testing of the timeline feature in the flow diagram

-- First, ensure the operation exists
INSERT INTO operation_readmodel (
    operation_id, original_draft_id, product_type, message_type, reference, stage, status,
    creation_mode, swift_message, currency, amount, issue_date, expiry_date,
    applicant_name, beneficiary_name, issuing_bank_bic, advising_bank_bic,
    created_by, created_at, approved_by, approved_at
) VALUES
('LC2025123456', 'DRAFT-LC-TEST', 'LC_IMPORT', 'MT700', 'LC2025123456', 'DOCUMENTS_ACCEPTED', 'ACTIVE',
 'MANUAL', '{1:F01BANKUS33AXXX0000000000}{2:O7001234567890N}{4::20:LC2025123456:31C:250101:40A:IRREVOCABLE:59:TEST BENEFICIARY-}',
 'USD', 750000.00, '2025-01-01', '2025-06-30',
 'TEST IMPORTER LLC', 'TEST EXPORTER INC', 'BANKUS33XXX', 'BANKGB22XXX',
 'admin', DATE_SUB(NOW(), INTERVAL 14 DAY), 'supervisor', DATE_SUB(NOW(), INTERVAL 14 DAY))
ON DUPLICATE KEY UPDATE stage = 'DOCUMENTS_ACCEPTED';

-- Insert event log records with realistic timestamps showing progression
INSERT INTO operation_event_log_readmodel (
    event_id, operation_id, operation_type, event_code, event_sequence,
    previous_stage, new_stage, previous_status, new_status,
    executed_by, executed_at,
    swift_message_type, message_direction
) VALUES
-- Event 1: LC Issued (14 days ago)
(UUID(), 'LC2025123456', 'LC_IMPORT', 'ISSUE', 1,
 'DRAFT', 'ISSUED', 'PENDING', 'ACTIVE',
 'supervisor', DATE_SUB(NOW(), INTERVAL 14 DAY),
 'MT700', 'OUTBOUND'),

-- Event 2: LC Advised (12 days ago, 2 days after issue)
(UUID(), 'LC2025123456', 'LC_IMPORT', 'ADVISE', 2,
 'ISSUED', 'ADVISED', 'ACTIVE', 'ACTIVE',
 'admin', DATE_SUB(NOW(), INTERVAL 12 DAY),
 'MT710', 'OUTBOUND'),

-- Event 3: Documents Presented (7 days ago, 5 days after advise)
(UUID(), 'LC2025123456', 'LC_IMPORT', 'PRESENT_DOCS', 3,
 'ADVISED', 'DOCUMENTS_PRESENTED', 'ACTIVE', 'ACTIVE',
 'operations_user', DATE_SUB(NOW(), INTERVAL 7 DAY),
 'MT750', 'INBOUND'),

-- Event 4: Documents Accepted (3 days ago, 4 days after presentation)
(UUID(), 'LC2025123456', 'LC_IMPORT', 'ACCEPT_DOCS', 4,
 'DOCUMENTS_PRESENTED', 'DOCUMENTS_ACCEPTED', 'ACTIVE', 'ACTIVE',
 'supervisor', DATE_SUB(NOW(), INTERVAL 3 DAY),
 'MT730', 'OUTBOUND');

-- Add a second sample operation with more complete flow (already paid)
INSERT INTO operation_readmodel (
    operation_id, original_draft_id, product_type, message_type, reference, stage, status,
    creation_mode, swift_message, currency, amount, issue_date, expiry_date,
    applicant_name, beneficiary_name, issuing_bank_bic, advising_bank_bic,
    created_by, created_at, approved_by, approved_at
) VALUES
('LC2025000001', 'DRAFT-LC-COMPLETE', 'LC_IMPORT', 'MT700', 'LC2025000001', 'CLOSED', 'CLOSED',
 'MANUAL', '{1:F01BANKUS33AXXX0000000000}{2:O7001234567890N}{4::20:LC2025000001:31C:250101:40A:IRREVOCABLE:59:COMPLETE LC-}',
 'EUR', 250000.00, '2025-01-15', '2025-04-30',
 'EUROPEAN IMPORTER SA', 'ASIAN EXPORTER LTD', 'BANKFR22XXX', 'BANKHK22XXX',
 'admin', DATE_SUB(NOW(), INTERVAL 30 DAY), 'supervisor', DATE_SUB(NOW(), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE stage = 'CLOSED';

-- Complete flow for LC2025000001
INSERT INTO operation_event_log_readmodel (
    event_id, operation_id, operation_type, event_code, event_sequence,
    previous_stage, new_stage, previous_status, new_status,
    executed_by, executed_at,
    swift_message_type, message_direction
) VALUES
-- Day 0: Issued
(UUID(), 'LC2025000001', 'LC_IMPORT', 'ISSUE', 1,
 'DRAFT', 'ISSUED', 'PENDING', 'ACTIVE',
 'supervisor', DATE_SUB(NOW(), INTERVAL 30 DAY),
 'MT700', 'OUTBOUND'),

-- Day 1: Advised
(UUID(), 'LC2025000001', 'LC_IMPORT', 'ADVISE', 2,
 'ISSUED', 'ADVISED', 'ACTIVE', 'ACTIVE',
 'admin', DATE_SUB(NOW(), INTERVAL 29 DAY),
 'MT710', 'OUTBOUND'),

-- Day 10: Documents Presented
(UUID(), 'LC2025000001', 'LC_IMPORT', 'PRESENT_DOCS', 3,
 'ADVISED', 'DOCUMENTS_PRESENTED', 'ACTIVE', 'ACTIVE',
 'operations_user', DATE_SUB(NOW(), INTERVAL 20 DAY),
 'MT750', 'INBOUND'),

-- Day 12: Documents Accepted
(UUID(), 'LC2025000001', 'LC_IMPORT', 'ACCEPT_DOCS', 4,
 'DOCUMENTS_PRESENTED', 'DOCUMENTS_ACCEPTED', 'ACTIVE', 'ACTIVE',
 'supervisor', DATE_SUB(NOW(), INTERVAL 18 DAY),
 'MT730', 'OUTBOUND'),

-- Day 15: Payment Made
(UUID(), 'LC2025000001', 'LC_IMPORT', 'PAYMENT', 5,
 'DOCUMENTS_ACCEPTED', 'PAID', 'ACTIVE', 'ACTIVE',
 'treasurer', DATE_SUB(NOW(), INTERVAL 15 DAY),
 'MT756', 'OUTBOUND'),

-- Day 18: LC Closed
(UUID(), 'LC2025000001', 'LC_IMPORT', 'CLOSE', 6,
 'PAID', 'CLOSED', 'ACTIVE', 'CLOSED',
 'admin', DATE_SUB(NOW(), INTERVAL 12 DAY),
 NULL, NULL);
