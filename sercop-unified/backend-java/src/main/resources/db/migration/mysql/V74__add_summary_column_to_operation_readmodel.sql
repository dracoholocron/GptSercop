-- =============================================================================
-- V74: Add summary column to operation_readmodel
-- Stores JSON with calculated operation summary including alerts, amounts, dates
-- Updated automatically when operation events occur
-- =============================================================================

ALTER TABLE operation_readmodel
ADD COLUMN summary JSON NULL COMMENT 'JSON con resumen calculado: montos, fechas, alertas, historial de enmiendas';

-- Add index for querying operations with specific alert types
ALTER TABLE operation_readmodel
ADD COLUMN has_alerts BOOLEAN DEFAULT FALSE COMMENT 'Flag para filtrar operaciones con alertas';

ALTER TABLE operation_readmodel
ADD COLUMN alert_count INT DEFAULT 0 COMMENT 'Contador de alertas activas';

-- Index for workbox queries filtering by alerts
CREATE INDEX idx_operation_readmodel_alerts ON operation_readmodel(product_type, has_alerts, alert_count);
