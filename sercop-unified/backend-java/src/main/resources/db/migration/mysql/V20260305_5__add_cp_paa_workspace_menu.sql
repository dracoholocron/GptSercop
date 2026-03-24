-- V20260305_5: Add PAA Workspaces menu item + Methodology catalog

-- CP PAA Workspaces (Espacios Colaborativos PAA)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_PAA_WORKSPACES', id, 'menu.cp.paaWorkspaces', 'Users', '/cp/paa/workspaces', 154, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), display_order = VALUES(display_order);

-- CP Methodology Config (in catalogs section)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CATALOG_CP_METHODOLOGIES', id, 'menu.catalogs.cpMethodologies', 'Layers', '/catalogs/cp-methodologies', 95, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CATALOGS'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), display_order = VALUES(display_order);

-- Bump existing items after PAA
UPDATE menu_item SET display_order = 155 WHERE code = 'CP_BUDGET';
UPDATE menu_item SET display_order = 156 WHERE code = 'CP_MARKET';
UPDATE menu_item SET display_order = 157 WHERE code = 'CP_RISK';
UPDATE menu_item SET display_order = 158 WHERE code = 'CP_EVALUATIONS';
UPDATE menu_item SET display_order = 159 WHERE code = 'CP_CONTRACTS';
UPDATE menu_item SET display_order = 160 WHERE code = 'CP_BIDDERS';
UPDATE menu_item SET display_order = 161 WHERE code = 'CP_AI_ASSISTANT';
UPDATE menu_item SET display_order = 162 WHERE code = 'CP_REPORTS';

-- Add permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_PAA_WORKSPACE_VIEW'
FROM menu_item m WHERE m.code = 'CP_PAA_WORKSPACES'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_PAA_METHODOLOGY_VIEW'
FROM menu_item m WHERE m.code = 'CATALOG_CP_METHODOLOGIES'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
