-- Add EMAIL and GENERATE_DOCUMENT alert types
INSERT IGNORE INTO alert_type_config (type_code, label_es, label_en, description_es, description_en, icon, color, default_priority, is_active, display_order)
VALUES
  ('EMAIL', 'Correo Electrónico', 'Email', 'Enviar correo electrónico usando plantilla', 'Send email using template', 'FiMail', 'cyan', 'NORMAL', true, 100),
  ('GENERATE_DOCUMENT', 'Generar Documento', 'Generate Document', 'Generar documento usando plantilla', 'Generate document from template', 'FiFileText', 'teal', 'NORMAL', true, 110);

-- Add emailTemplateId and documentTemplateId columns to event_alert_template
ALTER TABLE event_alert_template ADD COLUMN email_template_id BIGINT NULL;
ALTER TABLE event_alert_template ADD COLUMN document_template_id BIGINT NULL;
