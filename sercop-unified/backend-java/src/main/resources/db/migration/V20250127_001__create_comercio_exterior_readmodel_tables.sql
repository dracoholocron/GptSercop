-- =====================================================
-- MIGRACIÓN: READ MODEL - COMERCIO EXTERIOR (MySQL)
-- Versión: 1.0
-- Fecha: 2025-01-27
-- =====================================================

-- Tabla: institucion_financiera_readmodel
CREATE TABLE IF NOT EXISTS institucion_financiera_readmodel (
    id BIGINT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    swift_code VARCHAR(11),
    pais VARCHAR(3),
    ciudad VARCHAR(100),
    direccion TEXT,
    tipo VARCHAR(50) NOT NULL,
    rating VARCHAR(10),
    es_corresponsal BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,
    INDEX idx_institucion_rm_codigo (codigo),
    INDEX idx_institucion_rm_swift (swift_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: carta_credito_readmodel
CREATE TABLE IF NOT EXISTS carta_credito_readmodel (
    id BIGINT PRIMARY KEY,
    numero_operacion VARCHAR(50) UNIQUE NOT NULL,
    tipo_lc VARCHAR(50) NOT NULL,
    modalidad VARCHAR(50) NOT NULL,
    forma_pago VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,

    -- Partes involucradas
    ordenante_id BIGINT NOT NULL,
    beneficiario_id BIGINT NOT NULL,
    banco_emisor_id BIGINT,
    banco_avisador_id BIGINT,
    banco_confirmador_id BIGINT,
    banco_pagador_id BIGINT,

    -- Montos y fechas
    moneda VARCHAR(3) NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    monto_utilizado DECIMAL(18,2) DEFAULT 0,
    porcentaje_tolerancia DECIMAL(5,2),
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_ultimo_embarque DATE,
    lugar_embarque VARCHAR(200),
    lugar_destino VARCHAR(200),

    -- Documentos requeridos
    requiere_factura_comercial BOOLEAN DEFAULT TRUE,
    requiere_packing_list BOOLEAN DEFAULT TRUE,
    requiere_conocimiento_embarque BOOLEAN DEFAULT TRUE,
    requiere_certificado_origen BOOLEAN DEFAULT FALSE,
    requiere_certificado_seguro BOOLEAN DEFAULT FALSE,
    documentos_adicionales TEXT,

    -- Condiciones especiales
    incoterm VARCHAR(10),
    descripcion_mercancia TEXT,
    condiciones_especiales TEXT,
    instrucciones_embarque TEXT,

    -- SWIFT Messages
    swift_mt700_emision TEXT,
    swift_mt710_aviso TEXT,
    swift_mt720_transferencia TEXT,

    -- Auditoría
    usuario_creacion VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_modificacion VARCHAR(100),
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_lc_rm_numero (numero_operacion),
    INDEX idx_lc_rm_estado (estado),
    INDEX idx_lc_rm_ordenante (ordenante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: lc_enmienda_readmodel
CREATE TABLE IF NOT EXISTS lc_enmienda_readmodel (
    id BIGINT PRIMARY KEY,
    lc_id BIGINT NOT NULL,
    numero_enmienda INT NOT NULL,
    tipo_enmienda VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    descripcion TEXT,
    monto_anterior DECIMAL(18,2),
    monto_nuevo DECIMAL(18,2),
    fecha_vencimiento_anterior DATE,
    fecha_vencimiento_nueva DATE,
    swift_mt707 TEXT,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    aprobada_por VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_enmienda_rm_lc (lc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: lc_utilizacion_readmodel
CREATE TABLE IF NOT EXISTS lc_utilizacion_readmodel (
    id BIGINT PRIMARY KEY,
    lc_id BIGINT NOT NULL,
    numero_utilizacion INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    fecha_presentacion DATE NOT NULL,
    fecha_negociacion DATE,
    tasa_descuento DECIMAL(8,4),
    descuento DECIMAL(18,2),
    monto_neto DECIMAL(18,2),
    estado VARCHAR(50) NOT NULL,
    swift_mt750 TEXT,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_utilizacion_rm_lc (lc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: cobranza_documentaria_readmodel
CREATE TABLE IF NOT EXISTS cobranza_documentaria_readmodel (
    id BIGINT PRIMARY KEY,
    numero_operacion VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    modalidad VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,

    -- Partes
    librador_id BIGINT NOT NULL,
    librado_id BIGINT NOT NULL,
    banco_remitente_id BIGINT,
    banco_cobrador_id BIGINT,

    -- Montos
    moneda VARCHAR(3) NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    fecha_recepcion DATE,
    fecha_vencimiento DATE,
    fecha_pago DATE,
    fecha_aceptacion DATE,

    -- Documentos
    conocimiento_embarque BOOLEAN DEFAULT FALSE,
    factura_comercial BOOLEAN DEFAULT TRUE,
    certificado_origen BOOLEAN DEFAULT FALSE,
    documentos_anexos TEXT,

    -- SWIFT
    swift_mt400 TEXT,
    swift_mt410 TEXT,
    swift_mt412 TEXT,

    -- Instrucciones
    instrucciones_protesto TEXT,
    instrucciones_impago TEXT,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_cobranza_rm_numero (numero_operacion),
    INDEX idx_cobranza_rm_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: garantia_bancaria_readmodel
CREATE TABLE IF NOT EXISTS garantia_bancaria_readmodel (
    id BIGINT PRIMARY KEY,
    numero_garantia VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    subtipo VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,

    -- Partes
    ordenante_id BIGINT NOT NULL,
    beneficiario_id BIGINT NOT NULL,
    banco_garante_id BIGINT,
    banco_contragarante_id BIGINT,

    -- Montos
    moneda VARCHAR(3) NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    porcentaje_proyecto DECIMAL(5,2),
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_ejecucion DATE,
    fecha_liberacion DATE,

    -- Detalles del proyecto/contrato
    numero_contrato VARCHAR(100),
    objeto_contrato TEXT,
    monto_contrato DECIMAL(18,2),
    descripcion TEXT,

    -- Condiciones
    es_reducible BOOLEAN DEFAULT FALSE,
    formula_reduccion TEXT,
    condiciones_ejecucion TEXT,
    condiciones_liberacion TEXT,

    -- SWIFT
    swift_mt760 TEXT,
    swift_mt767 TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_garantia_rm_numero (numero_garantia),
    INDEX idx_garantia_rm_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: financiamiento_cx_readmodel
CREATE TABLE IF NOT EXISTS financiamiento_cx_readmodel (
    id BIGINT PRIMARY KEY,
    numero_operacion VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    operacion_vinculada_tipo VARCHAR(50),
    operacion_vinculada_id BIGINT,

    -- Cliente
    cliente_id BIGINT NOT NULL,
    linea_credito_id BIGINT,

    -- Montos y plazos
    moneda VARCHAR(3) NOT NULL,
    monto_solicitado DECIMAL(18,2) NOT NULL,
    monto_aprobado DECIMAL(18,2),
    monto_desembolsado DECIMAL(18,2),
    plazo_dias INT,
    tasa_interes DECIMAL(8,4),
    tasa_mora DECIMAL(8,4),
    comision_apertura DECIMAL(18,2),
    fecha_desembolso DATE,
    fecha_vencimiento DATE,

    -- Garantías
    tipo_garantia VARCHAR(100),
    descripcion_garantia TEXT,

    estado VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_financiamiento_rm_numero (numero_operacion),
    INDEX idx_financiamiento_rm_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: documento_cx_readmodel
CREATE TABLE IF NOT EXISTS documento_cx_readmodel (
    id BIGINT PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    operation_id BIGINT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_number VARCHAR(100),
    issuer VARCHAR(200),
    issue_date DATE,
    description TEXT,
    file_url VARCHAR(500),
    file_hash VARCHAR(128),
    verified BOOLEAN DEFAULT FALSE,
    observations TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_documento_rm_operacion (operation_type, operation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: mensaje_swift_readmodel
CREATE TABLE IF NOT EXISTS mensaje_swift_readmodel (
    id BIGINT PRIMARY KEY,
    operacion_tipo VARCHAR(50),
    operacion_id BIGINT,
    tipo_mensaje VARCHAR(10) NOT NULL,
    direccion VARCHAR(20) NOT NULL,
    bic_sender VARCHAR(11),
    bic_receiver VARCHAR(11),
    referencia VARCHAR(50),
    contenido_swift TEXT NOT NULL,
    fecha_envio TIMESTAMP,
    fecha_recepcion TIMESTAMP,
    estado VARCHAR(20) NOT NULL,
    mensaje_relacionado_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_swift_rm_operacion (operacion_tipo, operacion_id),
    INDEX idx_swift_rm_tipo (tipo_mensaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: workflow_operacion_readmodel
CREATE TABLE IF NOT EXISTS workflow_operacion_readmodel (
    id BIGINT PRIMARY KEY,
    operacion_tipo VARCHAR(50) NOT NULL,
    operacion_id BIGINT NOT NULL,
    etapa_actual VARCHAR(100),
    estado_actual VARCHAR(50),
    nivel_aprobacion_actual INT,
    requiere_aprobacion BOOLEAN DEFAULT FALSE,
    aprobaciones_requeridas INT DEFAULT 0,
    aprobaciones_obtenidas INT DEFAULT 0,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    tiempo_total_minutos INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_workflow_rm_operacion (operacion_tipo, operacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: aprobacion_readmodel
CREATE TABLE IF NOT EXISTS aprobacion_readmodel (
    id BIGINT PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    nivel INT NOT NULL,
    rol_aprobador VARCHAR(100),
    usuario_aprobador VARCHAR(100),
    accion VARCHAR(50),
    comentarios TEXT,
    fecha_asignacion TIMESTAMP,
    fecha_accion TIMESTAMP,
    sla_minutos INT,
    tiempo_respuesta_minutos INT,
    vencido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_aprobacion_rm_workflow (workflow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: linea_credito_readmodel
CREATE TABLE IF NOT EXISTS linea_credito_readmodel (
    id BIGINT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    moneda VARCHAR(3) NOT NULL,
    monto_autorizado DECIMAL(18,2) NOT NULL,
    monto_utilizado DECIMAL(18,2) DEFAULT 0,
    monto_disponible DECIMAL(18,2) NOT NULL,
    fecha_autorizacion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    tasa_referencia VARCHAR(50),
    spread DECIMAL(6,4),
    estado VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,

    INDEX idx_linea_rm_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
