# E2E Battery Modes

Guía rápida para ejecutar la batería E2E según el tipo de entorno.

## 1) Core mode (híbrido / remoto)

Usar cuando la API corre en otro host o la topología local no tiene todos los portales/servicios estables.

```bash
PLAYWRIGHT_API_URL="http://192.168.100.45:3080" npm run test:e2e:battery
```

También disponible como alias:

```bash
PLAYWRIGHT_API_URL="http://192.168.100.45:3080" npm run test:e2e:battery:core
```

### Qué valida

- Navegación y rutas clave público/proveedor/admin/entidad.
- Casos funcionales core del portal público y proveedor.
- Sin bloqueo por suites estrictas de entorno local puro.

## 2) Full mode (local puro)

Usar cuando tienes topología completa local (DB, API y portales).

```bash
npm run test:e2e:battery:full
```

Si necesitas sembrar antes:

```bash
npm run test:e2e:battery:full:seed
```

### Requisitos recomendados

- Postgres local en `localhost:5432` accesible por `DATABASE_URL`.
- API local en `localhost:3080`.
- Portales en puertos esperados por la suite.
- Dependencias Playwright instaladas (`npx playwright install chromium`).

## Troubleshooting rápido

- `Timed out waiting ... webServer`: usar `core` o arrancar servicios manualmente.
- `Executable doesn't exist ... chromium_headless_shell`: ejecutar `npx playwright install chromium`.
- `P1001: Can't reach database server`: verificar `DATABASE_URL` y Postgres en `5432`.
- Fallos masivos de rutas admin/entity en entorno híbrido: ejecutar `core`, no `full`.
