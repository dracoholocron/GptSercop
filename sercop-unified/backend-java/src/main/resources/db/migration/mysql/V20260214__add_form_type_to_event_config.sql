-- Add form_type column to event_type_config_readmodel
-- Indicates which UI form the frontend should render for each event type:
-- SWIFT_FORM: Show the SWIFT message editor (expert/wizard mode)
-- DOCUMENT_UPLOAD: Show the document presentation panel
-- NONE: Simple confirmation (no form)

-- Idempotent: check if column exists before adding
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                   AND table_name = 'event_type_config_readmodel'
                   AND column_name = 'form_type');

SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE event_type_config_readmodel ADD COLUMN form_type VARCHAR(30) DEFAULT ''NONE''',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Events with outbound SWIFT message use the SWIFT form
UPDATE event_type_config_readmodel SET form_type = 'SWIFT_FORM' WHERE outbound_message_type IS NOT NULL AND (form_type IS NULL OR form_type = 'NONE');

-- Document presentation/reception events
UPDATE event_type_config_readmodel SET form_type = 'DOCUMENT_UPLOAD' WHERE event_code IN ('PRESENT_DOCS', 'RECEIVE_DOCS') AND (form_type IS NULL OR form_type = 'NONE');
