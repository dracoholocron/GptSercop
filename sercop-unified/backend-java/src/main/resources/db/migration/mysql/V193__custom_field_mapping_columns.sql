-- =============================================================================
-- Migration V193: Add Field Mapping Columns to custom_field_config_readmodel
-- Enables configurable mapping from Client Portal fields to Operation/SWIFT fields
-- =============================================================================

-- ============================================
-- 1. Add mapping columns to custom_field_config_readmodel (idempotent)
-- ============================================

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table VARCHAR(100),
    IN p_column VARCHAR(100),
    IN p_definition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Add columns using the procedure
CALL add_column_if_not_exists('custom_field_config_readmodel', 'maps_to_product_type', "VARCHAR(50) NULL COMMENT 'Target product type for mapping'");
CALL add_column_if_not_exists('custom_field_config_readmodel', 'maps_to_field_code', "VARCHAR(100) NULL COMMENT 'Target field code in operation form'");
CALL add_column_if_not_exists('custom_field_config_readmodel', 'maps_to_swift_tag', "VARCHAR(20) NULL COMMENT 'SWIFT message tag'");
CALL add_column_if_not_exists('custom_field_config_readmodel', 'maps_to_swift_line', "INT NULL COMMENT 'Line number within multi-line SWIFT tags'");
CALL add_column_if_not_exists('custom_field_config_readmodel', 'mapping_transformation', "VARCHAR(50) NULL COMMENT 'Transformation type: DIRECT, UPPERCASE, FORMAT_DATE, LOOKUP, TRUNCATE'");
CALL add_column_if_not_exists('custom_field_config_readmodel', 'mapping_params', "JSON NULL COMMENT 'Transformation parameters as JSON'");

-- Cleanup procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Add index for mapping queries (if not exists)
DROP PROCEDURE IF EXISTS create_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE create_index_if_not_exists()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_field_config_readmodel'
        AND INDEX_NAME = 'idx_custom_field_mapping'
    ) THEN
        CREATE INDEX idx_custom_field_mapping ON custom_field_config_readmodel (maps_to_product_type, maps_to_field_code);
    END IF;
END //
DELIMITER ;
CALL create_index_if_not_exists();
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

-- ============================================
-- 2. Sample mapping data for LC Import fields
-- ============================================

-- Update existing CLIENT_LC_IMPORT_REQUEST fields with mapping info
-- Note: These UPDATEs will only affect rows that exist

-- Beneficiary Name -> SWIFT :59 line 1
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F59_BENEFICIARY_NAME',
    maps_to_swift_tag = ':59',
    maps_to_swift_line = 1,
    mapping_transformation = 'UPPERCASE',
    mapping_params = '{"maxLength": 35}'
WHERE field_code = 'BENEFICIARY_NAME'
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Beneficiary Address -> SWIFT :59 lines 2-3
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F59_BENEFICIARY_ADDRESS',
    maps_to_swift_tag = ':59',
    maps_to_swift_line = 2,
    mapping_transformation = 'UPPERCASE',
    mapping_params = '{"maxLength": 35, "wrapToNextLine": true}'
WHERE field_code = 'BENEFICIARY_ADDRESS'
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Beneficiary Country -> SWIFT :59 line 4 (lookup country code)
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F59_BENEFICIARY_COUNTRY',
    maps_to_swift_tag = ':59',
    maps_to_swift_line = 4,
    mapping_transformation = 'LOOKUP',
    mapping_params = '{"catalog": "COUNTRIES", "sourceField": "code", "targetField": "swiftCode"}'
WHERE field_code = 'BENEFICIARY_COUNTRY'
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Amount -> SWIFT :32B
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F32B_AMOUNT',
    maps_to_swift_tag = ':32B',
    maps_to_swift_line = NULL,
    mapping_transformation = 'DIRECT',
    mapping_params = NULL
WHERE field_code IN ('LC_AMOUNT', 'AMOUNT')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Currency -> SWIFT :32B
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F32B_CURRENCY',
    maps_to_swift_tag = ':32B',
    maps_to_swift_line = NULL,
    mapping_transformation = 'DIRECT',
    mapping_params = NULL
