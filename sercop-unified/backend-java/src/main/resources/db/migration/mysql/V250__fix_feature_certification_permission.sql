-- ============================================================================
-- V250__fix_feature_certification_permission.sql
-- Fix: Create permission for Feature Certification and assign to admin role
-- ============================================================================

-- 1. Create permission for viewing feature certification
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'CAN_VIEW_FEATURE_CERTIFICATION', 'Ver Certificación de Funcionalidades',
       'Permite ver y gestionar el estado de certificación de funcionalidades',
       'ADMINISTRATION', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permission_read_model WHERE code = 'CAN_VIEW_FEATURE_CERTIFICATION'
);

-- 2. Assign permission to ADMIN role
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_FEATURE_CERTIFICATION'
FROM role_read_model r
WHERE r.name = 'ROLE_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model rp
    WHERE rp.role_id = r.id AND rp.permission_code = 'CAN_VIEW_FEATURE_CERTIFICATION'
);

-- 3. Delete incorrect menu_item_permission if it exists (cleanup from V249)
DELETE FROM menu_item_permission
WHERE menu_item_id IN (SELECT id FROM menu_item WHERE code = 'FEATURE_CERTIFICATION')
AND permission_code = 'ROLE_ADMIN';

-- 4. Add correct permission to menu item
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT mi.id, 'CAN_VIEW_FEATURE_CERTIFICATION'
FROM menu_item mi
WHERE mi.code = 'FEATURE_CERTIFICATION'
AND NOT EXISTS (
    SELECT 1 FROM menu_item_permission mip
    WHERE mip.menu_item_id = mi.id AND mip.permission_code = 'CAN_VIEW_FEATURE_CERTIFICATION'
);
