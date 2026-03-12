# E2E con base de datos en Docker

## Qué pasaba

Para que los tests E2E que **dependen de procesos en la UI** (wizard oferta, SIE, config oferta, etc.) se ejecuten, la API debe tener datos en la BD. Eso implica:

1. **PostgreSQL en marcha** (en tu caso, con `docker compose up -d`).
2. **`DATABASE_URL`** disponible cuando Playwright arranca la API y cuando corre el seed.

Si no había `.env` con `DATABASE_URL`, la API arrancaba sin conexión a la BD, el health devolvía 503 y Playwright hacía **timeout** esperando `/health`. Además, el global setup no ejecutaba el seed.

## Cambios hechos

1. **`playwright.config.ts`**  
   - Carga `.env` y `apps/api/.env` al inicio.  
   - Si no existe `DATABASE_URL` (y no es CI), usa por defecto la BD de Docker:  
     `postgresql://sercop:sercop@localhost:5432/sercop`  
   - Si no existe `REDIS_URL`, usa `redis://localhost:6380` (Redis en Docker con puerto 6380:6379).  
   Así, la API que levanta Playwright recibe estas variables y puede conectar a Postgres y Redis en Docker.

2. **`e2e/global-setup.js`**  
   - Si no hay `DATABASE_URL`, en entorno local usa el mismo valor por defecto de Docker.  
   - Antes del seed ejecuta **`db:generate`** y **`db:push`** para que el esquema exista (por si la BD está recién creada).  
   - Luego ejecuta **`db:seed`** para cargar procesos tipo SERCOP.

Con esto, **con la BD en Docker y sin `.env`**, el flujo E2E ya puede usar la BD y cargar procesos en la UI.

## Cómo ejecutar (con Docker)

1. **Levantar solo los servicios de infra (Postgres y, opcional, Redis):**
   ```bash
   docker compose up -d postgres redis
   ```
   (O `docker compose up -d` si quieres todos los servicios.)

2. **Ejecutar la batería E2E:**
   ```bash
   npm run test:e2e:battery
   ```
   - El config carga `.env` si existe; si no, usa los valores por defecto de Docker.  
   - El global setup hace `db:push` y `db:seed` contra `localhost:5432`.  
   - La API arranca con esa misma `DATABASE_URL` y responde 200 en `/health`.  
   - Los portales ven procesos en la UI y los tests que dependen de datos dejan de omitirse.

## Si usas un `.env` propio

Puedes crear `.env` en la raíz o en `apps/api/` con, por ejemplo:

- `DATABASE_URL=postgresql://sercop:sercop@localhost:5432/sercop`
- `REDIS_URL=redis://localhost:6380`

Así puedes cambiar usuario, contraseña o puerto sin tocar el código. Los valores por defecto del config solo se usan cuando **no** está definido `DATABASE_URL`.

## Resumen

- **Base de datos en Docker** (postgres en 5432, usuario `sercop`, BD `sercop`) + **`npm run test:e2e:battery`** debería ser suficiente para que la API arranque, el seed cargue procesos y los tests que necesitan datos en la UI se ejecuten.  
- Si algo falla, revisar que `docker compose up -d postgres` esté en marcha y que el puerto 5432 esté libre y accesible desde el host.
