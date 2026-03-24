-- =====================================================
-- V245: QA Technical Test Plan
-- =====================================================
-- Comprehensive QA tests including:
-- - Stress/Load Testing
-- - Security/Vulnerability Testing
-- - Accessibility Testing
-- - Cross-browser Testing
-- - API Testing
-- - Database Testing
-- - Backup & Recovery Testing
-- - Usability Testing

SET @now = NOW();
SET @today = CURDATE();

-- =====================================================
-- NEW TAGS FOR QA TECHNICAL TESTS
-- =====================================================

INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('tecnicas', 'Pruebas Técnicas', 'Technical Tests', '#991B1B', 'Pruebas técnicas de QA', 'Pruebas técnicas de QA', 'QA Technical tests', 'FiTool', 50, 'system'),
('stress', 'Stress/Carga', 'Stress/Load', '#DC2626', 'Pruebas de stress y carga', 'Pruebas de stress y carga', 'Stress and load testing', 'FiActivity', 51, 'system'),
('vulnerabilidades', 'Vulnerabilidades', 'Vulnerabilities', '#7F1D1D', 'Pruebas de seguridad y vulnerabilidades', 'Pruebas de seguridad y vulnerabilidades', 'Security vulnerability testing', 'FiShield', 52, 'system'),
('accesibilidad', 'Accesibilidad', 'Accessibility', '#4338CA', 'Pruebas de accesibilidad WCAG', 'Pruebas de accesibilidad WCAG', 'WCAG accessibility testing', 'FiEye', 53, 'system'),
('cross-browser', 'Cross-Browser', 'Cross-Browser', '#0369A1', 'Pruebas en múltiples navegadores', 'Pruebas en múltiples navegadores', 'Cross-browser testing', 'FiGlobe', 54, 'system'),
('api-testing', 'Pruebas API', 'API Testing', '#065F46', 'Pruebas de endpoints API', 'Pruebas de endpoints API', 'API endpoint testing', 'FiServer', 55, 'system'),
('database', 'Base de Datos', 'Database', '#92400E', 'Pruebas de base de datos', 'Pruebas de base de datos', 'Database testing', 'FiDatabase', 56, 'system'),
('backup-recovery', 'Backup/Recovery', 'Backup/Recovery', '#6B21A8', 'Pruebas de respaldo y recuperación', 'Pruebas de respaldo y recuperación', 'Backup and recovery testing', 'FiSave', 57, 'system'),
('usabilidad', 'Usabilidad', 'Usability', '#DB2777', 'Pruebas de usabilidad UX', 'Pruebas de usabilidad UX', 'UX usability testing', 'FiSmile', 58, 'system'),
('compatibilidad', 'Compatibilidad', 'Compatibility', '#0891B2', 'Pruebas de compatibilidad', 'Pruebas de compatibilidad', 'Compatibility testing', 'FiLayers', 59, 'system'),
('localizacion', 'Localización', 'Localization', '#059669', 'Pruebas de idiomas y formatos', 'Pruebas de idiomas y formatos', 'Language and format testing', 'FiFlag', 60, 'system'),
('smoke-test', 'Smoke Test', 'Smoke Test', '#EA580C', 'Pruebas de humo básicas', 'Pruebas de humo básicas', 'Basic smoke testing', 'FiCheck', 61, 'system'),
('edge-cases', 'Casos Borde', 'Edge Cases', '#7C2D12', 'Pruebas de casos límite', 'Pruebas de casos límite', 'Edge case testing', 'FiAlertTriangle', 62, 'system'),
('error-handling', 'Manejo Errores', 'Error Handling', '#B91C1C', 'Pruebas de manejo de errores', 'Pruebas de manejo de errores', 'Error handling testing', 'FiXCircle', 63, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- STRESS / LOAD TESTING (Days 26-27)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Stress - Carga de usuarios concurrentes',
 'OBJETIVO: Verificar comportamiento con múltiples usuarios simultáneos\n\nHERRAMIENTAS SUGERIDAS:\n- JMeter, k6, Artillery, o Locust\n- DevTools Performance\n\nESCENARIOS:\n\n1. CARGA NORMAL (Baseline):\n   - 10 usuarios concurrentes\n   - Operaciones típicas: login, navegación, búsqueda\n   - Duración: 5 minutos\n   - Medir: tiempo respuesta promedio, percentil 95\n\n2. CARGA MEDIA:\n   - 50 usuarios concurrentes\n   - Mix de operaciones: 40% lectura, 40% navegación, 20% escritura\n   - Duración: 10 minutos\n   - Verificar: no hay errores 5xx, tiempos <3s\n\n3. CARGA ALTA:\n   - 100 usuarios concurrentes\n   - Picos de actividad simultánea\n   - Duración: 15 minutos\n   - Verificar: degradación graceful, no crashes\n\n4. STRESS TEST:\n   - Incrementar hasta encontrar punto de quiebre\n   - Documentar límites del sistema\n   - Verificar recuperación después del stress\n\nMÉTRICAS A CAPTURAR:\n- Tiempo de respuesta (avg, p50, p95, p99)\n- Throughput (requests/segundo)\n- Tasa de errores\n- Uso de CPU/memoria del servidor\n- Conexiones de base de datos\n\nCRITERIOS DE ACEPTACIÓN:\n- 50 usuarios: <2s tiempo respuesta\n- 100 usuarios: <5s tiempo respuesta\n- 0% errores bajo carga normal\n- <1% errores bajo carga alta',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 26 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "stress", "critico"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Stress - Operaciones de alto volumen',
 'OBJETIVO: Probar rendimiento con grandes volúmenes de datos\n\nESCENARIOS:\n\n1. LISTADOS GRANDES:\n   - Cargar lista de 1,000 operaciones\n   - Cargar lista de 5,000 alertas\n   - Verificar paginación funciona\n   - Medir tiempo de renderizado\n\n2. BÚSQUEDAS INTENSIVAS:\n   - Búsqueda con muchos resultados (>500)\n   - Búsqueda con filtros complejos\n   - Búsqueda con texto largo\n   - Medir tiempo de respuesta\n\n3. CREACIÓN MASIVA:\n   - Crear 100 alertas en lote\n   - Crear 50 operaciones seguidas\n   - Verificar integridad de datos\n   - Medir tiempo total\n\n4. REPORTES GRANDES:\n   - Generar reporte de 1 año de datos\n   - Exportar >10,000 registros a Excel\n   - Generar PDF con muchas páginas\n\nMÉTRICAS:\n- Tiempo de carga de listas\n- Memoria del navegador\n- Tiempo de exportación\n- Tamaño de archivos generados\n\nCRITERIOS DE ACEPTACIÓN:\n- Listas de 1,000 items: <3s\n- Exportación 10,000 registros: <30s\n- Sin errores de memoria en navegador\n- UI responsiva durante operaciones',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 26 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "stress", "rendimiento"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Stress - WebSocket y tiempo real',
 'OBJETIVO: Verificar estabilidad de conexiones en tiempo real\n\nESCENARIOS:\n\n1. CONEXIONES PROLONGADAS:\n   - Mantener sesión activa por 4+ horas\n   - Verificar reconexión automática\n   - Verificar no hay memory leaks\n   - Monitorear uso de recursos\n\n2. RECONEXIÓN:\n   - Simular pérdida de conexión de red\n   - Verificar reconexión automática\n   - Verificar que no se pierden notificaciones\n   - Tiempo máximo de reconexión: 10s\n\n3. MÚLTIPLES CONEXIONES:\n   - 50 usuarios conectados simultáneamente\n   - Enviar notificaciones a todos\n   - Verificar entrega a todos los usuarios\n   - Medir latencia de entrega\n\n4. ALTA FRECUENCIA:\n   - Enviar 100 notificaciones/minuto\n   - Verificar que todas llegan\n   - Verificar orden de llegada\n   - Sin duplicados\n\nMÉTRICAS:\n- Latencia de notificaciones\n- Tasa de entrega exitosa\n- Tiempo de reconexión\n- Memoria del cliente\n\nCRITERIOS DE ACEPTACIÓN:\n- Reconexión en <10 segundos\n- 100% entrega de notificaciones\n- Latencia <1 segundo\n- Sin memory leaks en 4 horas',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 27 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "stress", "tiempo-real"]');

