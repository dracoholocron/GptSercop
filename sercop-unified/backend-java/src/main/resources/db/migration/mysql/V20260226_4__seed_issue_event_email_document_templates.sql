-- V20260226_4: Add EMAIL and GENERATE_DOCUMENT alert templates for ISSUE event
-- The issuance wizards (LC_IMPORT, LC_EXPORT, GUARANTEE) all use eventCode='ISSUE'.
-- V20260226_3 seeded ADVISE/ISSUE_GUARANTEE but missed ISSUE for LC_IMPORT and GUARANTEE.

INSERT INTO event_alert_template
  (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order, is_active, email_template_id, document_template_id)
VALUES

-- LC_IMPORT ISSUE: Email notification of LC issuance
('LC_IMPORT', 'ISSUE', 'EMAIL', 'RECOMMENDED',
 'Enviar correo de emisión de LC a #{applicantName}',
 'Enviar correo electrónico a #{applicantName} confirmando la emisión de LC #{operationReference} por #{formattedAmount} #{currency}',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["correo","emision","notificacion"]', 'es', 10, true, 1, NULL),

-- LC_IMPORT ISSUE: Generate issuance document
('LC_IMPORT', 'ISSUE', 'GENERATE_DOCUMENT', 'RECOMMENDED',
 'Generar documento de emisión de LC #{operationReference}',
 'Generar documento certificado de emisión de LC #{operationReference} por #{formattedAmount} #{currency} a favor de #{beneficiaryName}',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","emision","certificado"]', 'es', 11, true, NULL, 1),

-- GUARANTEE ISSUE: Email guarantee issuance notification
('GUARANTEE', 'ISSUE', 'EMAIL', 'RECOMMENDED',
 'Enviar correo de emisión de garantía a #{beneficiaryName}',
 'Enviar correo electrónico al beneficiario #{beneficiaryName} notificando la emisión de garantía #{operationReference} por #{formattedAmount} #{currency}',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["correo","garantia","emision"]', 'es', 10, true, 1, NULL),

-- GUARANTEE ISSUE: Generate guarantee issuance document
('GUARANTEE', 'ISSUE', 'GENERATE_DOCUMENT', 'MANDATORY',
 'Generar carta de garantía #{operationReference}',
 'Generar documento formal de carta de garantía #{operationReference} por #{formattedAmount} #{currency} a favor de #{beneficiaryName}',
 'HIGH', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","garantia","carta"]', 'es', 11, true, NULL, 1);
