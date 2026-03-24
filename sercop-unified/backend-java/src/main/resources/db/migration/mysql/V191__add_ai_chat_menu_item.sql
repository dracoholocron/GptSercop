-- =============================================================================
-- Migration V170: Add AI Chat CMX Menu Item
-- =============================================================================
-- Adds the Chat CMX menu item under "IA y Analítica" section
-- 
-- IMPORTANTE: Esta migración es idempotente y puede ejecutarse múltiples veces.
-- Si Flyway está deshabilitado, el AIChatDataInitializer se encargará de crear
-- estos datos automáticamente al iniciar la aplicación.
-- =============================================================================

-- Paso 1: Asegurar que la sección SECTION_AI existe
-- Si no existe, la creamos (esto puede pasar si V102 no se ejecutó o fue modificado)
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by, created_at)
SELECT 'SECTION_AI', NULL, 'menu.section.ai', NULL, NULL, 80, TRUE, TRUE, 'SYSTEM', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM menu_item WHERE code = 'SECTION_AI');

-- Paso 2: Obtener el ID de la sección IA y Analítica
SET @ai_section_id = (SELECT id FROM menu_item WHERE code = 'SECTION_AI' LIMIT 1);

-- Paso 3: Insertar el item de menú para Chat CMX (solo si la sección existe)
-- Usamos ON DUPLICATE KEY UPDATE para hacer la migración idempotente
INSERT INTO menu_item (code, label_key, icon, path, parent_id, display_order, is_section, is_active, created_by, created_at)
SELECT 'AI_CHAT_CMX', 'menu.ai.chat', 'FiMessageSquare', '/ai-analysis/chat', 
       @ai_section_id, 
       10, FALSE, TRUE, 'SYSTEM', NOW()
WHERE @ai_section_id IS NOT NULL
ON DUPLICATE KEY UPDATE 
    label_key = VALUES(label_key),
    icon = VALUES(icon),
    path = VALUES(path),
    display_order = VALUES(display_order),
    parent_id = VALUES(parent_id),
    is_active = TRUE,
    updated_at = NOW(),
    updated_by = 'SYSTEM';

-- Paso 4: Obtener el ID del item de menú
SET @chat_menu_id = (SELECT id FROM menu_item WHERE code = 'AI_CHAT_CMX' LIMIT 1);

-- Paso 5: Asegurar que el permiso CAN_USE_AI_CHAT existe
-- (Este permiso debería haberse creado en V169, pero lo verificamos por si acaso)
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'CAN_USE_AI_CHAT', 'Usar Chat IA', 'Permite usar el chat con IA (Chat CMX)', 'AI', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'CAN_USE_AI_CHAT');

-- Paso 6: Asociar el permiso CAN_USE_AI_CHAT al item de menú (solo si el item existe)
INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT @chat_menu_id, 'CAN_USE_AI_CHAT'
WHERE @chat_menu_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM menu_item_permission 
    WHERE menu_item_id = @chat_menu_id 
    AND permission_code = 'CAN_USE_AI_CHAT'
);

-- Paso 7: Asignar el permiso a los roles (si no está asignado)
-- ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_USE_AI_CHAT'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model rp 
    WHERE rp.role_id = r.id AND rp.permission_code = 'CAN_USE_AI_CHAT'
);

-- ROLE_MANAGER
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_USE_AI_CHAT'
FROM role_read_model r
WHERE r.name = 'ROLE_MANAGER'
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model rp 
    WHERE rp.role_id = r.id AND rp.permission_code = 'CAN_USE_AI_CHAT'
);

-- ROLE_USER
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_USE_AI_CHAT'
FROM role_read_model r
WHERE r.name = 'ROLE_USER'
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model rp 
    WHERE rp.role_id = r.id AND rp.permission_code = 'CAN_USE_AI_CHAT'
);

