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
