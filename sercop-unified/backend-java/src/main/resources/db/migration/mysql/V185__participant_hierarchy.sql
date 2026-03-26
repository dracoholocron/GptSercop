-- =====================================================
-- V185: Participant Hierarchy (Corporation Support)
-- =====================================================
-- Adds self-referential hierarchy to participant_read_model
-- Enables corporation -> company -> branch structure
-- =====================================================

CREATE TABLE IF NOT EXISTS participant_read_model (
    id BIGINT NOT NULL PRIMARY KEY,
    parent_id BIGINT NULL,
    hierarchy_type VARCHAR(30) DEFAULT 'COMPANY',
    hierarchy_level INT DEFAULT 0,
    identification VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    first_names VARCHAR(150) NOT NULL,
    last_names VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    agency VARCHAR(100),
    assigned_executive VARCHAR(150),
    executive_id VARCHAR(50),
    executive_email VARCHAR(150),
    authenticator VARCHAR(100),
    created_at DATETIME,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_participant_identification (identification),
    INDEX idx_participant_type (type),
    INDEX idx_participant_email (email),
    INDEX idx_participant_agency (agency),
    INDEX idx_participant_parent_id (parent_id),
    INDEX idx_participant_hierarchy_type (hierarchy_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1. Add hierarchy columns to participant_read_model
SET @has_participant_parent_id := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'participant_read_model' AND column_name = 'parent_id'
);
SET @sql_participant_parent_id := IF(
    @has_participant_parent_id = 0,
    'ALTER TABLE participant_read_model ADD COLUMN parent_id BIGINT NULL AFTER id',
    'SELECT 1'
);
PREPARE stmt_participant_parent_id FROM @sql_participant_parent_id;
EXECUTE stmt_participant_parent_id;
DEALLOCATE PREPARE stmt_participant_parent_id;

SET @has_participant_hierarchy_type := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'participant_read_model' AND column_name = 'hierarchy_type'
);
SET @sql_participant_hierarchy_type := IF(
    @has_participant_hierarchy_type = 0,
    "ALTER TABLE participant_read_model ADD COLUMN hierarchy_type VARCHAR(30) DEFAULT 'COMPANY' AFTER parent_id",
    'SELECT 1'
);
PREPARE stmt_participant_hierarchy_type FROM @sql_participant_hierarchy_type;
EXECUTE stmt_participant_hierarchy_type;
DEALLOCATE PREPARE stmt_participant_hierarchy_type;

SET @has_participant_hierarchy_level := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'participant_read_model' AND column_name = 'hierarchy_level'
);
SET @sql_participant_hierarchy_level := IF(
    @has_participant_hierarchy_level = 0,
    "ALTER TABLE participant_read_model ADD COLUMN hierarchy_level INT DEFAULT 0 AFTER hierarchy_type",
    'SELECT 1'
);
PREPARE stmt_participant_hierarchy_level FROM @sql_participant_hierarchy_level;
EXECUTE stmt_participant_hierarchy_level;
DEALLOCATE PREPARE stmt_participant_hierarchy_level;

-- 2. Create index for parent lookups
SET @has_idx_participant_parent_id := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'participant_read_model' AND index_name = 'idx_participant_parent_id'
);
SET @sql_idx_participant_parent_id := IF(
    @has_idx_participant_parent_id = 0,
    'CREATE INDEX idx_participant_parent_id ON participant_read_model(parent_id)',
    'SELECT 1'
);
PREPARE stmt_idx_participant_parent_id FROM @sql_idx_participant_parent_id;
EXECUTE stmt_idx_participant_parent_id;
DEALLOCATE PREPARE stmt_idx_participant_parent_id;

SET @has_idx_participant_hierarchy_type := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'participant_read_model' AND index_name = 'idx_participant_hierarchy_type'
);
SET @sql_idx_participant_hierarchy_type := IF(
    @has_idx_participant_hierarchy_type = 0,
    'CREATE INDEX idx_participant_hierarchy_type ON participant_read_model(hierarchy_type)',
    'SELECT 1'
);
PREPARE stmt_idx_participant_hierarchy_type FROM @sql_idx_participant_hierarchy_type;
EXECUTE stmt_idx_participant_hierarchy_type;
DEALLOCATE PREPARE stmt_idx_participant_hierarchy_type;

-- 3. Add foreign key constraint (self-referential)
SET @has_fk_participant_parent := (
    SELECT COUNT(*)
    FROM information_schema.referential_constraints
    WHERE constraint_schema = DATABASE()
      AND table_name = 'participant_read_model'
      AND constraint_name = 'fk_participant_parent'
);
SET @sql_fk_participant_parent := IF(
    @has_fk_participant_parent = 0,
    'ALTER TABLE participant_read_model ADD CONSTRAINT fk_participant_parent FOREIGN KEY (parent_id) REFERENCES participant_read_model(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_fk_participant_parent FROM @sql_fk_participant_parent;
EXECUTE stmt_fk_participant_parent;
DEALLOCATE PREPARE stmt_fk_participant_parent;

-- 4. Update existing participants as COMPANY (default)
UPDATE participant_read_model
SET hierarchy_type = 'COMPANY',
    hierarchy_level = 0
WHERE parent_id IS NULL;

-- 5. Add column to user_read_model to track selected company for corporation users
SET @has_selected_participant_id := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'user_read_model' AND column_name = 'selected_participant_id'
);
SET @sql_selected_participant_id := IF(
    @has_selected_participant_id = 0,
    'ALTER TABLE user_read_model ADD COLUMN selected_participant_id BIGINT NULL AFTER cliente_id',
    'SELECT 1'
);
PREPARE stmt_selected_participant_id FROM @sql_selected_participant_id;
EXECUTE stmt_selected_participant_id;
DEALLOCATE PREPARE stmt_selected_participant_id;

-- 6. Add new permissions for corporation features
INSERT INTO permission_read_model (code, name, module, created_at) VALUES
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

-- =====================================================
-- HIERARCHY_TYPE values:
-- - CORPORATION: Top-level holding/group (can have children)
-- - COMPANY: Regular company (can be child of corporation, can have branches)
-- - BRANCH: Branch/office of a company (leaf node)
-- =====================================================

-- =====================================================
-- Example data structure after migration:
--
-- ID   | parent_id | hierarchy_type | nombres
-- -----|-----------|----------------|----------------------
-- 100  | NULL      | CORPORATION    | Grupo Industrial ACME
-- 101  | 100       | COMPANY        | ACME Import S.A.
-- 102  | 100       | COMPANY        | ACME Export S.A.
-- 103  | 101       | BRANCH         | ACME Import - Guayaquil
-- 104  | 101       | BRANCH         | ACME Import - Quito
-- =====================================================
