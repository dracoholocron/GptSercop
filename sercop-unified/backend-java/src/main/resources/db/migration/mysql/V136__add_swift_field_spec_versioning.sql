-- ==================================================
-- Migration V136: Add SWIFT Specification Versioning
-- ==================================================
-- This migration adds versioning support to swift_field_config_readmodel
-- to handle SWIFT specification updates (e.g., November 2024, November 2026)
-- without affecting existing functionality.
--
-- Strategy:
-- 1. Add spec_version column to track which SWIFT release each field belongs to
-- 2. Add effective_date and deprecated_date for lifecycle management
-- 3. Add successor_field_code to track field replacements
-- 4. Modify unique constraint to allow same field in different versions
-- 5. Add spec_notes for documenting changes between versions
-- ==================================================

-- Step 1: Add versioning columns
-- Note: Using SET statements to conditionally add columns for MySQL compatibility
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'spec_version');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN spec_version VARCHAR(20) DEFAULT ''2024''', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'effective_date');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN effective_date DATE DEFAULT ''2024-11-17''', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'deprecated_date');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN deprecated_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'successor_field_code');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN successor_field_code VARCHAR(10) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'spec_notes');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN spec_notes TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Drop old unique constraint and create new one with spec_version
-- First, check if the old constraint exists and drop it
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'swift_field_config_readmodel'
    AND CONSTRAINT_NAME = 'uk_field_code_message_type'
);

-- Drop old constraint if exists (using dynamic SQL)
SET @drop_sql = IF(@constraint_exists > 0,
    'ALTER TABLE swift_field_config_readmodel DROP INDEX uk_field_code_message_type',
    'SELECT 1');
PREPARE stmt FROM @drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Also try dropping the newer constraint with language
SET @constraint_exists2 = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'swift_field_config_readmodel'
    AND CONSTRAINT_NAME = 'uk_field_code_message_type_language'
);

SET @drop_sql2 = IF(@constraint_exists2 > 0,
    'ALTER TABLE swift_field_config_readmodel DROP INDEX uk_field_code_message_type_language',
    'SELECT 1');
PREPARE stmt2 FROM @drop_sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Step 3: Create new unique constraint including spec_version (idempotent)
SET @constraint_exists3 = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND CONSTRAINT_NAME = 'uk_field_spec_version');
SET @sql3 = IF(@constraint_exists3 = 0, 'ALTER TABLE swift_field_config_readmodel ADD CONSTRAINT uk_field_spec_version UNIQUE (field_code, message_type, language, spec_version)', 'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Step 4: Add index for efficient version queries (idempotent)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND INDEX_NAME = 'idx_swift_spec_version');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_swift_spec_version ON swift_field_config_readmodel (spec_version)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND INDEX_NAME = 'idx_swift_effective_date');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_swift_effective_date ON swift_field_config_readmodel (effective_date)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND INDEX_NAME = 'idx_swift_deprecated');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_swift_deprecated ON swift_field_config_readmodel (deprecated_date)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Create a view for active fields (current version only)
DROP VIEW IF EXISTS v_swift_field_config_active;
CREATE VIEW v_swift_field_config_active AS
SELECT *
FROM swift_field_config_readmodel
WHERE is_active = true
  AND deprecated_date IS NULL
  AND spec_version = (
      SELECT MAX(spec_version)
      FROM swift_field_config_readmodel s2
      WHERE s2.field_code = swift_field_config_readmodel.field_code
        AND s2.message_type = swift_field_config_readmodel.message_type
        AND s2.language = swift_field_config_readmodel.language
        AND s2.is_active = true
        AND s2.deprecated_date IS NULL
  );

-- Step 6: Create a table to track specification versions
CREATE TABLE IF NOT EXISTS swift_spec_version_readmodel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version_code VARCHAR(20) NOT NULL UNIQUE,
    version_name VARCHAR(100) NOT NULL,
    effective_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    release_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_spec_current (is_current),
    INDEX idx_spec_effective (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registry of SWIFT specification versions';

-- Insert known versions
INSERT INTO swift_spec_version_readmodel (version_code, version_name, effective_date, is_current, release_notes)
VALUES
    ('2024', 'SWIFT Standards Release November 2024', '2024-11-17', TRUE, 'Current production version'),
    ('2026', 'SWIFT Standards Release November 2026', '2026-11-15', FALSE, 'Upcoming version with Applicant/Beneficiary sequence changes')
ON DUPLICATE KEY UPDATE version_name = VALUES(version_name);

-- Step 7: Update existing records to have spec_version = '2024'
UPDATE swift_field_config_readmodel
SET spec_version = '2024',
    effective_date = '2024-11-17'
WHERE spec_version IS NULL OR spec_version = '';

-- ==================================================
-- Documentation: How to Use Versioning
-- ==================================================
--
-- 1. ADDING A NEW SPECIFICATION VERSION:
--    - Insert new fields with spec_version = '2026'
--    - Set effective_date to the SWIFT release date
--    - For deprecated fields in old version, set deprecated_date and successor_field_code
--
-- 2. ACTIVATING A NEW VERSION:
--    - Update swift_spec_version_readmodel: set is_current = FALSE for old, TRUE for new
--    - Use v_swift_field_config_active view for runtime queries (auto-selects latest)
--
-- 3. QUERYING BY VERSION:
--    - SELECT * FROM swift_field_config_readmodel WHERE spec_version = '2026'
--    - Use JOIN with swift_spec_version_readmodel for version metadata
--
-- 4. BACKWARD COMPATIBILITY:
--    - Existing drafts created with 2024 fields will continue to work
--    - New drafts can optionally use 2026 fields once activated
--    - The view v_swift_field_config_active always returns the latest active version
--
-- ==================================================