-- =====================================================
-- SECURITY / VULNERABILITY TESTING (Days 27-28)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Seguridad - OWASP Top 10 Vulnerabilidades',
 'OBJETIVO: Verificar protección contra vulnerabilidades OWASP Top 10\n\nPRUEBAS POR CATEGORÍA:\n\n1. A01: BROKEN ACCESS CONTROL\n   - Intentar acceder a recursos de otro usuario\n   - Modificar ID en URLs para acceder a datos ajenos\n   - Verificar que API valida permisos\n   - Intentar escalación de privilegios\n\n2. A02: CRYPTOGRAPHIC FAILURES\n   - Verificar HTTPS en todo el sitio\n   - Verificar que contraseñas están hasheadas\n   - Verificar tokens JWT firmados correctamente\n   - No hay datos sensibles en logs\n\n3. A03: INJECTION\n   - SQL Injection en campos de búsqueda\n   - SQL Injection en parámetros de URL\n   - NoSQL Injection si aplica\n   - Command Injection en uploads\n\n4. A07: XSS (Cross-Site Scripting)\n   - Inyectar <script>alert(1)</script> en todos los campos\n   - Probar en títulos, descripciones, comentarios\n   - Verificar sanitización de HTML\n   - Probar stored XSS y reflected XSS\n\n5. A08: INSECURE DESERIALIZATION\n   - Verificar que no hay deserialización insegura\n   - Verificar validación de JSON/XML\n\nHERRAMIENTAS:\n- OWASP ZAP\n- Burp Suite\n- Manual testing\n\nCRITERIOS DE ACEPTACIÓN:\n- 0 vulnerabilidades críticas\n- 0 vulnerabilidades altas\n- Documentar cualquier hallazgo',
 'TASK', 'URGENT', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 27 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "vulnerabilidades", "critico"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Seguridad - Autenticación y Sesiones',
 'OBJETIVO: Verificar seguridad de autenticación\n\nPRUEBAS:\n\n1. CONTRASEÑAS:\n   - Intentar contraseñas débiles (rechazadas)\n   - Verificar hash seguro (bcrypt/argon2)\n   - Verificar que no se muestran en logs\n   - Verificar reset de contraseña seguro\n\n2. BRUTE FORCE:\n   - Intentar 10+ logins fallidos\n   - Verificar bloqueo de cuenta\n   - Verificar rate limiting\n   - Verificar CAPTCHA si existe\n\n3. SESIONES:\n   - Verificar que sesión expira\n   - Verificar logout invalida token\n   - Verificar token no reutilizable\n   - Verificar secure y httpOnly en cookies\n\n4. JWT TOKENS:\n   - Verificar firma del token\n   - Intentar modificar payload\n   - Verificar expiración\n   - Verificar refresh token funciona\n\n5. MFA:\n   - Verificar que MFA no se puede bypassear\n   - Verificar códigos de un solo uso\n   - Verificar límite de intentos\n\nHERRAMIENTAS:\n- Burp Suite\n- jwt.io\n- Scripts personalizados\n\nCRITERIOS DE ACEPTACIÓN:\n- Bloqueo después de 5 intentos\n- Tokens expiran correctamente\n- MFA no bypasseable\n- Sin tokens en URLs',
 'TASK', 'URGENT', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 28 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "vulnerabilidades", "seguridad", "critico"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Seguridad - Headers y Configuración',
 'OBJETIVO: Verificar headers de seguridad y configuración\n\nHEADERS A VERIFICAR:\n\n1. HEADERS DE SEGURIDAD:\n   - Strict-Transport-Security (HSTS)\n   - X-Content-Type-Options: nosniff\n   - X-Frame-Options: DENY o SAMEORIGIN\n   - Content-Security-Policy (CSP)\n   - X-XSS-Protection: 1; mode=block\n   - Referrer-Policy\n\n2. CORS:\n   - Verificar orígenes permitidos\n   - No usar Access-Control-Allow-Origin: *\n   - Verificar métodos permitidos\n   - Verificar headers permitidos\n\n3. COOKIES:\n   - Secure flag en producción\n   - HttpOnly flag\n   - SameSite attribute\n   - Prefijo __Host- o __Secure-\n\n4. INFORMACIÓN EXPUESTA:\n   - No exponer versiones de software\n   - No exponer stack traces\n   - No exponer rutas internas\n   - Remover headers de servidor (X-Powered-By)\n\n5. SSL/TLS:\n   - TLS 1.2 mínimo\n   - Certificado válido\n   - Sin mixed content\n   - HSTS habilitado\n\nHERRAMIENTAS:\n- securityheaders.com\n- SSL Labs\n- DevTools > Network\n\nCRITERIOS DE ACEPTACIÓN:\n- Score A en securityheaders.com\n- Score A+ en SSL Labs\n- Todos los headers críticos presentes',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 28 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "vulnerabilidades", "seguridad"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Seguridad - Uploads y Archivos',
 'OBJETIVO: Verificar seguridad en manejo de archivos\n\nPRUEBAS:\n\n1. VALIDACIÓN DE TIPO:\n   - Intentar subir .exe renombrado a .pdf\n   - Intentar subir .php, .jsp, .aspx\n   - Verificar validación por magic bytes\n   - Verificar extensiones permitidas\n\n2. TAMAÑO:\n   - Intentar subir archivo muy grande (100MB+)\n   - Verificar límite configurado\n   - Verificar mensaje de error claro\n\n3. NOMBRES MALICIOSOS:\n   - Nombre con ../../../etc/passwd\n   - Nombre con caracteres especiales\n   - Nombre muy largo (>255 chars)\n   - Nombre con null bytes\n\n4. CONTENIDO MALICIOSO:\n   - PDF con JavaScript\n   - Imagen con código embebido\n   - ZIP bomb\n   - XML con XXE\n\n5. ALMACENAMIENTO:\n   - Archivos fuera de webroot\n   - URLs no predecibles\n   - Verificar permisos de acceso\n   - Escaneo antivirus si existe\n\nCRITERIOS DE ACEPTACIÓN:\n- Solo tipos permitidos\n- Límite de tamaño respetado\n- Nombres sanitizados\n- Archivos escaneados',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 28 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "vulnerabilidades"]');

