-- ==================================================
-- Migration V65: Allow multiple guarantee extensions
-- ==================================================
-- In banking practice, guarantees can be extended multiple times.
-- This migration updates the EXTEND event to be executable from
-- both ISSUED and EXTENDED stages, and adds the flow configuration.
-- ==================================================

-- 1. Update EXTEND event to allow execution from EXTENDED stage (English)
UPDATE event_type_config_readmodel
SET valid_from_stages = '["ISSUED", "EXTENDED"]',
    resulting_stage = 'EXTENDED'
WHERE event_code = 'EXTEND'
  AND operation_type = 'GUARANTEE'
  AND language = 'en';

-- 2. Update EXTEND event to allow execution from EXTENDED stage (Spanish)
UPDATE event_type_config_readmodel
SET valid_from_stages = '["ISSUED", "EXTENDED"]',
    resulting_stage = 'EXTENDED'
WHERE event_code = 'EXTEND'
  AND operation_type = 'GUARANTEE'
  AND language = 'es';

-- 3. Add flow configuration for EXTEND -> EXTEND (English)
INSERT INTO event_flow_config_readmodel
    (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active)
VALUES
    ('GUARANTEE', 'EXTEND', 'EXTENDED', 'EXTEND', FALSE, 3, 'en', 'Extend Again', TRUE)
ON DUPLICATE KEY UPDATE
    is_active = TRUE,
    transition_label = 'Extend Again';

-- 4. Add flow configuration for EXTEND -> EXTEND (Spanish)
INSERT INTO event_flow_config_readmodel
    (operation_type, from_event_code, from_stage, to_event_code, is_required, sequence_order, language, transition_label, is_active)
VALUES
    ('GUARANTEE', 'EXTEND', 'EXTENDED', 'EXTEND', FALSE, 3, 'es', 'Extender Nuevamente', TRUE)
ON DUPLICATE KEY UPDATE
    is_active = TRUE,
    transition_label = 'Extender Nuevamente';

-- ==================================================
-- End of migration V65
-- ==================================================
