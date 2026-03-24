-- V55: Add individual operation snapshot columns to operation_event_log_readmodel
-- These columns capture the state of key operation fields at the time of each event

ALTER TABLE operation_event_log_readmodel
    ADD COLUMN reference VARCHAR(50) NULL AFTER operation_snapshot,
    ADD COLUMN swift_message TEXT NULL AFTER reference,
    ADD COLUMN currency VARCHAR(3) NULL AFTER swift_message,
    ADD COLUMN amount DECIMAL(18,2) NULL AFTER currency,
    ADD COLUMN issue_date DATE NULL AFTER amount,
    ADD COLUMN expiry_date DATE NULL AFTER issue_date,
    ADD COLUMN applicant_id INT NULL AFTER expiry_date,
    ADD COLUMN applicant_name VARCHAR(255) NULL AFTER applicant_id,
    ADD COLUMN beneficiary_id INT NULL AFTER applicant_name,
    ADD COLUMN beneficiary_name VARCHAR(255) NULL AFTER beneficiary_id,
    ADD COLUMN issuing_bank_id INT NULL AFTER beneficiary_name,
    ADD COLUMN issuing_bank_bic VARCHAR(11) NULL AFTER issuing_bank_id,
    ADD COLUMN advising_bank_id INT NULL AFTER issuing_bank_bic,
    ADD COLUMN advising_bank_bic VARCHAR(11) NULL AFTER advising_bank_id,
    ADD COLUMN amendment_count INT NULL DEFAULT 0 AFTER advising_bank_bic;

-- Add indexes for common queries
CREATE INDEX idx_event_log_reference ON operation_event_log_readmodel(reference);
CREATE INDEX idx_event_log_currency ON operation_event_log_readmodel(currency);
CREATE INDEX idx_event_log_applicant_id ON operation_event_log_readmodel(applicant_id);
CREATE INDEX idx_event_log_beneficiary_id ON operation_event_log_readmodel(beneficiary_id);