-- =====================================================
-- API TESTING (Day 29)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: API - Validación de Endpoints',
 'OBJETIVO: Verificar correctitud de todos los endpoints API\n\nCATEGORÍAS DE PRUEBAS:\n\n1. MÉTODOS HTTP:\n   - GET: obtiene datos correctos\n   - POST: crea recursos correctamente\n   - PUT/PATCH: actualiza correctamente\n   - DELETE: elimina correctamente\n   - Métodos no permitidos retornan 405\n\n2. CÓDIGOS DE RESPUESTA:\n   - 200 OK: operación exitosa\n   - 201 Created: recurso creado\n   - 400 Bad Request: datos inválidos\n   - 401 Unauthorized: sin autenticación\n   - 403 Forbidden: sin permiso\n   - 404 Not Found: recurso no existe\n   - 500 Internal Error: error de servidor\n\n3. VALIDACIÓN DE ENTRADA:\n   - Campos requeridos\n   - Tipos de datos correctos\n   - Longitudes máximas\n   - Formatos (email, fecha, etc.)\n   - Valores permitidos (enums)\n\n4. RESPUESTAS:\n   - Formato JSON consistente\n   - Campos esperados presentes\n   - Tipos de datos correctos\n   - Paginación funciona\n   - Ordenamiento funciona\n\nENDPOINTS CRÍTICOS:\n- /api/auth/* (autenticación)\n- /api/alerts/* (alertas)\n- /api/operations/* (operaciones)\n- /api/users/* (usuarios)\n\nHERRAMIENTAS:\n- Postman / Insomnia\n- curl\n- Scripts automatizados\n\nCRITERIOS DE ACEPTACIÓN:\n- Todos los endpoints documentados\n- Respuestas consistentes\n- Errores con mensajes claros',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 29 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "api-testing", "critico"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: API - Casos límite y errores',
 'OBJETIVO: Probar comportamiento en casos extremos\n\nCASOS A PROBAR:\n\n1. DATOS VACÍOS:\n   - POST con body vacío {}\n   - POST con campos null\n   - POST con strings vacíos ""\n   - Arrays vacíos []\n\n2. DATOS EXTREMOS:\n   - Strings muy largos (10,000+ chars)\n   - Números muy grandes\n   - Números negativos donde no aplica\n   - Fechas inválidas\n   - Fechas muy antiguas/futuras\n\n3. CARACTERES ESPECIALES:\n   - Unicode y emojis\n   - Caracteres de control\n   - HTML y JavaScript\n   - SQL y comandos\n\n4. IDs INVÁLIDOS:\n   - ID que no existe\n   - ID con formato inválido\n   - ID de otro usuario\n   - ID numérico vs UUID\n\n5. CONCURRENCIA:\n   - Actualizar mismo recurso simultáneamente\n   - Crear duplicados\n   - Race conditions\n\n6. ESTADO INVÁLIDO:\n   - Transiciones de estado no permitidas\n   - Operaciones en recursos eliminados\n   - Operaciones en recursos bloqueados\n\nCRITERIOS DE ACEPTACIÓN:\n- Errores 4xx con mensajes claros\n- Sin errores 500 por datos inválidos\n- Sin crashes del servidor\n- Datos no se corrompen',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 29 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "api-testing", "edge-cases"]');

