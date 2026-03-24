-- =============================================================================
-- Migration V135: Rename template_variable to template_variable_read_model
-- =============================================================================
-- Standardize table naming convention to match other read model tables

-- Rename the table
RENAME TABLE template_variable TO template_variable_read_model;

-- Update indexes (MySQL renames them automatically with the table)
