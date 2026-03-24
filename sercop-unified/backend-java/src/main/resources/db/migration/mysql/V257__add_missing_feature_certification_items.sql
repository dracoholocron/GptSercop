-- ============================================================================
-- V257__add_missing_feature_certification_items.sql
-- Agrega funcionalidades faltantes al catálogo de certificación
-- para cubrir el 100% de las opciones del sistema
-- ============================================================================

-- ── Módulo: OPERACIONES — items faltantes ──────────────────────────────────

-- Workbox / Bandejas de trabajo
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('WORKBOX', 'Bandejas de Trabajo', 'Workbox', 'OPERACIONES', 7, 'workbox'),
('OPS_SOLICITUDES', 'Solicitudes de Clientes', 'Client Requests', 'OPERACIONES', 8, 'solicitudes'),
('OPS_ACTIVAS', 'Operaciones Activas', 'Active Operations', 'OPERACIONES', 9, 'operaciones-activas'),
('OPS_ESPERA', 'Operaciones en Espera de Respuesta', 'Awaiting Response', 'OPERACIONES', 10, 'operaciones-espera'),
('OPS_HISTORIAL', 'Historial de Eventos', 'Event History', 'OPERACIONES', 11, 'historial-eventos');

-- ── Módulo: CATÁLOGOS — items faltantes ────────────────────────────────────

INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('CAT_CUENTAS', 'Cuentas Bancarias', 'Bank Accounts', 'CATALOGOS', 7, 'cuentas-bancarias'),
('CAT_CORREO_PLANTILLAS', 'Plantillas de Correo', 'Email Templates', 'CATALOGOS', 8, 'plantillas-correo'),
('CAT_CORREO_PROVEEDORES', 'Proveedores de Correo', 'Email Providers', 'CATALOGOS', 9, 'correo-proveedores'),
('CAT_CORREO_COLA', 'Cola de Correos', 'Email Queue', 'CATALOGOS', 10, 'correo-cola'),
('CAT_CORREO_ACCIONES', 'Acciones de Correo', 'Email Actions', 'CATALOGOS', 11, 'correo-acciones'),
('CAT_COMISIONES', 'Comisiones', 'Commissions', 'CATALOGOS', 12, 'comisiones'),
('CAT_CONTABILIDAD', 'Reglas Contables', 'Accounting Rules', 'CATALOGOS', 13, 'contabilidad'),
('CAT_REFERENCIAS', 'Numeración de Referencia', 'Reference Number', 'CATALOGOS', 14, 'referencias'),
('CAT_SWIFT_CAMPOS', 'Campos SWIFT', 'SWIFT Fields', 'CATALOGOS', 15, 'swift-campos'),
('CAT_CAMPOS_CUSTOM', 'Campos Personalizados', 'Custom Fields', 'CATALOGOS', 16, 'campos-custom'),
('CAT_TIPOS_EVENTO', 'Tipos de Evento', 'Event Types', 'CATALOGOS', 17, 'tipos-evento'),
('CAT_FLUJOS_EVENTO', 'Flujos de Evento', 'Event Flows', 'CATALOGOS', 18, 'flujos-evento'),
('CAT_SWIFT_RESPUESTAS', 'Respuestas SWIFT', 'SWIFT Responses', 'CATALOGOS', 19, 'swift-respuestas'),
('CAT_TIPOS_PRODUCTO', 'Tipos de Producto', 'Product Types', 'CATALOGOS', 20, 'tipos-producto'),
('CAT_PLANTILLAS_MARCA', 'Plantillas de Marca', 'Brand Templates', 'CATALOGOS', 21, 'plantillas-marca'),
('CAT_TIPOS_ACCION', 'Tipos de Acción', 'Action Types', 'CATALOGOS', 22, 'tipos-accion');

-- ── Módulo: ADMINISTRACIÓN — items faltantes ───────────────────────────────

INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('ADMIN_SEGURIDAD_CONFIG', 'Configuración de Seguridad', 'Security Configuration', 'ADMINISTRACION', 8, 'seguridad-config'),
('ADMIN_AUDITORIA_SEG', 'Auditoría de Seguridad', 'Security Audit', 'ADMINISTRACION', 9, 'auditoria-seguridad'),
('ADMIN_AUDITORIA_API', 'Auditoría de APIs Externas', 'External API Audit', 'ADMINISTRACION', 10, 'auditoria-api'),
('ADMIN_HORARIOS', 'Horarios de Operación', 'Schedules', 'ADMINISTRACION', 11, 'horarios'),
('ADMIN_EXCEPCIONES', 'Excepciones de Horario', 'Schedule Exemptions', 'ADMINISTRACION', 12, 'excepciones-horario'),
('ADMIN_IA_PROMPTS', 'Configuración de Prompts IA', 'AI Prompt Configuration', 'ADMINISTRACION', 13, 'ia-prompts'),
('ADMIN_IA_USO', 'Reportes de Uso de IA', 'AI Usage Reports', 'ADMINISTRACION', 14, 'ia-uso'),
('ADMIN_CERTIFICACION', 'Certificación de Funcionalidades', 'Feature Certification', 'ADMINISTRACION', 15, 'certificacion');

-- ── Módulo: SEGURIDAD — items faltantes ────────────────────────────────────

INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('SEC_MFA', 'Autenticación Multi-Factor (MFA)', 'Multi-Factor Authentication', 'SEGURIDAD', 5, 'mfa'),
('SEC_OAUTH', 'OAuth2 / SSO', 'OAuth2 / SSO', 'SEGURIDAD', 6, 'oauth');

-- ── Módulo: INTELIGENCIA DE NEGOCIO (nuevo módulo) ─────────────────────────

INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('BUSINESS_INTELLIGENCE', 'Inteligencia de Negocio', 'Business Intelligence', NULL, 11, 'bi'),
('BI_DASHBOARD', 'Dashboard de BI', 'BI Dashboard', 'BUSINESS_INTELLIGENCE', 1, 'bi-dashboard'),
('BI_COMISIONES', 'Análisis de Comisiones', 'Commission Analysis', 'BUSINESS_INTELLIGENCE', 2, 'bi-comisiones'),
('BI_REPORTES', 'Generador de Reportes', 'Report Generator', 'BUSINESS_INTELLIGENCE', 3, 'reportes'),
('BI_REGULATORIO', 'Reportes Regulatorios', 'Regulatory Reporting', 'BUSINESS_INTELLIGENCE', 4, 'regulatorio');

-- ── Módulo: COMUNICACIONES (nuevo módulo) ──────────────────────────────────

INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('COMUNICACIONES', 'Comunicaciones', 'Communications', NULL, 12, 'comunicaciones'),
('COM_SWIFT', 'Centro de Mensajes SWIFT', 'SWIFT Message Center', 'COMUNICACIONES', 1, 'swift-center'),
('COM_VIDEO', 'Videoconferencia', 'Video Conference', 'COMUNICACIONES', 2, 'video'),
('COM_CHAT_IA', 'Chat Asistente IA', 'AI Chat Assistant', 'COMUNICACIONES', 3, 'chat-ia');

-- ── Módulo: PORTAL CLIENTE — items faltantes ───────────────────────────────

INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('PORTAL_SOLICITUDES', 'Solicitudes del Cliente', 'Client Requests', 'PORTAL_CLIENTE', 4, 'portal-solicitudes'),
('PORTAL_REPORTES', 'Reportes del Cliente', 'Client Reports', 'PORTAL_CLIENTE', 5, 'portal-reportes'),
('PORTAL_PERFIL', 'Perfil del Cliente', 'Client Profile', 'PORTAL_CLIENTE', 6, 'portal-perfil');