-- =====================================================
-- CROSS-BROWSER & COMPATIBILITY TESTING (Day 30)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Cross-Browser - Navegadores principales',
 'OBJETIVO: Verificar compatibilidad en navegadores principales\n\nNAVEGADORES A PROBAR:\n\n1. CHROME (última versión):\n   - Windows 10/11\n   - macOS\n   - Linux\n   - Funcionalidad completa\n   - DevTools sin errores\n\n2. FIREFOX (última versión):\n   - Windows\n   - macOS\n   - Verificar misma funcionalidad que Chrome\n\n3. SAFARI (última versión):\n   - macOS\n   - iOS (iPad, iPhone)\n   - Verificar WebSocket funciona\n   - Verificar date pickers\n\n4. EDGE (última versión):\n   - Windows 10/11\n   - Basado en Chromium\n   - Verificar sin diferencias con Chrome\n\nÁREAS A VERIFICAR:\n- Login y autenticación\n- Navegación y menús\n- Formularios y validaciones\n- Date/time pickers\n- Modales y popups\n- Notificaciones\n- Uploads de archivos\n- Exports (PDF, Excel)\n- Drag and drop\n- Gráficos y charts\n\nCRITERIOS DE ACEPTACIÓN:\n- Funcionalidad idéntica en todos\n- UI consistente\n- Sin errores de JavaScript\n- Performance similar',
 'TASK', 'NORMAL', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 30 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "cross-browser", "compatibilidad"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Responsive - Dispositivos móviles',
 'OBJETIVO: Verificar funcionamiento en dispositivos móviles\n\nDISPOSITIVOS/RESOLUCIONES:\n\n1. MÓVILES:\n   - iPhone SE (375x667)\n   - iPhone 12/13 (390x844)\n   - Samsung Galaxy (360x800)\n   - Pixel (393x873)\n\n2. TABLETS:\n   - iPad (768x1024)\n   - iPad Pro (1024x1366)\n   - Android Tablet (800x1280)\n\n3. DESKTOP:\n   - 1366x768 (laptop común)\n   - 1920x1080 (Full HD)\n   - 2560x1440 (QHD)\n   - 3840x2160 (4K)\n\nÁREAS A VERIFICAR:\n- Menú colapsa correctamente\n- Formularios usables en móvil\n- Tablas con scroll horizontal\n- Botones suficientemente grandes\n- Texto legible sin zoom\n- Modales no se cortan\n- Drag and drop funciona (o alternativa)\n\nGESTOS TÁCTILES:\n- Scroll suave\n- Tap funciona\n- Swipe si aplica\n- Pinch to zoom\n\nCRITERIOS DE ACEPTACIÓN:\n- Usable en todas las resoluciones\n- Sin overflow horizontal\n- Texto mínimo 16px en móvil\n- Touch targets mínimo 44x44px',
 'TASK', 'NORMAL', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 30 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "cross-browser", "responsivo"]');

