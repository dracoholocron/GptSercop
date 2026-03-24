-- =====================================================
-- V240: Add Test Plan Tags
-- =====================================================
-- Additional tags for comprehensive test plan tracking

INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
-- Test Plan Category Tags
('plan-pruebas', 'Plan de Pruebas', 'Test Plan', '#6366F1', 'Parte del plan de pruebas general', 'Parte del plan de pruebas general', 'Part of general test plan', 'FiClipboard', 20, 'system'),
('modulo-productos', 'Módulo Productos', 'Products Module', '#F59E0B', 'Pruebas del módulo de productos', 'Pruebas del módulo de productos', 'Products module testing', 'FiPackage', 21, 'system'),
('modulo-clientes', 'Módulo Clientes', 'Clients Module', '#10B981', 'Pruebas del módulo de clientes', 'Pruebas del módulo de clientes', 'Clients module testing', 'FiUsers', 22, 'system'),
('modulo-operaciones', 'Módulo Operaciones', 'Operations Module', '#3B82F6', 'Pruebas del módulo de operaciones', 'Pruebas del módulo de operaciones', 'Operations module testing', 'FiActivity', 23, 'system'),
('modulo-backoffice', 'Módulo Backoffice', 'Backoffice Module', '#8B5CF6', 'Pruebas del módulo backoffice', 'Pruebas del módulo backoffice', 'Backoffice module testing', 'FiSettings', 24, 'system'),
('modulo-alertas', 'Módulo Alertas', 'Alerts Module', '#EF4444', 'Pruebas del módulo de alertas', 'Pruebas del módulo de alertas', 'Alerts module testing', 'FiBell', 25, 'system'),
('modulo-usuarios', 'Módulo Usuarios', 'Users Module', '#EC4899', 'Pruebas del módulo de usuarios', 'Pruebas del módulo de usuarios', 'Users module testing', 'FiUserCheck', 26, 'system'),
('modulo-dashboard', 'Módulo Dashboard', 'Dashboard Module', '#14B8A6', 'Pruebas del dashboard principal', 'Pruebas del dashboard principal', 'Main dashboard testing', 'FiGrid', 27, 'system'),
('integracion', 'Integración', 'Integration', '#F97316', 'Pruebas de integración entre módulos', 'Pruebas de integración entre módulos', 'Integration testing between modules', 'FiLink', 28, 'system'),
('rendimiento', 'Rendimiento', 'Performance', '#84CC16', 'Pruebas de rendimiento y carga', 'Pruebas de rendimiento y carga', 'Performance and load testing', 'FiZap', 29, 'system'),
('seguridad', 'Seguridad', 'Security', '#DC2626', 'Pruebas de seguridad y permisos', 'Pruebas de seguridad y permisos', 'Security and permissions testing', 'FiShield', 30, 'system'),
('ux-ui', 'UX/UI', 'UX/UI', '#A855F7', 'Pruebas de experiencia de usuario', 'Pruebas de experiencia de usuario', 'User experience testing', 'FiLayout', 31, 'system'),
('responsivo', 'Responsivo', 'Responsive', '#0EA5E9', 'Pruebas de diseño responsivo', 'Pruebas de diseño responsivo', 'Responsive design testing', 'FiSmartphone', 32, 'system'),
('flujo-completo', 'Flujo Completo', 'Full Flow', '#7C3AED', 'Pruebas de flujo completo end-to-end', 'Pruebas de flujo completo end-to-end', 'End-to-end full flow testing', 'FiRefreshCw', 33, 'system'),
('critico', 'Crítico', 'Critical', '#B91C1C', 'Funcionalidad crítica del sistema', 'Funcionalidad crítica del sistema', 'Critical system functionality', 'FiAlertOctagon', 34, 'system'),
('regresion', 'Regresión', 'Regression', '#4B5563', 'Pruebas de regresión', 'Pruebas de regresión', 'Regression testing', 'FiRotateCcw', 35, 'system'),
('notificaciones', 'Notificaciones', 'Notifications', '#F472B6', 'Pruebas de notificaciones', 'Pruebas de notificaciones', 'Notifications testing', 'FiBell', 36, 'system'),
('tiempo-real', 'Tiempo Real', 'Real-time', '#22D3EE', 'Pruebas de funcionalidad en tiempo real', 'Pruebas de funcionalidad en tiempo real', 'Real-time functionality testing', 'FiClock', 37, 'system'),
('reportes', 'Reportes', 'Reports', '#FB923C', 'Pruebas de generación de reportes', 'Pruebas de generación de reportes', 'Report generation testing', 'FiFileText', 38, 'system'),
('catalogo', 'Catálogo', 'Catalog', '#2DD4BF', 'Pruebas del catálogo de productos', 'Pruebas del catálogo de productos', 'Product catalog testing', 'FiBook', 39, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);
