-- Product Type Configuration Table
-- Centralized configuration for mapping product types to their corresponding UI views and wizards

CREATE TABLE IF NOT EXISTS product_type_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_type VARCHAR(50) NOT NULL UNIQUE,
    base_url VARCHAR(100) NOT NULL,
    wizard_url VARCHAR(150) NOT NULL,
    view_mode_title_key VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    swift_message_type VARCHAR(10),
    category VARCHAR(50) NOT NULL DEFAULT 'TRADE_FINANCE',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial configurations for all product types
INSERT INTO product_type_config (product_type, base_url, wizard_url, view_mode_title_key, description, swift_message_type, category, display_order) VALUES
-- Letters of Credit
('LC_IMPORT', '/lc-imports', '/lc-imports/issuance-wizard', 'lcImportWizard.viewModeTitle', 'Cartas de Crédito de Importación', 'MT700', 'LETTERS_OF_CREDIT', 1),
('LC_EXPORT', '/lc-exports', '/lc-exports/issuance-wizard', 'lcExportWizard.viewModeTitle', 'Cartas de Crédito de Exportación', 'MT700', 'LETTERS_OF_CREDIT', 2),

-- Guarantees
('GUARANTEE', '/guarantees', '/guarantees/issuance-wizard', 'guaranteeWizard.viewModeTitle', 'Garantías Bancarias', 'MT760', 'GUARANTEES', 10),
('STANDBY_LC', '/guarantees', '/guarantees/issuance-wizard', 'guaranteeWizard.viewModeTitle', 'Cartas de Crédito Standby', 'MT760', 'GUARANTEES', 11),

-- Collections
('COLLECTION_IMPORT', '/collections', '/collections/issuance-wizard', 'collectionWizard.viewModeTitle', 'Cobranzas de Importación', 'MT410', 'COLLECTIONS', 20),
('COLLECTION_EXPORT', '/collections', '/collections/issuance-wizard', 'collectionWizard.viewModeTitle', 'Cobranzas de Exportación', 'MT410', 'COLLECTIONS', 21);

-- Create index for faster lookups
CREATE INDEX idx_product_type_config_active ON product_type_config(active);
CREATE INDEX idx_product_type_config_category ON product_type_config(category);