-- =====================================================
-- ACCESSIBILITY TESTING (Day 31)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Accesibilidad - WCAG 2.1 Nivel A y AA',
 'OBJETIVO: Verificar cumplimiento de estándares de accesibilidad\n\nCATEGORÍAS WCAG:\n\n1. PERCEPTIBLE:\n   - Alt text en todas las imágenes\n   - Captions en videos si hay\n   - Contraste mínimo 4.5:1 (texto normal)\n   - Contraste mínimo 3:1 (texto grande)\n   - No depender solo del color\n   - Texto redimensionable hasta 200%\n\n2. OPERABLE:\n   - Todo navegable con teclado\n   - Orden de tabulación lógico\n   - Focus visible en elementos\n   - Sin trampas de teclado\n   - Tiempo suficiente para leer\n   - Skip links para navegación\n\n3. COMPRENSIBLE:\n   - Idioma de página definido\n   - Navegación consistente\n   - Identificación consistente\n   - Errores identificados claramente\n   - Sugerencias de corrección\n   - Labels en formularios\n\n4. ROBUSTO:\n   - HTML válido\n   - ARIA labels correctos\n   - Compatible con lectores de pantalla\n\nHERRAMIENTAS:\n- axe DevTools (extensión)\n- WAVE\n- Lighthouse Accessibility\n- NVDA / VoiceOver (lectores de pantalla)\n\nCRITERIOS DE ACEPTACIÓN:\n- Score >90 en Lighthouse Accessibility\n- 0 errores críticos en axe\n- Navegable 100% con teclado',
 'TASK', 'NORMAL', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 31 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "accesibilidad"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Accesibilidad - Navegación por teclado',
 'OBJETIVO: Verificar que toda la aplicación es usable sin mouse\n\nPRUEBAS:\n\n1. NAVEGACIÓN GENERAL:\n   - Tab: mover entre elementos\n   - Shift+Tab: mover hacia atrás\n   - Enter: activar botones/links\n   - Escape: cerrar modales\n   - Arrow keys: navegar menús\n\n2. FORMULARIOS:\n   - Tab entre campos\n   - Enter para enviar\n   - Escape para cancelar\n   - Space para checkboxes\n   - Arrows para selects\n\n3. COMPONENTES ESPECIALES:\n   - Date pickers navegables\n   - Dropdowns con arrows\n   - Modales atrapan focus\n   - Focus vuelve al cerrar modal\n   - Drag and drop alternativa\n\n4. INDICADORES VISUALES:\n   - Focus ring visible\n   - Estado activo claro\n   - Estado seleccionado claro\n\nFLUJOS COMPLETOS A PROBAR:\n- Login completo\n- Crear alerta\n- Crear operación\n- Navegación de menú\n- Búsqueda y filtros\n\nCRITERIOS DE ACEPTACIÓN:\n- Todo accesible con teclado\n- Focus siempre visible\n- Sin trampas de focus\n- Orden lógico de tabulación',
 'TASK', 'NORMAL', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 31 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "accesibilidad", "ux-ui"]');

-- =====================================================
-- DATABASE TESTING (Day 32)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Database - Integridad y consistencia',
 'OBJETIVO: Verificar integridad de datos en la base de datos\n\nPRUEBAS:\n\n1. INTEGRIDAD REFERENCIAL:\n   - Foreign keys funcionan\n   - Cascade delete/update correcto\n   - No hay registros huérfanos\n   - Constraints respetados\n\n2. ÍNDICES:\n   - Índices en columnas de búsqueda\n   - Índices en foreign keys\n   - Índices únicos donde aplica\n   - Performance de queries\n\n3. TRANSACCIONES:\n   - Operaciones atómicas\n   - Rollback en caso de error\n   - No hay datos parciales\n   - Locks funcionan correctamente\n\n4. MIGRACIONES:\n   - Todas las migraciones aplicadas\n   - Orden correcto\n   - Rollback posible\n   - Schema matches code\n\n5. DATOS SENSIBLES:\n   - Contraseñas hasheadas\n   - No hay datos sensibles en texto plano\n   - Encriptación donde aplica\n\nQUERIES DE VERIFICACIÓN:\n- Buscar registros huérfanos\n- Verificar conteos consistentes\n- Verificar timestamps\n- Verificar auditoría\n\nCRITERIOS DE ACEPTACIÓN:\n- 0 registros huérfanos\n- Todas las FK válidas\n- Queries críticos <100ms\n- Datos sensibles protegidos',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 32 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "database", "critico"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Backup - Respaldo y recuperación',
 'OBJETIVO: Verificar procesos de backup y recovery\n\nPRUEBAS:\n\n1. BACKUP AUTOMÁTICO:\n   - Verificar que backups se ejecutan\n   - Verificar frecuencia configurada\n   - Verificar que backups están completos\n   - Verificar almacenamiento seguro\n\n2. BACKUP MANUAL:\n   - Ejecutar backup manual\n   - Verificar tiempo de ejecución\n   - Verificar tamaño del backup\n   - Verificar que no afecta operación\n\n3. RECOVERY:\n   - Restaurar backup en ambiente de prueba\n   - Verificar integridad de datos\n   - Verificar que aplicación funciona\n   - Medir tiempo de recuperación\n\n4. POINT-IN-TIME RECOVERY:\n   - Si aplica, probar restauración a momento específico\n   - Verificar logs de transacciones\n\n5. DOCUMENTACIÓN:\n   - Procedimiento de backup documentado\n   - Procedimiento de recovery documentado\n   - Contactos de emergencia\n   - RTO y RPO definidos\n\nMÉTRICAS:\n- Tiempo de backup\n- Tiempo de recovery\n- Tamaño de backups\n- Retención configurada\n\nCRITERIOS DE ACEPTACIÓN:\n- Backup diario funcionando\n- Recovery probado exitosamente\n- RTO <4 horas\n- RPO <24 horas',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 32 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "backup-recovery", "critico"]');

