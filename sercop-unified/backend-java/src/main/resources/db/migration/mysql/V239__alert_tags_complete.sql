-- =====================================================
-- V239: Alert Tags System - Complete & Idempotent
-- =====================================================
-- This migration adds the complete tags system.
-- All operations are idempotent (safe to run multiple times).

-- -----------------------------------------------------
-- 1. Create alert_tags catalog table if not exists
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_es VARCHAR(100),
    name_en VARCHAR(100),
    color VARCHAR(7) DEFAULT '#6B7280',
    description VARCHAR(200),
    description_es VARCHAR(200),
    description_en VARCHAR(200),
    icon VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_alert_tags_active (active),
    INDEX idx_alert_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2. Add i18n columns if table exists but columns don't
-- -----------------------------------------------------
SET @col_name_es = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alert_tags' AND COLUMN_NAME = 'name_es');
SET @sql = IF(@col_name_es = 0, 'ALTER TABLE alert_tags ADD COLUMN name_es VARCHAR(100) AFTER name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_name_en = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alert_tags' AND COLUMN_NAME = 'name_en');
SET @sql = IF(@col_name_en = 0, 'ALTER TABLE alert_tags ADD COLUMN name_en VARCHAR(100) AFTER name_es', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_desc_es = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alert_tags' AND COLUMN_NAME = 'description_es');
SET @sql = IF(@col_desc_es = 0, 'ALTER TABLE alert_tags ADD COLUMN description_es VARCHAR(200) AFTER description', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_desc_en = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alert_tags' AND COLUMN_NAME = 'description_en');
SET @sql = IF(@col_desc_en = 0, 'ALTER TABLE alert_tags ADD COLUMN description_en VARCHAR(200) AFTER description_es', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------
-- 3. Add tags column to user_alert_readmodel (idempotent)
-- -----------------------------------------------------
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_alert_readmodel' AND COLUMN_NAME = 'tags');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE user_alert_readmodel ADD COLUMN tags JSON DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------
-- 4. Add index for assigned_by (idempotent)
-- -----------------------------------------------------
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_alert_readmodel' AND INDEX_NAME = 'idx_user_alert_assigned_by');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX idx_user_alert_assigned_by ON user_alert_readmodel (assigned_by, scheduled_date)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------
-- 5. Insert/Update default tags with i18n
-- -----------------------------------------------------
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('urgente', 'Urgente', 'Urgent', '#EF4444', 'Requiere atención inmediata', 'Requiere atención inmediata', 'Requires immediate attention', 'FiAlertTriangle', 1, 'system'),
('cliente-vip', 'Cliente VIP', 'VIP Client', '#F59E0B', 'Cliente prioritario', 'Cliente prioritario', 'Priority client', 'FiStar', 2, 'system'),
('revision', 'Revisión', 'Review', '#3B82F6', 'Pendiente de revisión', 'Pendiente de revisión', 'Pending review', 'FiEye', 3, 'system'),
('compliance', 'Cumplimiento', 'Compliance', '#8B5CF6', 'Relacionado con cumplimiento', 'Relacionado con cumplimiento', 'Compliance related', 'FiShield', 4, 'system'),
('documentacion', 'Documentación', 'Documentation', '#10B981', 'Requiere documentación', 'Requiere documentación', 'Requires documentation', 'FiFileText', 5, 'system'),
('seguimiento', 'Seguimiento', 'Follow-up', '#6366F1', 'Seguimiento programado', 'Seguimiento programado', 'Scheduled follow-up', 'FiUserCheck', 6, 'system'),
('llamada', 'Llamada', 'Call', '#EC4899', 'Requiere llamada telefónica', 'Requiere llamada telefónica', 'Requires phone call', 'FiPhone', 7, 'system'),
('reunion', 'Reunión', 'Meeting', '#14B8A6', 'Relacionado con reunión', 'Relacionado con reunión', 'Meeting related', 'FiUsers', 8, 'system'),
('firma', 'Firma', 'Signature', '#F97316', 'Pendiente de firma', 'Pendiente de firma', 'Pending signature', 'FiEdit3', 9, 'system'),
('pago', 'Pago', 'Payment', '#84CC16', 'Relacionado con pagos', 'Relacionado con pagos', 'Payment related', 'FiDollarSign', 10, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);
