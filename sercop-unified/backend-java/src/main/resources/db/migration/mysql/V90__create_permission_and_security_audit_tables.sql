-- =============================================================================
-- Migration V90: Permission System and Security Audit Tables
-- Creates tables for granular permission control and security event logging
-- =============================================================================

CREATE TABLE IF NOT EXISTS role_read_model (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_read_model (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    name VARCHAR(100),
    password VARCHAR(255),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_expired BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_locked BOOLEAN NOT NULL DEFAULT TRUE,
    credentials_non_expired BOOLEAN NOT NULL DEFAULT TRUE,
    accountNonExpired BOOLEAN NOT NULL DEFAULT TRUE,
    accountNonLocked BOOLEAN NOT NULL DEFAULT TRUE,
    credentialsNonExpired BOOLEAN NOT NULL DEFAULT TRUE,
    identity_provider VARCHAR(20) DEFAULT 'LOCAL',
    external_id VARCHAR(255),
    avatar_url VARCHAR(500),
    last_sso_login TIMESTAMP NULL,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enforced BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_grace_period_until TIMESTAMP NULL,
    last_mfa_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    user_type VARCHAR(20) DEFAULT 'INTERNAL',
    cliente_id VARCHAR(36),
    is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    cargo VARCHAR(100),
    phone_number VARCHAR(30),
    preferred_language VARCHAR(5) DEFAULT 'en',
    approval_status VARCHAR(20) DEFAULT 'APPROVED',
    approval_requested_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    approved_by VARCHAR(100),
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_role_read_model (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role_read_model(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. Permission table for granular access control
CREATE TABLE IF NOT EXISTS permission_read_model (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_permission_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Role-Permission junction table
CREATE TABLE IF NOT EXISTS role_permission_read_model (
    role_id BIGINT NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    PRIMARY KEY (role_id, permission_code),
    FOREIGN KEY (role_id) REFERENCES role_read_model(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_code) REFERENCES permission_read_model(code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    username VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    resource VARCHAR(100),
    action VARCHAR(50),
    permission VARCHAR(100),
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    details TEXT,
    session_id VARCHAR(100),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    identity_provider VARCHAR(20),
    correlation_id VARCHAR(50),
    INDEX idx_audit_username (username),
    INDEX idx_audit_event_type (event_type),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_severity (severity),
    INDEX idx_audit_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Add SSO fields to user_read_model
-- Note: Using simple ALTER without IF NOT EXISTS as Flyway manages migration state
-- These columns are added only once when migration V90 runs

SET @has_identity_provider := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'identity_provider'
);
SET @add_identity_provider_sql := IF(
    @has_identity_provider = 0,
    "ALTER TABLE user_read_model ADD COLUMN identity_provider VARCHAR(20) DEFAULT 'LOCAL'",
    'SELECT 1'
);
PREPARE stmt_add_identity_provider FROM @add_identity_provider_sql;
EXECUTE stmt_add_identity_provider;
DEALLOCATE PREPARE stmt_add_identity_provider;

SET @has_external_id := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'external_id'
);
SET @add_external_id_sql := IF(
    @has_external_id = 0,
    'ALTER TABLE user_read_model ADD COLUMN external_id VARCHAR(255)',
    'SELECT 1'
);
PREPARE stmt_add_external_id FROM @add_external_id_sql;
EXECUTE stmt_add_external_id;
DEALLOCATE PREPARE stmt_add_external_id;

SET @has_avatar_url := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'avatar_url'
);
SET @add_avatar_url_sql := IF(
    @has_avatar_url = 0,
    'ALTER TABLE user_read_model ADD COLUMN avatar_url VARCHAR(500)',
    'SELECT 1'
);
PREPARE stmt_add_avatar_url FROM @add_avatar_url_sql;
EXECUTE stmt_add_avatar_url;
DEALLOCATE PREPARE stmt_add_avatar_url;

SET @has_last_sso_login := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND column_name = 'last_sso_login'
);
SET @add_last_sso_login_sql := IF(
    @has_last_sso_login = 0,
    'ALTER TABLE user_read_model ADD COLUMN last_sso_login TIMESTAMP NULL',
    'SELECT 1'
);
PREPARE stmt_add_last_sso_login FROM @add_last_sso_login_sql;
EXECUTE stmt_add_last_sso_login;
DEALLOCATE PREPARE stmt_add_last_sso_login;

-- Add index for external_id lookups
SET @has_idx_users_external_id := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_read_model'
      AND index_name = 'idx_users_external_id'
);
SET @add_idx_users_external_id_sql := IF(
    @has_idx_users_external_id = 0,
    'CREATE INDEX idx_users_external_id ON user_read_model(identity_provider, external_id)',
    'SELECT 1'
);
PREPARE stmt_add_idx_users_external_id FROM @add_idx_users_external_id_sql;
EXECUTE stmt_add_idx_users_external_id;
DEALLOCATE PREPARE stmt_add_idx_users_external_id;

-- 5. Add new roles if not exist
INSERT IGNORE INTO role_read_model (name, description) VALUES
    ('ROLE_OPERATOR', 'Operador con permisos de creación y edición'),
    ('ROLE_MANAGER', 'Gerente con permisos de aprobación');

-- 6. Insert default permissions
INSERT INTO permission_read_model (code, name, description, module) VALUES
    -- LC_IMPORT Module
    ('CAN_VIEW_LC_IMPORT', 'Ver LC Import', 'Permite ver cartas de crédito de importación', 'LC_IMPORT'),
    ('CAN_CREATE_LC_IMPORT', 'Crear LC Import', 'Permite crear nuevas cartas de crédito de importación', 'LC_IMPORT'),
    ('CAN_EDIT_LC_IMPORT', 'Editar LC Import', 'Permite editar cartas de crédito de importación', 'LC_IMPORT'),
    ('CAN_APPROVE_LC_IMPORT', 'Aprobar LC Import', 'Permite aprobar borradores de LC de importación', 'LC_IMPORT'),
    ('CAN_DELETE_LC_IMPORT', 'Eliminar LC Import', 'Permite eliminar cartas de crédito de importación', 'LC_IMPORT'),

    -- LC_EXPORT Module
    ('CAN_VIEW_LC_EXPORT', 'Ver LC Export', 'Permite ver cartas de crédito de exportación', 'LC_EXPORT'),
    ('CAN_CREATE_LC_EXPORT', 'Crear LC Export', 'Permite crear nuevas cartas de crédito de exportación', 'LC_EXPORT'),
    ('CAN_EDIT_LC_EXPORT', 'Editar LC Export', 'Permite editar cartas de crédito de exportación', 'LC_EXPORT'),
    ('CAN_APPROVE_LC_EXPORT', 'Aprobar LC Export', 'Permite aprobar borradores de LC de exportación', 'LC_EXPORT'),
    ('CAN_DELETE_LC_EXPORT', 'Eliminar LC Export', 'Permite eliminar cartas de crédito de exportación', 'LC_EXPORT'),

    -- GUARANTEE Module
    ('CAN_VIEW_GUARANTEE', 'Ver Garantías', 'Permite ver garantías bancarias', 'GUARANTEE'),
    ('CAN_CREATE_GUARANTEE', 'Crear Garantía', 'Permite crear nuevas garantías bancarias', 'GUARANTEE'),
    ('CAN_EDIT_GUARANTEE', 'Editar Garantía', 'Permite editar garantías bancarias', 'GUARANTEE'),
    ('CAN_APPROVE_GUARANTEE', 'Aprobar Garantía', 'Permite aprobar garantías bancarias', 'GUARANTEE'),
    ('CAN_DELETE_GUARANTEE', 'Eliminar Garantía', 'Permite eliminar garantías bancarias', 'GUARANTEE'),

    -- COLLECTION Module
    ('CAN_VIEW_COLLECTION', 'Ver Cobranzas', 'Permite ver cobranzas documentarias', 'COLLECTION'),
    ('CAN_CREATE_COLLECTION', 'Crear Cobranza', 'Permite crear nuevas cobranzas documentarias', 'COLLECTION'),
    ('CAN_EDIT_COLLECTION', 'Editar Cobranza', 'Permite editar cobranzas documentarias', 'COLLECTION'),
    ('CAN_APPROVE_COLLECTION', 'Aprobar Cobranza', 'Permite aprobar cobranzas documentarias', 'COLLECTION'),

    -- SWIFT Module
    ('CAN_VIEW_SWIFT', 'Ver Mensajes SWIFT', 'Permite ver mensajes SWIFT', 'SWIFT'),
    ('CAN_SEND_SWIFT', 'Enviar SWIFT', 'Permite enviar mensajes SWIFT', 'SWIFT'),
    ('CAN_CONFIG_SWIFT', 'Configurar SWIFT', 'Permite configurar campos SWIFT', 'SWIFT'),

    -- REPORTS Module
    ('CAN_VIEW_REPORTS', 'Ver Reportes', 'Permite ver reportes y dashboards', 'REPORTS'),
    ('CAN_EXPORT_REPORTS', 'Exportar Reportes', 'Permite exportar reportes', 'REPORTS'),

    -- SYSTEM Module
    ('CAN_MANAGE_USERS', 'Gestionar Usuarios', 'Permite gestionar usuarios del sistema', 'SYSTEM'),
    ('CAN_MANAGE_ROLES', 'Gestionar Roles', 'Permite gestionar roles y permisos', 'SYSTEM'),
    ('CAN_VIEW_AUDIT', 'Ver Auditoría', 'Permite ver logs de auditoría de seguridad', 'SYSTEM'),
    ('CAN_EXPORT_AUDIT', 'Exportar Auditoría', 'Permite exportar logs de auditoría', 'SYSTEM'),
    ('CAN_FORCE_UNLOCK', 'Desbloquear Operaciones', 'Permite forzar desbloqueo de operaciones', 'SYSTEM'),
    ('CAN_CONFIG_SYSTEM', 'Configurar Sistema', 'Permite configurar parámetros del sistema', 'SYSTEM'),
    ('CAN_MANAGE_CATALOGS', 'Gestionar Catálogos', 'Permite gestionar catálogos del sistema', 'SYSTEM')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 7. Assign ALL permissions to ROLE_ADMIN
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- 8. Assign VIEW permissions to ROLE_USER
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_USER'
  AND p.code LIKE 'CAN_VIEW_%'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- 9. Assign VIEW + CREATE + EDIT permissions to ROLE_OPERATOR
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_OPERATOR'
  AND (p.code LIKE 'CAN_VIEW_%' OR p.code LIKE 'CAN_CREATE_%' OR p.code LIKE 'CAN_EDIT_%')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- 10. Assign VIEW + CREATE + EDIT + APPROVE permissions to ROLE_MANAGER
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_MANAGER'
  AND (p.code LIKE 'CAN_VIEW_%' OR p.code LIKE 'CAN_CREATE_%' OR p.code LIKE 'CAN_EDIT_%' OR p.code LIKE 'CAN_APPROVE_%')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
