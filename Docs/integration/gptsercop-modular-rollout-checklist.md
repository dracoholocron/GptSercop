# GPTsercop Modular Rollout Checklist (Legacy-First)

## Rollback Controls

- `VITE_ENABLE_CP_API=false`
  - Frontend switches GPT/CP AI modules to safe fallback mode.
  - Keeps legacy UX stable and prevents initialization crashes.
- `AI_ENABLED=false` (apps/api)
  - Forces deterministic fallback on GPTsercop analysis endpoint.
- `RAG_ENABLED=false` (apps/api)
  - Disables RAG dependency while keeping deterministic analysis response.

## Rollback Procedure (Per Module)

1. Disable module flag in environment (`VITE_ENABLE_CP_API`, `AI_ENABLED`, `RAG_ENABLED`).
2. Redeploy frontend/backend service only for the affected module path.
3. Validate:
   - Legacy login works.
   - Legacy navigation works.
   - GPT pages show fallback UI, no white screens.
4. Confirm deny contracts:
   - 401 includes `errorCode`.
   - 403 includes `errorCode` and required permission metadata.

## Merge Readiness Checklist

- [ ] New Flyway migration applied successfully:
  - `V20260326_1__add_gptsercop_modular_menu_permissions.sql`
- [ ] Menu visibility validated:
  - Desktop sidebar shows GPT modules only with permissions.
  - Mobile drawer matches the same visibility behavior.
- [ ] Route protections validated:
  - Direct access to protected GPT routes returns no-access UI when unauthorized.
- [ ] API contracts validated:
  - Java permission denials return normalized 403 payloads.
  - Fastify auth errors return normalized 401/503 payloads.
- [ ] Functional tests green:
  - `PermissionGate.test.tsx`
  - `MobileDrawerMenu.test.tsx`
- [ ] E2E battery executed:
  - `legacy-gpt-access.spec.ts` (passes or skips auth-dependent tests in constrained env)
- [ ] No linter errors on modified files.
- [ ] Branch ready for PR:
  - `feature/gptsercop-modular-integration`

## Suggested Validation Commands

```bash
# Functional tests
cd sercop-unified/frontend
npm run test -- --run src/components/auth/PermissionGate.test.tsx src/components/layout/MobileDrawerMenu.test.tsx

# E2E role/failure checks
cd /Users/dherrera/code1/GPTsercop
LEGACY_BASE_URL="http://localhost:5177" npx playwright test e2e/battery/legacy-gpt-access.spec.ts --config=playwright.battery.config.ts --project=chromium
```
