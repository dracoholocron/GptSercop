-- =============================================================================
-- Migration V178: Client Portal - Roles and Permissions
-- Creates roles and permissions for client portal users and backoffice processors
-- All configurations are database-driven, no hardcoded values
-- =============================================================================

-- ============================================
-- 1. Client Portal Permissions (Module: CLIENT_PORTAL)
-- ============================================

INSERT INTO permission_read_model (code, name, description, module) VALUES
-- Client User Permissions (Portal)
('CLIENT_PROFILE_VIEW', 'View Own Profile', 'Client can view their own profile', 'CLIENT_PORTAL'),
('CLIENT_PROFILE_EDIT', 'Edit Own Profile', 'Client can edit their own profile', 'CLIENT_PORTAL'),
('CLIENT_REQUEST_CREATE', 'Create Request', 'Client can create new requests', 'CLIENT_PORTAL'),
('CLIENT_REQUEST_VIEW', 'View Own Requests', 'Client can view their own requests', 'CLIENT_PORTAL'),
('CLIENT_REQUEST_EDIT', 'Edit Draft Requests', 'Client can edit draft requests', 'CLIENT_PORTAL'),
('CLIENT_REQUEST_CANCEL', 'Cancel Requests', 'Client can cancel pending requests', 'CLIENT_PORTAL'),
('CLIENT_REQUEST_SUBMIT', 'Submit Requests', 'Client can submit requests for review', 'CLIENT_PORTAL'),
('CLIENT_DOCUMENT_UPLOAD', 'Upload Documents', 'Client can upload documents', 'CLIENT_PORTAL'),
('CLIENT_DOCUMENT_VIEW', 'View Own Documents', 'Client can view their own documents', 'CLIENT_PORTAL'),
('CLIENT_DOCUMENT_DOWNLOAD', 'Download Documents', 'Client can download their documents', 'CLIENT_PORTAL'),
('CLIENT_OPERATION_VIEW', 'View Own Operations', 'Client can view their approved operations', 'CLIENT_PORTAL'),
('CLIENT_DASHBOARD_VIEW', 'View Dashboard', 'Client can view their dashboard', 'CLIENT_PORTAL'),
('CLIENT_REPORTS_VIEW', 'View Reports', 'Client can view their reports', 'CLIENT_PORTAL'),
('CLIENT_REPORTS_EXPORT', 'Export Reports', 'Client can export their reports', 'CLIENT_PORTAL'),
('CLIENT_COMMENT_CREATE', 'Add Comments', 'Client can add comments to requests', 'CLIENT_PORTAL'),
('CLIENT_COMMENT_VIEW', 'View Comments', 'Client can view comments on requests', 'CLIENT_PORTAL'),
('CLIENT_NOTIFICATION_VIEW', 'View Notifications', 'Client can view notifications', 'CLIENT_PORTAL'),

-- Backoffice Permissions for Client Requests
('CLIENT_REQUEST_PROCESS', 'Process Client Requests', 'Can process client requests', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_ASSIGN', 'Assign Client Requests', 'Can assign requests to processors', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_REASSIGN', 'Reassign Client Requests', 'Can reassign requests to different processors', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_APPROVE', 'Approve Client Requests', 'Can approve client requests', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_REJECT', 'Reject Client Requests', 'Can reject client requests', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_VIEW_ALL', 'View All Client Requests', 'Can view all client requests', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_DOCS_REQUEST', 'Request Documents', 'Can request additional documents from clients', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_COMMENT_INTERNAL', 'Add Internal Comments', 'Can add internal-only comments', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_PRIORITY_SET', 'Set Request Priority', 'Can set request priority', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_SLA_EXTEND', 'Extend SLA', 'Can extend request SLA deadline', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REQUEST_ESCALATE', 'Escalate Requests', 'Can escalate requests to supervisors', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_QUEUE_MANAGE', 'Manage Assignment Queues', 'Can manage request assignment queues', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_USER_CREATE', 'Create Client Users', 'Can create new client portal users', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_USER_EDIT', 'Edit Client Users', 'Can edit client portal users', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_USER_VIEW', 'View Client Users', 'Can view client portal users', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_USER_DISABLE', 'Disable Client Users', 'Can disable client portal users', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_REPORTS_ALL', 'View All Client Reports', 'Can view reports for all clients', 'CLIENT_PORTAL_BACKOFFICE'),
('CLIENT_CONFIG_MANAGE', 'Manage Client Portal Config', 'Can manage client portal configuration', 'CLIENT_PORTAL_BACKOFFICE')

ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- ============================================
-- 2. Client Portal Roles
-- ============================================

