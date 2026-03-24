-- ================================================
-- V217: Add Section Configs for Doka SWIFT Messages
-- Description: Creates section configurations for the new Doka message types
-- Author: GlobalCMX Architecture
-- Date: 2026-01-31
-- ================================================

-- Standard sections used across all messages
-- BASICA (1), FECHAS (2), MONTOS (3), PARTES (4), BANCOS (5), DETALLES (6)

-- Helper to insert sections for a message type
-- Using INSERT IGNORE to avoid duplicates

-- MT419 - Undertaking Amendment Request
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt419.basic.label', 'sections.mt419.basic.description', 'MT419', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt419.dates.label', 'sections.mt419.dates.description', 'MT419', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt419.amounts.label', 'sections.mt419.amounts.description', 'MT419', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt419.details.label', 'sections.mt419.details.description', 'MT419', 4, 'FiList', true, NOW());

-- MT429 - Request for Undertaking
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt429.basic.label', 'sections.mt429.basic.description', 'MT429', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt429.dates.label', 'sections.mt429.dates.description', 'MT429', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt429.amounts.label', 'sections.mt429.amounts.description', 'MT429', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'PARTES', 'sections.mt429.parties.label', 'sections.mt429.parties.description', 'MT429', 4, 'FiUsers', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt429.banks.label', 'sections.mt429.banks.description', 'MT429', 5, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt429.details.label', 'sections.mt429.details.description', 'MT429', 6, 'FiList', true, NOW());

-- MT460 - Advice to Pay/Accept/Negotiate
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt460.basic.label', 'sections.mt460.basic.description', 'MT460', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt460.dates.label', 'sections.mt460.dates.description', 'MT460', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt460.amounts.label', 'sections.mt460.amounts.description', 'MT460', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt460.banks.label', 'sections.mt460.banks.description', 'MT460', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt460.details.label', 'sections.mt460.details.description', 'MT460', 5, 'FiList', true, NOW());

-- MT470 - Request to Amend Documentary Credit
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt470.basic.label', 'sections.mt470.basic.description', 'MT470', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt470.dates.label', 'sections.mt470.dates.description', 'MT470', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt470.amounts.label', 'sections.mt470.amounts.description', 'MT470', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt470.banks.label', 'sections.mt470.banks.description', 'MT470', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt470.details.label', 'sections.mt470.details.description', 'MT470', 5, 'FiList', true, NOW());

-- MT488 - Request for Multiple Undertakings
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt488.basic.label', 'sections.mt488.basic.description', 'MT488', 1, 'FiFileText', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt488.details.label', 'sections.mt488.details.description', 'MT488', 2, 'FiList', true, NOW());

-- MT492 - Request for Cancellation
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt492.basic.label', 'sections.mt492.basic.description', 'MT492', 1, 'FiFileText', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt492.details.label', 'sections.mt492.details.description', 'MT492', 2, 'FiList', true, NOW());

-- MT712 - Claim Against a Documentary Credit
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt712.basic.label', 'sections.mt712.basic.description', 'MT712', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt712.dates.label', 'sections.mt712.dates.description', 'MT712', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt712.amounts.label', 'sections.mt712.amounts.description', 'MT712', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt712.banks.label', 'sections.mt712.banks.description', 'MT712', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt712.details.label', 'sections.mt712.details.description', 'MT712', 5, 'FiList', true, NOW());

-- MT719 - Advice of a Third Bank's Guarantee
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt719.basic.label', 'sections.mt719.basic.description', 'MT719', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt719.dates.label', 'sections.mt719.dates.description', 'MT719', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt719.amounts.label', 'sections.mt719.amounts.description', 'MT719', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'PARTES', 'sections.mt719.parties.label', 'sections.mt719.parties.description', 'MT719', 4, 'FiUsers', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt719.banks.label', 'sections.mt719.banks.description', 'MT719', 5, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt719.details.label', 'sections.mt719.details.description', 'MT719', 6, 'FiList', true, NOW());

-- MT722 - Transfer of Documentary Credit
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt722.basic.label', 'sections.mt722.basic.description', 'MT722', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt722.dates.label', 'sections.mt722.dates.description', 'MT722', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt722.amounts.label', 'sections.mt722.amounts.description', 'MT722', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'PARTES', 'sections.mt722.parties.label', 'sections.mt722.parties.description', 'MT722', 4, 'FiUsers', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt722.banks.label', 'sections.mt722.banks.description', 'MT722', 5, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt722.details.label', 'sections.mt722.details.description', 'MT722', 6, 'FiList', true, NOW());

