-- =============================================================================
-- V95: Create Brand Template table
-- =============================================================================
-- Stores brand/theme configurations for visual customization

CREATE TABLE IF NOT EXISTS brand_template (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    logo_url VARCHAR(500),
    logo_small_url VARCHAR(500),
    favicon_url VARCHAR(500),
    company_name VARCHAR(200),
    company_short_name VARCHAR(50),
    primary_color VARCHAR(20) DEFAULT '#3182CE',
    secondary_color VARCHAR(20) DEFAULT '#718096',
    accent_color VARCHAR(20) DEFAULT '#38B2AC',
    sidebar_bg_color VARCHAR(20) DEFAULT '#1A202C',
    header_bg_color VARCHAR(20) DEFAULT '#FFFFFF',
    dark_mode_enabled BOOLEAN DEFAULT FALSE,
    custom_css TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_brand_active (is_active),
    INDEX idx_brand_default (is_default),
    INDEX idx_brand_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default brand template
INSERT INTO brand_template (
    code, name, description, company_name, company_short_name,
    primary_color, secondary_color, accent_color, sidebar_bg_color, header_bg_color,
    is_active, is_default, is_editable, display_order, created_by
) VALUES (
    'DEFAULT', 'GlobalCMX Default', 'Default brand template for GlobalCMX',
    'Global CMX', 'GCX',
    '#3182CE', '#718096', '#38B2AC', '#1A202C', '#FFFFFF',
    TRUE, TRUE, FALSE, 0, 'system'
);
