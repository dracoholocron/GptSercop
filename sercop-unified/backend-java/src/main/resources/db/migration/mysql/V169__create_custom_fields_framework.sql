-- ================================================
-- Migration: Custom Fields Framework
-- Description: Configurable custom fields for operations
-- Author: GlobalCMX Architecture
-- Date: 2026-01-18
-- ================================================

-- ================================================
-- Table: custom_field_step_config_readmodel
-- Description: Defines wizard steps for custom fields
-- ================================================
CREATE TABLE IF NOT EXISTS custom_field_step_config_readmodel (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Identification
    step_code VARCHAR(50) NOT NULL,
    step_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key for step name',
    step_description_key TEXT COMMENT 'i18n key for step description',

    -- Scope
    product_type VARCHAR(30) NOT NULL COMMENT 'LC_IMPORT, LC_EXPORT, GUARANTEE, STANDBY_LC, COLLECTION, ALL',
    tenant_id CHAR(36) NULL COMMENT 'NULL for global, specific for tenant override',

    -- Display settings
    display_order INT NOT NULL DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'FiFileText',

    -- Visibility per mode
    show_in_wizard BOOLEAN DEFAULT TRUE,
    show_in_expert BOOLEAN DEFAULT TRUE,
    show_in_custom BOOLEAN DEFAULT TRUE,
    show_in_view BOOLEAN DEFAULT TRUE,

    -- Embed configuration (for embedding in SWIFT steps)
    embed_mode VARCHAR(30) DEFAULT 'SEPARATE_STEP' COMMENT 'SEPARATE_STEP, EMBEDDED_IN_SWIFT',
    embed_swift_step VARCHAR(50) NULL COMMENT 'SWIFT step code to embed in (e.g., PARTIES, AMOUNTS)',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Constraints
    CONSTRAINT uk_step_product_tenant UNIQUE (step_code, product_type, tenant_id),

    -- Indexes
    INDEX idx_product_type (product_type),
    INDEX idx_tenant_display_order (tenant_id, display_order),
    INDEX idx_embed_mode (embed_mode),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for custom field wizard steps';

-- ================================================
-- Table: custom_field_section_config_readmodel
-- Description: Defines sections within steps
-- ================================================
CREATE TABLE IF NOT EXISTS custom_field_section_config_readmodel (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Identification
    section_code VARCHAR(50) NOT NULL,
    section_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key for section name',
    section_description_key TEXT COMMENT 'i18n key for section description',

    -- Parent step
    step_id CHAR(36) NOT NULL,

    -- Section type
    section_type VARCHAR(20) DEFAULT 'SINGLE' COMMENT 'SINGLE, REPEATABLE',
    min_rows INT DEFAULT 0 COMMENT 'For REPEATABLE: minimum rows required',
    max_rows INT DEFAULT 100 COMMENT 'For REPEATABLE: maximum rows allowed',

    -- Display settings
    display_order INT NOT NULL DEFAULT 0,
    collapsible BOOLEAN DEFAULT FALSE,
    default_collapsed BOOLEAN DEFAULT FALSE,
    columns INT DEFAULT 2 COMMENT 'Number of columns for field layout',

    -- Embed within SWIFT section
    embed_mode VARCHAR(30) DEFAULT 'NONE' COMMENT 'NONE, AFTER_SECTION, BEFORE_SECTION, AFTER_FIELD, BEFORE_FIELD, FLOATING, SIDEBAR',
    embed_target_type VARCHAR(20) NULL COMMENT 'SECTION or FIELD',
    embed_target_code VARCHAR(50) NULL COMMENT 'SWIFT section code or field code',
    embed_show_separator BOOLEAN DEFAULT TRUE,
    embed_collapsible BOOLEAN DEFAULT FALSE,
    embed_separator_title_key VARCHAR(100) NULL COMMENT 'i18n key for separator title',

    -- Visibility per mode
    show_in_wizard BOOLEAN DEFAULT TRUE,
    show_in_expert BOOLEAN DEFAULT TRUE,
    show_in_custom BOOLEAN DEFAULT TRUE,
    show_in_view BOOLEAN DEFAULT TRUE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Foreign keys
    CONSTRAINT fk_section_step FOREIGN KEY (step_id)
        REFERENCES custom_field_step_config_readmodel(id) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT uk_section_step UNIQUE (section_code, step_id),

    -- Indexes
    INDEX idx_step_display_order (step_id, display_order),
    INDEX idx_embed_mode (embed_mode),
    INDEX idx_embed_target (embed_target_type, embed_target_code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for custom field sections within steps';

-- ================================================
-- Table: custom_field_config_readmodel
-- Description: Individual custom field definitions
-- ================================================
CREATE TABLE IF NOT EXISTS custom_field_config_readmodel (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Identification
    field_code VARCHAR(50) NOT NULL,
    field_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key for field name',
    field_description_key TEXT COMMENT 'i18n key for field description',

    -- Parent section
    section_id CHAR(36) NOT NULL,

    -- Type configuration (reusing SWIFT patterns)
    field_type VARCHAR(30) NOT NULL COMMENT 'TEXT, NUMBER, DATE, BOOLEAN, SELECT, TEXTAREA, etc.',
    component_type VARCHAR(50) NOT NULL COMMENT 'TEXT_INPUT, NUMBER_INPUT, DATE_PICKER, SELECT, MULTILINE_TEXT, BANK_SELECTOR, CATALOG_LISTBOX, USER_LISTBOX, etc.',

    -- For CATALOG_LISTBOX and USER_LISTBOX
    data_source_type VARCHAR(30) NULL COMMENT 'CATALOG, USER, API',
    data_source_code VARCHAR(100) NULL COMMENT 'Catalog code or API endpoint',
    data_source_filters JSON NULL COMMENT 'Additional filters for data source',

    -- Display settings
    display_order INT NOT NULL DEFAULT 0,
    placeholder_key VARCHAR(200) COMMENT 'i18n key for placeholder',
    help_text_key TEXT COMMENT 'i18n key for help text',
    span_columns INT DEFAULT 1 COMMENT 'How many columns this field spans',

    -- Validation
    is_required BOOLEAN DEFAULT FALSE,
    required_condition JSON NULL COMMENT 'Conditional required: {"field": "OTHER_FIELD", "operator": "EQUALS", "value": "X"}',
    validation_rules JSON NULL COMMENT 'Pattern, min, max, custom rules',

    -- Dependencies
    dependencies JSON NULL COMMENT 'Field dependencies and visibility rules',

    -- Default value
    default_value VARCHAR(500),
    default_value_expression JSON NULL COMMENT 'Dynamic default: {"type": "EXPRESSION", "value": "TODAY()"}',

    -- Options (for SELECT, RADIO, CHECKBOX)
    field_options JSON NULL COMMENT '[{"value": "A", "label": "Option A"}, ...]',

    -- Embed within SWIFT field (inline)
    embed_after_swift_field VARCHAR(20) NULL COMMENT 'SWIFT field code to appear after',
    embed_inline BOOLEAN DEFAULT FALSE COMMENT 'Show inline with SWIFT field',

    -- Visibility per mode
    show_in_wizard BOOLEAN DEFAULT TRUE,
    show_in_expert BOOLEAN DEFAULT TRUE,
    show_in_custom BOOLEAN DEFAULT TRUE,
    show_in_view BOOLEAN DEFAULT TRUE,
    show_in_list BOOLEAN DEFAULT FALSE COMMENT 'Show in operation list/grid',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Foreign keys
    CONSTRAINT fk_field_section FOREIGN KEY (section_id)
        REFERENCES custom_field_section_config_readmodel(id) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT uk_field_section UNIQUE (field_code, section_id),

    -- Indexes
    INDEX idx_section_display_order (section_id, display_order),
    INDEX idx_field_type (field_type),
    INDEX idx_component_type (component_type),
    INDEX idx_data_source (data_source_type, data_source_code),
    INDEX idx_embed_swift (embed_after_swift_field),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for individual custom fields';

-- ================================================
-- Table: operation_custom_data_readmodel
-- Description: Stores custom field values per operation
-- ================================================
CREATE TABLE IF NOT EXISTS operation_custom_data_readmodel (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Operation reference
    operation_id CHAR(36) NOT NULL,
    operation_type VARCHAR(30) NOT NULL COMMENT 'LC_IMPORT, LC_EXPORT, GUARANTEE, etc.',

    -- Custom data storage
    custom_data JSON NOT NULL COMMENT 'All custom field values as JSON',

    -- Version for optimistic locking
    version INT DEFAULT 1,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Constraints
    CONSTRAINT uk_operation UNIQUE (operation_id),

    -- Indexes
    INDEX idx_operation_type (operation_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Custom field values storage per operation';

-- ================================================
-- Table: custom_field_audit_log
-- Description: Audit trail for custom field changes
-- ================================================
CREATE TABLE IF NOT EXISTS custom_field_audit_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- References
    operation_id CHAR(36) NOT NULL,
    field_code VARCHAR(50) NOT NULL,
    section_code VARCHAR(50) NULL,
    row_index INT NULL COMMENT 'For repeatable sections',

    -- Change details
    action VARCHAR(20) NOT NULL COMMENT 'CREATE, UPDATE, DELETE',
    old_value TEXT,
    new_value TEXT,

    -- Context
    user_id CHAR(36) NOT NULL,
    user_name VARCHAR(100),
    ip_address VARCHAR(45),

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_operation_id (operation_id),
    INDEX idx_field_code (field_code),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for custom field value changes';

-- ================================================
-- Insert component type reference data
-- ================================================
CREATE TABLE IF NOT EXISTS custom_field_component_types (
    component_type VARCHAR(50) PRIMARY KEY,
    description VARCHAR(200) NOT NULL,
    category VARCHAR(30) NOT NULL COMMENT 'BASIC, DATA_SOURCE, SPECIAL',
    props_schema JSON NULL COMMENT 'Schema for component-specific props',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Reference data for available component types';

-- Insert standard component types
INSERT INTO custom_field_component_types (component_type, description, category, props_schema) VALUES
-- Basic components
('TEXT_INPUT', 'Single line text input', 'BASIC', '{"maxLength": "number", "pattern": "string"}'),
('NUMBER_INPUT', 'Numeric input with optional decimals', 'BASIC', '{"min": "number", "max": "number", "decimals": "number", "prefix": "string", "suffix": "string"}'),
('DATE_PICKER', 'Date selector', 'BASIC', '{"minDate": "string", "maxDate": "string", "format": "string"}'),
('DATETIME_PICKER', 'Date and time selector', 'BASIC', '{"minDate": "string", "maxDate": "string", "format": "string"}'),
('SELECT', 'Dropdown select with static options', 'BASIC', '{"multiple": "boolean", "searchable": "boolean"}'),
('RADIO', 'Radio button group', 'BASIC', '{"inline": "boolean"}'),
('CHECKBOX', 'Single checkbox', 'BASIC', NULL),
('CHECKBOX_GROUP', 'Multiple checkboxes', 'BASIC', '{"inline": "boolean"}'),
('MULTILINE_TEXT', 'Multi-line textarea', 'BASIC', '{"rows": "number", "maxLength": "number"}'),
('RICH_TEXT', 'Rich text editor', 'BASIC', '{"toolbar": "array"}'),
('CURRENCY_AMOUNT', 'Currency and amount combined', 'BASIC', '{"currencies": "array", "decimals": "number"}'),
('PERCENTAGE', 'Percentage input', 'BASIC', '{"min": "number", "max": "number", "decimals": "number"}'),
('PHONE', 'Phone number input', 'BASIC', '{"format": "string", "countries": "array"}'),
('EMAIL', 'Email input with validation', 'BASIC', NULL),
('URL', 'URL input with validation', 'BASIC', NULL),
('FILE_UPLOAD', 'File upload component', 'BASIC', '{"accept": "string", "maxSize": "number", "multiple": "boolean"}'),

-- Data source components
('CATALOG_LISTBOX', 'Dropdown from custom catalog', 'DATA_SOURCE', '{"catalogCode": "string", "valueField": "string", "labelField": "string", "filters": "object"}'),
('USER_LISTBOX', 'Dropdown from user list', 'DATA_SOURCE', '{"roleFilter": "string", "departmentFilter": "string", "activeOnly": "boolean"}'),
('BANK_SELECTOR', 'Financial institution selector', 'DATA_SOURCE', '{"countryFilter": "string", "typeFilter": "string"}'),
('PARTICIPANT_SELECTOR', 'Participant selector', 'DATA_SOURCE', '{"typeFilter": "string"}'),
('CLIENT_SELECTOR', 'Client selector', 'DATA_SOURCE', '{"typeFilter": "string"}'),

-- Special components
('COUNTRY_SELECT', 'Country selector with flags', 'SPECIAL', '{"multiple": "boolean"}'),
('CURRENCY_SELECT', 'Currency selector', 'SPECIAL', '{"multiple": "boolean"}'),
('SWIFT_CODE', 'SWIFT/BIC code input with validation', 'SPECIAL', NULL),
('IBAN', 'IBAN input with validation', 'SPECIAL', NULL),
('SIGNATURE_PAD', 'Digital signature capture', 'SPECIAL', NULL),
('COLOR_PICKER', 'Color selector', 'SPECIAL', NULL),
('RATING', 'Star rating selector', 'SPECIAL', '{"max": "number"}'),
('SLIDER', 'Range slider', 'SPECIAL', '{"min": "number", "max": "number", "step": "number"}'),
('TAGS_INPUT', 'Tag/chip input', 'SPECIAL', '{"maxTags": "number", "suggestions": "array"}');
