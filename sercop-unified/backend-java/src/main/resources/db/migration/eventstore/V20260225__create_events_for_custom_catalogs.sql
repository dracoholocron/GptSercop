-- =====================================================
-- V20260225: Create missing CatalogoPersonalizadoCreatedEvent events
-- for DOKA Bank Risk catalogs (IDs 21000-21601) that exist in the
-- readmodel but have no corresponding events in the event_store.
--
-- These catalogs were inserted directly into custom_catalog_read_model
-- by migration V224 without going through Event Sourcing.
-- This migration backfills the event_store to maintain consistency.
--
-- Target database: globalcmx_eventstore
-- =====================================================

-- =====================================================
-- 1. ACCDES - Account Descriptor (21000-21005)
-- =====================================================

-- Level 1: ACCDES parent catalog
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21000',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21000,"codigo":"ACCDES","nombre":"Descriptor de Cuenta","descripcion":"Clasificacion del tipo de cliente o cuenta para reportes regulatorios (DOKA)","nivel":1,"catalogoPadreId":null,"codigoCatalogoPadre":null,"nombreCatalogoPadre":null,"activo":true,"orden":20}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Level 2: ACCDES children
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21001',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21001,"codigo":"ACCDES-C","nombre":"Corporativo","descripcion":"Cliente corporativo o empresa","nivel":2,"catalogoPadreId":21000,"codigoCatalogoPadre":"ACCDES","nombreCatalogoPadre":"Descriptor de Cuenta","activo":true,"orden":1}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21002',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21002,"codigo":"ACCDES-M","nombre":"Microempresa","descripcion":"Microempresa o pequeño negocio","nivel":2,"catalogoPadreId":21000,"codigoCatalogoPadre":"ACCDES","nombreCatalogoPadre":"Descriptor de Cuenta","activo":true,"orden":2}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21003',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21003,"codigo":"ACCDES-V","nombre":"Vivienda","descripcion":"Credito de vivienda","nivel":2,"catalogoPadreId":21000,"codigoCatalogoPadre":"ACCDES","nombreCatalogoPadre":"Descriptor de Cuenta","activo":true,"orden":3}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21004',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21004,"codigo":"ACCDES-N","nombre":"Persona Natural","descripcion":"Persona natural o consumo","nivel":2,"catalogoPadreId":21000,"codigoCatalogoPadre":"ACCDES","nombreCatalogoPadre":"Descriptor de Cuenta","activo":true,"orden":4}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21005',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21005,"codigo":"ACCDES-P","nombre":"PYME","descripcion":"Pequena y mediana empresa","nivel":2,"catalogoPadreId":21000,"codigoCatalogoPadre":"ACCDES","nombreCatalogoPadre":"Descriptor de Cuenta","activo":true,"orden":5}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- =====================================================
-- 2. FINDES - Financial Destination (21100-21114)
-- =====================================================

-- Level 1: FINDES parent catalog
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21100',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21100,"codigo":"FINDES","nombre":"Destino Financiero","descripcion":"Codigo de finalidad del credito segun normativa SBS Ecuador (DOKA)","nivel":1,"catalogoPadreId":null,"codigoCatalogoPadre":null,"nombreCatalogoPadre":null,"activo":true,"orden":21}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Level 2: FINDES children
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21101',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21101,"codigo":"FINDES-210","nombre":"Comercio Exterior - Importaciones","descripcion":"Financiamiento de importaciones de bienes y servicios","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":1}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21102',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21102,"codigo":"FINDES-220","nombre":"Comercio Exterior - Exportaciones","descripcion":"Financiamiento de exportaciones de bienes y servicios","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":2}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21103',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21103,"codigo":"FINDES-230","nombre":"Capital de Trabajo","descripcion":"Financiamiento para capital de trabajo operativo","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":3}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21104',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21104,"codigo":"FINDES-240","nombre":"Activos Fijos","descripcion":"Adquisicion de maquinaria, equipos y activos fijos","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":4}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21105',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21105,"codigo":"FINDES-250","nombre":"Reestructuracion de Pasivos","descripcion":"Refinanciamiento o reestructuracion de deudas","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":5}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21106',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21106,"codigo":"FINDES-260","nombre":"Contingentes","descripcion":"Garantias bancarias y contingentes","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":6}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21107',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21107,"codigo":"FINDES-270","nombre":"Cartas de Credito Stand-By","descripcion":"Stand-by Letters of Credit","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":7}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21108',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21108,"codigo":"FINDES-290","nombre":"Otros Comercio Exterior","descripcion":"Otras operaciones de comercio exterior","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":8}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21109',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21109,"codigo":"FINDES-300","nombre":"Inversion","descripcion":"Proyectos de inversion","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":9}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21110',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21110,"codigo":"FINDES-310","nombre":"Construccion","descripcion":"Proyectos de construccion","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":10}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21111',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21111,"codigo":"FINDES-340","nombre":"Consumo","descripcion":"Creditos de consumo","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":11}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21112',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21112,"codigo":"FINDES-350","nombre":"Vivienda","descripcion":"Creditos hipotecarios de vivienda","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":12}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21113',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21113,"codigo":"FINDES-360","nombre":"Vehiculos","descripcion":"Financiamiento de vehiculos","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":13}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21114',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21114,"codigo":"FINDES-999","nombre":"Otros","descripcion":"Otros destinos no clasificados","nivel":2,"catalogoPadreId":21100,"codigoCatalogoPadre":"FINDES","nombreCatalogoPadre":"Destino Financiero","activo":true,"orden":99}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- =====================================================
-- 3. SOURES - Source of Resources (21200-21206)
-- =====================================================