-- Client Portal User Role
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CLIENT_PORTAL_USER', 'Client portal user with access to create and view requests');

SET @client_portal_user_role = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT_PORTAL_USER');

-- Assign client permissions to ROLE_CLIENT_PORTAL_USER
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT @client_portal_user_role, code
FROM permission_read_model
WHERE code IN (
    'CLIENT_PROFILE_VIEW', 'CLIENT_PROFILE_EDIT',
    'CLIENT_REQUEST_CREATE', 'CLIENT_REQUEST_VIEW', 'CLIENT_REQUEST_EDIT',
    'CLIENT_REQUEST_CANCEL', 'CLIENT_REQUEST_SUBMIT',
    'CLIENT_DOCUMENT_UPLOAD', 'CLIENT_DOCUMENT_VIEW', 'CLIENT_DOCUMENT_DOWNLOAD',
    'CLIENT_OPERATION_VIEW', 'CLIENT_DASHBOARD_VIEW',
    'CLIENT_REPORTS_VIEW', 'CLIENT_REPORTS_EXPORT',
    'CLIENT_COMMENT_CREATE', 'CLIENT_COMMENT_VIEW',
    'CLIENT_NOTIFICATION_VIEW'
)
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Client Admin Role (can manage other client users)
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CLIENT_ADMIN', 'Client admin who can manage other users for their company');

SET @client_admin_role = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT_ADMIN');

-- Assign all client permissions plus admin capabilities
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT @client_admin_role, code
FROM permission_read_model
WHERE code LIKE 'CLIENT_%' AND module = 'CLIENT_PORTAL'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ============================================
-- 3. Backoffice Roles for Client Request Processing
-- ============================================

-- Request Processor Role
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CLIENT_REQUEST_PROCESSOR', 'Processes and reviews client requests');

SET @processor_role = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT_REQUEST_PROCESSOR');

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT @processor_role, code
FROM permission_read_model
WHERE code IN (
    'CLIENT_REQUEST_PROCESS', 'CLIENT_REQUEST_VIEW_ALL',
    'CLIENT_REQUEST_DOCS_REQUEST', 'CLIENT_REQUEST_COMMENT_INTERNAL',
    'CLIENT_COMMENT_VIEW', 'CLIENT_USER_VIEW',
    'CLIENT_DOCUMENT_VIEW'
)
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Request Supervisor Role
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CLIENT_REQUEST_SUPERVISOR', 'Supervises client request processing and handles escalations');

SET @supervisor_role = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT_REQUEST_SUPERVISOR');

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT @supervisor_role, code
FROM permission_read_model
WHERE code IN (
    'CLIENT_REQUEST_PROCESS', 'CLIENT_REQUEST_VIEW_ALL',
    'CLIENT_REQUEST_ASSIGN', 'CLIENT_REQUEST_REASSIGN',
    'CLIENT_REQUEST_DOCS_REQUEST', 'CLIENT_REQUEST_COMMENT_INTERNAL',
    'CLIENT_REQUEST_PRIORITY_SET', 'CLIENT_REQUEST_SLA_EXTEND',
    'CLIENT_COMMENT_VIEW', 'CLIENT_USER_VIEW',
    'CLIENT_DOCUMENT_VIEW', 'CLIENT_REPORTS_ALL'
)
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Request Approver Role
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CLIENT_REQUEST_APPROVER', 'Approves or rejects client requests');

SET @approver_role = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT_REQUEST_APPROVER');

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT @approver_role, code
FROM permission_read_model
WHERE code IN (
    'CLIENT_REQUEST_VIEW_ALL', 'CLIENT_REQUEST_APPROVE', 'CLIENT_REQUEST_REJECT',
    'CLIENT_REQUEST_COMMENT_INTERNAL', 'CLIENT_COMMENT_VIEW',
    'CLIENT_DOCUMENT_VIEW', 'CLIENT_REPORTS_ALL'
)
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Request Manager Role (full access)
INSERT IGNORE INTO role_read_model (name, description)
VALUES ('ROLE_CLIENT_REQUEST_MANAGER', 'Full management access to client requests and configuration');

