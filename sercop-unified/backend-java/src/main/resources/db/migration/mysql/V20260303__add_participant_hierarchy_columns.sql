-- =====================================================
-- V20260302_9: Add Participant Hierarchy Columns
-- =====================================================
-- Re-applies V185 hierarchy changes that were skipped
-- because V185 version was lower than current schema version.
-- Uses IF NOT EXISTS / conditional checks for idempotency.
-- =====================================================

-- 1. Add hierarchy columns to participant_read_model (if not exist)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participant_read_model' AND COLUMN_NAME = 'parent_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE participant_read_model ADD COLUMN parent_id BIGINT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participant_read_model' AND COLUMN_NAME = 'hierarchy_type');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE participant_read_model ADD COLUMN hierarchy_type VARCHAR(30) DEFAULT ''COMPANY''', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participant_read_model' AND COLUMN_NAME = 'hierarchy_level');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE participant_read_model ADD COLUMN hierarchy_level INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Create indexes (if not exist)
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participant_read_model' AND INDEX_NAME = 'idx_participant_parent_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_participant_parent_id ON participant_read_model(parent_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participant_read_model' AND INDEX_NAME = 'idx_participant_hierarchy_type');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_participant_hierarchy_type ON participant_read_model(hierarchy_type)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add foreign key constraint (if not exist)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participant_read_model' AND CONSTRAINT_NAME = 'fk_participant_parent');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE participant_read_model ADD CONSTRAINT fk_participant_parent FOREIGN KEY (parent_id) REFERENCES participant_read_model(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Update existing participants as COMPANY (default)
UPDATE participant_read_model
SET hierarchy_type = 'COMPANY',
    hierarchy_level = 0
WHERE hierarchy_type IS NULL;

-- 5. Add column to user_read_model (if not exist)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_read_model' AND COLUMN_NAME = 'selected_participant_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE user_read_model ADD COLUMN selected_participant_id BIGINT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Add new permissions for corporation features (idempotent)
INSERT IGNORE INTO permission_read_model (code, name, module, created_at) VALUES
('CLIENT_VIEW_CORPORATION', 'View Corporation Data', 'CLIENT_PORTAL', NOW()),
('CLIENT_SWITCH_COMPANY', 'Switch Between Companies', 'CLIENT_PORTAL', NOW()),
('CLIENT_VIEW_ALL_COMPANIES', 'View All Company Operations', 'CLIENT_PORTAL', NOW()),
('CORPORATION_MANAGE', 'Manage Corporation Structure', 'ADMINISTRATION', NOW()),
('CORPORATION_ADD_MEMBER', 'Add Company to Corporation', 'ADMINISTRATION', NOW()),
('CORPORATION_REMOVE_MEMBER', 'Remove Company from Corporation', 'ADMINISTRATION', NOW());

-- 7. Assign corporation permissions to CLIENT role
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CLIENT_VIEW_CORPORATION'
FROM role_read_model r WHERE r.name = 'ROLE_CLIENT'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CLIENT_SWITCH_COMPANY'
FROM role_read_model r WHERE r.name = 'ROLE_CLIENT'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CLIENT_VIEW_ALL_COMPANIES'
FROM role_read_model r WHERE r.name = 'ROLE_CLIENT'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- 8. Assign corporation management permissions to ADMIN role
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CORPORATION_MANAGE'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CORPORATION_ADD_MEMBER'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CORPORATION_REMOVE_MEMBER'
FROM role_read_model r WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE role_id = role_id;