-- Level 1: SOURES parent catalog
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21200',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21200,"codigo":"SOURES","nombre":"Origen de Recursos","descripcion":"Fuente de fondos para la operacion (DOKA)","nivel":1,"catalogoPadreId":null,"codigoCatalogoPadre":null,"nombreCatalogoPadre":null,"activo":true,"orden":22}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Level 2: SOURES children
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21201',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21201,"codigo":"SOURES-P","nombre":"Recursos Propios","descripcion":"Financiamiento con recursos propios del banco","nivel":2,"catalogoPadreId":21200,"codigoCatalogoPadre":"SOURES","nombreCatalogoPadre":"Origen de Recursos","activo":true,"orden":1}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21202',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21202,"codigo":"SOURES-I","nombre":"Recursos Internos","descripcion":"Financiamiento con recursos internos/operativos","nivel":2,"catalogoPadreId":21200,"codigoCatalogoPadre":"SOURES","nombreCatalogoPadre":"Origen de Recursos","activo":true,"orden":2}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21203',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21203,"codigo":"SOURES-M","nombre":"Recursos Mixtos","descripcion":"Combinacion de fuentes propias y externas","nivel":2,"catalogoPadreId":21200,"codigoCatalogoPadre":"SOURES","nombreCatalogoPadre":"Origen de Recursos","activo":true,"orden":3}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21204',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21204,"codigo":"SOURES-R","nombre":"Refinanciado","descripcion":"Operacion refinanciada o reestructurada","nivel":2,"catalogoPadreId":21200,"codigoCatalogoPadre":"SOURES","nombreCatalogoPadre":"Origen de Recursos","activo":true,"orden":4}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21205',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21205,"codigo":"SOURES-E","nombre":"Recursos Externos","descripcion":"Financiamiento con recursos externos (lineas)","nivel":2,"catalogoPadreId":21200,"codigoCatalogoPadre":"SOURES","nombreCatalogoPadre":"Origen de Recursos","activo":true,"orden":5}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21206',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21206,"codigo":"SOURES-C","nombre":"CFN/BDE","descripcion":"Recursos de Corporacion Financiera Nacional o Banca de Desarrollo","nivel":2,"catalogoPadreId":21200,"codigoCatalogoPadre":"SOURES","nombreCatalogoPadre":"Origen de Recursos","activo":true,"orden":6}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- =====================================================
-- 4. CRESEC - Credit Sector (21300-21315)
-- =====================================================

-- Level 1: CRESEC parent catalog
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21300',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21300,"codigo":"CRESEC","nombre":"Sector de Credito","descripcion":"Clasificacion del sector crediticio segun SBS Ecuador (DOKA)","nivel":1,"catalogoPadreId":null,"codigoCatalogoPadre":null,"nombreCatalogoPadre":null,"activo":true,"orden":23}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Level 2: CRESEC children
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21301',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21301,"codigo":"CRESEC-100","nombre":"Comercial Corporativo","descripcion":"Credito comercial corporativo","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":1}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21302',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21302,"codigo":"CRESEC-101","nombre":"Comercial Empresarial","descripcion":"Credito comercial empresarial","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":2}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21303',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21303,"codigo":"CRESEC-102","nombre":"Comercial PYMES","descripcion":"Credito comercial PYMES","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":3}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21304',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21304,"codigo":"CRESEC-200","nombre":"Consumo Ordinario","descripcion":"Credito de consumo ordinario","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":4}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21305',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21305,"codigo":"CRESEC-201","nombre":"Consumo Prioritario","descripcion":"Credito de consumo prioritario","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":5}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21306',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21306,"codigo":"CRESEC-300","nombre":"Inmobiliario","descripcion":"Credito inmobiliario","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":6}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21307',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21307,"codigo":"CRESEC-301","nombre":"Vivienda de Interes Publico","descripcion":"Credito para vivienda de interes publico","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":7}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21308',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21308,"codigo":"CRESEC-400","nombre":"Microempresa Minorista","descripcion":"Microempresa - subsegmento minorista","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":8}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21309',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21309,"codigo":"CRESEC-401","nombre":"Microempresa Simple","descripcion":"Microempresa - subsegmento simple","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":9}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21310',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21310,"codigo":"CRESEC-402","nombre":"Microempresa Ampliada","descripcion":"Microempresa - subsegmento ampliada","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":10}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21311',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21311,"codigo":"CRESEC-500","nombre":"Productivo Corporativo","descripcion":"Credito productivo corporativo","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":11}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21312',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21312,"codigo":"CRESEC-501","nombre":"Productivo Empresarial","descripcion":"Credito productivo empresarial","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":12}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21313',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21313,"codigo":"CRESEC-502","nombre":"Productivo PYMES","descripcion":"Credito productivo PYMES","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":13}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21314',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21314,"codigo":"CRESEC-600","nombre":"Educativo","descripcion":"Credito educativo","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":14}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21315',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21315,"codigo":"CRESEC-700","nombre":"Contingentes","descripcion":"Operaciones contingentes","nivel":2,"catalogoPadreId":21300,"codigoCatalogoPadre":"CRESEC","nombreCatalogoPadre":"Sector de Credito","activo":true,"orden":15}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- =====================================================
-- 5. DOMFLG - Domestic Flag (21400-21402)
-- =====================================================

