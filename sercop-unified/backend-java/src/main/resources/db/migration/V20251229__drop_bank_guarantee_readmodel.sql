-- V20251229__drop_bank_guarantee_readmodel.sql
-- Elimina la tabla bank_guarantee_readmodel ya que todos los datos de garantías
-- se manejan a través de operation_readmodel y operation_event_log_readmodel

-- Eliminar la tabla si existe
DROP TABLE IF EXISTS bank_guarantee_readmodel;

-- Eliminar índices huérfanos si existen
-- (Los índices se eliminan automáticamente con la tabla, pero por si acaso)
