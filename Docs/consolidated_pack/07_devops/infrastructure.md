# Infraestructura (DevOps)

- **Docker** – desarrollo local: [infra/README.md](../../infra/README.md) (docker-compose).
- **Kubernetes** – manifiestos en [infra/kubernetes/base](../../infra/kubernetes/base); despliegue de la API en GKE/EKS/AKS.
- **Terraform** – esqueleto para provisionar cluster y recursos en [infra/terraform](../../infra/terraform); adaptar al proveedor (GCP, AWS, Azure).
- **CI/CD** – GitHub Actions en `.github/workflows/ci.yml` (build, smoke, integración, seguridad; push de imagen en tags `v*`).
- **Monitoring** – ver [infra/monitoring.md](../../infra/monitoring.md): métricas (Prometheus), logs (stdout en K8s), alertas básicas.
