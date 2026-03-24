-- Tabla para almacenar auditoría de ejecución de reglas por eventos
-- Esta tabla guarda un registro de cada vez que una acción de tipo AUDITORIA
-- se ejecuta como resultado de una regla disparada

CREATE TABLE IF NOT EXISTS auditoria_reglas_eventos (
    id BIGSERIAL PRIMARY KEY,
    audit_id VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    severidad VARCHAR(20) NOT NULL DEFAULT 'INFO',
    mensaje TEXT NOT NULL,

    -- Información de la operación que disparó la regla
    operation_type VARCHAR(100),
    operation_id BIGINT,
    reference_code VARCHAR(255),
    user_code VARCHAR(100),

    -- Metadata adicional en formato JSON
    metadata_json JSONB,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Índices para búsquedas rápidas
    CONSTRAINT chk_severidad CHECK (severidad IN ('INFO', 'WARN', 'ERROR', 'DEBUG', 'CRITICAL'))
);

-- Índices para mejorar performance de consultas
CREATE INDEX idx_auditoria_categoria ON auditoria_reglas_eventos(categoria);
CREATE INDEX idx_auditoria_severidad ON auditoria_reglas_eventos(severidad);
CREATE INDEX idx_auditoria_created_at ON auditoria_reglas_eventos(created_at DESC);
CREATE INDEX idx_auditoria_operation_type ON auditoria_reglas_eventos(operation_type);
CREATE INDEX idx_auditoria_operation_id ON auditoria_reglas_eventos(operation_id);
CREATE INDEX idx_auditoria_user_code ON auditoria_reglas_eventos(user_code);

-- Índice GIN para búsquedas dentro del JSON
CREATE INDEX idx_auditoria_metadata_gin ON auditoria_reglas_eventos USING GIN (metadata_json);

-- Comentarios de documentación
COMMENT ON TABLE auditoria_reglas_eventos IS 'Auditoría de ejecución de acciones de reglas por eventos';
COMMENT ON COLUMN auditoria_reglas_eventos.audit_id IS 'ID único del registro de auditoría generado por el sistema';
COMMENT ON COLUMN auditoria_reglas_eventos.categoria IS 'Categoría de auditoría (ej: LC_IMPORTACION, GARANTIA, etc.)';
COMMENT ON COLUMN auditoria_reglas_eventos.severidad IS 'Nivel de severidad: INFO, WARN, ERROR, DEBUG, CRITICAL';
COMMENT ON COLUMN auditoria_reglas_eventos.mensaje IS 'Mensaje descriptivo del evento auditado';
COMMENT ON COLUMN auditoria_reglas_eventos.metadata_json IS 'Metadata adicional en formato JSON';
