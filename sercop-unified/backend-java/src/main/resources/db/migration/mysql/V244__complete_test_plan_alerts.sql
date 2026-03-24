-- =====================================================
-- V244: Complete Test Plan Alerts
-- =====================================================
-- Adds comprehensive test alerts for:
-- - Catalogs Module
-- - Administration Module
-- - AI & Analytics Module
-- - Additional integration and edge case tests

SET @now = NOW();
SET @today = CURDATE();

-- =====================================================
-- NEW TAGS FOR MISSING MODULES
-- =====================================================

INSERT INTO alert_tags (name, name_es, name_en, color, description, description_es, description_en, icon, display_order, created_by) VALUES
('modulo-catalogos', 'Módulo Catálogos', 'Catalogs Module', '#059669', 'Pruebas del módulo de catálogos', 'Pruebas del módulo de catálogos', 'Catalogs module testing', 'FiDatabase', 40, 'system'),
('modulo-admin', 'Módulo Administración', 'Admin Module', '#7C3AED', 'Pruebas del módulo de administración', 'Pruebas del módulo de administración', 'Administration module testing', 'FiSettings', 41, 'system'),
('modulo-ia', 'Módulo IA y Analítica', 'AI & Analytics Module', '#0891B2', 'Pruebas del módulo de IA y analítica', 'Pruebas del módulo de IA y analítica', 'AI and Analytics module testing', 'FiCpu', 42, 'system'),
('modulo-swift', 'Módulo SWIFT', 'SWIFT Module', '#DC2626', 'Pruebas del módulo SWIFT', 'Pruebas del módulo SWIFT', 'SWIFT module testing', 'FiSend', 43, 'system'),
('modulo-emails', 'Módulo Emails', 'Emails Module', '#EA580C', 'Pruebas del módulo de emails', 'Pruebas del módulo de emails', 'Emails module testing', 'FiMail', 44, 'system'),
('modulo-seguridad', 'Módulo Seguridad', 'Security Module', '#BE123C', 'Pruebas del módulo de seguridad', 'Pruebas del módulo de seguridad', 'Security module testing', 'FiLock', 45, 'system'),
('modulo-reportes', 'Módulo Reportes', 'Reports Module', '#4F46E5', 'Pruebas del módulo de reportes', 'Pruebas del módulo de reportes', 'Reports module testing', 'FiBarChart2', 46, 'system'),
('mfa', 'MFA', 'MFA', '#9333EA', 'Pruebas de autenticación multifactor', 'Pruebas de autenticación multifactor', 'Multi-factor authentication testing', 'FiShield', 47, 'system'),
('portal-cliente', 'Portal Cliente', 'Client Portal', '#0D9488', 'Pruebas del portal de cliente', 'Pruebas del portal de cliente', 'Client portal testing', 'FiUsers', 48, 'system')
ON DUPLICATE KEY UPDATE
    name_es = VALUES(name_es),
    name_en = VALUES(name_en),
    description_es = VALUES(description_es),
    description_en = VALUES(description_en);

-- =====================================================
-- MODULE: CATALOGS (Days 16-17)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

