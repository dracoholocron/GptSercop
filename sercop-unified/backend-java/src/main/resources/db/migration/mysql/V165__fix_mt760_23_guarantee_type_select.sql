-- =====================================================
-- V165: Fix MT760 :23: Guarantee Type field to use SELECT
-- =====================================================
-- The :23: field "Guarantee Type" should be a SELECT with predefined options
-- for the different types of guarantees, not a free text INPUT.

-- Update :23: to SELECT for MT760 (all spec versions)
UPDATE swift_field_config_readmodel
SET
    component_type = 'SELECT',
    validation_rules = '{"required": true}',
    field_options = '[
        {"label": "Garantía de Cumplimiento", "value": "PERF", "description": "Performance Guarantee"},
        {"label": "Garantía de Anticipo", "value": "ADVP", "description": "Advance Payment Guarantee"},
        {"label": "Garantía de Pago", "value": "PAYM", "description": "Payment Guarantee"},
        {"label": "Garantía de Licitación", "value": "BIDE", "description": "Bid/Tender Guarantee"},
        {"label": "Garantía de Retención", "value": "RETN", "description": "Retention Money Guarantee"},
        {"label": "Garantía a Primera Demanda", "value": "DGAR", "description": "Demand Guarantee"},
        {"label": "Carta de Crédito Standby", "value": "STBY", "description": "Standby Letter of Credit"},
        {"label": "Garantía Aduanera", "value": "CUST", "description": "Customs Guarantee"},
        {"label": "Garantía de Mantenimiento", "value": "MANT", "description": "Maintenance Guarantee"},
        {"label": "Garantía Financiera", "value": "FINC", "description": "Financial Guarantee"},
        {"label": "Otra", "value": "OTHR", "description": "Other Type of Guarantee"}
    ]',
    updated_at = NOW(),
    updated_by = 'V165_FIX_23_SELECT'
WHERE field_code = ':23:'
  AND message_type = 'MT760'
  AND component_type = 'INPUT';

-- Also update for MT760_LOCAL if it exists
UPDATE swift_field_config_readmodel
SET
    component_type = 'SELECT',
    validation_rules = '{"required": true}',
    field_options = '[
        {"label": "Garantía de Cumplimiento", "value": "PERF", "description": "Performance Guarantee"},
        {"label": "Garantía de Anticipo", "value": "ADVP", "description": "Advance Payment Guarantee"},
        {"label": "Garantía de Pago", "value": "PAYM", "description": "Payment Guarantee"},
        {"label": "Garantía de Licitación", "value": "BIDE", "description": "Bid/Tender Guarantee"},
        {"label": "Garantía de Retención", "value": "RETN", "description": "Retention Money Guarantee"},
        {"label": "Garantía a Primera Demanda", "value": "DGAR", "description": "Demand Guarantee"},
        {"label": "Carta de Crédito Standby", "value": "STBY", "description": "Standby Letter of Credit"},
        {"label": "Garantía Aduanera", "value": "CUST", "description": "Customs Guarantee"},
        {"label": "Garantía de Mantenimiento", "value": "MANT", "description": "Maintenance Guarantee"},
        {"label": "Garantía Financiera", "value": "FINC", "description": "Financial Guarantee"},
        {"label": "Otra", "value": "OTHR", "description": "Other Type of Guarantee"}
    ]',
    updated_at = NOW(),
    updated_by = 'V165_FIX_23_SELECT'
WHERE field_code = ':23:'
  AND message_type = 'MT760_LOCAL'
  AND component_type = 'INPUT';
