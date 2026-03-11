# Terraform – SERCOP V2

Módulos para provisionar infraestructura (cluster Kubernetes, base de datos, Redis) en un proveedor cloud. Los manifiestos de despliegue de la API están en [infra/kubernetes/base](../kubernetes/base); Terraform crea el entorno donde se aplican.

## Uso

1. Elija el proveedor (GCP, AWS o Azure) y copie el módulo correspondiente o ajuste `main.tf`.
2. Configure variables (project_id, region, etc.) en `terraform.tfvars` (no commitear valores sensibles).
3. `terraform init` y `terraform plan` / `terraform apply`.

## Estructura de ejemplo

- `main.tf` – recurso principal (ej. GKE cluster, VPC).
- `variables.tf` – variables de entrada.
- `outputs.tf` – outputs (kubeconfig, endpoint de BD, etc.).

Los ejemplos en esta carpeta son esqueletos; adaptar a la cuenta y región del proyecto.
