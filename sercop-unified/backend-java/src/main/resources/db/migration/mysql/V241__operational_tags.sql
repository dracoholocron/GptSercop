-- =====================================================
-- V241: Operational Tags for Production Use
-- =====================================================
-- Comprehensive tag system for real operations
-- Color coding by category:
--   Purple (#8B5CF6, #7C3AED, #6366F1) = Testing/QA
--   Blue (#3B82F6, #0EA5E9, #2563EB) = Operations/Products
--   Green (#10B981, #22C55E, #14B8A6) = Documents/Positive states
--   Orange (#F59E0B, #FB923C, #F97316) = Warnings/Pending
--   Red (#EF4444, #DC2626, #B91C1C) = Critical/Urgent
--   Pink (#EC4899, #F472B6, #DB2777) = Communication
--   Gray (#6B7280, #4B5563, #9CA3AF) = System/Archive

-- =====================================================
-- CATEGORY 1: PRODUCT/OPERATION TYPE (Blue tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('lc-importacion', 'LC Importación', 'LC Import', '#3B82F6', 'Carta de crédito de importación', 'Carta de crédito de importación', 'Letter of credit import operation', 'FiFileText', 100, 'system'),
('lc-exportacion', 'LC Exportación', 'LC Export', '#2563EB', 'Carta de crédito de exportación', 'Carta de crédito de exportación', 'Letter of credit export operation', 'FiSend', 101, 'system'),
('garantia', 'Garantía', 'Guarantee', '#1D4ED8', 'Garantía bancaria', 'Garantía bancaria', 'Bank guarantee operation', 'FiShield', 102, 'system'),
('cobranza', 'Cobranza', 'Collection', '#0EA5E9', 'Cobranza documentaria', 'Cobranza documentaria', 'Documentary collection', 'FiDollarSign', 103, 'system'),
('standby-lc', 'Standby LC', 'Standby LC', '#0284C7', 'Carta de crédito standby', 'Carta de crédito standby', 'Standby letter of credit', 'FiCreditCard', 104, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 2: OPERATION STAGE (Teal/Cyan tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('etapa-emitida', 'Etapa: Emitida', 'Stage: Issued', '#14B8A6', 'Operación en etapa emitida', 'Operación en etapa emitida', 'Operation in issued stage', 'FiCheck', 110, 'system'),
('etapa-avisada', 'Etapa: Avisada', 'Stage: Advised', '#0D9488', 'Operación en etapa avisada', 'Operación en etapa avisada', 'Operation in advised stage', 'FiBell', 111, 'system'),
('etapa-confirmada', 'Etapa: Confirmada', 'Stage: Confirmed', '#0F766E', 'Operación en etapa confirmada', 'Operación en etapa confirmada', 'Operation in confirmed stage', 'FiCheckCircle', 112, 'system'),
('etapa-modificada', 'Etapa: Modificada', 'Stage: Amended', '#115E59', 'Operación con modificaciones', 'Operación con modificaciones', 'Operation has amendments', 'FiEdit', 113, 'system'),
('etapa-utilizada', 'Etapa: Utilizada', 'Stage: Utilized', '#134E4A', 'Operación utilizada/pagada', 'Operación utilizada/pagada', 'Operation utilized/paid', 'FiTrendingUp', 114, 'system'),
('etapa-cerrada', 'Etapa: Cerrada', 'Stage: Closed', '#6B7280', 'Operación cerrada', 'Operación cerrada', 'Operation closed', 'FiArchive', 115, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 3: PRIORITY/URGENCY (Red/Orange tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('urgente', 'Urgente', 'Urgent', '#DC2626', 'Requiere atención inmediata', 'Requiere atención inmediata', 'Requires immediate attention', 'FiAlertTriangle', 120, 'system'),
('prioridad-alta', 'Prioridad Alta', 'High Priority', '#EF4444', 'Alta prioridad de procesamiento', 'Alta prioridad de procesamiento', 'High priority processing', 'FiArrowUp', 121, 'system'),
('prioridad-normal', 'Prioridad Normal', 'Normal Priority', '#F59E0B', 'Prioridad normal', 'Prioridad normal', 'Normal priority', 'FiMinus', 122, 'system'),
('vencimiento-proximo', 'Vencimiento Próximo', 'Expiry Soon', '#F97316', 'Vence en los próximos 7 días', 'Vence en los próximos 7 días', 'Expires within 7 days', 'FiClock', 123, 'system'),
('vencido', 'Vencido', 'Overdue', '#B91C1C', 'Fecha de vencimiento pasada', 'Fecha de vencimiento pasada', 'Past due date', 'FiAlertOctagon', 124, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 4: DOCUMENTS (Green tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('docs-completos', 'Docs Completos', 'Docs Complete', '#22C55E', 'Documentación completa', 'Documentación completa', 'All documents received', 'FiCheckSquare', 130, 'system'),
('docs-pendientes', 'Docs Pendientes', 'Docs Pending', '#F59E0B', 'Documentos pendientes de recibir', 'Documentos pendientes de recibir', 'Documents still pending', 'FiFileText', 131, 'system'),
('docs-discrepancia', 'Discrepancia', 'Discrepancy', '#EF4444', 'Discrepancias en documentos', 'Discrepancias en documentos', 'Document discrepancies found', 'FiAlertCircle', 132, 'system'),
('revision-docs', 'Revisión Docs', 'Doc Review', '#3B82F6', 'Requiere revisión de documentos', 'Requiere revisión de documentos', 'Requires document review', 'FiEye', 133, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 5: APPROVAL/WORKFLOW (Yellow/Amber tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('aprobacion-pendiente', 'Aprobación Pendiente', 'Pending Approval', '#FBBF24', 'Esperando aprobación', 'Esperando aprobación', 'Awaiting approval', 'FiClock', 140, 'system'),
('aprobado', 'Aprobado', 'Approved', '#22C55E', 'Aprobado correctamente', 'Aprobado correctamente', 'Successfully approved', 'FiThumbsUp', 141, 'system'),
('rechazado', 'Rechazado', 'Rejected', '#EF4444', 'Rechazado', 'Rechazado', 'Rejected', 'FiThumbsDown', 142, 'system'),
('requiere-correccion', 'Requiere Corrección', 'Needs Correction', '#F97316', 'Devuelto para corrección', 'Devuelto para corrección', 'Returned for correction', 'FiEdit3', 143, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 6: COMMUNICATION (Pink tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('esperando-respuesta', 'Esperando Respuesta', 'Awaiting Response', '#EC4899', 'Esperando respuesta de contraparte', 'Esperando respuesta de contraparte', 'Awaiting counterparty response', 'FiMessageCircle', 150, 'system'),
('seguimiento', 'Seguimiento', 'Follow-up', '#DB2777', 'Requiere seguimiento', 'Requiere seguimiento', 'Requires follow-up', 'FiRepeat', 151, 'system'),
('llamada-programada', 'Llamada Programada', 'Call Scheduled', '#F472B6', 'Llamada o videoconferencia programada', 'Llamada o videoconferencia programada', 'Call or video conference scheduled', 'FiVideo', 152, 'system'),
('escalado', 'Escalado', 'Escalated', '#BE185D', 'Asunto escalado a supervisor', 'Asunto escalado a supervisor', 'Issue escalated to supervisor', 'FiArrowUpCircle', 153, 'system'),
('email-enviado', 'Email Enviado', 'Email Sent', '#FBCFE8', 'Comunicación enviada por email', 'Comunicación enviada por email', 'Email communication sent', 'FiMail', 154, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 7: FINANCIAL (Emerald/Money tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('alto-valor', 'Alto Valor', 'High Value', '#059669', 'Operación de alto valor (>$1M)', 'Operación de alto valor (>$1M)', 'High value operation (>$1M)', 'FiDollarSign', 160, 'system'),
('pago-pendiente', 'Pago Pendiente', 'Payment Pending', '#F59E0B', 'Pago pendiente de procesar', 'Pago pendiente de procesar', 'Payment pending processing', 'FiCreditCard', 161, 'system'),
('pago-realizado', 'Pago Realizado', 'Payment Made', '#10B981', 'Pago procesado exitosamente', 'Pago procesado exitosamente', 'Payment processed successfully', 'FiCheckCircle', 162, 'system'),
('comision-aplicable', 'Comisión Aplicable', 'Fee Applicable', '#8B5CF6', 'Tiene comisiones aplicables', 'Tiene comisiones aplicables', 'Has applicable fees', 'FiPercent', 163, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 8: COMPLIANCE/RISK (Red/Purple tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('compliance', 'Compliance', 'Compliance', '#7C3AED', 'Relacionado con cumplimiento', 'Relacionado con cumplimiento', 'Compliance related', 'FiShield', 170, 'system'),
('riesgo-alto', 'Riesgo Alto', 'High Risk', '#DC2626', 'Operación de alto riesgo', 'Operación de alto riesgo', 'High risk operation', 'FiAlertTriangle', 171, 'system'),
('riesgo-medio', 'Riesgo Medio', 'Medium Risk', '#F97316', 'Operación de riesgo medio', 'Operación de riesgo medio', 'Medium risk operation', 'FiAlertCircle', 172, 'system'),
('verificacion-requerida', 'Verificación Requerida', 'Verification Required', '#A855F7', 'Requiere verificación adicional', 'Requiere verificación adicional', 'Requires additional verification', 'FiSearch', 173, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 9: SWIFT/MESSAGES (Indigo tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('swift-enviado', 'SWIFT Enviado', 'SWIFT Sent', '#4F46E5', 'Mensaje SWIFT enviado', 'Mensaje SWIFT enviado', 'SWIFT message sent', 'FiSend', 180, 'system'),
('swift-recibido', 'SWIFT Recibido', 'SWIFT Received', '#6366F1', 'Mensaje SWIFT recibido', 'Mensaje SWIFT recibido', 'SWIFT message received', 'FiInbox', 181, 'system'),
('swift-pendiente', 'SWIFT Pendiente', 'SWIFT Pending', '#818CF8', 'Mensaje SWIFT pendiente', 'Mensaje SWIFT pendiente', 'SWIFT message pending', 'FiClock', 182, 'system'),
('swift-error', 'SWIFT Error', 'SWIFT Error', '#EF4444', 'Error en mensaje SWIFT', 'Error en mensaje SWIFT', 'SWIFT message error', 'FiXCircle', 183, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 10: CLIENT/BACKOFFICE (Slate/Blue-gray tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('cliente-vip', 'Cliente VIP', 'VIP Client', '#0F172A', 'Cliente prioritario/VIP', 'Cliente prioritario/VIP', 'VIP/Priority client', 'FiStar', 190, 'system'),
('portal-cliente', 'Portal Cliente', 'Client Portal', '#334155', 'Solicitud desde portal de cliente', 'Solicitud desde portal de cliente', 'Request from client portal', 'FiGlobe', 191, 'system'),
('backoffice', 'Backoffice', 'Backoffice', '#475569', 'Tarea de backoffice', 'Tarea de backoffice', 'Backoffice task', 'FiSettings', 192, 'system'),
('atencion-cliente', 'Atención Cliente', 'Client Service', '#64748B', 'Relacionado con servicio al cliente', 'Relacionado con servicio al cliente', 'Client service related', 'FiUsers', 193, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 11: AMENDMENT SPECIFIC (Orange/Amber tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('modificacion-emitida', 'Modificación Emitida', 'Amendment Issued', '#D97706', 'Modificación emitida', 'Modificación emitida', 'Amendment issued', 'FiEdit', 200, 'system'),
('modificacion-pendiente', 'Modificación Pendiente', 'Amendment Pending', '#F59E0B', 'Modificación pendiente de confirmar', 'Modificación pendiente de confirmar', 'Amendment pending confirmation', 'FiClock', 201, 'system'),
('modificacion-aceptada', 'Modificación Aceptada', 'Amendment Accepted', '#22C55E', 'Modificación aceptada', 'Modificación aceptada', 'Amendment accepted', 'FiCheck', 202, 'system'),
('modificacion-rechazada', 'Modificación Rechazada', 'Amendment Rejected', '#EF4444', 'Modificación rechazada', 'Modificación rechazada', 'Amendment rejected', 'FiX', 203, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- CATEGORY 12: SYSTEM/AUTOMATION (Gray tones)
-- =====================================================
INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('automatico', 'Automático', 'Automatic', '#6B7280', 'Generado automáticamente', 'Generado automáticamente', 'Automatically generated', 'FiCpu', 210, 'system'),
('manual', 'Manual', 'Manual', '#9CA3AF', 'Ingresado manualmente', 'Ingresado manualmente', 'Manually entered', 'FiEdit2', 211, 'system'),
('programado', 'Programado', 'Scheduled', '#4B5563', 'Tarea programada', 'Tarea programada', 'Scheduled task', 'FiCalendar', 212, 'system'),
('archivado', 'Archivado', 'Archived', '#D1D5DB', 'Registro archivado', 'Registro archivado', 'Archived record', 'FiArchive', 213, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    color = VALUES(color),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- Update V240 test tags to use consistent purple tones
-- =====================================================
UPDATE alert_tags SET color = '#8B5CF6' WHERE name = 'plan-pruebas';
UPDATE alert_tags SET color = '#7C3AED' WHERE name IN ('modulo-productos', 'modulo-clientes', 'modulo-operaciones', 'modulo-backoffice', 'modulo-alertas', 'modulo-usuarios', 'modulo-dashboard');
UPDATE alert_tags SET color = '#6366F1' WHERE name IN ('integracion', 'rendimiento', 'seguridad', 'ux-ui', 'responsivo', 'flujo-completo', 'critico', 'regresion', 'notificaciones', 'tiempo-real', 'reportes', 'catalogo');

