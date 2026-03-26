-- =============================================================================
-- V20260326_1: GPTsercop modular permissions and menu (legacy-first)
-- =============================================================================
-- Adds module-level GPTsercop permissions and menu items with role-based visibility.
-- This migration is additive and idempotent to preserve existing legacy UX.
-- =============================================================================

-- 1) Permissions (module-level: VIEW/USE/ADMIN)
INSERT INTO permission_read_model (code, name, description, module) VALUES
  ('GPT_ASSISTANT_VIEW', 'Ver Asistente GPT', 'Permite visualizar el modulo Asistente GPTsercop', 'GPTSERCOP'),
  ('GPT_ASSISTANT_USE', 'Usar Asistente GPT', 'Permite ejecutar consultas del modulo Asistente GPTsercop', 'GPTSERCOP'),
  ('GPT_LEGAL_VIEW', 'Ver Analisis Legal GPT', 'Permite visualizar el modulo de analisis legal GPTsercop', 'GPTSERCOP'),
  ('GPT_LEGAL_USE', 'Usar Analisis Legal GPT', 'Permite ejecutar consultas legales en GPTsercop', 'GPTSERCOP'),
  ('GPT_PRICING_VIEW', 'Ver Analisis de Precios GPT', 'Permite visualizar el modulo de precios GPTsercop', 'GPTSERCOP'),
  ('GPT_PRICING_USE', 'Usar Analisis de Precios GPT', 'Permite ejecutar analisis de precios en GPTsercop', 'GPTSERCOP'),
  ('GPT_RISK_VIEW', 'Ver Analisis de Riesgos GPT', 'Permite visualizar el modulo de riesgos GPTsercop', 'GPTSERCOP'),
  ('GPT_RISK_USE', 'Usar Analisis de Riesgos GPT', 'Permite ejecutar analisis de riesgos en GPTsercop', 'GPTSERCOP'),
  ('GPT_SEARCH_VIEW', 'Ver Busqueda Inteligente GPT', 'Permite visualizar el modulo de busqueda inteligente GPTsercop', 'GPTSERCOP'),
  ('GPT_SEARCH_USE', 'Usar Busqueda Inteligente GPT', 'Permite ejecutar busquedas inteligentes en GPTsercop', 'GPTSERCOP'),
  ('GPT_ADMIN_VIEW', 'Ver Administracion GPT', 'Permite visualizar configuraciones administrativas de GPTsercop', 'GPTSERCOP'),
  ('GPT_ADMIN_MANAGE', 'Administrar GPT', 'Permite administrar prompts, reglas y configuraciones GPTsercop', 'GPTSERCOP')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  module = VALUES(module);

-- 2) Role-permission mapping
-- ROLE_ADMIN: full GPTSERCOP permissions
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON p.module = 'GPTSERCOP'
WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_SUPERVISOR: view/use across non-admin GPT modules
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON p.code IN (
  'GPT_ASSISTANT_VIEW', 'GPT_ASSISTANT_USE',
  'GPT_LEGAL_VIEW', 'GPT_LEGAL_USE',
  'GPT_PRICING_VIEW', 'GPT_PRICING_USE',
  'GPT_RISK_VIEW', 'GPT_RISK_USE',
  'GPT_SEARCH_VIEW', 'GPT_SEARCH_USE'
)
WHERE r.name = 'ROLE_CP_SUPERVISOR'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_ANALISTA: operational modules (no admin, no risk use by default)
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON p.code IN (
  'GPT_ASSISTANT_VIEW', 'GPT_ASSISTANT_USE',
  'GPT_LEGAL_VIEW', 'GPT_LEGAL_USE',
  'GPT_PRICING_VIEW', 'GPT_PRICING_USE',
  'GPT_RISK_VIEW',
  'GPT_SEARCH_VIEW', 'GPT_SEARCH_USE'
)
WHERE r.name = 'ROLE_CP_ANALISTA'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_JURIDICO: legal-heavy set
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON p.code IN (
  'GPT_ASSISTANT_VIEW', 'GPT_ASSISTANT_USE',
  'GPT_LEGAL_VIEW', 'GPT_LEGAL_USE',
  'GPT_SEARCH_VIEW', 'GPT_SEARCH_USE'
)
WHERE r.name = 'ROLE_CP_JURIDICO'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_USER: conservative base visibility only
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
JOIN permission_read_model p ON p.code IN (
  'GPT_ASSISTANT_VIEW',
  'GPT_SEARCH_VIEW'
)
WHERE r.name = 'ROLE_USER'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- 3) Menu section and items
-- Create parent section as top-level, additive only.
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_GPTSERCOP', NULL, 'menu.section.gptsercop', NULL, NULL, 16, TRUE, TRUE, 'system')
ON DUPLICATE KEY UPDATE
  label_key = VALUES(label_key),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

-- Children under SECTION_GPTSERCOP
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_ASSISTANT', id, 'menu.gpt.assistant', 'Bot', '/cp/ai-assistant', 161, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), is_active = VALUES(is_active);

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_LEGAL', id, 'menu.gpt.legal', 'Scale', '/cp/ai-assistant?tab=legal', 162, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), is_active = VALUES(is_active);

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_PRICING', id, 'menu.gpt.pricing', 'TrendingUp', '/cp/ai-assistant?tab=prices', 163, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), is_active = VALUES(is_active);

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_RISK', id, 'menu.gpt.risk', 'ShieldAlert', '/cp/ai-assistant?tab=risks', 164, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), is_active = VALUES(is_active);

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_SEARCH', id, 'menu.gpt.search', 'Search', '/search', 165, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), is_active = VALUES(is_active);

INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'GPT_ADMIN', id, 'menu.gpt.admin', 'Settings', '/admin/menu-config', 166, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_GPTSERCOP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), is_active = VALUES(is_active);

-- 4) Menu -> permission mapping (visibility by permission)
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_ASSISTANT_VIEW'
FROM menu_item m WHERE m.code = 'GPT_ASSISTANT'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_LEGAL_VIEW'
FROM menu_item m WHERE m.code = 'GPT_LEGAL'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_PRICING_VIEW'
FROM menu_item m WHERE m.code = 'GPT_PRICING'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_RISK_VIEW'
FROM menu_item m WHERE m.code = 'GPT_RISK'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_SEARCH_VIEW'
FROM menu_item m WHERE m.code = 'GPT_SEARCH'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'GPT_ADMIN_VIEW'
FROM menu_item m WHERE m.code = 'GPT_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
