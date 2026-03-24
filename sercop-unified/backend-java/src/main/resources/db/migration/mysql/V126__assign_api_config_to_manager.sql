-- =============================================================================
-- Migration V126: Assign API Configuration permissions to ROLE_MANAGER
-- =============================================================================

-- Assign API_CONFIG view permission to ROLE_MANAGER
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_API_CONFIG'
FROM role_read_model r
WHERE r.name = 'ROLE_MANAGER'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign test permission to managers (useful for testing connections)
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_TEST_API_CONFIG'
FROM role_read_model r
WHERE r.name = 'ROLE_MANAGER'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Assign view logs permission to managers
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_VIEW_API_LOGS'
FROM role_read_model r
WHERE r.name = 'ROLE_MANAGER'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
