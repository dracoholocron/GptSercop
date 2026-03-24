-- =====================================================
-- V20260302_10: Disable unimplemented CP menu items
-- =====================================================
-- These menu items don't have frontend pages yet.
-- Set is_active = FALSE so they don't appear in the sidebar.
-- Re-enable them when their pages are implemented.
-- =====================================================

UPDATE menu_item SET is_active = FALSE WHERE code IN (
    'CP_EVALUATIONS',
    'CP_CONTRACTS',
    'CP_BIDDERS',
    'CP_REPORTS'
);
