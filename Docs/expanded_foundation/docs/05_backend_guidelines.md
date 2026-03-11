# Backend Guidelines

## Stack (implementación actual)

- **Fastify** (API REST)
- PostgreSQL
- Redis
- MinIO
- **OpenAPI**: la API expone `GET /openapi.json` y `GET /documentation` (Swagger UI)

## Reglas

- Módulos por dominio (rutas agrupadas por recurso)
- DTOs/validación en handlers
- Eventos de auditoría (audit_log)
- Versionado de API (`/api/v1/...`)

## Producción

- En producción se recomienda **IdP OIDC** (Keycloak, Auth0); la implementación actual usa JWT con login por email/rol.
