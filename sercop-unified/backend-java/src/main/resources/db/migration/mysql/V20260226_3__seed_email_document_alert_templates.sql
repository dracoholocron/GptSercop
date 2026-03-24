-- V20260226_3: Seed example alert templates for EMAIL and GENERATE_DOCUMENT types
-- These templates demonstrate the new alert types integrated into existing event flows.
-- email_template_id / document_template_id reference IDs from the email-templates / templates catalogs.
-- Set to 1 as placeholder — update via AlertTemplatesTab UI to match actual template IDs.

-- =============================================
-- LC_IMPORT: Email & Document alert templates
-- =============================================

INSERT INTO event_alert_template
  (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, due_date_reference, tags, language, display_order, is_active, email_template_id, document_template_id)
VALUES

-- ADVISE: Send email notification to beneficiary about LC advice
('LC_IMPORT', 'ADVISE', 'EMAIL', 'RECOMMENDED',
 'Enviar correo de aviso de LC a #{beneficiaryName}',
 'Enviar correo electrónico al beneficiario #{beneficiaryName} notificando el aviso de LC #{operationReference} por #{formattedAmount} #{currency}',
 'NORMAL', 'ROLE_OPERATOR', 1, 'EVENT_EXECUTION',
 '["correo","aviso","notificacion"]', 'es', 10, true, 1, NULL),

-- ADVISE: Generate cover letter document for LC advice
('LC_IMPORT', 'ADVISE', 'GENERATE_DOCUMENT', 'RECOMMENDED',
 'Generar carta de aviso de LC #{operationReference}',
 'Generar documento de carta de aviso de la LC #{operationReference} dirigida a #{beneficiaryName} con los términos y condiciones principales',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","aviso","carta"]', 'es', 11, true, NULL, 1),

-- PRESENT_DOCS: Email to notify document receipt acknowledgement
('LC_IMPORT', 'PRESENT_DOCS', 'EMAIL', 'RECOMMENDED',
 'Enviar acuse de recepción de documentos',
 'Enviar correo electrónico al presentador confirmando la recepción de documentos para LC #{operationReference}',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["correo","documentos","acuse"]', 'es', 10, true, 1, NULL),

-- ACCEPT_DOCS: Generate acceptance letter
('LC_IMPORT', 'ACCEPT_DOCS', 'GENERATE_DOCUMENT', 'RECOMMENDED',
 'Generar carta de aceptación de documentos',
 'Generar carta formal de aceptación de documentos conformes para LC #{operationReference}. Monto: #{formattedAmount} #{currency}',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","aceptacion","carta"]', 'es', 10, true, NULL, 1),

-- PAYMENT: Email payment confirmation to applicant
('LC_IMPORT', 'PAYMENT', 'EMAIL', 'RECOMMENDED',
 'Enviar confirmación de pago a #{applicantName}',
 'Enviar correo electrónico a #{applicantName} confirmando el pago de LC #{operationReference} por #{formattedAmount} #{currency}',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["correo","pago","confirmacion"]', 'es', 10, true, 1, NULL),

-- PAYMENT: Generate payment advice document
('LC_IMPORT', 'PAYMENT', 'GENERATE_DOCUMENT', 'OPTIONAL',
 'Generar aviso de pago #{operationReference}',
 'Generar documento de aviso de pago para la LC #{operationReference} detallando monto, fecha y cargos aplicados',
 'LOW', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","pago","aviso"]', 'es', 11, true, NULL, 1),

-- DISCREPANCY: Email discrepancy notice to applicant
('LC_IMPORT', 'DISCREPANCY', 'EMAIL', 'MANDATORY',
 'Enviar aviso de discrepancias a #{applicantName}',
 'Enviar correo electrónico a #{applicantName} detallando las discrepancias encontradas en los documentos de LC #{operationReference} y solicitando autorización de dispensa',
 'HIGH', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["correo","discrepancia","urgente"]', 'es', 10, true, 1, NULL),

-- CLOSE: Generate closing certificate
('LC_IMPORT', 'CLOSE', 'GENERATE_DOCUMENT', 'OPTIONAL',
 'Generar certificado de cierre de LC',
 'Generar documento de certificado de cierre de la LC #{operationReference} para archivo',
 'LOW', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","cierre","certificado"]', 'es', 10, true, NULL, 1),

-- =============================================
-- LC_EXPORT: Email & Document alert templates
-- =============================================

-- ISSUE: Email confirmation of LC issuance
('LC_EXPORT', 'ISSUE', 'EMAIL', 'RECOMMENDED',
 'Enviar confirmación de emisión de LC a #{applicantName}',
 'Enviar correo electrónico a #{applicantName} confirmando la emisión de LC #{operationReference} por #{formattedAmount} #{currency}',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["correo","emision","confirmacion"]', 'es', 10, true, 1, NULL),

-- ISSUE: Generate issuance certificate
('LC_EXPORT', 'ISSUE', 'GENERATE_DOCUMENT', 'RECOMMENDED',
 'Generar certificado de emisión de LC',
 'Generar documento certificado de emisión de LC #{operationReference} para archivo y entrega al cliente',
 'NORMAL', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","emision","certificado"]', 'es', 11, true, NULL, 1),

-- =============================================
-- GUARANTEE: Email & Document alert templates
-- =============================================

-- ISSUE_GUARANTEE: Email guarantee notification
('GUARANTEE', 'ISSUE_GUARANTEE', 'EMAIL', 'RECOMMENDED',
 'Enviar notificación de garantía a #{beneficiaryName}',
 'Enviar correo electrónico al beneficiario #{beneficiaryName} notificando la emisión de garantía #{operationReference}',
 'NORMAL', 'ROLE_OPERATOR', 1, 'EVENT_EXECUTION',
 '["correo","garantia","notificacion"]', 'es', 10, true, 1, NULL),

-- ISSUE_GUARANTEE: Generate guarantee letter
('GUARANTEE', 'ISSUE_GUARANTEE', 'GENERATE_DOCUMENT', 'MANDATORY',
 'Generar carta de garantía #{operationReference}',
 'Generar documento formal de carta de garantía #{operationReference} por #{formattedAmount} #{currency} a favor de #{beneficiaryName}',
 'HIGH', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["documento","garantia","carta"]', 'es', 11, true, NULL, 1),

-- CLAIM: Email claim notification
('GUARANTEE', 'CLAIM', 'EMAIL', 'MANDATORY',
 'Enviar aviso de reclamación a #{applicantName}',
 'Enviar correo electrónico a #{applicantName} notificando la reclamación recibida contra garantía #{operationReference}',
 'URGENT', 'ROLE_OPERATOR', 0, 'EVENT_EXECUTION',
 '["correo","garantia","reclamacion","urgente"]', 'es', 10, true, 1, NULL);
