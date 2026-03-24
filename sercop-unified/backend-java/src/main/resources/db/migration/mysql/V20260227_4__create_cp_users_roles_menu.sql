-- =============================================================================
-- V20260227_4: Compras Públicas - Users, Roles, Permissions and Menu Items
-- =============================================================================
-- Creates CP-specific roles, users, permissions and menu navigation
-- =============================================================================

-- =====================================================
-- 1. CP ROLES
-- =====================================================

INSERT IGNORE INTO role_read_model (name, description) VALUES
    ('ROLE_CP_ANALISTA', 'Analista de Compras Públicas - Registro y seguimiento de procesos'),
    ('ROLE_CP_COMISION', 'Comisión Técnica - Evaluación de ofertas y calificación'),
    ('ROLE_CP_DIRECTOR', 'Director de Compras - Aprobación y supervisión'),
    ('ROLE_CP_MAXIMA_AUTORIDAD', 'Máxima Autoridad - Aprobación final de procesos'),
    ('ROLE_CP_ADMINISTRADOR_CONTRATO', 'Administrador de Contrato - Gestión post-adjudicación'),
    ('ROLE_CP_JURIDICO', 'Asesor Jurídico - Revisión legal y normativa'),
    ('ROLE_CP_SUPERVISOR', 'Supervisor de Compras Públicas - Visibilidad total del sistema');

-- =====================================================
-- 2. CP PERMISSIONS
-- =====================================================