SET @manager_role = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT_REQUEST_MANAGER');

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT @manager_role, code
FROM permission_read_model
WHERE module IN ('CLIENT_PORTAL', 'CLIENT_PORTAL_BACKOFFICE')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ============================================
-- 4. Update ROLE_ADMIN with all new permissions
-- ============================================

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN'
  AND p.module IN ('CLIENT_PORTAL', 'CLIENT_PORTAL_BACKOFFICE')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ============================================
-- 5. Role Configuration Table (for UI display)
-- ============================================

CREATE TABLE IF NOT EXISTS role_config (
    role_name VARCHAR(50) PRIMARY KEY,
    display_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key for display name',
    description_key VARCHAR(200) NULL COMMENT 'i18n key for description',

    -- UI configuration
    icon VARCHAR(50) DEFAULT 'FiUser',
    color VARCHAR(30) DEFAULT 'gray',
    display_order INT DEFAULT 0,

    -- Role type
    role_type VARCHAR(30) NOT NULL COMMENT 'SYSTEM, BACKOFFICE, CLIENT',
    is_assignable BOOLEAN DEFAULT TRUE COMMENT 'Can be assigned to users',
    is_default_for_type BOOLEAN DEFAULT FALSE COMMENT 'Default role for new users of this type',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='UI configuration for roles';

-- Seed role configurations
INSERT INTO role_config (
    role_name, display_name_key, description_key, icon, color, display_order,
    role_type, is_assignable, is_default_for_type, is_active
) VALUES
-- System roles
('ROLE_ADMIN', 'role.admin.name', 'role.admin.desc', 'FiShield', 'red', 1, 'SYSTEM', TRUE, FALSE, TRUE),
('ROLE_USER', 'role.user.name', 'role.user.desc', 'FiUser', 'gray', 2, 'SYSTEM', TRUE, TRUE, TRUE),

-- Backoffice roles
('ROLE_OPERATOR', 'role.operator.name', 'role.operator.desc', 'FiEdit', 'blue', 10, 'BACKOFFICE', TRUE, FALSE, TRUE),
('ROLE_MANAGER', 'role.manager.name', 'role.manager.desc', 'FiUserCheck', 'green', 11, 'BACKOFFICE', TRUE, FALSE, TRUE),
('ROLE_CLIENT_REQUEST_PROCESSOR', 'role.clientRequestProcessor.name', 'role.clientRequestProcessor.desc', 'FiClipboard', 'blue', 20, 'BACKOFFICE', TRUE, FALSE, TRUE),
('ROLE_CLIENT_REQUEST_SUPERVISOR', 'role.clientRequestSupervisor.name', 'role.clientRequestSupervisor.desc', 'FiEye', 'yellow', 21, 'BACKOFFICE', TRUE, FALSE, TRUE),
('ROLE_CLIENT_REQUEST_APPROVER', 'role.clientRequestApprover.name', 'role.clientRequestApprover.desc', 'FiCheckCircle', 'green', 22, 'BACKOFFICE', TRUE, FALSE, TRUE),
('ROLE_CLIENT_REQUEST_MANAGER', 'role.clientRequestManager.name', 'role.clientRequestManager.desc', 'FiBriefcase', 'purple', 23, 'BACKOFFICE', TRUE, FALSE, TRUE),

-- Client roles
('ROLE_CLIENT_PORTAL_USER', 'role.clientPortalUser.name', 'role.clientPortalUser.desc', 'FiUser', 'blue', 30, 'CLIENT', TRUE, TRUE, TRUE),
('ROLE_CLIENT_ADMIN', 'role.clientAdmin.name', 'role.clientAdmin.desc', 'FiUsers', 'purple', 31, 'CLIENT', TRUE, FALSE, TRUE),
('ROLE_CLIENT', 'role.client.name', 'role.client.desc', 'FiUser', 'gray', 32, 'CLIENT', TRUE, FALSE, TRUE)

ON DUPLICATE KEY UPDATE
    display_name_key = VALUES(display_name_key),
    description_key = VALUES(description_key),
    icon = VALUES(icon),
    color = VALUES(color);

-- ============================================
-- 6. Permission Groups for UI Display
-- ============================================

CREATE TABLE IF NOT EXISTS permission_group_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    group_code VARCHAR(50) NOT NULL,
    group_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key',

    -- UI
    icon VARCHAR(50) DEFAULT 'FiLock',
    color VARCHAR(30) DEFAULT 'gray',
    display_order INT DEFAULT 0,

    -- Permissions in this group
    permission_codes JSON NOT NULL COMMENT 'Array of permission codes',

    -- Role type filter
    applicable_role_types JSON COMMENT 'Which role types can see this group',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_group_code (group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Permission groupings for UI';

-- Seed permission groups
INSERT INTO permission_group_config (
    group_code, group_name_key, description_key, icon, color, display_order,
    permission_codes, applicable_role_types, is_active
) VALUES
('GROUP_CLIENT_PROFILE', 'permGroup.clientProfile.name', 'permGroup.clientProfile.desc', 'FiUser', 'blue', 1,
 '["CLIENT_PROFILE_VIEW", "CLIENT_PROFILE_EDIT"]', '["CLIENT"]', TRUE),

('GROUP_CLIENT_REQUESTS', 'permGroup.clientRequests.name', 'permGroup.clientRequests.desc', 'FiFileText', 'green', 2,
 '["CLIENT_REQUEST_CREATE", "CLIENT_REQUEST_VIEW", "CLIENT_REQUEST_EDIT", "CLIENT_REQUEST_CANCEL", "CLIENT_REQUEST_SUBMIT"]', '["CLIENT"]', TRUE),

('GROUP_CLIENT_DOCUMENTS', 'permGroup.clientDocuments.name', 'permGroup.clientDocuments.desc', 'FiFile', 'yellow', 3,
 '["CLIENT_DOCUMENT_UPLOAD", "CLIENT_DOCUMENT_VIEW", "CLIENT_DOCUMENT_DOWNLOAD"]', '["CLIENT"]', TRUE),

('GROUP_CLIENT_OPERATIONS', 'permGroup.clientOperations.name', 'permGroup.clientOperations.desc', 'FiBriefcase', 'purple', 4,
 '["CLIENT_OPERATION_VIEW", "CLIENT_DASHBOARD_VIEW", "CLIENT_REPORTS_VIEW", "CLIENT_REPORTS_EXPORT"]', '["CLIENT"]', TRUE),

('GROUP_BACKOFFICE_REQUESTS', 'permGroup.backofficeRequests.name', 'permGroup.backofficeRequests.desc', 'FiClipboard', 'blue', 10,
 '["CLIENT_REQUEST_PROCESS", "CLIENT_REQUEST_VIEW_ALL", "CLIENT_REQUEST_DOCS_REQUEST", "CLIENT_REQUEST_COMMENT_INTERNAL"]', '["BACKOFFICE"]', TRUE),

('GROUP_BACKOFFICE_APPROVALS', 'permGroup.backofficeApprovals.name', 'permGroup.backofficeApprovals.desc', 'FiCheckSquare', 'green', 11,
 '["CLIENT_REQUEST_APPROVE", "CLIENT_REQUEST_REJECT", "CLIENT_REQUEST_ASSIGN", "CLIENT_REQUEST_REASSIGN"]', '["BACKOFFICE"]', TRUE),

('GROUP_BACKOFFICE_MANAGEMENT', 'permGroup.backofficeManagement.name', 'permGroup.backofficeManagement.desc', 'FiSettings', 'purple', 12,
 '["CLIENT_REQUEST_PRIORITY_SET", "CLIENT_REQUEST_SLA_EXTEND", "CLIENT_REQUEST_ESCALATE", "CLIENT_QUEUE_MANAGE"]', '["BACKOFFICE"]', TRUE),

('GROUP_BACKOFFICE_USERS', 'permGroup.backofficeUsers.name', 'permGroup.backofficeUsers.desc', 'FiUsers', 'red', 13,
 '["CLIENT_USER_CREATE", "CLIENT_USER_EDIT", "CLIENT_USER_VIEW", "CLIENT_USER_DISABLE", "CLIENT_CONFIG_MANAGE"]', '["BACKOFFICE"]', TRUE);
