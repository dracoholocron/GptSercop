-- =====================================================
-- V113: Risk Engine Tables
-- Rule-based risk scoring system
-- =====================================================

-- Risk Rules Configuration
CREATE TABLE risk_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    category ENUM('LOCATION', 'TIME', 'DEVICE', 'VELOCITY', 'AMOUNT', 'BEHAVIOR') NOT NULL,
    score_points INT NOT NULL DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    config_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Risk Thresholds Configuration
CREATE TABLE risk_threshold (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    min_score INT NOT NULL,
    max_score INT,
    action ENUM('ALLOW', 'MFA_REQUIRED', 'STEP_UP_AUTH', 'BLOCK', 'NOTIFY_ADMIN') NOT NULL,
    notification_enabled BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Risk Profile (tracks user patterns)
CREATE TABLE user_risk_profile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    usual_ip_addresses JSON,
    usual_login_hours JSON,
    usual_device_fingerprints JSON,
    avg_daily_operations INT DEFAULT 0,
    avg_operation_amount DECIMAL(15,2) DEFAULT 0,
    last_known_location VARCHAR(100),
    risk_score_history JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_risk_profile (user_id)
);

-- Risk Events Log (audit of risk evaluations)
CREATE TABLE risk_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(100),
    event_type ENUM('LOGIN', 'OPERATION', 'APPROVAL', 'DATA_ACCESS') NOT NULL,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    user_agent VARCHAR(500),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    operation_type VARCHAR(100),
    operation_amount DECIMAL(15,2),
    total_risk_score INT NOT NULL,
    triggered_rules JSON,
    action_taken ENUM('ALLOWED', 'MFA_REQUESTED', 'BLOCKED', 'ADMIN_NOTIFIED') NOT NULL,
    additional_context JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_risk_event_user (user_id),
    INDEX idx_risk_event_created (created_at),
    INDEX idx_risk_event_score (total_risk_score)
);

-- Insert default risk rules
INSERT INTO risk_rule (code, name, description, category, score_points, config_json) VALUES
-- Location rules
('UNKNOWN_IP', 'IP Desconocida', 'Login desde IP que no está en el historial del usuario', 'LOCATION', 20, '{"lookback_days": 30}'),
('NEW_COUNTRY', 'País Diferente', 'Acceso desde un país diferente al usual', 'LOCATION', 30, '{"allowed_countries": ["MX", "US"]}'),
('IMPOSSIBLE_TRAVEL', 'Viaje Imposible', 'Login desde ubicación geográficamente imposible en el tiempo transcurrido', 'LOCATION', 50, '{"min_hours_between": 2}'),

-- Time rules
('OFF_HOURS', 'Fuera de Horario', 'Operación fuera del horario laboral configurado', 'TIME', 15, '{"work_start": "08:00", "work_end": "19:00", "timezone": "America/Mexico_City"}'),
('WEEKEND_ACCESS', 'Acceso Fin de Semana', 'Acceso en día no laborable', 'TIME', 10, '{"allowed_days": [1,2,3,4,5]}'),

-- Device rules
('NEW_DEVICE', 'Dispositivo Nuevo', 'Acceso desde dispositivo no reconocido', 'DEVICE', 25, '{"remember_days": 90}'),
('SUSPICIOUS_USER_AGENT', 'User Agent Sospechoso', 'User agent indica herramienta automatizada o inusual', 'DEVICE', 35, '{"blocked_patterns": ["curl", "wget", "python", "bot"]}'),

-- Velocity rules
('HIGH_OPERATION_VELOCITY', 'Alta Velocidad de Operaciones', 'Número de operaciones superior al promedio', 'VELOCITY', 25, '{"threshold_multiplier": 3}'),
('RAPID_LOGIN_ATTEMPTS', 'Intentos Rápidos de Login', 'Múltiples intentos de login en corto tiempo', 'VELOCITY', 40, '{"max_attempts": 3, "window_minutes": 5}'),

-- Amount rules
('HIGH_AMOUNT', 'Monto Alto', 'Operación con monto superior al umbral', 'AMOUNT', 20, '{"threshold_usd": 100000}'),
('UNUSUAL_AMOUNT', 'Monto Inusual', 'Monto significativamente mayor al promedio del usuario', 'AMOUNT', 25, '{"threshold_multiplier": 5}'),

-- Behavior rules
('SENSITIVE_DATA_ACCESS', 'Acceso a Datos Sensibles', 'Acceso a información clasificada como sensible', 'BEHAVIOR', 15, '{"sensitive_modules": ["AUDIT", "USER_ADMIN", "SECURITY_CONFIG"]}'),
('BULK_EXPORT', 'Exportación Masiva', 'Intento de exportar grandes cantidades de datos', 'BEHAVIOR', 30, '{"max_records": 1000}');

-- Insert default thresholds
INSERT INTO risk_threshold (name, min_score, max_score, action, notification_enabled) VALUES
('Bajo Riesgo', 0, 30, 'ALLOW', FALSE),
('Riesgo Moderado', 31, 50, 'ALLOW', FALSE),
('Riesgo Elevado', 51, 70, 'MFA_REQUIRED', FALSE),
('Riesgo Alto', 71, 85, 'STEP_UP_AUTH', TRUE),
('Riesgo Crítico', 86, NULL, 'BLOCK', TRUE);

-- Add permission for Risk Engine management
INSERT IGNORE INTO permission_read_model (code, name, description, module)
VALUES ('MANAGE_RISK_ENGINE', 'Gestionar Motor de Riesgo', 'Permite configurar reglas y umbrales del motor de riesgo', 'SECURITY');

-- Grant to admin role
INSERT IGNORE INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'MANAGE_RISK_ENGINE'
FROM role_read_model r
WHERE r.name = 'ADMIN';
