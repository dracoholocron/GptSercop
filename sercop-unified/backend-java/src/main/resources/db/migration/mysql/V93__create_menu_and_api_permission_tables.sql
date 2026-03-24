-- =====================================================
-- V93: Menu Items and API Permission Mapping Tables
-- =====================================================
-- Tables for dynamic menu configuration and API security
-- No hardcoded data - all configurable via admin UI
-- Permission references use code (VARCHAR) not id (BIGINT)
-- =====================================================

-- Drop tables if they exist (in case of previous partial migration)
DROP TABLE IF EXISTS menu_item_api_endpoint;
DROP TABLE IF EXISTS api_endpoint_permission;
DROP TABLE IF EXISTS menu_item_permission;
DROP TABLE IF EXISTS api_endpoint;
DROP TABLE IF EXISTS menu_item;

-- Menu Items table (supports hierarchical menu)
CREATE TABLE menu_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    parent_id BIGINT NULL,
    label_key VARCHAR(200) NOT NULL,
    icon VARCHAR(100),
    path VARCHAR(255),
    display_order INT DEFAULT 0,
    is_section BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_menu_parent (parent_id),
    INDEX idx_menu_order (display_order),
    INDEX idx_menu_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add self-referencing FK after table is created
ALTER TABLE menu_item ADD FOREIGN KEY (parent_id) REFERENCES menu_item(id) ON DELETE SET NULL;

-- Menu Item to Permission mapping (many-to-many)
-- Note: permission_code references permission_read_model.code
CREATE TABLE menu_item_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id BIGINT NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_code) REFERENCES permission_read_model(code) ON DELETE CASCADE,
    UNIQUE KEY uk_menu_permission (menu_item_id, permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Endpoint table
CREATE TABLE api_endpoint (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    http_method VARCHAR(10) NOT NULL,
    url_pattern VARCHAR(500) NOT NULL,
    description VARCHAR(500),
    module VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_api_method (http_method),
    INDEX idx_api_pattern (url_pattern(255)),
    INDEX idx_api_module (module),
    INDEX idx_api_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Endpoint to Permission mapping (many-to-many)
-- Note: permission_code references permission_read_model.code
CREATE TABLE api_endpoint_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_endpoint_id BIGINT NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (api_endpoint_id) REFERENCES api_endpoint(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_code) REFERENCES permission_read_model(code) ON DELETE CASCADE,
    UNIQUE KEY uk_api_permission (api_endpoint_id, permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Item to API Endpoint mapping (which APIs does this menu option use)
CREATE TABLE menu_item_api_endpoint (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id BIGINT NOT NULL,
    api_endpoint_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(id) ON DELETE CASCADE,
    FOREIGN KEY (api_endpoint_id) REFERENCES api_endpoint(id) ON DELETE CASCADE,
    UNIQUE KEY uk_menu_api (menu_item_id, api_endpoint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
