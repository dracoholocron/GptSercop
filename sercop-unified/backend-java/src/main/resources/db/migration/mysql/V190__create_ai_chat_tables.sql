-- =============================================================================
-- Migration V169: Create AI Chat Tables
-- =============================================================================
-- Creates tables for AI Chat CMX functionality:
-- - ai_context: Available AI contexts (Operations, Accounting, SWIFT, etc.)
-- - ai_context_role_mapping: Role-based access control for contexts
-- - ai_conversation: User conversations with AI
-- - ai_message: Individual messages in conversations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: ai_context
-- Stores available AI contexts that define what data the chat can access
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_context (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    context_type VARCHAR(50),
    system_prompt TEXT,
    allowed_data_sources JSON,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    INDEX idx_context_code (code),
    INDEX idx_context_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: ai_context_role_mapping
-- Maps user roles to allowed AI contexts with limits
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_context_role_mapping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    context_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_queries_per_day INT NULL,
    allowed_operations JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_context_role_context FOREIGN KEY (context_id) REFERENCES ai_context(id) ON DELETE CASCADE,
    CONSTRAINT uk_context_role UNIQUE (context_id, role),
    INDEX idx_context_role_role (role),
    INDEX idx_context_role_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: ai_conversation
-- Stores user conversations with AI
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_conversation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    context_id BIGINT NULL,
    title VARCHAR(200) NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    folder_name VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversation_user FOREIGN KEY (user_id) REFERENCES user_read_model(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_context FOREIGN KEY (context_id) REFERENCES ai_context(id) ON DELETE SET NULL,
    INDEX idx_conversation_user (user_id),
    INDEX idx_conversation_updated (updated_at),
    INDEX idx_conversation_favorite (is_favorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: ai_message
-- Stores individual messages in conversations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversation(id) ON DELETE CASCADE,
    INDEX idx_message_conversation (conversation_id),
    INDEX idx_message_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed initial AI contexts
-- -----------------------------------------------------------------------------
INSERT INTO ai_context (code, name, description, context_type, system_prompt, enabled, display_order) VALUES
('OPERATIONS', 'Operaciones', 'Contexto para consultas sobre operaciones de comercio exterior (LCs, Garantías, Cobranzas)', 'OPERATIONS', 
 'Eres un asistente especializado en operaciones de comercio exterior. Puedes ayudar con información sobre cartas de crédito, garantías bancarias y cobranzas documentarias.', 
 TRUE, 1),
('ACCOUNTING', 'Contabilidad', 'Contexto para consultas sobre contabilidad y asientos del libro mayor (GLE)', 'ACCOUNTING',
 'Eres un asistente especializado en contabilidad. Puedes ayudar con información sobre asientos contables, saldos de cuentas y movimientos del libro mayor.',
 TRUE, 2),
('SWIFT', 'SWIFT', 'Contexto para consultas sobre mensajes SWIFT', 'SWIFT',
 'Eres un asistente especializado en mensajes SWIFT. Puedes ayudar con información sobre mensajes MT700, MT707, MT760, etc.',
 TRUE, 3),
('COMMISSIONS', 'Comisiones', 'Contexto para consultas sobre comisiones cobradas a clientes', 'COMMISSIONS',
 'Eres un asistente especializado en análisis de comisiones. Puedes ayudar con información sobre comisiones cobradas, análisis por período, moneda y tipo de producto.',
 TRUE, 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- -----------------------------------------------------------------------------
-- Create permission for AI Chat
-- -----------------------------------------------------------------------------
INSERT INTO permission_read_model (code, name, description, module, created_at)
SELECT 'CAN_USE_AI_CHAT', 'Usar Chat IA', 'Permite usar el chat con IA (Chat CMX)', 'AI', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permission_read_model WHERE code = 'CAN_USE_AI_CHAT');

-- -----------------------------------------------------------------------------
-- Grant permission to ROLE_ADMIN and ROLE_MANAGER
-- -----------------------------------------------------------------------------
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_USE_AI_CHAT'
FROM role_read_model r
WHERE r.name IN ('ROLE_ADMIN', 'ROLE_MANAGER')
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model rp 
    WHERE rp.role_id = r.id AND rp.permission_code = 'CAN_USE_AI_CHAT'
);

-- -----------------------------------------------------------------------------
-- Grant permission to ROLE_USER (optional, can be removed if needed)
-- -----------------------------------------------------------------------------
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, 'CAN_USE_AI_CHAT'
FROM role_read_model r
WHERE r.name = 'ROLE_USER'
AND NOT EXISTS (
    SELECT 1 FROM role_permission_read_model rp 
    WHERE rp.role_id = r.id AND rp.permission_code = 'CAN_USE_AI_CHAT'
);

-- -----------------------------------------------------------------------------
-- Create role mappings for AI contexts (default: all roles can access all contexts)
-- -----------------------------------------------------------------------------
INSERT INTO ai_context_role_mapping (context_id, role, enabled, max_queries_per_day)
SELECT c.id, 'ROLE_ADMIN', TRUE, NULL
FROM ai_context c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_context_role_mapping m 
    WHERE m.context_id = c.id AND m.role = 'ROLE_ADMIN'
);

INSERT INTO ai_context_role_mapping (context_id, role, enabled, max_queries_per_day)
SELECT c.id, 'ROLE_MANAGER', TRUE, NULL
FROM ai_context c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_context_role_mapping m 
    WHERE m.context_id = c.id AND m.role = 'ROLE_MANAGER'
);

INSERT INTO ai_context_role_mapping (context_id, role, enabled, max_queries_per_day)
SELECT c.id, 'ROLE_USER', TRUE, 100
FROM ai_context c
WHERE NOT EXISTS (
    SELECT 1 FROM ai_context_role_mapping m 
    WHERE m.context_id = c.id AND m.role = 'ROLE_USER'
);





