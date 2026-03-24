-- =====================================================
-- V223: Agregar catálogo de configuración del sistema
-- =====================================================
-- Este catálogo contiene parámetros globales del sistema
-- como la moneda local, país, zona horaria, etc.
-- IDs: 20000-20010 (reserved for system config)
-- =====================================================

-- Insertar catálogo padre SYSTEM_CONFIG si no existe
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id,
    active, is_system, display_order, created_at, created_by
)
VALUES (20000, 'SYSTEM_CONFIG', 'Configuración del Sistema', 'Parámetros globales de configuración del sistema', 1, NULL,
       true, true, 1, NOW(), 'V223_MIGRATION');

-- Insertar parámetro LOCAL_CURRENCY (Moneda Local)
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code, parent_catalog_name,
    active, is_system, display_order, created_at, created_by
)
VALUES (20001, 'LOCAL_CURRENCY', 'USD', 'Moneda nacional del país de instalación (US Dollar)', 2, 20000,
       'SYSTEM_CONFIG', 'Configuración del Sistema', true, true, 1, NOW(), 'V223_MIGRATION');

-- Insertar parámetro COUNTRY_CODE (Código de País)
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code, parent_catalog_name,
    active, is_system, display_order, created_at, created_by
)
VALUES (20002, 'COUNTRY_CODE', 'EC', 'Ecuador - País de instalación del sistema', 2, 20000,
       'SYSTEM_CONFIG', 'Configuración del Sistema', true, true, 2, NOW(), 'V223_MIGRATION');

-- Insertar parámetro TIMEZONE (Zona Horaria)
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code, parent_catalog_name,
    active, is_system, display_order, created_at, created_by
)
VALUES (20003, 'TIMEZONE', 'America/Guayaquil', 'Zona horaria del sistema', 2, 20000,
       'SYSTEM_CONFIG', 'Configuración del Sistema', true, true, 3, NOW(), 'V223_MIGRATION');

-- Insertar parámetro DATE_FORMAT (Formato de Fecha)
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code, parent_catalog_name,
    active, is_system, display_order, created_at, created_by
)
VALUES (20004, 'DATE_FORMAT', 'DD/MM/YYYY', 'Formato de fecha para visualización', 2, 20000,
       'SYSTEM_CONFIG', 'Configuración del Sistema', true, true, 4, NOW(), 'V223_MIGRATION');

-- Insertar parámetro CURRENCY_DECIMALS (Decimales de Moneda)
INSERT IGNORE INTO custom_catalog_read_model (
    id, code, name, description, level, parent_catalog_id, parent_catalog_code, parent_catalog_name,
    active, is_system, display_order, created_at, created_by
)
VALUES (20005, 'CURRENCY_DECIMALS', '2', 'Número de decimales para montos', 2, 20000,
       'SYSTEM_CONFIG', 'Configuración del Sistema', true, true, 5, NOW(), 'V223_MIGRATION');
