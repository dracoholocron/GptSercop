-- ============================================================================
-- V258: Fix Collections (MT4xx) SWIFT field configurations
-- ============================================================================
-- Problem: V149 i18n refactor was applied manually and may have lost/corrupted
-- the collections MT4xx field data. Section names may still be in Spanish.
-- This migration re-inserts all collections fields with correct column names
-- (field_name_key, description_key, etc.) and English section names.
-- ============================================================================

-- Step 1: Delete existing MT4xx field configs to avoid conflicts
DELETE FROM swift_field_config_readmodel WHERE message_type IN ('MT400', 'MT410', 'MT412', 'MT416', 'MT420');

-- ============================================================================
-- MT400 - ADVICE OF PAYMENT (COLLECTIONS)
-- ============================================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, spec_version, effective_date, created_by, created_at
) VALUES
(UUID(), ':20:', 'swift.mt400.20.fieldName', 'swift.mt400.20.description',
 'MT400', 'BASIC', 1, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt400.20.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt400.20.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':21:', 'swift.mt400.21.fieldName', 'swift.mt400.21.description',
 'MT400', 'BASIC', 2, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt400.21.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt400.21.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':32a:', 'swift.mt400.32a.fieldName', 'swift.mt400.32a.description',
 'MT400', 'AMOUNTS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'swift.mt400.32a.placeholder',
 '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}', 'swift.mt400.32a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':52a:', 'swift.mt400.52a.fieldName', 'swift.mt400.52a.description',
 'MT400', 'PARTIES', 4, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt400.52a.placeholder',
 NULL, 'swift.mt400.52a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':59:', 'swift.mt400.59.fieldName', 'swift.mt400.59.description',
 'MT400', 'PARTIES', 5, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt400.59.placeholder',
 NULL, 'swift.mt400.59.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':72:', 'swift.mt400.72.fieldName', 'swift.mt400.72.description',
 'MT400', 'ADDITIONAL', 6, false, true, 'TEXTAREA', 'TEXTAREA', 'swift.mt400.72.placeholder',
 '{"maxLength": 6000}', 'swift.mt400.72.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW());

-- ============================================================================
-- MT410 - ACKNOWLEDGEMENT (COLLECTIONS)
-- ============================================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, spec_version, effective_date, created_by, created_at
) VALUES
(UUID(), ':20:', 'swift.mt410.20.fieldName', 'swift.mt410.20.description',
 'MT410', 'BASIC', 1, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt410.20.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt410.20.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':21:', 'swift.mt410.21.fieldName', 'swift.mt410.21.description',
 'MT410', 'BASIC', 2, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt410.21.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt410.21.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':23:', 'swift.mt410.23.fieldName', 'swift.mt410.23.description',
 'MT410', 'BASIC', 3, false, true, 'TEXT', 'TEXT_INPUT', 'swift.mt410.23.placeholder',
 '{"maxLength": 16}', 'swift.mt410.23.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':52a:', 'swift.mt410.52a.fieldName', 'swift.mt410.52a.description',
 'MT410', 'PARTIES', 4, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt410.52a.placeholder',
 NULL, 'swift.mt410.52a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':59:', 'swift.mt410.59.fieldName', 'swift.mt410.59.description',
 'MT410', 'PARTIES', 5, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt410.59.placeholder',
 NULL, 'swift.mt410.59.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW());

-- ============================================================================
-- MT412 - ADVICE OF ACCEPTANCE (COLLECTIONS)
-- ============================================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, spec_version, effective_date, created_by, created_at
) VALUES
(UUID(), ':20:', 'swift.mt412.20.fieldName', 'swift.mt412.20.description',
 'MT412', 'BASIC', 1, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt412.20.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt412.20.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':21:', 'swift.mt412.21.fieldName', 'swift.mt412.21.description',
 'MT412', 'BASIC', 2, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt412.21.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt412.21.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':32a:', 'swift.mt412.32a.fieldName', 'swift.mt412.32a.description',
 'MT412', 'AMOUNTS', 3, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', 'swift.mt412.32a.placeholder',
 '{"minValue": 0.01, "maxValue": 99999999.99, "required": true}', 'swift.mt412.32a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':33a:', 'swift.mt412.33a.fieldName', 'swift.mt412.33a.description',
 'MT412', 'DATES', 4, true, true, 'DATE', 'DATE_PICKER', 'swift.mt412.33a.placeholder',
 NULL, 'swift.mt412.33a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':52a:', 'swift.mt412.52a.fieldName', 'swift.mt412.52a.description',
 'MT412', 'PARTIES', 5, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt412.52a.placeholder',
 NULL, 'swift.mt412.52a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':59:', 'swift.mt412.59.fieldName', 'swift.mt412.59.description',
 'MT412', 'PARTIES', 6, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt412.59.placeholder',
 NULL, 'swift.mt412.59.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':72:', 'swift.mt412.72.fieldName', 'swift.mt412.72.description',
 'MT412', 'ADDITIONAL', 7, false, true, 'TEXTAREA', 'TEXTAREA', 'swift.mt412.72.placeholder',
 '{"maxLength": 6000}', 'swift.mt412.72.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW());

-- ============================================================================
-- MT416 - ADVICE OF NON-PAYMENT/NON-ACCEPTANCE (COLLECTIONS)
-- ============================================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, spec_version, effective_date, created_by, created_at
) VALUES
(UUID(), ':20:', 'swift.mt416.20.fieldName', 'swift.mt416.20.description',
 'MT416', 'BASIC', 1, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt416.20.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt416.20.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':21:', 'swift.mt416.21.fieldName', 'swift.mt416.21.description',
 'MT416', 'BASIC', 2, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt416.21.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt416.21.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':52a:', 'swift.mt416.52a.fieldName', 'swift.mt416.52a.description',
 'MT416', 'PARTIES', 3, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt416.52a.placeholder',
 NULL, 'swift.mt416.52a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':59:', 'swift.mt416.59.fieldName', 'swift.mt416.59.description',
 'MT416', 'PARTIES', 4, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt416.59.placeholder',
 NULL, 'swift.mt416.59.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':77A:', 'swift.mt416.77A.fieldName', 'swift.mt416.77A.description',
 'MT416', 'ADDITIONAL', 5, true, true, 'TEXTAREA', 'TEXTAREA', 'swift.mt416.77A.placeholder',
 '{"maxLength": 2000, "required": true}', 'swift.mt416.77A.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW());

-- ============================================================================
-- MT420 - TRACER (COLLECTIONS)
-- ============================================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder_key,
    validation_rules, help_text_key, spec_version, effective_date, created_by, created_at
) VALUES
(UUID(), ':20:', 'swift.mt420.20.fieldName', 'swift.mt420.20.description',
 'MT420', 'BASIC', 1, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt420.20.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt420.20.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':21:', 'swift.mt420.21.fieldName', 'swift.mt420.21.description',
 'MT420', 'BASIC', 2, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt420.21.placeholder',
 '{"maxLength": 16, "required": true}', 'swift.mt420.21.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':11S:', 'swift.mt420.11S.fieldName', 'swift.mt420.11S.description',
 'MT420', 'BASIC', 3, true, true, 'TEXT', 'TEXT_INPUT', 'swift.mt420.11S.placeholder',
 '{"maxLength": 16, "pattern": "^MT[0-9]{3} [0-9]{6}$", "required": true}', 'swift.mt420.11S.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':52a:', 'swift.mt420.52a.fieldName', 'swift.mt420.52a.description',
 'MT420', 'PARTIES', 4, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt420.52a.placeholder',
 NULL, 'swift.mt420.52a.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':59:', 'swift.mt420.59.fieldName', 'swift.mt420.59.description',
 'MT420', 'PARTIES', 5, false, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', 'swift.mt420.59.placeholder',
 NULL, 'swift.mt420.59.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW()),

(UUID(), ':79:', 'swift.mt420.79.fieldName', 'swift.mt420.79.description',
 'MT420', 'ADDITIONAL', 6, true, true, 'TEXTAREA', 'TEXTAREA', 'swift.mt420.79.placeholder',
 '{"maxLength": 6000, "required": true}', 'swift.mt420.79.helpText', '2024', '2024-11-17', 'V258_MIGRATION', NOW());

-- ============================================================================
-- Also fix swift_section_config for MT4xx that might have Spanish names
-- ============================================================================
UPDATE swift_section_config SET section_code = 'BASIC' WHERE section_code = 'BASICA';
UPDATE swift_section_config SET section_code = 'PARTIES' WHERE section_code = 'PARTES';
UPDATE swift_section_config SET section_code = 'AMOUNTS' WHERE section_code = 'MONTOS';
UPDATE swift_section_config SET section_code = 'ADDITIONAL' WHERE section_code = 'ADICIONAL';
UPDATE swift_section_config SET section_code = 'DATES' WHERE section_code = 'FECHAS';
UPDATE swift_section_config SET section_code = 'BANKS' WHERE section_code = 'BANCOS';
