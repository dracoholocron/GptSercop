-- V20260305_6: Add "Mis Planes PAA" menu item under SECTION_CP

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_MY_PLANS', id, 'menu.cp.myPlans', 'FileText', '/cp/paa/my-plans', 155, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), display_order = VALUES(display_order);

-- Bump items after my-plans
UPDATE menu_item SET display_order = 156 WHERE code = 'CP_BUDGET';
UPDATE menu_item SET display_order = 157 WHERE code = 'CP_MARKET';
UPDATE menu_item SET display_order = 158 WHERE code = 'CP_RISK';
UPDATE menu_item SET display_order = 159 WHERE code = 'CP_EVALUATIONS';
UPDATE menu_item SET display_order = 160 WHERE code = 'CP_CONTRACTS';
UPDATE menu_item SET display_order = 161 WHERE code = 'CP_BIDDERS';
UPDATE menu_item SET display_order = 162 WHERE code = 'CP_AI_ASSISTANT';
UPDATE menu_item SET display_order = 163 WHERE code = 'CP_REPORTS';

-- Add permission
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_PAA_VIEW'
FROM menu_item m WHERE m.code = 'CP_MY_PLANS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
