# SERCOP V2 – GptSercop

Plataforma de contratación pública (V2.0) inspirada en el ecosistema SOCE/SERCOP. Monorepo Node.js con API Fastify, PostgreSQL, Redis y MinIO. Documentación en **[Docs](Docs/)**.

**Fecha de consolidación:** 2026-03-08

## Estructura del repositorio

```
gptSercop/
├── Docs/                    # Documentación (arquitectura, specs, roadmap)
├── apps/api/                # API Fastify (health, /api/v1/tenders, providers, …)
├── infra/                   # Docker, Kubernetes (base), ver [infra/README.md](infra/README.md)
├── apps/public-portal/      # Portal público (3001) – procesos + RAG
├── apps/supplier-portal/    # Portal proveedores (3002)
├── apps/entity-portal/      # Portal entidad (3003)
├── apps/sercop-admin/       # Admin (3004)
├── packages/design-system/ # Componentes React compartidos
├── packages/api-client/     # Cliente API
├── scripts/smoke.js         # Smoke test
├── docker-compose.yml       # Postgres, Redis, MinIO, API
├── .env.example
├── package.json             # Workspaces: apps/*, packages/*
└── README.md
```

## Arranque rápido

```bash
# Instalar dependencias
npm install

# Levantar toda la infra (Postgres 5432, Redis 6379, MinIO 9000/9001, API 3080)
npm run docker:up

# Crear esquema y datos de prueba (solo la primera vez, con los contenedores ya arriba)
# En PowerShell: $env:DATABASE_URL="postgresql://sercop:sercop@localhost:5432/sercop"
npm run db:setup

# Smoke test (comprueba /health, /api/v1/tenders, /api/v1/pac)
npm run smoke
```

Tras cambios en el schema (p. ej. Fase 1): `npm run db:generate` y `npm run db:push` (o `db:setup` para push + seed).

- **Health/Ready:** `GET /health` (DB + Redis), `GET /ready`
- **Tenders, Providers, PAC:** `GET/POST/PUT` en `/api/v1/tenders`, `/api/v1/providers`, `/api/v1/pac`
- **Documentos (Fase 4):** `POST /api/v1/documents/upload` (multipart), `GET /api/v1/documents?ownerType=&ownerId=`
- **Analítica:** `GET /api/v1/analytics/dashboard` (protegido)
- **RAG:** `GET /api/v1/rag/search?q=...`, `POST /api/v1/rag/ask` (normativa/manuales)
- **Auth:** `POST /api/v1/auth/login` con `{ "email", "role" }` → JWT. Rutas de escritura requieren `Authorization: Bearer <token>`. **Gateway:** `http://localhost:8080` (rate limit).

Para desarrollo local sin Docker: copia `.env.example` a `.env`, configura `DATABASE_URL`, ejecuta `npm run db:setup` y `npm run dev` (API en puerto **3080**).

**Reiniciar la API** tras cambios en el código: detener el proceso actual, ejecutar `npm run build --workspace=api` y volver a iniciar con `JWT_SECRET` y `DATABASE_URL`. Ver [docs/evidencia/README.md](docs/evidencia/README.md#reinicio-de-la-api-versión-nueva).

## Pruebas

- **Smoke:** `npm run smoke` — health, tenders, pac, rag/search, ready.
- **Integración:** `npm run test:integration` — pruebas HTTP contra la API.
- **Seguridad:** `npm run test:security` — auth (401 en rutas protegidas).
- **E2E Admin:** `npx playwright test e2e/admin.spec.ts --config=playwright.admin.config.ts` — levanta el admin en 3004 y prueba login, /usuarios, /normativa.
- **Evidencia (screenshots):** `npm run evidence` — levanta el admin si hace falta, captura login/usuarios/normativa y documentación API en `docs/evidencia/`. Requiere API en 3080.
- **Portales:** `npm run dev:public-portal` (3001), `dev:supplier-portal` (3002), etc.

**Verificación local (smoke + integración + seguridad):** Con la infra levantada (`npm run docker:up`), ejecutar `npm run db:setup`, luego en una terminal iniciar la API con `JWT_SECRET` (ej. `$env:JWT_SECRET="dev-secret-min-16-chars"; npm run dev`) y en otra ejecutar `npm run smoke`, `npm run test:integration` y `npm run test:security`.

**Importante:** Los portales hacen proxy de `/api` al backend. Debe tener la **API en ejecución** (`npm run dev`) para que registro, login y datos funcionen. Si ve "Failed to fetch", inicie la API primero.

**Datos de prueba:** `npm run db:seed` carga entidades, proveedores, PAC, procesos, ofertas y normativa RAG. Para crawler + seed: `npm run crawler:seed`. Para **100 registros por tipo** (OCDS + sintéticos) para pruebas del módulo IA: `npm run crawler:import`.

## CI y release

El workflow `.github/workflows/ci.yml` ejecuta build, smoke, integración, seguridad y **E2E del admin** en cada push/PR. En tags `v*` (ej. `v0.1.0`) construye y sube la imagen de la API a `ghcr.io/OWNER/sercop-api:VERSION`. En producción usar siempre una imagen etiquetada por versión (no `latest`); ver [infra/README.md](infra/README.md) y [infra/pre-production-checklist.md](infra/pre-production-checklist.md).

## Despliegue en Kubernetes

Manifiestos y pasos para GKE, EKS o AKS en **[infra/README.md](infra/README.md)**.

## Documentación

| Enlace | Contenido |
|--------|-----------|
| [Docs/](Docs/) | Índice de documentación |
| [Docs/02_architecture](Docs/02_architecture/) | Arquitectura propuesta |
| [Docs/03_technical_specs](Docs/03_technical_specs/) | Especificaciones técnicas |
| [Docs/04_devops](Docs/04_devops/) | DevOps, CI/CD |
| [Docs/roadmap](Docs/roadmap/) | Roadmap de desarrollo |
| [Docs/consolidated_pack](Docs/consolidated_pack/) | Pack consolidado: SOCE, arquitectura, stacks, UX/UI, RAG |
| [Docs/expanded_foundation](Docs/expanded_foundation/) | Expanded Foundation: docs 00–08, schema SQL, seeds, crawler, RAG, infra |
| [docs/evidencia](docs/evidencia/README.md) | Captura de evidencia (screenshots) y reinicio de la API |

## Estado del plan (Fases 0–5)

Implementado: Docker (Postgres, Redis, MinIO, API, Gateway), K8s base (Deployment, Service, Ingress, HPA), API con tenders/providers/PAC/bids/contracts, auth JWT, documentos (MinIO), analítica, RAG (full-text), 4 portales Next.js, crawler stub, CI (build, smoke, integración, seguridad), checklist pre-producción. Ver [infra/pre-production-checklist.md](infra/pre-production-checklist.md).
