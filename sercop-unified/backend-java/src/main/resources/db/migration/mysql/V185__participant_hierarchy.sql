-- =====================================================
-- V185: Participant Hierarchy (Corporation Support)
-- =====================================================
-- Adds self-referential hierarchy to participant_read_model
-- Enables corporation -> company -> branch structure
-- =====================================================

-- 1. Add hierarchy columns to participant_read_model
ALTER TABLE participant_read_model
ADD COLUMN parent_id BIGINT NULL AFTER id,
ADD COLUMN hierarchy_type VARCHAR(30) DEFAULT 'COMPANY' AFTER parent_id,
ADD COLUMN hierarchy_level INT DEFAULT 0 AFTER hierarchy_type;

-- 2. Create index for parent lookups
CREATE INDEX idx_participant_parent_id ON participant_read_model(parent_id);
CREATE INDEX idx_participant_hierarchy_type ON participant_read_model(hierarchy_type);

-- 3. Add foreign key constraint (self-referential)
ALTER TABLE participant_read_model
ADD CONSTRAINT fk_participant_parent
FOREIGN KEY (parent_id) REFERENCES participant_read_model(id)
ON DELETE SET NULL;

-- 4. Update existing participants as COMPANY (default)
UPDATE participant_read_model
SET hierarchy_type = 'COMPANY',
    hierarchy_level = 0
WHERE parent_id IS NULL;

-- 5. Add column to user_read_model to track selected company for corporation users
ALTER TABLE user_read_model
ADD COLUMN selected_participant_id BIGINT NULL AFTER cliente_id;

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
