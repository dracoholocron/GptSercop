-- V20251230_2__drop_unused_readmodel_tables.sql
-- Elimina tablas de read model que ya no se usan porque todos los datos
-- se manejan a través de operation_readmodel y operation_event_log_readmodel

-- Tablas de operaciones migradas a operation_readmodel
DROP TABLE IF EXISTS cobranza_documentaria_readmodel;
DROP TABLE IF EXISTS financiamiento_cx_readmodel;

-- Tablas sin código asociado (obsoletas)
DROP TABLE IF EXISTS workflow_operacion_readmodel;
DROP TABLE IF EXISTS aprobacion_readmodel;
DROP TABLE IF EXISTS documento_cx_readmodel;
