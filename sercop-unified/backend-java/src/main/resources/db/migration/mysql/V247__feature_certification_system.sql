-- ============================================================================
-- V247__feature_certification_system.sql
-- Sistema de Certificación de Funcionalidades para QA
-- ============================================================================

-- Tabla principal de certificación de funcionalidades
CREATE TABLE IF NOT EXISTS feature_certification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feature_code VARCHAR(100) NOT NULL UNIQUE,      -- Código único del módulo/funcionalidad
    feature_name VARCHAR(200) NOT NULL,              -- Nombre legible
    feature_name_en VARCHAR(200),                    -- Nombre en inglés
    parent_code VARCHAR(100),                        -- Para jerarquía de módulos
    display_order INT DEFAULT 0,                     -- Orden de visualización

    -- Estado de certificación
    status ENUM('NOT_TESTED', 'IN_PROGRESS', 'CERTIFIED', 'FAILED', 'BLOCKED')
           DEFAULT 'NOT_TESTED',

    -- Tracking de testing
    tested_by VARCHAR(100),
    tested_at TIMESTAMP NULL,

    -- Tracking de certificación
    certified_by VARCHAR(100),
    certified_at TIMESTAMP NULL,

    -- Notas y evidencia
    notes TEXT,
    test_evidence_url VARCHAR(500),                  -- Link a documentación/screenshots
    blocker_reason VARCHAR(500),                     -- Razón si está bloqueado

    -- Vinculación opcional con alertas de plan de pruebas
    linked_alert_tag VARCHAR(100),                   -- Tag de alertas asociadas

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    INDEX idx_feature_cert_status (status),
    INDEX idx_feature_cert_parent (parent_code),
    INDEX idx_feature_cert_order (display_order)
);

-- ============================================================================
-- Datos iniciales - Funcionalidades a certificar basadas en la estructura del menú
-- ============================================================================

-- Módulo: OPERACIONES
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('OPERACIONES', 'Operaciones', 'Operations', NULL, 1, 'operaciones'),
('LC_IMPORT', 'Cartas de Crédito - Importación', 'Letters of Credit - Import', 'OPERACIONES', 1, 'carta-credito'),
('LC_EXPORT', 'Cartas de Crédito - Exportación', 'Letters of Credit - Export', 'OPERACIONES', 2, 'carta-credito'),
('GARANTIAS', 'Garantías Bancarias', 'Bank Guarantees', 'OPERACIONES', 3, 'garantias'),
('COBRANZAS', 'Cobranzas Documentarias', 'Documentary Collections', 'OPERACIONES', 4, 'cobranzas'),
('FINANCIAMIENTOS', 'Financiamientos', 'Financing', 'OPERACIONES', 5, 'financiamientos'),
('STANDBY', 'Standby Letters of Credit', 'Standby LC', 'OPERACIONES', 6, 'standby');

-- Módulo: CATÁLOGOS
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('CATALOGOS', 'Catálogos', 'Catalogs', NULL, 2, 'catalogos'),
('CAT_MONEDAS', 'Monedas y Cotizaciones', 'Currencies and Exchange Rates', 'CATALOGOS', 1, 'monedas'),
('CAT_PARTICIPANTES', 'Participantes/Clientes', 'Participants/Clients', 'CATALOGOS', 2, 'participantes'),
('CAT_INSTITUCIONES', 'Instituciones Financieras', 'Financial Institutions', 'CATALOGOS', 3, 'instituciones'),
('CAT_PLANTILLAS', 'Plantillas SWIFT', 'SWIFT Templates', 'CATALOGOS', 4, 'plantillas'),
('CAT_VARIABLES', 'Variables de Plantilla', 'Template Variables', 'CATALOGOS', 5, 'variables'),
('CAT_PERSONALIZADOS', 'Catálogos Personalizados', 'Custom Catalogs', 'CATALOGOS', 6, 'catalogos-personalizados');

-- Módulo: ADMINISTRACIÓN
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('ADMINISTRACION', 'Administración', 'Administration', NULL, 3, 'administracion'),
('ADMIN_USUARIOS', 'Gestión de Usuarios', 'User Management', 'ADMINISTRACION', 1, 'usuarios'),
('ADMIN_ROLES', 'Roles y Permisos', 'Roles and Permissions', 'ADMINISTRACION', 2, 'roles'),
('ADMIN_MENU', 'Configuración de Menú', 'Menu Configuration', 'ADMINISTRACION', 3, 'menu'),
('ADMIN_FLUJOS', 'Flujos de Trabajo', 'Workflows', 'ADMINISTRACION', 4, 'flujos'),
('ADMIN_REGLAS', 'Reglas de Eventos', 'Event Rules', 'ADMINISTRACION', 5, 'reglas'),
('ADMIN_JOBS', 'Jobs Programados', 'Scheduled Jobs', 'ADMINISTRACION', 6, 'jobs'),
('ADMIN_APIS', 'APIs Externas', 'External APIs', 'ADMINISTRACION', 7, 'apis');

-- Módulo: SEGURIDAD
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('SEGURIDAD', 'Seguridad', 'Security', NULL, 4, 'seguridad'),
('SEC_AUTENTICACION', 'Autenticación y Login', 'Authentication and Login', 'SEGURIDAD', 1, 'autenticacion'),
('SEC_4EYES', 'Control 4 Ojos', '4-Eyes Control', 'SEGURIDAD', 2, '4-eyes'),
('SEC_AUDITORIA', 'Auditoría y Logs', 'Audit and Logs', 'SEGURIDAD', 3, 'auditoria'),
('SEC_SESIONES', 'Control de Sesiones', 'Session Control', 'SEGURIDAD', 4, 'sesiones');