-- MT726 - Advice of Refusal
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt726.basic.label', 'sections.mt726.basic.description', 'MT726', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt726.dates.label', 'sections.mt726.dates.description', 'MT726', 2, 'FiCalendar', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt726.details.label', 'sections.mt726.details.description', 'MT726', 3, 'FiList', true, NOW());

-- MT728 - Guarantee Attachment
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt728.basic.label', 'sections.mt728.basic.description', 'MT728', 1, 'FiFileText', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt728.details.label', 'sections.mt728.details.description', 'MT728', 2, 'FiList', true, NOW());

-- MT732 - Advice of Discharge
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt732.basic.label', 'sections.mt732.basic.description', 'MT732', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt732.dates.label', 'sections.mt732.dates.description', 'MT732', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt732.amounts.label', 'sections.mt732.amounts.description', 'MT732', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt732.details.label', 'sections.mt732.details.description', 'MT732', 4, 'FiList', true, NOW());

-- MT735 - Advice of Reimbursement or Payment
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt735.basic.label', 'sections.mt735.basic.description', 'MT735', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt735.dates.label', 'sections.mt735.dates.description', 'MT735', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt735.amounts.label', 'sections.mt735.amounts.description', 'MT735', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt735.banks.label', 'sections.mt735.banks.description', 'MT735', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt735.details.label', 'sections.mt735.details.description', 'MT735', 5, 'FiList', true, NOW());

-- MT738 - Authorisation to Defer Payment
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt738.basic.label', 'sections.mt738.basic.description', 'MT738', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt738.dates.label', 'sections.mt738.dates.description', 'MT738', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt738.amounts.label', 'sections.mt738.amounts.description', 'MT738', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt738.details.label', 'sections.mt738.details.description', 'MT738', 4, 'FiList', true, NOW());

-- MT742 - Reimbursement Claim
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt742.basic.label', 'sections.mt742.basic.description', 'MT742', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt742.dates.label', 'sections.mt742.dates.description', 'MT742', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt742.amounts.label', 'sections.mt742.amounts.description', 'MT742', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt742.banks.label', 'sections.mt742.banks.description', 'MT742', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt742.details.label', 'sections.mt742.details.description', 'MT742', 5, 'FiList', true, NOW());

-- MT744 - Reimbursement Authorization Free Format
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt744.basic.label', 'sections.mt744.basic.description', 'MT744', 1, 'FiFileText', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt744.details.label', 'sections.mt744.details.description', 'MT744', 2, 'FiList', true, NOW());

-- MT749 - Guarantee/Standby Amendment Response
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt749.basic.label', 'sections.mt749.basic.description', 'MT749', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt749.dates.label', 'sections.mt749.dates.description', 'MT749', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt749.amounts.label', 'sections.mt749.amounts.description', 'MT749', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt749.details.label', 'sections.mt749.details.description', 'MT749', 4, 'FiList', true, NOW());

-- MT763 - Guarantee/Standby LC Demand
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt763.basic.label', 'sections.mt763.basic.description', 'MT763', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt763.dates.label', 'sections.mt763.dates.description', 'MT763', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt763.amounts.label', 'sections.mt763.amounts.description', 'MT763', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'PARTES', 'sections.mt763.parties.label', 'sections.mt763.parties.description', 'MT763', 4, 'FiUsers', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt763.banks.label', 'sections.mt763.banks.description', 'MT763', 5, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt763.details.label', 'sections.mt763.details.description', 'MT763', 6, 'FiList', true, NOW());

-- MT769 - Advice of Reduction or Release
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt769.basic.label', 'sections.mt769.basic.description', 'MT769', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt769.dates.label', 'sections.mt769.dates.description', 'MT769', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt769.amounts.label', 'sections.mt769.amounts.description', 'MT769', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt769.banks.label', 'sections.mt769.banks.description', 'MT769', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt769.details.label', 'sections.mt769.details.description', 'MT769', 5, 'FiList', true, NOW());

-- MT772 - Amendment to Documentary Credit (Extended)
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt772.basic.label', 'sections.mt772.basic.description', 'MT772', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt772.dates.label', 'sections.mt772.dates.description', 'MT772', 2, 'FiCalendar', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt772.details.label', 'sections.mt772.details.description', 'MT772', 3, 'FiList', true, NOW());

-- MT778 - Advice of Deferred Payment
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt778.basic.label', 'sections.mt778.basic.description', 'MT778', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt778.dates.label', 'sections.mt778.dates.description', 'MT778', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt778.amounts.label', 'sections.mt778.amounts.description', 'MT778', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt778.banks.label', 'sections.mt778.banks.description', 'MT778', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt778.details.label', 'sections.mt778.details.description', 'MT778', 5, 'FiList', true, NOW());