INSERT INTO permission_read_model (code, name, description, module) VALUES
    -- Core CP Module
    ('CP_VIEW_DASHBOARD', 'Ver Dashboard CP', 'Permite ver el dashboard de Compras Públicas', 'COMPRAS_PUBLICAS'),
    ('CP_VIEW_PROCESSES', 'Ver Procesos', 'Permite ver procesos de contratación', 'COMPRAS_PUBLICAS'),
    ('CP_CREATE_PROCESS', 'Crear Proceso', 'Permite crear nuevos procesos de contratación', 'COMPRAS_PUBLICAS'),
    ('CP_EDIT_PROCESS', 'Editar Proceso', 'Permite editar procesos de contratación', 'COMPRAS_PUBLICAS'),
    ('CP_DELETE_PROCESS', 'Eliminar Proceso', 'Permite eliminar procesos de contratación', 'COMPRAS_PUBLICAS'),
    ('CP_APPROVE_PROCESS', 'Aprobar Proceso', 'Permite aprobar procesos de contratación', 'COMPRAS_PUBLICAS'),

    -- Evaluation Module
    ('CP_VIEW_EVALUATIONS', 'Ver Evaluaciones', 'Permite ver evaluaciones de ofertas', 'COMPRAS_PUBLICAS'),
    ('CP_CREATE_EVALUATION', 'Crear Evaluación', 'Permite crear evaluaciones de ofertas', 'COMPRAS_PUBLICAS'),
    ('CP_APPROVE_EVALUATION', 'Aprobar Evaluación', 'Permite aprobar evaluaciones', 'COMPRAS_PUBLICAS'),

    -- Contract Module
    ('CP_VIEW_CONTRACTS', 'Ver Contratos', 'Permite ver contratos', 'COMPRAS_PUBLICAS'),
    ('CP_CREATE_CONTRACT', 'Crear Contrato', 'Permite crear contratos', 'COMPRAS_PUBLICAS'),
    ('CP_MANAGE_CONTRACT', 'Gestionar Contrato', 'Permite gestionar contratos activos', 'COMPRAS_PUBLICAS'),

    -- Bidder Module
    ('CP_VIEW_BIDDERS', 'Ver Oferentes', 'Permite ver información de oferentes', 'COMPRAS_PUBLICAS'),
    ('CP_QUALIFY_BIDDER', 'Calificar Oferente', 'Permite calificar oferentes', 'COMPRAS_PUBLICAS'),

    -- AI Module
    ('CP_AI_ASSISTANT', 'Asistente IA', 'Permite usar el asistente de IA de CP', 'COMPRAS_PUBLICAS'),
    ('CP_AI_LEGAL_HELP', 'Ayuda Legal IA', 'Permite consultas legales con IA', 'COMPRAS_PUBLICAS'),
    ('CP_AI_PRICE_ANALYSIS', 'Análisis Precios IA', 'Permite análisis de precios con IA', 'COMPRAS_PUBLICAS'),
    ('CP_AI_RISK_ANALYSIS', 'Análisis Riesgos IA', 'Permite análisis de riesgos con IA', 'COMPRAS_PUBLICAS'),

    -- Reports Module
    ('CP_VIEW_REPORTS', 'Ver Reportes CP', 'Permite ver reportes de Compras Públicas', 'COMPRAS_PUBLICAS'),
    ('CP_EXPORT_REPORTS', 'Exportar Reportes CP', 'Permite exportar reportes de CP', 'COMPRAS_PUBLICAS'),

    -- Configuration Module
    ('CP_CONFIG', 'Configurar CP', 'Permite configurar parámetros de CP', 'COMPRAS_PUBLICAS'),
    ('CP_MANAGE_CATALOGS', 'Gestionar Catálogos CP', 'Permite gestionar catálogos de CP', 'COMPRAS_PUBLICAS')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- =====================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- ROLE_CP_ANALISTA: View, Create, Edit processes
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_CP_ANALISTA'
  AND p.code IN (
    'CP_VIEW_DASHBOARD', 'CP_VIEW_PROCESSES', 'CP_CREATE_PROCESS', 'CP_EDIT_PROCESS',
    'CP_VIEW_BIDDERS', 'CP_VIEW_CONTRACTS',
    'CP_AI_ASSISTANT', 'CP_AI_LEGAL_HELP', 'CP_AI_PRICE_ANALYSIS',
    'CP_VIEW_REPORTS'
  )
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_COMISION: Evaluation permissions
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_CP_COMISION'
  AND p.code IN (
    'CP_VIEW_DASHBOARD', 'CP_VIEW_PROCESSES',
    'CP_VIEW_EVALUATIONS', 'CP_CREATE_EVALUATION', 'CP_APPROVE_EVALUATION',
    'CP_VIEW_BIDDERS', 'CP_QUALIFY_BIDDER',
    'CP_AI_ASSISTANT', 'CP_AI_LEGAL_HELP', 'CP_AI_PRICE_ANALYSIS', 'CP_AI_RISK_ANALYSIS',
    'CP_VIEW_REPORTS'
  )
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_DIRECTOR: Approval permissions
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_CP_DIRECTOR'
  AND p.code IN (
    'CP_VIEW_DASHBOARD', 'CP_VIEW_PROCESSES', 'CP_EDIT_PROCESS', 'CP_APPROVE_PROCESS',
    'CP_VIEW_EVALUATIONS', 'CP_APPROVE_EVALUATION',
    'CP_VIEW_CONTRACTS', 'CP_CREATE_CONTRACT',
    'CP_VIEW_BIDDERS',
    'CP_AI_ASSISTANT', 'CP_AI_LEGAL_HELP', 'CP_AI_PRICE_ANALYSIS', 'CP_AI_RISK_ANALYSIS',
    'CP_VIEW_REPORTS', 'CP_EXPORT_REPORTS'
  )
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_MAXIMA_AUTORIDAD: All approvals
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_CP_MAXIMA_AUTORIDAD'
  AND p.code IN (
    'CP_VIEW_DASHBOARD', 'CP_VIEW_PROCESSES', 'CP_APPROVE_PROCESS', 'CP_DELETE_PROCESS',
    'CP_VIEW_EVALUATIONS', 'CP_APPROVE_EVALUATION',
    'CP_VIEW_CONTRACTS', 'CP_CREATE_CONTRACT',
    'CP_VIEW_BIDDERS',
    'CP_AI_ASSISTANT', 'CP_AI_RISK_ANALYSIS',
    'CP_VIEW_REPORTS', 'CP_EXPORT_REPORTS'
  )
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_ADMINISTRADOR_CONTRATO: Contract management
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_CP_ADMINISTRADOR_CONTRATO'
  AND p.code IN (
    'CP_VIEW_DASHBOARD', 'CP_VIEW_PROCESSES',
    'CP_VIEW_CONTRACTS', 'CP_MANAGE_CONTRACT',
    'CP_VIEW_BIDDERS',
    'CP_AI_ASSISTANT', 'CP_AI_LEGAL_HELP',
    'CP_VIEW_REPORTS'
  )
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_JURIDICO: Legal review
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_CP_JURIDICO'
  AND p.code IN (
    'CP_VIEW_DASHBOARD', 'CP_VIEW_PROCESSES', 'CP_EDIT_PROCESS',
    'CP_VIEW_EVALUATIONS',
    'CP_VIEW_CONTRACTS',
    'CP_VIEW_BIDDERS',
    'CP_AI_ASSISTANT', 'CP_AI_LEGAL_HELP',
    'CP_VIEW_REPORTS'
  )
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_CP_SUPERVISOR: All CP permissions
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_CP_SUPERVISOR'
  AND p.module = 'COMPRAS_PUBLICAS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ROLE_ADMIN also gets all CP permissions
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN'
  AND p.module = 'COMPRAS_PUBLICAS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- =====================================================
