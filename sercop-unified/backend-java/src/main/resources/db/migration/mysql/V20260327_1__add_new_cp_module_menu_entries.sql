-- ============================================================================
-- V20260327_1 - Nuevas entradas de menú para módulos GPTsercop Phase 2
-- Contratos, Catálogo Electrónico, CPC Browser, Denuncias, Registro RUP
-- Evaluaciones, Portal Proveedor (Oferta), SIE
-- ============================================================================

-- Permissions for new modules
INSERT IGNORE INTO permission_read_model (code, name, description, module, is_active)
VALUES
  ('CP_VIEW_CONTRACTS',       'Ver Contratos',           'Acceso a lista y detalle de contratos',    'COMPRAS_PUBLICAS', 1),
  ('CP_MANAGE_CONTRACTS',     'Gestionar Contratos',     'Crear y administrar contratos',             'COMPRAS_PUBLICAS', 1),
  ('CP_VIEW_CATALOG',         'Ver Catálogo Electrónico','Acceso al catálogo electrónico',            'COMPRAS_PUBLICAS', 1),
  ('CP_PURCHASE_CATALOG',     'Comprar en Catálogo',     'Generar órdenes de compra desde catálogo',  'COMPRAS_PUBLICAS', 1),
  ('CP_VIEW_CPC',             'Ver Browser CPC',         'Explorar el clasificador CPC',              'COMPRAS_PUBLICAS', 1),
  ('CP_SUBMIT_COMPLAINT',     'Presentar Denuncia',      'Registrar denuncias ciudadanas',            'COMPRAS_PUBLICAS', 1),
  ('CP_MANAGE_COMPLAINTS',    'Gestionar Denuncias',     'Revisar y resolver denuncias (admin)',       'COMPRAS_PUBLICAS', 1),
  ('CP_REGISTER_RUP',         'Registro RUP',            'Completar registro de proveedor en RUP',    'COMPRAS_PUBLICAS', 1),
  ('CP_SUBMIT_OFFER',         'Presentar Oferta',        'Enviar ofertas en procesos publicados',     'COMPRAS_PUBLICAS', 1),
  ('CP_EVALUATE_OFFERS',      'Evaluar Ofertas',         'Calificar y evaluar ofertas recibidas',     'COMPRAS_PUBLICAS', 1),
  ('CP_CREATE_PROCESS',       'Crear Proceso',           'Crear y publicar procesos de contratación', 'COMPRAS_PUBLICAS', 1),
  ('CP_SIE_PARTICIPATE',      'Participar en SIE',       'Participar en subastas inversas electrónicas','COMPRAS_PUBLICAS',1);

-- ============================================================================
-- Menu items for new CP modules
-- Parent id for CP section: look up existing entry or use known seed id
-- Using high negative IDs to avoid conflicts with auto-increment IDs
-- ============================================================================

-- Get parent id for Compras Públicas section  
SET @cp_parent_id = (
  SELECT id FROM menu_item_read_model
  WHERE code = 'cp.dashboard' OR path = '/cp/dashboard' OR path = '/cp'
  LIMIT 1
);

-- If not found, use NULL (top-level items)
SET @cp_parent_id = IFNULL(@cp_parent_id, NULL);

-- Contratos
INSERT IGNORE INTO menu_item_read_model
  (code, parent_id, label_key, icon, path, display_order, is_section, is_active)
VALUES
  ('cp.contracts', @cp_parent_id, 'Contratos', 'ClipboardCheck', '/cp/contracts', 51, 0, 1);

-- Catálogo Electrónico  
INSERT IGNORE INTO menu_item_read_model
  (code, parent_id, label_key, icon, path, display_order, is_section, is_active)
VALUES
  ('cp.catalog.electronic', @cp_parent_id, 'Catálogo Electrónico', 'CreditCard', '/cp/catalog-electronic', 52, 0, 1);

-- Browser CPC
INSERT IGNORE INTO menu_item_read_model
  (code, parent_id, label_key, icon, path, display_order, is_section, is_active)
VALUES
  ('cp.cpc.browser', @cp_parent_id, 'Browser CPC', 'Hash', '/cp/cpc-browser', 53, 0, 1);

