-- =============================================================================
-- Migration V206: Stage Roles and Approval Chain for Client Request Workflow
-- Creates permission configuration per stage and multi-level approval tracking
-- All configuration is database-driven (no hardcode) following CQRS pattern
-- =============================================================================

-- ============================================
-- 1. Stage Role Assignment Table
-- Defines which roles can perform actions on each processing stage
-- ============================================

CREATE TABLE IF NOT EXISTS stage_role_assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_code VARCHAR(50) NOT NULL COMMENT 'Processing stage code (RECEPCION, VALIDACION, etc.)',
    role_name VARCHAR(50) NOT NULL COMMENT 'Role name (ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN)',

    -- Permissions for this role in this stage
    can_view BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Can view requests in this stage',
    can_execute BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Can execute/process requests in this stage',
    can_approve BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Can approve requests in this stage',
    can_reject BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Can reject requests in this stage',
    can_return BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Can return requests to client',

    -- Multi-level approval configuration
    approval_level INT DEFAULT NULL COMMENT 'Required approval level (1, 2, 3...) for multi-level approval',
    min_amount DECIMAL(18,2) DEFAULT NULL COMMENT 'Minimum amount threshold for this role to approve',
    max_amount DECIMAL(18,2) DEFAULT NULL COMMENT 'Maximum amount threshold for this role to approve',

    -- Metadata
    description VARCHAR(500) COMMENT 'Description of this role assignment',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Constraints
    UNIQUE KEY uk_stage_role (stage_code, role_name),
    INDEX idx_stage_code (stage_code),
    INDEX idx_role_name (role_name),
    INDEX idx_approval_level (approval_level),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Role permissions per processing stage - configurable via UI';

-- ============================================
-- 2. Stage Approval Chain Table
-- Tracks multi-level approvals for each request
-- ============================================

