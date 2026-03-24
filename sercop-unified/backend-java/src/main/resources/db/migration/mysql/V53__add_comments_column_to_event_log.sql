-- V53: Add comments column to operation_event_log_readmodel
-- This column stores optional user comments when executing events

ALTER TABLE operation_event_log_readmodel
ADD COLUMN comments TEXT NULL AFTER event_data;