-- Catálogo de Monedas
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Catálogos - Gestión de Monedas',
 'OBJETIVO: Verificar CRUD completo del catálogo de monedas\n\nUBICACIÓN: Catálogos > Monedas\n\nPASOS:\n1. Listar monedas existentes\n   - Verificar que aparecen USD, EUR, etc.\n   - Verificar columnas: código, nombre, símbolo, decimales\n2. Crear nueva moneda\n   - Código: XYZ\n   - Nombre: Moneda de Prueba\n   - Símbolo: $\n   - Decimales: 2\n   - Guardar\n3. Editar moneda existente\n   - Cambiar nombre o símbolo\n   - Guardar cambios\n4. Desactivar/Activar moneda\n5. Verificar que moneda aparece en selectores de operaciones\n\nVALIDACIONES A PROBAR:\n- Código único (no duplicados)\n- Código en formato correcto (3 letras)\n- Campos requeridos\n\nCRITERIOS DE ACEPTACIÓN:\n- CRUD funciona sin errores\n- Validaciones funcionan\n- Moneda aparece en operaciones',
 'TASK', 'NORMAL', 'MANUAL', 'catalogs',
 DATE_ADD(@today, INTERVAL 16 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-catalogos", "critico"]'),

-- Catálogo de Instituciones Financieras
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Catálogos - Instituciones Financieras (Bancos)',
 'OBJETIVO: Verificar gestión de bancos corresponsales\n\nUBICACIÓN: Catálogos > Instituciones Financieras\n\nPASOS:\n1. Listar instituciones existentes\n   - Verificar datos: nombre, código SWIFT, país\n   - Probar búsqueda por nombre y código\n2. Crear nueva institución\n   - Nombre: Banco de Prueba S.A.\n   - Código SWIFT: BKPRXXXX\n   - País: Ecuador\n   - Es corresponsal: Sí/No\n   - Datos de contacto\n3. Editar institución\n   - Actualizar dirección\n   - Cambiar datos de contacto\n4. Ver detalles completos\n5. Verificar que aparece en selectores de operaciones\n\nVALIDACIONES:\n- Código SWIFT único y formato válido (8 u 11 caracteres)\n- Campos requeridos completos\n\nCRITERIOS DE ACEPTACIÓN:\n- Gestión completa funciona\n- Búsqueda eficiente\n- Integración con operaciones',
 'TASK', 'NORMAL', 'MANUAL', 'catalogs',
 DATE_ADD(@today, INTERVAL 16 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-catalogos"]'),

-- Catálogo de Tipos de Documentos
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Catálogos - Tipos de Documentos',
 'OBJETIVO: Verificar gestión de tipos de documentos para LC/garantías\n\nUBICACIÓN: Catálogos > Tipos de Documentos\n\nPASOS:\n1. Ver lista de tipos de documentos\n   - Bill of Lading, Invoice, Certificate of Origin, etc.\n   - Verificar código, descripción ES/EN\n2. Crear nuevo tipo de documento\n   - Código: DOC_TEST\n   - Nombre ES: Documento de Prueba\n   - Nombre EN: Test Document\n   - Descripción detallada\n   - Categoría\n3. Editar tipo existente\n4. Desactivar/Activar\n5. Verificar que aparece en:\n   - Documentos requeridos de LC\n   - Checklist de presentación\n   - Plantillas\n\nCRITERIOS DE ACEPTACIÓN:\n- Gestión bilingüe funciona\n- Aparece en operaciones\n- Código único',
 'TASK', 'NORMAL', 'MANUAL', 'catalogs',
 DATE_ADD(@today, INTERVAL 16 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-catalogos"]'),

-- Catálogo de Países
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Catálogos - Países y Zonas Geográficas',
 'OBJETIVO: Verificar gestión de países\n\nUBICACIÓN: Catálogos > Países\n\nPASOS:\n1. Ver lista de países\n   - Código ISO, Nombre, Región\n   - Verificar banderas se muestran\n2. Filtrar por región (América, Europa, Asia, etc.)\n3. Buscar por nombre o código\n4. Ver detalles de país\n   - Zona horaria\n   - Moneda por defecto\n   - Código telefónico\n5. Editar información de país\n6. Verificar uso en:\n   - Direcciones de clientes\n   - Datos de bancos\n   - Filtros de operaciones\n\nCRITERIOS DE ACEPTACIÓN:\n- Lista completa de países\n- Búsqueda funciona\n- Integración correcta',
 'TASK', 'LOW', 'MANUAL', 'catalogs',
 DATE_ADD(@today, INTERVAL 16 DAY), '16:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-catalogos"]'),

-- Catálogo de Tipos de Garantía
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Catálogos - Tipos de Garantía',
 'OBJETIVO: Verificar gestión de tipos de garantía\n\nUBICACIÓN: Catálogos > Tipos de Garantía\n\nTIPOS A VERIFICAR:\n- Performance Bond (Cumplimiento)\n- Advance Payment (Anticipo)\n- Bid Bond (Licitación)\n- Warranty (Calidad)\n- Payment Guarantee (Pago)\n- Customs (Aduanas)\n\nPASOS:\n1. Listar tipos existentes\n2. Ver plantilla de texto asociada a cada tipo\n3. Crear nuevo tipo de garantía\n   - Código: GUAR_TEST\n   - Nombre ES/EN\n   - Descripción\n   - Plantilla de texto por defecto\n4. Editar tipo existente\n5. Configurar comisiones por tipo\n6. Verificar en creación de garantías\n\nCRITERIOS DE ACEPTACIÓN:\n- Tipos se muestran en wizard de garantías\n- Plantillas funcionan\n- Comisiones se aplican',
 'TASK', 'NORMAL', 'MANUAL', 'catalogs',
 DATE_ADD(@today, INTERVAL 17 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-catalogos", "garantia"]'),

-- Catálogo de Tarifas y Comisiones
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Catálogos - Tarifas y Comisiones',
 'OBJETIVO: Verificar configuración de tarifas\n\nUBICACIÓN: Catálogos > Tarifas / Comisiones\n\nPASOS:\n1. Ver estructura de tarifas\n   - Por tipo de operación\n   - Por producto (LC, Garantía, Cobranza)\n   - Por rango de monto\n2. Configurar tarifa de ejemplo:\n   - Producto: LC Importación\n   - Tipo: Comisión de apertura\n   - Valor: 0.25% (mínimo $50, máximo $500)\n   - Frecuencia: Único\n3. Configurar tarifa escalonada\n   - 0-50,000: 0.30%\n   - 50,001-100,000: 0.25%\n   - >100,000: 0.20%\n4. Simular cálculo con operación de prueba\n5. Verificar que cálculo automático funciona\n\nCRITERIOS DE ACEPTACIÓN:\n- Tarifas se aplican correctamente\n- Mínimos y máximos respetados\n- Escalonamiento funciona\n- Cálculo automático preciso',
 'TASK', 'HIGH', 'MANUAL', 'catalogs',
 DATE_ADD(@today, INTERVAL 17 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-catalogos", "critico"]'),

-- Catálogo de Condiciones Estándar
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Catálogos - Condiciones Estándar LC',
 'OBJETIVO: Verificar plantillas de condiciones para LC\n\nUBICACIÓN: Catálogos > Condiciones Estándar\n\nPASOS:\n1. Ver condiciones existentes\n   - Condiciones de documentos\n   - Condiciones de pago\n   - Condiciones de embarque\n   - Condiciones adicionales\n2. Crear nueva condición\n   - Código: COND_TEST\n   - Texto ES: "Los documentos deben presentarse..."\n   - Texto EN: "Documents must be presented..."\n   - Categoría: Documentos\n3. Editar condición existente\n4. Verificar que aparece al crear LC\n5. Probar inserción de condición en operación\n\nCRITERIOS DE ACEPTACIÓN:\n- Condiciones bilingües\n- Fácil selección en wizard\n- Texto se inserta correctamente',
 'TASK', 'NORMAL', 'MANUAL', 'catalogs',
 DATE_ADD(@today, INTERVAL 17 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-catalogos", "lc-importacion"]');

-- =====================================================
-- MODULE: ADMINISTRATION (Days 18-20)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

-- Gestión de Usuarios
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Gestión completa de Usuarios',
 'OBJETIVO: Verificar CRUD completo de usuarios\n\nUBICACIÓN: Administración > Usuarios\n\nPASOS CREAR USUARIO:\n1. Click "Nuevo Usuario"\n2. Datos básicos:\n   - Username: testuser01\n   - Email: testuser01@test.com\n   - Nombre: Usuario\n   - Apellido: De Prueba\n   - Teléfono: opcional\n3. Credenciales:\n   - Generar contraseña o definir manual\n   - Forzar cambio en primer login: Sí\n4. Asignar roles:\n   - Seleccionar rol OPERATOR\n5. Permisos adicionales (opcionales)\n6. Guardar\n\nPASOS EDITAR:\n1. Buscar usuario creado\n2. Editar nombre/email\n3. Cambiar rol\n4. Agregar/quitar permisos\n5. Guardar cambios\n\nPASOS DESACTIVAR:\n1. Seleccionar usuario\n2. Click "Desactivar"\n3. Confirmar\n4. Verificar que no puede hacer login\n\nPASOS REACTIVAR:\n1. Filtrar usuarios inactivos\n2. Seleccionar usuario\n3. Click "Activar"\n4. Verificar que puede hacer login\n\nCRITERIOS DE ACEPTACIÓN:\n- CRUD completo funciona\n- Validación de email único\n- Roles se asignan correctamente\n- Historial de cambios registrado',
 'TASK', 'HIGH', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 18 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "modulo-usuarios", "critico"]'),

-- Gestión de Roles
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Gestión de Roles',
 'OBJETIVO: Verificar gestión de roles del sistema\n\nUBICACIÓN: Administración > Roles\n\nPASOS VER ROLES:\n1. Listar roles existentes:\n   - ROLE_ADMIN\n   - ROLE_MANAGER\n   - ROLE_SUPERVISOR\n   - ROLE_OPERATOR\n   - ROLE_USER\n   - ROLE_CLIENT\n2. Ver permisos de cada rol\n3. Ver usuarios asignados a cada rol\n\nPASOS CREAR ROL:\n1. Click "Nuevo Rol"\n2. Nombre: ROLE_AUDITOR\n3. Descripción: Rol para auditores externos\n4. Seleccionar permisos:\n   - Solo lectura en operaciones\n   - Acceso a reportes\n   - Sin permisos de edición\n5. Guardar\n\nPASOS EDITAR ROL:\n1. Seleccionar rol existente\n2. Agregar/quitar permisos\n3. Guardar\n4. Verificar que usuarios del rol ven cambios\n\nCRITERIOS DE ACEPTACIÓN:\n- Roles se crean correctamente\n- Permisos se aplican inmediatamente\n- No se pueden eliminar roles del sistema',
 'TASK', 'HIGH', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 18 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "seguridad", "critico"]'),

-- Gestión de Permisos
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Matriz de Permisos',
 'OBJETIVO: Verificar configuración granular de permisos\n\nUBICACIÓN: Administración > Permisos\n\nPASOS:\n1. Ver matriz de permisos por módulo:\n   - Operaciones: crear, editar, aprobar, eliminar\n   - Clientes: crear, editar, ver\n   - Reportes: generar, exportar\n   - Configuración: ver, editar\n2. Crear permiso personalizado:\n   - Código: PERM_EXPORT_EXCEL\n   - Nombre: Exportar a Excel\n   - Módulo: Reportes\n3. Asignar permiso a rol específico\n4. Verificar que usuario con rol puede/no puede ejecutar acción\n\nPRUEBA DE VALIDACIÓN:\n1. Usuario sin permiso intenta acción restringida\n2. Verificar mensaje de "Sin autorización"\n3. Verificar que API retorna 403\n\nCRITERIOS DE ACEPTACIÓN:\n- Permisos granulares funcionan\n- UI oculta opciones sin permiso\n- API valida permisos\n- Auditoría de accesos denegados',
 'TASK', 'HIGH', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 18 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "seguridad", "critico"]'),

-- Configuración de Seguridad
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Configuración de Seguridad',
 'OBJETIVO: Verificar configuración de políticas de seguridad\n\nUBICACIÓN: Administración > Seguridad > Configuración\n\nSECCIONES A PROBAR:\n\n1. POLÍTICA DE CONTRASEÑAS:\n   - Longitud mínima: 8 caracteres\n   - Requiere mayúscula: Sí\n   - Requiere número: Sí\n   - Requiere carácter especial: Sí\n   - Expiración: 90 días\n   - Historial: últimas 5\n   - Probar creación de usuario con contraseña débil\n\n2. BLOQUEO DE CUENTA:\n   - Intentos fallidos: 5\n   - Tiempo de bloqueo: 30 minutos\n   - Probar bloqueo por intentos fallidos\n   - Probar desbloqueo automático\n   - Probar desbloqueo manual por admin\n\n3. SESIONES:\n   - Timeout de inactividad: 30 minutos\n   - Sesiones simultáneas: 1\n   - Probar expiración de sesión\n   - Probar logout de otras sesiones\n\n4. AUDITORÍA:\n   - Verificar que se registran logins\n   - Verificar que se registran cambios\n\nCRITERIOS DE ACEPTACIÓN:\n- Políticas se aplican correctamente\n- Cambios toman efecto inmediato\n- Logs de auditoría completos',
 'TASK', 'HIGH', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 19 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "modulo-seguridad", "critico"]'),

-- MFA (Multi-Factor Authentication)
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Autenticación Multi-Factor (MFA)',
 'OBJETIVO: Verificar configuración y uso de MFA\n\nUBICACIÓN: Administración > Seguridad > MFA\n\nCONFIGURACIÓN:\n1. Habilitar MFA para usuarios admin\n2. Configurar métodos disponibles:\n   - TOTP (Google Authenticator)\n   - Email OTP\n   - SMS (si disponible)\n\nFLUJO DE ACTIVACIÓN:\n1. Usuario accede a Mi Perfil > Seguridad\n2. Click "Activar MFA"\n3. Escanear código QR con Google Authenticator\n4. Ingresar código de verificación\n5. Guardar códigos de respaldo\n6. MFA activo\n\nFLUJO DE LOGIN CON MFA:\n1. Ingresar usuario/contraseña\n2. Sistema solicita código MFA\n3. Ingresar código de Google Authenticator\n4. Login exitoso\n\nPRUEBAS ADICIONALES:\n- Código incorrecto rechazado\n- Código expirado rechazado\n- Uso de código de respaldo\n- Desactivación de MFA por admin\n- "Recordar dispositivo" funciona\n\nCRITERIOS DE ACEPTACIÓN:\n- MFA funciona correctamente\n- Códigos de respaldo funcionan\n- Admin puede resetear MFA de usuario',
 'TASK', 'HIGH', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 19 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "mfa", "seguridad", "critico"]'),

