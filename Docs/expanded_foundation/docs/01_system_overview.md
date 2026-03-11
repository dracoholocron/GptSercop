# System Overview

SERCOP V2 moderniza el ciclo de contratación pública con módulos para:

- IAM (auth: actualmente JWT con login email/rol; en producción se recomienda IdP OIDC)
- RUP (proveedores)
- PAC
- Tenders, Bids, Evaluation, Contracts
- Documents, Analytics, RAG

**Implementación actual:** una sola API (Fastify) que agrupa estos módulos como rutas; no hay microservicios independientes. Ver [03_module_map.md](03_module_map.md) y [05_backend_guidelines.md](05_backend_guidelines.md).
