-- Assign ROLE_CLIENT to maria.garcia@abcexports.com for client portal access
-- This role is required for the frontend to redirect to client portal instead of business-intelligence

-- Get the ROLE_CLIENT role id
SET @client_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT' LIMIT 1);

-- Get the user id for maria.garcia@abcexports.com
SET @maria_user_id = (SELECT id FROM user_read_model WHERE email = 'maria.garcia@abcexports.com' LIMIT 1);

-- Assign ROLE_CLIENT to the user if both exist
INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT @maria_user_id, @client_role_id
WHERE @maria_user_id IS NOT NULL AND @client_role_id IS NOT NULL;

-- Also assign ROLE_CLIENT_PORTAL_USER for full client portal permissions
SET @client_portal_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT_PORTAL_USER' LIMIT 1);

INSERT IGNORE INTO user_role_read_model (user_id, role_id)
SELECT @maria_user_id, @client_portal_role_id
WHERE @maria_user_id IS NOT NULL AND @client_portal_role_id IS NOT NULL;
