-- =============================================================================
-- MFA (Multi-Factor Authentication) Tables
-- =============================================================================
-- This migration creates tables for MFA enrollment and verification
-- Supports both internal TOTP and IdP-delegated MFA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: user_mfa_enrollment
-- Stores MFA enrollment data for each user and method
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_mfa_enrollment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,

    -- MFA Method: TOTP, SMS, EMAIL, WEBAUTHN, PUSH
    method VARCHAR(20) NOT NULL,

    -- For TOTP: Base32 encoded secret
    totp_secret VARCHAR(255),

    -- For SMS: Phone number with country code
    phone_number VARCHAR(30),

    -- For Email: Backup/secondary email
    backup_email VARCHAR(255),

    -- For WebAuthn: Credential ID and public key
    webauthn_credential_id VARCHAR(500),
    webauthn_public_key TEXT,

    -- Enrollment status
    verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,

    -- Sync status with IdP
    synced_to_idp BOOLEAN DEFAULT FALSE,
    idp_enrollment_id VARCHAR(255),
    last_sync_at TIMESTAMP NULL,
    sync_error VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,

    -- Constraints
    CONSTRAINT fk_mfa_user FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_method UNIQUE (user_id, method),

    INDEX idx_mfa_user_id (user_id),
    INDEX idx_mfa_method (method),
    INDEX idx_mfa_verified (verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: mfa_verification_attempt
-- Audit log of all MFA verification attempts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_verification_attempt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,

    -- Verification details
    method VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),

    -- Context
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    device_fingerprint VARCHAR(255),

    -- Risk context (from Risk Engine)
    risk_score INT,
    triggered_by_risk BOOLEAN DEFAULT FALSE,

    -- Timestamps
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mfa_attempt_user FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,

    INDEX idx_mfa_attempt_user (user_id),
    INDEX idx_mfa_attempt_time (attempted_at),
    INDEX idx_mfa_attempt_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: mfa_recovery_code
-- Backup recovery codes for MFA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_recovery_code (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,

    -- Hashed recovery code (bcrypt)
    code_hash VARCHAR(255) NOT NULL,

    -- Usage tracking
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    used_ip VARCHAR(45),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,

    CONSTRAINT fk_recovery_user FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,

    INDEX idx_recovery_user (user_id),
    INDEX idx_recovery_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: mfa_trusted_device
-- Devices that can skip MFA (remember device feature)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_trusted_device (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,

    -- Device identification
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- DESKTOP, MOBILE, TABLET
    browser VARCHAR(100),
    os VARCHAR(100),

    -- Trust period
    trusted_until TIMESTAMP NOT NULL,

    -- Tracking
    last_used_at TIMESTAMP NULL,
    last_ip VARCHAR(45),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_trusted_device_user FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_device UNIQUE (user_id, device_fingerprint),

    INDEX idx_trusted_user (user_id),
    INDEX idx_trusted_until (trusted_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: idp_mfa_sync_log
-- Audit log of MFA configuration sync to Identity Providers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idp_mfa_sync_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- IdP details
    identity_provider VARCHAR(30) NOT NULL, -- AUTH0, OKTA, AZURE_AD, GOOGLE, COGNITO

    -- Sync operation
    operation VARCHAR(50) NOT NULL, -- ENABLE_FACTOR, DISABLE_FACTOR, UPDATE_POLICY, SYNC_USER
    target_user_id BIGINT NULL,

    -- Request/Response
    request_payload JSON,
    response_payload JSON,

    -- Status
    success BOOLEAN NOT NULL,
    error_message TEXT,
    http_status INT,

    -- Timestamps
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sync_idp (identity_provider),
    INDEX idx_sync_time (synced_at),
    INDEX idx_sync_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Add MFA fields to user_read_model
-- Using individual ALTER statements (will fail if column exists, but that's OK)
-- -----------------------------------------------------------------------------
-- Note: These columns may already exist. Run flyway repair if needed.

-- -----------------------------------------------------------------------------
-- Insert MFA configuration into security_configuration_read_model
-- Note: Using INSERT IGNORE to skip if config already exists
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO security_configuration_read_model (config_type, config_key, config_value, is_active, created_by)
VALUES
    ('MFA', 'mfa.policy', JSON_OBJECT(
        'value', 'risk-based',
        'options', JSON_ARRAY('disabled', 'optional', 'required', 'risk-based')
    ), true, 'system'),

    ('MFA', 'mfa.methods.totp.enabled', JSON_OBJECT('value', true), true, 'system'),
    ('MFA', 'mfa.methods.sms.enabled', JSON_OBJECT('value', true), true, 'system'),
    ('MFA', 'mfa.methods.email.enabled', JSON_OBJECT('value', false), true, 'system'),
    ('MFA', 'mfa.methods.webauthn.enabled', JSON_OBJECT('value', false), true, 'system'),
    ('MFA', 'mfa.methods.push.enabled', JSON_OBJECT('value', false), true, 'system'),

    ('MFA', 'mfa.remember_device.enabled', JSON_OBJECT('value', true), true, 'system'),
    ('MFA', 'mfa.remember_device.days', JSON_OBJECT('value', 30), true, 'system'),

    ('MFA', 'mfa.recovery_codes.enabled', JSON_OBJECT('value', true), true, 'system'),
    ('MFA', 'mfa.recovery_codes.count', JSON_OBJECT('value', 10), true, 'system'),

    ('MFA', 'mfa.grace_period.enabled', JSON_OBJECT('value', true), true, 'system'),
    ('MFA', 'mfa.grace_period.days', JSON_OBJECT('value', 7), true, 'system'),

    ('MFA', 'mfa.idp_sync.enabled', JSON_OBJECT('value', true), true, 'system'),
    ('MFA', 'mfa.idp_sync.sync_phone', JSON_OBJECT('value', true), true, 'system');
