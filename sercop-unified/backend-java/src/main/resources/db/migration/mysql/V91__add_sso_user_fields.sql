-- =============================================================================
-- Migration V91: Add SSO User Fields
-- Adds fields required for SSO authentication and makes password nullable
-- =============================================================================

-- 1. Add 'name' column for storing user's display name from SSO provider
-- Using procedure to check if column exists (MySQL doesn't support IF NOT EXISTS for ADD COLUMN)
SET @dbname = DATABASE();
SET @tablename = 'user_read_model';

-- Add name column if not exists
SET @columnname = 'name';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) AFTER email')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Make password nullable (SSO users don't have local passwords)
ALTER TABLE user_read_model
MODIFY COLUMN password VARCHAR(255) NULL;

-- 3. Add last_mfa_verified column if not exists
SET @columnname = 'last_mfa_verified';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL AFTER last_sso_login')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 4. Add mfa_enabled column if not exists
SET @columnname = 'mfa_enabled';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE AFTER last_mfa_verified')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 5. Update existing admin user to have the name field populated
UPDATE user_read_model
SET name = 'Administrator'
WHERE username = 'admin' AND (name IS NULL OR name = '');
