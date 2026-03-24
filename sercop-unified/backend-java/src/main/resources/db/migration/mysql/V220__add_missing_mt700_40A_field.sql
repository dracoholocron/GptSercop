-- ================================================
-- V220: Add missing MT700 :40A: field
-- Description: Adds the Form of Documentary Credit field to MT700
-- Author: GlobalCMX Architecture
-- Date: 2026-01-31
-- ================================================

-- :40A: Form of Documentary Credit is a mandatory MT700 field
INSERT IGNORE INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section,
    display_order, is_required, is_active, field_type, component_type,
    placeholder_key, help_text_key, spec_version, effective_date, swift_format,
    swift_status, created_at, updated_at, created_by, updated_by, field_options
) VALUES (
    UUID(), ':40A:', 'swift.mt700.40A.fieldName', 'swift.mt700.40A.description',
    'MT700', 'BASIC', 5, 1, 1, 'SELECT', 'DROPDOWN',
    'swift.mt700.40A.placeholder', 'swift.mt700.40A.helpText',
    '2026', '2026-01-01', '24x', 'M',
    NOW(), NOW(), 'SYSTEM', 'V220_ADD_40A',
    '[{"label": "Irrevocable", "value": "IRREVOCABLE", "isDefault": true, "description": "Crédito documentario irrevocable"}, {"label": "Irrevocable Transferable", "value": "IRREVOCABLE TRANSFERABLE", "description": "Crédito documentario irrevocable y transferible"}, {"label": "Irrevocable Standby", "value": "IRREVOCABLE STANDBY", "description": "Carta de crédito standby irrevocable"}]'
);

-- Reorder other fields to make room for :40A: before :40E:
UPDATE swift_field_config_readmodel
SET display_order = display_order + 1
WHERE message_type = 'MT700'
AND display_order >= 6
AND field_code != ':40A:';
