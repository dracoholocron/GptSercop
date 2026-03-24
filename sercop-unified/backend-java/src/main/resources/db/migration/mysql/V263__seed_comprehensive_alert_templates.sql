-- V263: Comprehensive alert templates for all operation types
-- Based on trade finance best practices (UCP600, URDG758, URC522)
-- Uses correct event codes from V40 seed data
-- Replaces incomplete seed data from V262

-- Clean up old seed data with incorrect event codes
DELETE FROM event_alert_template WHERE operation_type IN ('LC_IMPORT', 'LC_EXPORT', 'GUARANTEE', 'COLLECTION');

-- =============================================
-- LC_IMPORT Alert Templates (Spanish)
-- =============================================

INSERT INTO event_alert_template (operation_type, event_code, alert_type, requirement_level, title_template, description_template, default_priority, assigned_role, due_days_offset, tags, language, display_order) VALUES

-- ADVISE: Avisar LC al beneficiario
('LC_IMPORT', 'ADVISE', 'FOLLOW_UP', 'MANDATORY', 'Confirmar recepción del aviso de LC', 'Verificar que el banco avisador confirmó recepción del aviso de LC #{operationReference} por #{formattedAmount} #{currency}', 'HIGH', 'ROLE_OPERATOR', 3, '["seguimiento","swift"]', 'es', 1),
('LC_IMPORT', 'ADVISE', 'TASK', 'RECOMMENDED', 'Notificar al beneficiario', 'Comunicar a #{beneficiaryName} que se ha avisado la LC #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 1, '["cliente","notificacion"]', 'es', 2),

-- AMEND: Solicitar enmienda
('LC_IMPORT', 'AMEND', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a solicitud de enmienda', 'Dar seguimiento a la respuesta de enmienda de LC #{operationReference}. El banco avisador debe responder la aceptación o rechazo.', 'HIGH', 'ROLE_OPERATOR', 2, '["seguimiento","enmienda","urgente"]', 'es', 1),
('LC_IMPORT', 'AMEND', 'REMINDER', 'RECOMMENDED', 'Verificar términos de enmienda', 'Revisar que los nuevos términos de la enmienda de LC #{operationReference} sean correctos antes del plazo', 'NORMAL', 'ROLE_MANAGER', 1, '["revision","enmienda"]', 'es', 2),

-- CONFIRM: Confirmar LC
('LC_IMPORT', 'CONFIRM', 'TASK', 'MANDATORY', 'Registrar confirmación bancaria', 'Registrar la confirmación agregada por el banco confirmador para LC #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 1, '["confirmacion"]', 'es', 1),
('LC_IMPORT', 'CONFIRM', 'FOLLOW_UP', 'RECOMMENDED', 'Notificar confirmación al solicitante', 'Informar a #{applicantName} que la LC #{operationReference} ha sido confirmada', 'NORMAL', 'ROLE_OPERATOR', 2, '["cliente","notificacion"]', 'es', 2),

-- PRESENT_DOCS: Presentar documentos
('LC_IMPORT', 'PRESENT_DOCS', 'DEADLINE', 'MANDATORY', 'Plazo de revisión documental (5 días)', 'Examinar documentos presentados para LC #{operationReference} dentro del plazo de 5 días hábiles bancarios según UCP600 Art. 14', 'URGENT', 'ROLE_OPERATOR', 5, '["documentacion","ucp600","urgente"]', 'es', 1),
('LC_IMPORT', 'PRESENT_DOCS', 'COMPLIANCE_CHECK', 'MANDATORY', 'Verificación de compliance', 'Validar que los documentos de LC #{operationReference} cumplen con regulaciones AML/KYC y sanciones internacionales', 'HIGH', 'ROLE_MANAGER', 3, '["compliance","documentacion","regulatorio"]', 'es', 2),
('LC_IMPORT', 'PRESENT_DOCS', 'TASK', 'RECOMMENDED', 'Cotejo de documentos contra LC', 'Verificar que cada documento cumple con los términos y condiciones de la LC #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 2, '["documentacion","revision"]', 'es', 3),

-- DISCREPANCY: Reportar discrepancia
('LC_IMPORT', 'DISCREPANCY', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a resolución de discrepancias', 'Dar seguimiento a la resolución de discrepancias reportadas en LC #{operationReference}. Verificar si #{applicantName} acepta dispensar.', 'URGENT', 'ROLE_OPERATOR', 2, '["discrepancia","urgente","seguimiento"]', 'es', 1),
('LC_IMPORT', 'DISCREPANCY', 'CLIENT_CONTACT', 'MANDATORY', 'Notificar discrepancias al solicitante', 'Comunicar a #{applicantName} las discrepancias encontradas en los documentos de LC #{operationReference} para autorización de dispensa', 'HIGH', 'ROLE_OPERATOR', 1, '["cliente","discrepancia","notificacion"]', 'es', 2),

-- ACCEPT_DOCS: Aceptar documentos
('LC_IMPORT', 'ACCEPT_DOCS', 'TASK', 'MANDATORY', 'Preparar pago tras aceptación', 'Iniciar proceso de pago para LC #{operationReference} tras la aceptación de documentos. Monto: #{formattedAmount} #{currency}', 'HIGH', 'ROLE_OPERATOR', 1, '["pago","documentacion"]', 'es', 1),
('LC_IMPORT', 'ACCEPT_DOCS', 'FOLLOW_UP', 'RECOMMENDED', 'Confirmar envío de MT730', 'Verificar que se envió el acuse de aceptación (MT730) al banco presentador para LC #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 1, '["swift","seguimiento"]', 'es', 2),

-- PAYMENT: Efectuar pago
('LC_IMPORT', 'PAYMENT', 'TASK', 'MANDATORY', 'Confirmar aplicación contable', 'Verificar que el pago de LC #{operationReference} por #{formattedAmount} #{currency} fue registrado correctamente en contabilidad', 'HIGH', 'ROLE_MANAGER', 1, '["pago","contabilidad"]', 'es', 1),
('LC_IMPORT', 'PAYMENT', 'CLIENT_CONTACT', 'RECOMMENDED', 'Notificar pago al cliente', 'Comunicar a #{applicantName} que se efectuó el pago de LC #{operationReference} por #{formattedAmount} #{currency}', 'NORMAL', 'ROLE_OPERATOR', 1, '["cliente","pago","notificacion"]', 'es', 2),
('LC_IMPORT', 'PAYMENT', 'COMPLIANCE_CHECK', 'RECOMMENDED', 'Verificación post-pago', 'Confirmar que el débito de #{formattedAmount} #{currency} de LC #{operationReference} cumple con los límites de exposición', 'NORMAL', 'ROLE_MANAGER', 2, '["compliance","pago"]', 'es', 3),

-- CLOSE: Cerrar LC
('LC_IMPORT', 'CLOSE', 'TASK', 'RECOMMENDED', 'Archivar expediente de LC', 'Archivar documentación completa de LC #{operationReference}. Verificar que todos los documentos están digitalizados.', 'LOW', 'ROLE_OPERATOR', 5, '["archivo","cierre"]', 'es', 1),
('LC_IMPORT', 'CLOSE', 'TASK', 'OPTIONAL', 'Reconciliación final', 'Realizar reconciliación final de comisiones y gastos de LC #{operationReference}', 'LOW', 'ROLE_MANAGER', 3, '["contabilidad","cierre"]', 'es', 2),

-- AMEND_ACCEPTED: Enmienda aceptada
('LC_IMPORT', 'AMEND_ACCEPTED', 'TASK', 'MANDATORY', 'Actualizar términos de LC', 'Actualizar los términos de LC #{operationReference} con las modificaciones aceptadas por la enmienda', 'HIGH', 'ROLE_OPERATOR', 1, '["enmienda","actualizacion"]', 'es', 1),
('LC_IMPORT', 'AMEND_ACCEPTED', 'CLIENT_CONTACT', 'RECOMMENDED', 'Notificar aceptación de enmienda', 'Informar a #{applicantName} que la enmienda de LC #{operationReference} fue aceptada', 'NORMAL', 'ROLE_OPERATOR', 1, '["cliente","enmienda","notificacion"]', 'es', 2),

-- AMEND_REJECTED: Enmienda rechazada
('LC_IMPORT', 'AMEND_REJECTED', 'CLIENT_CONTACT', 'MANDATORY', 'Notificar rechazo de enmienda', 'Informar a #{applicantName} que la enmienda de LC #{operationReference} fue rechazada por la contraparte', 'HIGH', 'ROLE_OPERATOR', 1, '["cliente","enmienda","rechazo"]', 'es', 1),
('LC_IMPORT', 'AMEND_REJECTED', 'FOLLOW_UP', 'RECOMMENDED', 'Evaluar alternativas post-rechazo', 'Analizar alternativas con #{applicantName} tras el rechazo de enmienda de LC #{operationReference}', 'NORMAL', 'ROLE_MANAGER', 2, '["enmienda","seguimiento"]', 'es', 2),

-- FREE_FORMAT_MESSAGE: Mensaje de texto libre
('LC_IMPORT', 'FREE_FORMAT_MESSAGE', 'FOLLOW_UP', 'RECOMMENDED', 'Seguimiento a mensaje SWIFT libre', 'Dar seguimiento a la respuesta del mensaje MT799/MT999 enviado para LC #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 3, '["swift","seguimiento"]', 'es', 1),

-- =============================================
-- LC_EXPORT Alert Templates (Spanish)
-- =============================================

-- ISSUE: Emitir LC
('LC_EXPORT', 'ISSUE', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a acuse MT730', 'Verificar recepción de acuse MT730 del banco avisador para LC #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 3, '["seguimiento","swift"]', 'es', 1),
('LC_EXPORT', 'ISSUE', 'TASK', 'MANDATORY', 'Verificar envío SWIFT MT700', 'Confirmar que el mensaje MT700 de emisión de LC #{operationReference} fue enviado y entregado correctamente', 'HIGH', 'ROLE_OPERATOR', 1, '["swift","verificacion"]', 'es', 2),
('LC_EXPORT', 'ISSUE', 'COMPLIANCE_CHECK', 'RECOMMENDED', 'Revisión de compliance pre-emisión', 'Verificar que la emisión de LC #{operationReference} por #{formattedAmount} #{currency} cumple con políticas de riesgo', 'NORMAL', 'ROLE_MANAGER', 1, '["compliance","emision"]', 'es', 3),

-- AMEND: Enmendar LC
('LC_EXPORT', 'AMEND', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a aceptación de enmienda', 'Verificar que el beneficiario acepte la enmienda MT707 de LC #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 3, '["seguimiento","enmienda"]', 'es', 1),

-- RECEIVE_DOCS: Recibir documentos
('LC_EXPORT', 'RECEIVE_DOCS', 'DEADLINE', 'MANDATORY', 'Iniciar examen documental', 'Comenzar el examen de documentos recibidos para LC #{operationReference} dentro de 5 días hábiles (UCP600)', 'URGENT', 'ROLE_OPERATOR', 5, '["documentacion","ucp600","urgente"]', 'es', 1),

-- EXAMINE_DOCS: Examinar documentos
('LC_EXPORT', 'EXAMINE_DOCS', 'DEADLINE', 'MANDATORY', 'Completar examen dentro del plazo', 'Finalizar el examen de documentos de LC #{operationReference} dentro del plazo bancario. Determinar conformidad o discrepancias.', 'URGENT', 'ROLE_OPERATOR', 3, '["documentacion","urgente"]', 'es', 1),
('LC_EXPORT', 'EXAMINE_DOCS', 'COMPLIANCE_CHECK', 'MANDATORY', 'Verificación de sanciones', 'Verificar que los documentos y partes involucradas en LC #{operationReference} no están en listas de sanciones', 'HIGH', 'ROLE_MANAGER', 2, '["compliance","sanciones"]', 'es', 2),

-- DISCREPANCY: Reportar discrepancia
('LC_EXPORT', 'DISCREPANCY', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a resolución de discrepancias', 'Dar seguimiento a la respuesta del presentador sobre discrepancias en LC #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 3, '["discrepancia","seguimiento"]', 'es', 1),

-- ACCEPT_DOCS: Aceptar documentos
('LC_EXPORT', 'ACCEPT_DOCS', 'TASK', 'MANDATORY', 'Procesar pago de LC', 'Iniciar el proceso de pago a #{beneficiaryName} por LC #{operationReference}. Monto: #{formattedAmount} #{currency}', 'HIGH', 'ROLE_OPERATOR', 1, '["pago","documentacion"]', 'es', 1),

-- PAYMENT: Efectuar pago
('LC_EXPORT', 'PAYMENT', 'TASK', 'MANDATORY', 'Confirmar transferencia de fondos', 'Verificar que el pago de #{formattedAmount} #{currency} de LC #{operationReference} fue transferido a #{beneficiaryName}', 'HIGH', 'ROLE_MANAGER', 1, '["pago","contabilidad"]', 'es', 1),
('LC_EXPORT', 'PAYMENT', 'CLIENT_CONTACT', 'RECOMMENDED', 'Notificar pago efectuado', 'Comunicar a #{applicantName} que se realizó el pago de LC #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 1, '["cliente","pago"]', 'es', 2),

-- CLOSE: Cerrar LC
('LC_EXPORT', 'CLOSE', 'TASK', 'RECOMMENDED', 'Archivar expediente', 'Archivar documentación completa de LC #{operationReference} y verificar que no hay saldos pendientes', 'LOW', 'ROLE_OPERATOR', 5, '["archivo","cierre"]', 'es', 1),

-- =============================================
-- GUARANTEE Alert Templates (Spanish)
-- =============================================

-- ISSUE: Emitir garantía
('GUARANTEE', 'ISSUE', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a acuse de garantía', 'Verificar recepción de acuse MT730 del beneficiario para garantía #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 5, '["seguimiento","swift"]', 'es', 1),
('GUARANTEE', 'ISSUE', 'REMINDER', 'RECOMMENDED', 'Programar monitoreo de vencimiento', 'Programar recordatorio de vencimiento de garantía #{operationReference}. Fecha: #{expiryDate}', 'NORMAL', 'ROLE_OPERATOR', 7, '["vencimiento","monitoreo"]', 'es', 2),
('GUARANTEE', 'ISSUE', 'COMPLIANCE_CHECK', 'RECOMMENDED', 'Verificación de exposición', 'Verificar que la emisión de garantía #{operationReference} por #{formattedAmount} #{currency} está dentro de los límites de exposición de #{applicantName}', 'NORMAL', 'ROLE_MANAGER', 2, '["compliance","exposicion"]', 'es', 3),

-- AMEND: Enmendar garantía
('GUARANTEE', 'AMEND', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a enmienda de garantía', 'Verificar aceptación de la enmienda de garantía #{operationReference} por el beneficiario', 'HIGH', 'ROLE_OPERATOR', 3, '["seguimiento","enmienda"]', 'es', 1),

-- EXTEND: Extender vigencia
('GUARANTEE', 'EXTEND', 'TASK', 'MANDATORY', 'Actualizar fecha de vencimiento', 'Actualizar la nueva fecha de vencimiento de garantía #{operationReference} y reprogramar alertas de monitoreo', 'HIGH', 'ROLE_OPERATOR', 1, '["vencimiento","actualizacion"]', 'es', 1),
('GUARANTEE', 'EXTEND', 'CLIENT_CONTACT', 'RECOMMENDED', 'Notificar extensión al solicitante', 'Informar a #{applicantName} sobre la extensión de vigencia de garantía #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 2, '["cliente","notificacion"]', 'es', 2),

-- CLAIM: Recibir reclamo
('GUARANTEE', 'CLAIM', 'TASK', 'MANDATORY', 'Evaluar validez del reclamo', 'Evaluar si el reclamo bajo garantía #{operationReference} cumple con los términos. Monto: #{formattedAmount} #{currency}', 'URGENT', 'ROLE_MANAGER', 1, '["reclamo","urgente","evaluacion"]', 'es', 1),
('GUARANTEE', 'CLAIM', 'CLIENT_CONTACT', 'MANDATORY', 'Notificar reclamo al solicitante', 'Comunicar URGENTEMENTE a #{applicantName} que se ha recibido un reclamo bajo garantía #{operationReference}', 'URGENT', 'ROLE_OPERATOR', 0, '["cliente","reclamo","urgente"]', 'es', 2),
('GUARANTEE', 'CLAIM', 'COMPLIANCE_CHECK', 'MANDATORY', 'Verificación de fraude en reclamo', 'Verificar que el reclamo bajo garantía #{operationReference} no presenta indicios de fraude', 'HIGH', 'ROLE_MANAGER', 1, '["compliance","fraude","reclamo"]', 'es', 3),

-- PAY_CLAIM: Pagar reclamo
('GUARANTEE', 'PAY_CLAIM', 'TASK', 'MANDATORY', 'Debitar cuenta del solicitante', 'Ejecutar débito a #{applicantName} por el pago de reclamo de garantía #{operationReference}. Monto: #{formattedAmount} #{currency}', 'URGENT', 'ROLE_MANAGER', 1, '["pago","contabilidad","reclamo"]', 'es', 1),
('GUARANTEE', 'PAY_CLAIM', 'CLIENT_CONTACT', 'MANDATORY', 'Confirmar débito al solicitante', 'Notificar a #{applicantName} el débito por pago de reclamo de garantía #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 1, '["cliente","pago"]', 'es', 2),

-- RELEASE: Liberar garantía
('GUARANTEE', 'RELEASE', 'TASK', 'RECOMMENDED', 'Archivar garantía liberada', 'Archivar documentación de garantía #{operationReference} liberada por el beneficiario', 'LOW', 'ROLE_OPERATOR', 5, '["archivo","cierre"]', 'es', 1),

-- EXPIRE: Marcar expirada
('GUARANTEE', 'EXPIRE', 'TASK', 'RECOMMENDED', 'Liberar provisión de fondos', 'Liberar la provisión de fondos asociada a garantía #{operationReference} tras su vencimiento', 'NORMAL', 'ROLE_MANAGER', 3, '["contabilidad","cierre"]', 'es', 1),
('GUARANTEE', 'EXPIRE', 'CLIENT_CONTACT', 'OPTIONAL', 'Notificar vencimiento al solicitante', 'Informar a #{applicantName} que la garantía #{operationReference} ha expirado sin reclamo', 'LOW', 'ROLE_OPERATOR', 2, '["cliente","notificacion"]', 'es', 2),

-- =============================================
-- COLLECTION Alert Templates (Spanish)
-- =============================================

-- SEND_COLLECTION: Enviar cobranza
('COLLECTION', 'SEND_COLLECTION', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a acuse de cobranza', 'Verificar recepción de acuse MT410 del banco cobrador para cobranza #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 5, '["seguimiento","swift"]', 'es', 1),
('COLLECTION', 'SEND_COLLECTION', 'TASK', 'RECOMMENDED', 'Verificar envío de documentos físicos', 'Confirmar que los documentos físicos de cobranza #{operationReference} fueron enviados por courier al banco cobrador', 'NORMAL', 'ROLE_OPERATOR', 1, '["documentacion","envio"]', 'es', 2),

-- PRESENT_DRAWEE: Presentar al girado
('COLLECTION', 'PRESENT_DRAWEE', 'FOLLOW_UP', 'MANDATORY', 'Seguimiento a respuesta del girado', 'Dar seguimiento a la respuesta de aceptación/pago del girado para cobranza #{operationReference}. Monto: #{formattedAmount} #{currency}', 'HIGH', 'ROLE_OPERATOR', 7, '["seguimiento","girado"]', 'es', 1),

-- ACCEPT: Aceptación del girado
('COLLECTION', 'ACCEPT', 'REMINDER', 'MANDATORY', 'Monitorear fecha de vencimiento', 'Programar seguimiento al vencimiento de la aceptación de cobranza #{operationReference}. Verificar pago al vencimiento.', 'HIGH', 'ROLE_OPERATOR', 5, '["vencimiento","monitoreo"]', 'es', 1),
('COLLECTION', 'ACCEPT', 'CLIENT_CONTACT', 'RECOMMENDED', 'Notificar aceptación al remitente', 'Informar a #{applicantName} que el girado aceptó la cobranza #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 1, '["cliente","notificacion"]', 'es', 2),

-- REFUSE: Rechazo del girado
('COLLECTION', 'REFUSE', 'CLIENT_CONTACT', 'MANDATORY', 'Notificar rechazo al remitente', 'Informar URGENTEMENTE a #{applicantName} que el girado rechazó la cobranza #{operationReference}. Solicitar instrucciones.', 'URGENT', 'ROLE_OPERATOR', 0, '["cliente","rechazo","urgente"]', 'es', 1),
('COLLECTION', 'REFUSE', 'FOLLOW_UP', 'MANDATORY', 'Solicitar instrucciones al remitente', 'Solicitar a #{applicantName} instrucciones sobre devolución de documentos o protesto de cobranza #{operationReference}', 'HIGH', 'ROLE_OPERATOR', 2, '["seguimiento","instrucciones"]', 'es', 2),

-- PAYMENT: Recibir pago
('COLLECTION', 'PAYMENT', 'TASK', 'MANDATORY', 'Transferir fondos al remitente', 'Transferir #{formattedAmount} #{currency} recibido por cobranza #{operationReference} a la cuenta de #{applicantName}', 'HIGH', 'ROLE_OPERATOR', 1, '["pago","transferencia"]', 'es', 1),
('COLLECTION', 'PAYMENT', 'CLIENT_CONTACT', 'RECOMMENDED', 'Notificar cobro al remitente', 'Comunicar a #{applicantName} la recepción del pago de cobranza #{operationReference}', 'NORMAL', 'ROLE_OPERATOR', 1, '["cliente","pago"]', 'es', 2),

-- RETURN_DOCS: Devolver documentos
('COLLECTION', 'RETURN_DOCS', 'TASK', 'MANDATORY', 'Verificar devolución de documentos', 'Confirmar que los documentos de cobranza #{operationReference} fueron devueltos al remitente', 'HIGH', 'ROLE_OPERATOR', 3, '["documentacion","devolucion"]', 'es', 1),

-- CLOSE: Cerrar cobranza
('COLLECTION', 'CLOSE', 'TASK', 'RECOMMENDED', 'Reconciliación final de cobranza', 'Realizar reconciliación final de comisiones y gastos de cobranza #{operationReference}', 'LOW', 'ROLE_MANAGER', 5, '["contabilidad","cierre"]', 'es', 1);
