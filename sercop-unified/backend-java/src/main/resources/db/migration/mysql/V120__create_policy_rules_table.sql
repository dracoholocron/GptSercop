-- =====================================================================
-- V119: Create Policy Rules table for ABAC-like authorization
-- =====================================================================
-- This table stores configurable authorization rules based on:
-- - Subject attributes (department, role, role level)
-- - Resource attributes (entity type, action, amount, currency)
-- - Context attributes (time window, day of week, country)
-- =====================================================================

CREATE TABLE IF NOT EXISTS policy_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(50) NOT NULL UNIQUE,
    rule_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 100,

    -- Subject conditions (WHO)
    allowed_departments VARCHAR(500),
    allowed_roles VARCHAR(500),
    min_role_level INT,

    -- Resource conditions (WHAT)
    entity_type VARCHAR(50),
    action_type VARCHAR(50),
    min_amount DECIMAL(19,4),
    max_amount DECIMAL(19,4),
    currency VARCHAR(3),

    -- Context conditions (WHEN/WHERE)
    allowed_time_start TIME,
    allowed_time_end TIME,
    allowed_days_of_week VARCHAR(20),
    require_same_country BOOLEAN DEFAULT FALSE,
    allowed_countries VARCHAR(200),

    -- Decision
    decision VARCHAR(20) NOT NULL,
    decision_message VARCHAR(500),
    required_approvers INT,
    require_different_department BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_policy_rule_enabled (enabled),
    INDEX idx_policy_rule_entity_action (entity_type, action_type),
    INDEX idx_policy_rule_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Example Policy Rules
-- =====================================================================

-- Rule 1: Treasury can approve LCs under $1M during business hours (Monday-Friday, 9am-6pm)
INSERT INTO policy_rule (
    rule_code, rule_name, description, enabled, priority,
    allowed_departments, entity_type, action_type,
    max_amount, currency,
    allowed_time_start, allowed_time_end, allowed_days_of_week,
    decision, decision_message
) VALUES (
    'TREASURY_LC_APPROVAL_1M',
    'Tesorería - Aprobación LC hasta $1M',
    'Usuarios del departamento de Tesorería pueden aprobar Cartas de Crédito de hasta $1,000,000 USD durante horario laboral (Lunes a Viernes, 9am-6pm)',
    TRUE, 10,
    'TESORERIA,TREASURY',
    'LETTER_OF_CREDIT', 'APPROVE',
    1000000.0000, 'USD',
    '09:00:00', '18:00:00', '1,2,3,4,5',
    'ALLOW',
    'Aprobación permitida para Tesorería en horario laboral'
);

-- Rule 2: LCs over $1M require manager approval
INSERT INTO policy_rule (
    rule_code, rule_name, description, enabled, priority,
    entity_type, action_type,
    min_amount, currency,
    min_role_level,
    decision, decision_message
) VALUES (
    'LC_OVER_1M_MANAGER_REQUIRED',
    'LC > $1M requiere Gerente',
    'Cartas de Crédito mayores a $1,000,000 USD requieren aprobación de un Gerente o superior',
    TRUE, 20,
    'LETTER_OF_CREDIT', 'APPROVE',
    1000000.0001, 'USD',
    3, -- 3 = MANAGER level
    'ALLOW',
    'Aprobación de Gerente requerida para montos mayores a $1M'
);

-- Rule 3: LCs over $5M require dual approval from different departments
INSERT INTO policy_rule (
    rule_code, rule_name, description, enabled, priority,
    entity_type, action_type,
    min_amount, currency,
    decision, decision_message,
    required_approvers, require_different_department
) VALUES (
    'LC_OVER_5M_DUAL_APPROVAL',
    'LC > $5M requiere doble aprobación',
    'Cartas de Crédito mayores a $5,000,000 USD requieren aprobación de dos personas de diferentes departamentos',
    TRUE, 5,
    'LETTER_OF_CREDIT', 'APPROVE',
    5000000.0000, 'USD',
    'REQUIRE_APPROVAL',
    'Operaciones mayores a $5M requieren doble aprobación de diferentes departamentos',
    2, TRUE
);

-- Rule 4: Operations outside business hours require MFA
INSERT INTO policy_rule (
    rule_code, rule_name, description, enabled, priority,
    allowed_time_start, allowed_time_end,
    decision, decision_message
) VALUES (
    'OFF_HOURS_MFA_REQUIRED',
    'MFA requerido fuera de horario',
    'Cualquier operación fuera de horario laboral (antes de 8am o después de 8pm) requiere verificación MFA adicional',
    FALSE, 100, -- Disabled by default
    '08:00:00', '20:00:00',
    'REQUIRE_MFA',
    'Operación fuera de horario laboral - se requiere verificación MFA'
);

-- Rule 5: Weekend operations require approval
INSERT INTO policy_rule (
    rule_code, rule_name, description, enabled, priority,
    allowed_days_of_week,
    decision, decision_message,
    required_approvers
) VALUES (
    'WEEKEND_APPROVAL_REQUIRED',
    'Operaciones de fin de semana requieren aprobación',
    'Cualquier operación realizada en fin de semana requiere aprobación adicional',
    FALSE, 90, -- Disabled by default
    '6,7', -- Saturday, Sunday
    'REQUIRE_APPROVAL',
    'Operación en fin de semana - requiere aprobación adicional',
    1
);

-- Rule 6: Finance department can approve guarantees
INSERT INTO policy_rule (
    rule_code, rule_name, description, enabled, priority,
    allowed_departments, entity_type, action_type,
    decision, decision_message
) VALUES (
    'FINANCE_GUARANTEE_APPROVAL',
    'Finanzas - Aprobación de Garantías',
    'El departamento de Finanzas puede aprobar Garantías Bancarias',
    TRUE, 15,
    'FINANZAS,FINANCE',
    'BANK_GUARANTEE', 'APPROVE',
    'ALLOW',
    'Aprobación permitida para departamento de Finanzas'
);

-- Rule 7: Block operations from non-registered countries
INSERT INTO policy_rule (
    rule_code, rule_name, description, enabled, priority,
    require_same_country,
    decision, decision_message
) VALUES (
    'SAME_COUNTRY_REQUIRED',
    'Operación desde país registrado',
    'Las operaciones deben realizarse desde el mismo país donde está registrado el usuario',
    FALSE, 50, -- Disabled by default
    TRUE,
    'DENY',
    'Operación bloqueada: debe realizarse desde su país registrado'
);

-- Note: Menu item will be added via application if menu_item_read_model exists
