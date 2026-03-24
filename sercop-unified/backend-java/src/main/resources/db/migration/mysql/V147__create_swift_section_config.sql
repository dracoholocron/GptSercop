-- =====================================================
-- V147: Create SWIFT Section Configuration Table
-- =====================================================
-- Stores section metadata for dynamic form rendering
-- Uses translation keys (tags) for multi-language support
-- Section codes are in English for consistency
-- Frontend resolves translations via i18n
-- =====================================================

CREATE TABLE IF NOT EXISTS swift_section_config (
    id VARCHAR(36) PRIMARY KEY,
    section_code VARCHAR(50) NOT NULL,       -- English code: BASIC, AMOUNTS, DATES, etc.
    label_key VARCHAR(100) NOT NULL,          -- Translation key: sections.mt700.basic.label
    description_key VARCHAR(100),              -- Translation key: sections.mt700.basic.description
    message_type VARCHAR(10) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    icon VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_section_message (section_code, message_type)
);

-- Index for efficient lookups
CREATE INDEX idx_section_lookup ON swift_section_config(message_type, is_active, display_order);

-- =====================================================
-- MT700 - Letter of Credit Sections
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt700.basic.label', 'sections.mt700.basic.description', 'MT700', 1, 'FiInfo'),
(UUID(), 'AMOUNTS', 'sections.mt700.amounts.label', 'sections.mt700.amounts.description', 'MT700', 2, 'FiDollarSign'),
(UUID(), 'DATES', 'sections.mt700.dates.label', 'sections.mt700.dates.description', 'MT700', 3, 'FiCalendar'),
(UUID(), 'BANKS', 'sections.mt700.banks.label', 'sections.mt700.banks.description', 'MT700', 4, 'FiUsers'),
(UUID(), 'TRANSPORT', 'sections.mt700.transport.label', 'sections.mt700.transport.description', 'MT700', 5, 'FiTruck'),
(UUID(), 'DOCUMENTS', 'sections.mt700.documents.label', 'sections.mt700.documents.description', 'MT700', 6, 'FiFileText'),
(UUID(), 'CONDITIONS', 'sections.mt700.conditions.label', 'sections.mt700.conditions.description', 'MT700', 7, 'FiList'),
(UUID(), 'INSTRUCTIONS', 'sections.mt700.instructions.label', 'sections.mt700.instructions.description', 'MT700', 8, 'FiMessageSquare');

-- =====================================================
-- MT760 - Guarantee Sections
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt760.basic.label', 'sections.mt760.basic.description', 'MT760', 1, 'FiInfo'),
(UUID(), 'DATES', 'sections.mt760.dates.label', 'sections.mt760.dates.description', 'MT760', 2, 'FiCalendar'),
(UUID(), 'AMOUNTS', 'sections.mt760.amounts.label', 'sections.mt760.amounts.description', 'MT760', 3, 'FiDollarSign'),
(UUID(), 'BANKS', 'sections.mt760.banks.label', 'sections.mt760.banks.description', 'MT760', 4, 'FiUsers'),
(UUID(), 'TERMS', 'sections.mt760.terms.label', 'sections.mt760.terms.description', 'MT760', 5, 'FiFileText'),
(UUID(), 'ADDITIONAL', 'sections.mt760.additional.label', 'sections.mt760.additional.description', 'MT760', 6, 'FiMoreHorizontal');

-- =====================================================
-- MT710 - Advice of Third Bank's Documentary Credit
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt710.basic.label', 'sections.mt710.basic.description', 'MT710', 1, 'FiInfo'),
(UUID(), 'AMOUNTS', 'sections.mt710.amounts.label', 'sections.mt710.amounts.description', 'MT710', 2, 'FiDollarSign'),
(UUID(), 'DATES', 'sections.mt710.dates.label', 'sections.mt710.dates.description', 'MT710', 3, 'FiCalendar'),
(UUID(), 'BANKS', 'sections.mt710.banks.label', 'sections.mt710.banks.description', 'MT710', 4, 'FiUsers'),
(UUID(), 'TRANSPORT', 'sections.mt710.transport.label', 'sections.mt710.transport.description', 'MT710', 5, 'FiTruck'),
(UUID(), 'DOCUMENTS', 'sections.mt710.documents.label', 'sections.mt710.documents.description', 'MT710', 6, 'FiFileText'),
(UUID(), 'CONDITIONS', 'sections.mt710.conditions.label', 'sections.mt710.conditions.description', 'MT710', 7, 'FiList');

