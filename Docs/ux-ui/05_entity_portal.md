# Portal entidad – especificaciones

## Menú

Menú principal: Inicio | PAC | Procesos | Documentos | Reportes. La evaluación de ofertas y la creación de contrato se acceden desde cada proceso: Procesos → [proceso] → Ofertas / Contrato.

## Pantallas

| Ruta | Contenido | API |
|------|-----------|-----|
| /login | Email + rol entity | auth/login |
| / | Dashboard | pac, tenders, analytics |
| /pac | Lista PAC, crear/editar | pac GET/POST/PUT |
| /pac/[id] | Detalle PAC | pac/:id |
| /procesos | Tenders entidad | tenders?entityId= |
| /procesos/nuevo | Crear proceso | tenders POST |
| /procesos/[id]/editar | Editar proceso | tenders PUT |
| /procesos/[id]/ofertas | Bids, evaluar | tenders/:id/bids |
| /procesos/[id]/contrato | Crear contrato | tenders/:id/contract POST |
| /documentos | Gestión documentos | documents |

## Campos PAC

- entityId, year, totalAmount, status

## Campos proceso

- procurementPlanId, title, description, procurementMethod, estimatedAmount, status
