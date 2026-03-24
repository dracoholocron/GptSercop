-- =====================================================
-- Reference Number Configuration and Control Tables
-- =====================================================

-- Table: reference_number_config
-- Stores configuration for reference number generation per product/client
CREATE TABLE IF NOT EXISTS reference_number_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    client_name VARCHAR(255) NOT NULL,
    product_code CHAR(1) NOT NULL COMMENT 'M=Import LC, B=Guarantees, E=Export LC, O=Export Collection, I=Import Collection, S=Standby Received, J=Standby Sent',
    country_code CHAR(1) NOT NULL COMMENT 'E=Ecuador, M=Mexico, U=USA, C=Colombia, P=Peru, A=Argentina, B=Brazil, H=Chile',
    agency_digits INT NOT NULL DEFAULT 4 COMMENT 'Number of digits for agency code',
    year_digits INT NOT NULL DEFAULT 2 COMMENT 'Number of digits for year (2 or 4)',
    sequential_digits INT NOT NULL DEFAULT 4 COMMENT 'Number of digits for sequential number',
    `separator` VARCHAR(5) DEFAULT '' COMMENT 'Optional separator between sections',
    format_example VARCHAR(50) NOT NULL COMMENT 'Example: ME000125 0001 or ME-0001-25-0001',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uk_ref_config (client_id, product_code, country_code),
    INDEX idx_client_product (client_id, product_code),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for reference number generation by product and client';

-- Table: reference_number_sequence
-- Maintains sequential counters for reference numbers
CREATE TABLE IF NOT EXISTS reference_number_sequence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_id BIGINT NOT NULL,
    agency_code VARCHAR(10) NOT NULL COMMENT 'Agency/branch code',
    year_code VARCHAR(4) NOT NULL COMMENT 'Year portion (e.g., 25 for 2025)',
    current_sequence BIGINT NOT NULL DEFAULT 0 COMMENT 'Current sequential number',
    last_generated_at TIMESTAMP NULL COMMENT 'Timestamp of last number generation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (config_id) REFERENCES reference_number_config(id) ON DELETE CASCADE,
    UNIQUE KEY uk_sequence (config_id, agency_code, year_code),
    INDEX idx_config_agency_year (config_id, agency_code, year_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sequential counter control for reference numbers';

-- Table: reference_number_history
-- Audit trail of all generated reference numbers
CREATE TABLE IF NOT EXISTS reference_number_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_id BIGINT NOT NULL,
    reference_number VARCHAR(50) NOT NULL COMMENT 'Full generated reference number',
    product_code CHAR(1) NOT NULL,
    country_code CHAR(1) NOT NULL,
    agency_code VARCHAR(10) NOT NULL,
    year_code VARCHAR(4) NOT NULL,
    sequence_number BIGINT NOT NULL,
    entity_type VARCHAR(50) COMMENT 'LC_IMPORT, LC_EXPORT, GUARANTEE, etc.',
    entity_id VARCHAR(100) COMMENT 'Reference to the entity using this number',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(100),
    FOREIGN KEY (config_id) REFERENCES reference_number_config(id),
    UNIQUE KEY uk_reference_number (reference_number),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_generated_at (generated_at),
    INDEX idx_product_country (product_code, country_code, year_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit history of all generated reference numbers';

-- Insert default configuration (ignore if already exists)
INSERT IGNORE INTO reference_number_config (
    client_id, client_name, product_code, country_code,
    agency_digits, year_digits, sequential_digits, `separator`, format_example,
    active, created_by
) VALUES
-- Import LC configurations
('DEFAULT', 'Default Configuration', 'M', 'E', 4, 2, 4, '', 'ME000125 0001', TRUE, 'SYSTEM'),
('DEFAULT', 'Default Configuration', 'M', 'M', 4, 2, 4, '', 'MM000125 0001', TRUE, 'SYSTEM'),
-- Guarantee configurations
('DEFAULT', 'Default Configuration', 'B', 'E', 4, 2, 4, '', 'BE000125 0001', TRUE, 'SYSTEM'),
('DEFAULT', 'Default Configuration', 'B', 'M', 4, 2, 4, '', 'BM000125 0001', TRUE, 'SYSTEM'),
-- Export LC configurations
('DEFAULT', 'Default Configuration', 'E', 'E', 4, 2, 4, '', 'EE000125 0001', TRUE, 'SYSTEM'),
('DEFAULT', 'Default Configuration', 'E', 'M', 4, 2, 4, '', 'EM000125 0001', TRUE, 'SYSTEM'),
-- Collection configurations
('DEFAULT', 'Default Configuration', 'O', 'E', 4, 2, 4, '', 'OE000125 0001', TRUE, 'SYSTEM'),
('DEFAULT', 'Default Configuration', 'I', 'E', 4, 2, 4, '', 'IE000125 0001', TRUE, 'SYSTEM'),
-- Standby configurations
('DEFAULT', 'Default Configuration', 'S', 'E', 4, 2, 4, '', 'SE000125 0001', TRUE, 'SYSTEM'),
('DEFAULT', 'Default Configuration', 'J', 'E', 4, 2, 4, '', 'JE000125 0001', TRUE, 'SYSTEM');

-- Initialize sequence counters for current year (ignore if already exists)
INSERT IGNORE INTO reference_number_sequence (config_id, agency_code, year_code, current_sequence)
SELECT id, '0001', DATE_FORMAT(NOW(), '%y'), 0
FROM reference_number_config
WHERE active = TRUE;