-- =====================================================
-- LOCALIZATION TESTING (Day 33)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Localización - Idiomas y traducciones',
 'OBJETIVO: Verificar correcta localización del sistema\n\nIDIOMAS A PROBAR:\n- Español (es)\n- English (en)\n\nPRUEBAS:\n\n1. TRADUCCIONES:\n   - Todos los textos traducidos\n   - Sin textos hardcodeados\n   - Sin keys de i18n visibles\n   - Traducciones correctas (no machine translation)\n\n2. CAMBIO DE IDIOMA:\n   - Selector de idioma funciona\n   - Cambio inmediato sin recarga\n   - Preferencia se guarda\n   - Persistencia entre sesiones\n\n3. FORMATOS DE FECHA:\n   - ES: DD/MM/YYYY\n   - EN: MM/DD/YYYY\n   - Consistencia en toda la app\n\n4. FORMATOS DE NÚMERO:\n   - ES: 1.234,56\n   - EN: 1,234.56\n   - Monedas correctas\n\n5. CONTENIDO DINÁMICO:\n   - Mensajes de error traducidos\n   - Notificaciones traducidas\n   - Emails en idioma del usuario\n   - PDFs en idioma correcto\n\nÁREAS A REVISAR:\n- Menús y navegación\n- Formularios y labels\n- Mensajes de error\n- Tooltips\n- Modales\n- Emails\n- PDFs/Reportes\n\nCRITERIOS DE ACEPTACIÓN:\n- 100% textos traducidos\n- Formatos correctos por idioma\n- Sin textos cortados por longitud',
 'TASK', 'NORMAL', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 33 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "localizacion"]');

-- =====================================================
-- ERROR HANDLING TESTING (Day 33)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Errores - Manejo de errores y recuperación',
 'OBJETIVO: Verificar manejo graceful de errores\n\nESCENARIOS:\n\n1. ERRORES DE RED:\n   - Simular pérdida de conexión\n   - Verificar mensaje de error claro\n   - Verificar retry automático\n   - Verificar recuperación al volver online\n\n2. ERRORES DE SERVIDOR:\n   - Error 500: mensaje amigable\n   - Error 502/503: mensaje de mantenimiento\n   - Error 504: timeout, opción de reintentar\n\n3. ERRORES DE VALIDACIÓN:\n   - Campos requeridos vacíos\n   - Formatos inválidos\n   - Valores fuera de rango\n   - Mensajes específicos por campo\n\n4. ERRORES DE NEGOCIO:\n   - Operación no permitida\n   - Recurso no encontrado\n   - Conflicto de datos\n   - Permisos insuficientes\n\n5. ERRORES DE SESIÓN:\n   - Sesión expirada\n   - Token inválido\n   - Cuenta bloqueada\n   - Redirección a login\n\n6. RECUPERACIÓN:\n   - Datos no se pierden en error\n   - Formularios mantienen datos\n   - Opción de reintentar\n   - Logging de errores\n\nCRITERIOS DE ACEPTACIÓN:\n- Mensajes claros y útiles\n- Sin stack traces al usuario\n- Opción de recuperación\n- Errores logueados en servidor',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 33 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "error-handling"]');