-- Módulo: NOTIFICACIONES
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('NOTIFICACIONES', 'Notificaciones', 'Notifications', NULL, 5, 'notificaciones'),
('NOTIF_EMAIL', 'Notificaciones por Email', 'Email Notifications', 'NOTIFICACIONES', 1, 'email'),
('NOTIF_REALTIME', 'Notificaciones en Tiempo Real', 'Real-time Notifications', 'NOTIFICACIONES', 2, 'realtime'),
('NOTIF_PLANTILLAS', 'Plantillas de Email', 'Email Templates', 'NOTIFICACIONES', 3, 'email-templates');

-- Módulo: ALERTAS Y AGENDA
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('ALERTAS', 'Alertas y Agenda', 'Alerts and Agenda', NULL, 6, 'alertas'),
('ALERT_AGENDA', 'Vista de Agenda', 'Agenda View', 'ALERTAS', 1, 'agenda'),
('ALERT_GANTT', 'Vista Gantt', 'Gantt View', 'ALERTAS', 2, 'gantt'),
('ALERT_CREAR', 'Crear y Gestionar Alertas', 'Create and Manage Alerts', 'ALERTAS', 3, 'alertas-crud'),
('ALERT_TAGS', 'Sistema de Tags', 'Tag System', 'ALERTAS', 4, 'tags');

-- Módulo: DOCUMENTOS
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('DOCUMENTOS', 'Gestión Documental', 'Document Management', NULL, 7, 'documentos'),
('DOC_UPLOAD', 'Carga de Documentos', 'Document Upload', 'DOCUMENTOS', 1, 'upload'),
('DOC_VIEWER', 'Visor de Documentos', 'Document Viewer', 'DOCUMENTOS', 2, 'viewer'),
('DOC_VERSIONES', 'Control de Versiones', 'Version Control', 'DOCUMENTOS', 3, 'versiones');

-- Módulo: IA Y ANALÍTICA
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('IA_ANALITICA', 'IA y Analítica', 'AI and Analytics', NULL, 8, 'ia'),
('IA_EXTRACCION', 'Extracción de Documentos', 'Document Extraction', 'IA_ANALITICA', 1, 'extraccion'),
('IA_SCREENING', 'Screening y Compliance', 'Screening and Compliance', 'IA_ANALITICA', 2, 'screening'),
('IA_REPORTES', 'Reportes de Uso', 'Usage Reports', 'IA_ANALITICA', 3, 'reportes-ia');

-- Módulo: PORTAL CLIENTE
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('PORTAL_CLIENTE', 'Portal de Cliente', 'Client Portal', NULL, 9, 'portal'),
('PORTAL_DASHBOARD', 'Dashboard Cliente', 'Client Dashboard', 'PORTAL_CLIENTE', 1, 'portal-dashboard'),
('PORTAL_OPERACIONES', 'Operaciones Cliente', 'Client Operations', 'PORTAL_CLIENTE', 2, 'portal-operaciones'),
('PORTAL_DOCS', 'Documentos Cliente', 'Client Documents', 'PORTAL_CLIENTE', 3, 'portal-documentos');

-- Módulo: TÉCNICAS (QA)
INSERT INTO feature_certification (feature_code, feature_name, feature_name_en, parent_code, display_order, linked_alert_tag) VALUES
('TECNICAS', 'Pruebas Técnicas', 'Technical Tests', NULL, 10, 'tecnicas'),
('TEC_STRESS', 'Pruebas de Stress', 'Stress Tests', 'TECNICAS', 1, 'stress'),
('TEC_SEGURIDAD', 'Pruebas de Seguridad', 'Security Tests', 'TECNICAS', 2, 'vulnerabilidades'),
('TEC_API', 'Pruebas de API', 'API Tests', 'TECNICAS', 3, 'api-testing'),
('TEC_BROWSER', 'Pruebas Cross-Browser', 'Cross-Browser Tests', 'TECNICAS', 4, 'cross-browser'),
('TEC_ACCESIBILIDAD', 'Accesibilidad', 'Accessibility', 'TECNICAS', 5, 'accesibilidad'),
('TEC_BACKUP', 'Backup y Recuperación', 'Backup and Recovery', 'TECNICAS', 6, 'backup');

-- ============================================================================
-- Agregar item de menú para la página de certificación (solo admin)
-- ============================================================================
INSERT INTO menu_item (code, label_key, icon, path, display_order, is_active, is_section, parent_id)
SELECT 'FEATURE_CERTIFICATION', 'menu.admin.featureCertification', 'FiCheckSquare', '/admin/feature-certification',
       (SELECT COALESCE(MAX(display_order), 0) + 1 FROM menu_item m2 WHERE m2.parent_id = m.id),
       TRUE, FALSE, m.id
FROM menu_item m
WHERE m.code = 'ADMIN'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Asignar permiso solo a ADMIN
INSERT INTO menu_item_permission (menu_item_id, permission_code)
SELECT mi.id, 'ROLE_ADMIN'
FROM menu_item mi
WHERE mi.code = 'FEATURE_CERTIFICATION'
ON DUPLICATE KEY UPDATE menu_item_id = menu_item_id;
