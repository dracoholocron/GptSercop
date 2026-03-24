-- Security Configuration Framework
-- Supports: CQRS, 4-Eyes Principle, Risk-Based Auth, Multi-Engine Authorization

-- Main security configuration table (stores JSON config)
CREATE TABLE IF NOT EXISTS security_configuration_read_model (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_type ENUM('AUTHENTICATION', 'AUTHORIZATION', 'AUDIT', 'RISK', 'SESSION', 'MFA') NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    environment VARCHAR(50) DEFAULT 'production',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    version BIGINT DEFAULT 0,
    UNIQUE KEY uk_config (config_type, config_key, environment),
    INDEX idx_config_type (config_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security presets (with i18n keys, no hardcoded text)
CREATE TABLE IF NOT EXISTS security_preset_read_model (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_key VARCHAR(100) NOT NULL,
    description_key VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    config_json JSON NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_system (is_system),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4-Eyes configuration per entity/action
CREATE TABLE IF NOT EXISTS four_eyes_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    min_approvers INT DEFAULT 1,
    amount_threshold DECIMAL(19,4),
    require_different_department BOOLEAN DEFAULT FALSE,
    require_higher_role BOOLEAN DEFAULT FALSE,
    excluded_roles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    UNIQUE KEY uk_entity_action (entity_type, action_type),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Risk scoring rules
CREATE TABLE IF NOT EXISTS risk_scoring_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type ENUM('IP_LOCATION', 'TIME_BASED', 'DEVICE', 'BEHAVIOR', 'AMOUNT', 'FREQUENCY') NOT NULL,
    condition_json JSON NOT NULL,
    risk_score INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (rule_type),
    INDEX idx_active_priority (is_active, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security configuration audit log
CREATE TABLE IF NOT EXISTS security_config_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_type VARCHAR(50) NOT NULL,
    config_key VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    previous_value JSON,
    new_value JSON,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    INDEX idx_config_type (config_type),
    INDEX idx_changed_at (changed_at),
    INDEX idx_changed_by (changed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default security presets
INSERT IGNORE INTO security_preset_read_model (code, name_key, description_key, icon, config_json, is_system, display_order) VALUES
('ENTERPRISE_TRADITIONAL',
 'securityPresets.enterpriseTraditional.name',
 'securityPresets.enterpriseTraditional.description',
 'FaBuilding',
 '{
   "authentication": {
     "primaryProvider": "azure-ad",
     "sessionTimeout": 480,
     "maxConcurrentSessions": 3
   },
   "authorization": {
     "primaryEngine": "rbac",
     "engines": {"rbac": true, "abac": false, "opa": false}
   },
   "mfa": {
     "policy": "required",
     "methods": ["authenticator", "sms"]
   },
   "fourEyes": {
     "enabled": true,
     "defaultMinApprovers": 1
   }
 }', TRUE, 1),

('CLOUD_NATIVE_FINTECH',
 'securityPresets.cloudNativeFintech.name',
 'securityPresets.cloudNativeFintech.description',
 'FaCloud',
 '{
   "authentication": {
     "primaryProvider": "auth0",
     "passwordless": true,
     "sessionTimeout": 240
   },
   "authorization": {
     "primaryEngine": "opa",
     "engines": {"rbac": true, "abac": true, "opa": true}
   },
   "mfa": {
     "policy": "risk-based",
     "methods": ["authenticator", "webauthn", "push"]
   },
   "fourEyes": {
     "enabled": true,
     "defaultMinApprovers": 2,
     "amountBasedApproval": true
   },
   "riskEngine": {
     "enabled": true,
     "mlPowered": true
   }
 }', TRUE, 2),

('HIGH_SECURITY_BANKING',
 'securityPresets.highSecurityBanking.name',
 'securityPresets.highSecurityBanking.description',
 'FaShieldAlt',
 '{
   "authentication": {
     "primaryProvider": "okta",
     "sessionTimeout": 120,
     "maxConcurrentSessions": 1,
     "ipWhitelist": true
   },
   "authorization": {
     "primaryEngine": "rbac",
     "engines": {"rbac": true, "abac": true, "opa": true}
   },
   "mfa": {
     "policy": "required",
     "methods": ["hardware-token", "authenticator"]
   },
   "fourEyes": {
     "enabled": true,
     "defaultMinApprovers": 2,
     "requireDifferentDepartment": true,
     "requireHigherRole": true
   },
   "riskEngine": {
     "enabled": true,
     "blockHighRisk": true
   }
 }', TRUE, 3),

('STARTUP_AGILE',
 'securityPresets.startupAgile.name',
 'securityPresets.startupAgile.description',
 'FaRocket',
 '{
   "authentication": {
     "primaryProvider": "auth0",
     "socialLogin": true,
     "sessionTimeout": 1440
   },
   "authorization": {
     "primaryEngine": "rbac",
     "engines": {"rbac": true, "abac": false, "opa": false}
   },
   "mfa": {
     "policy": "optional",
     "methods": ["authenticator", "sms"]
   },
   "fourEyes": {
     "enabled": false
   }
 }', TRUE, 4);

-- Seed default configurations
INSERT IGNORE INTO security_configuration_read_model (config_type, config_key, config_value, is_active, created_by) VALUES
('AUTHENTICATION', 'primary_provider', '{"provider": "traditional", "fallback": null}', TRUE, 'system'),
('AUTHENTICATION', 'session_settings', '{"timeout": 480, "maxConcurrent": 5, "renewalThreshold": 60}', TRUE, 'system'),
('AUTHORIZATION', 'engine_config', '{"primary": "rbac", "engines": {"rbac": true, "abac": false, "opa": false, "riskEngine": false}}', TRUE, 'system'),
('MFA', 'policy', '{"enforcement": "optional", "methods": ["authenticator", "sms"], "rememberDevice": true, "rememberDays": 30}', TRUE, 'system'),
('RISK', 'scoring_config', '{"enabled": false, "thresholds": {"low": 30, "medium": 60, "high": 80}, "autoBlock": false}', TRUE, 'system'),
('AUDIT', 'settings', '{"enabled": true, "retentionDays": 365, "detailedLogging": true, "sensitiveFields": ["password", "token", "secret"]}', TRUE, 'system');

-- Seed default 4-eyes configurations
INSERT IGNORE INTO four_eyes_config (entity_type, action_type, is_enabled, min_approvers, amount_threshold, require_different_department) VALUES
('LC_IMPORT', 'APPROVE', TRUE, 1, 100000.00, FALSE),
('LC_IMPORT', 'AMEND', TRUE, 1, 50000.00, FALSE),
('LC_EXPORT', 'APPROVE', TRUE, 1, 100000.00, FALSE),
('STANDBY_LC', 'APPROVE', TRUE, 2, 250000.00, TRUE),
('BANK_GUARANTEE', 'APPROVE', TRUE, 2, 500000.00, TRUE),
('PAYMENT', 'RELEASE', TRUE, 1, 50000.00, FALSE),
('USER', 'CREATE', TRUE, 1, NULL, FALSE),
('USER', 'ROLE_ASSIGN', TRUE, 1, NULL, TRUE),
('PERMISSION', 'MODIFY', TRUE, 2, NULL, TRUE);

-- Seed default risk scoring rules
INSERT IGNORE INTO risk_scoring_rule (rule_name, rule_type, condition_json, risk_score, is_active, priority) VALUES
('Off-hours access', 'TIME_BASED', '{"hours": {"before": 6, "after": 22}, "days": ["SATURDAY", "SUNDAY"]}', 20, TRUE, 1),
('New IP address', 'IP_LOCATION', '{"newIp": true, "lookbackDays": 30}', 15, TRUE, 2),
('Unknown device', 'DEVICE', '{"newDevice": true, "unknownBrowser": true}', 25, TRUE, 3),
('High amount transaction', 'AMOUNT', '{"threshold": 500000, "currency": "USD"}', 30, TRUE, 4),
('Rapid successive logins', 'FREQUENCY', '{"maxLogins": 5, "windowMinutes": 10}', 35, TRUE, 5),
('Location anomaly', 'IP_LOCATION', '{"impossibleTravel": true, "maxKmPerHour": 500}', 40, TRUE, 6),
('Unusual behavior pattern', 'BEHAVIOR', '{"deviationThreshold": 2.5, "baselineDays": 30}', 25, TRUE, 7);