-- Level 1: DOMFLG parent catalog
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21400',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21400,"codigo":"DOMFLG","nombre":"Indicador Domestico","descripcion":"Indica si la operacion es domestica o internacional (DOKA)","nivel":1,"catalogoPadreId":null,"codigoCatalogoPadre":null,"nombreCatalogoPadre":null,"activo":true,"orden":24}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Level 2: DOMFLG children
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21401',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21401,"codigo":"DOMFLG-X","nombre":"Domestico","descripcion":"Operacion domestica/nacional","nivel":2,"catalogoPadreId":21400,"codigoCatalogoPadre":"DOMFLG","nombreCatalogoPadre":"Indicador Domestico","activo":true,"orden":1}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21402',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21402,"codigo":"DOMFLG-I","nombre":"Internacional","descripcion":"Operacion internacional/exterior","nivel":2,"catalogoPadreId":21400,"codigoCatalogoPadre":"DOMFLG","nombreCatalogoPadre":"Indicador Domestico","activo":true,"orden":2}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- =====================================================
-- 6. ECOACT - Economic Activity CIIU (21500-21530)
-- =====================================================

-- Level 1: ECOACT parent catalog
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21500',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21500,"codigo":"ECOACT","nombre":"Actividad Economica CIIU","descripcion":"Clasificacion Industrial Internacional Uniforme para reportes SBS (DOKA)","nivel":1,"catalogoPadreId":null,"codigoCatalogoPadre":null,"nombreCatalogoPadre":null,"activo":true,"orden":25}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Level 2: ECOACT children - Seccion A: Agricultura
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21501',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21501,"codigo":"ECOACT-0111","nombre":"Cultivo de cereales","descripcion":"Cultivo de trigo, maiz, arroz, cebada y otros cereales","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":1}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21502',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21502,"codigo":"ECOACT-0112","nombre":"Cultivo de arroz","descripcion":"Cultivo de arroz con cascarilla","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":2}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21503',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21503,"codigo":"ECOACT-0113","nombre":"Cultivo de legumbres","descripcion":"Cultivo de legumbres y hortalizas","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":3}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21504',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21504,"codigo":"ECOACT-0121","nombre":"Cultivo de frutas tropicales","descripcion":"Banano, platano, pi\u00f1a, papaya y otras frutas tropicales","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":4}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21505',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21505,"codigo":"ECOACT-0130","nombre":"Propagacion de plantas","descripcion":"Viveros y cultivo de plantulas","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":5}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Seccion B: Explotacion de minas
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21506',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21506,"codigo":"ECOACT-0510","nombre":"Extraccion de carbon","descripcion":"Extraccion de carbon de piedra y lignito","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":10}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21507',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21507,"codigo":"ECOACT-0610","nombre":"Extraccion de petroleo","descripcion":"Extraccion de petroleo crudo","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":11}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21508',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21508,"codigo":"ECOACT-0620","nombre":"Extraccion de gas","descripcion":"Extraccion de gas natural","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":12}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21509',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21509,"codigo":"ECOACT-0710","nombre":"Extraccion minerales hierro","descripcion":"Extraccion de minerales de hierro","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":13}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21510',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21510,"codigo":"ECOACT-0729","nombre":"Extraccion otros minerales","descripcion":"Extraccion de otros minerales metaliferos","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":14}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Seccion C: Industrias manufactureras
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21511',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21511,"codigo":"ECOACT-1010","nombre":"Procesamiento carnes","descripcion":"Procesamiento y conservacion de carnes","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":20}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21512',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21512,"codigo":"ECOACT-1020","nombre":"Procesamiento pescado","descripcion":"Procesamiento y conservacion de pescado","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":21}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21513',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21513,"codigo":"ECOACT-1030","nombre":"Procesamiento frutas","descripcion":"Procesamiento y conservacion de frutas y legumbres","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":22}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21514',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21514,"codigo":"ECOACT-1040","nombre":"Aceites y grasas","descripcion":"Elaboracion de aceites y grasas","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":23}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21515',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21515,"codigo":"ECOACT-1050","nombre":"Productos lacteos","descripcion":"Elaboracion de productos lacteos","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":24}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Seccion G: Comercio
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21516',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21516,"codigo":"ECOACT-4510","nombre":"Venta vehiculos","descripcion":"Venta de vehiculos automotores","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":30}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21517',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21517,"codigo":"ECOACT-4610","nombre":"Comercio al por mayor","descripcion":"Intermediacion del comercio al por mayor","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":31}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21518',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21518,"codigo":"ECOACT-4711","nombre":"Comercio al por menor","descripcion":"Venta al por menor en almacenes no especializados","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":32}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Seccion H: Transporte
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21519',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21519,"codigo":"ECOACT-4911","nombre":"Transporte ferroviario","descripcion":"Transporte de pasajeros por ferrocarril","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":40}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21520',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21520,"codigo":"ECOACT-4921","nombre":"Transporte terrestre","descripcion":"Transporte urbano y suburbano de pasajeros","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":41}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21521',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21521,"codigo":"ECOACT-5011","nombre":"Transporte maritimo","descripcion":"Transporte maritimo de pasajeros","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":42}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21522',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21522,"codigo":"ECOACT-5110","nombre":"Transporte aereo","descripcion":"Transporte de pasajeros por via aerea","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":43}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Seccion K: Actividades financieras
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21523',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21523,"codigo":"ECOACT-6411","nombre":"Banca central","descripcion":"Banca central","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":50}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21524',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21524,"codigo":"ECOACT-6419","nombre":"Intermediacion monetaria","descripcion":"Otros tipos de intermediacion monetaria","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":51}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21525',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21525,"codigo":"ECOACT-6511","nombre":"Seguros de vida","descripcion":"Seguros de vida","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":52}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21526',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21526,"codigo":"ECOACT-6512","nombre":"Seguros generales","descripcion":"Seguros generales","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":53}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Seccion F: Construccion
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21527',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21527,"codigo":"ECOACT-4100","nombre":"Construccion edificios","descripcion":"Construccion de edificios","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":60}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21528',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21528,"codigo":"ECOACT-4210","nombre":"Construccion carreteras","descripcion":"Construccion de carreteras y vias ferreas","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":61}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21529',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21529,"codigo":"ECOACT-4220","nombre":"Construccion proyectos","descripcion":"Construccion de proyectos de servicio publico","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":62}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21530',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21530,"codigo":"ECOACT-4290","nombre":"Otras construcciones","descripcion":"Construccion de otras obras de ingenieria civil","nivel":2,"catalogoPadreId":21500,"codigoCatalogoPadre":"ECOACT","nombreCatalogoPadre":"Actividad Economica CIIU","activo":true,"orden":63}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- =====================================================
-- 7. CSTBCH - Branch Code (21600-21601)
-- =====================================================

