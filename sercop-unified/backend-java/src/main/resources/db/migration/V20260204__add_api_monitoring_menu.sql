-- =============================================================================
-- Migration: Add API Monitoring menu item for administrators
-- Description: Adds menu entry for API access monitoring dashboard
-- =============================================================================

-- Insert the new menu item under Administration section
INSERT INTO menu_item (
    code,
    parent_id,
    label_key,
    icon,
    path,
    display_order,
    is_section,
    is_active,
    user_type_restriction,
    created_at,
    updated_at,
    created_by
)
SELECT
    'API_MONITORING',
    (SELECT id FROM menu_item WHERE code = 'ADMIN_SECTION' LIMIT 1),
    'menu.admin.api',
    'Activity',
    '/admin/api-monitoring',
    67,
    false,
    true,
    'INTERNAL',
    NOW(),
    NOW(),
    'system'
WHERE NOT EXISTS (
    SELECT 1 FROM menu_item WHERE code = 'API_MONITORING'
);

-- Create the permission for API monitoring (if not exists)
INSERT INTO permission (code, name, description, category, is_active, created_at, updated_at)
SELECT
    'CAN_VIEW_API_MONITORING',
    'Ver Monitoreo de APIs',
    'Permite acceder al dashboard de monitoreo de llamadas a APIs del sistema',
    'SECURITY',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permission WHERE code = 'CAN_VIEW_API_MONITORING'
);

-- Associate the permission to the menu item
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT
    (SELECT id FROM menu_item WHERE code = 'API_MONITORING'),
    'CAN_VIEW_API_MONITORING'
WHERE NOT EXISTS (
    SELECT 1 FROM menu_item_permission
    WHERE menu_item_id = (SELECT id FROM menu_item WHERE code = 'API_MONITORING')
    AND permission_code = 'CAN_VIEW_API_MONITORING'
)
AND EXISTS (SELECT 1 FROM menu_item WHERE code = 'API_MONITORING');

-- Assign the permission to ROLE_ADMIN
INSERT INTO role_permission (role_code, permission_code)
SELECT
    'ROLE_ADMIN',
    'CAN_VIEW_API_MONITORING'
WHERE NOT EXISTS (
    SELECT 1 FROM role_permission
    WHERE role_code = 'ROLE_ADMIN'
    AND permission_code = 'CAN_VIEW_API_MONITORING'
);

-- Also link the existing SECURITY_AUDIT permission to this menu (users with security audit access should see this)
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT
    (SELECT id FROM menu_item WHERE code = 'API_MONITORING'),
    'SECURITY_AUDIT'
WHERE NOT EXISTS (
    SELECT 1 FROM menu_item_permission
    WHERE menu_item_id = (SELECT id FROM menu_item WHERE code = 'API_MONITORING')
    AND permission_code = 'SECURITY_AUDIT'
)
AND EXISTS (SELECT 1 FROM menu_item WHERE code = 'API_MONITORING')
AND EXISTS (SELECT 1 FROM permission WHERE code = 'SECURITY_AUDIT');
