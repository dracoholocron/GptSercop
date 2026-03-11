# Crawler SERCOP (Fase 4b)

Extensible para recopilar datos de contratación pública.

## Fuentes

- **portal**: Tenders y providers desde la API SERCOP (`/api/v1/tenders`, `/api/v1/providers`)
- **datos_abiertos**: OCDS releases (API Ecuador: datosabiertos.compraspublicas.gob.ec)
- **sintéticos**: Faker.js para completar hasta 100 registros por tipo

## Uso

```bash
# Listar datos de la API (API en marcha)
npm run crawler

# Importar OCDS + sintéticos (100 registros por tipo para pruebas IA)
npm run crawler:import

# Crawler + seed básico
npm run crawler:seed
```

## Importación combinada (Opción C)

`crawler:import` ejecuta:

1. **OCDS**: Intenta importar desde la API de Ecuador (`search_ocds`). Si no está disponible, continúa.
2. **Sintéticos**: Completa con Faker hasta alcanzar 100 entities, providers, tenders, bids y contracts.

Objetivo: datos históricos y sintéticos para pruebas del módulo de IA.

## Variables

- `CRAWLER_API_URL`: URL de la API (default: http://localhost:3080)
- `CRAWLER_OCDS_URL`: Base URL OCDS Ecuador (default: https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api)
