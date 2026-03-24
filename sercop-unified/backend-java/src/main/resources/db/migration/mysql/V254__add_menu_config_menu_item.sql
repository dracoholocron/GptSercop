-- ============================================================================
-- V254__add_menu_config_menu_item.sql
-- Add Menu Configuration menu item under Administration section
-- ============================================================================

INSERT INTO menu_item (code, label_key, icon, path, display_order, is_active, is_section, parent_id)
SELECT 'MENU_CONFIG', 'menu.admin.menu', 'FiBars', '/admin/menu-config',
       101, TRUE, FALSE, m.id
FROM menu_item m
WHERE m.code = 'SECTION_ADMIN'
ON DUPLICATE KEY UPDATE
    path = '/admin/menu-config',
    is_active = TRUE,
    updated_at = NOW();

-- Assign MANAGE_SECURITY_CONFIG permission to the menu item
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT mi.id, 'MANAGE_SECURITY_CONFIG'
FROM menu_item mi
WHERE mi.code = 'MENU_CONFIG'
  AND NOT EXISTS (
    SELECT 1 FROM menu_item_permission
    WHERE menu_item_id = mi.id AND permission_code = 'MANAGE_SECURITY_CONFIG'
  );
