# Evidencia Fase 1 – API y modelo de datos

## Contenido implementado

- **GET /api/v1/users**: listado de usuarios con paginación (`limit`, `offset`) y filtro opcional `organizationId`. Protegido por token.
- **GET /api/v1/tenders**: paginación con `page` y `pageSize` (por defecto 10). Respuesta incluye `data`, `total`, `page`, `pageSize`.
- **CRUD /api/v1/rag/chunks**: GET list (paginación, filtros source/documentType), POST, GET :id, PUT :id, DELETE :id. Protegido por token. Auditoría en create/update/delete.
- **RagChunk**: campos opcionales `date`, `jurisdiction`, `version` añadidos al modelo (index_plan).

## Cómo reproducir

1. Levantar infra: `npm run docker:up`
2. Esquema y seed: `npm run db:setup`
3. Iniciar API: `JWT_SECRET=dev-secret-min-16-chars npm run dev` (en otra terminal)
4. Smoke: `npm run smoke`
5. Integración: `npm run test:integration --workspace=api`
6. Seguridad: `npm run test:security --workspace=api`

## Ejemplos de respuesta (para evidencia)

- **GET /api/v1/tenders?page=1&pageSize=10**: `{ "data": [...], "total": N, "page": 1, "pageSize": 10 }`
- **GET /api/v1/users** (con Authorization: Bearer \<token\>): `{ "data": [...], "total": N }`
- **GET /api/v1/rag/chunks** (con token): `{ "data": [...], "total": N }`
