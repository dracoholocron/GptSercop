# Runbook – SERCOP V2 API

Pasos básicos para incidencias habituales. Ajustar según el entorno (K8s, Docker, bare metal).

## La API no arranca en producción

1. Si el proceso termina con mensaje sobre `JWT_SECRET`: en producción la API exige `JWT_SECRET` con al menos 16 caracteres. Definirlo en el Secret (K8s) o en las variables de entorno del despliegue.
2. Revisar logs de arranque (DB, Redis, variables obligatorias).

## Health / Ready caídos

1. **Comprobar API:** `curl -s http://localhost:3080/health` (o la URL del entorno).
2. Si responde `503` o "degraded":
   - **database:** revisar `DATABASE_URL`, que Postgres esté arriba y que el esquema esté aplicado (`npm run db:push` en dev).
   - **redis:** si se usa Redis, revisar `REDIS_URL` y que el servicio esté activo.
3. En Kubernetes: `kubectl get pods`, `kubectl logs deployment/sercop-api`, `kubectl describe pod <pod>`.

## Errores 5xx en la API

1. Revisar logs de la API (stdout/stderr o sistema de logs del cluster).
2. Comprobar conectividad a PostgreSQL y Redis desde el pod/nodo.
3. Si es 503 en login: verificar que `JWT_SECRET` esté definido y tenga al menos 16 caracteres.

## Fallos de autenticación (401)

1. Confirmar que el cliente envía `Authorization: Bearer <token>`.
2. Verificar que `JWT_SECRET` sea el mismo en todos los replicas y que no haya expirado el token (TTL 24h).
3. Ejecutar pruebas de seguridad: `npm run test:security`.

## Tablas y exportación (portales)

- Las pantallas con listados (procesos, usuarios, normativa, ofertas) deben ofrecer **filtros** (estado, fecha, entidad, etc.) según la documentación UX.
- Donde se requiera **exportación** (CSV/Excel): implementar botón de export y generar archivo desde los datos visibles o filtrados. Ver [Docs/ux-ui](Docs/ux-ui) y frontend guidelines (tablas con filtros y exportación).

## Base de datos (timeouts, conexiones)

1. Revisar uso de conexiones en Postgres y límites del pool (Prisma).
2. En K8s: comprobar que el Secret con `DATABASE_URL` esté correcto y que el servicio de BD sea accesible desde el pod.
3. Si hay migraciones pendientes: `npm run db:push` (dev) o aplicar migraciones en el pipeline de despliegue.

## Redis no disponible

1. Health devolverá "degraded" si Redis está configurado pero no responde.
2. Comprobar `REDIS_URL` y que el servicio Redis esté levantado y accesible.
3. La API puede seguir funcionando sin Redis si no se usa para sesiones/caché críticos; revisar uso en código.

## Documentos (upload/descarga) fallan

1. Verificar variables S3/MinIO: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`.
2. Comprobar que el bucket exista y que la API tenga permisos (en MinIO: consola en puerto 9001).
3. Revisar límites de tamaño (10 MB por archivo en la API).

## Rate limit (429)

1. Si hay Gateway (Nginx) con rate limit: revisar configuración (límite por IP/por ruta).
2. Ajustar límites en Ingress o en el Gateway según capacidad y SLA.

## Despliegue / imagen

1. En producción no usar imagen con tag `latest`. Usar tag de versión (ej. `v0.1.0`).
2. Tras actualizar imagen: `kubectl rollout status deployment/sercop-api` y revisar eventos: `kubectl get events`.
3. Rollback: `kubectl rollout undo deployment/sercop-api`.

---

*Referencia: [pre-production-checklist.md](pre-production-checklist.md), [README.md](README.md).*