-- 4. CREATE TEST USERS
-- =====================================================
-- Password: Test123! (BCrypt encoded)

INSERT IGNORE INTO user_read_model (
    username, email, name, password, enabled,
    account_non_expired, account_non_locked, credentials_non_expired,
    identity_provider, user_type, preferred_language, approval_status, created_at
) VALUES
    ('cp.analista', 'analista@compraspublicas.gob.ec', 'Ana Rodríguez',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.comision1', 'comision1@compraspublicas.gob.ec', 'Carlos Méndez',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.comision2', 'comision2@compraspublicas.gob.ec', 'María Fernanda López',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.comision3', 'comision3@compraspublicas.gob.ec', 'José Luis Herrera',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.director', 'director@compraspublicas.gob.ec', 'Roberto Andrade',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.maxima', 'maxima.autoridad@compraspublicas.gob.ec', 'Patricia Vega',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.admin.contrato', 'admincontrato@compraspublicas.gob.ec', 'Fernando Salazar',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.juridico', 'juridico@compraspublicas.gob.ec', 'Gabriela Morales',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW()),

    ('cp.supervisor', 'supervisor@compraspublicas.gob.ec', 'Miguel Ángel Torres',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3wPdPLIQ1Y.PfFSN5Uf2',
     TRUE, TRUE, TRUE, TRUE, 'LOCAL', 'INTERNAL', 'es', 'APPROVED', NOW());

-- =====================================================
-- 5. ASSIGN ROLES TO USERS
-- =====================================================

-- Analista
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.analista' AND r.name = 'ROLE_CP_ANALISTA';

-- Comisión (3 members)
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.comision1' AND r.name = 'ROLE_CP_COMISION';

INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.comision2' AND r.name = 'ROLE_CP_COMISION';

INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.comision3' AND r.name = 'ROLE_CP_COMISION';

-- Director
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.director' AND r.name = 'ROLE_CP_DIRECTOR';

-- Máxima Autoridad
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.maxima' AND r.name = 'ROLE_CP_MAXIMA_AUTORIDAD';

-- Administrador de Contrato
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.admin.contrato' AND r.name = 'ROLE_CP_ADMINISTRADOR_CONTRATO';

-- Jurídico
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.juridico' AND r.name = 'ROLE_CP_JURIDICO';

-- Supervisor
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT u.id, r.id FROM user_read_model u, role_read_model r
WHERE u.username = 'cp.supervisor' AND r.name = 'ROLE_CP_SUPERVISOR';

-- =====================================================
-- 6. CREATE CP MENU ITEMS
-- =====================================================

-- Main CP Section
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
VALUES ('SECTION_CP', NULL, 'menu.section.comprasPublicas', NULL, NULL, 15, TRUE, TRUE, 'system')
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key);

-- CP Dashboard
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_DASHBOARD', id, 'menu.cp.dashboard', 'LayoutDashboard', '/cp/dashboard', 151, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- CP Processes
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_PROCESSES', id, 'menu.cp.processes', 'FileText', '/cp/processes', 152, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- CP Evaluations
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_EVALUATIONS', id, 'menu.cp.evaluations', 'ClipboardCheck', '/cp/evaluations', 153, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- CP Contracts
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_CONTRACTS', id, 'menu.cp.contracts', 'FileSignature', '/cp/contracts', 154, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- CP Bidders
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_BIDDERS', id, 'menu.cp.bidders', 'Users', '/cp/bidders', 155, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- CP AI Assistant
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_AI_ASSISTANT', id, 'menu.cp.aiAssistant', 'Bot', '/cp/ai-assistant', 156, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- CP Reports
INSERT INTO menu_item (code, parent_id, label_key, icon, path, display_order, is_section, is_active, created_by)
SELECT 'CP_REPORTS', id, 'menu.cp.reports', 'BarChart3', '/cp/reports', 157, FALSE, TRUE, 'system'
FROM menu_item WHERE code = 'SECTION_CP'
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), path = VALUES(path);

