-- =============================================================================
-- V101: Grant ALL permissions to ADMIN role
-- =============================================================================
-- Ensures ROLE_ADMIN has access to everything

-- Insert all existing permissions to ADMIN role (using INSERT IGNORE to skip duplicates)
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r
CROSS JOIN permission_read_model p
WHERE r.name = 'ROLE_ADMIN';

-- Verify count
-- SELECT COUNT(*) as admin_permissions FROM role_permission_read_model WHERE role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_ADMIN');
