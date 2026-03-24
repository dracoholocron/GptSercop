# Manual Técnico – Plataforma SERCOP V2

**Versión:** 1.0  
**Fecha:** 2026  
**Público:** Desarrolladores, arquitectos y soporte técnico.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [API REST (Fastify)](#4-api-rest-fastify)
5. [Modelo de datos (Prisma)](#5-modelo-de-datos-prisma)
6. [Portales (Next.js)](#6-portales-nextjs)
7. [Autenticación y autorización](#7-autenticación-y-autorización)
8. [Almacenamiento y servicios auxiliares](#8-almacenamiento-y-servicios-auxiliares)
9. [Pruebas automatizadas](#9-pruebas-automatizadas)
10. [Referencias y documentación adicional](#10-referencias-y-documentación-adicional)

---

## 1. Arquitectura general

La plataforma sigue una arquitectura **monorepo** con:

- **Una API** central (Fastify) que expone REST en `/api/v1` y se conecta a PostgreSQL (Prisma), Redis (opcional) y MinIO/S3 (documentos).
- **Cuatro aplicaciones frontend** (Next.js): portal público, portal proveedor, portal entidad y portal administrador. Cada una consume la API vía cliente compartido (`@sercop/api-client`).
- **Componentes UI compartidos** en `@sercop/design-system` para mantener consistencia entre portales.

```
                    +------------------+
                    |   Nginx Gateway  |  (opcional, puerto 8080)
                    +--------+---------+
                             |
    +------------+------------+------------+------------+
    |            |            |            |            |
    v            v            v            v            v
+-------+  +----------+  +----------+  +--------+  +---------+
|Public |  | Supplier |  |  Entity  |  | Admin  |  |   API   |
|Portal |  |  Portal  |  |  Portal  |  | Portal |  | :3080   |
|:3010  |  |  :3012   |  |  :3013   |  | :3014  |  +----+----+
+-------+  +----------+  +----------+  +--------+       |
    |            |            |            |            |
    +------------+------------+------------+-------------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
        +----------+   +-----------+   +---------+
        |PostgreSQL|   |   Redis   |   | MinIO   |
        |  :5432   |   |  :6379    |   | :9000   |
        +----------+   +-----------+   +---------+
```

*[FIG: Diagrama de arquitectura – capas API, portales, base de datos, Redis y MinIO.]*

---

## 2. Stack tecnológico

| Componente      | Tecnología              | Versión / nota                          |
|-----------------|-------------------------|-----------------------------------------|
| Runtime         | Node.js                 | >= 20                                   |
| API             | Fastify                  | ^5.x                                    |
| ORM / DB        | Prisma + PostgreSQL     | Prisma 6, Postgres 16                   |
| Cache / colas   | Redis                    | Opcional (health, sesiones futuras)     |
| Almacenamiento  | AWS SDK S3–compatible   | MinIO en desarrollo                     |
| Frontend        | Next.js (App Router)    | Por aplicación                          |
| UI compartida   | React, design-system    | Componentes en `packages/design-system`  |
| Cliente API     | Fetch + wrappers        | `packages/api-client`                    |
| Pruebas E2E     | Playwright              | e2e/battery, e2e/*.spec.ts              |
| Contenedores    | Docker, Docker Compose  | Postgres, Redis, MinIO, API, gateway    |

---

## 3. Estructura del repositorio

```
gptSercop/
├── apps/
│   ├── api/                 # API Fastify (src/index.ts, prisma/)
│   ├── public-portal/       # Portal público (Next.js)
│   ├── supplier-portal/     # Portal proveedor
│   ├── entity-portal/       # Portal entidad
│   └── sercop-admin/        # Portal administrador
├── packages/
│   ├── design-system/       # Componentes React compartidos
│   └── api-client/         # Cliente API (login, tenders, providers, …)
├── e2e/                     # Pruebas Playwright (battery, admin, evidence)
├── infra/                   # Docker, K8s, gateway nginx
├── scripts/                 # start-all.js, smoke.js, crawler, etc.
├── Docs/                    # Documentación (este manual, brechas, backlog)
├── docker-compose.yml       # Postgres, Redis, MinIO, API, gateway, public-portal
├── package.json             # Workspaces npm (apps/*, packages/*)
└── .env.example             # Variables de entorno de ejemplo
```

---

## 4. API REST (Fastify)

### 4.1 Base URL y versión

- Base: `http://localhost:3080` (desarrollo). Prefijo de versión: `/api/v1`.
- Documentación interactiva: `GET /documentation` (Swagger UI). Especificación OpenAPI: `GET /openapi.json`.

### 4.2 Endpoints principales (resumen)

| Recurso              | Métodos    | Descripción                                      |
|----------------------|------------|--------------------------------------------------|
| /api/v1/tenders      | GET, POST  | Listado (filtros, paginación) y creación        |
| /api/v1/tenders/:id  | GET, PUT   | Detalle y actualización (draft)                  |
| /api/v1/tenders/:id/bids | GET, POST | Ofertas del proceso y envío de oferta        |
| /api/v1/tenders/:id/contract | GET, POST | Contrato adjudicado                         |
| /api/v1/tenders/:id/evaluations | GET, POST | Evaluaciones (puntajes)              |
| /api/v1/pac          | GET        | Planes anuales (PAC) por entidad/año             |
| /api/v1/pac/:id      | GET        | Detalle de un PAC                               |
| /api/v1/providers    | GET, POST  | Proveedores (RUP)                               |
| /api/v1/entities      | GET        | Entidades (público)                             |
| /api/v1/auth/login   | POST       | Login (email, role, identifier, entityId) → JWT |
| /api/v1/auth/reset-request  | POST | Solicitud recuperación contraseña (stub)  |
| /api/v1/auth/reset-confirm  | POST | Confirmación nueva contraseña (stub)       |
| /api/v1/documents/upload    | POST | Subida multipart (ownerType, ownerId, documentType) |
| /api/v1/rup/registration    | GET, PATCH | Borrador registro RUP (wizard pasos 1–8)  |
| /api/v1/sie/:tenderId/status | GET  | Estado subasta inversa                        |
| /api/v1/sie/:tenderId/initial | POST | Oferta económica inicial SIE                |
| /api/v1/sie/:tenderId/bids  | POST | Pujas SIE                                  |
| /api/v1/sie/:tenderId/negotiation/final | POST | Oferta final negociación SIE        |
| /api/v1/rag/search   | GET        | Búsqueda RAG (normativa)                        |
| /api/v1/rag/ask      | POST       | Pregunta RAG                                   |
| /api/v1/cpc/suggestions | GET     | Sugerencias CPC (códigos producto)             |
| /health, /ready      | GET        | Salud (DB, Redis) y listo para tráfico          |

Los métodos de escritura (POST/PUT/PATCH) en recursos protegidos requieren cabecera `Authorization: Bearer <JWT>`.

### 4.3 Validaciones de negocio (resumen)

- **Licitación / Licitación de obras:** Presupuesto referencial ≥ 10.000 USD; cronograma mínimo (art. 91/96) para preguntas y ofertas; ventana de convalidación 2–5 días; publicación resolución adjudicación ≤ 1 día.
- **SIE:** Presupuesto ≥ 10.000 USD; oferta de negociación ≤ 95% del referencial; puja debe mejorar la mejor oferta (409/422 si no mejora).
- **Licitación de obras:** `processType: licitacion_obras`; documento APU; evaluación con experiencia general/específica, subcontratación (15–30%, 5 pts), otros parámetros.
- **Patrimonio / SRI–IESS:** Validación de patrimonio para procesos > 500k; flags `isCompliantSRI`, `isCompliantIESS` en proveedor para elegibilidad.

Detalle en código: `apps/api/src/index.ts` y en documentos `Docs/brechas-licitacion-obras.md`, `Docs/brechas-sie-subasta-inversa.md`.

---

## 5. Modelo de datos (Prisma)

El esquema está en `apps/api/prisma/schema.prisma`. Entidades principales:

- **Entity:** Entidades contratantes (nombre, código).
- **User:** Usuarios (email, organización, rol implícito por uso).
- **Provider:** Proveedores (RUC, razón social, dirección, activityCodes, registrationStep, registrationData, patrimonyAmount, isCompliantSRI, isCompliantIESS, subcontractingPercentage, etc.).
- **ProcurementPlan:** Plan anual (PAC) por entidad y año.
- **Tender:** Proceso de contratación (título, estado, tipo de proceso, presupuesto, plazos, documentos: marketStudy, apuDocumentId, bidOpeningAct, etc.).
- **Bid:** Oferta (proveedor, monto, BAE, convalidación, RUP verificaciones, subcontractingPercentage).
- **Evaluation:** Evaluación de una oferta (technicalScore, financialScore, baeScore, nationalPartScore, experienceGeneralScore, experienceSpecificScore, subcontractingScore, otherParamsScore, totalScore).
- **Contract:** Contrato adjudicado (resolución, informe, fechas).
- **Document:** Documentos subidos (ownerType, ownerId, documentType, storageKey).
- **Auction / AuctionBid:** Subasta inversa (SIE): rondas, oferta inicial, pujas, negociación final.

Diagrama ER y comentarios detallados: ver `schema.prisma` y `Docs/expanded_foundation` si existe.

*[FIG: Diagrama ER simplificado – Entity, Plan, Tender, Bid, Evaluation, Contract, Provider, Document.]*

---

## 6. Portales (Next.js)

Cada portal es una app Next.js (App Router) que:

- Usa `NEXT_PUBLIC_API_URL` para apuntar a la API.
- Almacena el JWT en `localStorage` (claves: `sercop_supplier_token`, `sercop_entity_token`, `sercop_admin_token`) y opcionalmente `sercop_supplier_provider_id`, `sercop_entity_id`.
- Utiliza `@sercop/api-client` para llamadas (login, tenders, providers, PAC, documentos, SIE, RUP, etc.) y `@sercop/design-system` para Card, Button, Input, Select, etc.

Rutas principales por app:

- **public-portal:** `/`, `/procesos`, `/proceso/[id]`, `/normativa`, `/denuncias`, `/cifras`, `/servicios`, `/certificacion`, `/modelos-pliegos`, `/notificaciones`, `/enlaces`.
- **supplier-portal:** `/`, `/login`, `/registro`, `/procesos`, `/procesos/[id]`, `/procesos/[id]/oferta`, `/procesos/[id]/sie`, `/ofertas`, `/ofertas/[id]`, `/perfil`, `/normativa`.
- **entity-portal:** `/`, `/login`, `/procesos`, `/procesos/nuevo`, `/procesos/[id]/editar`, `/procesos/[id]/ofertas`, `/procesos/[id]/evaluaciones`, `/procesos/[id]/contrato`, `/procesos/[id]/aclaraciones`, `/pac`, `/pac/[id]`, `/catalogos`, `/ordenes-compra`, `/rendicion-cuentas`, `/reportes`, `/documentos`, `/normativa`.
- **sercop-admin:** `/`, `/procesos`, `/entidades`, `/denuncias`, `/reclamos`, `/usuarios`, `/auditoria`, `/normativa`, `/Parametros`, `/procesos/[id]/config-oferta`.

---

## 7. Autenticación y autorización

- **Login:** `POST /api/v1/auth/login` con cuerpo `{ email, role?, identifier?, entityId? }`. La API emite un JWT (HS256) con `sub` (email), `role` (supplier | entity | admin) y TTL 24 h. No se valida contraseña en el MVP actual (stub por email/rol).
- **Protección de rutas:** El plugin `authPlugin` en `apps/api/src/authPlugin.ts` verifica el Bearer token en todas las rutas no declaradas como públicas. Rutas públicas: health, ready, openapi, GET tenders (list/detail), GET pac, GET providers, GET entities, POST auth/login, RAG, analytics público.
- **Recuperación de contraseña:** Endpoints `reset-request` y `reset-confirm` implementados como stub (no persisten contraseñas ni envían correo). En producción se debe integrar IdP (OIDC) o servicio de correo y almacenamiento seguro de contraseñas.

---

## 8. Almacenamiento y servicios auxiliares

- **PostgreSQL:** Persistencia principal. Conexión vía `DATABASE_URL`. Migraciones: `prisma migrate`; sincronización rápida en dev: `prisma db push`. Seed: `tsx prisma/seed.ts`.
- **Redis:** Opcional. Si `REDIS_URL` está definido, el health incluye estado de Redis. Uso futuro: sesiones, rate limiting, colas.
- **MinIO/S3:** Documentos (upload). Variables: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`. Si no están definidas, `POST /documents/upload` responde 503. Tamaño máximo por archivo (multipart): 20 MB.

---

## 9. Pruebas automatizadas

- **Smoke:** `npm run smoke` — comprueba /health, /api/v1/tenders, /api/v1/pac, RAG/search, /ready.
- **Integración:** `npm run test:integration` — pruebas HTTP contra la API (workspace api).
- **Seguridad:** `npm run test:security` — verificación de 401 en rutas protegidas sin token.
- **E2E (batería):** `npm run test:e2e:battery` — Playwright sobre `e2e/battery/*.spec.ts` (chromium). Incluye: licitación, contenido, SIE, obras, navegación, público, proveedor, admin. Opción con seed previo: `npm run test:e2e:battery:full`.
- **Evidencia (screenshots):** `npm run evidence` — captura pantallas del admin (login, usuarios, normativa) y documentación API.

Los tests E2E pueden levantar automáticamente la API y los portales según `playwright.config.ts` (webServer). En local, es recomendable tener la API ya levantada y, si se desea, los portales para evitar timeouts.

---

## 10. Referencias y documentación adicional

| Documento                    | Ubicación                          | Contenido                               |
|-----------------------------|-------------------------------------|-----------------------------------------|
| README principal            | raíz del repo                      | Arranque rápido, scripts, CI             |
| API README                  | apps/api/README.md                 | Endpoints, DB, variables, pruebas       |
| Brechas Licitación de Obras | Docs/brechas-licitacion-obras.md   | Reglas obras, APU, subcontratación       |
| Brechas SIE                 | Docs/brechas-sie-subasta-inversa.md| Reglas SIE, puja, negociación 5%         |
| Backlog implementación     | Docs/BACKLOG_IMPLEMENTACION_SERCOP.md | Épicas y backlog sugerido             |
| Mapa SERCOP                 | Docs/MAPA_DETALLADO_SERCOP.md      | Formularios y campos legacy              |
| Infra / despliegue          | infra/README.md                    | Docker, Kubernetes, checklist           |
| Especificaciones            | Docs/03_technical_specs, 02_architecture | Arquitectura y especificaciones     |

---

*Este manual técnico describe el estado actual de la implementación. Para cambios recientes en endpoints o modelo de datos, revisar el código en `apps/api/src/index.ts` y `apps/api/prisma/schema.prisma`.*
