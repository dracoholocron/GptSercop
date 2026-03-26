-- =============================================================================
-- V20260326_2: GPTsercop advanced admin menu and permissions
-- =============================================================================
-- Adds admin-level GPT menu entries for prompt config and usage reports.
-- Idempotent and additive for legacy-first rollout.
-- =============================================================================

-- Ensure stats permission used by AI extraction reports exists.
INSERT INTO permission_read_model (code, name, description, module) VALUES
  ('CAN_VIEW_AI_STATS', 'Ver estadisticas de IA', 'Permite ver reportes y metricas de uso de IA', 'AI_CONFIG')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  module = VALUES(module);

-- ROLE_ADMIN should always have this permission.
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_AI_STATS'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Add GPT advanced admin menu items under GPT section.
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_ADMIN_PROMPTS', id, 'menu.admin.aiPrompts', 'MessageSquare', '/admin/ai-prompts', 167, FALSE, TRUE, 'system'
FROM menu_item
WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE
  label_key = VALUES(label_key),
  path = VALUES(path),
  is_active = VALUES(is_active);

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_ADMIN_USAGE', id, 'menu.admin.aiUsage', 'BarChart3', '/admin/ai-usage', 168, FALSE, TRUE, 'system'
FROM menu_item
WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE
  label_key = VALUES(label_key),
  path = VALUES(path),
  is_active = VALUES(is_active);

-- Bind menu visibility permissions.
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_ADMIN_VIEW'
FROM menu_item m
WHERE m.code = 'GPT_ADMIN_PROMPTS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_ADMIN_VIEW'
FROM menu_item m
WHERE m.code = 'GPT_ADMIN_USAGE'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
