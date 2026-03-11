# Stack backend

**Implementación actual (SERCOP V2):**

- **Fastify** (API REST; no NestJS)
- PostgreSQL
- Redis
- MinIO (S3-compatible para documentos)
- **Sin Kafka ni OpenSearch** en esta implementación

La búsqueda RAG usa **full-text (tsvector)** en PostgreSQL. Para documentación OpenAPI: `GET /openapi.json` y `GET /documentation`.
