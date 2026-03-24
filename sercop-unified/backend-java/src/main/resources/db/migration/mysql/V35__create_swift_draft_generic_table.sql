-- =============================================================================
-- V35: Crear tabla genérica de borradores SWIFT
-- =============================================================================
-- Esta tabla almacena borradores de mensajes SWIFT para todos los productos:
-- - LC Import (MT700)
-- - LC Export (MT710, MT720)
-- - Garantías (MT760)
-- - Mensajes libres (MT799)
-- - Standby LC, etc.
--
-- El mensaje SWIFT se almacena como TEXT y es la fuente de verdad.
-- Al editar, el frontend parsea el mensaje para poblar los campos dinámicos.
-- =============================================================================

CREATE TABLE IF NOT EXISTS swift_draft_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Identificador único del borrador (formato: DRAFT-{PRODUCT}-{TIMESTAMP})
    draft_id VARCHAR(100) NOT NULL UNIQUE,

    -- Tipo de mensaje SWIFT (MT700, MT710, MT720, MT760, MT799, etc.)
    message_type VARCHAR(10) NOT NULL,

    -- Tipo de producto (LC_IMPORT, LC_EXPORT, GUARANTEE, STANDBY_LC, FREE_MESSAGE, etc.)
    product_type VARCHAR(50) NOT NULL,

    -- Referencia del documento (campo :20: del mensaje SWIFT)
    reference VARCHAR(100),

    -- Estado del borrador
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    -- ========================================
    -- MENSAJE SWIFT - FUENTE DE VERDAD
    -- ========================================
    -- El mensaje SWIFT completo en formato texto
    -- Incluye todos los campos con sus tags (:20:, :31C:, :32B:, etc.)
    swift_message TEXT NOT NULL,

    -- ========================================
    -- METADATA (campos para búsqueda/filtrado)
    -- ========================================
    -- Estos campos se extraen del mensaje SWIFT para facilitar consultas
    -- pero el mensaje swift_message es la fuente autoritativa

    -- Monto (extraído de :32B:)
    currency VARCHAR(3),
    amount DECIMAL(18,2),

    -- Fechas importantes (extraídas de :31C:, :31D:)
    issue_date DATE,
    expiry_date DATE,

    -- IDs de participantes (si aplica)
    applicant_id BIGINT,
    beneficiary_id BIGINT,
    issuing_bank_id BIGINT,
    advising_bank_id BIGINT,

    -- ========================================
    -- AUDITORÍA
    -- ========================================
    created_by VARCHAR(100),
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(100),
    modification_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Control de versión optimista
    version BIGINT DEFAULT 0,

    -- Índices para búsqueda eficiente
    INDEX idx_draft_message_type (message_type),
    INDEX idx_draft_product_type (product_type),
    INDEX idx_draft_status (status),
    INDEX idx_draft_reference (reference),
    INDEX idx_draft_created_by (created_by),
    INDEX idx_draft_creation_date (creation_date),
    INDEX idx_draft_applicant (applicant_id),
    INDEX idx_draft_beneficiary (beneficiary_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de la tabla
ALTER TABLE swift_draft_readmodel COMMENT = 'Tabla genérica para borradores de mensajes SWIFT de todos los productos';
