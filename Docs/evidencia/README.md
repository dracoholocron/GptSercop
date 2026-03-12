# Evidencia – SERCOP V2

Carpetas de evidencia por fase del plan de implementación. Cada subcarpeta puede contener capturas de pantalla y un README que describa la funcionalidad.

| Fase | Carpeta | Contenido |
|------|---------|-----------|
| 1 | [fase1](fase1/) | API: users, paginación tenders, rag/chunks, metadatos RAG |
| 2 | [fase2](fase2/) | Admin: /usuarios, /normativa con CRUD |
| 3 | [fase3](fase3/) | Entity: /reportes |
| 4 | [fase4](fase4/) | OpenAPI: /documentation, /openapi.json |
| 5 | [fase5](fase5/) | TanStack Query en admin |
| 6 | [fase6](fase6/) | Supplier: SIE (MVP) – pantalla y flujo base |
| 7 | [fase7](fase7/) | Admin/Entity: revisión de ofertas + aclaraciones (MVP) |

## Cómo capturar evidencia

1. **Automático**: Con los portales y la API en marcha (ver `scripts/start-all.js`), ejecutar:
   ```bash
   npx playwright test e2e/evidence.spec.ts
   ```
   Guarda capturas en `Docs/evidencia/fase2/`, `fase4/`, `fase6/`, `fase7/`.
2. **Manual**: Navegar a cada pantalla y guardar capturas en la carpeta correspondiente (ej. `fase2/usuarios-listado.png`).
3. Opcional: E2E con screenshots en fallo (`npx playwright test` guarda en `test-results/`).

## Reinicio de la API (versión nueva)

Para que la API sirva los endpoints nuevos (users, rag/chunks, paginación, OpenAPI), debe ejecutarse el código actualizado:

1. Detener el proceso actual que corre la API (Ctrl+C en la terminal donde está `npm run dev`).
2. Desde la raíz del repo:
   ```bash
   npm run build --workspace=api
   ```
3. Iniciar de nuevo con variables de entorno (PowerShell):
   ```powershell
   .\scripts\start-api.ps1
   ```
   O manualmente: `$env:DATABASE_URL="postgresql://sercop:sercop@localhost:5432/sercop"; $env:JWT_SECRET="dev-secret-min-16-chars"; npm run dev`  
   O con el binario: `node apps/api/dist/index.js` (con DATABASE_URL y JWT_SECRET en el entorno).
4. Comprobar: `npm run smoke` debe mostrar `total` en tenders y `GET /openapi.json: OK` si la API es la nueva.
