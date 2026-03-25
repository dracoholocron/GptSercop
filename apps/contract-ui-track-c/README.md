# Contract/UI Track C — query -> detail -> GPT summary

> Estado: **archivado para referencia histórica**.  
> Este módulo no forma parte del workspace activo ni del flujo principal de entrega del monorepo SERCOP/GPTsercop.

Implementación mínima full-stack alineada al contrato unificado (`openapi/sercop-core-v1.yaml`) para el flujo:

1. `GET /v1/public/search?q=...`
2. Selección de proceso
3. `GET /v1/processes/{processId}`
4. `POST /v1/processes/{processId}/gpt-analysis-summary`

## Run

```bash
npm install
npm test
npm start
```

UI route:

- `http://localhost:8787/app/process-analysis`

## Integración Track A -> Track C

Track C ahora consume el backend de Track A vía `TRACK_A_API_BASE_URL`.

```bash
# ejemplo: backend Track A corriendo en :8788
TRACK_A_API_BASE_URL=http://127.0.0.1:8788 npm start
```

Si `TRACK_A_API_BASE_URL` no está definido, Track C usa fallback local para desarrollo.

## Notes

- Se validan respuestas contra esquemas del contrato (`PublicSearchResult`, `Process`) antes de renderizar.
- Endpoint de resumen GPT (`POST /v1/processes/{id}/gpt-analysis-summary`) se mantiene como extensión usada por la UI.
