-- =============================================================================
-- Migration V179: Client Portal - Menu Items Configuration
-- Creates menu structure for client portal and backoffice request processing
-- All configurations are database-driven, no hardcoded values
-- =============================================================================

-- ============================================
-- 1. CLIENT PORTAL SECTION (For Client Users)
-- ============================================

-- Main section for client portal
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_CLIENT_PORTAL', NULL, 'menu.clientPortal.section', 'Briefcase', NULL, 50, TRUE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key);

SET @client_section_id = (SELECT id FROM menu_item WHERE code = 'SECTION_CLIENT_PORTAL');

-- Client Dashboard
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_DASHBOARD', @client_section_id, 'menu.clientPortal.dashboard', 'Home', '/client/dashboard', 51, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- New Request
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_NEW_REQUEST', @client_section_id, 'menu.clientPortal.newRequest', 'PlusCircle', '/client/requests/new', 52, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- My Requests
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_MY_REQUESTS', @client_section_id, 'menu.clientPortal.myRequests', 'FileText', '/client/requests', 53, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- My Operations
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_MY_OPERATIONS', @client_section_id, 'menu.clientPortal.myOperations', 'Briefcase', '/client/operations', 54, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- My Documents
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_MY_DOCUMENTS', @client_section_id, 'menu.clientPortal.myDocuments', 'File', '/client/documents', 55, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- Reports & Analytics
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_REPORTS', @client_section_id, 'menu.clientPortal.reports', 'BarChart2', '/client/reports', 56, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- Profile Settings
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_PROFILE', @client_section_id, 'menu.clientPortal.profile', 'User', '/client/profile', 57, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- Company Users (only for Client Admin)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_COMPANY_USERS', @client_section_id, 'menu.clientPortal.companyUsers', 'Users', '/client/users', 58, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- ============================================
-- 2. BACKOFFICE SECTION FOR CLIENT REQUESTS
-- ============================================

-- Section for backoffice processing of client requests
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_CLIENT_REQUESTS', NULL, 'menu.clientRequests.section', 'Inbox', NULL, 15, TRUE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key);

SET @backoffice_section_id = (SELECT id FROM menu_item WHERE code = 'SECTION_CLIENT_REQUESTS');

-- Request Inbox (all pending requests)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_REQUEST_INBOX', @backoffice_section_id, 'menu.clientRequests.inbox', 'Inbox', '/operations/client-requests', 16, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- My Assigned Requests
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_REQUEST_MY_ASSIGNED', @backoffice_section_id, 'menu.clientRequests.myAssigned', 'UserCheck', '/operations/client-requests/assigned', 17, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- Pending Approval
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_REQUEST_PENDING_APPROVAL', @backoffice_section_id, 'menu.clientRequests.pendingApproval', 'Clock', '/operations/client-requests/pending-approval', 18, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- SLA Dashboard
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_REQUEST_SLA_DASHBOARD', @backoffice_section_id, 'menu.clientRequests.slaDashboard', 'AlertTriangle', '/operations/client-requests/sla', 19, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- ============================================
-- 3. ADMIN SECTION FOR CLIENT PORTAL CONFIG
-- ============================================

-- Get admin section
SET @admin_section_id = (SELECT id FROM menu_item WHERE code = 'SECTION_ADMIN');

