-- V20251230__drop_lc_readmodel_tables.sql
-- Elimina las tablas de read model de LC ya que todos los datos
-- se manejan a través de operation_readmodel y operation_event_log_readmodel

-- Eliminar tablas si existen
DROP TABLE IF EXISTS lc_amendment_readmodel;
DROP TABLE IF EXISTS lc_negotiation_readmodel;
DROP TABLE IF EXISTS lc_payment_readmodel;
DROP TABLE IF EXISTS letter_of_credit_readmodel;
