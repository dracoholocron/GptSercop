-- =============================================================================
-- V105: Fix Admin Menu Paths
-- Update menu paths to match existing routes in frontend
-- =============================================================================

-- Fix USERS_ADMIN path (from /admin/users to /users)
UPDATE menu_item SET path = '/users' WHERE code = 'USERS_ADMIN';

-- Fix ROLES_PERMISSIONS path (from /admin/roles to /permissions)
UPDATE menu_item SET path = '/permissions' WHERE code = 'ROLES_PERMISSIONS';

-- Fix SECURITY_MONITORING path (from /admin/security to /security)
UPDATE menu_item SET path = '/security' WHERE code = 'SECURITY_MONITORING';

-- Fix BRAND_TEMPLATES path (should be /catalogs/brand-templates)
UPDATE menu_item SET path = '/catalogs/brand-templates' WHERE code = 'BRAND_TEMPLATES';

-- Remove duplicate menu items if any (keep only one USERS_ADMIN)
DELETE m1 FROM menu_item m1
INNER JOIN menu_item m2 
WHERE m1.id > m2.id AND m1.code = m2.code;

-- Ensure MENU_CONFIG points to correct path
UPDATE menu_item SET path = '/admin/menu' WHERE code = 'MENU_CONFIG';

-- Ensure API_MONITORING points to correct path
UPDATE menu_item SET path = '/admin/api-monitoring' WHERE code = 'API_MONITORING';
