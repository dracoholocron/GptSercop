# Evidencia Fase 4 – OpenAPI

## Contenido implementado

- **GET /openapi.json**: Especificación OpenAPI 3.0 (health, ready, auth/login, tenders, users, rag/chunks).
- **GET /documentation**: Página HTML con Swagger UI que carga /openapi.json.

## Cómo reproducir

1. API en marcha: `npm run dev` (puerto 3080).
2. Abrir http://localhost:3080/documentation
3. Verificar http://localhost:3080/openapi.json

## Capturas recomendadas

- Pantalla de Swagger UI mostrando los endpoints documentados.
