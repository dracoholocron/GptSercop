-- =============================================================================
-- V107: Force Remove Duplicate Menu Items
-- =============================================================================

-- Get the IDs of duplicate USERS_ADMIN items (all except the minimum ID)
SET @min_users_id = (SELECT MIN(id) FROM menu_item WHERE code = 'USERS_ADMIN');

-- Delete permissions for duplicates
DELETE FROM menu_item_permission WHERE menu_item_id IN (
    SELECT id FROM menu_item WHERE code = 'USERS_ADMIN' AND id != @min_users_id
);

-- Delete the duplicate menu items
DELETE FROM menu_item WHERE code = 'USERS_ADMIN' AND id != @min_users_id;

-- Same for ROLES_PERMISSIONS
SET @min_roles_id = (SELECT MIN(id) FROM menu_item WHERE code = 'ROLES_PERMISSIONS');

DELETE FROM menu_item_permission WHERE menu_item_id IN (
    SELECT id FROM menu_item WHERE code = 'ROLES_PERMISSIONS' AND id != @min_roles_id
);

DELETE FROM menu_item WHERE code = 'ROLES_PERMISSIONS' AND id != @min_roles_id;
