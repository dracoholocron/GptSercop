-- ================================================
-- V221: Add missing section configs for all message types
-- Description: Ensures all sections used in swift_field_config_readmodel have corresponding entries in swift_section_config
-- Author: GlobalCMX Architecture
-- Date: 2026-01-31
-- ================================================

-- Step 1: Update fields with GENERAL section to use BASIC instead (GENERAL is not a standard section)
UPDATE swift_field_config_readmodel
SET section = 'BASIC', updated_at = NOW(), updated_by = 'V221_FIX_SECTIONS'
WHERE section = 'GENERAL';

-- Step 2: Add INSTRUCTIONS section for all LC-related message types
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at, updated_at)
VALUES
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT700', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT705', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT707', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT710', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT720', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT730', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT740', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT760', 9, 'FiFileText', 1, NOW(), NOW()),
    (UUID(), 'INSTRUCTIONS', 'swift.sections.instructions.label', 'swift.sections.instructions.description', 'MT767', 9, 'FiFileText', 1, NOW(), NOW());

-- Log summary
SELECT
    'V221 Migration Complete' AS status,
    (SELECT COUNT(*) FROM swift_field_config_readmodel WHERE section = 'GENERAL') AS remaining_general,
    (SELECT COUNT(*) FROM swift_section_config WHERE section_code = 'INSTRUCTIONS') AS instructions_added;
