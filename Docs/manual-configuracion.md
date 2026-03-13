# Manual de Configuración – Plataforma SERCOP V2

**Versión:** 1.0  
**Fecha:** 2026  
**Objetivo:** Describir todas las variables de entorno y opciones de configuración de la API y los portales.

---

## Índice

1. [Resumen de archivos de configuración](#1-resumen-de-archivos-de-configuración)
2. [Variables de la API](#2-variables-de-la-api)
3. [Variables de los portales (Next.js)](#3-variables-de-los-portales-nextjs)
4. [Configuración de Docker Compose](#4-configuración-de-docker-compose)
5. [Entornos (desarrollo, staging, producción)](#5-entornos-desarrollo-staging-producción)
6. [Seguridad y buenas prácticas](#6-seguridad-y-buenas-prácticas)
7. [Tabla de referencia rápida](#7-tabla-de-referencia-rápida)

---

## 1. Resumen de archivos de configuración

| Archivo / Ubicación      | Alcance           | Uso principal                          |
|--------------------------|-------------------|----------------------------------------|
| `.env` (raíz del repo)   | Global / scripts | DATABASE_URL, JWT_SECRET para scripts y E2E |
| `apps/api/.env`          | API               | Mismo que raíz si se ejecuta desde api |
| `.env.example` (raíz)    | Plantilla         | Copiar a `.env` y rellenar valores     |
| `docker-compose.yml`     | Contenedores      | Variables inyectadas en api, postgres, minio |
| `next.config.js` (cada portal) | Build Next   | Rewrites/proxy a API, env públicos      |
| `playwright.config.ts`  | Pruebas E2E       | URLs de servidores, timeouts, env      |

*[FIG: Diagrama que muestre dónde se lee cada variable: API, portales, Docker.]*

---

## 2. Variables de la API

La API (Fastify) lee las variables de entorno al iniciar. Pueden definirse en el sistema, en un archivo `.env` cargado por el proceso (por ejemplo con `dotenv` o por el runtime), o en el bloque `environment` de Docker.

### 2.1 Obligatorias para funcionamiento básico

| Variable       | Descripción | Ejemplo desarrollo | Ejemplo producción |
|----------------|-------------|--------------------|--------------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Prisma) | `postgresql://sercop:sercop@localhost:5432/sercop` | `postgresql://user:pass@host:5432/sercop?sslmode=require` |
| `JWT_SECRET`   | Secreto para firmar y verificar tokens JWT (mín. 16 caracteres) | `dev-secret-min-16-chars` | Valor largo y aleatorio desde gestor de secretos |

Sin `JWT_SECRET` o si tiene menos de 16 caracteres, la API arranca pero **desactiva la autenticación** (todas las rutas quedan abiertas). En producción debe estar siempre definido y ser fuerte.

*[FIG: Ejemplo de .env con DATABASE_URL y JWT_SECRET (valores de ejemplo, no reales).]*

### 2.2 Opcionales – Servidor y CORS

| Variable            | Descripción | Valor por defecto / nota |
|---------------------|-------------|---------------------------|
| `PORT`              | Puerto HTTP de la API | 3080 |
| `HOST`              | Interfaz de escucha (0.0.0.0 para Docker) | 0.0.0.0 en Docker |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para CORS, separados por coma | Sin definir: `origin: true` (cualquier origen; solo desarrollo) |

Producción típica:

```env
CORS_ALLOWED_ORIGINS=https://compraspublicas.gob.ec,https://admin.compraspublicas.gob.ec
```

### 2.3 Opcionales – Redis

| Variable     | Descripción | Ejemplo |
|-------------|-------------|---------|
| `REDIS_URL` | URL de conexión Redis | `redis://localhost:6379` o `redis://redis:6379` (Docker) |

Si no se define, la API no usa Redis. El endpoint `/health` incluye el estado de Redis solo cuando está configurado.

### 2.4 Opcionales – Almacenamiento de documentos (S3 / MinIO)

| Variable         | Descripción | Ejemplo desarrollo | Ejemplo producción |
|------------------|-------------|--------------------|--------------------|
| `S3_ENDPOINT`    | URL del endpoint S3 (MinIO o AWS) | `http://minio:9000` o `http://localhost:9000` | `https://s3.region.amazonaws.com` |
| `S3_ACCESS_KEY`  | Clave de acceso | `minioadmin` | Clave IAM / servicio |
| `S3_SECRET_KEY`  | Clave secreta | `minioadmin` | Secreto IAM / servicio |
| `S3_BUCKET`      | Nombre del bucket | `sercop-docs` | `sercop-docs-prod` |
| `S3_USE_SSL`     | Usar HTTPS para S3 | `false` (MinIO local) | `true` |
| `S3_REGION`      | Región (AWS) | — | `us-east-1` |

Si **ninguna** de `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` está definida, `POST /api/v1/documents/upload` responde **503** (servicio no configurado). El límite de tamaño por archivo en multipart es 20 MB (configurado en código).

### 2.5 Otras variables de la API

- **NODE_ENV:** `development` | `production`. Afecta logs de Prisma y comportamiento de errores.
- **CRAWLER_OCDS_URL:** Usado por scripts de importación (crawler) para apuntar a la API OCDS de datos abiertos. Por defecto puede ser la URL oficial de compras públicas.

---

## 3. Variables de los portales (Next.js)

Los portales son aplicaciones Next.js. Las variables que deben estar disponibles en el **navegador** deben tener el prefijo **NEXT_PUBLIC_**.

### 3.1 Comunes a todos los portales

| Variable                  | Descripción | Desarrollo | Producción |
|---------------------------|-------------|------------|------------|
| `NEXT_PUBLIC_API_URL`     | URL base de la API (sin /api/v1) | `http://localhost:3080` | `https://api.compraspublicas.gob.ec` |

Cada portal usa esta URL para todas las llamadas al backend (login, tenders, PAC, documentos, etc.). Si está vacía o no definida, el cliente suele usar `''` o `http://localhost:3080` por defecto en desarrollo.

*[FIG: Pantalla de configuración o .env.local con NEXT_PUBLIC_API_URL.]*

### 3.2 URLs entre portales (enlaces cruzados)

| Variable                      | Descripción | Uso típico |
|------------------------------|-------------|------------|
| `NEXT_PUBLIC_PUBLIC_URL`      | URL del portal público | Enlaces "Portal público" en admin, entidad y proveedor |
| `NEXT_PUBLIC_SUPPLIER_URL`    | URL del portal proveedor | Enlaces desde portal público o entidad al portal de ofertas |

Ejemplo en producción:

```env
NEXT_PUBLIC_API_URL=https://api.compraspublicas.gob.ec
NEXT_PUBLIC_PUBLIC_URL=https://compraspublicas.gob.ec
NEXT_PUBLIC_SUPPLIER_URL=https://proveedores.compraspublicas.gob.ec
```

### 3.3 Dónde definir las variables en Next.js

- **Desarrollo:** Archivo `.env.local` en la raíz del proyecto (junto a `package.json` del monorepo) o en la raíz de cada app. Next.js carga automáticamente `.env`, `.env.local`, `.env.development`, `.env.production`.
- **Build de producción:** Las variables `NEXT_PUBLIC_*` se embeben en el build; deben estar definidas en el momento de `next build` (por ejemplo en CI/CD o en el servidor de build).

---

## 4. Configuración de Docker Compose

El archivo `docker-compose.yml` define variables de entorno para los servicios. No es necesario tener un `.env` en la raíz para que Docker funcione; los valores por defecto están en el compose.

### 4.1 Servicio `api`

El servicio `api` recibe por defecto:

- `DATABASE_URL=postgresql://sercop:sercop@postgres:5432/sercop`
- `REDIS_URL=redis://redis:6379`
- `JWT_SECRET` desde variable de host: `${JWT_SECRET:-sercop-dev-secret-min-32-chars}` (si no existe en el host, usa el valor por defecto)
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` apuntando al servicio `minio`

Para **sobrescribir** en producción, puede usar un archivo `.env` en la misma carpeta que `docker-compose.yml` (Docker Compose lo lee por defecto) o pasar variables en la línea de comandos.

### 4.2 Servicio `public-portal` (contenedor)

Recibe `NEXT_PUBLIC_API_URL`; en el compose de ejemplo suele ser `http://localhost:3080`. En producción debería ser la URL pública de la API (por ejemplo `https://api.dominio.gob.ec`).

*[FIG: Fragmento de docker-compose.yml mostrando el bloque environment del servicio api.]*

---

## 5. Entornos (desarrollo, staging, producción)

### 5.1 Desarrollo

- **API:** `PORT=3080`, `DATABASE_URL` a BD local o Docker, `JWT_SECRET` de desarrollo, opcionalmente Redis y MinIO locales.
- **Portales:** `NEXT_PUBLIC_API_URL=http://localhost:3080`. Los portales suelen ejecutarse en puertos 3010, 3012, 3013, 3014.
- **CORS:** Puede dejarse abierto (`CORS_ALLOWED_ORIGINS` sin definir) para facilitar pruebas desde distintos orígenes.

### 5.2 Staging

- Mismas variables que producción pero con URLs y bases de datos de staging. Recomendable usar `NODE_ENV=production` y un `JWT_SECRET` distinto al de producción. CORS restringido a los dominios de staging.

### 5.3 Producción

- **JWT_SECRET:** Generado de forma segura y almacenado en gestor de secretos (no en el repositorio).
- **DATABASE_URL:** Conexión con SSL y usuario con permisos mínimos necesarios.
- **CORS_ALLOWED_ORIGINS:** Lista explícita de orígenes (dominios de los portales y del admin).
- **S3_*:** Credenciales de producción (IAM o servicio dedicado); bucket con políticas de acceso adecuadas.
- **NEXT_PUBLIC_API_URL:** URL pública y estable de la API (HTTPS).

Ver también `infra/pre-production-checklist.md` si existe en el repositorio.

---

## 6. Seguridad y buenas prácticas

- **No subir `.env` al repositorio.** El `.env.example` no debe contener secretos; solo nombres de variables y valores de ejemplo o comentarios.
- **Rotar JWT_SECRET** si se compromete; implica invalidar todos los tokens en curso.
- **En producción,** usar HTTPS en API y portales; configurar headers de seguridad (la API ya envía X-Content-Type-Options, X-Frame-Options).
- **Redis:** Si se usa para sesiones o rate limiting, proteger con contraseña y red privada.
- **MinIO/S3:** Políticas de bucket restrictivas; acceso solo desde la API o servicios autorizados. En AWS, usar IAM roles cuando sea posible en lugar de claves largas en variables.

*[FIG: Lista de comprobación de seguridad – ítems con checkbox.]*

---

## 7. Tabla de referencia rápida

| Variable | Dónde | Obligatoria | Notas |
|----------|--------|-------------|--------|
| DATABASE_URL | API / scripts | Sí | PostgreSQL |
| JWT_SECRET | API | Sí (prod) | Mín. 16 caracteres |
| PORT | API | No | Default 3080 |
| CORS_ALLOWED_ORIGINS | API | No (prod: recomendada) | Lista separada por coma |
| REDIS_URL | API | No | Health y futuras features |
| S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET | API | No | Si no hay, upload 503 |
| NEXT_PUBLIC_API_URL | Portales | Sí (implícito) | URL de la API |
| NEXT_PUBLIC_PUBLIC_URL | Portales | No | Enlaces al portal público |
| NEXT_PUBLIC_SUPPLIER_URL | Portales | No | Enlaces al portal proveedor |

---

*Incluir capturas o diagramas en los lugares marcados con [FIG: …] para una lectura más clara. Para listado completo de variables del API, revisar `.env.example` y el código en `apps/api/src/` (db, auth, storage, redis).*
