-- =====================================================
-- V149: Refactor swift_field_config for i18n support
-- =====================================================
-- This migration was applied manually.
-- Keeping this file as a no-op for consistency.
--
-- Changes that were made:
-- 1. Removed 'language' column (frontend handles i18n)
-- 2. Deduplicated rows (one per fieldCode + messageType + specVersion)
-- 3. Renamed text columns to translation keys:
--    - field_name → field_name_key
--    - description → description_key (TEXT)
--    - help_text → help_text_key (TEXT)
--    - placeholder → placeholder_key
-- 4. Removed swift_definition_en column
-- =====================================================

SELECT 1; -- No-op placeholder
