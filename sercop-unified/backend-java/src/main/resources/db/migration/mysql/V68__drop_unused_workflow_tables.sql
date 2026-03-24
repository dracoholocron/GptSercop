-- =====================================================
-- Migration: V68 - Drop unused workflow and approval tables
-- Description: Remove tables that were created but never used in the application
-- Date: 2025-01-17
-- =====================================================

-- Drop approval_read_model table (if exists)
DROP TABLE IF EXISTS approval_read_model;

-- Drop aprobacion_readmodel table (if exists)
DROP TABLE IF EXISTS aprobacion_readmodel;

-- Drop workflow_operacion_readmodel table (if exists)
DROP TABLE IF EXISTS workflow_operacion_readmodel;

-- Note: The tables workflow_operacion and aprobacion from V20250126_001
-- are in a different schema/migration path (postgres) and not used by the MySQL app