CREATE TABLE IF NOT EXISTS stage_approval_chain (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id CHAR(36) NOT NULL COMMENT 'FK to client_request',
    stage_code VARCHAR(50) NOT NULL COMMENT 'Processing stage requiring approval',
    approval_level INT NOT NULL COMMENT 'Level in approval chain (1, 2, 3...)',

    -- Required approver configuration
    required_role VARCHAR(50) NOT NULL COMMENT 'Role required to approve at this level',

    -- Approval status
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',

    -- Approver information (filled when approved/rejected)
    approved_by_user_id VARCHAR(100) COMMENT 'User ID who approved/rejected',
    approved_by_user_name VARCHAR(200) COMMENT 'User name who approved/rejected',
    approved_at TIMESTAMP NULL COMMENT 'When the approval/rejection occurred',

    -- Comments and details
    comments TEXT COMMENT 'Approval/rejection comments',

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    INDEX idx_request_id (request_id),
    INDEX idx_stage_code (stage_code),
    INDEX idx_status (status),
    INDEX idx_approval_level (approval_level),
    INDEX idx_required_role (required_role),

    CONSTRAINT fk_approval_chain_request
        FOREIGN KEY (request_id) REFERENCES client_request(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Multi-level approval chain tracking per request';

-- ============================================
-- 3. Seed Data: Stage Role Assignments
-- Configurable permissions per role per stage
-- ============================================

INSERT INTO stage_role_assignment (stage_code, role_name, can_view, can_execute, can_approve, can_reject, can_return, approval_level, description, created_by) VALUES
-- RECEPCION stage: Operators can process, anyone can view
('RECEPCION', 'ROLE_OPERATOR', TRUE, TRUE, FALSE, FALSE, TRUE, NULL, 'Operadores pueden recibir y procesar solicitudes', 'system'),
('RECEPCION', 'ROLE_MANAGER', TRUE, TRUE, FALSE, FALSE, TRUE, NULL, 'Supervisores pueden ver y procesar recepción', 'system'),
('RECEPCION', 'ROLE_ADMIN', TRUE, TRUE, FALSE, FALSE, TRUE, NULL, 'Administradores pueden ver y procesar recepción', 'system'),

-- VALIDACION stage: Operators execute validations, can reject/return
('VALIDACION', 'ROLE_OPERATOR', TRUE, TRUE, FALSE, TRUE, TRUE, NULL, 'Operadores ejecutan validaciones del sistema', 'system'),
('VALIDACION', 'ROLE_MANAGER', TRUE, TRUE, FALSE, TRUE, TRUE, NULL, 'Supervisores pueden ver y ejecutar validaciones', 'system'),
('VALIDACION', 'ROLE_ADMIN', TRUE, TRUE, FALSE, TRUE, TRUE, NULL, 'Administradores pueden ver y ejecutar validaciones', 'system'),

-- COMPLIANCE stage: Compliance officers execute, can reject/return
('COMPLIANCE', 'ROLE_OPERATOR', TRUE, FALSE, FALSE, FALSE, FALSE, NULL, 'Operadores solo pueden ver compliance', 'system'),
('COMPLIANCE', 'ROLE_COMPLIANCE', TRUE, TRUE, FALSE, TRUE, TRUE, NULL, 'Oficiales de compliance ejecutan screening', 'system'),
('COMPLIANCE', 'ROLE_MANAGER', TRUE, TRUE, FALSE, TRUE, TRUE, NULL, 'Supervisores pueden ejecutar compliance', 'system'),
('COMPLIANCE', 'ROLE_ADMIN', TRUE, TRUE, FALSE, TRUE, TRUE, NULL, 'Administradores pueden ejecutar compliance', 'system'),

-- APROBACION stage: Multi-level approval chain
('APROBACION', 'ROLE_OPERATOR', TRUE, TRUE, FALSE, FALSE, FALSE, 1, 'Operadores inician aprobación (nivel 1)', 'system'),
('APROBACION', 'ROLE_MANAGER', TRUE, TRUE, TRUE, TRUE, FALSE, 2, 'Supervisores aprueban nivel 2', 'system'),
('APROBACION', 'ROLE_ADMIN', TRUE, TRUE, TRUE, TRUE, FALSE, 3, 'Administradores aprobación final (nivel 3)', 'system'),

-- COMISIONES stage: Operators execute commission calculations
('COMISIONES', 'ROLE_OPERATOR', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Operadores calculan comisiones', 'system'),
('COMISIONES', 'ROLE_MANAGER', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Supervisores pueden calcular comisiones', 'system'),
('COMISIONES', 'ROLE_ADMIN', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Administradores pueden calcular comisiones', 'system'),

-- REGISTRO stage: Operators create operations
('REGISTRO', 'ROLE_OPERATOR', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Operadores registran operaciones', 'system'),
('REGISTRO', 'ROLE_MANAGER', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Supervisores pueden registrar operaciones', 'system'),
('REGISTRO', 'ROLE_ADMIN', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Administradores pueden registrar operaciones', 'system'),

-- FINALIZADO stage: View only
('FINALIZADO', 'ROLE_OPERATOR', TRUE, FALSE, FALSE, FALSE, FALSE, NULL, 'Operadores pueden ver solicitudes finalizadas', 'system'),
('FINALIZADO', 'ROLE_MANAGER', TRUE, FALSE, FALSE, FALSE, FALSE, NULL, 'Supervisores pueden ver solicitudes finalizadas', 'system'),
('FINALIZADO', 'ROLE_ADMIN', TRUE, FALSE, FALSE, FALSE, FALSE, NULL, 'Administradores pueden ver solicitudes finalizadas', 'system'),

-- RECHAZADO stage: View only
('RECHAZADO', 'ROLE_OPERATOR', TRUE, FALSE, FALSE, FALSE, FALSE, NULL, 'Operadores pueden ver solicitudes rechazadas', 'system'),
('RECHAZADO', 'ROLE_MANAGER', TRUE, FALSE, FALSE, FALSE, FALSE, NULL, 'Supervisores pueden ver solicitudes rechazadas', 'system'),
('RECHAZADO', 'ROLE_ADMIN', TRUE, FALSE, FALSE, FALSE, FALSE, NULL, 'Administradores pueden ver solicitudes rechazadas', 'system'),

-- DEVUELTO stage: Can be re-processed
('DEVUELTO', 'ROLE_OPERATOR', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Operadores pueden re-procesar solicitudes devueltas', 'system'),
('DEVUELTO', 'ROLE_MANAGER', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Supervisores pueden re-procesar solicitudes devueltas', 'system'),
('DEVUELTO', 'ROLE_ADMIN', TRUE, TRUE, FALSE, FALSE, FALSE, NULL, 'Administradores pueden re-procesar solicitudes devueltas', 'system')
ON DUPLICATE KEY UPDATE
    can_view = VALUES(can_view),
    can_execute = VALUES(can_execute),
    can_approve = VALUES(can_approve),
    can_reject = VALUES(can_reject),
    can_return = VALUES(can_return),
    approval_level = VALUES(approval_level),
    description = VALUES(description);

-- ============================================
-- 4. External API Configurations for Validations
-- Core Banking validations executed in VALIDACION stage
-- ============================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
-- Core Banking Validations
('CORE_BANKING_CLIENT_CHECK', 'Verificación Cliente en Core', 'Verifica que el cliente existe y está activo en el sistema core bancario',
 '#{env.CORE_BANKING_URL}', '/api/v1/clients/#{clientId}/status', 'GET', 'application/json', 10000, 2, TRUE, 'PRODUCTION', 'system'),

('CORE_BANKING_CREDIT_LINE', 'Verificación Línea de Crédito', 'Verifica que el cliente tiene línea de crédito vigente para el producto',
 '#{env.CORE_BANKING_URL}', '/api/v1/clients/#{clientId}/credit-lines/#{productType}', 'GET', 'application/json', 10000, 2, TRUE, 'PRODUCTION', 'system'),

('CORE_BANKING_LIMIT_CHECK', 'Verificación de Límites', 'Verifica que el monto solicitado está dentro de los límites aprobados',
 '#{env.CORE_BANKING_URL}', '/api/v1/clients/#{clientId}/limits/check', 'POST', 'application/json', 10000, 2, TRUE, 'PRODUCTION', 'system'),

('CORE_BANKING_BLOCKS_CHECK', 'Verificación de Bloqueos', 'Verifica que el cliente no tiene bloqueos operativos activos',
 '#{env.CORE_BANKING_URL}', '/api/v1/clients/#{clientId}/blocks', 'GET', 'application/json', 10000, 2, TRUE, 'PRODUCTION', 'system'),

('CORE_BANKING_ACCOUNT_CHECK', 'Verificación Cuenta Destino', 'Verifica que la cuenta de destino existe y está activa',
 '#{env.CORE_BANKING_URL}', '/api/v1/accounts/#{accountNumber}/status', 'GET', 'application/json', 10000, 2, TRUE, 'PRODUCTION', 'system')

ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    base_url = VALUES(base_url),
    path = VALUES(path);

-- ============================================
-- 5. External API Configurations for Compliance/Screening
-- Executed in COMPLIANCE stage
-- ============================================

INSERT INTO external_api_config_read_model (code, name, description, base_url, path, http_method, content_type, timeout_ms, retry_count, active, environment, created_by) VALUES
-- Screening Lists
('SCREENING_OFAC_SDN', 'Lista OFAC SDN', 'Verificación contra lista OFAC SDN (Specially Designated Nationals)',
 '#{env.SCREENING_API_URL}', '/api/v1/screening/ofac/sdn', 'POST', 'application/json', 30000, 3, TRUE, 'PRODUCTION', 'system'),

('SCREENING_UN_CONSOLIDATED', 'Lista ONU Consolidada', 'Verificación contra lista consolidada de sanciones ONU',
 '#{env.SCREENING_API_URL}', '/api/v1/screening/un/consolidated', 'POST', 'application/json', 30000, 3, TRUE, 'PRODUCTION', 'system'),

('SCREENING_UAFE_NACIONAL', 'Lista UAFE Nacional', 'Verificación contra lista nacional UAFE (Unidad de Análisis Financiero)',
 '#{env.SCREENING_API_URL}', '/api/v1/screening/uafe/national', 'POST', 'application/json', 30000, 3, TRUE, 'PRODUCTION', 'system'),

('SCREENING_INTERNAL_LIST', 'Lista Interna Banco', 'Verificación contra lista interna de alto riesgo del banco',
 '#{env.SCREENING_API_URL}', '/api/v1/screening/internal', 'POST', 'application/json', 15000, 2, TRUE, 'PRODUCTION', 'system'),

('SCREENING_PEPS', 'Lista PEPs', 'Verificación contra lista de Personas Expuestas Políticamente',
 '#{env.SCREENING_API_URL}', '/api/v1/screening/peps', 'POST', 'application/json', 30000, 3, TRUE, 'PRODUCTION', 'system'),

('SCREENING_ADVERSE_MEDIA', 'Medios Adversos', 'Verificación en medios adversos y noticias negativas',
 '#{env.SCREENING_API_URL}', '/api/v1/screening/adverse-media', 'POST', 'application/json', 45000, 2, TRUE, 'PRODUCTION', 'system')

ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    base_url = VALUES(base_url),
    path = VALUES(path);

-- ============================================
-- 6. Request Templates for Validation APIs
-- ============================================

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, variable_mappings_json, is_default, active)
SELECT
    c.id,
    'Default Template',
    'Template por defecto para verificación de límites',
    '{"clientId": "#{clientId}", "productType": "#{productType}", "amount": #{amount}, "currency": "#{currency}"}',
    '{"clientId": "request.clientId", "productType": "request.productType", "amount": "request.amount", "currency": "request.currency"}',
    TRUE,
    TRUE
FROM external_api_config_read_model c
WHERE c.code = 'CORE_BANKING_LIMIT_CHECK'
ON DUPLICATE KEY UPDATE body_template = VALUES(body_template);

-- ============================================
-- 7. Request Templates for Screening APIs
-- ============================================

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, variable_mappings_json, is_default, active)
SELECT
    c.id,
    'Screening Request Template',
    'Template para screening de cliente',
    '{"searchType": "EXACT", "entity": {"name": "#{clientName}", "identification": "#{clientIdentification}", "identificationType": "#{identificationType}", "countryCode": "#{countryCode}"}, "threshold": 85}',
    '{"clientName": "request.clientName", "clientIdentification": "request.clientIdentification", "identificationType": "request.identificationType", "countryCode": "request.countryCode"}',
    TRUE,
    TRUE
FROM external_api_config_read_model c
WHERE c.code IN ('SCREENING_OFAC_SDN', 'SCREENING_UN_CONSOLIDATED', 'SCREENING_UAFE_NACIONAL', 'SCREENING_INTERNAL_LIST', 'SCREENING_PEPS')
ON DUPLICATE KEY UPDATE body_template = VALUES(body_template);

-- ============================================
-- 8. Response Configurations for APIs
-- ============================================

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, success_expected_value, error_message_path, extraction_mappings_json)
SELECT
    c.id,
    '200,201',
    'JSON',
    '$.status',
    'OK',
    '$.error.message',
    '{"isValid": "$.data.isValid", "message": "$.data.message", "details": "$.data.details"}'
FROM external_api_config_read_model c
WHERE c.code LIKE 'CORE_BANKING_%'
ON DUPLICATE KEY UPDATE success_field_path = VALUES(success_field_path);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, success_expected_value, error_message_path, extraction_mappings_json)
SELECT
    c.id,
    '200',
    'JSON',
    '$.searchComplete',
    'true',
    '$.error',
    '{"matchFound": "$.matchFound", "matchScore": "$.matchScore", "matchedRecords": "$.matches", "riskLevel": "$.riskLevel"}'
FROM external_api_config_read_model c
WHERE c.code LIKE 'SCREENING_%'
ON DUPLICATE KEY UPDATE success_field_path = VALUES(success_field_path);

-- ============================================
-- 9. Event Rules for VALIDACION Stage
-- Execute validation APIs when transitioning to VALIDACION
-- ============================================

INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(300, 'CLIENT_REQUEST_VALIDACION', 'Validaciones de Solicitud de Cliente',
 'Ejecuta validaciones del core bancario al pasar a etapa de Validación',
 'CLIENT_REQUEST', 'INTERNAL_VALIDACION',
 '[
   {"tipo":"API_CALL","orden":1,"async":false,"continueOnError":true,"config":{"apiConfigCode":"CORE_BANKING_CLIENT_CHECK","description":"Verificar cliente en core bancario"}},
   {"tipo":"API_CALL","orden":2,"async":false,"continueOnError":true,"config":{"apiConfigCode":"CORE_BANKING_CREDIT_LINE","description":"Verificar línea de crédito"}},
   {"tipo":"API_CALL","orden":3,"async":false,"continueOnError":true,"config":{"apiConfigCode":"CORE_BANKING_LIMIT_CHECK","description":"Verificar límites de monto"}},
   {"tipo":"API_CALL","orden":4,"async":false,"continueOnError":true,"config":{"apiConfigCode":"CORE_BANKING_BLOCKS_CHECK","description":"Verificar bloqueos operativos"}},
   {"tipo":"API_CALL","orden":5,"async":false,"continueOnError":true,"config":{"apiConfigCode":"CORE_BANKING_ACCOUNT_CHECK","description":"Verificar cuenta destino"}},
   {"tipo":"AUDITORIA","orden":6,"async":true,"continueOnError":true,"config":{"categoria":"VALIDACION_EJECUTADA","severidad":"INFO","mensaje":"Validaciones del core bancario ejecutadas"}}
 ]',
 10, TRUE, NOW(), 'system', 'RULE-CLIENT_REQUEST_VALIDACION', 1)
ON DUPLICATE KEY UPDATE actions_json = VALUES(actions_json), name = VALUES(name);

-- ============================================
-- 10. Event Rules for COMPLIANCE Stage
-- Execute screening APIs when transitioning to COMPLIANCE
-- ============================================

INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(301, 'CLIENT_REQUEST_COMPLIANCE', 'Compliance y Screening de Solicitud',
 'Ejecuta screening contra listas de control al pasar a etapa de Compliance',
 'CLIENT_REQUEST', 'INTERNAL_COMPLIANCE',
 '[
   {"tipo":"API_CALL","orden":1,"async":false,"continueOnError":true,"config":{"apiConfigCode":"SCREENING_OFAC_SDN","description":"Screening lista OFAC SDN"}},
   {"tipo":"API_CALL","orden":2,"async":false,"continueOnError":true,"config":{"apiConfigCode":"SCREENING_UN_CONSOLIDATED","description":"Screening lista ONU"}},
   {"tipo":"API_CALL","orden":3,"async":false,"continueOnError":true,"config":{"apiConfigCode":"SCREENING_UAFE_NACIONAL","description":"Screening lista UAFE"}},
   {"tipo":"API_CALL","orden":4,"async":false,"continueOnError":true,"config":{"apiConfigCode":"SCREENING_INTERNAL_LIST","description":"Screening lista interna"}},
   {"tipo":"API_CALL","orden":5,"async":false,"continueOnError":true,"config":{"apiConfigCode":"SCREENING_PEPS","description":"Screening PEPs"}},
   {"tipo":"AUDITORIA","orden":6,"async":true,"continueOnError":true,"config":{"categoria":"COMPLIANCE_EJECUTADO","severidad":"INFO","mensaje":"Screening de compliance ejecutado"}}
 ]',
 10, TRUE, NOW(), 'system', 'RULE-CLIENT_REQUEST_COMPLIANCE', 1)
ON DUPLICATE KEY UPDATE actions_json = VALUES(actions_json), name = VALUES(name);

-- ============================================
-- 11. Event Rules for APROBACION Stage
-- Notifications when entering approval stage
-- ============================================

INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(302, 'CLIENT_REQUEST_APROBACION', 'Notificación de Aprobación Pendiente',
 'Notifica a aprobadores cuando una solicitud entra en etapa de aprobación',
 'CLIENT_REQUEST', 'INTERNAL_APROBACION',
 '[
   {"tipo":"EMAIL","orden":1,"async":true,"continueOnError":true,"config":{"templateCode":"APPROVAL_PENDING","recipients":"#{approvers}","subject":"Solicitud #{requestNumber} pendiente de aprobación"}},
   {"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"APROBACION_INICIADA","severidad":"INFO","mensaje":"Solicitud enviada a cadena de aprobación"}}
 ]',
 10, TRUE, NOW(), 'system', 'RULE-CLIENT_REQUEST_APROBACION', 1)
ON DUPLICATE KEY UPDATE actions_json = VALUES(actions_json), name = VALUES(name);

-- ============================================
-- 12. Event Rules for COMISIONES Stage
-- Calculate commissions
-- ============================================

INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(303, 'CLIENT_REQUEST_COMISIONES', 'Cálculo de Comisiones',
 'Calcula comisiones aplicables a la operación',
 'CLIENT_REQUEST', 'INTERNAL_COMISIONES',
 '[
   {"tipo":"API_CALL","orden":1,"async":false,"continueOnError":false,"config":{"apiConfigCode":"CORE_BANKING_COMMISSIONS","description":"Calcular comisiones en core bancario"}},
   {"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"COMISIONES_CALCULADAS","severidad":"INFO","mensaje":"Comisiones calculadas para la operación"}}
 ]',
 10, TRUE, NOW(), 'system', 'RULE-CLIENT_REQUEST_COMISIONES', 1)
ON DUPLICATE KEY UPDATE actions_json = VALUES(actions_json), name = VALUES(name);

-- ============================================
-- 13. Event Rules for FINALIZADO Stage
-- Final notifications
-- ============================================

INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(304, 'CLIENT_REQUEST_FINALIZADO', 'Notificación de Solicitud Completada',
 'Notifica al cliente que su solicitud fue procesada exitosamente',
 'CLIENT_REQUEST', 'INTERNAL_FINALIZADO',
 '[
   {"tipo":"EMAIL","orden":1,"async":true,"continueOnError":true,"config":{"templateCode":"REQUEST_COMPLETED","recipients":"#{clientEmail}","subject":"Su solicitud #{requestNumber} ha sido procesada"}},
   {"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"SOLICITUD_COMPLETADA","severidad":"INFO","mensaje":"Procesamiento interno completado"}}
 ]',
 10, TRUE, NOW(), 'system', 'RULE-CLIENT_REQUEST_FINALIZADO', 1)
ON DUPLICATE KEY UPDATE actions_json = VALUES(actions_json), name = VALUES(name);

-- ============================================
-- 14. Event Rules for RECHAZADO Stage
-- Rejection notifications
-- ============================================

INSERT INTO event_rules_read_model (id, code, name, description, operation_type, trigger_event, actions_json, priority, active, created_at, created_by, aggregate_id, version) VALUES
(305, 'CLIENT_REQUEST_RECHAZADO', 'Notificación de Solicitud Rechazada',
 'Notifica al cliente que su solicitud fue rechazada',
 'CLIENT_REQUEST', 'INTERNAL_RECHAZADO',
 '[
   {"tipo":"EMAIL","orden":1,"async":true,"continueOnError":true,"config":{"templateCode":"REQUEST_REJECTED","recipients":"#{clientEmail}","subject":"Su solicitud #{requestNumber} ha sido rechazada"}},
   {"tipo":"AUDITORIA","orden":2,"async":true,"continueOnError":true,"config":{"categoria":"SOLICITUD_RECHAZADA","severidad":"WARNING","mensaje":"Solicitud rechazada"}}
 ]',
 10, TRUE, NOW(), 'system', 'RULE-CLIENT_REQUEST_RECHAZADO', 1)
ON DUPLICATE KEY UPDATE actions_json = VALUES(actions_json), name = VALUES(name);

-- ============================================
-- 15. Add ROLE_COMPLIANCE permission if not exists
-- ============================================

INSERT INTO permission_read_model (code, name, description, module, created_at) VALUES
('CAN_EXECUTE_COMPLIANCE', 'Ejecutar Compliance', 'Permite ejecutar verificaciones de compliance', 'CLIENT_PORTAL', NOW()),
('CAN_VIEW_APPROVAL_CHAIN', 'Ver Cadena de Aprobación', 'Permite ver el estado de la cadena de aprobación', 'CLIENT_PORTAL', NOW()),
('CAN_APPROVE_REQUESTS', 'Aprobar Solicitudes', 'Permite aprobar solicitudes en la cadena de aprobación', 'CLIENT_PORTAL', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Assign permissions to roles
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_APPROVAL_CHAIN'
FROM role_read_model r
WHERE r.name IN ('ROLE_OPERATOR', 'ROLE_MANAGER', 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_APPROVE_REQUESTS'
FROM role_read_model r
WHERE r.name IN ('ROLE_MANAGER', 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_EXECUTE_COMPLIANCE'
FROM role_read_model r
WHERE r.name IN ('ROLE_COMPLIANCE', 'ROLE_MANAGER', 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ============================================
-- 16. Approval Chain Configuration View (for easy querying)
-- ============================================

CREATE OR REPLACE VIEW v_stage_approval_config AS
SELECT
    sra.stage_code,
    sra.role_name,
    sra.approval_level,
    sra.can_view,
    sra.can_execute,
    sra.can_approve,
    sra.can_reject,
    sra.can_return,
    sra.min_amount,
    sra.max_amount,
    sra.description
FROM stage_role_assignment sra
WHERE sra.is_active = TRUE
ORDER BY sra.stage_code, sra.approval_level, sra.role_name;

-- ============================================
-- 17. Pending Approvals View (for dashboard)
-- ============================================

CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
    sac.request_id,
    cr.request_number,
    cr.client_name,
    cr.product_type,
    cr.amount,
    cr.currency,
    sac.stage_code,
    sac.approval_level,
    sac.required_role,
    sac.status,
    sac.created_at as pending_since
FROM stage_approval_chain sac
INNER JOIN client_request_readmodel cr ON cr.id = sac.request_id
WHERE sac.status = 'PENDING'
ORDER BY sac.created_at ASC;

-- ============================================
-- 18. Menu Item for Workflow Configuration
-- Accessible by ROLE_MANAGER and ROLE_ADMIN
-- ============================================

-- Get the parent ID for ADMINISTRATION menu
SET @admin_parent_id = (SELECT id FROM menu_item WHERE code = 'ADMINISTRATION' LIMIT 1);

-- Add menu item for Workflow Configuration under Administration
INSERT INTO menu_item (
    code,
    parent_id,
    label_key,
    icon,
    path,
    display_order,
    is_section,
    is_active,
    created_at,
    created_by
) VALUES (
    'WORKFLOW_CONFIG',
    @admin_parent_id,
    'menu.admin.workflowConfig',
    'FiCpu',
    '/admin/workflow-config',
    70,
    FALSE,
    TRUE,
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    label_key = VALUES(label_key),
    icon = VALUES(icon),
    path = VALUES(path),
    display_order = VALUES(display_order);

-- Create permission for workflow configuration
INSERT INTO permission_read_model (code, name, description, module, created_at) VALUES
('CAN_VIEW_WORKFLOW_CONFIG', 'Ver Configuracion de Workflow', 'Permite ver la configuracion del workflow de solicitudes', 'ADMIN', NOW()),
('CAN_EDIT_WORKFLOW_CONFIG', 'Editar Configuracion de Workflow', 'Permite editar la configuracion del workflow de solicitudes', 'ADMIN', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Link menu to permission
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'CAN_VIEW_WORKFLOW_CONFIG'
FROM menu_item m
WHERE m.code = 'WORKFLOW_CONFIG'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign permission to ROLE_MANAGER and ROLE_ADMIN
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_WORKFLOW_CONFIG'
FROM role_read_model r
WHERE r.name IN ('ROLE_MANAGER', 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_EDIT_WORKFLOW_CONFIG'
FROM role_read_model r
WHERE r.name IN ('ROLE_ADMIN')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- ============================================
-- 19. i18n Labels (skipped - i18n_label table handled in frontend)
-- ============================================
