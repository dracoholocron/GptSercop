-- =============================================================================
-- Migration V189: Restrict Business Intelligence menu to INTERNAL users
-- CLIENT users should not see /business-intelligence in their menu
-- =============================================================================

-- Mark business intelligence menu item as INTERNAL only
UPDATE menu_item
SET user_type_restriction = 'INTERNAL'
WHERE code = 'BUSINESS_INTEL';

-- Also restrict the AI section if it exists
UPDATE menu_item
SET user_type_restriction = 'INTERNAL'
WHERE code = 'SECTION_AI';
