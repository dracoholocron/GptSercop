-- V20260302_7: Update CP menu items for new modules

-- Add missing CP menu items: PAA, Budget, Market, Risk
-- These are child items of SECTION_CP (created in V20260227_4)

-- CP PAA (Plan Anual de Adquisiciones)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_PAA', id, 'menu.cp.paa', 'Calendar', '/cp/paa', 153, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), display_order = VALUES(display_order);

-- CP Budget (Presupuesto)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_BUDGET', id, 'menu.cp.budget', 'DollarSign', '/cp/budget', 154, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), display_order = VALUES(display_order);

-- CP Market Study (Estudio de Mercado)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_MARKET', id, 'menu.cp.market', 'TrendingUp', '/cp/market', 155, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), display_order = VALUES(display_order);

-- CP Risk (Riesgos)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_RISK', id, 'menu.cp.risk', 'ShieldAlert', '/cp/risk', 156, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), display_order = VALUES(display_order);

-- Reorder existing items to make room:
-- CP_EVALUATIONS -> 157
UPDATE menu_item SET display_order = 157 WHERE code = 'CP_EVALUATIONS';
-- CP_CONTRACTS -> 158
UPDATE menu_item SET display_order = 158 WHERE code = 'CP_CONTRACTS';
-- CP_BIDDERS -> 159
UPDATE menu_item SET display_order = 159 WHERE code = 'CP_BIDDERS';
-- CP_AI_ASSISTANT -> 160
UPDATE menu_item SET display_order = 160 WHERE code = 'CP_AI_ASSISTANT';
-- CP_REPORTS -> 161
UPDATE menu_item SET display_order = 161 WHERE code = 'CP_REPORTS';

-- Add permissions to new menu items
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_DASHBOARD'
FROM menu_item m WHERE m.code = 'CP_PAA'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_DASHBOARD'
FROM menu_item m WHERE m.code = 'CP_BUDGET'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_DASHBOARD'
FROM menu_item m WHERE m.code = 'CP_MARKET'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_AI_RISK_ANALYSIS'
FROM menu_item m WHERE m.code = 'CP_RISK'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
