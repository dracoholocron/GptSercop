-- Agregar menú de Reportes de Uso IA para administradores
-- Solo visible para usuarios con rol ADMIN

-- Primero obtener el ID del menú padre "Administración" o "Admin"
-- Si no existe, crear como ítem de nivel superior

-- Insertar el nuevo item de menú
INSERT INTO menu_item (
    code,
    parent_id,
    label_key,
    icon,
    path,
    display_order,
    is_section,
    is_active,
    user_type_restriction,
    created_at,
    updated_at,
    created_by
)
SELECT
    'AI_USAGE_REPORTS',
    (SELECT id FROM menu_item WHERE code = 'ADMIN_SECTION' LIMIT 1),
    'menu.aiUsageReports',
    'FiBarChart2',
    '/admin/ai-usage-reports',
    95,
    false,
    true,
    'INTERNAL',
    NOW(),
    NOW(),
    'system'
WHERE NOT EXISTS (
    SELECT 1 FROM menu_item WHERE code = 'AI_USAGE_REPORTS'
);

-- Crear el permiso para acceso a reportes de uso IA (si no existe)
INSERT INTO permission (code, name, description, category, is_active, created_at, updated_at)
SELECT
    'CAN_VIEW_AI_USAGE_REPORTS',
    'Ver Reportes de Uso IA',
    'Permite acceder a los reportes de uso del servicio de extracción con IA para facturación',
    'AI_EXTRACTION',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permission WHERE code = 'CAN_VIEW_AI_USAGE_REPORTS'
);

-- Asociar el permiso al menú
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT
    (SELECT id FROM menu_item WHERE code = 'AI_USAGE_REPORTS'),
    'CAN_VIEW_AI_USAGE_REPORTS'
WHERE NOT EXISTS (
    SELECT 1 FROM menu_item_permission
    WHERE menu_item_id = (SELECT id FROM menu_item WHERE code = 'AI_USAGE_REPORTS')
    AND permission_code = 'CAN_VIEW_AI_USAGE_REPORTS'
);

-- Asignar el permiso al rol ADMIN
INSERT INTO role_permission (role_code, permission_code)
SELECT
    'ROLE_ADMIN',
    'CAN_VIEW_AI_USAGE_REPORTS'
WHERE NOT EXISTS (
    SELECT 1 FROM role_permission
    WHERE role_code = 'ROLE_ADMIN'
    AND permission_code = 'CAN_VIEW_AI_USAGE_REPORTS'
);
