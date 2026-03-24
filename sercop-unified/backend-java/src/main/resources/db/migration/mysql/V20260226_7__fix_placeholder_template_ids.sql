-- Remove placeholder template IDs (1) that don't correspond to real templates
-- Users should link actual templates via AlertTemplatesTab UI

UPDATE event_alert_template SET email_template_id = NULL WHERE email_template_id = 1;
UPDATE event_alert_template SET document_template_id = NULL WHERE document_template_id = 1;
