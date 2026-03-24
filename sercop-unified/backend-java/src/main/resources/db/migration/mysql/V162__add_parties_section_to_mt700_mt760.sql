-- V162: Add PARTIES section to MT700 and MT760
-- The fields :50: and :59: are in section PARTIES but the section was not defined

-- =====================================================
-- Add PARTIES section to MT700 (LC Import/Export)
-- Insert after BASIC (order 1) - so PARTIES will be order 2
-- =====================================================

-- First, shift existing sections to make room for PARTIES at position 2
UPDATE swift_section_config
SET display_order = display_order + 1
WHERE message_type = 'MT700'
  AND display_order >= 2;

-- Insert PARTIES section at position 2
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon)
VALUES (UUID(), 'PARTIES', 'sections.mt700.parties.label', 'sections.mt700.parties.description', 'MT700', 2, 'FiUsers');

-- =====================================================
-- Add PARTIES section to MT760 (Guarantees)
-- Insert after BASIC (order 1) - so PARTIES will be order 2
-- =====================================================

-- First, shift existing sections to make room for PARTIES at position 2
UPDATE swift_section_config
SET display_order = display_order + 1
WHERE message_type = 'MT760'
  AND display_order >= 2;

-- Insert PARTIES section at position 2
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon)
VALUES (UUID(), 'PARTIES', 'sections.mt760.parties.label', 'sections.mt760.parties.description', 'MT760', 2, 'FiUsers');

-- =====================================================
-- Add PARTIES section to MT710 (Advice of Third Bank's DC)
-- =====================================================
UPDATE swift_section_config
SET display_order = display_order + 1
WHERE message_type = 'MT710'
  AND display_order >= 2;

INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon)
VALUES (UUID(), 'PARTIES', 'sections.mt710.parties.label', 'sections.mt710.parties.description', 'MT710', 2, 'FiUsers');

-- =====================================================
-- Add PARTIES section to MT720 (Transfer of DC)
-- =====================================================
UPDATE swift_section_config
SET display_order = display_order + 1
WHERE message_type = 'MT720'
  AND display_order >= 2;

INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon)
VALUES (UUID(), 'PARTIES', 'sections.mt720.parties.label', 'sections.mt720.parties.description', 'MT720', 2, 'FiUsers');
