-- Add indexes for dashboard advanced filter columns on operation_readmodel
-- These columns are used as WHERE filters in dashboard queries

CREATE INDEX idx_op_rm_created_by ON operation_readmodel(created_by);
CREATE INDEX idx_op_rm_beneficiary_name ON operation_readmodel(beneficiary_name);
CREATE INDEX idx_op_rm_issuing_bank_bic ON operation_readmodel(issuing_bank_bic);
CREATE INDEX idx_op_rm_advising_bank_bic ON operation_readmodel(advising_bank_bic);
CREATE INDEX idx_op_rm_applicant_name ON operation_readmodel(applicant_name);
