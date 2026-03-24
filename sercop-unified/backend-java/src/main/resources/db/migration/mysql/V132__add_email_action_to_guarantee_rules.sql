-- =============================================================================
-- Migration V132: Add API_CALL action to GUARANTEE event rules
-- Calls MAILGUN_EMAIL external API when guarantee operations are approved
-- Variables use #{...} syntax for runtime substitution by the action executor
-- =============================================================================

-- Update GUARANTEE_ISSUE_APPROVED to include API_CALL to Mailgun
UPDATE event_rules_read_model
SET actions_json = '[
  {"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT760","direction":"OUTBOUND","description":"Generar mensaje MT760"}},
  {"tipo":"API_CALL","orden":2,"async":true,"continueOnError":true,"config":{
    "apiConfigCode":"MAILGUN_EMAIL",
    "description":"Enviar notificación de garantía emitida via Mailgun API",
    "requestBody":{
      "from":"noreply@globalcmx.com",
      "to":"#{applicantEmail}",
      "subject":"Garantía Emitida - #{reference}",
      "html":"<h2>Garantía Emitida</h2><p>Estimado #{applicantName},</p><p>Su garantía ha sido emitida exitosamente.</p><ul><li>Referencia: #{reference}</li><li>Monto: #{currency} #{amount}</li><li>Beneficiario: #{beneficiaryName}</li><li>Fecha Vencimiento: #{expiryDate}</li></ul><p>Saludos,<br/>GlobalCMX</p>"
    }
  }},
  {"tipo":"AUDITORIA","orden":3,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_EMITIDA","severidad":"INFO","mensaje":"Garantía emitida, mensaje MT760 y email enviados"}}
]',
updated_at = NOW()
WHERE code = 'GUARANTEE_ISSUE_APPROVED';

-- Update GUARANTEE_AMEND_APPROVED to include API_CALL to Mailgun
UPDATE event_rules_read_model
SET actions_json = '[
  {"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT767","direction":"OUTBOUND","description":"Generar mensaje MT767 de enmienda"}},
  {"tipo":"API_CALL","orden":2,"async":true,"continueOnError":true,"config":{
    "apiConfigCode":"MAILGUN_EMAIL",
    "description":"Enviar notificación de enmienda via Mailgun API",
    "requestBody":{
      "from":"noreply@globalcmx.com",
      "to":"#{applicantEmail}",
      "subject":"Garantía Enmendada - #{reference}",
      "html":"<h2>Garantía Enmendada</h2><p>Estimado #{applicantName},</p><p>Su garantía ha sido enmendada.</p><ul><li>Referencia: #{reference}</li><li>Monto: #{currency} #{amount}</li></ul><p>Saludos,<br/>GlobalCMX</p>"
    }
  }},
  {"tipo":"AUDITORIA","orden":3,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_ENMENDADA","severidad":"INFO","mensaje":"Garantía enmendada, mensaje MT767 y email enviados"}}
]',
updated_at = NOW()
WHERE code = 'GUARANTEE_AMEND_APPROVED';

-- Update GUARANTEE_EXTEND_APPROVED to include API_CALL to Mailgun
UPDATE event_rules_read_model
SET actions_json = '[
  {"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT767","direction":"OUTBOUND","description":"Generar mensaje MT767 de extensión"}},
  {"tipo":"API_CALL","orden":2,"async":true,"continueOnError":true,"config":{
    "apiConfigCode":"MAILGUN_EMAIL",
    "description":"Enviar notificación de extensión via Mailgun API",
    "requestBody":{
      "from":"noreply@globalcmx.com",
      "to":"#{applicantEmail}",
      "subject":"Garantía Extendida - #{reference}",
      "html":"<h2>Garantía Extendida</h2><p>Estimado #{applicantName},</p><p>La vigencia de su garantía ha sido extendida.</p><ul><li>Referencia: #{reference}</li><li>Nueva Fecha Vencimiento: #{newExpiryDate}</li></ul><p>Saludos,<br/>GlobalCMX</p>"
    }
  }},
  {"tipo":"AUDITORIA","orden":3,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_EXTENDIDA","severidad":"INFO","mensaje":"Garantía extendida, mensaje MT767 y email enviados"}}
]',
updated_at = NOW()
WHERE code = 'GUARANTEE_EXTEND_APPROVED';

-- Update GUARANTEE_PAY_CLAIM_APPROVED to include API_CALL to Mailgun
UPDATE event_rules_read_model
SET actions_json = '[
  {"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT756","direction":"OUTBOUND","description":"Generar mensaje MT756 de pago"}},
  {"tipo":"API_CALL","orden":2,"async":true,"continueOnError":true,"config":{
    "apiConfigCode":"MAILGUN_EMAIL",
    "description":"Enviar notificación de pago de reclamo via Mailgun API",
    "requestBody":{
      "from":"noreply@globalcmx.com",
      "to":"#{applicantEmail}",
      "subject":"Reclamo Pagado - Garantía #{reference}",
      "html":"<h2>Reclamo Pagado</h2><p>Estimado #{applicantName},</p><p>Se ha efectuado el pago del reclamo de su garantía.</p><ul><li>Referencia: #{reference}</li><li>Monto Reclamo: #{currency} #{claimAmount}</li><li>Fecha Pago: #{paymentDate}</li></ul><p>Saludos,<br/>GlobalCMX</p>"
    }
  }},
  {"tipo":"AUDITORIA","orden":3,"async":true,"continueOnError":true,"config":{"categoria":"RECLAMO_PAGADO","severidad":"INFO","mensaje":"Reclamo pagado, mensaje MT756 y email enviados"}}
]',
updated_at = NOW()
WHERE code = 'GUARANTEE_PAY_CLAIM_APPROVED';

-- Update GUARANTEE_NEW_APPROVED to include API_CALL to Mailgun
UPDATE event_rules_read_model
SET actions_json = '[
  {"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,"config":{"messageType":"MT760","direction":"OUTBOUND","description":"Generar y registrar mensaje MT760"}},
  {"tipo":"API_CALL","orden":2,"async":true,"continueOnError":true,"config":{
    "apiConfigCode":"MAILGUN_EMAIL",
    "description":"Enviar notificación de nueva garantía aprobada via Mailgun API",
    "requestBody":{
      "from":"noreply@globalcmx.com",
      "to":"#{applicantEmail}",
      "subject":"Nueva Garantía Aprobada - #{reference}",
      "html":"<h2>Garantía Aprobada</h2><p>Estimado #{applicantName},</p><p>Su solicitud de garantía ha sido aprobada.</p><ul><li>Referencia: #{reference}</li><li>Monto: #{currency} #{amount}</li><li>Beneficiario: #{beneficiaryName}</li><li>Fecha Vencimiento: #{expiryDate}</li></ul><p>Saludos,<br/>GlobalCMX</p>"
    }
  }},
  {"tipo":"AUDITORIA","orden":3,"async":true,"continueOnError":true,"config":{"categoria":"GARANTIA_EMITIDA","severidad":"INFO","mensaje":"Nueva garantía aprobada, mensaje MT760 y email enviados"}}
]',
updated_at = NOW()
WHERE code = 'GUARANTEE_NEW_APPROVED';
