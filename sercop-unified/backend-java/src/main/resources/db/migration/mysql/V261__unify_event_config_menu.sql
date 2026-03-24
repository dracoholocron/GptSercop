-- ============================================================================
-- V261__unify_event_config_menu.sql
-- Unify Event Configuration: remove Event Flows menu item, rename Event Types
-- to "Event Configuration" since both are now managed from a single page.
-- ============================================================================

-- 1. Deactivate the Event Flows menu item (no longer a separate page)
UPDATE menu_item
SET is_active = FALSE,
    updated_at = NOW()
WHERE code = 'CAT_EVENT_FLOWS';

-- 2. Rename Event Types menu item to Event Configuration
UPDATE menu_item
SET label_key = 'menu.catalogs.eventTypes',
    icon = 'Settings',
    updated_at = NOW()
WHERE code = 'CAT_EVENT_TYPES';