-- =====================================================
-- SMOKE TEST & SANITY CHECK (Day 34)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Smoke Test - Verificación rápida post-deploy',
 'OBJETIVO: Verificación rápida de funcionalidades críticas después de cada deploy\n\nTIEMPO ESTIMADO: 15-20 minutos\n\nCHECKLIST:\n\n1. INFRAESTRUCTURA (2 min):\n   [ ] Sitio accesible por HTTPS\n   [ ] Certificado SSL válido\n   [ ] Sin errores en consola\n\n2. AUTENTICACIÓN (3 min):\n   [ ] Página de login carga\n   [ ] Login exitoso con usuario válido\n   [ ] Logout funciona\n   [ ] Redirección a login sin sesión\n\n3. NAVEGACIÓN (3 min):\n   [ ] Dashboard carga\n   [ ] Menú lateral funciona\n   [ ] Todas las secciones principales accesibles\n   [ ] Sin errores 404/500\n\n4. FUNCIONALIDAD CORE (5 min):\n   [ ] Lista de alertas carga\n   [ ] Crear nueva alerta funciona\n   [ ] Lista de operaciones carga\n   [ ] Búsqueda funciona\n\n5. INTEGRACIONES (3 min):\n   [ ] Notificaciones en tiempo real\n   [ ] Emails enviándose (verificar en logs)\n   [ ] Conexión a base de datos OK\n\n6. RENDIMIENTO (2 min):\n   [ ] Páginas cargan en <3s\n   [ ] Sin memory leaks evidentes\n   [ ] Sin requests fallidos\n\nSI FALLA ALGUNO:\n- Documentar el error\n- Notificar inmediatamente\n- Considerar rollback\n\nCRITERIOS DE ÉXITO:\n- 100% items pasando\n- Deploy considerado exitoso',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 34 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "smoke-test", "critico"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Checklist - Sanity check pre-release',
 'OBJETIVO: Verificación completa antes de release a producción\n\nCHECKLIST COMPLETO:\n\n## CÓDIGO Y BUILD\n[ ] Todas las pruebas unitarias pasando\n[ ] Build de producción exitoso\n[ ] No hay warnings críticos\n[ ] Dependencias actualizadas y seguras\n[ ] Variables de entorno configuradas\n\n## BASE DE DATOS\n[ ] Migraciones aplicadas\n[ ] Backup antes de release\n[ ] Rollback plan documentado\n\n## FUNCIONALIDAD\n[ ] Smoke test pasando\n[ ] Flujos críticos verificados\n[ ] Regresiones verificadas\n[ ] Cross-browser verificado\n[ ] Responsive verificado\n\n## SEGURIDAD\n[ ] Sin vulnerabilidades conocidas\n[ ] Headers de seguridad OK\n[ ] SSL/TLS configurado\n[ ] Secrets seguros\n\n## MONITOREO\n[ ] Logging configurado\n[ ] Alertas configuradas\n[ ] Métricas disponibles\n[ ] Error tracking activo\n\n## DOCUMENTACIÓN\n[ ] Release notes preparadas\n[ ] Changelog actualizado\n[ ] Documentación API actualizada\n[ ] Runbook actualizado\n\n## COMUNICACIÓN\n[ ] Stakeholders notificados\n[ ] Ventana de mantenimiento comunicada\n[ ] Soporte informado\n[ ] Rollback plan comunicado\n\nAPROBACIÓN FINAL:\n[ ] QA Lead: ________________\n[ ] Dev Lead: ________________\n[ ] Product Owner: ________________\n\nFecha de aprobación: ___________',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 34 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "smoke-test", "regresion", "critico"]');