WHERE field_code IN ('LC_CURRENCY', 'CURRENCY')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Expiry Date -> SWIFT :31D
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F31D_EXPIRY_DATE',
    maps_to_swift_tag = ':31D',
    maps_to_swift_line = NULL,
    mapping_transformation = 'FORMAT_DATE',
    mapping_params = '{"inputFormat": "yyyy-MM-dd", "outputFormat": "yyMMdd"}'
WHERE field_code IN ('EXPIRY_DATE', 'LC_EXPIRY_DATE')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Expiry Place -> SWIFT :31D
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F31D_EXPIRY_PLACE',
    maps_to_swift_tag = ':31D',
    maps_to_swift_line = NULL,
    mapping_transformation = 'UPPERCASE',
    mapping_params = '{"maxLength": 29}'
WHERE field_code IN ('EXPIRY_PLACE', 'LC_EXPIRY_PLACE')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Goods Description -> SWIFT :45A
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F45A_GOODS_DESCRIPTION',
    maps_to_swift_tag = ':45A',
    maps_to_swift_line = NULL,
    mapping_transformation = 'UPPERCASE',
    mapping_params = '{"maxLength": 65, "multiLine": true, "maxLines": 100}'
WHERE field_code IN ('GOODS_DESCRIPTION', 'LC_GOODS_DESCRIPTION')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- Latest Shipment Date -> SWIFT :44C
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'LC_IMPORT',
    maps_to_field_code = 'F44C_LATEST_SHIPMENT',
    maps_to_swift_tag = ':44C',
    maps_to_swift_line = NULL,
    mapping_transformation = 'FORMAT_DATE',
    mapping_params = '{"inputFormat": "yyyy-MM-dd", "outputFormat": "yyMMdd"}'
WHERE field_code IN ('LATEST_SHIPMENT_DATE', 'SHIPMENT_DATE')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_LC_IMPORT_REQUEST'
  );

-- ============================================
-- 3. Sample mapping data for Guarantee fields
-- ============================================

-- Guarantee Beneficiary -> SWIFT :58
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'GUARANTEE',
    maps_to_field_code = 'F58_BENEFICIARY',
    maps_to_swift_tag = ':58',
    maps_to_swift_line = 1,
    mapping_transformation = 'UPPERCASE',
    mapping_params = '{"maxLength": 35}'
WHERE field_code = 'GB_BENEFICIARY_NAME'
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_GUARANTEE_REQUEST'
  );

-- Guarantee Amount -> SWIFT :32B
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'GUARANTEE',
    maps_to_field_code = 'F32B_AMOUNT',
    maps_to_swift_tag = ':32B',
    maps_to_swift_line = NULL,
    mapping_transformation = 'DIRECT',
    mapping_params = NULL
WHERE field_code IN ('GB_AMOUNT', 'GUARANTEE_AMOUNT')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_GUARANTEE_REQUEST'
  );

-- Guarantee Expiry Date -> SWIFT :31L
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'GUARANTEE',
    maps_to_field_code = 'F31L_EXPIRY_DATE',
    maps_to_swift_tag = ':31L',
    maps_to_swift_line = NULL,
    mapping_transformation = 'FORMAT_DATE',
    mapping_params = '{"inputFormat": "yyyy-MM-dd", "outputFormat": "yyMMdd"}'
WHERE field_code IN ('GB_EXPIRY_DATE', 'GUARANTEE_EXPIRY_DATE')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_GUARANTEE_REQUEST'
  );

-- Guarantee Text -> SWIFT :77C
UPDATE custom_field_config_readmodel
SET maps_to_product_type = 'GUARANTEE',
    maps_to_field_code = 'F77C_GUARANTEE_TEXT',
    maps_to_swift_tag = ':77C',
    maps_to_swift_line = NULL,
    mapping_transformation = 'UPPERCASE',
    mapping_params = '{"maxLength": 78, "multiLine": true, "maxLines": 150}'
WHERE field_code IN ('GB_TEXT', 'GUARANTEE_TEXT')
  AND section_id IN (
    SELECT s.id FROM custom_field_section_config_readmodel s
    JOIN custom_field_step_config_readmodel st ON s.step_id = st.id
    WHERE st.product_type = 'CLIENT_GUARANTEE_REQUEST'
  );

-- ============================================
-- 4. Create Catalogs for Mapping Configuration
-- ============================================
-- NOTE: Catalog insertions skipped - table schema differs from expected.
-- These catalogs can be added later through the UI or a separate migration.
