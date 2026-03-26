# Batería de pruebas E2E automatizadas – SERCOP V2

## Objetivo

Ejecutar más de **100 escenarios** automatizados que cubran navegación entre interfaces, funcionalidades y flujos extendidos en los cuatro portales (público, proveedor, entidad, admin), con captura de evidencia en caso de fallo.

## Alcance

| Portal       | Base URL (tests) | Escenarios |
|-------------|-------------------|------------|
| Público     | 3010              | Navegación, búsqueda, filtros, accesibilidad |
| Proveedor   | 3012              | Login, procesos, wizard oferta, SIE, mis ofertas, aclaraciones |
| Admin       | 3014              | Login, procesos, ofertas, config wizard, usuarios, normativa, auditoría |
| Entidad     | 3013              | Login, procesos, ofertas, PAC, reportes |

## Matriz de escenarios (resumen)

### 1. Portal público (~25)
- P01–P07: Carga HTTP 200 y contenido mínimo en cada ruta (/, /procesos, /proceso/[id], /normativa, /cifras, /enlaces, /servicios).
- P08–P14: Elemento clave visible por ruta (hero/home, filtros en procesos, placeholder normativa, etc.).
- P15–P18: Procesos: abrir filtros, botón Buscar, resultados o vacío, enlace Ver detalle.
- P19–P22: Normativa: caja búsqueda, envío búsqueda, resultados o vacío.
- P23–P25: Accesibilidad: skip link, axe WCAG en home y procesos.

### 2. Portal proveedor (~30)
- S01–S10: Carga 200 y elemento clave en /, /login, /procesos, /procesos/[id]/oferta, /procesos/[id]/sie, /ofertas, /ofertas/[id], /perfil, /normativa, /registro.
- S11–S15: Login: formulario visible, envío con email, mensaje error si falla, redirección si ok.
- S16–S20: Procesos: listado, enlace Presentar oferta, enlace SIE, tarjeta proceso.
- S21–S28: Wizard oferta: pasos 1–4 visibles, Anterior/Siguiente, campos contacto, económico, documentos, envío.
- S29–S30: SIE: título visible, botón Refrescar o Enviar.

### 3. Portal admin (~28)
- A01–A12: Carga 200 en /, /login, /procesos, /procesos/[id]/ofertas, /procesos/[id]/config-oferta, /entidades, /usuarios, /auditoria, /normativa, /parametros.
- A13–A18: Login: formulario, envío admin, navegación a usuarios y normativa.
- A19–A22: Procesos: listado, Revisar ofertas, Config. wizard.
- A23–A28: Usuarios, normativa, auditoría: heading o tabla visible.

### 4. Portal entidad (~18)
- E01–E10: Carga 200 en /, /login, /procesos, /procesos/[id]/ofertas, /documentos, /pac, /reportes, etc.
- E11–E18: Login, listado procesos, ofertas del proceso (si existe).

### 5. Flujos críticos (~15)
- F01–F03: Público → Procesos → Ver detalle → (sin login).
- F04–F06: Supplier: Login → Procesos → Presentar oferta (primer paso).
- F07–F09: Supplier: Procesos → SIE → formulario monto.
- F10–F12: Admin: Login → Procesos → Config. wizard (carga config).
- F13–F15: Admin: Procesos → Revisar ofertas (lista o vacía).

### 6. Accesibilidad y robustez (~8)
- AX01–AX04: Axe WCAG 2.1 AA en login admin, login supplier, home público, procesos público.
- AX05–AX08: Contraste y teclado: focus visible, labels en formularios.

**Total: 198 escenarios.** Incluye filtros por tipo de proceso y régimen (público), modelos de pliegos, registro RUP con pasos y CPC (proveedor), suspender/terminar contrato e informe de resultado (entidad), catálogos y órdenes de compra (entidad), evaluación de ofertas con BAE/participación nacional, batería extendida (extended-battery.spec.ts: público filtros/cifras/enlaces/servicios, proveedor registro/wizard/documentos/normativa, entidad documentos/catálogos/órdenes/evaluaciones, admin denuncias/reclamos/parámetros/entidades/normativa, flujos combinados). Seed extendido >1000 registros (procesos, ofertas, denuncias, reclamos, aclaraciones).