-- =====================================================
-- MT720 - Transfer of Documentary Credit
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt720.basic.label', 'sections.mt720.basic.description', 'MT720', 1, 'FiInfo'),
(UUID(), 'AMOUNTS', 'sections.mt720.amounts.label', 'sections.mt720.amounts.description', 'MT720', 2, 'FiDollarSign'),
(UUID(), 'DATES', 'sections.mt720.dates.label', 'sections.mt720.dates.description', 'MT720', 3, 'FiCalendar'),
(UUID(), 'BANKS', 'sections.mt720.banks.label', 'sections.mt720.banks.description', 'MT720', 4, 'FiUsers'),
(UUID(), 'TRANSPORT', 'sections.mt720.transport.label', 'sections.mt720.transport.description', 'MT720', 5, 'FiTruck'),
(UUID(), 'DOCUMENTS', 'sections.mt720.documents.label', 'sections.mt720.documents.description', 'MT720', 6, 'FiFileText'),
(UUID(), 'CONDITIONS', 'sections.mt720.conditions.label', 'sections.mt720.conditions.description', 'MT720', 7, 'FiList');

-- =====================================================
-- MT707 - Amendment to Documentary Credit
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt707.basic.label', 'sections.mt707.basic.description', 'MT707', 1, 'FiInfo'),
(UUID(), 'AMOUNTS', 'sections.mt707.amounts.label', 'sections.mt707.amounts.description', 'MT707', 2, 'FiDollarSign'),
(UUID(), 'DATES', 'sections.mt707.dates.label', 'sections.mt707.dates.description', 'MT707', 3, 'FiCalendar'),
(UUID(), 'CONDITIONS', 'sections.mt707.conditions.label', 'sections.mt707.conditions.description', 'MT707', 4, 'FiList');

-- =====================================================
-- MT400 - Collections - Advice of Payment
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt400.basic.label', 'sections.mt400.basic.description', 'MT400', 1, 'FiInfo'),
(UUID(), 'AMOUNTS', 'sections.mt400.amounts.label', 'sections.mt400.amounts.description', 'MT400', 2, 'FiDollarSign'),
(UUID(), 'PARTIES', 'sections.mt400.parties.label', 'sections.mt400.parties.description', 'MT400', 3, 'FiUsers'),
(UUID(), 'ADDITIONAL', 'sections.mt400.additional.label', 'sections.mt400.additional.description', 'MT400', 4, 'FiMoreHorizontal');

-- =====================================================
-- MT410 - Collections - Acknowledgement
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt410.basic.label', 'sections.mt410.basic.description', 'MT410', 1, 'FiInfo'),
(UUID(), 'PARTIES', 'sections.mt410.parties.label', 'sections.mt410.parties.description', 'MT410', 2, 'FiUsers');

-- =====================================================
-- MT412 - Collections - Advice of Acceptance
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt412.basic.label', 'sections.mt412.basic.description', 'MT412', 1, 'FiInfo'),
(UUID(), 'AMOUNTS', 'sections.mt412.amounts.label', 'sections.mt412.amounts.description', 'MT412', 2, 'FiDollarSign'),
(UUID(), 'DATES', 'sections.mt412.dates.label', 'sections.mt412.dates.description', 'MT412', 3, 'FiCalendar'),
(UUID(), 'PARTIES', 'sections.mt412.parties.label', 'sections.mt412.parties.description', 'MT412', 4, 'FiUsers');

-- =====================================================
-- MT416 - Collections - Advice of Non-Payment/Non-Acceptance
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt416.basic.label', 'sections.mt416.basic.description', 'MT416', 1, 'FiInfo'),
(UUID(), 'PARTIES', 'sections.mt416.parties.label', 'sections.mt416.parties.description', 'MT416', 2, 'FiUsers'),
(UUID(), 'ADDITIONAL', 'sections.mt416.additional.label', 'sections.mt416.additional.description', 'MT416', 3, 'FiMoreHorizontal');

-- =====================================================
-- MT420 - Collections - Tracer
-- =====================================================
INSERT INTO swift_section_config (id, section_code, label_key, description_key, message_type, display_order, icon) VALUES
(UUID(), 'BASIC', 'sections.mt420.basic.label', 'sections.mt420.basic.description', 'MT420', 1, 'FiInfo'),
(UUID(), 'PARTIES', 'sections.mt420.parties.label', 'sections.mt420.parties.description', 'MT420', 2, 'FiUsers'),
(UUID(), 'ADDITIONAL', 'sections.mt420.additional.label', 'sections.mt420.additional.description', 'MT420', 3, 'FiMoreHorizontal');
