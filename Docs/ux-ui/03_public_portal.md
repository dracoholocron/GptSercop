# Portal público – especificaciones

## Menú

Inicio | Buscar Procesos | Normativa | Contratación en Cifras | Servicios | Enlaces

## Pantallas

| Ruta | Contenido | API |
|------|-----------|-----|
| / | Home: búsqueda RAG + procesos destacados | rag/search, tenders |
| /procesos | Búsqueda avanzada con filtros | tenders (query params) |
| /proceso/[id] | Detalle proceso, "Participar" | tenders/:id |
| /normativa | Búsqueda RAG ampliada | rag/search |
| /cifras | Dashboard público | analytics/public |
| /servicios | Landing servicios (estático) | - |
| /enlaces | SOCE, RUP, Entidades, SICM | Enlaces externos |

## Criterios de aceptación

- Búsqueda RAG < 2s
- Listado procesos con paginación (10/página)
- Mobile: cards apiladas; Desktop: grid 2 columnas