-- MT783 - Claim for Reimbursement
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt783.basic.label', 'sections.mt783.basic.description', 'MT783', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt783.dates.label', 'sections.mt783.dates.description', 'MT783', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt783.amounts.label', 'sections.mt783.amounts.description', 'MT783', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt783.banks.label', 'sections.mt783.banks.description', 'MT783', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt783.details.label', 'sections.mt783.details.description', 'MT783', 5, 'FiList', true, NOW());

-- MT784 - Extended Guarantee
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt784.basic.label', 'sections.mt784.basic.description', 'MT784', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt784.dates.label', 'sections.mt784.dates.description', 'MT784', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt784.amounts.label', 'sections.mt784.amounts.description', 'MT784', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'PARTES', 'sections.mt784.parties.label', 'sections.mt784.parties.description', 'MT784', 4, 'FiUsers', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt784.banks.label', 'sections.mt784.banks.description', 'MT784', 5, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt784.details.label', 'sections.mt784.details.description', 'MT784', 6, 'FiList', true, NOW());

-- MT788 - Advice of Extension or Renewal
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt788.basic.label', 'sections.mt788.basic.description', 'MT788', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt788.dates.label', 'sections.mt788.dates.description', 'MT788', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt788.amounts.label', 'sections.mt788.amounts.description', 'MT788', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt788.details.label', 'sections.mt788.details.description', 'MT788', 4, 'FiList', true, NOW());

-- MT790 - Advice of Charges
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt790.basic.label', 'sections.mt790.basic.description', 'MT790', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt790.dates.label', 'sections.mt790.dates.description', 'MT790', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt790.amounts.label', 'sections.mt790.amounts.description', 'MT790', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt790.banks.label', 'sections.mt790.banks.description', 'MT790', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt790.details.label', 'sections.mt790.details.description', 'MT790', 5, 'FiList', true, NOW());

-- MT791 - Request for Payment of Charges
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt791.basic.label', 'sections.mt791.basic.description', 'MT791', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt791.dates.label', 'sections.mt791.dates.description', 'MT791', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt791.amounts.label', 'sections.mt791.amounts.description', 'MT791', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt791.banks.label', 'sections.mt791.banks.description', 'MT791', 4, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt791.details.label', 'sections.mt791.details.description', 'MT791', 5, 'FiList', true, NOW());

-- MT797 - Authorization to Pay Free Format
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt797.basic.label', 'sections.mt797.basic.description', 'MT797', 1, 'FiFileText', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt797.details.label', 'sections.mt797.details.description', 'MT797', 2, 'FiList', true, NOW());

-- MT700_EXT - Extended Documentary Credit (Doka extension)
INSERT IGNORE INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon, is_active, created_at)
VALUES
(UUID(), 'BASICA', 'sections.mt700_ext.basic.label', 'sections.mt700_ext.basic.description', 'MT700_EXT', 1, 'FiFileText', true, NOW()),
(UUID(), 'FECHAS', 'sections.mt700_ext.dates.label', 'sections.mt700_ext.dates.description', 'MT700_EXT', 2, 'FiCalendar', true, NOW()),
(UUID(), 'MONTOS', 'sections.mt700_ext.amounts.label', 'sections.mt700_ext.amounts.description', 'MT700_EXT', 3, 'FiDollarSign', true, NOW()),
(UUID(), 'PARTES', 'sections.mt700_ext.parties.label', 'sections.mt700_ext.parties.description', 'MT700_EXT', 4, 'FiUsers', true, NOW()),
(UUID(), 'BANCOS', 'sections.mt700_ext.banks.label', 'sections.mt700_ext.banks.description', 'MT700_EXT', 5, 'FiHome', true, NOW()),
(UUID(), 'DETALLES', 'sections.mt700_ext.details.label', 'sections.mt700_ext.details.description', 'MT700_EXT', 6, 'FiList', true, NOW());

-- Log summary
SELECT CONCAT('Added sections for ', COUNT(DISTINCT message_type), ' Doka message types') AS migration_summary
FROM swift_section_config
WHERE message_type IN ('MT419', 'MT429', 'MT460', 'MT470', 'MT488', 'MT492', 'MT712', 'MT719',
                        'MT722', 'MT726', 'MT728', 'MT732', 'MT735', 'MT738', 'MT742', 'MT744',
                        'MT749', 'MT763', 'MT769', 'MT772', 'MT778', 'MT783', 'MT784', 'MT788',
                        'MT790', 'MT791', 'MT797', 'MT700_EXT');