## Evidencia de fallos

- **Screenshot:** en cada fallo se guarda captura en `test-results/` (configuración `screenshot: 'only-on-failure'`).
- **Trace:** opcional en primer reintento para depuración.
- **Reporte HTML:** `npx playwright show-report` tras la ejecución.

## Ejecución

**Procesos cargados en la UI:** Un **global setup** (`e2e/global-setup.js`) ejecuta el seed de la BD **antes** de arrancar la API y los portales. Si existe `DATABASE_URL` (en `.env` o `apps/api/.env`), se cargan procesos tipo SERCOP y la UI los muestra.

**Login en tests que lo requieren:** Los escenarios que necesitan sesión (wizard de oferta proveedor, flujo F08, detalle ofertas entidad) usan **login vía API** e inyección de token en `localStorage` (`e2e/battery/auth-helpers.ts`), con credenciales del seed (proveedor: RUC 1791234567001; entidad: admin@mec.gob.ec). Así se cubren los **119 tests** sin skips. La API debe tener **JWT_SECRET** (en E2E se asigna por defecto en `playwright.config.ts` si no está definido).

Requisito (modo full): **PostgreSQL en marcha** y **DATABASE_URL** definido.

```bash
# Batería core (híbrido/remoto)
npm run test:e2e:battery

# Alias explícito del modo core
npm run test:e2e:battery:core

# Batería full (local puro)
npm run test:e2e:battery:full

# Full con seed previo
npm run test:e2e:battery:full:seed

# Reporte HTML tras la ejecución
npx playwright show-report playwright-report
```

El global setup de `playwright.config.ts` lee `.env` y `apps/api/.env` para obtener `DATABASE_URL`; si no está definido, no ejecuta seed y varios tests de negocio pueden omitirse/fallar en modo full.

Referencia operativa: `Docs/qa/E2E-battery-modes.md`.

En cada fallo se guarda screenshot en `test-results/` (configuración `screenshot: 'only-on-failure'`).

## Criterios de éxito

- ≥ 95% de escenarios en verde (se permiten skips por datos inexistentes, p. ej. sin procesos).
- Fallos documentados con screenshot en `test-results/` y corregidos en iteración.

## Datos de prueba (seed SERCOP)

El comando `npm run db:seed` carga datos de prueba basados en SERCOP:

- **Entidades:** MEC, MSP, GAD-Q, IESS, SERCOP (con PAC publicado).
- **Procesos:** varios por entidad con códigos tipo `MEC-2025-CO-001`, publicados; bulk adicional (>200 procesos, >400 ofertas, 50 denuncias, 50 reclamos, 100 aclaraciones) para >1000 registros.
- **OfferFormConfig:** configuración del wizard de ofertas por proceso (presentar oferta, documentos, OTP/firma).
- **Auction (SIE):** un proceso con Subasta Inversa en estado `INITIAL_WINDOW_OPEN`.
- **Proveedores (RUP), ofertas (bids), RAG normativa.**

Para que los tests que hoy se omiten (wizard, SIE, revisar ofertas, config oferta) se ejecuten, es necesario que la API use una BD con seed: levantar API + PostgreSQL y ejecutar `npm run db:seed` antes de la batería.

## Notas de ejecución

- **Skips esperados (~14) sin seed:** tests que requieren al menos un proceso en BD (wizard oferta, SIE, detalle proceso, revisar ofertas, config oferta). Tras `npm run db:seed` y con la API apuntando a esa BD, esos escenarios dejan de omitirse.
- **Accesibilidad:** Las reglas Axe `color-contrast` y `link-in-text-block` están deshabilitadas en la batería; conviene corregir contraste en botones/links en la UI para cumplimiento pleno WCAG 2.1 AA.
- **Evidencia:** En cada fallo se genera captura en `test-results/<nombre-test>/test-failed-1.png` y contexto en `error-context.md`.
