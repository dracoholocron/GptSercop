-- =============================================================================
-- Migration V134: Create template_variable table for dynamic action variables
-- =============================================================================
-- This table stores template variables that can be used in action configurations
-- Variables are populated from operation_readmodel and related tables
-- Labels and descriptions use i18n keys resolved by the UI

-- Create template_variable table
CREATE TABLE IF NOT EXISTS template_variable (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Variable code used in templates, e.g., applicantEmail',
    label_key VARCHAR(200) NOT NULL COMMENT 'i18n key for label, e.g., templateVar.applicant.email',
    description_key VARCHAR(200) COMMENT 'i18n key for description',
    category VARCHAR(50) NOT NULL COMMENT 'Category: OPERATION, AMOUNTS, APPLICANT, BENEFICIARY, BANKS, DATES, USER, SWIFT',
    color VARCHAR(20) NOT NULL DEFAULT 'gray' COMMENT 'UI color scheme: blue, green, purple, orange, cyan, red, gray, teal',
    source_table VARCHAR(100) NOT NULL COMMENT 'Source table name',
    source_column VARCHAR(100) NOT NULL COMMENT 'Source column name',
    data_type VARCHAR(50) NOT NULL DEFAULT 'STRING' COMMENT 'Data type: STRING, NUMBER, DATE, DATETIME, BOOLEAN, JSON',
    format_pattern VARCHAR(100) COMMENT 'Optional format pattern for dates/numbers',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Order within category',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    INDEX idx_template_variable_category (category),
    INDEX idx_template_variable_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Populate with variables from OPERATION_READMODEL and related tables
-- =============================================================================

-- Category: OPERATION (blue)
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order) VALUES
('operationId', 'templateVar.operation.operationId', 'templateVar.operation.operationId.desc', 'OPERATION', 'blue', 'operation_readmodel', 'operation_id', 'STRING', 1),
('reference', 'templateVar.operation.reference', 'templateVar.operation.reference.desc', 'OPERATION', 'blue', 'operation_readmodel', 'reference', 'STRING', 2),
('productType', 'templateVar.operation.productType', 'templateVar.operation.productType.desc', 'OPERATION', 'blue', 'operation_readmodel', 'product_type', 'STRING', 3),
('messageType', 'templateVar.operation.messageType', 'templateVar.operation.messageType.desc', 'OPERATION', 'blue', 'operation_readmodel', 'message_type', 'STRING', 4),
('stage', 'templateVar.operation.stage', 'templateVar.operation.stage.desc', 'OPERATION', 'blue', 'operation_readmodel', 'stage', 'STRING', 5),
('status', 'templateVar.operation.status', 'templateVar.operation.status.desc', 'OPERATION', 'blue', 'operation_readmodel', 'status', 'STRING', 6),
('creationMode', 'templateVar.operation.creationMode', 'templateVar.operation.creationMode.desc', 'OPERATION', 'blue', 'operation_readmodel', 'creation_mode', 'STRING', 7),
('amendmentCount', 'templateVar.operation.amendmentCount', 'templateVar.operation.amendmentCount.desc', 'OPERATION', 'blue', 'operation_readmodel', 'amendment_count', 'NUMBER', 8),
('messageCount', 'templateVar.operation.messageCount', 'templateVar.operation.messageCount.desc', 'OPERATION', 'blue', 'operation_readmodel', 'message_count', 'NUMBER', 9),
('version', 'templateVar.operation.version', 'templateVar.operation.version.desc', 'OPERATION', 'blue', 'operation_readmodel', 'version', 'NUMBER', 10);

