# Backlog sugerido de implementación (basado en reverse engineering SERCOP)

## Objetivo
Implementar una plataforma moderna compatible funcionalmente con los flujos detectados (auth, registro proveedor, productos CPC, indicadores y consultas), con mejor mantenibilidad, seguridad y trazabilidad.

## Épicas
1. Base de arquitectura y seguridad
2. Autenticación y gestión de sesión
3. Wizard de registro de proveedor
4. Motor de productos CPC
5. Indicadores financieros y validaciones
6. Módulo de consultas/reportes
7. QA, observabilidad y hardening

## Backlog detallado (priorizado)

### EPIC 1 — Arquitectura base
- [ ] Definir arquitectura (API + frontend + DB) y repositorios
- [ ] Implementar modelo de datos base (proveedor, direcciones, contactos, productos, indicadores)
- [ ] Configurar migraciones + seeds de catálogos (provincias, cantones, CPC, etc.)
- [ ] Estándar de auditoría por campo (quién/cómo/cuándo)

### EPIC 2 — Auth
- [ ] Implementar login con campos `txtRUCRecordatorio`, `txtLogin`, `txtPassword`
- [ ] Política de contraseñas moderna (reemplazar hash débil legacy)
- [ ] Gestión de sesión única opcional (caso usuario duplicado)
- [ ] Recuperación de contraseña (RUC + correo + fecha)

### EPIC 3 — Wizard Registro (FO pasos 1–8)
- [ ] Paso 1: términos/consentimiento
- [ ] Paso 2: credenciales + tipo persona/origen
- [ ] Paso 3: información del proveedor (natural/jurídica)
- [ ] Paso 4: dirección y teléfonos
- [ ] Paso 5: gremios/afiliaciones
- [ ] Paso 6: contactos
- [ ] Paso 7: productos CPC
- [ ] Paso 8: indicadores
- [ ] Guardado incremental + reanudación por borrador

### EPIC 4 — Motor CPC
- [ ] Búsqueda por palabra clave/sinónimos
- [ ] Navegador jerárquico de clasificador
- [ ] Multi-selección y eliminación
- [ ] Normalización de payload (evitar hidden serializados tipo `txtArreglo*`)

### EPIC 5 — Indicadores
- [ ] Campos de facturación, activos, pasivos, patrimonio, empleados, exportación
- [ ] Reglas de negocio y consistencia financiera
- [ ] Validaciones por año fiscal y cumplimiento

### EPIC 6 — Consultas/Reportes
- [ ] PAC, Ínfimas, Certificados, Convenios
- [ ] Filtros dinámicos + paginación
- [ ] Exportaciones (CSV/PDF)

### EPIC 7 — Calidad y operación
- [ ] Suite de pruebas (unitarias, integración, e2e wizard completo)
- [ ] Monitoreo/alertas y trazas de errores por formulario/campo
- [ ] Seguridad: CSRF, rate limit, captcha configurable, control de sesiones
- [ ] Performance: cache de catálogos y queries de búsqueda

## Roadmap sugerido
- **Sprint 1:** Epic 1 + Epic 2
- **Sprint 2:** Wizard pasos 1–4
- **Sprint 3:** Wizard pasos 5–8 + CPC
- **Sprint 4:** Consultas/reportes + QA + hardening

## Criterios de Done global
- [ ] Todos los campos detectados en la matriz tienen representación en modelo/API/UI
- [ ] Validaciones de negocio equivalentes o mejores a legacy
- [ ] Flujos críticos e2e pasan (login + registro + CPC + indicadores + consulta)
- [ ] Documentación técnica y operativa actualizada