-- Level 1: CSTBCH parent catalog
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21600',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21600,"codigo":"CSTBCH","nombre":"Codigo de Agencia","descripcion":"Codigo de la agencia o sucursal que origina la operacion (DOKA) - Referencia al catalogo AGENCIAS","nivel":1,"catalogoPadreId":null,"codigoCatalogoPadre":null,"nombreCatalogoPadre":null,"activo":true,"orden":26}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);

-- Level 2: CSTBCH child
INSERT IGNORE INTO event_store (eventId, aggregateId, aggregateType, version, eventType, eventData, timestamp, performedBy, processed, metadata)
VALUES (
    UUID(),
    'CATALOGO_PERSONALIZADO-21601',
    'CATALOGO_PERSONALIZADO',
    1,
    'CATALOGO_PERSONALIZADO_CREATED',
    '{"eventType":"CATALOGO_PERSONALIZADO_CREATED","timestamp":"2026-02-25T00:00:00","performedBy":"SYSTEM","catalogoPersonalizadoId":21601,"codigo":"CSTBCH-REF","nombre":"Referencia a AGENCIAS","descripcion":"Este campo debe usar los valores del catalogo AGENCIAS","nivel":2,"catalogoPadreId":21600,"codigoCatalogoPadre":"CSTBCH","nombreCatalogoPadre":"Codigo de Agencia","activo":true,"orden":1}',
    '2026-02-25 00:00:00.000000',
    'SYSTEM',
    1,
    NULL
);
