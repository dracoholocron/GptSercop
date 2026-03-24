-- ================================================
-- Migration: Alter documentation_url column size
-- Description: Change documentation_url from VARCHAR(500) to TEXT to support longer documentation
-- Author: GlobalCMX Architecture
-- Date: 2025-12-02
-- ================================================

ALTER TABLE swift_field_config_readmodel
MODIFY COLUMN documentation_url TEXT;
