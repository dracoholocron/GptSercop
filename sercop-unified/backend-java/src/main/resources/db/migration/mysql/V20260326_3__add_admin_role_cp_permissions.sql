-- V20260326_3: Grant ROLE_ADMIN all Compras Públicas + GPT permissions
-- This ensures admin users can see the full CP menu and all GPT modules.

-- 1. All permissions from module COMPRAS_PUBLICAS
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON 1=1
WHERE r.name = 'ROLE_ADMIN'
  AND p.module = 'COMPRAS_PUBLICAS';

-- 2. All permissions from module GPT (if present)
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON 1=1
WHERE r.name = 'ROLE_ADMIN'
  AND p.module = 'GPT';

-- 3. CP_AI_* permissions (module CP_AI)
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON 1=1
WHERE r.name = 'ROLE_ADMIN'
  AND p.module = 'CP_AI';

-- 4. CP PAA permissions (module CP)
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON 1=1
WHERE r.name = 'ROLE_ADMIN'
  AND p.module = 'CP';

-- 5. Any permissions still needed by CP menu items not yet covered
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT DISTINCT r.id, mip.permission_code
FROM role_read_model r
JOIN menu_item_permission mip ON 1=1
JOIN menu_item mi ON mip.menu_item_id = mi.id
WHERE r.name = 'ROLE_ADMIN'
  AND (mi.code LIKE 'CP_%' OR mi.code LIKE 'SECTION_CP%');

-- 6. CAN_VIEW_AI_STATS for AI admin dashboards
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_AI_STATS'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
  AND EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'CAN_VIEW_AI_STATS');