-- Category: AMOUNTS (green)
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, format_pattern, display_order) VALUES
('currency', 'templateVar.amounts.currency', 'templateVar.amounts.currency.desc', 'AMOUNTS', 'green', 'operation_readmodel', 'currency', 'STRING', NULL, 1),
('amount', 'templateVar.amounts.amount', 'templateVar.amounts.amount.desc', 'AMOUNTS', 'green', 'operation_readmodel', 'amount', 'NUMBER', '#,##0.00', 2),
('formattedAmount', 'templateVar.amounts.formattedAmount', 'templateVar.amounts.formattedAmount.desc', 'AMOUNTS', 'green', 'operation_readmodel', 'amount', 'STRING', NULL, 3);

-- Category: APPLICANT (purple) - from participant_read_model via applicant_id
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order) VALUES
('applicantId', 'templateVar.applicant.id', 'templateVar.applicant.id.desc', 'APPLICANT', 'purple', 'participant_read_model', 'id', 'NUMBER', 1),
('applicantIdentification', 'templateVar.applicant.identification', 'templateVar.applicant.identification.desc', 'APPLICANT', 'purple', 'participant_read_model', 'identification', 'STRING', 2),
('applicantName', 'templateVar.applicant.name', 'templateVar.applicant.name.desc', 'APPLICANT', 'purple', 'operation_readmodel', 'applicant_name', 'STRING', 3),
('applicantFirstNames', 'templateVar.applicant.firstNames', 'templateVar.applicant.firstNames.desc', 'APPLICANT', 'purple', 'participant_read_model', 'first_names', 'STRING', 4),
('applicantLastNames', 'templateVar.applicant.lastNames', 'templateVar.applicant.lastNames.desc', 'APPLICANT', 'purple', 'participant_read_model', 'last_names', 'STRING', 5),
('applicantEmail', 'templateVar.applicant.email', 'templateVar.applicant.email.desc', 'APPLICANT', 'purple', 'participant_read_model', 'email', 'STRING', 6),
('applicantPhone', 'templateVar.applicant.phone', 'templateVar.applicant.phone.desc', 'APPLICANT', 'purple', 'participant_read_model', 'phone', 'STRING', 7),
('applicantAddress', 'templateVar.applicant.address', 'templateVar.applicant.address.desc', 'APPLICANT', 'purple', 'participant_read_model', 'address', 'STRING', 8),
('applicantAgency', 'templateVar.applicant.agency', 'templateVar.applicant.agency.desc', 'APPLICANT', 'purple', 'participant_read_model', 'agency', 'STRING', 9),
('applicantExecutive', 'templateVar.applicant.executive', 'templateVar.applicant.executive.desc', 'APPLICANT', 'purple', 'participant_read_model', 'assigned_executive', 'STRING', 10),
('applicantExecutiveEmail', 'templateVar.applicant.executiveEmail', 'templateVar.applicant.executiveEmail.desc', 'APPLICANT', 'purple', 'participant_read_model', 'executive_email', 'STRING', 11);

