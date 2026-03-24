# AI Chat CMX - Inicialización de Datos

## Descripción

Este módulo incluye un sistema de inicialización automática de datos para el Chat CMX que funciona **independientemente de si Flyway está habilitado o no**.

## Componentes

### 1. AIChatDataInitializer

**Ubicación:** `backend/src/main/java/com/globalcmx/api/ai/config/AIChatDataInitializer.java`

**Propósito:** Se ejecuta automáticamente al iniciar la aplicación Spring Boot y asegura que todos los datos necesarios para el Chat CMX estén creados en la base de datos.

**Qué inicializa:**
- ✅ Permiso `CAN_USE_AI_CHAT` en la tabla `permission_read_model`
- ✅ Asignación del permiso a los roles: `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_USER`
- ✅ Sección de menú `SECTION_AI` (si no existe)
- ✅ Item de menú `AI_CHAT_CMX` con la ruta `/ai-analysis/chat`
- ✅ Asociación del permiso al item de menú

**Características:**
- **Idempotente:** Puede ejecutarse múltiples veces sin problemas
- **Seguro:** No elimina datos existentes, solo crea o actualiza lo necesario
- **Resiliente:** Si hay un error, la aplicación puede iniciar normalmente (solo se registra el error)

**Orden de ejecución:** `@Order(200)` - Se ejecuta después de:
- `SecurityDataInitializer` (@Order(1)) - Crea roles y usuarios
- `CxTestDataInitializer` (@Order(100)) - Crea datos de prueba de Comercio Exterior

### 2. Migraciones Flyway

**Ubicación:** `backend/src/main/resources/db/migration/mysql/`

**Archivos:**
- `V169__create_ai_chat_tables.sql` - Crea las tablas de AI Chat y el permiso básico
- `V170__add_ai_chat_menu_item.sql` - Crea el item de menú y asigna permisos

**Nota:** Estas migraciones son **complementarias** al inicializador. Si Flyway está habilitado, las migraciones se ejecutarán primero. Si Flyway está deshabilitado, el inicializador se encargará de crear todo.

## Flujo de Inicialización

```
┌─────────────────────────────────────────────────────────────┐
│  Inicio de la Aplicación Spring Boot                        │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  ¿Flyway está habilitado?     │
        └───────────────────────────────┘
                │                    │
         SÍ     │                    │     NO
                ▼                    ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ Ejecutar         │    │ Saltar           │
    │ Migraciones      │    │ Migraciones      │
    │ V169, V170       │    │                  │
    └──────────────────┘    └──────────────────┘
                │                    │
                └──────────┬─────────┘
                           ▼
            ┌───────────────────────────┐
            │ AIChatDataInitializer     │
            │ (verifica y crea datos)  │
            └───────────────────────────┘
                           │
                           ▼
            ┌───────────────────────────┐
            │ Aplicación lista          │
            │ Chat CMX disponible       │
            └───────────────────────────┘
```

## Verificación

Para verificar que todo está correctamente inicializado, puedes:

1. **Verificar en la base de datos:**
   ```sql
   -- Verificar permiso
   SELECT * FROM permission_read_model WHERE code = 'CAN_USE_AI_CHAT';
   
   -- Verificar item de menú
   SELECT * FROM menu_item WHERE code = 'AI_CHAT_CMX';
   
   -- Verificar permisos asignados a roles
   SELECT r.name, p.code 
   FROM role_read_model r
   JOIN role_permission_read_model rp ON r.id = rp.role_id
   JOIN permission_read_model p ON rp.permission_code = p.code
   WHERE p.code = 'CAN_USE_AI_CHAT';
   ```

2. **Verificar en los logs de la aplicación:**
   Busca el mensaje:
   ```
   ================================================================================
   Inicializando datos de AI Chat CMX...
   ================================================================================
   ✓ Datos de AI Chat CMX inicializados correctamente
   ```

3. **Verificar en la interfaz:**
   - Inicia sesión como usuario con rol `ROLE_ADMIN`, `ROLE_MANAGER` o `ROLE_USER`
   - Deberías ver el item "Chat CMX" en el menú "IA y Analítica"
   - Al hacer clic, deberías poder acceder a `/ai-analysis/chat`

## Solución de Problemas

### El item de menú no aparece

1. **Verifica que el permiso existe:**
   ```sql
   SELECT * FROM permission_read_model WHERE code = 'CAN_USE_AI_CHAT';
   ```

2. **Verifica que el permiso está asignado a tu rol:**
   ```sql
   SELECT r.name, p.code 
   FROM role_read_model r
   JOIN role_permission_read_model rp ON r.id = rp.role_id
   JOIN permission_read_model p ON rp.permission_code = p.code
   WHERE r.name = 'ROLE_ADMIN' AND p.code = 'CAN_USE_AI_CHAT';
   ```

3. **Verifica que el item de menú existe:**
   ```sql
   SELECT * FROM menu_item WHERE code = 'AI_CHAT_CMX';
   ```

4. **Verifica que el item está asociado al permiso:**
   ```sql
   SELECT mi.code, mip.permission_code
   FROM menu_item mi
   JOIN menu_item_permission mip ON mi.id = mip.menu_item_id
   WHERE mi.code = 'AI_CHAT_CMX';
   ```

5. **Reinicia la aplicación** para que el inicializador se ejecute nuevamente

### Error al iniciar la aplicación

Si hay un error en el inicializador, la aplicación debería iniciar normalmente (el error solo se registra en los logs). Sin embargo, los datos no se crearán automáticamente.

**Solución:** Ejecuta manualmente el script SQL de la migración V170 o habilita Flyway temporalmente.

## Configuración

El inicializador no requiere configuración adicional. Se ejecuta automáticamente al iniciar la aplicación.

**Para deshabilitar el inicializador** (no recomendado):
- Comenta o elimina la anotación `@Component` en `AIChatDataInitializer.java`

## Notas Importantes

1. **Flyway deshabilitado por defecto:** En `application.yml`, Flyway está deshabilitado por defecto (`spring.flyway.enabled:false`). El inicializador asegura que los datos se creen incluso en este caso.

2. **Idempotencia:** Tanto las migraciones como el inicializador son idempotentes. Pueden ejecutarse múltiples veces sin problemas.

3. **Producción:** En producción, se recomienda habilitar Flyway y ejecutar las migraciones durante el despliegue. El inicializador actúa como una red de seguridad.

4. **Orden de ejecución:** El inicializador se ejecuta después de `SecurityDataInitializer` para asegurar que los roles existan antes de asignar permisos.





