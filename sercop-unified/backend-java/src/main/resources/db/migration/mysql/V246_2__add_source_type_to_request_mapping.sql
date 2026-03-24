-- ============================================================================
-- V246_2__add_source_type_to_request_mapping.sql
-- Add source type support for request mappings (constant values, calculated expressions)
-- ============================================================================

-- Create helper procedures for conditional DDL
DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists_v246//

CREATE PROCEDURE add_column_if_not_exists_v246(
    IN table_name_param VARCHAR(100),
    IN column_name_param VARCHAR(100),
    IN column_definition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = table_name_param
        AND column_name = column_name_param
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name_param, ' ADD COLUMN ', column_name_param, ' ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DROP PROCEDURE IF EXISTS add_index_if_not_exists_v246//

CREATE PROCEDURE add_index_if_not_exists_v246(
    IN table_name_param VARCHAR(100),
    IN index_name_param VARCHAR(100),
    IN index_columns VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
        AND table_name = table_name_param
        AND index_name = index_name_param
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', index_name_param, ' ON ', table_name_param, '(', index_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- Add source_type column to support different value sources
CALL add_column_if_not_exists_v246('external_api_request_mapping', 'source_type', "ENUM('TEMPLATE_VARIABLE', 'CONSTANT', 'CALCULATED') NOT NULL DEFAULT 'TEMPLATE_VARIABLE' AFTER api_config_id");

-- Add constant_value column for CONSTANT source type
CALL add_column_if_not_exists_v246('external_api_request_mapping', 'constant_value', 'VARCHAR(1000) NULL AFTER variable_code');

-- Add calculated_expression column for CALCULATED source type
CALL add_column_if_not_exists_v246('external_api_request_mapping', 'calculated_expression', 'VARCHAR(500) NULL AFTER constant_value');

-- Make variable_code nullable since it's only required for TEMPLATE_VARIABLE source type
-- This is safe to run multiple times
ALTER TABLE external_api_request_mapping
MODIFY COLUMN variable_code VARCHAR(100) NULL;

-- Add index for source_type queries
CALL add_index_if_not_exists_v246('external_api_request_mapping', 'idx_api_request_mapping_source_type', 'source_type');

-- Cleanup procedures
DROP PROCEDURE IF EXISTS add_column_if_not_exists_v246;
DROP PROCEDURE IF EXISTS add_index_if_not_exists_v246;
