-- Add source type support to external API request mappings
-- This allows using constant values and calculated expressions in addition to template variables

SET @dbname = DATABASE();
SET @tablename = 'external_api_request_mapping';

CREATE TABLE IF NOT EXISTS external_api_request_mapping (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  api_config_id BIGINT NOT NULL,
  source_type VARCHAR(30) NOT NULL DEFAULT 'TEMPLATE_VARIABLE',
  variable_code VARCHAR(100) NULL,
  constant_value VARCHAR(1000) NULL,
  calculated_expression VARCHAR(500) NULL,
  api_parameter_name VARCHAR(255) NOT NULL,
  use_custom_name BOOLEAN DEFAULT FALSE,
  custom_name VARCHAR(255) NULL,
  parameter_location VARCHAR(30) NOT NULL DEFAULT 'BODY',
  json_path VARCHAR(500) NULL,
  transformation_type VARCHAR(30) DEFAULT 'NONE',
  transformation_pattern VARCHAR(255) NULL,
  default_value VARCHAR(500) NULL,
  is_required BOOLEAN DEFAULT TRUE,
  description VARCHAR(500) NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME,
  updated_at DATETIME,
  INDEX idx_request_mapping_api_config (api_config_id),
  INDEX idx_request_mapping_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add source_type column if not exists
SET @columnname = 'source_type';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(30) NOT NULL DEFAULT ''TEMPLATE_VARIABLE'' AFTER api_config_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add constant_value column if not exists
SET @columnname = 'constant_value';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(1000) NULL AFTER variable_code')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add calculated_expression column if not exists
SET @columnname = 'calculated_expression';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL AFTER constant_value')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Make variable_code nullable (this is safe to run multiple times)
ALTER TABLE external_api_request_mapping
MODIFY COLUMN variable_code VARCHAR(100) NULL;

-- Add index for source_type queries (if not exists)
SET @indexname = 'idx_request_mapping_source_type';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = @indexname) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(source_type)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
