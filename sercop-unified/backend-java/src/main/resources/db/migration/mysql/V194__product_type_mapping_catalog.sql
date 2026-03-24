-- =============================================================================
-- Migration V194: Create Product Type Mapping Catalog
-- Maps Client Portal product types to Operation product types
-- Uses the existing custom_catalog_read_model structure (level 1=catalog, level 2=items)
-- =============================================================================

-- Step 1: Create parent catalog PRODUCT_TYPE_MAPPING (Level 1)
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    'Mapea tipos de producto del Portal Cliente a tipos de Operación',
    1,
    NULL,
    NULL,
    NULL,
    true,
    200,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'
);

-- Step 2: Create mapping entries (Level 2)
-- code = sourceProductType, name = targetProductType

-- LC Import mappings
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'LC_IMPORT_REQUEST',
    'LC_IMPORT',
    'Solicitud LC Importación → LC Importación',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    1,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'LC_IMPORT_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);

INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'CLIENT_LC_IMPORT_REQUEST',
    'LC_IMPORT',
    'Solicitud LC Importación (Cliente) → LC Importación',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    2,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'CLIENT_LC_IMPORT_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);

-- LC Export mappings
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'LC_EXPORT_REQUEST',
    'LC_EXPORT',
    'Solicitud LC Exportación → LC Exportación',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    10,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'LC_EXPORT_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);

INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'CLIENT_LC_EXPORT_REQUEST',
    'LC_EXPORT',
    'Solicitud LC Exportación (Cliente) → LC Exportación',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    11,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'CLIENT_LC_EXPORT_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);

-- Guarantee mappings
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'GUARANTEE_REQUEST',
    'GUARANTEE',
    'Solicitud Garantía → Garantía',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    20,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'GUARANTEE_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);

INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'CLIENT_GUARANTEE_REQUEST',
    'GUARANTEE',
    'Solicitud Garantía (Cliente) → Garantía',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    21,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'CLIENT_GUARANTEE_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);

-- Collection mappings
INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'COLLECTION_REQUEST',
    'COLLECTION',
    'Solicitud Cobranza → Cobranza',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    30,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'COLLECTION_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);

INSERT INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    parent_catalog_code, parent_catalog_name, active, display_order,
    created_at, created_by
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM custom_catalog_read_model c2),
    'CLIENT_COLLECTION_REQUEST',
    'COLLECTION',
    'Solicitud Cobranza (Cliente) → Cobranza',
    2,
    (SELECT id FROM custom_catalog_read_model WHERE code = 'PRODUCT_TYPE_MAPPING'),
    'PRODUCT_TYPE_MAPPING',
    'Mapeo Tipos de Producto',
    true,
    31,
    NOW(),
    'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM custom_catalog_read_model WHERE code = 'CLIENT_COLLECTION_REQUEST' AND parent_catalog_code = 'PRODUCT_TYPE_MAPPING'
);
