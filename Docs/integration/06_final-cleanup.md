# PR-06 cierre y limpieza final

## Resultado

Se completa la limpieza final del bloque de integración GPTsercop con decisiones explícitas sobre documentación histórica y `contract-ui-track-c`.

## Decisiones adoptadas

- **Documentación histórica:** se habilita `Docs/archive/` para conservar artefactos de referencia sin mezclar con documentación activa.
- **`contract-ui-track-c`:** se mantiene en el repositorio como artefacto histórico/técnico, **fuera del workspace activo** y fuera del flujo principal de CI/entrega.
- **Monorepo activo:** continúa centrado en:
  - `apps/api`
  - `apps/public-portal`
  - `apps/supplier-portal`
  - `apps/entity-portal`
  - `apps/sercop-admin`
  - `packages/*`

## Limpiezas realizadas

- Se movió `Docs/revision-transcript-principios-2026.md` a `Docs/archive/revision-transcript-principios-2026.md`.
- Se agregó `Docs/archive/README.md` con criterios de archivo.
- Se actualizaron referencias de workspaces en:
  - `README.md`
  - `Docs/manual-tecnico.md`
  - `Docs/manual-instalacion.md`
- Se agregó referencia a `Docs/archive/` en `Docs/README.md`.

## Criterio para siguientes iteraciones

- Nuevos artefactos de revisión puntual, transcripciones o insumos de contexto deben ir a `Docs/archive/`.
- Cambios funcionales/operativos deben documentarse en `Docs/` activo (`integration`, manuales, arquitectura, devops).
