-- ================================================
-- Migration: swift_field_config table (MySQL)
-- Description: Centralized SWIFT field configuration for MT700/MT710/etc.
-- Author: GlobalCMX Architecture
-- Date: 2025-11-05
-- ================================================

-- Main SWIFT field configuration table
CREATE TABLE IF NOT EXISTS swift_field_config_readmodel (
    -- Identification
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    field_code VARCHAR(10) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    description TEXT,
    message_type VARCHAR(10) NOT NULL,

    -- Classification
    section VARCHAR(50) NOT NULL,
    display_order INT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Type and behavior
    field_type VARCHAR(20) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    placeholder VARCHAR(200),

    -- Validation rules (JSON)
    validation_rules JSON,
    dependencies JSON,
    contextual_alerts JSON,
    field_options JSON,

    -- Metadata
    default_value VARCHAR(255),
    help_text TEXT,
    documentation_url VARCHAR(500),

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    -- Constraint: Unique combination of field code and message type
    CONSTRAINT uk_field_code_message_type UNIQUE (field_code, message_type),

    -- Indexes for performance
    INDEX idx_field_code_message_type (field_code, message_type),
    INDEX idx_message_type_section (message_type, section),
    INDEX idx_message_type_active (message_type, is_active),
    INDEX idx_section_display_order (section, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Centralized SWIFT field configuration for dynamic validation and dependencies';