-- Auditoría y Logs
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Auditoría y Logs del Sistema',
 'OBJETIVO: Verificar sistema de auditoría\n\nUBICACIÓN: Administración > Auditoría\n\nSECCIONES:\n\n1. LOG DE ACCESOS:\n   - Ver historial de logins\n   - Filtrar por usuario, fecha, IP\n   - Ver intentos fallidos\n   - Ver logins exitosos\n   - Exportar a Excel\n\n2. LOG DE CAMBIOS:\n   - Ver cambios en operaciones\n   - Ver cambios en configuración\n   - Ver quién hizo cada cambio\n   - Ver valor anterior y nuevo\n\n3. LOG DE SEGURIDAD:\n   - Intentos de acceso no autorizado\n   - Cambios de contraseña\n   - Activación/desactivación MFA\n   - Cambios de permisos\n\n4. PRUEBAS:\n   - Realizar acciones y verificar que se registran\n   - Buscar por fecha específica\n   - Buscar por usuario específico\n   - Exportar logs\n\nCRITERIOS DE ACEPTACIÓN:\n- Todos los eventos se registran\n- Búsqueda funciona correctamente\n- No se pueden eliminar logs\n- Exportación funciona',
 'TASK', 'NORMAL', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 19 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "seguridad"]'),

-- Configuración del Menú
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Configuración del Menú',
 'OBJETIVO: Verificar configuración dinámica del menú\n\nUBICACIÓN: Administración > Configuración > Menú\n\nPASOS:\n1. Ver estructura actual del menú\n   - Secciones principales\n   - Subitems\n   - Iconos\n   - Rutas\n2. Crear nuevo item de menú:\n   - Nombre: Item de Prueba\n   - Icono: FiStar\n   - Ruta: /test-page\n   - Rol requerido: ADMIN\n   - Posición: después de Dashboard\n3. Editar item existente:\n   - Cambiar nombre\n   - Cambiar icono\n   - Cambiar orden\n4. Ocultar item de menú\n5. Mover item a otra sección\n6. Verificar cambios en UI\n\nCRITERIOS DE ACEPTACIÓN:\n- Cambios reflejan sin recargar (o con recarga)\n- Permisos de menú funcionan\n- Orden se respeta',
 'TASK', 'LOW', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 20 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "ux-ui"]'),