-- =====================================================
-- 7. MENU ITEM PERMISSIONS
-- =====================================================

-- CP Dashboard
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_DASHBOARD'
FROM menu_item m WHERE m.code = 'CP_DASHBOARD'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- CP Processes
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_PROCESSES'
FROM menu_item m WHERE m.code = 'CP_PROCESSES'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- CP Evaluations
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_EVALUATIONS'
FROM menu_item m WHERE m.code = 'CP_EVALUATIONS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- CP Contracts
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_CONTRACTS'
FROM menu_item m WHERE m.code = 'CP_CONTRACTS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- CP Bidders
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_BIDDERS'
FROM menu_item m WHERE m.code = 'CP_BIDDERS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- CP AI Assistant
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_AI_ASSISTANT'
FROM menu_item m WHERE m.code = 'CP_AI_ASSISTANT'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- CP Reports
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CP_VIEW_REPORTS'
FROM menu_item m WHERE m.code = 'CP_REPORTS'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- =====================================================
-- 8. ADD API ENDPOINTS FOR CP
-- =====================================================

INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by) VALUES
    ('CP_AI_LEGAL', 'POST', '/api/compras-publicas/ai/legal-help', 'Consulta legal con IA', 'COMPRAS_PUBLICAS', FALSE, TRUE, 'system'),
    ('CP_AI_PRICE', 'POST', '/api/compras-publicas/ai/analyze-price', 'Análisis de precios con IA', 'COMPRAS_PUBLICAS', FALSE, TRUE, 'system'),
    ('CP_AI_RISK', 'POST', '/api/compras-publicas/ai/analyze-risks', 'Análisis de riesgos con IA', 'COMPRAS_PUBLICAS', FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =====================================================
-- 9. API ENDPOINT PERMISSIONS
-- =====================================================

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'CP_AI_LEGAL_HELP'
FROM api_endpoint e WHERE e.code = 'CP_AI_LEGAL'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'CP_AI_PRICE_ANALYSIS'
FROM api_endpoint e WHERE e.code = 'CP_AI_PRICE'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'CP_AI_RISK_ANALYSIS'
FROM api_endpoint e WHERE e.code = 'CP_AI_RISK'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- =====================================================
-- 10. LINK MENU ITEMS TO API ENDPOINTS
-- =====================================================

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e
WHERE m.code = 'CP_AI_ASSISTANT' AND e.code = 'CP_AI_LEGAL'
ON DUPLICATE KEY UPDATE api_endpoint_id = VALUES(api_endpoint_id);

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e
WHERE m.code = 'CP_AI_ASSISTANT' AND e.code = 'CP_AI_PRICE'
ON DUPLICATE KEY UPDATE api_endpoint_id = VALUES(api_endpoint_id);

INSERT INTO menu_item_api_endpoint (menu_item_id, api_endpoint_id)
SELECT m.id, e.id
FROM menu_item m, api_endpoint e
WHERE m.code = 'CP_AI_ASSISTANT' AND e.code = 'CP_AI_RISK'
ON DUPLICATE KEY UPDATE api_endpoint_id = VALUES(api_endpoint_id);

-- =====================================================
-- 11. UPDATE I18N KEYS (Spanish)
-- =====================================================

-- These should be added to the frontend i18n files
-- menu.section.comprasPublicas = "Compras Públicas"
-- menu.cp.dashboard = "Dashboard CP"
-- menu.cp.processes = "Procesos"
-- menu.cp.evaluations = "Evaluaciones"
-- menu.cp.contracts = "Contratos"
-- menu.cp.bidders = "Oferentes"
-- menu.cp.aiAssistant = "Asistente IA"
-- menu.cp.reports = "Reportes"
