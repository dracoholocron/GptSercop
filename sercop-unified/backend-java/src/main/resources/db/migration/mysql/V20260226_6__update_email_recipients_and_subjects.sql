-- Set email_recipients and email_subject for EMAIL alert templates
-- Uses #{applicantEmail} / #{beneficiaryEmail} variables resolved by TemplateVariableResolverService

-- LC_IMPORT ISSUE: email to applicant
UPDATE event_alert_template
SET email_recipients = '#{applicantEmail}',
    email_subject = 'Emisión de LC #{operationReference}'
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ISSUE' AND alert_type = 'EMAIL';

-- LC_IMPORT ADVISE: email to beneficiary
UPDATE event_alert_template
SET email_recipients = '#{beneficiaryEmail}',
    email_subject = 'Aviso de LC #{operationReference}'
WHERE operation_type = 'LC_IMPORT' AND event_code = 'ADVISE' AND alert_type = 'EMAIL';

-- LC_IMPORT PRESENT_DOCS: email acknowledgement
UPDATE event_alert_template
SET email_recipients = '#{applicantEmail}',
    email_subject = 'Acuse de recepción de documentos LC #{operationReference}'
WHERE operation_type = 'LC_IMPORT' AND event_code = 'PRESENT_DOCS' AND alert_type = 'EMAIL';

-- LC_IMPORT PAYMENT: email to applicant
UPDATE event_alert_template
SET email_recipients = '#{applicantEmail}',
    email_subject = 'Confirmación de pago LC #{operationReference}'
WHERE operation_type = 'LC_IMPORT' AND event_code = 'PAYMENT' AND alert_type = 'EMAIL';

-- LC_IMPORT DISCREPANCY: email to applicant
UPDATE event_alert_template
SET email_recipients = '#{applicantEmail}',
    email_subject = 'Aviso de discrepancias LC #{operationReference}'
WHERE operation_type = 'LC_IMPORT' AND event_code = 'DISCREPANCY' AND alert_type = 'EMAIL';

-- LC_EXPORT ISSUE: email to applicant
UPDATE event_alert_template
SET email_recipients = '#{applicantEmail}',
    email_subject = 'Confirmación de emisión LC #{operationReference}'
WHERE operation_type = 'LC_EXPORT' AND event_code = 'ISSUE' AND alert_type = 'EMAIL';

-- GUARANTEE ISSUE: email to beneficiary
UPDATE event_alert_template
SET email_recipients = '#{beneficiaryEmail}',
    email_subject = 'Notificación de garantía #{operationReference}'
WHERE operation_type = 'GUARANTEE' AND event_code = 'ISSUE' AND alert_type = 'EMAIL';

-- GUARANTEE ISSUE_GUARANTEE: email to beneficiary
UPDATE event_alert_template
SET email_recipients = '#{beneficiaryEmail}',
    email_subject = 'Notificación de garantía #{operationReference}'
WHERE operation_type = 'GUARANTEE' AND event_code = 'ISSUE_GUARANTEE' AND alert_type = 'EMAIL';

-- GUARANTEE CLAIM: email to applicant
UPDATE event_alert_template
SET email_recipients = '#{applicantEmail}',
    email_subject = 'Aviso de reclamación garantía #{operationReference}'
WHERE operation_type = 'GUARANTEE' AND event_code = 'CLAIM' AND alert_type = 'EMAIL';
