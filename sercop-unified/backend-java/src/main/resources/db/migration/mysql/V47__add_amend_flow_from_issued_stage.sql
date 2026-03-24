-- V47: Add AMEND flow transition from ISSUED stage for LC_IMPORT
-- Fix: Allow requesting amendments directly from ISSUED stage without requiring ADVISE first
-- This aligns the flow configuration with the event_type_config where AMEND has valid_from_stages = ["ISSUED","ADVISED"]

-- =============================================
-- LC_IMPORT: Add AMEND flow from ISSUED stage
-- =============================================

-- English: Add AMEND transition from ISSUED stage
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'AMEND', FALSE, TRUE, 2, 'en',
 'Request Amendment', 'Request an amendment to the LC terms before advising', TRUE);

-- Spanish: Add AMEND transition from ISSUED stage
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_IMPORT', NULL, 'ISSUED', 'AMEND', FALSE, TRUE, 2, 'es',
 'Solicitar Enmienda', 'Solicitar una enmienda a los terminos de la LC antes de avisar', TRUE);

-- =============================================
-- LC_EXPORT: Add AMEND flow from ISSUED stage (if not exists)
-- =============================================

-- English: Add AMEND transition from ISSUED stage for LC_EXPORT
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_EXPORT', 'ISSUE', 'ISSUED', 'AMEND', FALSE, TRUE, 2, 'en',
 'Amend Terms', 'Amend the LC terms after issuance', TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- Spanish: Add AMEND transition from ISSUED stage for LC_EXPORT
INSERT INTO event_flow_config_readmodel (
    operation_type, from_event_code, from_stage, to_event_code,
    is_required, is_optional, sequence_order, language,
    transition_label, transition_help, is_active
) VALUES
('LC_EXPORT', 'ISSUE', 'ISSUED', 'AMEND', FALSE, TRUE, 2, 'es',
 'Enmendar Terminos', 'Enmendar los terminos de la LC despues de emitida', TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;
