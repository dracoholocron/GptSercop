-- Crear tabla para borradores de garantías (Garantías/Standby - MT760)
-- Todos los campos son opcionales para permitir guardar información parcial

CREATE TABLE IF NOT EXISTS guarantee_draft_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    aggregate_id VARCHAR(100),

    -- Información básica
    operation_number VARCHAR(50),
    guarantee_type VARCHAR(50),
    message_type VARCHAR(20) DEFAULT 'MT760',
    status VARCHAR(50),

    -- Partes involucradas (todos nullable)
    applicant_id BIGINT,
    beneficiary_id BIGINT,
    guarantor_bank_id BIGINT,
    instructing_party_id BIGINT,

    -- Montos y moneda (nullable)
    currency VARCHAR(3),
    amount DECIMAL(18, 2),

    -- Fechas (todas nullable)
    issue_date DATE,
    expiry_date DATE,
    effective_date DATE,

    -- Lugar de emisión
    place_of_issue VARCHAR(200),

    -- Textos de la garantía
    guarantee_text TEXT,
    underlying_transaction TEXT,
    terms_and_conditions TEXT,
    additional_information TEXT,

    -- Mensajes SWIFT
    swift_mt760 TEXT,

    -- Campos opcionales SWIFT (almacenados como JSON)
    swift_optional_fields TEXT,

    -- Auditoría
    created_by VARCHAR(100),
    creation_date DATETIME,
    modified_by VARCHAR(100),
    modification_date DATETIME,

    -- Control de versión
    version BIGINT DEFAULT 0,

    -- Índices
    INDEX idx_aggregate_id (aggregate_id),
    INDEX idx_operation_number (operation_number),
    INDEX idx_status (status),
    INDEX idx_creation_date (creation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