-- Configuración de Branding
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Personalización y Branding',
 'OBJETIVO: Verificar personalización visual\n\nUBICACIÓN: Administración > Configuración > Branding\n\nPASOS:\n1. Ver configuración actual:\n   - Logo de empresa\n   - Colores primarios\n   - Colores de sidebar\n   - Favicon\n2. Cambiar logo:\n   - Subir nuevo logo\n   - Verificar dimensiones aceptadas\n   - Verificar aparece en header\n3. Cambiar colores:\n   - Color primario\n   - Color de sidebar\n   - Color de texto\n   - Preview en tiempo real\n4. Cambiar favicon:\n   - Subir nuevo favicon\n   - Verificar en pestaña del navegador\n5. Restaurar valores por defecto\n\nCRITERIOS DE ACEPTACIÓN:\n- Cambios visuales se aplican\n- Preview funciona\n- Persistencia tras logout/login',
 'TASK', 'LOW', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 20 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "ux-ui"]'),

-- Aprobación 4 Ojos
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Admin - Configuración 4 Ojos (Maker-Checker)',
 'OBJETIVO: Verificar configuración de aprobación dual\n\nUBICACIÓN: Administración > Seguridad > 4 Ojos\n\nCONFIGURACIÓN:\n1. Habilitar 4 ojos para:\n   - Operaciones > $100,000\n   - Todas las garantías\n   - Cambios de usuario\n   - Cambios de configuración\n2. Configurar reglas:\n   - Nivel de riesgo alto: 2 aprobadores\n   - Nivel de riesgo medio: 1 aprobador\n   - Mismo usuario no puede aprobar su propio item\n   - Requiere diferente departamento: Sí/No\n\nPRUEBAS:\n1. Crear operación que requiere aprobación\n2. Verificar que aparece en cola de pendientes\n3. Intentar auto-aprobar (debe fallar)\n4. Aprobar con usuario diferente\n5. Verificar operación se procesa\n\nCASOS ESPECIALES:\n- Rechazo con comentarios\n- Aprobación parcial (si aplica)\n- Escalamiento por tiempo\n\nCRITERIOS DE ACEPTACIÓN:\n- Reglas se aplican correctamente\n- No se permite auto-aprobación\n- Historial de aprobaciones',
 'TASK', 'HIGH', 'MANUAL', 'admin',
 DATE_ADD(@today, INTERVAL 20 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-admin", "modulo-seguridad", "critico"]');

-- =====================================================
-- MODULE: AI & ANALYTICS (Days 21-22)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

-- IA - Extracción de Documentos
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: IA - Extracción de Datos de Documentos',
 'OBJETIVO: Verificar extracción automática de datos con IA\n\nUBICACIÓN: IA y Analítica > Extracción de Documentos\n\nPASOS:\n1. Subir documento de prueba:\n   - Factura comercial (PDF/imagen)\n   - Verificar preview del documento\n2. Iniciar extracción:\n   - Click "Extraer datos"\n   - Esperar procesamiento\n3. Revisar datos extraídos:\n   - Monto de factura\n   - Fecha\n   - Número de factura\n   - Datos del proveedor\n   - Datos del cliente\n4. Verificar confianza de extracción:\n   - Campos con alta confianza (verde)\n   - Campos con baja confianza (amarillo/rojo)\n5. Corregir datos si es necesario\n6. Aprobar extracción\n7. Verificar datos se usan en operación\n\nDOCUMENTOS A PROBAR:\n- Factura comercial\n- Bill of Lading\n- Packing List\n- Certificado de origen\n\nCRITERIOS DE ACEPTACIÓN:\n- Extracción funciona para documentos comunes\n- Precisión >80% en campos principales\n- UI muestra confianza claramente\n- Correcciones se guardan',
 'TASK', 'HIGH', 'MANUAL', 'ai',
 DATE_ADD(@today, INTERVAL 21 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-ia", "critico"]'),

-- IA - Solicitudes de Negocio
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: IA - Procesamiento de Solicitudes de Negocio',
 'OBJETIVO: Verificar flujo de solicitudes con datos extraídos por IA\n\nUBICACIÓN: IA y Analítica > Solicitudes de Negocio\n\nFLUJO COMPLETO:\n1. Recibir email con solicitud de LC (simulado)\n2. IA extrae datos del email:\n   - Cliente solicitante\n   - Tipo de operación\n   - Monto aproximado\n   - Urgencia\n3. Se crea Solicitud de Negocio automática\n4. Ver en lista de solicitudes pendientes\n5. Revisar datos extraídos\n6. Aprobar/Rechazar solicitud\n7. Si aprobada: crear borrador de operación\n8. Verificar datos se transfieren al borrador\n\nPRUEBAS:\n- Solicitud con datos completos\n- Solicitud con datos parciales\n- Solicitud duplicada (detectar)\n- Rechazo con razón\n\nCRITERIOS DE ACEPTACIÓN:\n- Flujo automatizado funciona\n- Datos extraídos son precisos\n- Aprobación genera operación correcta',
 'TASK', 'HIGH', 'MANUAL', 'ai',
 DATE_ADD(@today, INTERVAL 21 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-ia", "flujo-completo"]'),

-- Analytics - Dashboards
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Analytics - Dashboards Analíticos',
 'OBJETIVO: Verificar dashboards de análisis de datos\n\nUBICACIÓN: IA y Analítica > Dashboards\n\nDASHBOARDS A VERIFICAR:\n\n1. DASHBOARD OPERATIVO:\n   - Operaciones por estado\n   - Operaciones por tipo\n   - Tendencia mensual\n   - Top clientes por volumen\n   - Verificar que gráficos cargan\n   - Verificar tooltips\n   - Verificar filtros de fecha\n\n2. DASHBOARD FINANCIERO:\n   - Volumen por moneda\n   - Comisiones generadas\n   - Comparativo vs período anterior\n   - Margen por producto\n\n3. DASHBOARD DE RENDIMIENTO:\n   - Tiempo promedio de procesamiento\n   - Alertas vencidas vs a tiempo\n   - Productividad por usuario\n   - SLA cumplimiento\n\nPRUEBAS:\n- Cambiar rango de fechas\n- Exportar gráfico a imagen\n- Exportar datos a Excel\n- Drill-down en gráficos (si aplica)\n\nCRITERIOS DE ACEPTACIÓN:\n- Gráficos cargan correctamente\n- Datos son precisos\n- Filtros funcionan\n- Performance aceptable',
 'TASK', 'NORMAL', 'MANUAL', 'ai',
 DATE_ADD(@today, INTERVAL 21 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-ia", "modulo-reportes"]'),

-- Analytics - Reportes Avanzados
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Analytics - Reportes para Entes Reguladores',
 'OBJETIVO: Verificar generación de reportes regulatorios\n\nUBICACIÓN: IA y Analítica > Reportes Regulatorios\n\nREPORTES A PROBAR:\n\n1. REPORTE A SUPERINTENDENCIA:\n   - Seleccionar período\n   - Seleccionar tipo (mensual/trimestral)\n   - Verificar formato requerido\n   - Generar reporte\n   - Descargar Excel\n   - Verificar datos coinciden\n\n2. REPORTE BANCO CENTRAL:\n   - Operaciones de comercio exterior\n   - Por moneda\n   - Por tipo\n   - Formato específico\n\n3. REPORTE ANTI-LAVADO:\n   - Operaciones sobre umbral\n   - Operaciones sospechosas\n   - Formato SAR/STR\n\nPRUEBAS:\n- Generar para mes anterior\n- Regenerar reporte existente\n- Exportar en diferentes formatos\n- Verificar totales cuadran\n\nCRITERIOS DE ACEPTACIÓN:\n- Reportes cumplen formato regulatorio\n- Datos son precisos\n- Se pueden regenerar\n- Auditoría de generación',
 'TASK', 'HIGH', 'MANUAL', 'ai',
 DATE_ADD(@today, INTERVAL 22 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-ia", "modulo-reportes", "critico"]'),

-- IA - Predicciones y Alertas Inteligentes
(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: IA - Alertas Predictivas',
 'OBJETIVO: Verificar generación de alertas inteligentes\n\nUBICACIÓN: IA y Analítica > Alertas Predictivas\n\nTIPOS DE ALERTAS A VERIFICAR:\n\n1. VENCIMIENTOS PRÓXIMOS:\n   - IA identifica operaciones por vencer\n   - Genera alertas anticipadas\n   - Prioriza por monto/cliente\n\n2. PATRONES INUSUALES:\n   - Operaciones fuera de patrón\n   - Montos inusualmente altos/bajos\n   - Frecuencia inusual\n\n3. RIESGO DE CLIENTE:\n   - Basado en historial\n   - Basado en comportamiento\n   - Score de riesgo\n\n4. RECOMENDACIONES:\n   - Sugerencias de acción\n   - Priorización automática\n\nCONFIGURACIÓN:\n1. Ver reglas de alertas\n2. Ajustar umbrales\n3. Habilitar/deshabilitar tipos\n4. Ver historial de alertas generadas\n\nCRITERIOS DE ACEPTACIÓN:\n- Alertas se generan correctamente\n- No hay falsos positivos excesivos\n- Configuración flexible',
 'TASK', 'NORMAL', 'MANUAL', 'ai',
 DATE_ADD(@today, INTERVAL 22 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-ia", "modulo-alertas"]');

-- =====================================================
-- MODULE: SWIFT & MESSAGING (Day 23)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: SWIFT - Configuración de Campos MT700',
 'OBJETIVO: Verificar configuración de campos SWIFT para MT700\n\nUBICACIÓN: Catálogos > Configuración SWIFT\n\nPASOS:\n1. Ver estructura de campos MT700:\n   - Mandatory fields\n   - Optional fields\n   - Conditional fields\n2. Verificar configuración por campo:\n   - Etiqueta ES/EN\n   - Tipo de componente (text, select, date, etc.)\n   - Validaciones (regex, longitud)\n   - Opciones (para selects)\n3. Modificar campo de prueba:\n   - Cambiar etiqueta\n   - Cambiar placeholder\n   - Cambiar orden\n4. Verificar cambios en wizard de LC\n\nCAMPOS CLAVE A VERIFICAR:\n- 20: Documentary Credit Number\n- 40A: Form of Documentary Credit\n- 31D: Date and Place of Expiry\n- 50: Applicant\n- 59: Beneficiary\n\nCRITERIOS DE ACEPTACIÓN:\n- Campos se muestran correctamente\n- Validaciones funcionan\n- Cambios reflejan en wizard',
 'TASK', 'NORMAL', 'MANUAL', 'swift',
 DATE_ADD(@today, INTERVAL 23 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-swift", "lc-importacion"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: SWIFT - Generación de Mensajes',
 'OBJETIVO: Verificar generación correcta de mensajes SWIFT\n\nPASOS:\n1. Crear operación LC de prueba\n2. Completar todos los datos requeridos\n3. Generar mensaje SWIFT MT700\n4. Verificar estructura del mensaje:\n   - Header correcto\n   - Campos en orden correcto\n   - Formato de campos válido\n   - Caracteres permitidos\n5. Validar contra estándar SWIFT\n6. Exportar mensaje\n\nMENSAJES A PROBAR:\n- MT700: Issue LC\n- MT707: Amendment\n- MT760: Guarantee Issue\n- MT710: Advice of LC\n\nVALIDACIONES:\n- Longitud de campos\n- Caracteres permitidos (SWIFT charset)\n- Campos obligatorios presentes\n- Formato de fechas\n- Formato de montos\n\nCRITERIOS DE ACEPTACIÓN:\n- Mensajes válidos según estándar\n- Sin caracteres inválidos\n- Formato consistente',
 'TASK', 'HIGH', 'MANUAL', 'swift',
 DATE_ADD(@today, INTERVAL 23 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-swift", "critico"]');

-- =====================================================
-- MODULE: EMAIL SYSTEM (Day 24)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Emails - Configuración de Proveedores',
 'OBJETIVO: Verificar configuración de proveedores de email\n\nUBICACIÓN: Catálogos > Proveedores de Email\n\nPROVEEDORES A PROBAR:\n1. SMTP genérico\n2. SendGrid\n3. Mailgun\n4. AWS SES (si disponible)\n\nPASOS:\n1. Ver proveedores configurados\n2. Configurar nuevo proveedor:\n   - Nombre: Proveedor Prueba\n   - Tipo: SMTP\n   - Host: smtp.test.com\n   - Puerto: 587\n   - Usuario/Contraseña\n   - TLS: Sí\n3. Probar conexión\n4. Enviar email de prueba\n5. Verificar que llega correctamente\n6. Marcar como predeterminado\n7. Desactivar proveedor anterior\n\nCRITERIOS DE ACEPTACIÓN:\n- Configuración se guarda\n- Test de conexión funciona\n- Emails se envían por proveedor activo',
 'TASK', 'NORMAL', 'MANUAL', 'email',
 DATE_ADD(@today, INTERVAL 24 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-emails"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Emails - Plantillas y Variables',
 'OBJETIVO: Verificar gestión de plantillas de email\n\nUBICACIÓN: Catálogos > Plantillas de Email\n\nPLANTILLAS A PROBAR:\n\n1. NOTIFICACIÓN DE ALERTA:\n   - Variables: {usuario}, {titulo_alerta}, {fecha}, {link}\n   - Preview con datos de ejemplo\n   - Envío de prueba\n\n2. AVISO DE LC:\n   - Variables: {beneficiario}, {monto}, {moneda}, {vencimiento}\n   - Formato HTML profesional\n   - Logo incluido\n\n3. CONFIRMACIÓN DE OPERACIÓN:\n   - Variables: {numero_operacion}, {tipo}, {cliente}\n   - Adjuntos: PDF de confirmación\n\nPASOS:\n1. Editar plantilla existente\n2. Agregar nueva variable\n3. Preview con datos reales\n4. Guardar cambios\n5. Crear nueva plantilla\n6. Definir evento disparador\n7. Probar envío automático\n\nCRITERIOS DE ACEPTACIÓN:\n- Variables se reemplazan correctamente\n- HTML se renderiza bien\n- Emails llegan formateados',
 'TASK', 'NORMAL', 'MANUAL', 'email',
 DATE_ADD(@today, INTERVAL 24 DAY), '11:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-emails"]'),

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: Emails - Acciones Automáticas por Eventos',
 'OBJETIVO: Verificar envío automático de emails por eventos\n\nUBICACIÓN: Catálogos > Acciones por Evento\n\nEVENTOS A CONFIGURAR:\n\n1. CREACIÓN DE OPERACIÓN:\n   - Evento: operation.created\n   - Acción: Enviar email a operador asignado\n   - Plantilla: Notificación de nueva operación\n\n2. APROBACIÓN PENDIENTE:\n   - Evento: approval.pending\n   - Acción: Enviar email a aprobadores\n   - Plantilla: Solicitud de aprobación\n\n3. VENCIMIENTO PRÓXIMO:\n   - Evento: operation.expiring\n   - Acción: Enviar email a responsable\n   - Plantilla: Alerta de vencimiento\n   - Condición: 7 días antes\n\nPRUEBAS:\n1. Configurar acción para evento\n2. Disparar evento (crear operación)\n3. Verificar que email se envía\n4. Verificar contenido correcto\n5. Verificar destinatario correcto\n\nCRITERIOS DE ACEPTACIÓN:\n- Emails se envían automáticamente\n- Contenido es correcto\n- Timing es correcto',
 'TASK', 'NORMAL', 'MANUAL', 'email',
 DATE_ADD(@today, INTERVAL 24 DAY), '14:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "modulo-emails", "integracion"]');

-- =====================================================
-- FINAL SUMMARY TEST (Day 25)
-- =====================================================

INSERT INTO user_alert_readmodel (
    alert_id, user_id, user_name, assigned_by, assigned_role, title, description,
    alert_type, priority, source_type, source_module, scheduled_date, scheduled_time,
    status, created_at, created_by, tags
) VALUES

(UUID(), 'newadmin', 'New Admin', 'sistema', 'ROLE_ADMIN',
 'TEST: RESUMEN - Compilar resultados del plan de pruebas',
 'OBJETIVO: Compilar y documentar resultados de todas las pruebas\n\nACCIONES:\n\n1. REVISAR CADA MÓDULO:\n   [ ] Dashboard\n   [ ] Operaciones LC Import\n   [ ] Operaciones LC Export\n   [ ] Garantías\n   [ ] Cobranzas\n   [ ] Alertas\n   [ ] Usuarios y Permisos\n   [ ] Clientes\n   [ ] Catálogos\n   [ ] Administración\n   [ ] IA y Analítica\n   [ ] SWIFT\n   [ ] Emails\n   [ ] Seguridad\n   [ ] Rendimiento\n\n2. DOCUMENTAR:\n   - Bugs encontrados (con prioridad)\n   - Mejoras sugeridas\n   - Items que requieren más pruebas\n   - Configuraciones faltantes\n\n3. CREAR REPORTE:\n   - Resumen ejecutivo\n   - Detalle por módulo\n   - Lista de bugs/issues\n   - Recomendaciones\n   - Estado: Listo/No listo para producción\n\n4. SIGUIENTE PASOS:\n   - Priorizar correcciones\n   - Asignar responsables\n   - Definir fechas de resolución\n   - Planificar re-test\n\nENTREGABLE:\n- Documento de resultados de pruebas\n- Lista de issues en sistema de tracking\n- Recomendación de go/no-go',
 'TASK', 'HIGH', 'MANUAL', 'summary',
 DATE_ADD(@today, INTERVAL 25 DAY), '09:00:00',
 'PENDING', @now, 'sistema',
 '["plan-pruebas", "critico", "flujo-completo"]');
