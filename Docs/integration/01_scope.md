# Integracion GPTsercop sobre SERCOP

## Objetivo

Usar la aplicacion de compras publicas como base operativa e integrar funcionalidades GPTsercop sin romper flujos core de contratacion.

## Alcance fase inicial

- Base funcional:
  - `apps/api` como backend canonico.
  - Portales `public-portal`, `supplier-portal`, `entity-portal`, `sercop-admin`.
- Integracion GPTsercop:
  - Endpoint de analisis asistido con contexto de proceso + RAG.
  - Respuesta estructurada con resumen, recomendaciones y fuentes.
- Depuracion de alcance:
  - Excluir componentes no alineados del ciclo principal de build/dev.

## Fuera de alcance inmediato

- Reescritura completa de modulos core.
- Eliminacion fisica irreversible de apps heredadas.
- Integracion con proveedor LLM externo productivo (solo contrato y stub funcional).

## Criterios de exito

- API y portales core siguen compilando.
- Flujo actual no se rompe.
- Existe una ruta GPTsercop utilizable para iniciar consumo en UI.
- Hay matriz explicita de componentes para decidir KEEP/REFactor/MERGE/DROP.
