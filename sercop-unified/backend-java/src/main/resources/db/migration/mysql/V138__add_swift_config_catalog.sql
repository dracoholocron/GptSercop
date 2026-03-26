-- ==================================================
-- Migration V138: Add SWIFT Configuration Catalog
-- ==================================================
-- Creates a custom catalog for SWIFT configuration settings
-- that can be managed through the existing catalog UI.
--
-- Usage:
-- - SWIFT_SPEC_VERSION_OVERRIDE: When active and name is not empty,
--   forces the specified SWIFT spec version for all users (testing mode)
-- ==================================================

CREATE TABLE IF NOT EXISTS custom_catalog_read_model (
    id BIGINT NOT NULL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    level INT NOT NULL,
    parent_catalog_id BIGINT,
    parent_catalog_code VARCHAR(100),
    parent_catalog_name VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_custom_catalog_code (code),
    INDEX idx_custom_catalog_level (level),
    INDEX idx_custom_catalog_parent (parent_catalog_id),
    INDEX idx_custom_catalog_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 1: Create parent catalog (Level 1)
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'SWIFT_CONFIG',
    'Configuración SWIFT',
    'Configuraciones del módulo SWIFT para mensajes MT700, MT710, etc.',
    1,
    NULL,
    NULL,
    NULL,
    true,
    100,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'SWIFT_CONFIG'
);

-- Step 2: Create child record for spec version override (Level 2)
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'SWIFT_SPEC_VERSION_OVERRIDE',
    '',  -- Empty = no override, use automatic version resolution
    'Versión de especificación SWIFT forzada para pruebas. Valores válidos: 2024, 2026. Vacío = automático por fecha.',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'SWIFT_CONFIG'),
    'SWIFT_CONFIG',
    'Configuración SWIFT',
    false,  -- Disabled by default (use automatic version)
    1,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'SWIFT_SPEC_VERSION_OVERRIDE'
);

-- Step 3: Create additional config entries for future use
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'SWIFT_SHOW_DEPRECATED_FIELDS',
    'false',
    'Mostrar campos deprecados en formularios SWIFT. Valores: true, false.',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'SWIFT_CONFIG'),
    'SWIFT_CONFIG',
    'Configuración SWIFT',
    false,
    2,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'SWIFT_SHOW_DEPRECATED_FIELDS'
);

-- ==================================================
-- Documentation: How to Use
-- ==================================================
--
-- To FORCE a specific SWIFT spec version for testing:
-- 1. Go to Admin → Catálogos Personalizados → SWIFT_CONFIG
-- 2. Edit "SWIFT_SPEC_VERSION_OVERRIDE"
-- 3. Set "nombre" to the desired version (e.g., "2026")
-- 4. Set "activo" to TRUE
-- 5. Save changes
--
-- To DISABLE the override and return to automatic mode:
-- 1. Set "activo" to FALSE (or clear the "nombre" field)
--
-- The system will:
-- - If override is ACTIVE and nombre is not empty: Use that version for ALL users
-- - If override is INACTIVE or nombre is empty: Use automatic date-based resolution
--
-- ==================================================
