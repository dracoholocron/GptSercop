-- V20260302_4: Market analysis tables

CREATE TABLE IF NOT EXISTS `cp_inflation_index` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `country_code` VARCHAR(3) NOT NULL DEFAULT 'EC',
    `year_month` VARCHAR(7) NOT NULL,
    `index_value` DECIMAL(10,4) NOT NULL,
    `base_year` INT NOT NULL DEFAULT 2024,
    `source` VARCHAR(100) DEFAULT 'INEC',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_inflation` (`country_code`, `year_month`),
    INDEX `idx_inflation_country` (`country_code`, `year_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cp_rfi` (
    `id` CHAR(36) PRIMARY KEY,
    `process_id` CHAR(36),
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT,
    `cpc_code` VARCHAR(20),
    `status` VARCHAR(30) DEFAULT 'BORRADOR',
    `publication_date` DATE,
    `closing_date` DATE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100),
    INDEX `idx_rfi_process` (`process_id`),
    INDEX `idx_rfi_cpc` (`cpc_code`),
    INDEX `idx_rfi_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cp_rfi_response` (
    `id` CHAR(36) PRIMARY KEY,
    `rfi_id` CHAR(36) NOT NULL,
    `supplier_ruc` VARCHAR(20),
    `supplier_name` VARCHAR(300) NOT NULL,
    `unit_price` DECIMAL(15,4) NOT NULL,
    `total_price` DECIMAL(15,2),
    `delivery_days` INT,
    `observations` TEXT,
    `response_date` DATE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_rfi_resp_rfi` (`rfi_id`),
    CONSTRAINT `fk_rfi_resp_rfi` FOREIGN KEY (`rfi_id`) REFERENCES `cp_rfi`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `cp_inflation_index` (`country_code`, `year_month`, `index_value`, `base_year`, `source`) VALUES
('EC', '2024-01', 100.0000, 2024, 'INEC'),
('EC', '2024-06', 101.2300, 2024, 'INEC'),
('EC', '2024-12', 102.5100, 2024, 'INEC'),
('EC', '2025-06', 103.8400, 2024, 'INEC'),
('EC', '2025-12', 105.2000, 2024, 'INEC'),
('EC', '2026-01', 105.4500, 2024, 'INEC'),
('EC', '2026-02', 105.7100, 2024, 'INEC');
