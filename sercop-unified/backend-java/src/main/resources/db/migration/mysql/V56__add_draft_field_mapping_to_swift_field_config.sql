-- V56: Add draft_field_mapping column to swift_field_config_readmodel
-- This column maps SWIFT field tags to SwiftDraftReadModel entity fields
-- for automatic extraction when creating/updating drafts

ALTER TABLE swift_field_config_readmodel
    ADD COLUMN draft_field_mapping VARCHAR(100) NULL
    COMMENT 'Entity field(s) to map to. Single field: "expiryDate". Multiple: "currency,amount"'
    AFTER field_type;

-- Create index for faster lookups of fields that have mappings
CREATE INDEX idx_swift_field_draft_mapping ON swift_field_config_readmodel(message_type, draft_field_mapping);

-- Update existing configurations with draft field mappings for key fields
-- MT700 (Documentary Credit Issuance)
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'reference'
WHERE field_code = ':20:' AND message_type = 'MT700' AND draft_field_mapping IS NULL;

UPDATE swift_field_config_readmodel SET draft_field_mapping = 'issueDate'
WHERE field_code = ':31C:' AND message_type = 'MT700' AND draft_field_mapping IS NULL;

UPDATE swift_field_config_readmodel SET draft_field_mapping = 'expiryDate'
WHERE field_code = ':31D:' AND message_type = 'MT700' AND draft_field_mapping IS NULL;

UPDATE swift_field_config_readmodel SET draft_field_mapping = 'currency,amount'
WHERE field_code = ':32B:' AND message_type = 'MT700' AND draft_field_mapping IS NULL;
