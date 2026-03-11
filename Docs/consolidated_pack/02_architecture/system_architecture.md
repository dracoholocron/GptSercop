# Arquitectura del sistema

Componentes de la implementación actual:

- **API Gateway** (opcional; Nginx con rate limit en docker-compose)
- **API monolítica modular** (Fastify): una sola aplicación que agrupa los módulos (tenders, providers, PAC, bids, contracts, documents, analytics, RAG, auth). No hay microservicios separados.
- PostgreSQL
- Redis
- MinIO (S3-compatible)

**No utilizados en esta implementación:** Kafka, OpenSearch (la búsqueda RAG es con tsvector en Postgres).
