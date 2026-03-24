-- Add custom_data column to swift_draft_readmodel table
-- This column stores custom fields data in JSON format for repeatable sections and additional fields

ALTER TABLE swift_draft_readmodel
ADD COLUMN custom_data TEXT NULL COMMENT 'Custom fields data in JSON format';
