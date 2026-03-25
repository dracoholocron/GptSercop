# Backlog de ejecucion (integracion GPTsercop)

## PR-01 (actual)

- Crear alcance y matriz de integracion.
- Excluir `contract-ui-track-c` del workspace activo.
- Exponer endpoint inicial de analisis GPTsercop en API.

## PR-02

- Integrar consumo del endpoint GPTsercop en `public-portal`:
  - Vista de proceso con bloque "Analisis asistido".
- Integrar consumo en `sercop-admin` para soporte operativo.

## PR-03

- Definir contrato de respuestas IA versionado:
  - `summary`, `riskFlags`, `recommendations`, `citations`, `confidence`.
- Agregar tests de integracion API para `/api/v1/gptsercop/analyze-procurement`.

## PR-04

- Habilitar feature flags de IA por entorno:
  - `AI_ENABLED`, `RAG_ENABLED`, `AI_MODE`.
- Fallback deterministico cuando IA este deshabilitada o falle.

## PR-05

- Endurecer seguridad y trazabilidad:
  - Auditar llamadas IA.
  - Establecer guardas de datos sensibles en prompts/inputs.
  - Metricas de latencia/error para rutas IA.

## PR-06

- Limpieza final:
  - Mover artefactos/documentacion historica a `Docs/archive` (si aplica).
  - Decidir eliminacion o migracion final de `contract-ui-track-c`.
