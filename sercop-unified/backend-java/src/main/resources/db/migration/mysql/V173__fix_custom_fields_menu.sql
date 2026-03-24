-- ================================================
-- Migration: Fix Custom Fields Menu Item
-- Description: Add Custom Fields menu under Catalogs
-- Author: GlobalCMX Architecture
-- Date: 2026-01-18
-- ================================================

-- Delete any incorrectly created menu items from previous migration (if exists)
DELETE FROM menu_item_permission WHERE menu_item_id IN (
    SELECT id FROM menu_item WHERE code LIKE 'custom-fields%'
);
DELETE FROM menu_item WHERE code LIKE 'custom-fields%';

-- Add Custom Fields menu item under Catalogs (correct structure)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_CUSTOM_FIELDS', id, 'menu.catalogs.customFields', 'Sliders', '/catalogs/custom-fields', 84, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS'
ON DUPLICATE KEY UPDATE path = '/catalogs/custom-fields', label_key = 'menu.catalogs.customFields';

-- Add permission for the menu item
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_CUSTOM_FIELDS';
