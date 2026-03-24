-- =============================================================================
-- V106: Remove Duplicate Menu Items
-- =============================================================================

-- Find and keep only the first USERS_ADMIN entry (lowest ID)
-- Delete any duplicates with higher IDs
DELETE FROM menu_item_permission 
WHERE menu_item_id IN (
    SELECT id FROM (
        SELECT m1.id
        FROM menu_item m1
        WHERE m1.code = 'USERS_ADMIN'
        AND m1.id > (SELECT MIN(m2.id) FROM menu_item m2 WHERE m2.code = 'USERS_ADMIN')
    ) AS subquery
);

DELETE FROM menu_item 
WHERE code = 'USERS_ADMIN' 
AND id > (SELECT min_id FROM (SELECT MIN(id) as min_id FROM menu_item WHERE code = 'USERS_ADMIN') AS subq);

-- Also check for any other duplicates
DELETE FROM menu_item_permission 
WHERE menu_item_id IN (
    SELECT id FROM (
        SELECT m1.id
        FROM menu_item m1
        WHERE m1.code = 'ROLES_PERMISSIONS'
        AND m1.id > (SELECT MIN(m2.id) FROM menu_item m2 WHERE m2.code = 'ROLES_PERMISSIONS')
    ) AS subquery
);

DELETE FROM menu_item 
WHERE code = 'ROLES_PERMISSIONS' 
AND id > (SELECT min_id FROM (SELECT MIN(id) as min_id FROM menu_item WHERE code = 'ROLES_PERMISSIONS') AS subq);

-- Update label_key for ROLES_PERMISSIONS to use proper translation key
UPDATE menu_item SET label_key = 'menu.admin.roles' WHERE code = 'ROLES_PERMISSIONS';
