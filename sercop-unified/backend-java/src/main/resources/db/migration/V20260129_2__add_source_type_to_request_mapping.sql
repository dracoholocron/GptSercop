-- ============================================================================
-- V20260129_2__add_source_type_to_request_mapping.sql
-- Add source type support for request mappings (constant values, calculated expressions)
-- ============================================================================

-- Add source_type column to support different value sources
ALTER TABLE external_api_request_mapping
ADD COLUMN source_type ENUM('TEMPLATE_VARIABLE', 'CONSTANT', 'CALCULATED') NOT NULL DEFAULT 'TEMPLATE_VARIABLE' AFTER api_config_id;

-- Add constant_value column for CONSTANT source type
ALTER TABLE external_api_request_mapping
ADD COLUMN constant_value VARCHAR(1000) NULL AFTER variable_code;

-- Add calculated_expression column for CALCULATED source type (formulas like NOW(), UUID(), etc.)
ALTER TABLE external_api_request_mapping
ADD COLUMN calculated_expression VARCHAR(500) NULL AFTER constant_value;

-- Make variable_code nullable since it's only required for TEMPLATE_VARIABLE source type
ALTER TABLE external_api_request_mapping
MODIFY COLUMN variable_code VARCHAR(100) NULL;

-- Add index for source_type queries
CREATE INDEX idx_api_request_mapping_source_type ON external_api_request_mapping(source_type);
