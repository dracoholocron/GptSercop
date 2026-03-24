-- =====================================================
-- V243: Fix Test Plan Alerts - Assign to newadmin
-- =====================================================
-- Update test plan alerts from 'admin' to 'newadmin'

UPDATE user_alert_readmodel
SET user_id = 'newadmin',
    user_name = 'New Admin',
    assigned_role = 'ROLE_ADMIN'
WHERE user_id = 'admin'
  AND tags LIKE '%plan-pruebas%';

-- Verify the update
SELECT COUNT(*) as updated_alerts FROM user_alert_readmodel
WHERE user_id = 'newadmin' AND tags LIKE '%plan-pruebas%';
