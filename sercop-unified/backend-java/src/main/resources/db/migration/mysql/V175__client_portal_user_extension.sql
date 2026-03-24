-- =============================================================================
-- Migration V175: Client Portal - User Extension
-- Extends user_read_model to support client portal users
-- All configurations are database-driven, no hardcoded values
-- =============================================================================

-- ============================================
-- 1. Extend user_read_model for client portal users
-- ============================================

-- Add user_type column to distinguish internal vs client users
SET @dbname = DATABASE();
SET @tablename = 'user_read_model';

-- Add user_type column (INTERNAL or CLIENT)
SET @columnname = 'user_type';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(20) DEFAULT ''INTERNAL'' AFTER id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add cliente_id column (FK to participante for CLIENT users)
SET @columnname = 'cliente_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' CHAR(36) NULL AFTER user_type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add is_primary_contact column
SET @columnname = 'is_primary_contact';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE AFTER cliente_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add cargo/position column for client users
SET @columnname = 'cargo';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL AFTER is_primary_contact')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add phone_number column
SET @columnname = 'phone_number';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(30) NULL AFTER cargo')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add preferred_language column
SET @columnname = 'preferred_language';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(5) DEFAULT ''en'' AFTER phone_number')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 2. Add indexes for client portal queries
-- ============================================

-- Index for filtering by user_type (using prepared statement approach)
SET @idx_name = 'idx_user_type';
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_read_model' AND INDEX_NAME = @idx_name);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_user_type ON user_read_model(user_type)', 'SELECT 1');
PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- Index for filtering client users by cliente_id
SET @idx_name = 'idx_user_cliente_id';
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_read_model' AND INDEX_NAME = @idx_name);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_user_cliente_id ON user_read_model(cliente_id)', 'SELECT 1');
PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- Composite index for client portal user lookups
SET @idx_name = 'idx_user_type_cliente';
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_read_model' AND INDEX_NAME = @idx_name);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_user_type_cliente ON user_read_model(user_type, cliente_id)', 'SELECT 1');
PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- ============================================
-- 3. Set existing users as INTERNAL
-- ============================================

UPDATE user_read_model
SET user_type = 'INTERNAL'
WHERE user_type IS NULL OR user_type = '';

-- ============================================
-- 4. Create user_type_config table for dynamic configuration
-- ============================================

CREATE TABLE IF NOT EXISTS user_type_config (
    user_type VARCHAR(20) PRIMARY KEY,
    type_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key for type name',
    description_key VARCHAR(200) COMMENT 'i18n key for description',

    -- Access configuration
    default_landing_page VARCHAR(100) DEFAULT '/' COMMENT 'Default page after login',
    allowed_menu_sections JSON COMMENT 'Array of allowed menu section codes',

    -- Data isolation
    requires_cliente_id BOOLEAN DEFAULT FALSE COMMENT 'User must have cliente_id',
    data_isolation_enabled BOOLEAN DEFAULT FALSE COMMENT 'Filter data by cliente_id',

    -- Features
    can_create_requests BOOLEAN DEFAULT FALSE,
    can_view_operations BOOLEAN DEFAULT FALSE,
    can_view_dashboard BOOLEAN DEFAULT FALSE,
    can_access_bi BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for different user types';

-- ============================================
-- 5. Seed user type configurations
-- ============================================

INSERT INTO user_type_config (
    user_type, type_name_key, description_key,
    default_landing_page, allowed_menu_sections,
    requires_cliente_id, data_isolation_enabled,
    can_create_requests, can_view_operations, can_view_dashboard, can_access_bi,
    is_active, created_by
) VALUES
-- Internal users (backoffice)
('INTERNAL', 'userType.internal.name', 'userType.internal.description',
 '/dashboard', '["SECTION_OPERATIONS", "SECTION_ADMIN", "SECTION_REPORTS", "SECTION_LC_IMPORT", "SECTION_LC_EXPORT", "SECTION_GUARANTEES", "SECTION_COLLECTIONS"]',
 FALSE, FALSE,
 TRUE, TRUE, TRUE, TRUE,
 TRUE, 'system'),

-- Client users (portal)
('CLIENT', 'userType.client.name', 'userType.client.description',
 '/client/dashboard', '["SECTION_CLIENT_PORTAL"]',
 TRUE, TRUE,
 TRUE, TRUE, TRUE, TRUE,
 TRUE, 'system')

ON DUPLICATE KEY UPDATE
    type_name_key = VALUES(type_name_key),
    description_key = VALUES(description_key),
    default_landing_page = VALUES(default_landing_page),
    allowed_menu_sections = VALUES(allowed_menu_sections);
