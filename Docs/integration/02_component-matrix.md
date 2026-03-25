# Matriz de componentes (KEEP / REFactor / MERGE / DROP)

## Keep (base de compras publicas)

- `apps/api/src/modules/tenders`
- `apps/api/src/modules/providers`
- `apps/api/src/modules/pac`
- `apps/api/src/modules/offers`
- `apps/api/src/modules/contracts`
- `apps/api/src/modules/auth`
- `apps/api/src/modules/observability`
- `apps/public-portal`
- `apps/supplier-portal`
- `apps/entity-portal`
- `apps/sercop-admin`
- `packages/api-client`
- `packages/design-system`

## Refactor (deuda tecnica con valor)

- `apps/api/src/modules/core/routes.ts`
  - Tiene responsabilidades mezcladas (documents, analytics, rag, users, entities).
- `apps/api/src/modules/tenders/routes.ts`
  - Archivo amplio con varios subdominios y multiples reglas de negocio.
- `Docs/` (normalizacion de documentacion viva vs historica).

## Merge (integracion GPTsercop)

- GPTsercop sobre `core`:
  - Nuevo endpoint de analisis asistido para procesos (`/api/v1/gptsercop/analyze-procurement`).
  - Reuso de `searchRag()` para contexto normativo.
- UI:
  - Consumir endpoint desde `public-portal` y `sercop-admin` en widgets de asistencia.

## Drop / Excluir del flujo activo (sin borrado irreversible)

- `apps/contract-ui-track-c`
  - Se excluye del workspace activo para evitar ruido de mantenimiento mientras se decide su destino final.
  - Queda en repositorio para posible migracion parcial o archivo definitivo.

## Regla operativa de limpieza

Un componente candidato a DROP debe cumplir al menos dos condiciones:

1. No participa en scripts activos de build/test/deploy.
2. No tiene owner funcional en roadmap actual.
3. Duplica capacidades ya cubiertas por modulos core.
4. No tiene impacto directo en procesos de compra publica vigentes.
