-- ============================================================================
-- V249__fix_feature_certification_menu.sql
-- Fix: Add Feature Certification menu item with correct parent code
-- Note: Permission assignment moved to V250
-- ============================================================================

-- Insert menu item for Feature Certification (admin only)
-- Permission is handled in V250 after creating the proper permission
INSERT INTO menu_item (code, label_key, icon, path, display_order, is_active, is_section, parent_id)
SELECT 'FEATURE_CERTIFICATION', 'menu.admin.featureCertification', 'FiCheckSquare', '/admin/feature-certification',
       100, TRUE, FALSE, m.id
FROM menu_item m
WHERE m.code = 'SECTION_ADMIN'
ON DUPLICATE KEY UPDATE
    path = '/admin/feature-certification',
    is_active = TRUE,
    updated_at = NOW();
