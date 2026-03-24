-- =============================================================================
-- V108: Remove Menu Items for features handled by action execution system
-- Removed: LC Import/Export Amendment, Negotiation, Payment, Guarantee Payment
-- =============================================================================

-- First, remove the permissions associated with these menu items
DELETE FROM menu_item_permission WHERE menu_item_id IN (
    SELECT id FROM menu_item WHERE code IN (
        'LC_IMPORT_AMENDMENT',
        'LC_IMPORT_NEGOTIATION',
        'LC_IMPORT_PAYMENT',
        'LC_EXPORT_AMENDMENT',
        'LC_EXPORT_NEGOTIATION',
        'LC_EXPORT_PAYMENT',
        'GUARANTEE_PAYMENT'
    )
);

-- Then, remove the menu items themselves
DELETE FROM menu_item WHERE code IN (
    'LC_IMPORT_AMENDMENT',
    'LC_IMPORT_NEGOTIATION',
    'LC_IMPORT_PAYMENT',
    'LC_EXPORT_AMENDMENT',
    'LC_EXPORT_NEGOTIATION',
    'LC_EXPORT_PAYMENT',
    'GUARANTEE_PAYMENT'
);
