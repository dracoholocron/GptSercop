# Deprecation Plan for `apps/*` Duplicates

This repository now runs in legacy-first mode. The official UX is served from `sercop-unified/frontend`.

## Scope

- Keep active: `apps/api` (GPTsercop services and `/api/v1/*` endpoints).
- Deprecate as official UX:
  - `apps/public-portal`
  - `apps/supplier-portal`
  - `apps/entity-portal`
  - `apps/sercop-admin`

## Operational Rule

- New UX/UI changes must be implemented in `sercop-unified/frontend`.
- `apps/*` frontend changes are only allowed for:
  - emergency hotfixes
  - migration support
  - endpoint contract validation

## Cutover Status

- Legacy menu atlas and route evidence: `Docs/integration/menu-atlas/`
- Legacy vs apps convergence matrix: `Docs/integration/convergence_matrix.md`
- GPTsercop embedding baseline: legacy frontend routes now resolve `/api/v1/*` to GPTsercop API base via `VITE_GPTSERCOP_API_BASE_URL`.
