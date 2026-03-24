-- ================================================
-- Migration: Add Custom Fields Menu Items
-- Description: Menu entries and permissions for custom fields admin
-- Author: GlobalCMX Architecture
-- Date: 2026-01-18
-- ================================================

-- =============================================
-- Add Custom Fields menu item under Catalogs
-- =============================================

-- Custom Fields Configuration
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CAT_CUSTOM_FIELDS', id, 'menu.catalogs.customFields', 'Sliders', '/catalogs/custom-fields', 84, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS';

-- =============================================
-- Add permission for the menu item
-- =============================================

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'VIEW_CATALOGS' FROM menu_item WHERE code = 'CAT_CUSTOM_FIELDS';

-- =============================================
-- Ensure ADMIN role has the permission
-- =============================================

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_CATALOGS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';
