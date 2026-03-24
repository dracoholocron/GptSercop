-- =============================================================================
-- Migration: Add Alerts Menu Item and Permissions
-- Adds menu item and permissions for the alerts/agenda feature
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Menu Item: Alerts Agenda
-- -----------------------------------------------------------------------------
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
    'ALERTS_AGENDA',
    NULL,
    'menu.alerts',
    'Calendar',
    '/alerts',
    15,
    false,
    true,
    NULL,
    NOW(),
    NOW(),
    'system'
WHERE NOT EXISTS (
    SELECT 1 FROM menu_item WHERE code = 'ALERTS_AGENDA'
);

-- -----------------------------------------------------------------------------
-- Permissions for Alerts (using correct table: permission_read_model)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO permission_read_model (code, name, description, module, created_at)
VALUES
    ('CAN_VIEW_ALERTS_AGENDA', 'Ver Agenda de Alertas', 'Permite acceder a la agenda de alertas y seguimientos del usuario', 'ALERTS', NOW()),
    ('CAN_MANAGE_OWN_ALERTS', 'Gestionar Propias Alertas', 'Permite crear, editar y gestionar las propias alertas', 'ALERTS', NOW()),
    ('CAN_CREATE_ALERTS_FOR_OTHERS', 'Crear Alertas para Otros', 'Permite crear alertas asignadas a otros usuarios', 'ALERTS', NOW()),
    ('CAN_VIEW_BUSINESS_REQUESTS', 'Ver Solicitudes de Negocio', 'Permite ver las solicitudes de negocio pendientes', 'ALERTS', NOW()),
    ('CAN_APPROVE_BUSINESS_REQUESTS', 'Aprobar Solicitudes de Negocio', 'Permite aprobar o rechazar solicitudes de negocio', 'ALERTS', NOW());

-- -----------------------------------------------------------------------------
-- Associate permission to menu item
-- -----------------------------------------------------------------------------
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT
    (SELECT id FROM menu_item WHERE code = 'ALERTS_AGENDA'),
    'CAN_VIEW_ALERTS_AGENDA'
WHERE NOT EXISTS (
    SELECT 1 FROM menu_item_permission
    WHERE menu_item_id = (SELECT id FROM menu_item WHERE code = 'ALERTS_AGENDA')
    AND permission_code = 'CAN_VIEW_ALERTS_AGENDA'
)
AND EXISTS (SELECT 1 FROM menu_item WHERE code = 'ALERTS_AGENDA');

-- -----------------------------------------------------------------------------
-- Assign permissions to roles (using correct table: role_permission_read_model)
-- -----------------------------------------------------------------------------

-- ROLE_USER permissions
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_ALERTS_AGENDA' FROM role_read_model r WHERE r.name = 'ROLE_USER';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_MANAGE_OWN_ALERTS' FROM role_read_model r WHERE r.name = 'ROLE_USER';

-- ROLE_ADMIN permissions (all)
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_ALERTS_AGENDA' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_MANAGE_OWN_ALERTS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_CREATE_ALERTS_FOR_OTHERS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_BUSINESS_REQUESTS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_APPROVE_BUSINESS_REQUESTS' FROM role_read_model r WHERE r.name = 'ROLE_ADMIN';

-- ROLE_OPERATOR permissions
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_BUSINESS_REQUESTS' FROM role_read_model r WHERE r.name = 'ROLE_OPERATOR';

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_APPROVE_BUSINESS_REQUESTS' FROM role_read_model r WHERE r.name = 'ROLE_OPERATOR';
