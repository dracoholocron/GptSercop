-- =============================================================================
-- Migration V124: Add External API Configuration Menu
-- =============================================================================

-- Get the parent ID for ADMINISTRATION menu
SET @admin_parent_id = (SELECT id FROM menu_item WHERE code = 'ADMINISTRATION' LIMIT 1);

-- Add menu item for External API Configuration under Administration
INSERT INTO menu_item (
    code,
    parent_id,
    label_key,
    icon,
    path,
    display_order,
    is_section,
    is_active,
    created_at,
    created_by
) VALUES (
    'EXTERNAL_API_CONFIG',
    @admin_parent_id,
    'menu.admin.externalApiConfig',
    'FiCloud',
    '/admin/external-api-config',
    65,
    FALSE,
    TRUE,
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    label_key = VALUES(label_key),
    icon = VALUES(icon),
    path = VALUES(path),
    display_order = VALUES(display_order);

-- Link menu to permission
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CAN_VIEW_API_CONFIG'
FROM menu_item m
WHERE m.code = 'EXTERNAL_API_CONFIG'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
