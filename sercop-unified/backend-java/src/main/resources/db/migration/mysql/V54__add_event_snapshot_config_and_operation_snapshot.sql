-- ================================================
-- Migration V54: Event Snapshot Configuration
-- Description: Add configurable operation field tracking for event logs
-- Author: GlobalCMX Architecture
-- Date: 2025-12-09
-- ================================================

-- 1. Create configuration table for tracking which operation fields to capture
CREATE TABLE IF NOT EXISTS event_snapshot_field_config (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Field identification
    field_name VARCHAR(50) NOT NULL COMMENT 'Java field name in OperationReadModel',
    field_label VARCHAR(100) NOT NULL COMMENT 'Display label for UI',
    field_type VARCHAR(20) NOT NULL DEFAULT 'STRING' COMMENT 'Data type: STRING, NUMBER, DATE, DECIMAL',

    -- Configuration
    operation_type VARCHAR(50) NULL COMMENT 'NULL = all types, or specific type like LC_IMPORT',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Order in UI display',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Tracking behavior
    track_changes BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether to track value changes',
    show_in_timeline BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether to show in event timeline',

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_operation_type_active (operation_type, is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for which operation fields to capture in event snapshots';

-- 2. Seed the configuration with the requested fields
INSERT INTO event_snapshot_field_config (field_name, field_label, field_type, display_order, track_changes, show_in_timeline) VALUES
    ('reference', 'Reference', 'STRING', 1, TRUE, TRUE),
    ('swiftMessage', 'SWIFT Message', 'STRING', 2, TRUE, FALSE),
    ('currency', 'Currency', 'STRING', 3, TRUE, TRUE),
    ('amount', 'Amount', 'DECIMAL', 4, TRUE, TRUE),
    ('issueDate', 'Issue Date', 'DATE', 5, TRUE, TRUE),
    ('expiryDate', 'Expiry Date', 'DATE', 6, TRUE, TRUE),
    ('applicantId', 'Applicant ID', 'NUMBER', 7, TRUE, TRUE),
    ('applicantName', 'Applicant Name', 'STRING', 8, TRUE, TRUE),
    ('beneficiaryId', 'Beneficiary ID', 'NUMBER', 9, TRUE, TRUE),
    ('beneficiaryName', 'Beneficiary Name', 'STRING', 10, TRUE, TRUE),
    ('issuingBankId', 'Issuing Bank ID', 'NUMBER', 11, TRUE, TRUE),
    ('issuingBankBic', 'Issuing Bank BIC', 'STRING', 12, TRUE, TRUE),
    ('advisingBankId', 'Advising Bank ID', 'NUMBER', 13, TRUE, TRUE),
    ('advisingBankBic', 'Advising Bank BIC', 'STRING', 14, TRUE, TRUE),
    ('amendmentCount', 'Amendment Count', 'NUMBER', 15, TRUE, TRUE);

-- 3. Add operation_snapshot column to event log
ALTER TABLE operation_event_log_readmodel
ADD COLUMN operation_snapshot JSON NULL COMMENT 'Snapshot of key operation fields at event time' AFTER comments;
