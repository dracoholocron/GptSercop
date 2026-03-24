-- =============================================================================
-- V104: Fix Users Admin Menu
-- Ensure the USERS_ADMIN menu item exists and is properly linked
-- =============================================================================

-- First, check if USERS_ADMIN exists, if not create it
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'USERS_ADMIN', id, 'menu.admin.users', 'UserCog', '/admin/users', 31, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'USERS_ADMIN');

-- Ensure the permission link exists
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_USERS'
FROM menu_item m WHERE m.code = 'USERS_ADMIN';

-- Ensure ROLE_ADMIN has VIEW_USERS permission
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_USERS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

-- Also ensure ROLES_PERMISSIONS menu exists
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'ROLES_PERMISSIONS', id, 'menu.admin.roles', 'Key', '/admin/roles', 32, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_ADMIN'
AND NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'ROLES_PERMISSIONS');

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_ROLES'
FROM menu_item m WHERE m.code = 'ROLES_PERMISSIONS';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_ROLES' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';
