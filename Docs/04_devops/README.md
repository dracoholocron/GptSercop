# DevOps

Stack sugerido:

- Docker
- Kubernetes
- Terraform
- GitHub Actions

Ambientes:

- dev
- staging
- production

## Infraestructura y despliegue

- **Docker y Kubernetes:** Ver [infra/README.md](../../infra/README.md) en la raíz del repositorio (compose con Postgres, Redis, MinIO, API; manifiestos K8s base y pasos para GKE/EKS/AKS).

## CI/CD (recomendaciones Fase 0)

- **Cada push/PR:** `npm run build`, `npm run smoke` (con API levantada vía compose en el job), `npm run audit`.
- **Integración:** Levantar stack con `docker compose up -d`, ejecutar `npm run db:setup`, luego `npm run test:integration`.
- **Seguridad:** Incluir en el pipeline escaneo de secretos (gitleaks, trufflehog o equivalente) y no permitir merge con vulnerabilidades críticas de `npm audit`. En fases posteriores: SAST (Semgrep u otro) y DAST (OWASP ZAP) en staging.
