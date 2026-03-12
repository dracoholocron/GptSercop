# Fase 7 – Revisión de ofertas y aclaraciones – MVP

Evidencia de las pantallas de revisión en Admin y Entidad.

| Archivo | Descripción |
|---------|-------------|
| entity-procesos.png | Portal entidad: lista de procesos (origen para ir a ofertas del proceso). |

En Admin: `/procesos` → Revisar ofertas; en Entidad: `/procesos/[id]/ofertas` con listado de ofertas, cambio de estado y solicitud de aclaraciones.

Generación: `npm run evidence:full` (o `npx playwright test e2e/evidence.spec.ts`).