-- Category: BENEFICIARY (orange) - from participant_read_model via beneficiary_id
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order) VALUES
('beneficiaryId', 'templateVar.beneficiary.id', 'templateVar.beneficiary.id.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'id', 'NUMBER', 1),
('beneficiaryIdentification', 'templateVar.beneficiary.identification', 'templateVar.beneficiary.identification.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'identification', 'STRING', 2),
('beneficiaryName', 'templateVar.beneficiary.name', 'templateVar.beneficiary.name.desc', 'BENEFICIARY', 'orange', 'operation_readmodel', 'beneficiary_name', 'STRING', 3),
('beneficiaryFirstNames', 'templateVar.beneficiary.firstNames', 'templateVar.beneficiary.firstNames.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'first_names', 'STRING', 4),
('beneficiaryLastNames', 'templateVar.beneficiary.lastNames', 'templateVar.beneficiary.lastNames.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'last_names', 'STRING', 5),
('beneficiaryEmail', 'templateVar.beneficiary.email', 'templateVar.beneficiary.email.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'email', 'STRING', 6),
('beneficiaryPhone', 'templateVar.beneficiary.phone', 'templateVar.beneficiary.phone.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'phone', 'STRING', 7),
('beneficiaryAddress', 'templateVar.beneficiary.address', 'templateVar.beneficiary.address.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'address', 'STRING', 8),
('beneficiaryAgency', 'templateVar.beneficiary.agency', 'templateVar.beneficiary.agency.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'agency', 'STRING', 9),
('beneficiaryExecutive', 'templateVar.beneficiary.executive', 'templateVar.beneficiary.executive.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'assigned_executive', 'STRING', 10),
('beneficiaryExecutiveEmail', 'templateVar.beneficiary.executiveEmail', 'templateVar.beneficiary.executiveEmail.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'executive_email', 'STRING', 11);

-- Category: BANKS (cyan) - from financial_institution_readmodel
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order) VALUES
('issuingBankId', 'templateVar.banks.issuingBankId', 'templateVar.banks.issuingBankId.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'id', 'NUMBER', 1),
('issuingBankName', 'templateVar.banks.issuingBankName', 'templateVar.banks.issuingBankName.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'name', 'STRING', 2),
('issuingBankBic', 'templateVar.banks.issuingBankBic', 'templateVar.banks.issuingBankBic.desc', 'BANKS', 'cyan', 'operation_readmodel', 'issuing_bank_bic', 'STRING', 3),
('issuingBankCode', 'templateVar.banks.issuingBankCode', 'templateVar.banks.issuingBankCode.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'code', 'STRING', 4),
('issuingBankCountry', 'templateVar.banks.issuingBankCountry', 'templateVar.banks.issuingBankCountry.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'country', 'STRING', 5),
('issuingBankCity', 'templateVar.banks.issuingBankCity', 'templateVar.banks.issuingBankCity.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'city', 'STRING', 6),
('issuingBankAddress', 'templateVar.banks.issuingBankAddress', 'templateVar.banks.issuingBankAddress.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'address', 'STRING', 7),
('advisingBankId', 'templateVar.banks.advisingBankId', 'templateVar.banks.advisingBankId.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'id', 'NUMBER', 8),
('advisingBankName', 'templateVar.banks.advisingBankName', 'templateVar.banks.advisingBankName.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'name', 'STRING', 9),
('advisingBankBic', 'templateVar.banks.advisingBankBic', 'templateVar.banks.advisingBankBic.desc', 'BANKS', 'cyan', 'operation_readmodel', 'advising_bank_bic', 'STRING', 10),
('advisingBankCode', 'templateVar.banks.advisingBankCode', 'templateVar.banks.advisingBankCode.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'code', 'STRING', 11),
('advisingBankCountry', 'templateVar.banks.advisingBankCountry', 'templateVar.banks.advisingBankCountry.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'country', 'STRING', 12),
('advisingBankCity', 'templateVar.banks.advisingBankCity', 'templateVar.banks.advisingBankCity.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'city', 'STRING', 13),
('advisingBankAddress', 'templateVar.banks.advisingBankAddress', 'templateVar.banks.advisingBankAddress.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'address', 'STRING', 14);

-- Category: DATES (red)
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, format_pattern, display_order) VALUES
('issueDate', 'templateVar.dates.issueDate', 'templateVar.dates.issueDate.desc', 'DATES', 'red', 'operation_readmodel', 'issue_date', 'DATE', 'dd/MM/yyyy', 1),
('expiryDate', 'templateVar.dates.expiryDate', 'templateVar.dates.expiryDate.desc', 'DATES', 'red', 'operation_readmodel', 'expiry_date', 'DATE', 'dd/MM/yyyy', 2),
('responseDueDate', 'templateVar.dates.responseDueDate', 'templateVar.dates.responseDueDate.desc', 'DATES', 'red', 'operation_readmodel', 'response_due_date', 'DATE', 'dd/MM/yyyy', 3),
('createdAt', 'templateVar.dates.createdAt', 'templateVar.dates.createdAt.desc', 'DATES', 'red', 'operation_readmodel', 'created_at', 'DATETIME', 'dd/MM/yyyy HH:mm', 4),
('approvedAt', 'templateVar.dates.approvedAt', 'templateVar.dates.approvedAt.desc', 'DATES', 'red', 'operation_readmodel', 'approved_at', 'DATETIME', 'dd/MM/yyyy HH:mm', 5),
('modifiedAt', 'templateVar.dates.modifiedAt', 'templateVar.dates.modifiedAt.desc', 'DATES', 'red', 'operation_readmodel', 'modified_at', 'DATETIME', 'dd/MM/yyyy HH:mm', 6),
('eventDate', 'templateVar.dates.eventDate', 'templateVar.dates.eventDate.desc', 'DATES', 'red', 'system', 'current_timestamp', 'DATETIME', 'dd/MM/yyyy HH:mm', 7);

-- Category: USER (gray) - user who executed the action
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order) VALUES
('createdBy', 'templateVar.user.createdBy', 'templateVar.user.createdBy.desc', 'USER', 'gray', 'operation_readmodel', 'created_by', 'STRING', 1),
('approvedBy', 'templateVar.user.approvedBy', 'templateVar.user.approvedBy.desc', 'USER', 'gray', 'operation_readmodel', 'approved_by', 'STRING', 2),
('modifiedBy', 'templateVar.user.modifiedBy', 'templateVar.user.modifiedBy.desc', 'USER', 'gray', 'operation_readmodel', 'modified_by', 'STRING', 3),
('executingUser', 'templateVar.user.executingUser', 'templateVar.user.executingUser.desc', 'USER', 'gray', 'security_context', 'username', 'STRING', 4),
('executingUserEmail', 'templateVar.user.executingUserEmail', 'templateVar.user.executingUserEmail.desc', 'USER', 'gray', 'security_context', 'email', 'STRING', 5),
('executingUserFullName', 'templateVar.user.executingUserFullName', 'templateVar.user.executingUserFullName.desc', 'USER', 'gray', 'security_context', 'full_name', 'STRING', 6),
('executingUserRole', 'templateVar.user.executingUserRole', 'templateVar.user.executingUserRole.desc', 'USER', 'gray', 'security_context', 'role', 'STRING', 7);

-- Category: SWIFT (teal) - from swift_message_readmodel
INSERT INTO template_variable (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order) VALUES
('swiftMessageId', 'templateVar.swift.messageId', 'templateVar.swift.messageId.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'message_id', 'STRING', 1),
('swiftMessageType', 'templateVar.swift.messageType', 'templateVar.swift.messageType.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'message_type', 'STRING', 2),
('swiftDirection', 'templateVar.swift.direction', 'templateVar.swift.direction.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'direction', 'STRING', 3),
('swiftSenderBic', 'templateVar.swift.senderBic', 'templateVar.swift.senderBic.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'sender_bic', 'STRING', 4),
('swiftReceiverBic', 'templateVar.swift.receiverBic', 'templateVar.swift.receiverBic.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'receiver_bic', 'STRING', 5),
('swiftField20', 'templateVar.swift.field20', 'templateVar.swift.field20.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'field_20_reference', 'STRING', 6),
('swiftField21', 'templateVar.swift.field21', 'templateVar.swift.field21.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'field_21_related_ref', 'STRING', 7),
('swiftStatus', 'templateVar.swift.status', 'templateVar.swift.status.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'status', 'STRING', 8);

-- =============================================================================
-- Create menu item and permissions for Template Variables management
-- =============================================================================

-- Get the SECTION_CATALOGS parent ID
SET @catalogs_section = (SELECT id FROM menu_item WHERE code = 'SECTION_CATALOGS' LIMIT 1);

-- Insert menu item for Template Variables
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
    'CAT_TEMPLATE_VARIABLES',
    @catalogs_section,
    'menu.catalogs.templateVariables',
    'FiHash',
    '/catalogs/template-variables',
    86,
    FALSE,
    TRUE,
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    label_key = VALUES(label_key),
    icon = VALUES(icon),
    path = VALUES(path),
    display_order = VALUES(display_order);

-- Create permissions
INSERT INTO permission_read_model (code, name, description, module, created_at) VALUES
    ('VIEW_TEMPLATE_VARIABLES', 'Ver Variables de Plantilla', 'Permite ver las variables de plantilla disponibles', 'CATALOGS', NOW()),
    ('MANAGE_TEMPLATE_VARIABLES', 'Gestionar Variables de Plantilla', 'Permite crear, editar y eliminar variables de plantilla', 'CATALOGS', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Link menu to permissions
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'VIEW_TEMPLATE_VARIABLES'
FROM menu_item m
WHERE m.code = 'CAT_TEMPLATE_VARIABLES'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT m.id, 'MANAGE_TEMPLATE_VARIABLES'
FROM menu_item m
WHERE m.code = 'CAT_TEMPLATE_VARIABLES'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign permissions to ADMIN role
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_TEMPLATE_VARIABLES'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_TEMPLATE_VARIABLES'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign permissions to MANAGER role (full access)
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'VIEW_TEMPLATE_VARIABLES'
FROM role_read_model r
WHERE r.name = 'ROLE_MANAGER'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_TEMPLATE_VARIABLES'
FROM role_read_model r
WHERE r.name = 'ROLE_MANAGER'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Register API endpoints
INSERT INTO api_endpoint (code, http_method, url_pattern, description, module, is_public, is_active, created_by)
VALUES
    ('TEMPLATE_VARIABLE_LIST', 'GET', '/api/v1/admin/template-variables', 'List all template variables', 'CATALOGS', FALSE, TRUE, 'system'),
    ('TEMPLATE_VARIABLE_GET', 'GET', '/api/v1/admin/template-variables/*', 'Get template variable by ID', 'CATALOGS', FALSE, TRUE, 'system'),
    ('TEMPLATE_VARIABLE_BY_CATEGORY', 'GET', '/api/v1/admin/template-variables/category/*', 'Get template variables by category', 'CATALOGS', FALSE, TRUE, 'system'),
    ('TEMPLATE_VARIABLE_CREATE', 'POST', '/api/v1/admin/template-variables', 'Create template variable', 'CATALOGS', FALSE, TRUE, 'system'),
    ('TEMPLATE_VARIABLE_UPDATE', 'PUT', '/api/v1/admin/template-variables/*', 'Update template variable', 'CATALOGS', FALSE, TRUE, 'system'),
    ('TEMPLATE_VARIABLE_DELETE', 'DELETE', '/api/v1/admin/template-variables/*', 'Delete template variable', 'CATALOGS', FALSE, TRUE, 'system'),
    ('TEMPLATE_VARIABLE_ACTIVE', 'GET', '/api/v1/template-variables/active', 'Get active template variables (for action editor)', 'CATALOGS', FALSE, TRUE, 'system')
ON DUPLICATE KEY UPDATE description = VALUES(description), module = VALUES(module);

-- Link API endpoints to permissions
INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'VIEW_TEMPLATE_VARIABLES'
FROM api_endpoint e
WHERE e.code IN ('TEMPLATE_VARIABLE_LIST', 'TEMPLATE_VARIABLE_GET', 'TEMPLATE_VARIABLE_BY_CATEGORY', 'TEMPLATE_VARIABLE_ACTIVE')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

INSERT INTO api_endpoint_permission (api_endpoint_id, permission_code)
SELECT e.id, 'MANAGE_TEMPLATE_VARIABLES'
FROM api_endpoint e
WHERE e.code IN ('TEMPLATE_VARIABLE_CREATE', 'TEMPLATE_VARIABLE_UPDATE', 'TEMPLATE_VARIABLE_DELETE')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
