# Checklist pre-producción SERCOP V2

Revisar antes de desplegar a producción.

## Seguridad

- [ ] `JWT_SECRET` definido (mín. 16 caracteres) y no expuesto en repositorio
- [ ] Secretos (DATABASE_URL, REDIS_URL, S3_*) en Secret/gestor de secretos (no en ConfigMap ni en código)
- [ ] Rutas protegidas exigiendo token; pruebas de seguridad (`npm run test:security`) pasando
- [ ] Headers de seguridad activos (X-Content-Type-Options, X-Frame-Options); TLS en tránsito
- [ ] Rate limit en gateway/Ingress configurado
- [ ] Auditoría (audit_log) operativa y revisable

## Base de datos y almacenamiento

- [ ] PostgreSQL en producción con backups automáticos y punto de recuperación
- [ ] `DATABASE_URL` apunta a instancia de producción (no a localhost en el pod)
- [ ] Migraciones/Prisma aplicadas; seeds solo si corresponde
- [ ] Redis (si se usa) con persistencia y alta disponibilidad según necesidad
- [ ] MinIO/S3 para documentos con política de retención y acceso restringido

## API y servicios

- [ ] Health (`/health`) y readiness (`/ready`) usados por probes en K8s
- [ ] Imagen de la API etiquetada por versión (no `latest` en producción)
- [ ] Variables de entorno de producción documentadas (`.env.example` actualizado)
- [ ] Límites de recursos (CPU/memoria) definidos en Deployment; HPA si aplica

## Red y exposición

- [ ] Ingress/LoadBalancer con host y TLS (cert-manager o certificado válido)
- [ ] CORS configurado para dominios de los portales (no `origin: true` en producción si es restrictivo)
- [ ] `NEXT_PUBLIC_API_URL` (portales) apuntando a la URL pública de la API

## Observabilidad y operación

- [ ] Logs centralizados o accesibles (stdout/stderr recogidos por el cluster)
- [ ] Alertas básicas (ej. salud del deployment, errores 5xx)
- [ ] Documentación de runbook o pasos para incidencias → ver [infra/runbook.md](runbook.md)

## Pruebas y release

- [ ] CI (build + smoke + integración + seguridad) en verde para la rama a desplegar
- [ ] Smoke ejecutado contra el entorno de staging/preproducción antes de producción
- [ ] E2E (admin y/o public-portal) pasando localmente o en CI según corresponda
- [ ] Versión o tag de release anotado (changelog o tag git)

## Cumplimiento y datos

- [ ] Tratamiento de datos personales alineado con política de privacidad y normativa
- [ ] Documentos y metadatos RAG con fuentes y licencias correctas

---

*Referencia: plan de implementación SERCOP V2 (Fase 0–5).*
