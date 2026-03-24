-- V50: Create event_condition_config table for configurable event conditions
-- This table allows defining conditions that control when events are available
-- All conditions are configurable without code changes

-- =============================================
-- 1. Create event_condition_config table
-- =============================================

CREATE TABLE event_condition_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Identification
    condition_code VARCHAR(50) NOT NULL COMMENT 'Unique code: HAS_INTERMEDIARY_BANK, IS_USD_LC, etc.',
    condition_name VARCHAR(100) NOT NULL COMMENT 'Human readable name',
    description TEXT COMMENT 'Detailed description of what this condition checks',

    -- Condition Type
    condition_type ENUM('SWIFT_FIELD', 'OPERATION_FIELD', 'MESSAGE_FIELD', 'COMPOSITE', 'EXPRESSION') NOT NULL
        COMMENT 'Type of condition evaluation',

    -- For SWIFT_FIELD type: Check field in SWIFT message
    message_type VARCHAR(10) COMMENT 'SWIFT message type: MT700, MT710, MT707, etc.',
    field_code VARCHAR(20) COMMENT 'SWIFT field code: 57a, 53a, 32B, etc.',
    field_subfield VARCHAR(20) COMMENT 'Subfield within the field if applicable',

    -- For OPERATION_FIELD type: Check field in operation entity
    entity_type VARCHAR(50) COMMENT 'Entity to check: OPERATION, LC, GUARANTEE, COLLECTION',
    field_path VARCHAR(100) COMMENT 'Path to field: currency, amount, applicant.country, etc.',

    -- Comparison
    comparison_operator ENUM(
        'EXISTS', 'NOT_EXISTS',
        'EQUALS', 'NOT_EQUALS',
        'CONTAINS', 'NOT_CONTAINS',
        'STARTS_WITH', 'ENDS_WITH',
        'MATCHES_REGEX',
        'GREATER_THAN', 'GREATER_THAN_OR_EQUALS',
        'LESS_THAN', 'LESS_THAN_OR_EQUALS',
        'IN_LIST', 'NOT_IN_LIST',
        'IS_EMPTY', 'IS_NOT_EMPTY',
        'IS_NULL', 'IS_NOT_NULL'
    ) NOT NULL COMMENT 'How to compare the field value',
    comparison_value TEXT COMMENT 'Value to compare against (JSON for lists)',
    comparison_value_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'LIST', 'REGEX') DEFAULT 'STRING'
        COMMENT 'Data type of the comparison value',

    -- For COMPOSITE type: Combine multiple conditions
    composite_operator ENUM('AND', 'OR', 'NOT', 'XOR') COMMENT 'Logical operator for child conditions',
    child_condition_codes JSON COMMENT 'Array of condition_codes to combine: ["COND1", "COND2"]',

    -- For EXPRESSION type: Custom expression (SpEL, Drools, etc.)
    expression_language ENUM('SPEL', 'DROOLS', 'MVEL', 'JAVASCRIPT') COMMENT 'Expression language',
    expression_text TEXT COMMENT 'The expression to evaluate',

    -- Caching
    is_cacheable BOOLEAN DEFAULT TRUE COMMENT 'Can this condition result be cached per operation?',
    cache_ttl_seconds INT DEFAULT 300 COMMENT 'How long to cache the result',

    -- Metadata
    category VARCHAR(50) COMMENT 'Category: BANK_ROUTING, AMOUNT, DOCUMENT, PARTY, etc.',
    operation_types JSON COMMENT 'Operation types this applies to: ["LC_IMPORT", "LC_EXPORT"]',
    language VARCHAR(5) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Constraints
    UNIQUE KEY uk_condition_code_lang (condition_code, language),
    INDEX idx_condition_type (condition_type),
    INDEX idx_message_type (message_type),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configurable conditions for event availability';

-- =============================================
-- 2. Create junction table for event-condition mapping
-- =============================================

