-- =====================================================
-- V242: Test Plan Alerts
-- =====================================================
-- Creates comprehensive test plan alerts assigned to admin users
-- Each alert has detailed description of what to test

-- Get current timestamp for created_at
SET @now = NOW();
SET @today = CURDATE();

-- =====================================================
-- MODULE 1: DASHBOARD (Days 1-2)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Dashboard - Widgets y KPIs principales',
 'OBJETIVO: Verificar funcionamiento del dashboard principal\n\nPASOS:\n1. Cargar dashboard principal\n2. Verificar widget de alertas del día\n3. Verificar widget de operaciones activas\n4. Verificar KPIs (totales, pendientes, completadas)\n5. Verificar actualización en tiempo real\n6. Probar filtros por fecha\n\nCRITERIOS DE ACEPTACIÓN:\n- Widgets cargan en <2 segundos\n- Datos reflejan información actual\n- Sin errores en consola',
 'TASK', 'HIGH', 'MANUAL', 'dashboard',
 DATE_ADD(@today, INTERVAL 1 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-dashboard", "critico"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Dashboard - Navegación y responsivo',
 'OBJETIVO: Verificar navegación y diseño responsivo\n\nPASOS:\n1. Verificar menú lateral funciona correctamente\n2. Probar todas las opciones del menú\n3. Verificar breadcrumbs\n4. Probar en diferentes resoluciones (1920x1080, 1366x768, tablet, móvil)\n5. Verificar que no hay overflow o elementos cortados\n\nCRITERIOS DE ACEPTACIÓN:\n- Navegación fluida sin recargas innecesarias\n- Responsive funciona en todas las resoluciones\n- Menú colapsa correctamente en móvil',
 'TASK', 'NORMAL', 'MANUAL', 'dashboard',
 DATE_ADD(@today, INTERVAL 1 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-dashboard", "responsivo", "ux-ui"]');

-- =====================================================
-- MODULE 2: OPERATIONS - LC IMPORT (Days 2-4)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: LC Import - Crear nueva operación (Wizard)',
 'OBJETIVO: Crear una LC de importación usando el wizard\n\nPASOS:\n1. Ir a Emisión > LC Importación > Wizard\n2. Completar paso 1: Datos básicos (cliente, monto, moneda, fechas)\n3. Completar paso 2: Partes involucradas (bancos, beneficiario)\n4. Completar paso 3: Condiciones y documentos requeridos\n5. Completar paso 4: Revisión y confirmación\n6. Guardar como borrador\n7. Enviar a aprobación\n\nDATOS DE PRUEBA:\n- Cliente: Cualquier cliente activo\n- Monto: USD 100,000\n- Vencimiento: 90 días\n\nCRITERIOS DE ACEPTACIÓN:\n- Wizard guía correctamente en cada paso\n- Validaciones funcionan (campos requeridos, formatos)\n- Se genera borrador correctamente\n- Se puede enviar a aprobación',
 'TASK', 'HIGH', 'MANUAL', 'lc-import',
 DATE_ADD(@today, INTERVAL 2 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "lc-importacion", "critico", "flujo-completo"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: LC Import - Flujo de aprobación',
 'OBJETIVO: Verificar proceso de aprobación maker-checker\n\nPREREQUISITOS:\n- Tener un borrador de LC pendiente de aprobación\n- Tener dos usuarios con diferentes permisos\n\nPASOS:\n1. Usuario A crea borrador y envía a aprobación\n2. Usuario B (aprobador) recibe notificación\n3. Usuario B revisa el borrador\n4. Usuario B aprueba/rechaza con comentarios\n5. Si rechazado: Usuario A corrige y reenvía\n6. Si aprobado: Se genera operación\n\nCRITERIOS DE ACEPTACIÓN:\n- Notificaciones llegan al aprobador\n- Historia de aprobación se registra\n- No se puede auto-aprobar\n- Operación se crea solo tras aprobación',
 'TASK', 'HIGH', 'MANUAL', 'lc-import',
 DATE_ADD(@today, INTERVAL 2 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "lc-importacion", "seguridad"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: LC Import - Modificaciones (Amendments)',
 'OBJETIVO: Crear y procesar modificaciones a LC existente\n\nPREREQUISITOS:\n- Tener una LC de importación activa\n\nPASOS:\n1. Seleccionar LC activa\n2. Crear nueva modificación\n3. Cambiar: monto (+10%), fecha vencimiento, condiciones\n4. Guardar y enviar modificación\n5. Verificar notificación a partes\n6. Simular aceptación/rechazo\n7. Verificar historial de modificaciones\n\nCRITERIOS DE ACEPTACIÓN:\n- Se puede modificar cualquier campo permitido\n- Se genera mensaje SWIFT MT707 correcto\n- Historial muestra todas las versiones\n- Montos se recalculan correctamente',
 'TASK', 'HIGH', 'MANUAL', 'lc-import',
 DATE_ADD(@today, INTERVAL 3 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "lc-importacion", "modificacion-emitida"]');

-- =====================================================
-- MODULE 3: OPERATIONS - LC EXPORT (Days 4-5)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: LC Export - Aviso de LC recibida',
 'OBJETIVO: Registrar y avisar una LC de exportación recibida\n\nPASOS:\n1. Ir a Operaciones > LC Exportación > Nuevo aviso\n2. Ingresar datos del mensaje SWIFT recibido (MT700/710)\n3. Seleccionar beneficiario local\n4. Verificar condiciones y documentos\n5. Generar aviso al beneficiario\n6. Enviar notificación por email\n\nDATOS DE PRUEBA:\n- Simular recepción de MT700\n- Beneficiario: Cliente local activo\n- Monto: EUR 50,000\n\nCRITERIOS DE ACEPTACIÓN:\n- Se puede registrar LC recibida\n- Se genera aviso correcto al beneficiario\n- Email se envía con formato correcto\n- Operación aparece en listado de exportaciones',
 'TASK', 'HIGH', 'MANUAL', 'lc-export',
 DATE_ADD(@today, INTERVAL 4 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "lc-exportacion", "critico"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: LC Export - Presentación de documentos',
 'OBJETIVO: Procesar presentación de documentos del beneficiario\n\nPREREQUISITOS:\n- Tener una LC de exportación avisada\n\nPASOS:\n1. Seleccionar LC avisada\n2. Registrar presentación de documentos\n3. Ingresar cada documento presentado\n4. Revisar contra condiciones de la LC\n5. Marcar discrepancias si existen\n6. Generar carta de envío al banco emisor\n7. Registrar tracking del courier\n\nCRITERIOS DE ACEPTACIÓN:\n- Checklist de documentos funciona\n- Se pueden marcar discrepancias\n- Se genera carta de envío\n- Historial registra la presentación',
 'TASK', 'HIGH', 'MANUAL', 'lc-export',
 DATE_ADD(@today, INTERVAL 4 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "lc-exportacion", "docs-completos", "revision-docs"]');

-- =====================================================
-- MODULE 4: GUARANTEES (Days 5-6)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Garantías - Emitir garantía de cumplimiento',
 'OBJETIVO: Crear una garantía de cumplimiento (Performance Bond)\n\nPASOS:\n1. Ir a Emisión > Garantías > Nueva garantía\n2. Seleccionar tipo: Performance Bond\n3. Ingresar datos: ordenante, beneficiario, monto, vigencia\n4. Redactar texto de la garantía (usar plantilla)\n5. Verificar contra contragarantía si aplica\n6. Enviar a aprobación\n7. Generar documento final\n\nDATOS DE PRUEBA:\n- Tipo: Garantía de cumplimiento\n- Monto: USD 500,000\n- Vigencia: 1 año\n\nCRITERIOS DE ACEPTACIÓN:\n- Plantillas de texto funcionan\n- Se genera mensaje MT760 correcto\n- Documento PDF se genera bien\n- Comisiones se calculan',
 'TASK', 'HIGH', 'MANUAL', 'guarantees',
 DATE_ADD(@today, INTERVAL 5 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "garantia", "critico", "flujo-completo"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Garantías - Extensión y reducción',
 'OBJETIVO: Procesar extensión y reducción de garantía existente\n\nPREREQUISITOS:\n- Tener una garantía activa\n\nPASOS EXTENSIÓN:\n1. Seleccionar garantía activa\n2. Solicitar extensión\n3. Ingresar nueva fecha de vencimiento\n4. Aprobar y generar amendment\n\nPASOS REDUCCIÓN:\n1. Seleccionar garantía activa\n2. Solicitar reducción de monto\n3. Ingresar nuevo monto\n4. Generar mensaje de reducción\n\nCRITERIOS DE ACEPTACIÓN:\n- Se puede extender vigencia\n- Se puede reducir monto\n- Historial registra cambios\n- Comisiones se ajustan',
 'TASK', 'NORMAL', 'MANUAL', 'guarantees',
 DATE_ADD(@today, INTERVAL 5 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "garantia", "modificacion-emitida"]');

-- =====================================================
-- MODULE 5: COLLECTIONS (Day 6)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Cobranzas - Crear cobranza documentaria',
 'OBJETIVO: Crear una cobranza documentaria de exportación\n\nPASOS:\n1. Ir a Emisión > Cobranzas > Nueva\n2. Seleccionar tipo: Documentary Collection\n3. Ingresar ordenante (exportador local)\n4. Ingresar girado (importador extranjero)\n5. Seleccionar banco cobrador\n6. Definir condiciones (D/P, D/A, etc.)\n7. Listar documentos a enviar\n8. Generar instrucciones de cobranza\n\nDATOS DE PRUEBA:\n- Tipo: D/P (Documents against Payment)\n- Monto: USD 25,000\n\nCRITERIOS DE ACEPTACIÓN:\n- Se genera cobranza correctamente\n- Instrucciones claras al banco cobrador\n- Documentos listados correctamente',
 'TASK', 'NORMAL', 'MANUAL', 'collections',
 DATE_ADD(@today, INTERVAL 6 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-operaciones", "cobranza", "flujo-completo"]');

-- =====================================================
-- MODULE 6: ALERTS SYSTEM (Days 7-8)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Alertas - Crear, asignar y completar',
 'OBJETIVO: Probar ciclo completo de alertas\n\nPASOS:\n1. Crear nueva alerta manual\n2. Asignar a usuario específico\n3. Verificar notificación al usuario\n4. Usuario inicia la alerta\n5. Agregar notas de progreso\n6. Completar la alerta\n7. Verificar historial\n\nVARIACIONES:\n- Crear alerta asignada a ROL\n- Reagendar alerta\n- Cancelar alerta\n\nCRITERIOS DE ACEPTACIÓN:\n- Notificaciones llegan en tiempo real\n- Estados cambian correctamente\n- Historial registra todo\n- Contadores se actualizan',
 'TASK', 'HIGH', 'MANUAL', 'alerts',
 DATE_ADD(@today, INTERVAL 7 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-alertas", "critico", "flujo-completo"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Alertas - Filtros y búsqueda avanzada',
 'OBJETIVO: Probar sistema de filtros y etiquetas\n\nPASOS:\n1. Ir a Alertas > Vista principal\n2. Probar filtro "Asignadas a mí"\n3. Probar filtro "Asignadas por mí"\n4. Probar filtro "Todas" (si tiene permiso)\n5. Filtrar por estado (Pendiente, En progreso, etc.)\n6. Filtrar por prioridad\n7. Filtrar por tags/etiquetas\n8. Combinar múltiples filtros\n9. Usar búsqueda por texto\n\nCRITERIOS DE ACEPTACIÓN:\n- Cada filtro funciona individualmente\n- Filtros se pueden combinar\n- Resultados son correctos\n- Performance aceptable (<1 seg)',
 'TASK', 'HIGH', 'MANUAL', 'alerts',
 DATE_ADD(@today, INTERVAL 7 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-alertas", "ux-ui"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Alertas - Tags y categorización',
 'OBJETIVO: Probar sistema de etiquetas\n\nPASOS:\n1. Ver catálogo de tags disponibles\n2. Crear alerta con múltiples tags\n3. Editar tags de una alerta existente\n4. Filtrar por tag específico\n5. Ver alertas agrupadas por tag\n6. Crear nuevo tag (si es admin)\n7. Editar tag existente\n\nVERIFICAR:\n- Colores de tags se muestran correctamente\n- Tags se guardan al crear/editar\n- Filtro por tag funciona\n- No hay duplicados de tags\n\nCRITERIOS DE ACEPTACIÓN:\n- Sistema de tags funciona end-to-end\n- UI de selección es intuitiva\n- Tags persisten correctamente',
 'TASK', 'NORMAL', 'MANUAL', 'alerts',
 DATE_ADD(@today, INTERVAL 8 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-alertas", "ux-ui"]');

-- =====================================================
-- MODULE 7: REAL-TIME & NOTIFICATIONS (Day 8)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Notificaciones en tiempo real',
 'OBJETIVO: Verificar que notificaciones llegan en tiempo real\n\nPREPARACIÓN:\n- Tener dos navegadores abiertos con usuarios diferentes\n- Usuario A y Usuario B conectados\n\nPASOS:\n1. Usuario A crea alerta para Usuario B\n2. Verificar que B recibe notificación inmediata\n3. B abre la alerta y la inicia\n4. Verificar que A ve el cambio de estado\n5. Probar notificación de mensaje nuevo\n6. Probar notificación de aprobación pendiente\n\nVERIFICAR:\n- Toast de notificación aparece\n- Sonido de notificación (si habilitado)\n- Contador de alertas se actualiza\n- No hay delay significativo (<3 seg)\n\nCRITERIOS DE ACEPTACIÓN:\n- Comunicación en tiempo real funciona\n- Sin reconexiones frecuentes\n- Estado de conexión visible',
 'TASK', 'HIGH', 'MANUAL', 'realtime',
 DATE_ADD(@today, INTERVAL 8 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "tiempo-real", "notificaciones", "critico"]');

-- =====================================================
-- MODULE 8: USERS & PERMISSIONS (Days 9-10)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Usuarios - CRUD completo',
 'OBJETIVO: Verificar gestión completa de usuarios\n\nPASOS:\n1. Crear nuevo usuario\n   - Ingresar datos: nombre, email, username\n   - Asignar rol(es)\n   - Asignar permisos específicos\n   - Guardar\n2. Verificar que usuario puede hacer login\n3. Editar usuario existente\n   - Cambiar nombre\n   - Cambiar rol\n4. Desactivar usuario\n5. Verificar que no puede hacer login\n6. Reactivar usuario\n\nCRITERIOS DE ACEPTACIÓN:\n- CRUD funciona completamente\n- Validaciones de email único\n- Roles se asignan correctamente\n- Usuario desactivado no puede entrar',
 'TASK', 'HIGH', 'MANUAL', 'users',
 DATE_ADD(@today, INTERVAL 9 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-usuarios", "seguridad", "critico"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Permisos - Verificar restricciones',
 'OBJETIVO: Verificar que permisos restringen acceso correctamente\n\nPREPARACIÓN:\n- Tener usuarios con diferentes roles\n- ADMIN: acceso total\n- OPERATOR: acceso limitado\n- USER: solo lectura\n\nPASOS:\n1. Login como OPERATOR\n   - Verificar menú muestra solo opciones permitidas\n   - Intentar acceder a rutas no permitidas (debe denegar)\n   - Intentar API calls no permitidos (debe dar 403)\n2. Login como USER\n   - Verificar solo puede ver, no editar\n   - Botones de edición no visibles o deshabilitados\n3. Login como ADMIN\n   - Verificar acceso total\n   - Puede ver sección de administración\n\nCRITERIOS DE ACEPTACIÓN:\n- Menú se adapta al rol\n- Rutas protegidas funcionan\n- API valida permisos\n- Sin errores de UI por permisos',
 'TASK', 'HIGH', 'MANUAL', 'users',
 DATE_ADD(@today, INTERVAL 9 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-usuarios", "seguridad", "critico"]');

-- =====================================================
-- MODULE 9: CLIENTS (Day 10)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Clientes - Gestión de clientes',
 'OBJETIVO: Verificar módulo de gestión de clientes\n\nPASOS:\n1. Crear nuevo cliente\n   - Datos básicos: nombre, RUC/NIT, dirección\n   - Contactos: personas de contacto, emails, teléfonos\n   - Datos bancarios: cuentas asociadas\n2. Buscar cliente existente\n3. Editar información del cliente\n4. Ver historial de operaciones del cliente\n5. Ver alertas relacionadas al cliente\n6. Desactivar cliente\n\nVERIFICAR:\n- Validación de RUC/NIT único\n- Búsqueda funciona por nombre y código\n- Relación con operaciones funciona\n\nCRITERIOS DE ACEPTACIÓN:\n- CRUD completo funciona\n- Búsqueda es eficiente\n- Historial muestra operaciones correctas',
 'TASK', 'NORMAL', 'MANUAL', 'clients',
 DATE_ADD(@today, INTERVAL 10 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-clientes", "flujo-completo"]');

-- =====================================================
-- MODULE 10: BACKOFFICE & CONFIGURATION (Days 11-12)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Backoffice - Catálogos del sistema',
 'OBJETIVO: Verificar gestión de catálogos\n\nCATÁLOGOS A PROBAR:\n1. Monedas\n   - Ver lista de monedas\n   - Agregar nueva moneda\n   - Editar tasa de cambio\n2. Bancos corresponsales\n   - CRUD de bancos\n   - Códigos SWIFT\n3. Tipos de documentos\n   - Lista de documentos requeridos\n   - Agregar nuevo tipo\n4. Condiciones estándar\n   - Plantillas de condiciones\n   - Editar plantilla\n5. Comisiones\n   - Configurar tarifas\n   - Verificar cálculos\n\nCRITERIOS DE ACEPTACIÓN:\n- Cada catálogo permite CRUD\n- Cambios reflejan en operaciones\n- Validaciones funcionan',
 'TASK', 'NORMAL', 'MANUAL', 'backoffice',
 DATE_ADD(@today, INTERVAL 11 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-backoffice", "catalogo"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Backoffice - Configuración de emails',
 'OBJETIVO: Verificar configuración y envío de emails\n\nPASOS:\n1. Revisar configuración SMTP\n2. Probar conexión al servidor\n3. Editar plantilla de email\n   - Verificar variables disponibles\n   - Preview de email\n4. Enviar email de prueba\n5. Verificar email llega correctamente\n6. Verificar formato HTML se ve bien\n\nPLANTILLAS A PROBAR:\n- Notificación de nueva alerta\n- Aviso de LC al beneficiario\n- Confirmación de operación\n\nCRITERIOS DE ACEPTACIÓN:\n- Emails se envían sin errores\n- Variables se reemplazan correctamente\n- Formato se ve profesional',
 'TASK', 'NORMAL', 'MANUAL', 'backoffice',
 DATE_ADD(@today, INTERVAL 11 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-backoffice", "email-enviado"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Backoffice - Reportes y exportación',
 'OBJETIVO: Verificar generación de reportes\n\nREPORTES A PROBAR:\n1. Reporte de operaciones por período\n   - Filtrar por fechas\n   - Filtrar por tipo de operación\n   - Exportar a Excel\n   - Exportar a PDF\n2. Reporte de comisiones\n   - Por cliente\n   - Por tipo de operación\n3. Reporte de alertas\n   - Pendientes\n   - Completadas\n   - Por usuario\n4. Dashboard analytics\n   - Gráficos se generan\n   - Datos son correctos\n\nCRITERIOS DE ACEPTACIÓN:\n- Reportes generan sin errores\n- Datos son precisos\n- Exportación funciona\n- PDFs se ven profesionales',
 'TASK', 'NORMAL', 'MANUAL', 'backoffice',
 DATE_ADD(@today, INTERVAL 12 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-backoffice", "reportes"]');

-- =====================================================
-- MODULE 11: INTEGRATION TESTS (Days 13-14)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Integración - Flujo completo LC Import',
 'OBJETIVO: Probar flujo completo de LC de importación end-to-end\n\nFLUJO COMPLETO:\n1. Cliente solicita LC vía portal (o se ingresa manual)\n2. Se crea borrador en el sistema\n3. Aprobación interna (maker-checker)\n4. Se emite LC (genera MT700)\n5. Se recibe confirmación del banco avisador\n6. Se procesa modificación solicitada por cliente\n7. Se reciben documentos del beneficiario\n8. Se revisan documentos y se procesan discrepancias\n9. Se autoriza pago\n10. Se registra utilización\n11. Se cierra la operación\n\nDURANTE TODO EL FLUJO VERIFICAR:\n- Alertas se generan automáticamente\n- Notificaciones llegan a usuarios correctos\n- Historial registra cada evento\n- Estados cambian correctamente\n\nCRITERIOS DE ACEPTACIÓN:\n- Flujo completo sin errores\n- Datos consistentes en todo el proceso\n- Trazabilidad completa',
 'TASK', 'HIGH', 'MANUAL', 'integration',
 DATE_ADD(@today, INTERVAL 13 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "integracion", "lc-importacion", "flujo-completo", "critico"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Integración - Multi-usuario concurrente',
 'OBJETIVO: Verificar comportamiento con múltiples usuarios simultáneos\n\nPREPARACIÓN:\n- 3-4 usuarios diferentes conectados\n- Diferentes navegadores/pestañas\n\nESCENARIOS:\n1. Dos usuarios editan misma operación\n   - Verificar bloqueo o warning de conflicto\n2. Usuario A asigna alerta a B mientras B está online\n   - Notificación debe llegar inmediatamente\n3. Aprobación simultánea\n   - Dos aprobadores intentan aprobar mismo item\n4. Actualización de dashboard\n   - Cambios de un usuario reflejan en dashboards de otros\n\nCRITERIOS DE ACEPTACIÓN:\n- No hay corrupción de datos\n- Conflictos se manejan correctamente\n- Sistema estable bajo carga\n- Notificaciones son confiables',
 'TASK', 'HIGH', 'MANUAL', 'integration',
 DATE_ADD(@today, INTERVAL 13 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "integracion", "tiempo-real", "rendimiento", "critico"]');

-- =====================================================
-- MODULE 12: PERFORMANCE & SECURITY (Day 14)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Rendimiento - Tiempos de carga',
 'OBJETIVO: Verificar tiempos de respuesta aceptables\n\nMÉTRICAS A MEDIR:\n1. Login: <2 segundos\n2. Carga de dashboard: <3 segundos\n3. Lista de operaciones (100 items): <2 segundos\n4. Búsqueda: <1 segundo\n5. Crear operación: <3 segundos\n6. Generación de PDF: <5 segundos\n\nHERRAMIENTAS:\n- DevTools > Network > Timing\n- DevTools > Performance\n\nPASOS:\n1. Limpiar cache\n2. Medir cada operación 3 veces\n3. Documentar promedios\n4. Identificar operaciones lentas\n\nCRITERIOS DE ACEPTACIÓN:\n- Todas las métricas dentro de límites\n- No hay memory leaks\n- No hay requests innecesarios',
 'TASK', 'NORMAL', 'MANUAL', 'performance',
 DATE_ADD(@today, INTERVAL 14 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "rendimiento"]'),

(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Seguridad - Verificaciones básicas',
 'OBJETIVO: Verificar controles de seguridad básicos\n\nPRUEBAS:\n1. Sesión expira después de inactividad\n   - Dejar sesión idle por tiempo configurado\n   - Verificar que requiere re-login\n2. Token JWT\n   - Verificar que token expira\n   - Verificar refresh token funciona\n3. HTTPS\n   - Todo tráfico es HTTPS\n   - No hay mixed content\n4. Validación de entrada\n   - Intentar XSS en campos de texto\n   - Intentar SQL injection\n   - Verificar que se sanitiza\n5. CORS\n   - Verificar que solo orígenes permitidos\n6. Rate limiting\n   - Verificar que hay límite de requests\n\nCRITERIOS DE ACEPTACIÓN:\n- Sesiones se manejan correctamente\n- No hay vulnerabilidades obvias\n- Headers de seguridad presentes',
 'TASK', 'HIGH', 'MANUAL', 'security',
 DATE_ADD(@today, INTERVAL 14 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "seguridad", "critico"]');

-- =====================================================
-- FINAL: REGRESSION TEST (Day 15)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES
(UUID(), 'admin', 'Administrador', 'sistema', 'ROLE_ADMIN',
 'TEST: Regresión - Verificación final',
 'OBJETIVO: Ejecutar prueba de regresión final\n\nCHECKLIST RÁPIDO:\n\n[ ] Login funciona\n[ ] Dashboard carga correctamente\n[ ] Menú de navegación funciona\n[ ] Crear operación LC Import\n[ ] Crear operación LC Export\n[ ] Crear garantía\n[ ] Crear cobranza\n[ ] Sistema de alertas funciona\n[ ] Crear/editar usuario\n[ ] Permisos funcionan\n[ ] Notificaciones en tiempo real\n[ ] Emails se envían\n[ ] Reportes generan\n[ ] PDFs se crean\n[ ] Búsqueda funciona\n[ ] Filtros funcionan\n[ ] Responsive funciona\n\nDOCUMENTAR:\n- Cualquier bug encontrado\n- Sugerencias de mejora\n- Items que requieren más pruebas\n\nCRITERIOS DE ACEPTACIÓN:\n- Todos los items del checklist pasan\n- No hay regresiones de funcionalidad\n- Sistema listo para producción',
 'TASK', 'HIGH', 'MANUAL', 'regression',
 DATE_ADD(@today, INTERVAL 15 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "regresion", "critico", "flujo-completo"]');

