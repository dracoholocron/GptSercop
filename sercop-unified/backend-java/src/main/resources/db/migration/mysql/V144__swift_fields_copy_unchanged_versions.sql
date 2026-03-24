-- ==================================================
-- Migration: Copy SWIFT Fields for unchanged message types
-- Generated: 2026-01-15
-- Description: For messages that didn't change between versions,
--              copy the 2024 data to 2025 and 2026
-- ==================================================

-- MT400 - Copy 2024 to 2025 (no changes in 2025)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2025', '2025-11-16',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT400' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT400'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2025'
);

-- MT400 - Copy 2024 to 2026 (no changes in 2026)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2026', '2026-11-15',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT400' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT400'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2026'
);

-- MT410 - Copy 2024 to 2025
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2025', '2025-11-16',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT410' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT410'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2025'
);

-- MT410 - Copy 2024 to 2026
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2026', '2026-11-15',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT410' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT410'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2026'
);

-- MT412 - Copy 2024 to 2025
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2025', '2025-11-16',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT412' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT412'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2025'
);

-- MT412 - Copy 2024 to 2026
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2026', '2026-11-15',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT412' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT412'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2026'
);

-- MT416 - Copy 2024 to 2025 (changes only in 2026)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2025', '2025-11-16',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT416' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT416'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2025'
);

-- MT420 - Copy 2024 to 2025 (changes only in 2026)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2025', '2025-11-16',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT420' AND spec_version = '2024'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT420'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2025'
);

-- MT430 - Copy 2026 to 2024 and 2025 (only has 2026 data, need previous versions)
-- First, add 2024 version
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2024', '2024-11-17',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT430' AND spec_version = '2026'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT430'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2024'
);

-- MT430 - Add 2025 version
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
)
SELECT
    UUID(), field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, '2025', '2025-11-16',
    NOW(), 'SYSTEM'
FROM swift_field_config_readmodel
WHERE message_type = 'MT430' AND spec_version = '2026'
AND NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel s2
    WHERE s2.field_code = swift_field_config_readmodel.field_code
    AND s2.message_type = 'MT430'
    AND s2.language = swift_field_config_readmodel.language
    AND s2.spec_version = '2025'
);
