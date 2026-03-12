# Brechas – Licitación de Obras

Este documento resume lo implementado y lo pendiente respecto al transcript `Docs/08 20 Licitación de Obras.txt`.

## Implementado en MVP

- **Proceso específico de obras**
  - Uso de `processType: 'licitacion_obras'` para procesos de obra.
  - Validación de presupuesto referencial mínimo **≥ USD 10.000** para `licitacion_obras` (igual que licitación de bienes y servicios).
  - Reutilización del cronograma normativo (art. 91 y 96) para `licitacion_obras` (preguntas y ofertas).

- **Instrumento APU**
  - Campo `apuDocumentId` en `Tender` para vincular el documento de **Análisis de Precios Unitarios (APU)**.
  - `GET /api/v1/tenders` expone `apuDocumentId` y `processType` para que el front pueda distinguir procesos de obras y mostrar el APU asociado.
  - `POST /api/v1/documents/upload` documenta el `documentType: 'apu'` como instrumento presupuestario de obras.

- **Subcontratación y experiencia en evaluación**
  - En `Bid`:
    - Campo opcional `subcontractingPercentage` (`Decimal(5,2)`) para capturar el porcentaje de subcontratación declarado (fuente SOSE o formulario).
  - En `Evaluation`:
    - `experienceGeneralScore` (`Decimal(10,2)`) – experiencia general de obras.
    - `experienceSpecificScore` (`Decimal(10,2)`) – experiencia específica de obras.
    - `subcontractingScore` (`Decimal(10,2)`) – puntaje por subcontratación en rango 15–30% (5 puntos).
    - `otherParamsScore` (`Decimal(10,2)`) – otros parámetros (máx. 1 punto).
  - `POST /api/v1/tenders/:id/evaluations` acepta y persiste estos campos en el cuerpo (`EvaluationBody`).

- **Desagregación tecnológica y puntaje efectivo**
  - La desagregación tecnológica se asume como **requisito de cumplimiento** para obras.
  - Los campos de puntaje permiten modelar escenarios donde la herramienta asigne hasta 10 puntos por participación nacional/desagregación tecnológica, pero el **total efectivo** para informe de obras sea sobre 90 (se puede calcular en front restando esa componente).

- **Seed de datos**
  - Al menos un proceso en el seed usa `processType: 'licitacion_obras'` (`"Obra de construcción menor"`), permitiendo filtrar `GET /api/v1/tenders?processType=licitacion_obras` en pruebas E2E.

## Pendiente / Opcional

- **Tabla normativa de experiencia**
  - Implementar la tabla completa de porcentajes de experiencia general y específica según el presupuesto referencial (montos mínimos, tope de años, reglas para PJ < 12 meses, etc.) como validación automática en backend.
  - Por ahora, los campos de score se manejan de forma libre y se delega a reglas de negocio externas o al front.

- **Integración con SOSE / formularios de oferta**
  - Poblar `subcontractingPercentage` desde:
    - Integración real con SOSE, o
    - Formularios de oferta (wizard de oferta de obras).
  - Agregar validaciones explícitas:
    - 0 % < `subcontractingPercentage` ≤ 30 % (si > 30 %, descalificación).
    - Rango 15–30 % otorga hasta 5 puntos en `subcontractingScore`.

- **Desagregación tecnológica como campo específico**
  - Opción de introducir un campo explícito `techDisaggregationScore` en `Evaluation` o documentar que, en obras, parte del `nationalPartScore` no se suma al total efectivo.
  - Ajustar reportes e informes de evaluación para mostrar:
    - Puntaje total herramienta (hasta 100).
    - Puntaje efectivo de obras (hasta 90, excluyendo desagregación).

- **Flujo de front (entity-portal) para APU y evaluación**
  - UI para:
    - Subir documento APU (`documentType: 'apu'`) y asignarlo a `apuDocumentId` del proceso.
    - Capturar y mostrar los campos de score de obras (`experienceGeneralScore`, `experienceSpecificScore`, `subcontractingScore`, `otherParamsScore`) en la pantalla de evaluación.

- **Fiscalización y roles**
  - Incorporar el rol de fiscalizador y sus revisiones en fase contractual para obras, conforme a la normativa, reutilizando el modelo actual de contratos y documentos.

