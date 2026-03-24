-- =============================================================================
-- Migration V177: Client Portal - Event Types and Approval Flows
-- Configures events and workflows for client request approval
-- Uses existing event framework tables - no new tables created
-- =============================================================================

-- ============================================
-- 0. Clean up existing CLIENT_REQUEST data (idempotent)
-- ============================================
DELETE FROM event_flow_config_readmodel WHERE operation_type = 'CLIENT_REQUEST';
DELETE FROM event_type_config_readmodel WHERE operation_type = 'CLIENT_REQUEST';
DELETE FROM event_condition_config WHERE condition_code LIKE 'CLIENT_%';

-- ============================================
-- 1. Event Types for Client Portal
-- ============================================

-- English Event Types
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
-- Request Submitted
('CLIENT_REQUEST_SUBMITTED', 'CLIENT_REQUEST', 'en', 'Request Submitted',
 'Client has submitted a new request for review',
 'A client has completed and submitted a request through the portal. Review the details and documents.',
 NULL, NULL, '["DRAFT"]', '["ACTIVE"]', 'SUBMITTED', 'ACTIVE',
 'FiSend', 'blue', 1,
 'CLIENT', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Request Assigned
('CLIENT_REQUEST_ASSIGNED', 'CLIENT_REQUEST', 'en', 'Request Assigned',
 'Request has been assigned to a processor',
 'The request has been assigned to a bank officer for review and processing.',
 NULL, NULL, '["SUBMITTED"]', '["ACTIVE"]', 'IN_REVIEW', 'ACTIVE',
 'FiUserCheck', 'yellow', 2,
 'BANK', 'BANK', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Documents Requested
('CLIENT_REQUEST_DOCS_REQUESTED', 'CLIENT_REQUEST', 'en', 'Documents Requested',
 'Additional documents requested from client',
 'The reviewer has requested additional or corrected documents from the client.',
 NULL, NULL, '["IN_REVIEW"]', '["ACTIVE"]', 'PENDING_DOCUMENTS', 'ACTIVE',
 'FiFileText', 'orange', 3,
 'BANK', 'CLIENT', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Documents Uploaded
('CLIENT_REQUEST_DOCS_UPLOADED', 'CLIENT_REQUEST', 'en', 'Documents Uploaded',
 'Client has uploaded requested documents',
 'The client has uploaded the requested documents. Review them to continue processing.',
 NULL, NULL, '["PENDING_DOCUMENTS"]', '["ACTIVE"]', 'IN_REVIEW', 'ACTIVE',
 'FiUpload', 'blue', 4,
 'CLIENT', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Request Approved
('CLIENT_REQUEST_APPROVED', 'CLIENT_REQUEST', 'en', 'Request Approved',
 'Request has been approved and operation created',
 'The request has been approved. An operation will be created in the system.',
 NULL, NULL, '["IN_REVIEW"]', '["ACTIVE"]', 'APPROVED', 'ACTIVE',
 'FiCheckCircle', 'green', 5,
 'BANK', 'CLIENT', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Request Rejected
('CLIENT_REQUEST_REJECTED', 'CLIENT_REQUEST', 'en', 'Request Rejected',
 'Request has been rejected',
 'The request has been rejected. A rejection reason must be provided.',
 NULL, NULL, '["IN_REVIEW"]', '["ACTIVE"]', 'REJECTED', 'ACTIVE',
 'FiXCircle', 'red', 6,
 'BANK', 'CLIENT', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, TRUE, FALSE, NOW(), NOW()),

-- Request Cancelled
('CLIENT_REQUEST_CANCELLED', 'CLIENT_REQUEST', 'en', 'Request Cancelled',
 'Request has been cancelled by client',
 'The client has cancelled their request.',
 NULL, NULL, '["DRAFT", "SUBMITTED", "PENDING_DOCUMENTS"]', '["ACTIVE"]', 'CANCELLED', 'INACTIVE',
 'FiSlash', 'gray', 7,
 'CLIENT', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- Request Comment Added
('CLIENT_REQUEST_COMMENT', 'CLIENT_REQUEST', 'en', 'Comment Added',
 'A comment has been added to the request',
 'A new comment or note has been added to the request.',
 NULL, NULL, '["SUBMITTED", "IN_REVIEW", "PENDING_DOCUMENTS"]', '["ACTIVE"]', NULL, NULL,
 'FiMessageSquare', 'blue', 8,
 NULL, NULL, NULL, FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- SLA Warning
('CLIENT_REQUEST_SLA_WARNING', 'CLIENT_REQUEST', 'en', 'SLA Warning',
 'Request is approaching SLA deadline',
 'The request is approaching its SLA deadline. Prioritize processing.',
 NULL, NULL, '["SUBMITTED", "IN_REVIEW"]', '["ACTIVE"]', NULL, NULL,
 'FiAlertTriangle', 'orange', 9,
 'SYSTEM', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

-- SLA Breached
('CLIENT_REQUEST_SLA_BREACHED', 'CLIENT_REQUEST', 'en', 'SLA Breached',
 'Request has exceeded SLA deadline',
 'The request has exceeded its SLA deadline and requires immediate attention.',
 NULL, NULL, '["SUBMITTED", "IN_REVIEW"]', '["ACTIVE"]', NULL, NULL,
 'FiAlertOctagon', 'red', 10,
 'SYSTEM', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW());

-- Spanish Event Types
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('CLIENT_REQUEST_SUBMITTED', 'CLIENT_REQUEST', 'es', 'Solicitud Enviada',
 'El cliente ha enviado una nueva solicitud para revision',
 'Un cliente ha completado y enviado una solicitud a traves del portal. Revise los detalles y documentos.',
 NULL, NULL, '["DRAFT"]', '["ACTIVE"]', 'SUBMITTED', 'ACTIVE',
 'FiSend', 'blue', 1,
 'CLIENT', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_ASSIGNED', 'CLIENT_REQUEST', 'es', 'Solicitud Asignada',
 'La solicitud ha sido asignada a un procesador',
 'La solicitud ha sido asignada a un oficial del banco para revision y procesamiento.',
 NULL, NULL, '["SUBMITTED"]', '["ACTIVE"]', 'IN_REVIEW', 'ACTIVE',
 'FiUserCheck', 'yellow', 2,
 'BANK', 'BANK', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_DOCS_REQUESTED', 'CLIENT_REQUEST', 'es', 'Documentos Solicitados',
 'Se han solicitado documentos adicionales al cliente',
 'El revisor ha solicitado documentos adicionales o corregidos al cliente.',
 NULL, NULL, '["IN_REVIEW"]', '["ACTIVE"]', 'PENDING_DOCUMENTS', 'ACTIVE',
 'FiFileText', 'orange', 3,
 'BANK', 'CLIENT', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_DOCS_UPLOADED', 'CLIENT_REQUEST', 'es', 'Documentos Cargados',
 'El cliente ha cargado los documentos solicitados',
 'El cliente ha cargado los documentos solicitados. Reviselos para continuar el procesamiento.',
 NULL, NULL, '["PENDING_DOCUMENTS"]', '["ACTIVE"]', 'IN_REVIEW', 'ACTIVE',
 'FiUpload', 'blue', 4,
 'CLIENT', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_APPROVED', 'CLIENT_REQUEST', 'es', 'Solicitud Aprobada',
 'La solicitud ha sido aprobada y se creara la operacion',
 'La solicitud ha sido aprobada. Se creara una operacion en el sistema.',
 NULL, NULL, '["IN_REVIEW"]', '["ACTIVE"]', 'APPROVED', 'ACTIVE',
 'FiCheckCircle', 'green', 5,
 'BANK', 'CLIENT', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, TRUE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_REJECTED', 'CLIENT_REQUEST', 'es', 'Solicitud Rechazada',
 'La solicitud ha sido rechazada',
 'La solicitud ha sido rechazada. Se debe proporcionar un motivo de rechazo.',
 NULL, NULL, '["IN_REVIEW"]', '["ACTIVE"]', 'REJECTED', 'ACTIVE',
 'FiXCircle', 'red', 6,
 'BANK', 'CLIENT', 'SENDER', FALSE, 'CLIENT_PORTAL',
 TRUE, TRUE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_CANCELLED', 'CLIENT_REQUEST', 'es', 'Solicitud Cancelada',
 'La solicitud ha sido cancelada por el cliente',
 'El cliente ha cancelado su solicitud.',
 NULL, NULL, '["DRAFT", "SUBMITTED", "PENDING_DOCUMENTS"]', '["ACTIVE"]', 'CANCELLED', 'INACTIVE',
 'FiSlash', 'gray', 7,
 'CLIENT', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_COMMENT', 'CLIENT_REQUEST', 'es', 'Comentario Agregado',
 'Se ha agregado un comentario a la solicitud',
 'Se ha agregado un nuevo comentario o nota a la solicitud.',
 NULL, NULL, '["SUBMITTED", "IN_REVIEW", "PENDING_DOCUMENTS"]', '["ACTIVE"]', NULL, NULL,
 'FiMessageSquare', 'blue', 8,
 NULL, NULL, NULL, FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_SLA_WARNING', 'CLIENT_REQUEST', 'es', 'Advertencia de SLA',
 'La solicitud se acerca a la fecha limite del SLA',
 'La solicitud se acerca a su fecha limite de SLA. Priorice el procesamiento.',
 NULL, NULL, '["SUBMITTED", "IN_REVIEW"]', '["ACTIVE"]', NULL, NULL,
 'FiAlertTriangle', 'orange', 9,
 'SYSTEM', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('CLIENT_REQUEST_SLA_BREACHED', 'CLIENT_REQUEST', 'es', 'SLA Excedido',
 'La solicitud ha excedido la fecha limite del SLA',
 'La solicitud ha excedido su fecha limite de SLA y requiere atencion inmediata.',
 NULL, NULL, '["SUBMITTED", "IN_REVIEW"]', '["ACTIVE"]', NULL, NULL,
 'FiAlertOctagon', 'red', 10,
 'SYSTEM', 'BANK', 'RECEIVER', FALSE, 'CLIENT_PORTAL',
 TRUE, FALSE, FALSE, NOW(), NOW());

-- ============================================
-- 2. Conditions for Client Request Routing
-- ============================================

-- Amount-based conditions for routing (using OPERATION_FIELD type only)
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    entity_type, field_path, comparison_operator, comparison_value, comparison_value_type,
    category, operation_types, language, is_active, created_by
) VALUES
-- Small amount (< 100,000)
('CLIENT_AMOUNT_SMALL', 'Small Amount', 'Request amount is less than 100,000',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'amount', 'LESS_THAN', '100000', 'NUMBER',
 'AMOUNT', '["CLIENT_REQUEST"]', 'en', TRUE, 'system'),

('CLIENT_AMOUNT_SMALL', 'Monto Pequeno', 'El monto de la solicitud es menor a 100,000',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'amount', 'LESS_THAN', '100000', 'NUMBER',
 'AMOUNT', '["CLIENT_REQUEST"]', 'es', TRUE, 'system'),

-- Large amount (> 500,000)
('CLIENT_AMOUNT_LARGE', 'Large Amount', 'Request amount exceeds 500,000',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'amount', 'GREATER_THAN', '500000', 'NUMBER',
 'AMOUNT', '["CLIENT_REQUEST"]', 'en', TRUE, 'system'),

('CLIENT_AMOUNT_LARGE', 'Monto Grande', 'El monto de la solicitud excede 500,000',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'amount', 'GREATER_THAN', '500000', 'NUMBER',
 'AMOUNT', '["CLIENT_REQUEST"]', 'es', TRUE, 'system'),

-- Product type conditions
('CLIENT_PRODUCT_GUARANTEE', 'Product is Guarantee', 'Request is for a bank guarantee',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'product_type', 'EQUALS', 'GUARANTEE_REQUEST', 'STRING',
 'PRODUCT', '["CLIENT_REQUEST"]', 'en', TRUE, 'system'),

('CLIENT_PRODUCT_GUARANTEE', 'Producto es Garantia', 'La solicitud es para una garantia bancaria',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'product_type', 'EQUALS', 'GUARANTEE_REQUEST', 'STRING',
 'PRODUCT', '["CLIENT_REQUEST"]', 'es', TRUE, 'system'),

('CLIENT_PRODUCT_LC_IMPORT', 'Product is LC Import', 'Request is for an import letter of credit',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'product_type', 'EQUALS', 'LC_IMPORT_REQUEST', 'STRING',
 'PRODUCT', '["CLIENT_REQUEST"]', 'en', TRUE, 'system'),

('CLIENT_PRODUCT_LC_IMPORT', 'Producto es LC Importacion', 'La solicitud es para una carta de credito de importacion',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'product_type', 'EQUALS', 'LC_IMPORT_REQUEST', 'STRING',
 'PRODUCT', '["CLIENT_REQUEST"]', 'es', TRUE, 'system'),

-- Priority conditions
('CLIENT_PRIORITY_URGENT', 'Priority is Urgent', 'Request has urgent priority',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'priority', 'EQUALS', 'URGENT', 'STRING',
 'PRIORITY', '["CLIENT_REQUEST"]', 'en', TRUE, 'system'),

('CLIENT_PRIORITY_URGENT', 'Prioridad es Urgente', 'La solicitud tiene prioridad urgente',
 'OPERATION_FIELD', 'CLIENT_REQUEST', 'priority', 'EQUALS', 'URGENT', 'STRING',
 'PRIORITY', '["CLIENT_REQUEST"]', 'es', TRUE, 'system');

-- ============================================
-- 3. Approval Flow Configurations
-- ============================================

-- Flow: Submitted to Assigned (conditions handled in business logic)
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    conditions, is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('CLIENT_REQUEST', NULL, 'SUBMITTED', 'CLIENT_REQUEST_ASSIGNED',
 NULL,
 TRUE, FALSE, 1, 'en',
 'Assign to Processor', 'Assign request to a processor for review', TRUE),

('CLIENT_REQUEST', NULL, 'SUBMITTED', 'CLIENT_REQUEST_ASSIGNED',
 NULL,
 TRUE, FALSE, 1, 'es',
 'Asignar a Procesador', 'Asignar solicitud a un procesador para revision', TRUE),

-- Flow: Review to Approved
('CLIENT_REQUEST', 'CLIENT_REQUEST_ASSIGNED', 'IN_REVIEW', 'CLIENT_REQUEST_APPROVED',
 NULL, FALSE, TRUE, 2, 'en',
 'Approve Request', 'Approve the request and create operation', TRUE),

('CLIENT_REQUEST', 'CLIENT_REQUEST_ASSIGNED', 'IN_REVIEW', 'CLIENT_REQUEST_APPROVED',
 NULL, FALSE, TRUE, 2, 'es',
 'Aprobar Solicitud', 'Aprobar la solicitud y crear operacion', TRUE),

-- Flow: Review to Rejected
('CLIENT_REQUEST', 'CLIENT_REQUEST_ASSIGNED', 'IN_REVIEW', 'CLIENT_REQUEST_REJECTED',
 NULL, FALSE, TRUE, 3, 'en',
 'Reject Request', 'Reject the request with reason', TRUE),

('CLIENT_REQUEST', 'CLIENT_REQUEST_ASSIGNED', 'IN_REVIEW', 'CLIENT_REQUEST_REJECTED',
 NULL, FALSE, TRUE, 3, 'es',
 'Rechazar Solicitud', 'Rechazar la solicitud con motivo', TRUE),

-- Flow: Review to Pending Documents
('CLIENT_REQUEST', 'CLIENT_REQUEST_ASSIGNED', 'IN_REVIEW', 'CLIENT_REQUEST_DOCS_REQUESTED',
 NULL, FALSE, TRUE, 4, 'en',
 'Request Documents', 'Request additional documents from client', TRUE),

('CLIENT_REQUEST', 'CLIENT_REQUEST_ASSIGNED', 'IN_REVIEW', 'CLIENT_REQUEST_DOCS_REQUESTED',
 NULL, FALSE, TRUE, 4, 'es',
 'Solicitar Documentos', 'Solicitar documentos adicionales al cliente', TRUE),

-- Flow: Pending Documents to Review
('CLIENT_REQUEST', 'CLIENT_REQUEST_DOCS_UPLOADED', 'PENDING_DOCUMENTS', 'CLIENT_REQUEST_ASSIGNED',
 NULL, TRUE, FALSE, 5, 'en',
 'Resume Review', 'Continue reviewing after documents uploaded', TRUE),

('CLIENT_REQUEST', 'CLIENT_REQUEST_DOCS_UPLOADED', 'PENDING_DOCUMENTS', 'CLIENT_REQUEST_ASSIGNED',
 NULL, TRUE, FALSE, 5, 'es',
 'Continuar Revision', 'Continuar revision despues de cargar documentos', TRUE);

-- ============================================
-- 4. Approval Rules (SLA and Escalation)
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_approval_rule_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Rule identification
    rule_code VARCHAR(50) NOT NULL,
    rule_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key',

    -- Scope
    product_codes JSON NOT NULL COMMENT 'Applicable product codes',
    priority_levels JSON NULL COMMENT 'Applicable priority levels',

    -- Conditions
    condition_code VARCHAR(50) NULL COMMENT 'FK to event_condition_config',
    min_amount DECIMAL(18,2) NULL,
    max_amount DECIMAL(18,2) NULL,

    -- Approval configuration
    approval_sequence INT DEFAULT 1 COMMENT 'Order in approval chain',
    required_role VARCHAR(50) NOT NULL COMMENT 'Role that can approve',
    can_skip BOOLEAN DEFAULT FALSE COMMENT 'Can be skipped in certain conditions',

    -- SLA configuration
    sla_hours INT NOT NULL DEFAULT 24,
    sla_warning_percentage INT DEFAULT 75 COMMENT 'Warn at this % of SLA',
    sla_escalation_role VARCHAR(50) NULL COMMENT 'Escalate to this role on breach',
    sla_escalation_hours INT NULL COMMENT 'Additional hours after escalation',

    -- Notifications
    notify_on_assignment BOOLEAN DEFAULT TRUE,
    notify_on_sla_warning BOOLEAN DEFAULT TRUE,
    notify_on_sla_breach BOOLEAN DEFAULT TRUE,
    notification_template VARCHAR(50) NULL,

    -- Priority
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Indexes
    INDEX idx_rule_code (rule_code),
    INDEX idx_approval_sequence (approval_sequence),
    INDEX idx_required_role (required_role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Approval rules and SLA configuration for client requests';

-- Seed approval rules
INSERT INTO client_request_approval_rule_config (
    rule_code, rule_name_key, description_key,
    product_codes, priority_levels, condition_code, min_amount, max_amount,
    approval_sequence, required_role, can_skip,
    sla_hours, sla_warning_percentage, sla_escalation_role, sla_escalation_hours,
    notify_on_assignment, notify_on_sla_warning, notify_on_sla_breach, notification_template,
    display_order, is_active, created_by
) VALUES
-- Small Guarantee: Single approval, 24h SLA
('GUARANTEE_SMALL_APPROVAL', 'approval.rule.guaranteeSmall', 'approval.rule.guaranteeSmall.desc',
 '["GUARANTEE_REQUEST"]', '["NORMAL", "HIGH"]', 'CLIENT_AMOUNT_SMALL', NULL, 100000,
 1, 'ROLE_CLIENT_REQUEST_PROCESSOR', FALSE,
 24, 75, 'ROLE_CLIENT_REQUEST_SUPERVISOR', 8,
 TRUE, TRUE, TRUE, 'client_request_assigned',
 1, TRUE, 'system'),

-- Large Guarantee: Dual approval, 72h SLA
('GUARANTEE_LARGE_APPROVAL_1', 'approval.rule.guaranteeLargeStep1', 'approval.rule.guaranteeLargeStep1.desc',
 '["GUARANTEE_REQUEST"]', '["NORMAL", "HIGH", "URGENT"]', 'CLIENT_AMOUNT_LARGE', 500000, NULL,
 1, 'ROLE_CLIENT_REQUEST_PROCESSOR', FALSE,
 24, 75, 'ROLE_CLIENT_REQUEST_SUPERVISOR', 8,
 TRUE, TRUE, TRUE, 'client_request_assigned',
 3, TRUE, 'system'),

('GUARANTEE_LARGE_APPROVAL_2', 'approval.rule.guaranteeLargeStep2', 'approval.rule.guaranteeLargeStep2.desc',
 '["GUARANTEE_REQUEST"]', '["NORMAL", "HIGH", "URGENT"]', 'CLIENT_AMOUNT_LARGE', 500000, NULL,
 2, 'ROLE_CLIENT_REQUEST_APPROVER', FALSE,
 48, 75, 'ROLE_CLIENT_REQUEST_MANAGER', 24,
 TRUE, TRUE, TRUE, 'client_request_pending_approval',
 4, TRUE, 'system'),

-- LC Import
('LC_IMPORT_SMALL_APPROVAL', 'approval.rule.lcImportSmall', 'approval.rule.lcImportSmall.desc',
 '["LC_IMPORT_REQUEST"]', '["NORMAL", "HIGH"]', 'CLIENT_AMOUNT_SMALL', NULL, 100000,
 1, 'ROLE_CLIENT_REQUEST_PROCESSOR', FALSE,
 48, 75, 'ROLE_CLIENT_REQUEST_SUPERVISOR', 12,
 TRUE, TRUE, TRUE, 'client_request_assigned',
 5, TRUE, 'system'),

('LC_IMPORT_LARGE_APPROVAL_1', 'approval.rule.lcImportLargeStep1', 'approval.rule.lcImportLargeStep1.desc',
 '["LC_IMPORT_REQUEST"]', '["NORMAL", "HIGH", "URGENT"]', 'CLIENT_AMOUNT_LARGE', 500000, NULL,
 1, 'ROLE_CLIENT_REQUEST_PROCESSOR', FALSE,
 24, 75, 'ROLE_CLIENT_REQUEST_SUPERVISOR', 8,
 TRUE, TRUE, TRUE, 'client_request_assigned',
 6, TRUE, 'system'),

-- Urgent priority override
('URGENT_PRIORITY_OVERRIDE', 'approval.rule.urgentPriority', 'approval.rule.urgentPriority.desc',
 '["GUARANTEE_REQUEST", "LC_IMPORT_REQUEST", "LC_EXPORT_REQUEST", "COLLECTION_REQUEST"]', '["URGENT"]', 'CLIENT_PRIORITY_URGENT', NULL, NULL,
 1, 'ROLE_CLIENT_REQUEST_SUPERVISOR', FALSE,
 8, 50, 'ROLE_CLIENT_REQUEST_MANAGER', 4,
 TRUE, TRUE, TRUE, 'client_request_urgent',
 99, TRUE, 'system');

-- ============================================
-- 5. Assignment Queue Configuration
-- ============================================

CREATE TABLE IF NOT EXISTS client_request_assignment_queue_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    queue_code VARCHAR(50) NOT NULL,
    queue_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key',

    -- Scope
    product_codes JSON NOT NULL COMMENT 'Products handled by this queue',
    priority_levels JSON NULL COMMENT 'Priorities handled',

    -- Assignment settings
    assignment_strategy VARCHAR(30) DEFAULT 'ROUND_ROBIN' COMMENT 'ROUND_ROBIN, LEAST_LOADED, MANUAL',
    auto_assign BOOLEAN DEFAULT TRUE,
    max_concurrent_per_user INT DEFAULT 10,

    -- Eligible users (by role)
    eligible_roles JSON NOT NULL COMMENT 'Roles that can be assigned',

    -- Working hours for SLA calculation
    working_hours_start TIME DEFAULT '08:00:00',
    working_hours_end TIME DEFAULT '18:00:00',
    working_days JSON NULL COMMENT 'Default: MONDAY-FRIDAY',
    timezone VARCHAR(50) DEFAULT 'America/Guayaquil',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_queue_code (queue_code),

    -- Indexes
    INDEX idx_queue_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for request assignment queues';

-- Seed assignment queues
INSERT INTO client_request_assignment_queue_config (
    queue_code, queue_name_key, description_key,
    product_codes, priority_levels, assignment_strategy, auto_assign, max_concurrent_per_user,
    eligible_roles, working_hours_start, working_hours_end, working_days, timezone,
    is_active
) VALUES
('QUEUE_GUARANTEES', 'queue.guarantees.name', 'queue.guarantees.desc',
 '["GUARANTEE_REQUEST"]', '["NORMAL", "HIGH"]', 'ROUND_ROBIN', TRUE, 15,
 '["ROLE_CLIENT_REQUEST_PROCESSOR", "ROLE_CLIENT_REQUEST_SUPERVISOR"]',
 '08:00:00', '18:00:00', '["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]', 'America/Guayaquil',
 TRUE),

('QUEUE_LC_IMPORT', 'queue.lcImport.name', 'queue.lcImport.desc',
 '["LC_IMPORT_REQUEST"]', '["NORMAL", "HIGH"]', 'ROUND_ROBIN', TRUE, 10,
 '["ROLE_CLIENT_REQUEST_PROCESSOR", "ROLE_CLIENT_REQUEST_SUPERVISOR"]',
 '08:00:00', '18:00:00', '["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]', 'America/Guayaquil',
 TRUE),

('QUEUE_LC_EXPORT', 'queue.lcExport.name', 'queue.lcExport.desc',
 '["LC_EXPORT_REQUEST"]', '["NORMAL", "HIGH"]', 'ROUND_ROBIN', TRUE, 10,
 '["ROLE_CLIENT_REQUEST_PROCESSOR", "ROLE_CLIENT_REQUEST_SUPERVISOR"]',
 '08:00:00', '18:00:00', '["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]', 'America/Guayaquil',
 TRUE),

('QUEUE_COLLECTIONS', 'queue.collections.name', 'queue.collections.desc',
 '["COLLECTION_REQUEST"]', '["NORMAL", "HIGH"]', 'ROUND_ROBIN', TRUE, 20,
 '["ROLE_CLIENT_REQUEST_PROCESSOR", "ROLE_CLIENT_REQUEST_SUPERVISOR"]',
 '08:00:00', '18:00:00', '["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]', 'America/Guayaquil',
 TRUE),

('QUEUE_URGENT', 'queue.urgent.name', 'queue.urgent.desc',
 '["GUARANTEE_REQUEST", "LC_IMPORT_REQUEST", "LC_EXPORT_REQUEST", "COLLECTION_REQUEST"]', '["URGENT"]', 'LEAST_LOADED', TRUE, 5,
 '["ROLE_CLIENT_REQUEST_SUPERVISOR", "ROLE_CLIENT_REQUEST_MANAGER"]',
 '07:00:00', '20:00:00', '["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]', 'America/Guayaquil',
 TRUE);