-- =====================================================
-- DOCUMENT MANAGEMENT TESTING (Day 35)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Documentos - Gestión documental completa',
 'OBJETIVO: Verificar módulo de gestión de documentos\n\nUBICACIÓN: Gestión Documental (menú principal)\n\nPASOS:\n\n1. LISTAR DOCUMENTOS:\n   - Ver lista de documentos existentes\n   - Verificar columnas: nombre, tipo, tamaño, fecha, operación\n   - Filtrar por tipo de documento\n   - Filtrar por operación\n   - Buscar por nombre\n   - Ordenar por fecha\n\n2. SUBIR DOCUMENTO:\n   - Click "Subir documento"\n   - Seleccionar archivo PDF\n   - Asignar a operación (opcional)\n   - Seleccionar categoría\n   - Agregar descripción\n   - Subir y verificar\n\n3. TIPOS DE ARCHIVO:\n   - PDF: verificar preview\n   - Imagen (JPG, PNG): verificar preview\n   - Excel: verificar descarga\n   - Word: verificar descarga\n   - Rechazar tipos no permitidos (.exe, .bat)\n\n4. PREVIEW DE DOCUMENTO:\n   - Abrir documento PDF en visor\n   - Navegar páginas\n   - Zoom in/out\n   - Descargar desde preview\n   - Cerrar visor\n\n5. OPERACIONES:\n   - Descargar documento\n   - Renombrar documento\n   - Mover a otra categoría\n   - Eliminar documento (con confirmación)\n   - Ver historial de versiones (si existe)\n\n6. ASOCIACIÓN:\n   - Ver documentos de una operación\n   - Agregar documento a operación existente\n   - Ver desde detalle de operación\n\nVALIDACIONES:\n- Tamaño máximo respetado\n- Tipos permitidos\n- Nombres únicos o versionados\n- Permisos por rol\n\nCRITERIOS DE ACEPTACIÓN:\n- CRUD completo funciona\n- Preview funciona para PDF/imágenes\n- Descargas funcionan\n- Permisos se respetan',
 'TASK', 'NORMAL', 'MANUAL', 'documents',
 DATE_ADD(@today, INTERVAL 35 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-backoffice", "documentacion"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Documentos - Extracción IA y OCR',
 'OBJETIVO: Verificar extracción automática de datos de documentos\n\nPREREQUISITOS:\n- Módulo de IA habilitado\n- Documentos de prueba disponibles\n\nPASOS:\n\n1. SUBIR Y EXTRAER:\n   - Subir factura comercial (PDF)\n   - Iniciar extracción automática\n   - Verificar datos extraídos:\n     * Número de factura\n     * Fecha\n     * Monto total\n     * Datos del proveedor\n     * Datos del cliente\n     * Lista de items\n\n2. TIPOS DE DOCUMENTOS:\n   - Invoice / Factura comercial\n   - Bill of Lading\n   - Packing List\n   - Certificate of Origin\n   - Letra de cambio\n\n3. CALIDAD DE EXTRACCIÓN:\n   - Documento claro: >90% precisión\n   - Documento escaneado: >80% precisión\n   - Documento con sello/firma: verificar manejo\n\n4. CORRECCIÓN MANUAL:\n   - Editar campos extraídos incorrectamente\n   - Agregar campos faltantes\n   - Guardar correcciones\n   - Verificar aprendizaje (si aplica)\n\n5. USO DE DATOS:\n   - Usar datos extraídos para crear operación\n   - Verificar que se transfieren correctamente\n   - Validar contra datos de LC\n\nCRITERIOS DE ACEPTACIÓN:\n- Extracción funciona para tipos comunes\n- Precisión >80% en campos principales\n- Corrección manual funciona\n- Datos se usan en operaciones',
 'TASK', 'NORMAL', 'MANUAL', 'documents',
 DATE_ADD(@today, INTERVAL 35 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-backoffice", "modulo-ia", "documentacion"]');

-- =====================================================
-- FINAL QA SUMMARY (Day 36)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: RESUMEN QA - Reporte final de pruebas técnicas',
 'OBJETIVO: Compilar resultados de todas las pruebas técnicas de QA\n\nSECCIONES DEL REPORTE:\n\n1. RESUMEN EJECUTIVO:\n   - Estado general: PASS/FAIL\n   - Cobertura de pruebas\n   - Métricas clave\n\n2. RESULTADOS POR CATEGORÍA:\n\n   PRUEBAS FUNCIONALES:\n   [ ] Dashboard: ___/___\n   [ ] LC Import: ___/___\n   [ ] LC Export: ___/___\n   [ ] Garantías: ___/___\n   [ ] Cobranzas: ___/___\n   [ ] Alertas: ___/___\n   [ ] Usuarios: ___/___\n   [ ] Clientes: ___/___\n   [ ] Catálogos: ___/___\n   [ ] Administración: ___/___\n   [ ] IA/Analítica: ___/___\n   [ ] SWIFT: ___/___\n   [ ] Emails: ___/___\n   [ ] Documentos: ___/___\n\n   PRUEBAS TÉCNICAS:\n   [ ] Stress Testing: ___/___\n   [ ] Security/Vulnerabilidades: ___/___\n   [ ] API Testing: ___/___\n   [ ] Cross-Browser: ___/___\n   [ ] Accessibility: ___/___\n   [ ] Database: ___/___\n   [ ] Backup/Recovery: ___/___\n   [ ] Localization: ___/___\n   [ ] Error Handling: ___/___\n\n3. BUGS ENCONTRADOS:\n   - Críticos: ___\n   - Altos: ___\n   - Medios: ___\n   - Bajos: ___\n   - Total: ___\n\n4. VULNERABILIDADES:\n   - Críticas: ___\n   - Altas: ___\n   - Medias: ___\n   - Bajas: ___\n\n5. MÉTRICAS DE RENDIMIENTO:\n   - Tiempo de carga dashboard: ___ms\n   - Tiempo de respuesta API (p95): ___ms\n   - Usuarios concurrentes soportados: ___\n   - Memory leaks: Sí/No\n\n6. MÉTRICAS DE CALIDAD:\n   - Casos de prueba ejecutados: ___\n   - Casos de prueba pasados: ___\n   - Cobertura de funcionalidad: ___%\n   - Lighthouse Performance: ___\n   - Lighthouse Accessibility: ___\n\n7. RECOMENDACIONES:\n   - Mejoras prioritarias\n   - Deuda técnica identificada\n   - Riesgos identificados\n   - Próximos pasos\n\n8. DECISIÓN FINAL:\n   [ ] ✅ LISTO para producción\n   [ ] ⚠️ REQUIERE correcciones menores (puede salir con plan de fix)\n   [ ] ❌ REQUIERE correcciones mayores (no recomendado)\n   [ ] 🚫 NO APTO para producción\n\nAPROBACIONES:\n- QA Lead: ________________ Fecha: ________\n- Security Lead: ________________ Fecha: ________\n- Tech Lead: ________________ Fecha: ________\n- Product Owner: ________________ Fecha: ________\n\nNOTAS ADICIONALES:\n_________________________________________________\n_________________________________________________',
 'TASK', 'HIGH', 'MANUAL', 'qa',
 DATE_ADD(@today, INTERVAL 36 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tecnicas", "critico", "flujo-completo"]');
