# SERCOP V2 Expanded Foundation Pack

Incorporado desde `sercop_v2_expanded_foundation.zip` (fecha del pack: 2026-03-08).

Paquete base ampliado para el desarrollo del sistema SERCOP V2.

## Incluye

- Documentación de arquitectura (índice 00–08)
- Esquema SQL ampliado y seeds de ejemplo
- Diseño de crawler (objetivo, fuentes, stub Python)
- Base RAG normativa (colecciones, plan de índice)
- Infraestructura de referencia (Docker Compose: Postgres, Redis, MinIO)
- Estructura objetivo del monorepo (apps + packages)

## Estructura en este directorio

```text
expanded_foundation/
  README.md           # Este archivo
  docs/                # 00_index … 08_rag_notes
  database/            # schema.sql, seeds/
  crawler/             # README, crawler_stub.py
  rag/                 # README, index_plan.md
  infra/               # docker-compose.yml de referencia
```

## Estructura objetivo del monorepo (referencia)

- **Apps:** public-portal, supplier-portal, entity-portal, sercop-admin, api-gateway, services (iam, rup, pac, tenders, bids, evaluation, contracts, documents, analytics)
- **Packages:** ui, config, shared-types, api-client

Este contenido complementa la documentación base y el pack consolidado en `Docs/`.
