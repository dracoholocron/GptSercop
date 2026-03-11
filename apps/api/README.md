# API (SERCOP V2)

API Fastify conectada a PostgreSQL (Prisma). Endpoints públicos v1: tenders, providers. Ver [Docs/](../../Docs/).

## Desarrollo

Desde la raíz del monorepo:

```bash
npm install
npm run docker:up          # PostgreSQL + MinIO
cp .env.example .env       # y revisar DATABASE_URL
npm run db:setup           # crear tablas + seed
npm run dev
```

- Health: `GET http://localhost:3080/health` (DB + Redis si REDIS_URL); Ready: `GET /ready`
- Tenders: `GET/POST/PUT http://localhost:3080/api/v1/tenders`
- Providers: `GET/POST/PUT http://localhost:3080/api/v1/providers`
- Documentos (Fase 4): `POST /api/v1/documents/upload` (multipart: ownerType, ownerId, documentType, file); `GET /api/v1/documents?ownerType=&ownerId=`; `GET /api/v1/documents/:id` (incluye downloadUrl si S3 configurado)
- Analítica: `GET /api/v1/analytics/dashboard` (protegido; conteos tenders, providers, contracts, documents)
- RAG: `GET /api/v1/rag/search?q=...`; `POST /api/v1/rag/ask` (body: `{ question }`)

## Base de datos

- **Schema:** `apps/api/prisma/schema.prisma` (Entity, Provider, ProcurementPlan, Tender, Bid, Contract).
- **Comandos:** `npm run db:generate`, `npm run db:push`, `npm run db:seed`, `npm run db:setup` (desde raíz).

## Variables de entorno

En la raíz, `.env` con `DATABASE_URL`. Opcional: `JWT_SECRET`, `REDIS_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`. Ver `.env.example`.

## Pruebas

- Integración: `npm run test:integration --workspace=api` (API en marcha).
- Seguridad (Fase 4): `npm run test:security --workspace=api` (requiere JWT_SECRET para 401 en rutas protegidas).
