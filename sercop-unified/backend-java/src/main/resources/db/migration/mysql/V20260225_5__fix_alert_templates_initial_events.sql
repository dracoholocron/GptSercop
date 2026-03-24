-- V20260225_5: Fix alert templates to match actual initial event codes
-- LC_IMPORT uses PRE_ADVISE (not ADVISE) as its primary initial event (sequence_order=0)
-- Also has ISSUE and ISSUE_EXTENDED as initial events
-- Solution: Duplicate LC_IMPORT/ADVISE templates for PRE_ADVISE and ISSUE

-- Duplicate LC_IMPORT/ADVISE templates for PRE_ADVISE (Spanish)
INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order)
SELECT operation_type, 'PRE_ADVISE', alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order
FROM event_alert_template
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ADVISE' AND language = 'es';

-- Duplicate LC_IMPORT/ADVISE templates for PRE_ADVISE (English)
INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order)
SELECT operation_type, 'PRE_ADVISE', alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order
FROM event_alert_template
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ADVISE' AND language = 'en';

-- Duplicate LC_IMPORT/ADVISE templates for ISSUE (Spanish)
INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order)
SELECT operation_type, 'ISSUE', alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order
FROM event_alert_template
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ADVISE' AND language = 'es';

-- Duplicate LC_IMPORT/ADVISE templates for ISSUE (English)
INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order)
SELECT operation_type, 'ISSUE', alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order
FROM event_alert_template
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ADVISE' AND language = 'en';

-- Duplicate LC_IMPORT/ADVISE templates for ISSUE_EXTENDED (Spanish)
INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order)
SELECT operation_type, 'ISSUE_EXTENDED', alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order
FROM event_alert_template
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ADVISE' AND language = 'es';

-- Duplicate LC_IMPORT/ADVISE templates for ISSUE_EXTENDED (English)
INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order)
SELECT operation_type, 'ISSUE_EXTENDED', alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order
FROM event_alert_template
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ADVISE' AND language = 'en';