-- Denuncias y Reclamos
INSERT IGNORE INTO menu_item_read_model
  (code, parent_id, label_key, icon, path, display_order, is_section, is_active)
VALUES
  ('cp.complaints', @cp_parent_id, 'Denuncias y Reclamos', 'MessageSquare', '/cp/complaints', 54, 0, 1);

-- Registro RUP (Portal Proveedor)
INSERT IGNORE INTO menu_item_read_model
  (code, parent_id, label_key, icon, path, display_order, is_section, is_active)
VALUES
  ('cp.rup.register', @cp_parent_id, 'Registro RUP', 'UserCheck', '/providers/register', 55, 0, 1);

-- ============================================================================
-- Assign new permissions to menu items
-- ============================================================================

-- Link permissions to menu items
INSERT IGNORE INTO menu_item_permission_read_model (menu_item_code, permission_code)
SELECT 'cp.contracts', 'CP_VIEW_CONTRACTS' WHERE EXISTS (SELECT 1 FROM menu_item_read_model WHERE code = 'cp.contracts');

INSERT IGNORE INTO menu_item_permission_read_model (menu_item_code, permission_code)
SELECT 'cp.catalog.electronic', 'CP_VIEW_CATALOG' WHERE EXISTS (SELECT 1 FROM menu_item_read_model WHERE code = 'cp.catalog.electronic');

INSERT IGNORE INTO menu_item_permission_read_model (menu_item_code, permission_code)
SELECT 'cp.cpc.browser', 'CP_VIEW_CPC' WHERE EXISTS (SELECT 1 FROM menu_item_read_model WHERE code = 'cp.cpc.browser');

INSERT IGNORE INTO menu_item_permission_read_model (menu_item_code, permission_code)
SELECT 'cp.complaints', 'CP_SUBMIT_COMPLAINT' WHERE EXISTS (SELECT 1 FROM menu_item_read_model WHERE code = 'cp.complaints');

INSERT IGNORE INTO menu_item_permission_read_model (menu_item_code, permission_code)
SELECT 'cp.rup.register', 'CP_REGISTER_RUP' WHERE EXISTS (SELECT 1 FROM menu_item_read_model WHERE code = 'cp.rup.register');

-- ============================================================================
-- Grant new CP permissions to ROLE_ADMIN
-- ============================================================================

INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
CROSS JOIN permission_read_model p
WHERE r.name = 'ROLE_ADMIN'
  AND p.code IN (
    'CP_VIEW_CONTRACTS', 'CP_MANAGE_CONTRACTS',
    'CP_VIEW_CATALOG', 'CP_PURCHASE_CATALOG',
    'CP_VIEW_CPC',
    'CP_SUBMIT_COMPLAINT', 'CP_MANAGE_COMPLAINTS',
    'CP_REGISTER_RUP', 'CP_SUBMIT_OFFER', 'CP_EVALUATE_OFFERS',
    'CP_CREATE_PROCESS', 'CP_SIE_PARTICIPATE'
  );

-- Grant to cp.admin role if it exists
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
CROSS JOIN permission_read_model p
WHERE r.name IN ('ROLE_CP_ADMIN', 'cp.admin')
  AND p.code IN (
    'CP_VIEW_CONTRACTS', 'CP_MANAGE_CONTRACTS',
    'CP_VIEW_CATALOG', 'CP_PURCHASE_CATALOG',
    'CP_VIEW_CPC',
    'CP_SUBMIT_COMPLAINT', 'CP_MANAGE_COMPLAINTS',
    'CP_REGISTER_RUP', 'CP_SUBMIT_OFFER', 'CP_EVALUATE_OFFERS',
    'CP_CREATE_PROCESS', 'CP_SIE_PARTICIPATE'
  );

-- Grant basic viewing to all CP roles
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
CROSS JOIN permission_read_model p
WHERE r.name LIKE '%cp%' OR r.name LIKE 'CP%'
  AND p.code IN ('CP_VIEW_CONTRACTS', 'CP_VIEW_CATALOG', 'CP_VIEW_CPC', 'CP_SUBMIT_COMPLAINT');
