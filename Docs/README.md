# Documentación SERCOP V2

Toda la documentación del proyecto (investigación, arquitectura, especificaciones técnicas, DevOps y roadmap) está en esta carpeta. El código de desarrollo vive en la raíz del repositorio.

## Manuales de uso e implementación

| Documento | Descripción |
|-----------|-------------|
| [Manual de Usuario](manual-usuario.md) | Uso de la plataforma: portal público, proveedor, entidad y administrador (pantallas, flujos, glosario). Incluye placeholders para capturas de pantalla. |
| [Manual Técnico](manual-tecnico.md) | Arquitectura, stack, API REST, modelo de datos Prisma, portales Next.js, autenticación, pruebas y referencias. |
| [Manual de Instalación](manual-instalacion.md) | Requisitos, obtención del código, instalación con Docker o solo Node.js, verificación y solución de problemas. |
| [Manual de Configuración](manual-configuracion.md) | Variables de entorno (API y portales), Docker Compose, entornos desarrollo/staging/producción y buenas prácticas de seguridad. |

## Estructura

| Carpeta | Descripción |
|---------|-------------|
| [01_research](01_research/) | Investigación SOCE/SERCOP, endpoints, datasets, ingeniería inversa |
| [02_architecture](02_architecture/) | Arquitectura propuesta (API Gateway, microservicios, PostgreSQL, Redis, S3, K8s) |
| [03_technical_specs](03_technical_specs/) | Especificaciones técnicas: contexto, módulos, APIs, modelo de datos, infra, seguridad |
| [04_devops](04_devops/) | DevOps: Docker, Kubernetes, Terraform, GitHub Actions |
| [05_starter_kit](05_starter_kit/) | Base: monorepo Node.js, APIs base, health checks |
| [06_runnable_v0_1](06_runnable_v0_1/) | Primera versión ejecutable: API backoffice/pública, PostgreSQL, Docker Compose |
| [07_runnable_v0_2](07_runnable_v0_2/) | Versión extendida: RBAC, auditoría, tenders, documentos, tests |
| [roadmap](roadmap/) | Roadmap de desarrollo (fases 1–5) |
| [consolidated_pack](consolidated_pack/) | **Pack consolidado:** SOCE reverse engineering, arquitectura detallada, stack backend (NestJS, Kafka, OpenSearch), UX/UI (catálogo de pantallas), frontend (Next.js, monorepo apps+packages), servicios backend, DevOps, dataset y RAG (crawler, fuentes de conocimiento) |
| [expanded_foundation](expanded_foundation/) | **Expanded Foundation:** documentación 00–08 (arquitectura, módulos, frontend/backend guidelines, DB, crawler, RAG), esquema SQL y seeds, stub de crawler Python, plan de índice RAG, Docker Compose de referencia |

## Índice de especificaciones técnicas

Ver [03_technical_specs/00_INDEX.md](03_technical_specs/00_INDEX.md) para el listado completo.
