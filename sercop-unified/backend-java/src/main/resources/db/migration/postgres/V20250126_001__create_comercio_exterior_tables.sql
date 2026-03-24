-- =====================================================
-- MIGRACI�N: SISTEMA DE COMERCIO EXTERIOR
-- Versi�n: 1.0
-- Fecha: 2025-01-26
-- =====================================================

-- Tabla: institucion_financiera
CREATE TABLE IF NOT EXISTS institucion_financiera (
    id BIGSERIAL PRIMARY KEY,
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
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_institucion_swift ON institucion_financiera(swift_code);
CREATE INDEX idx_institucion_pais ON institucion_financiera(pais);

-- Tabla: carta_credito
CREATE TABLE IF NOT EXISTS carta_credito (
    id BIGSERIAL PRIMARY KEY,
    numero_operacion VARCHAR(50) UNIQUE NOT NULL,
    tipo_lc VARCHAR(50) NOT NULL,
    modalidad VARCHAR(50) NOT NULL,
    forma_pago VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,

    -- Partes involucradas
    ordenante_id BIGINT NOT NULL,
    beneficiario_id BIGINT NOT NULL,
    banco_emisor_id BIGINT REFERENCES institucion_financiera(id),
    banco_avisador_id BIGINT REFERENCES institucion_financiera(id),
    banco_confirmador_id BIGINT REFERENCES institucion_financiera(id),
    banco_pagador_id BIGINT REFERENCES institucion_financiera(id),

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
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    usuario_modificacion VARCHAR(100),
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER DEFAULT 0
);

CREATE INDEX idx_lc_numero ON carta_credito(numero_operacion);
CREATE INDEX idx_lc_estado ON carta_credito(estado);
CREATE INDEX idx_lc_ordenante ON carta_credito(ordenante_id);
CREATE INDEX idx_lc_beneficiario ON carta_credito(beneficiario_id);

-- Tabla: lc_enmienda
CREATE TABLE IF NOT EXISTS lc_enmienda (
    id BIGSERIAL PRIMARY KEY,
    lc_id BIGINT NOT NULL REFERENCES carta_credito(id),
    numero_enmienda INTEGER NOT NULL,
    tipo_enmienda VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    descripcion TEXT,
    monto_anterior DECIMAL(18,2),
    monto_nuevo DECIMAL(18,2),
    fecha_vencimiento_anterior DATE,
    fecha_vencimiento_nueva DATE,
    swift_mt707 TEXT,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMP,
    aprobada_por VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enmienda_lc ON lc_enmienda(lc_id);

-- Tabla: lc_utilizacion
CREATE TABLE IF NOT EXISTS lc_utilizacion (
    id BIGSERIAL PRIMARY KEY,
    lc_id BIGINT NOT NULL REFERENCES carta_credito(id),
    numero_utilizacion INTEGER NOT NULL,
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
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_utilizacion_lc ON lc_utilizacion(lc_id);

-- Tabla: cobranza_documentaria
CREATE TABLE IF NOT EXISTS cobranza_documentaria (
    id BIGSERIAL PRIMARY KEY,
    numero_operacion VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    modalidad VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,

    -- Partes
    librador_id BIGINT NOT NULL,
    librado_id BIGINT NOT NULL,
    banco_remitente_id BIGINT REFERENCES institucion_financiera(id),
    banco_cobrador_id BIGINT REFERENCES institucion_financiera(id),

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
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cobranza_numero ON cobranza_documentaria(numero_operacion);
CREATE INDEX idx_cobranza_estado ON cobranza_documentaria(estado);

-- Tabla: garantia_bancaria
CREATE TABLE IF NOT EXISTS garantia_bancaria (
    id BIGSERIAL PRIMARY KEY,
    numero_garantia VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    subtipo VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,

    -- Partes
    ordenante_id BIGINT NOT NULL,
    beneficiario_id BIGINT NOT NULL,
    banco_garante_id BIGINT REFERENCES institucion_financiera(id),
    banco_contragarante_id BIGINT REFERENCES institucion_financiera(id),

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

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_garantia_numero ON garantia_bancaria(numero_garantia);
CREATE INDEX idx_garantia_estado ON garantia_bancaria(estado);

-- Tabla: financiamiento_cx
CREATE TABLE IF NOT EXISTS financiamiento_cx (
    id BIGSERIAL PRIMARY KEY,
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
    plazo_dias INTEGER,
    tasa_interes DECIMAL(8,4),
    tasa_mora DECIMAL(8,4),
    comision_apertura DECIMAL(18,2),
    fecha_desembolso DATE,
    fecha_vencimiento DATE,

    -- Garantías
    tipo_garantia VARCHAR(100),
    descripcion_garantia TEXT,

    estado VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financiamiento_numero ON financiamiento_cx(numero_operacion);
CREATE INDEX idx_financiamiento_cliente ON financiamiento_cx(cliente_id);

-- Tabla: documento_cx
CREATE TABLE IF NOT EXISTS documento_cx (
    id BIGSERIAL PRIMARY KEY,
    operacion_tipo VARCHAR(50) NOT NULL,
    operacion_id BIGINT NOT NULL,
    tipo_documento VARCHAR(100) NOT NULL,
    numero_documento VARCHAR(100),
    emisor VARCHAR(200),
    fecha_emision DATE,
    descripcion TEXT,
    archivo_url VARCHAR(500),
    archivo_hash VARCHAR(128),
    verificado BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documento_operacion ON documento_cx(operacion_tipo, operacion_id);

-- Tabla: mensaje_swift
CREATE TABLE IF NOT EXISTS mensaje_swift (
    id BIGSERIAL PRIMARY KEY,
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
    mensaje_relacionado_id BIGINT REFERENCES mensaje_swift(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_swift_operacion ON mensaje_swift(operacion_tipo, operacion_id);
CREATE INDEX idx_swift_tipo ON mensaje_swift(tipo_mensaje);

-- Tabla: workflow_operacion
CREATE TABLE IF NOT EXISTS workflow_operacion (
    id BIGSERIAL PRIMARY KEY,
    operacion_tipo VARCHAR(50) NOT NULL,
    operacion_id BIGINT NOT NULL,
    etapa_actual VARCHAR(100),
    estado_actual VARCHAR(50),
    nivel_aprobacion_actual INTEGER,
    requiere_aprobacion BOOLEAN DEFAULT FALSE,
    aprobaciones_requeridas INTEGER DEFAULT 0,
    aprobaciones_obtenidas INTEGER DEFAULT 0,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    tiempo_total_minutos INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_operacion ON workflow_operacion(operacion_tipo, operacion_id);

-- Tabla: aprobacion
CREATE TABLE IF NOT EXISTS aprobacion (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL REFERENCES workflow_operacion(id),
    nivel INTEGER NOT NULL,
    rol_aprobador VARCHAR(100),
    usuario_aprobador VARCHAR(100),
    accion VARCHAR(50),
    comentarios TEXT,
    fecha_asignacion TIMESTAMP,
    fecha_accion TIMESTAMP,
    sla_minutos INTEGER,
    tiempo_respuesta_minutos INTEGER,
    vencido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aprobacion_workflow ON aprobacion(workflow_id);

-- Tabla: linea_credito
CREATE TABLE IF NOT EXISTS linea_credito (
    id BIGSERIAL PRIMARY KEY,
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
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_linea_cliente ON linea_credito(cliente_id);

-- Comentarios de documentación
COMMENT ON TABLE carta_credito IS 'Registro de Cartas de Cr�dito (LC) de importaci�n y exportaci�n';
COMMENT ON TABLE cobranza_documentaria IS 'Registro de Cobranzas Documentarias';
COMMENT ON TABLE garantia_bancaria IS 'Registro de Garant�as Bancarias';
COMMENT ON TABLE financiamiento_cx IS 'Registro de Financiamientos de Comercio Exterior';
