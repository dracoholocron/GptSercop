# GPTsercop — Engineering Standards & Conventions

> **Propósito:** Documento de referencia vivo para todos los proyectos derivados de GPTsercop.  
> Cubre arquitectura, código, seguridad, UX/UI, APIs, base de datos, testing e integraciones.  
> Las reglas de Cursor correspondientes viven en `.cursor/rules/`.

---

## Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Código](#3-estructura-del-código)
4. [Diseño de APIs REST](#4-diseño-de-apis-rest)
5. [Base de Datos & ORM](#5-base-de-datos--orm)
6. [Seguridad](#6-seguridad)
7. [UI / UX](#7-ui--ux)
8. [Testing](#8-testing)
9. [Integraciones](#9-integraciones)
10. [Configuración & Entornos](#10-configuración--entornos)
11. [CI/CD & Infraestructura](#11-cicd--infraestructura)
12. [Convenciones de Código](#12-convenciones-de-código)
13. [Git & Pull Requests](#13-git--pull-requests)
14. [Checklist de Nueva Feature](#14-checklist-de-nueva-feature)

---

## 1. Arquitectura General

### Patrón de referencia

GPTsercop es un **monorepo híbrido** con dos stacks coexistentes:

| Stack | Propósito | Estado |
|-------|-----------|--------|
| `apps/api` (Fastify + Node) | Backend activo de GPTsercop (AI, RAG, OCDS) | **Activo** |
| `sercop-unified/backend-java` (Spring Boot) | Backend enterprise, CQRS, Kafka | **Activo (UX oficial)** |
| `sercop-unified/frontend` (Vite + React) | Frontend oficial de producción | **Activo** |
| `apps/*-portal` (Next.js) | Portales legacy | **Deprecado** |

### Principios de diseño

- **Ports & Adapters** para integraciones externas (AI, storage, OCDS) — define interfaz, luego implementación
- **Thin routes** — los handlers de ruta delegan en clases de servicio
- **CQRS** en el stack Java (comandos y queries segregados)
- **Event-driven** para operaciones asíncronas (Kafka en Java, Redis pub/sub en Node cuando aplica)
- **API-first** — OpenAPI definido antes de implementar

### Flujo de datos

```
Cliente (Browser)
  → Nginx Gateway (rate limit: 30 r/s, burst 20)
    → apps/api (Fastify :3080) ← Redis (cache/health)
      → PostgreSQL (Prisma)
      → MinIO/S3 (documentos)
      → OpenAI API (análisis AI, cuando habilitado)
      → OCDS API (datos compras públicas)
```

---

## 2. Stack Tecnológico

### Node / GPTsercop API

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | ≥ 20 |
| Framework | Fastify | 5.x |
| Lenguaje | TypeScript | 5.6, `NodeNext` modules, `strict: true` |
| ORM | Prisma | 6.x |
| Base de datos | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Storage | MinIO / AWS S3 SDK | v3 |
| Test runner | Vitest + Node test | - |
| E2E | Playwright | - |

### Frontend oficial

| Componente | Tecnología |
|-----------|-----------|
| Build tool | Vite 7 |
| Framework | React 19 |
| UI Library | Chakra UI 3 + Emotion |
| Router | react-router-dom 7 |
| i18n | i18next |
| Charts | Recharts |
| Realtime | @microsoft/signalr |
| Seguridad | DOMPurify |
| Tests | Vitest + Testing Library |

### Java / Enterprise Backend

| Componente | Tecnología |
|-----------|-----------|
| Framework | Spring Boot 3.2, Java 21 |
| ORM | Spring Data JPA + Flyway |
| Messaging | Spring Kafka |
| Seguridad | Spring Security, OAuth2, MFA |
| Drivers | PostgreSQL, MySQL |
| Clouds | AWS, GCP, Azure (perfiles) |

### Infraestructura

| Componente | Tecnología |
|-----------|-----------|
| Gateway | Nginx |
| Contenedores | Docker + Docker Compose |
| Orquestación | Kubernetes (manifests en `infra/k8s/`) |
| IaC | Terraform (skeleton en `infra/terraform/`) |
| CI/CD | GitHub Actions |

---

## 3. Estructura del Código

### Monorepo (`apps/api`)

```
apps/api/src/
  index.ts              → Entry point: registra plugins, middlewares, rutas
  modules/
    <domain>/
      routes.ts         → FastifyPluginAsync, prefix /api/v1/<domain>/
      service.ts        → Lógica de negocio (no HTTP)
      types.ts          → Tipos/interfaces del dominio
  plugins/
    authPlugin.ts       → Middleware JWT global + allowlist de rutas públicas
  openapi.ts            → Spec OpenAPI 3 (fuente única de verdad)
  db.ts                 → Singleton PrismaClient
  redis.ts              → Singleton Redis client
  storage.ts            → S3/MinIO client
  rag.ts                → Full-text search + chunking
  audit.ts              → Registro de auditoría
```

### Frontend (`sercop-unified/frontend/src/`)

```
pages/                  → Componentes de ruta (thin, delegan a components/)
  cp/                   → Compras Públicas / AI
  client/               → Portal cliente
components/             → Componentes reutilizables
services/               → Llamadas a la API (nunca fetch() directo en componentes)
realtime/               → Providers WebSocket / SignalR
theme.ts                → Tokens de Chakra (colores, tipografía)
styles/                 → CSS global mínimo
utils/
  apiClient.ts          → Cliente HTTP base (con auth headers)
```

---

## 4. Diseño de APIs REST

### Convenciones de URL

```
GET    /api/v1/{recursos}              → lista paginada
GET    /api/v1/{recursos}/:id          → detalle
POST   /api/v1/{recursos}              → crear
PUT    /api/v1/{recursos}/:id          → actualizar completo
PATCH  /api/v1/{recursos}/:id          → actualizar parcial
DELETE /api/v1/{recursos}/:id          → eliminar
POST   /api/v1/{recursos}/:id/{accion} → acción de dominio
```

- Recursos en **kebab-case plural**: `/tender-items`, `/procurement-processes`
- Siempre versionar bajo `/api/v1/`
- Acciones de dominio como sustantivos: `/analyze`, `/award`, `/publish`

### Formas de respuesta

```typescript
// Lista paginada
{
  data: T[],
  total: number,
  page: number,
  pageSize: number
}

// Recurso único
{ data: T }

// Error (nunca exponer stack traces en producción)
{
  error: string,       // mensaje legible
  code: string,        // código de error en mayúsculas: TENDER_NOT_FOUND
  statusCode: number
}
```

### Códigos HTTP

| Situación | Código |
|-----------|--------|
| Éxito GET/PUT/PATCH | 200 |
| Recurso creado | 201 |
| Sin contenido | 204 |
| Validación fallida | 400 |
| No autenticado | 401 |
| Sin permisos | 403 |
| No encontrado | 404 |
| Conflicto | 409 |
| Servicio no disponible | 503 |

### Paginación

- Query params: `?page=1&pageSize=20`
- `pageSize` default: 20, máximo: 100
- Siempre devolver `total` para que el cliente calcule páginas

### Validación de entrada

```typescript
// Siempre definir JSON Schema en la ruta
fastify.post('/api/v1/tenders', {
  schema: {
    body: {
      type: 'object',
      required: ['title', 'budget'],
      properties: {
        title: { type: 'string', minLength: 3, maxLength: 255 },
        budget: { type: 'number', minimum: 0 },
      },
    },
  },
  handler: async (request, reply) => { ... },
});
```

### OpenAPI

- Cada ruta tiene entrada en `src/openapi.ts` antes de implementarse
- Incluir: `summary`, `tags`, `parameters`, `requestBody`, `responses` (200, 400, 401, 500)
- Tags estándar: `auth`, `tenders`, `providers`, `analytics`, `ai`, `documents`, `health`

---

## 5. Base de Datos & ORM

### Prisma (Node API)

**Convenciones de schema:**

```prisma
model Tender {
  id          String       @id @default(cuid())   // siempre cuid(), no autoincrement
  title       String
  budget      Decimal      @db.Decimal(18, 2)     // Decimal para dinero
  status      TenderStatus @default(DRAFT)
  deletedAt   DateTime?                            // soft delete
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt              // siempre presente
}
```

**Reglas:**
- PKs con `cuid()` — portable, URL-safe, no secuencial
- Monetarios con `Decimal(18,2)` — nunca `Float` o `Double`
- Soft deletes con `deletedAt DateTime?` + filtro `where: { deletedAt: null }`
- Siempre `createdAt` + `updatedAt` en cada modelo

**Flujo de migraciones:**

```bash
# Desarrollo (iterativo, sin historial)
npx prisma db push

# Producción (migración con historial)
npx prisma migrate dev --name describe_the_change
npx prisma migrate deploy   # En CI/CD
```

**Transacciones:**

```typescript
// Múltiples escrituras relacionadas → siempre en transacción
await db.$transaction([
  db.tender.update({ where: { id }, data: { status: 'AWARDED' } }),
  db.auditLog.create({ data: { action: 'AWARD', entityId: id, userId } }),
]);
```

**SQL raw (solo lectura):**

```typescript
// Solo para full-text search con PostgreSQL tsvector
const results = await db.$queryRawUnsafe(
  `SELECT id, title FROM tenders, plainto_tsquery('spanish', $1) q
   WHERE search_vector @@ q LIMIT $2`,
  searchTerm,  // NUNCA interpolación de strings
  limit,
);
```

### Spring Data JPA (Java)

- Una interfaz Repository por aggregate root
- Flyway para TODOS los cambios de esquema
- **Nunca** `ddl-auto=update` en producción
- `@Where(clause = "deleted = false")` para soft deletes
- Profiles para multi-datasource: `application-prod.yml`, `application-gcp.yml`, etc.

---

## 6. Seguridad

### Autenticación (JWT)

- Algoritmo: **HS256**, TTL: **24h**
- `JWT_SECRET` mínimo **16 caracteres**
- Si falta `JWT_SECRET` y `AUTH_DISABLED != true` → responder **503** `AUTH_NOT_CONFIGURED`
- `AUTH_DISABLED=true` **SOLO en desarrollo local** — producción lo rechaza en `index.ts`

**Roles:** `public | supplier | entity | admin`

```typescript
// Verificación de rol en handler
if (!['admin', 'entity'].includes(request.user.role)) {
  throw fastify.httpErrors.forbidden('Insufficient permissions');
}
```

### Allowlist de rutas públicas

Definir explícitamente en `authPlugin.ts`. Todo lo no listado requiere Bearer token:

```typescript
const PUBLIC_ROUTES = [
  { method: 'GET',  path: '/api/v1/health' },
  { method: 'POST', path: '/api/v1/auth/login' },
  { method: 'GET',  path: '/api/v1/tenders' },
  // Agregar aquí nuevas rutas públicas
];
```

### Headers de seguridad HTTP

Configurar en hook `onSend` de Fastify y en Nginx:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### CORS

- Producción: `CORS_ALLOWED_ORIGINS` (lista explícita, sin wildcards para credenciales)
- Desarrollo: `origin: true` solo vía env flag
- **Nunca** commitear `origin: '*'` para builds de producción

### Secretos y credenciales

- Todos los secretos en **variables de entorno**
- `.env.example` como única referencia en el repositorio
- **Gitleaks** corre en cada PR (`.gitleaks.toml`) — no suprimir alertas legítimas
- Nunca loguear secrets, tokens ni contraseñas
- Documentos en MinIO/S3 siempre con **URLs pre-firmadas** (TTL: 15 minutos)

### Validación y sanitización

- Validar TODOS los inputs con JSON Schema en Fastify antes de procesarlos
- Sanitizar HTML con **DOMPurify** en el frontend
- Consultas parametrizadas — nunca interpolación de strings en SQL
- Auditar todas las escrituras a entidades sensibles (`audit.ts`)

### Dependencias

```bash
npm audit --audit-level=high  # Antes de cada release
```

Vulnerabilidades HIGH/CRITICAL deben resolverse antes de merge a `main`.

---

## 7. UI / UX

### Principios generales

1. **Mobile-first** — diseñar para 375px primero, luego expandir
2. **Accesibilidad WCAG AA** — contraste mínimo 4.5:1, navegación por teclado
3. **Internacionalización (i18n)** — toda cadena visible al usuario vía `i18next`
4. **Progressive Disclosure** — mostrar información compleja en pasos
5. **Feedback inmediato** — estados de carga, error y éxito en cada acción asíncrona

### Componentes y estructura

```tsx
// ✅ Componente correcto: funcional, tipado, exportación nombrada
interface TenderCardProps {
  tenderId: string;
  title: string;
  budget: number;
  onSelect: (id: string) => void;
}

export const TenderCard: React.FC<TenderCardProps> = ({ tenderId, title, budget, onSelect }) => (
  <Box p={4} borderRadius="md" cursor="pointer" onClick={() => onSelect(tenderId)}
       _hover={{ shadow: 'md' }} transition="box-shadow 0.2s">
    <Text fontWeight="bold">{title}</Text>
    <Text color="gray.500">{formatCurrency(budget)}</Text>
  </Box>
);
```

**Reglas:**
- Exportaciones **nombradas** (no default exports) para componentes
- Props siempre con interfaz TypeScript explícita
- Componentes en `components/` son presentacionales — sin llamadas a API
- Lógica de negocio en hooks custom o servicios

### Tokens de diseño (Chakra Theme)

```typescript
// theme.ts — fuente única de verdad
const theme = extendTheme({
  colors: {
    brand: {
      primary: '#0052CC',
      secondary: '#00875A',
      danger: '#DE350B',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
});

// ✅ Usar siempre tokens del tema
<Text color="brand.primary">         // ✅
<Text color="#0052CC">               // ❌ — hardcode
```

### Llamadas a la API desde el frontend

```typescript
// ✅ Solo a través de services/
import { tenderService } from '../services/tenderService';

const { data, isLoading, error } = useTenders({ page: 1 });

// services/tenderService.ts
export const tenderService = {
  list: (params: ListParams) => apiClient.get('/api/v1/tenders', { params }),
  detail: (id: string) => apiClient.get(`/api/v1/tenders/${id}`),
};

// ❌ Nunca fetch() directo en componentes
```

### Estados de UI obligatorios

Toda operación asíncrona debe mostrar:

| Estado | UX |
|--------|-----|
| Cargando | Spinner o Skeleton (no pantalla en blanco) |
| Error | Mensaje descriptivo + opción de reintentar |
| Vacío | Mensaje de estado vacío con call-to-action |
| Éxito | Confirmación visual (toast, checkmark) |

### Responsive Design

```tsx
// Sintaxis de arrays de Chakra para responsive
<Text fontSize={['sm', 'md', 'lg']}>   {/* mobile, tablet, desktop */}
<Grid templateColumns={['1fr', '1fr 1fr', 'repeat(3, 1fr)']}>
```

Puntos de quiebre estándar: 375px / 768px / 1280px / 1440px

### Accesibilidad (a11y)

- `aria-label` en todos los botones de icono
- `role` semántico correcto (`button`, `navigation`, `main`, `dialog`)
- Focus visible — nunca `outline: none` sin reemplazarlo
- Orden de tabulación lógico
- Imágenes con `alt` descriptivo
- Formularios con `<label>` asociado a cada input

---

## 8. Testing

### Pirámide de testing

```
         /\
        /E2E\          → Journeys críticos del usuario (Playwright)
       /------\
      / Integr \       → Rutas API con DB real de test
     /----------\
    / Unit Tests \     → Servicios, utilidades, componentes
   /--------------\
```

### Tests unitarios e integración (Vitest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TenderService.list', () => {
  it('pagina correctamente y devuelve total', async () => {
    const mockDb = { tender: { findMany: vi.fn().mockResolvedValue([...]) } };
    const svc = new TenderService(mockDb as any);
    const result = await svc.list({ page: 2, pageSize: 10 });
    expect(result.data).toHaveLength(10);
    expect(result.total).toBeGreaterThan(0);
  });

  it('lanza error si página < 1', async () => {
    await expect(svc.list({ page: 0 })).rejects.toThrow('INVALID_PAGE');
  });
});
```

**Cobertura mínima:**

| Capa | Mínimo |
|------|--------|
| Servicios / utilidades | 80% |
| Route handlers | 70% |
| Componentes React | 60% |

### E2E con Playwright

```typescript
test('proveedor puede buscar y ver detalle de licitación', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar licitación' }).fill('construcción vial');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByTestId('tender-list')).toBeVisible();
  await page.getByTestId('tender-list').getByRole('link').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

**Selectores en orden de preferencia:**
1. `getByRole` + accessible name
2. `getByLabel`
3. `getByTestId`
4. CSS selector (último recurso)

### Reglas de testing

- Usar **base de datos de test separada** — nunca contra dev/prod
- Mockear HTTP externo con `vi.mock` o MSW — tests no dependen de red
- Testear rutas de error, no solo happy path
- No `test.skip` en tests fallidos — arreglar o eliminar
- Smoke test (`npm run smoke`) post-deploy como gate de producción

---

## 9. Integraciones

### AI / OpenAI

**Patrón Adapter (obligatorio):**

```typescript
// Siempre definir interfaz antes de implementar
interface GptAnalysisPort {
  analyze(context: TenderContext): Promise<AnalysisResult>;
}

// Implementación real (cuando AI_MODE=openai)
class OpenAIAdapter implements GptAnalysisPort { ... }

// Implementación mock (cuando AI_MODE=mock o para tests)
class MockGptAdapter implements GptAnalysisPort {
  async analyze() { return { summary: 'Mock', riskScore: 0.0 }; }
}

// Factory según env
const gptAdapter: GptAnalysisPort =
  process.env.AI_MODE === 'openai' ? new OpenAIAdapter() : new MockGptAdapter();
```

**Variables de entorno de control:**

```bash
AI_ENABLED=true          # Master switch
RAG_ENABLED=true         # Full-text search
AI_MODE=mock|openai      # mock para dev/test sin costo
OPENAI_API_KEY=sk-...    # Requerido en modo openai
```

### RAG (Retrieval-Augmented Generation)

- Búsqueda full-text contra PostgreSQL `tsvector` en español
- Endpoint: `GET /api/v1/rag/search?q=...`
- Configuración de chunks en `rag.ts` — no en archivos de rutas
- Frontend lo consume condicionado por `VITE_ENABLE_CP_API`

### OCDS / Compras Públicas

```typescript
// Patrón de importación idempotente
await db.tender.upsert({
  where: { ocdsId: release.id },
  update: mapOcdsToTender(release),
  create: { ocdsId: release.id, ...mapOcdsToTender(release) },
});
// Loguear cada importación en auditLog
```

- URL de fuente en `CRAWLER_OCDS_URL` — nunca hardcodeada
- Validar schema OCDS antes de insertar

### Object Storage (MinIO / S3)

```typescript
// Siempre URLs pre-firmadas, nunca URLs directas al bucket
const presignedUrl = await getSignedUrl(s3,
  new GetObjectCommand({ Bucket: S3_BUCKET, Key: documentKey }),
  { expiresIn: 900 }  // 15 minutos
);
```

### Servicios externos — Patrón estándar

```typescript
// Timeout + retry para cualquier llamada externa
const result = await withRetry(
  () => externalApi.call(params),
  { retries: 3, timeout: 10_000, backoff: 'exponential' }
);
```

- Timeout máximo: 10 segundos en servicios síncronos
- Loguear metadata de request/response (sin PII)
- Circuit breaker para integraciones de alto volumen

---

## 10. Configuración & Entornos

### Variables de entorno (`.env.example` como contrato)

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/sercop

# Cache
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=min-16-chars-required-here
AUTH_DISABLED=false                        # Solo true en local dev

# CORS
CORS_ALLOWED_ORIGINS=https://app.sercop.gob.ec,https://portal.sercop.gob.ec

# AI
AI_ENABLED=false
RAG_ENABLED=false
AI_MODE=mock
OPENAI_API_KEY=

# Storage
S3_BUCKET=sercop-documents
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Data crawler
CRAWLER_OCDS_URL=

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:3080
VITE_ENABLE_CP_API=false
```

### Reglas de configuración

- Nunca commitear `.env` con valores reales
- `.env.example` es el contrato — actualizar al agregar nuevas variables
- Validar variables críticas al inicio de la aplicación:

```typescript
// index.ts — al arrancar
if (!process.env.JWT_SECRET && process.env.AUTH_DISABLED !== 'true') {
  console.error('FATAL: JWT_SECRET not set');
  process.exit(1);
}
```

- Perfils en Java: `default` → `dev` → `staging` → `prod`

---

## 11. CI/CD & Infraestructura

### GitHub Actions

| Workflow | Trigger | Checks |
|----------|---------|--------|
| `ci.yml` | PR a `main`/`develop` | build, unit tests, lint |
| `e2e.yml` | PR a `main` | Playwright admin suite |
| `release.yml` | Tag `v*` | build, push GHCR, deploy |
| `security.yml` | PR + cron | Gitleaks, `npm audit` |

### Docker

```bash
# Build y levantar stack completo
docker compose up -d

# Servicios: postgres:5432, redis:6379, minio:9000, api:3080, gateway:80
```

- Imagen de producción de `apps/api`: build multi-stage en `apps/api/Dockerfile`
- Gateway Nginx: `infra/gateway/`

### Nginx Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req zone=api burst=20 nodelay;
```

- Ajustar según carga real; documentar cambios en `infra/runbook.md`

### Pre-deploy Checklist

Ver `infra/pre-production-checklist.md` para checklist completo. Puntos críticos:

- [ ] `npm audit` sin HIGH/CRITICAL
- [ ] Migraciones de Prisma aplicadas (`migrate deploy`)
- [ ] Variables de entorno de producción configuradas
- [ ] `AUTH_DISABLED=false`
- [ ] JWT_SECRET ≥ 16 chars y rotado si es nuevo deploy
- [ ] Smoke test pasado contra staging
- [ ] Monitoring activo (`infra/monitoring.md`)

---

## 12. Convenciones de Código

### TypeScript / Node

```typescript
// Nombres
const myVariable = 'camelCase';             // variables y funciones
class MyService {}                          // clases: PascalCase
interface MyProps {}                        // interfaces: PascalCase
const MY_CONSTANT = 'SCREAMING_SNAKE';     // constantes globales
type TenderId = string;                    // type aliases: PascalCase

// Módulos: ESM siempre
import { something } from './module.js';   // extensión .js para ESM
export { MyService };                       // exportaciones nombradas

// Async/await siempre (no .then().catch())
const data = await service.getData();

// Errores tipados
class TenderNotFoundError extends Error {
  constructor(id: string) {
    super(`Tender ${id} not found`);
    this.name = 'TenderNotFoundError';
  }
}
```

### Logging

```typescript
// ✅ Log estructurado vía request.log (Fastify) o pino
request.log.info({ tenderId, userId }, 'Tender awarded');
request.log.error({ err, tenderId }, 'Failed to award tender');

// ❌ Nunca console.log en producción
// ❌ Nunca loguear passwords, tokens, ni PII
```

### Comentarios

- Solo comentar el **porqué**, no el qué
- JSDoc en funciones públicas de servicios y utilitarios
- TODO con ticket: `// TODO(#123): Migrar a OpenAI Assistants API`

### Java / Spring

- Nombre de paquetes: `com.globalcmx.api.<bounded-context>`
- Usar Lombok (`@Data`, `@Builder`, `@RequiredArgsConstructor`) para reducir boilerplate
- Controllers thin — delegar en `@Service`
- DTOs separados de entidades JPA (nunca exponer entidades directamente en REST)

---

## 13. Git & Pull Requests

### Branching

```
main          → Producción (protegida, requiere PR + review)
develop       → Integración (protegida)
feature/<ticket>-descripcion  → Nueva funcionalidad
fix/<ticket>-descripcion      → Bugfix
hotfix/<ticket>-descripcion   → Fix urgente en producción
```

### Commits (Conventional Commits)

```
feat(tenders): add CSV export endpoint
fix(auth): handle expired JWT gracefully
chore(deps): update prisma to 6.2.0
docs(api): add OpenAPI entry for analytics endpoint
test(e2e): add tender search playwright spec
refactor(rag): extract chunk size config to env var
```

### Pull Requests

Seguir plantilla en `PULL_REQUEST.md`:

- **Descripción**: qué cambia y por qué
- **Tipo**: feat / fix / chore / refactor / test
- **Checklist**: tests, lint, docs, seguridad, migrations
- **Screenshots**: obligatorio para cambios de UI
- Mínimo **1 reviewer** para `develop`, **2** para `main`
- CI debe pasar antes de merge

### Revisión de código

Prioridades en review:
1. Seguridad (autenticación, validación, secretos)
2. Corrección lógica
3. Rendimiento (queries N+1, índices faltantes)
4. Tests
5. Estilo / convenciones

---

## 14. Checklist de Nueva Feature

### Backend (Fastify API)

- [ ] Crear `apps/api/src/modules/<domain>/routes.ts`
- [ ] Registrar plugin en `src/index.ts`
- [ ] Agregar entrada OpenAPI en `src/openapi.ts`
- [ ] Definir JSON Schema de validación en la ruta
- [ ] Agregar rutas públicas al allowlist en `authPlugin.ts`
- [ ] Crear modelo Prisma + migración si hay nuevo entity
- [ ] Implementar auditoría en escrituras sensibles (`audit.ts`)
- [ ] Tests unitarios del servicio (≥80% cobertura)
- [ ] Tests de integración de la ruta
- [ ] Tests de seguridad (acceso no autorizado)

### Frontend (Vite + React)

- [ ] Crear servicio en `services/<feature>Service.ts`
- [ ] Componentes en `components/` o `pages/` según aplique
- [ ] Strings i18n en archivos de traducción
- [ ] Estados: loading, error, empty, success
- [ ] Responsive: probar 375px / 768px / 1280px
- [ ] a11y: roles, labels, contraste
- [ ] Tests de componente con Vitest + Testing Library
- [ ] Spec E2E del journey crítico

### Infraestructura

- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Actualizar `docker-compose.yml` si hay nuevo servicio
- [ ] Variables de producción configuradas en secrets del CI
- [ ] Runbook actualizado si hay nueva dependencia operacional

---

*Última actualización: Generado automáticamente a partir de la arquitectura del proyecto GPTsercop.*  
*Para sugerencias o actualizaciones, abrir un PR con el label `docs/standards`.*
