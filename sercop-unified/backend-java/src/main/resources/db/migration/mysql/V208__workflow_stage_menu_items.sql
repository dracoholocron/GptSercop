-- ============================================================
-- V208: Workflow Stage Menu Items
-- Adds 7 menu items under SECTION_CLIENT_REQUESTS, one per
-- internal processing stage, with permissions and role mapping.
-- ============================================================

-- ============================================
-- 1. CREATE PERMISSIONS FOR EACH STAGE
-- ============================================

INSERT INTO permission_read_model (code, name, description, module, created_at) VALUES
('CAN_VIEW_STAGE_RECEPCION',   'Ver Etapa Recepcion',   'Permite ver solicitudes en etapa de recepcion',   'CLIENT_PORTAL', NOW()),
('CAN_VIEW_STAGE_VALIDACION',  'Ver Etapa Validacion',  'Permite ver solicitudes en etapa de validacion',  'CLIENT_PORTAL', NOW()),
('CAN_VIEW_STAGE_COMPLIANCE',  'Ver Etapa Compliance',  'Permite ver solicitudes en etapa de compliance',  'CLIENT_PORTAL', NOW()),
('CAN_VIEW_STAGE_APROBACION',  'Ver Etapa Aprobacion',  'Permite ver solicitudes en etapa de aprobacion',  'CLIENT_PORTAL', NOW()),
('CAN_VIEW_STAGE_COMISIONES',  'Ver Etapa Comisiones',  'Permite ver solicitudes en etapa de comisiones',  'CLIENT_PORTAL', NOW()),
('CAN_VIEW_STAGE_REGISTRO',    'Ver Etapa Registro',    'Permite ver solicitudes en etapa de registro',    'CLIENT_PORTAL', NOW()),
('CAN_VIEW_STAGE_FINALIZADO',  'Ver Etapa Finalizado',  'Permite ver solicitudes en etapa finalizado',     'CLIENT_PORTAL', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- ============================================
-- 2. ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- RECEPCION: ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_STAGE_RECEPCION'
FROM role_read_model r WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN');

-- VALIDACION: ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_STAGE_VALIDACION'
FROM role_read_model r WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN');

-- COMPLIANCE: ROLE_OPERATOR, ROLE_COMPLIANCE, ROLE_MANAGER, ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_STAGE_COMPLIANCE'
FROM role_read_model r WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_COMPLIANCE', 'ROLE_MANAGER', 'ROLE_ADMIN');

-- APROBACION: ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_STAGE_APROBACION'
FROM role_read_model r WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN');

-- COMISIONES: ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_STAGE_COMISIONES'
FROM role_read_model r WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN');

-- REGISTRO: ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_STAGE_REGISTRO'
FROM role_read_model r WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN');

-- FINALIZADO: ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_STAGE_FINALIZADO'
FROM role_read_model r WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN');

-- ============================================
-- 3. CREATE 7 MENU ITEMS UNDER SECTION_CLIENT_REQUESTS
-- ============================================

SET @backoffice_section_id = (SELECT id FROM menu_item WHERE code = 'SECTION_CLIENT_REQUESTS');

-- Stage: Recepcion
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('STAGE_RECEPCION', @backoffice_section_id, 'menu.stage.recepcion', 'Inbox', '/operations/client-requests/stage/recepcion', 20, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), icon = VALUES(icon), display_order = VALUES(display_order);

-- Stage: Validacion
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('STAGE_VALIDACION', @backoffice_section_id, 'menu.stage.validacion', 'CheckSquare', '/operations/client-requests/stage/validacion', 21, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), icon = VALUES(icon), display_order = VALUES(display_order);

-- Stage: Compliance
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('STAGE_COMPLIANCE', @backoffice_section_id, 'menu.stage.compliance', 'Shield', '/operations/client-requests/stage/compliance', 22, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), icon = VALUES(icon), display_order = VALUES(display_order);

-- Stage: Aprobacion
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('STAGE_APROBACION', @backoffice_section_id, 'menu.stage.aprobacion', 'UserCheck', '/operations/client-requests/stage/aprobacion', 23, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), icon = VALUES(icon), display_order = VALUES(display_order);

-- Stage: Comisiones
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('STAGE_COMISIONES', @backoffice_section_id, 'menu.stage.comisiones', 'DollarSign', '/operations/client-requests/stage/comisiones', 24, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), icon = VALUES(icon), display_order = VALUES(display_order);

-- Stage: Registro
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('STAGE_REGISTRO', @backoffice_section_id, 'menu.stage.registro', 'Edit', '/operations/client-requests/stage/registro', 25, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), icon = VALUES(icon), display_order = VALUES(display_order);

-- Stage: Finalizado
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('STAGE_FINALIZADO', @backoffice_section_id, 'menu.stage.finalizado', 'Archive', '/operations/client-requests/stage/finalizado', 26, FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path), icon = VALUES(icon), display_order = VALUES(display_order);

-- ============================================
-- 4. LINK MENU ITEMS TO PERMISSIONS
-- ============================================

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_STAGE_RECEPCION' FROM menu_item WHERE code = 'STAGE_RECEPCION';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_STAGE_VALIDACION' FROM menu_item WHERE code = 'STAGE_VALIDACION';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_STAGE_COMPLIANCE' FROM menu_item WHERE code = 'STAGE_COMPLIANCE';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_STAGE_APROBACION' FROM menu_item WHERE code = 'STAGE_APROBACION';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_STAGE_COMISIONES' FROM menu_item WHERE code = 'STAGE_COMISIONES';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_STAGE_REGISTRO' FROM menu_item WHERE code = 'STAGE_REGISTRO';

INSERT IGNORE INTO menu_item_permission (menu_item_id, permission_code)
SELECT id, 'CAN_VIEW_STAGE_FINALIZADO' FROM menu_item WHERE code = 'STAGE_FINALIZADO';