-- Client Portal Configuration
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_PORTAL_CONFIG', @admin_section_id, 'menu.admin.clientPortalConfig', 'Settings', '/admin/client-portal', 40, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- Client Users Management
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_USERS_ADMIN', @admin_section_id, 'menu.admin.clientUsers', 'Users', '/admin/client-users', 41, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- Assignment Queues
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_QUEUES_ADMIN', @admin_section_id, 'menu.admin.assignmentQueues', 'GitBranch', '/admin/assignment-queues', 42, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- Approval Rules
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('CLIENT_APPROVAL_RULES', @admin_section_id, 'menu.admin.approvalRules', 'CheckSquare', '/admin/approval-rules', 43, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- ============================================
-- 4. MENU PERMISSIONS - Client Portal Items
-- ============================================

-- Client Dashboard
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_DASHBOARD_VIEW' FROM menu_item WHERE code = 'CLIENT_DASHBOARD';

-- New Request
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_REQUEST_CREATE' FROM menu_item WHERE code = 'CLIENT_NEW_REQUEST';

-- My Requests
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_REQUEST_VIEW' FROM menu_item WHERE code = 'CLIENT_MY_REQUESTS';

-- My Operations
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_OPERATION_VIEW' FROM menu_item WHERE code = 'CLIENT_MY_OPERATIONS';

-- My Documents
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_DOCUMENT_VIEW' FROM menu_item WHERE code = 'CLIENT_MY_DOCUMENTS';

-- Reports
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_REPORTS_VIEW' FROM menu_item WHERE code = 'CLIENT_REPORTS';

-- Profile
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_PROFILE_VIEW' FROM menu_item WHERE code = 'CLIENT_PROFILE';

-- Company Users (Admin only)
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_USER_VIEW' FROM menu_item WHERE code = 'CLIENT_COMPANY_USERS';

-- ============================================
-- 5. MENU PERMISSIONS - Backoffice Items
-- ============================================

-- Request Inbox
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_REQUEST_VIEW_ALL' FROM menu_item WHERE code = 'CLIENT_REQUEST_INBOX';

-- My Assigned
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_REQUEST_PROCESS' FROM menu_item WHERE code = 'CLIENT_REQUEST_MY_ASSIGNED';

-- Pending Approval
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_REQUEST_APPROVE' FROM menu_item WHERE code = 'CLIENT_REQUEST_PENDING_APPROVAL';

-- SLA Dashboard
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_REQUEST_VIEW_ALL' FROM menu_item WHERE code = 'CLIENT_REQUEST_SLA_DASHBOARD';

-- ============================================
-- 6. MENU PERMISSIONS - Admin Items
-- ============================================

-- Client Portal Config
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_CONFIG_MANAGE' FROM menu_item WHERE code = 'CLIENT_PORTAL_CONFIG';

-- Client Users Admin
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_USER_CREATE' FROM menu_item WHERE code = 'CLIENT_USERS_ADMIN';

-- Assignment Queues
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_QUEUE_MANAGE' FROM menu_item WHERE code = 'CLIENT_QUEUES_ADMIN';

-- Approval Rules
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CLIENT_CONFIG_MANAGE' FROM menu_item WHERE code = 'CLIENT_APPROVAL_RULES';

-- ============================================
-- 7. Menu Item User Type Restrictions
-- ============================================

-- Add user_type column to menu_item if not exists
SET @dbname = DATABASE();
SET @tablename = 'menu_item';
SET @columnname = 'user_type_restriction';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(20) NULL COMMENT ''INTERNAL, CLIENT, or NULL for all''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create index for user_type filtering (using prepared statement for MySQL compatibility)
SET @idx_name = 'idx_menu_user_type';
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_item' AND INDEX_NAME = @idx_name);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_menu_user_type ON menu_item(user_type_restriction)', 'SELECT 1');
PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- Update client portal items to be CLIENT only
UPDATE menu_item SET user_type_restriction = 'CLIENT'
WHERE code IN (
    'SECTION_CLIENT_PORTAL', 'CLIENT_DASHBOARD', 'CLIENT_NEW_REQUEST',
    'CLIENT_MY_REQUESTS', 'CLIENT_MY_OPERATIONS', 'CLIENT_MY_DOCUMENTS',
    'CLIENT_REPORTS', 'CLIENT_PROFILE', 'CLIENT_COMPANY_USERS'
);

-- Update backoffice and admin items to be INTERNAL only
UPDATE menu_item SET user_type_restriction = 'INTERNAL'
WHERE code IN (
    'SECTION_CLIENT_REQUESTS', 'CLIENT_REQUEST_INBOX', 'CLIENT_REQUEST_MY_ASSIGNED',
    'CLIENT_REQUEST_PENDING_APPROVAL', 'CLIENT_REQUEST_SLA_DASHBOARD',
    'CLIENT_PORTAL_CONFIG', 'CLIENT_USERS_ADMIN', 'CLIENT_QUEUES_ADMIN', 'CLIENT_APPROVAL_RULES'
);

-- ============================================
-- 8. Menu Configuration Table (for dynamic menu building)
-- ============================================

CREATE TABLE IF NOT EXISTS menu_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    config_key VARCHAR(50) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(200) NULL,

    -- Scope
    user_type VARCHAR(20) NULL COMMENT 'NULL for all, or INTERNAL/CLIENT',
    tenant_id CHAR(36) NULL COMMENT 'NULL for global',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_config_key_type_tenant (config_key, user_type, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dynamic menu configuration';

-- Seed menu configurations
INSERT INTO menu_config (config_key, config_value, description, user_type, is_active)
VALUES
-- Client portal landing page
('landing_page', '/client/dashboard', 'Default landing page for client users', 'CLIENT', TRUE),
('landing_page', '/dashboard', 'Default landing page for internal users', 'INTERNAL', TRUE),

-- Menu collapse preferences
('sidebar_collapsed_default', 'false', 'Default sidebar collapsed state', NULL, TRUE),

-- Show section counts
('show_section_counts', 'true', 'Show item counts in section headers', NULL, TRUE),

-- Client portal specific
('show_welcome_banner', 'true', 'Show welcome banner on client dashboard', 'CLIENT', TRUE),
('enable_quick_actions', 'true', 'Show quick action buttons', 'CLIENT', TRUE)

ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
