-- V52: Add default values for MT707 reference fields
-- These default values use dynamic expressions that are evaluated at runtime:
-- - {{operation.sequentialReference}}: Reference + sequential number (reference + messageCount+1 padded to 2 digits)
-- - {{operation.reference}}: The original operation reference

-- =============================================
-- 1. Update :20: (Sender's Reference) with sequential reference
-- =============================================

UPDATE swift_field_config_readmodel
SET default_value = '{{operation.sequentialReference}}'
WHERE field_code = ':20:'
  AND message_type = 'MT707';

-- =============================================
-- 2. Update :21: (Related Reference) with original reference
-- =============================================

UPDATE swift_field_config_readmodel
SET default_value = '{{operation.reference}}'
WHERE field_code = ':21:'
  AND message_type = 'MT707';
