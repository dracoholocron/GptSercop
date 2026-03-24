-- Add pending_balance column to operation_readmodel
-- This column stores the available/pending balance calculated from SWIFT message analysis
-- (original amount - amendments - utilizations/payments)
-- Previously this was @Transient and only calculated from GLE at query time

ALTER TABLE operation_readmodel ADD COLUMN pending_balance DECIMAL(18,2) DEFAULT NULL;
