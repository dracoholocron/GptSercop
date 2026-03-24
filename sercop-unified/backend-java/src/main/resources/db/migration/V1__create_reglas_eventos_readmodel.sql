-- MySQL Script for ReglaEvento Read Model Table
-- Database: globalcmx_read
-- Table: reglas_eventos_readmodel

CREATE TABLE IF NOT EXISTS reglas_eventos_readmodel (
    id BIGINT PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(1000),
    tipo_operacion VARCHAR(100) NOT NULL COMMENT 'LC_IMPORTACION, LC_EXPORTACION, GARANTIA, COBRANZA, etc.',
    evento_trigger VARCHAR(100) NOT NULL COMMENT 'CREATED, UPDATED, DELETED, APPROVED, etc.',
    condiciones_drl TEXT COMMENT 'Contenido del archivo DRL con las reglas Drools',
    acciones_json TEXT COMMENT 'JSON con lista de acciones a ejecutar',
    prioridad INT NOT NULL DEFAULT 100 COMMENT 'Orden de ejecución de la regla',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    aggregate_id VARCHAR(255),
    version BIGINT DEFAULT 0,
    INDEX idx_codigo (codigo),
    INDEX idx_activo (activo),
    INDEX idx_tipo_operacion (tipo_operacion),
    INDEX idx_evento_trigger (evento_trigger),
    INDEX idx_tipo_evento_activo (tipo_operacion, evento_trigger, activo),
    INDEX idx_prioridad (prioridad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
