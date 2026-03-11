# Arquitectura de módulos (servicios)

Los “servicios” están implementados como **rutas/módulos dentro de una sola API** (monolito modular), no como microservicios independientes:

- **Auth/IAM**: login JWT en la misma API (`/api/v1/auth/login`); en producción se recomienda IdP OIDC (Keycloak, Auth0).
- provider (RUP), pac, tender, bid, evaluation, contract, document, analytics, users, rag/chunks

Todos expuestos bajo la misma base URL (ej. `http://localhost:3080/api/v1/...`). No existe un “iam-service” separado ni brokers de mensajería.
