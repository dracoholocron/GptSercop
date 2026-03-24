-- Add email_subject and email_recipients columns to event_alert_template for EMAIL alert type
ALTER TABLE event_alert_template ADD COLUMN email_subject VARCHAR(500) NULL;
ALTER TABLE event_alert_template ADD COLUMN email_recipients VARCHAR(1000) NULL;

-- Update existing EMAIL templates with a default subject based on title
UPDATE event_alert_template
SET email_subject = title_template
WHERE alert_type = 'EMAIL' AND email_subject IS NULL;