CREATE TABLE event_flow_condition_mapping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- References
    event_flow_config_id BIGINT NOT NULL COMMENT 'Reference to event_flow_config_readmodel',
    condition_code VARCHAR(50) NOT NULL COMMENT 'Reference to condition_code',

    -- Behavior
    condition_behavior ENUM('SHOW_IF', 'HIDE_IF', 'REQUIRE_IF', 'OPTIONAL_IF') DEFAULT 'SHOW_IF'
        COMMENT 'How to apply the condition result',

    -- Priority (for conflicting conditions)
    priority INT DEFAULT 0 COMMENT 'Higher priority wins on conflicts',

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    INDEX idx_event_flow_config (event_flow_config_id),
    INDEX idx_condition_code (condition_code),
    UNIQUE KEY uk_flow_condition (event_flow_config_id, condition_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps conditions to event flows';

-- =============================================
-- 3. Seed initial condition configurations
-- =============================================

-- Condition: Has Intermediary Bank (field 57a exists in MT700)
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    message_type, field_code, comparison_operator,
    category, operation_types, language, is_active, created_by
) VALUES
('HAS_INTERMEDIARY_BANK', 'Has Intermediary Bank',
 'Checks if the LC has an intermediary/correspondent bank specified in field 57a of MT700',
 'SWIFT_FIELD', 'MT700', '57a', 'EXISTS',
 'BANK_ROUTING', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('HAS_INTERMEDIARY_BANK', 'Tiene Banco Intermediario',
 'Verifica si la LC tiene un banco intermediario/corresponsal especificado en el campo 57a del MT700',
 'SWIFT_FIELD', 'MT700', '57a', 'EXISTS',
 'BANK_ROUTING', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: No Intermediary Bank (field 57a does NOT exist)
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    message_type, field_code, comparison_operator,
    category, operation_types, language, is_active, created_by
) VALUES
('NO_INTERMEDIARY_BANK', 'No Intermediary Bank',
 'Checks if the LC does NOT have an intermediary bank (field 57a absent)',
 'SWIFT_FIELD', 'MT700', '57a', 'NOT_EXISTS',
 'BANK_ROUTING', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('NO_INTERMEDIARY_BANK', 'Sin Banco Intermediario',
 'Verifica si la LC NO tiene un banco intermediario (campo 57a ausente)',
 'SWIFT_FIELD', 'MT700', '57a', 'NOT_EXISTS',
 'BANK_ROUTING', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: Has Reimbursing Bank (field 53a exists)
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    message_type, field_code, comparison_operator,
    category, operation_types, language, is_active, created_by
) VALUES
('HAS_REIMBURSING_BANK', 'Has Reimbursing Bank',
 'Checks if the LC has a reimbursing bank specified in field 53a',
 'SWIFT_FIELD', 'MT700', '53a', 'EXISTS',
 'BANK_ROUTING', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('HAS_REIMBURSING_BANK', 'Tiene Banco Reembolsador',
 'Verifica si la LC tiene un banco reembolsador especificado en el campo 53a',
 'SWIFT_FIELD', 'MT700', '53a', 'EXISTS',
 'BANK_ROUTING', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: Currency is USD
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    message_type, field_code, comparison_operator, comparison_value, comparison_value_type,
    category, operation_types, language, is_active, created_by
) VALUES
('CURRENCY_USD', 'Currency is USD',
 'Checks if the LC currency is US Dollars',
 'SWIFT_FIELD', 'MT700', '32B', 'STARTS_WITH', 'USD', 'STRING',
 'AMOUNT', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('CURRENCY_USD', 'Moneda es USD',
 'Verifica si la moneda de la LC es Dolares Americanos',
 'SWIFT_FIELD', 'MT700', '32B', 'STARTS_WITH', 'USD', 'STRING',
 'AMOUNT', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: Currency is EUR
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    message_type, field_code, comparison_operator, comparison_value, comparison_value_type,
    category, operation_types, language, is_active, created_by
) VALUES
('CURRENCY_EUR', 'Currency is EUR',
 'Checks if the LC currency is Euros',
 'SWIFT_FIELD', 'MT700', '32B', 'STARTS_WITH', 'EUR', 'STRING',
 'AMOUNT', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('CURRENCY_EUR', 'Moneda es EUR',
 'Verifica si la moneda de la LC es Euros',
 'SWIFT_FIELD', 'MT700', '32B', 'STARTS_WITH', 'EUR', 'STRING',
 'AMOUNT', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: Is Confirmed LC (field 49 = CONFIRM)
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    message_type, field_code, comparison_operator, comparison_value, comparison_value_type,
    category, operation_types, language, is_active, created_by
) VALUES
('IS_CONFIRMED_LC', 'Is Confirmed LC',
 'Checks if the LC requires confirmation (field 49 = CONFIRM)',
 'SWIFT_FIELD', 'MT700', '49', 'EQUALS', 'CONFIRM', 'STRING',
 'LC_TYPE', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('IS_CONFIRMED_LC', 'LC Confirmada',
 'Verifica si la LC requiere confirmacion (campo 49 = CONFIRM)',
 'SWIFT_FIELD', 'MT700', '49', 'EQUALS', 'CONFIRM', 'STRING',
 'LC_TYPE', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: Operation field - Our role is Issuing Bank
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    entity_type, field_path, comparison_operator, comparison_value, comparison_value_type,
    category, operation_types, language, is_active, created_by
) VALUES
('ROLE_ISSUING_BANK', 'Role is Issuing Bank',
 'Checks if our bank role in this operation is Issuing Bank',
 'OPERATION_FIELD', 'OPERATION', 'bankRole', 'EQUALS', 'ISSUING_BANK', 'STRING',
 'BANK_ROLE', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('ROLE_ISSUING_BANK', 'Rol es Banco Emisor',
 'Verifica si nuestro rol en esta operacion es Banco Emisor',
 'OPERATION_FIELD', 'OPERATION', 'bankRole', 'EQUALS', 'ISSUING_BANK', 'STRING',
 'BANK_ROLE', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: Operation field - Our role is Advising Bank
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    entity_type, field_path, comparison_operator, comparison_value, comparison_value_type,
    category, operation_types, language, is_active, created_by
) VALUES
('ROLE_ADVISING_BANK', 'Role is Advising Bank',
 'Checks if our bank role in this operation is Advising Bank',
 'OPERATION_FIELD', 'OPERATION', 'bankRole', 'EQUALS', 'ADVISING_BANK', 'STRING',
 'BANK_ROLE', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('ROLE_ADVISING_BANK', 'Rol es Banco Avisador',
 'Verifica si nuestro rol en esta operacion es Banco Avisador',
 'OPERATION_FIELD', 'OPERATION', 'bankRole', 'EQUALS', 'ADVISING_BANK', 'STRING',
 'BANK_ROLE', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- Condition: Amount greater than threshold (composite example)
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    entity_type, field_path, comparison_operator, comparison_value, comparison_value_type,
    category, operation_types, language, is_active, created_by
) VALUES
('AMOUNT_OVER_100K', 'Amount Over 100,000',
 'Checks if the LC amount exceeds 100,000 in base currency',
 'OPERATION_FIELD', 'OPERATION', 'amount', 'GREATER_THAN', '100000', 'NUMBER',
 'AMOUNT', '["LC_IMPORT", "LC_EXPORT", "GUARANTEE"]', 'en', TRUE, 'system'),

('AMOUNT_OVER_100K', 'Monto Mayor a 100,000',
 'Verifica si el monto de la LC excede 100,000 en moneda base',
 'OPERATION_FIELD', 'OPERATION', 'amount', 'GREATER_THAN', '100000', 'NUMBER',
 'AMOUNT', '["LC_IMPORT", "LC_EXPORT", "GUARANTEE"]', 'es', TRUE, 'system');

-- Composite Condition: Requires Special Approval (amount > 100k AND confirmed)
INSERT INTO event_condition_config (
    condition_code, condition_name, description, condition_type,
    composite_operator, child_condition_codes,
    category, operation_types, language, is_active, created_by
) VALUES
('REQUIRES_SPECIAL_APPROVAL', 'Requires Special Approval',
 'Checks if the operation requires special approval (confirmed LC with amount > 100k)',
 'COMPOSITE', 'AND', '["AMOUNT_OVER_100K", "IS_CONFIRMED_LC"]',
 'APPROVAL', '["LC_IMPORT", "LC_EXPORT"]', 'en', TRUE, 'system'),

('REQUIRES_SPECIAL_APPROVAL', 'Requiere Aprobacion Especial',
 'Verifica si la operacion requiere aprobacion especial (LC confirmada con monto > 100k)',
 'COMPOSITE', 'AND', '["AMOUNT_OVER_100K", "IS_CONFIRMED_LC"]',
 'APPROVAL', '["LC_IMPORT", "LC_EXPORT"]', 'es', TRUE, 'system');

-- =============================================
-- 4. Update event_flow_config to use conditions
-- =============================================

-- Add new events for direct vs correspondent transmission
-- These events will be conditionally shown based on field 57a

-- English: Direct transmission (when no intermediary)
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    conditions, is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'TRANSMIT_DIRECT',
 '{"conditionCode": "NO_INTERMEDIARY_BANK", "behavior": "SHOW_IF"}',
 FALSE, TRUE, 1, 'en',
 'Transmit LC Direct', 'Send MT700 directly to Advising Bank (no intermediary)', TRUE);

-- Spanish: Direct transmission
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    conditions, is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'TRANSMIT_DIRECT',
 '{"conditionCode": "NO_INTERMEDIARY_BANK", "behavior": "SHOW_IF"}',
 FALSE, TRUE, 1, 'es',
 'Transmitir LC Directo', 'Enviar MT700 directamente al Banco Avisador (sin intermediario)', TRUE);

-- English: Via correspondent (when intermediary exists)
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    conditions, is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'TRANSMIT_VIA_CORRESPONDENT',
 '{"conditionCode": "HAS_INTERMEDIARY_BANK", "behavior": "SHOW_IF"}',
 FALSE, TRUE, 1, 'en',
 'Transmit via Correspondent', 'Send MT700 to Correspondent Bank who will forward MT710', TRUE);

-- Spanish: Via correspondent
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    conditions, is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'TRANSMIT_VIA_CORRESPONDENT',
 '{"conditionCode": "HAS_INTERMEDIARY_BANK", "behavior": "SHOW_IF"}',
 FALSE, TRUE, 1, 'es',
 'Transmitir via Corresponsal', 'Enviar MT700 al Banco Corresponsal quien reenviara MT710', TRUE);

-- =============================================
-- 5. Create new event types for the conditional events
-- =============================================

-- TRANSMIT_DIRECT event type
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('TRANSMIT_DIRECT', 'LC_IMPORT', 'en', 'Transmit LC Direct',
 'Transmit Letter of Credit directly to Advising Bank',
 'Send MT700 directly to the Advising Bank when there is no intermediary bank involved',
 'MT700', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiSend', 'blue', 1,
 'ISSUING_BANK', 'ADVISING_BANK', 'SENDER', TRUE, 'ADVICE',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('TRANSMIT_DIRECT', 'LC_IMPORT', 'es', 'Transmitir LC Directo',
 'Transmitir Carta de Credito directamente al Banco Avisador',
 'Enviar MT700 directamente al Banco Avisador cuando no hay banco intermediario involucrado',
 'MT700', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiSend', 'blue', 1,
 'ISSUING_BANK', 'ADVISING_BANK', 'SENDER', TRUE, 'ADVICE',
 TRUE, FALSE, FALSE, NOW(), NOW());

-- TRANSMIT_VIA_CORRESPONDENT event type
INSERT INTO event_type_config_readmodel (
    event_code, operation_type, language, event_name, event_description, help_text,
    outbound_message_type, inbound_message_type, valid_from_stages, valid_from_statuses,
    resulting_stage, resulting_status, icon, color, display_order,
    message_sender, message_receiver, our_role, requires_swift_message, event_category,
    is_active, requires_approval, is_reversible, created_at, modified_at
) VALUES
('TRANSMIT_VIA_CORRESPONDENT', 'LC_IMPORT', 'en', 'Transmit via Correspondent',
 'Transmit Letter of Credit through Correspondent Bank',
 'Send MT700 to Correspondent Bank (field 57a) who will forward MT710 to the Advising Bank',
 'MT700', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiShare2', 'purple', 2,
 'ISSUING_BANK', 'CORRESPONDENT_BANK', 'SENDER', TRUE, 'ADVICE',
 TRUE, FALSE, FALSE, NOW(), NOW()),

('TRANSMIT_VIA_CORRESPONDENT', 'LC_IMPORT', 'es', 'Transmitir via Corresponsal',
 'Transmitir Carta de Credito a traves del Banco Corresponsal',
 'Enviar MT700 al Banco Corresponsal (campo 57a) quien reenviara MT710 al Banco Avisador',
 'MT700', 'MT730', '["ISSUED"]', '["ACTIVE"]', 'ADVISED', 'ACTIVE',
 'FiShare2', 'purple', 2,
 'ISSUING_BANK', 'CORRESPONDENT_BANK', 'SENDER', TRUE, 'ADVICE',
 TRUE, FALSE, FALSE, NOW(), NOW());

-- =============================================
-- 6. Deactivate old ADVISE event for LC_IMPORT
-- It's being replaced by conditional TRANSMIT_DIRECT and TRANSMIT_VIA_CORRESPONDENT
-- =============================================

UPDATE event_type_config_readmodel
SET is_active = FALSE
WHERE event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT';

-- Also deactivate the old ADVISE flow configs for LC_IMPORT
UPDATE event_flow_config_readmodel
SET is_active = FALSE
WHERE to_event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT';
