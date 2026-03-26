-- Add account_prefix column to product_type_config
-- This column stores the accounting account prefix for filtering GLE entries
-- Configure the correct prefixes for each product type from the admin catalog

CREATE TABLE IF NOT EXISTS product_type_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_type VARCHAR(50) NOT NULL UNIQUE,
    base_url VARCHAR(100) NOT NULL,
    wizard_url VARCHAR(150) NOT NULL,
    view_mode_title_key VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    swift_message_type VARCHAR(10),
    category VARCHAR(50) NOT NULL,
    id_prefix VARCHAR(5),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    accounting_nature VARCHAR(10) NOT NULL DEFAULT 'DEBIT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_type_config_active (active),
    INDEX idx_product_type_config_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @product_type_has_account_prefix := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'product_type_config'
      AND column_name = 'account_prefix'
);
SET @product_type_account_prefix_sql := IF(
    @product_type_has_account_prefix = 0,
    'ALTER TABLE product_type_config ADD COLUMN account_prefix VARCHAR(50) NULL AFTER category',
    'SELECT 1'
);
PREPARE stmt_product_type_account_prefix FROM @product_type_account_prefix_sql;
EXECUTE stmt_product_type_account_prefix;
DEALLOCATE PREPARE stmt_product_type_account_prefix;
