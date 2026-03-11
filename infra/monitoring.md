# Monitoring – SERCOP V2

## Objetivo

Observabilidad de la API y del entorno de ejecución: métricas, logs y alertas básicas.

## Opciones

1. **Métricas de aplicación**
   - Añadir endpoint `/metrics` en la API (formato Prometheus) con contadores de requests, latencia y estado de salud.
   - O usar un middleware/plugin que exponga métricas (ej. `fastify-metrics` o similar).

2. **Recolección**
   - **Prometheus**: scrape del endpoint `/metrics` y de métricas de Kubernetes (pods, deployment).
   - **Grafana**: dashboards sobre Prometheus (requests/s, errores 5xx, latencia p95).

3. **Logs**
   - Los logs de la API (Fastify logger) salen por stdout/stderr; en K8s se recogen con el driver de logging del cluster (Cloud Logging, CloudWatch, etc.).

4. **Alertas**
   - Alertas básicas: deployment no disponible, tasa de errores 5xx por encima de umbral, health check fallando.
   - Configurar en Prometheus Alertmanager o en el servicio de monitoring del cloud.

## Checklist

- [ ] Endpoint `/metrics` (Prometheus) en la API o en un sidecar.
- [ ] Prometheus (o equivalente) configurado para scrape la API y los pods.
- [ ] Dashboard con métricas clave (requests, latencia, errores).
- [ ] Alertas para salud del deployment y errores 5xx.
- [ ] Documentar en [runbook.md](runbook.md) cómo acceder a los dashboards y qué hacer ante alertas.
