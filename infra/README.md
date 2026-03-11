# Infraestructura SERCOP V2

## Docker (desarrollo local)

Desde la raíz del repositorio:

```bash
npm run docker:up
```

Levanta: Postgres (5432), Redis (6379), MinIO (9000/9001), API (3080), **Gateway** (8080). El Gateway (Nginx) hace proxy de `/api/` y `/health` a la API, con rate limit (30 r/s, burst 20) y headers de seguridad. La API usa `DATABASE_URL` y opcionalmente `JWT_SECRET` (Fase 2: si no se define, auth desactivado).

Antes de usar la API, crear esquema y datos de prueba (una vez):

```bash
# Con Postgres ya levantado (docker compose up -d)
$env:DATABASE_URL="postgresql://sercop:sercop@localhost:5432/sercop"   # PowerShell
npm run db:setup
```

## Kubernetes (GKE / EKS / AKS)

La carpeta `kubernetes/base` contiene manifiestos para la API:

- `configmap.yaml` – variables no sensibles (HOST, PORT, NODE_ENV).
- `secret.yaml.example` – plantilla para DATABASE_URL, REDIS_URL, JWT_SECRET y opcional S3_* (copiar a `secret.yaml`, rellenar, no commitear).
- `deployment.yaml` – Deployment (liveness /health, readiness /ready).
- `service.yaml` – Service ClusterIP puerto 3080.
- `ingress.yaml` – Ingress de ejemplo (ajustar host y TLS).
- `hpa.yaml` – HorizontalPodAutoscaler opcional (CPU/memoria).

### Pasos genéricos (cualquier cloud)

1. Construir imagen y subirla al registro del cluster (ej. GCR, ECR, ACR):
   ```bash
   docker build -t REGISTRY/sercop-api:0.1.0 ./apps/api
   docker push REGISTRY/sercop-api:0.1.0
   ```
2. Crear el Secret con las URLs de BD y Redis (no usar los valores de ejemplo en producción).
3. Ajustar `deployment.yaml` para usar la imagen del registro (ej. `image: gcr.io/PROJECT/sercop-api:0.1.0`).
4. Aplicar:
   ```bash
   kubectl apply -f infra/kubernetes/base/
   ```
5. Exponer la API: `kubectl apply -f infra/kubernetes/base/ingress.yaml` (ajustar host y anotaciones); configurar TLS (cert-manager o equivalente).
6. Opcional: `kubectl apply -f infra/kubernetes/base/hpa.yaml` para autoscaling.

### Variantes por proveedor

- **GCP (GKE):** `gcloud builds submit --tag gcr.io/PROJECT_ID/sercop-api:VERSION ./apps/api`. Ingress: `ingressClassName: gce` o anotación `kubernetes.io/ingress.class: "gce"`. Artifact Registry como alternativa a GCR.
- **AWS (EKS):** `aws ecr get-login-password | docker login ...`; build y push a ECR. Ingress: instalar AWS Load Balancer Controller; anotaciones `alb.ingress.kubernetes.io/*`. Secrets: considerar AWS Secrets Manager + External Secrets Operator.
- **Azure (AKS):** `az acr build --registry REGISTRY --image sercop-api:VERSION ./apps/api`. Ingress: nginx o Application Gateway; cert-manager para TLS.

La API requiere `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`; opcional `S3_*` para documentos (Fase 4).

## Terraform

En [infra/terraform](terraform/) hay un esqueleto para provisionar el cluster y recursos (VPC, BD gestionada, Redis) en un proveedor cloud. Ver [infra/terraform/README.md](terraform/README.md). Los despliegues de la API se hacen con `kubectl apply` sobre [infra/kubernetes/base](kubernetes/base).

## Monitoring

Ver [infra/monitoring.md](monitoring.md) para métricas (Prometheus), logs y alertas. La API expone `/health` y `/ready` para probes; opcionalmente añadir `/metrics` en formato Prometheus.

## Checklist pre-producción

Ver [infra/pre-production-checklist.md](pre-production-checklist.md) antes de desplegar a producción. Para pasos de respuesta a incidencias: [infra/runbook.md](runbook.md).

## Portales Next.js (Fase 3)

- **public-portal** (puerto 3001): búsqueda y detalle de procesos.
- **supplier-portal** (3002), **entity-portal** (3003), **sercop-admin** (3004): ver `apps/*/package.json`.

### Desarrollo local

Desde la raíz:

```bash
npm run dev:public-portal   # o dev:supplier-portal, dev:entity-portal, dev:admin
```

Cada app usa `@sercop/design-system` y `@sercop/api-client`. Configurar `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:3080`) si la API está en otra URL.

### Docker

El servicio `public-portal` está definido en `docker-compose.yml`. Construir y levantar:

```bash
docker compose build public-portal
docker compose up -d public-portal
```

Para los demás portales, usar el mismo patrón (Dockerfile en cada `apps/*`; build con contexto raíz: `docker build -f apps/supplier-portal/Dockerfile .`).
