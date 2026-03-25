# Manual de Instalación – Plataforma SERCOP V2

**Versión:** 1.0  
**Fecha:** 2026  
**Requisitos:** Node.js >= 20, npm, Docker y Docker Compose (recomendado para infraestructura).

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Obtención del código](#2-obtención-del-código)
3. [Instalación con Docker (recomendada)](#3-instalación-con-docker-recomendada)
4. [Instalación sin Docker (solo Node.js)](#4-instalación-sin-docker-solo-nodejs)
5. [Verificación de la instalación](#5-verificación-de-la-instalación)
6. [Solución de problemas frecuentes](#6-solución-de-problemas-frecuentes)

---

## 1. Requisitos previos

### 1.1 Software necesario

| Software        | Versión mínima | Comprobación                    |
|-----------------|----------------|----------------------------------|
| Node.js         | 20.x LTS       | `node -v`                       |
| npm             | 10.x           | `npm -v`                         |
| Docker          | 20.x           | `docker -v`                      |
| Docker Compose  | 2.x            | `docker compose version`         |
| Git             | 2.x            | `git --version` (para clonar)    |

*[FIG: Tabla de requisitos – puede acompañarse de capturas de terminal con node -v y docker -v.]*

### 1.2 Puertos que debe tener libres (por defecto)

| Puerto | Servicio        | Uso                              |
|--------|-----------------|-----------------------------------|
| 3080   | API             | Backend REST                      |
| 5432   | PostgreSQL      | Base de datos                     |
| 6379/6380 | Redis       | Cache (Docker expone 6380:6379)   |
| 9000   | MinIO           | Almacenamiento de documentos     |
| 9001   | MinIO Console   | Consola web MinIO                 |
| 8080   | Nginx Gateway   | Proxy opcional hacia API          |
| 3005   | Portal público  | Si se usa public-portal en Docker |
| 3010   | Portal público  | Si se usa en modo dev             |
| 3012   | Portal proveedor| Desarrollo                        |
| 3013   | Portal entidad  | Desarrollo                        |
| 3014   | Portal admin    | Desarrollo                        |

---

## 2. Obtención del código

### 2.1 Clonar el repositorio

```bash
git clone https://github.com/dracoholocron/GptSercop.git
cd GptSercop
```

(O sustituir la URL por la de su organización si aplica.)

### 2.2 Instalar dependencias del monorepo

Desde la **raíz** del proyecto:

```bash
npm install
```

Esto instala dependencias de todos los workspaces activos definidos en `package.json` (apps seleccionadas + `packages/*`).

*[FIG: Terminal mostrando npm install en la raíz del proyecto.]*

---

## 3. Instalación con Docker (recomendada)

Esta opción levanta **PostgreSQL**, **Redis**, **MinIO** y la **API** (y opcionalmente el gateway y el portal público) en contenedores. Los portales se pueden ejecutar en modo desarrollo en el host.

### 3.1 Configurar variables de entorno

Copie el archivo de ejemplo y ajuste si es necesario:

```bash
cp .env.example .env
```

Para que la API en Docker pueda usar la base de datos, `DATABASE_URL` debe apuntar al servicio **postgres** dentro de la red Docker. El `docker-compose.yml` ya define para el servicio `api`:

- `DATABASE_URL=postgresql://sercop:sercop@postgres:5432/sercop`
- `REDIS_URL=redis://redis:6379`
- `S3_ENDPOINT=http://minio:9000`, etc.

Si ejecuta **solo** `docker compose up`, no necesita poner `DATABASE_URL` en `.env` del host para la API (va dentro del contenedor). Para ejecutar **comandos en el host** (por ejemplo `npm run db:seed` contra la misma base), use en el host:

- **Windows (PowerShell):**
  ```powershell
  $env:DATABASE_URL="postgresql://sercop:sercop@localhost:5432/sercop"
  ```
- **Linux/macOS:**
  ```bash
  export DATABASE_URL="postgresql://sercop:sercop@localhost:5432/sercop"
  ```

(O añada esta línea a su `.env` en la raíz si los scripts la cargan.)

### 3.2 Levantar la infraestructura y la API

En la raíz del proyecto:

```bash
npm run docker:up
```

Esto ejecuta `docker compose up -d` y levanta:

- **postgres** (puerto 5432)
- **redis** (puerto 6380 en host → 6379 en contenedor)
- **minio** (9000, 9001)
- **api** (3080)
- **gateway** (8080)
- **public-portal** (3005) si está definido en el compose

*[FIG: Salida de docker compose up -d mostrando los contenedores creados.]*

### 3.3 Crear esquema y datos de prueba (primera vez)

Con los contenedores ya en ejecución, en **otra terminal** y desde la raíz:

**PowerShell (Windows):**

```powershell
$env:DATABASE_URL="postgresql://sercop:sercop@localhost:5432/sercop"
npm run db:setup
```

**Bash (Linux/macOS):**

```bash
export DATABASE_URL="postgresql://sercop:sercop@localhost:5432/sercop"
npm run db:setup
```

`db:setup` ejecuta `db:push` (sincroniza el esquema Prisma con la base) y `db:seed` (carga entidades, proveedores, PAC, procesos, ofertas, datos para RAG, etc.).

*[FIG: Salida de npm run db:setup mostrando "Seed OK" o mensajes de creación de datos.]*

### 3.4 Levantar los portales en desarrollo (opcional)

Si desea usar los portales en su máquina (con hot-reload):

```bash
npm run dev:portales
```

Esto inicia en una sola terminal: admin (3004), supplier (3002), entity (3003). El **portal público** en desarrollo puede iniciarse aparte:

```bash
npm run dev:public-portal
```

(Generalmente en puerto 3010 según configuración.)

**Alternativa: arranque unificado**

```bash
npm run start:all
```

Este script intenta levantar Docker, esperar a que la API responda en 3080 y luego arrancar los tres portales (admin, supplier, entity). La primera vez conviene haber ejecutado ya `db:setup` como en 3.3.

---

## 4. Instalación sin Docker (solo Node.js)

Si no usa Docker, necesita **PostgreSQL** y, opcionalmente, **Redis** y **MinIO** instalados localmente (o accesibles en red).

### 4.1 Base de datos PostgreSQL

- Instale PostgreSQL 16 (o compatible).
- Cree una base de datos y un usuario, por ejemplo:

  ```sql
  CREATE USER sercop WITH PASSWORD 'sercop';
  CREATE DATABASE sercop OWNER sercop;
  ```

- Defina la URL en su `.env`:

  ```
  DATABASE_URL=postgresql://sercop:sercop@localhost:5432/sercop
  ```

### 4.2 Redis (opcional)

- Instale Redis y anote la URL, por ejemplo: `REDIS_URL=redis://localhost:6379`. Si no la define, la API seguirá funcionando; el health no incluirá Redis.

### 4.3 MinIO / S3 (opcional)

- Para subida de documentos, configure variables S3 (MinIO local o un bucket real). Ejemplo para MinIO local:

  ```
  S3_ENDPOINT=http://localhost:9000
  S3_ACCESS_KEY=minioadmin
  S3_SECRET_KEY=minioadmin
  S3_BUCKET=sercop-docs
  ```

- Si no las define, `POST /api/v1/documents/upload` responderá 503 (servicio no configurado).

### 4.4 JWT y CORS

- Para que el login emita tokens, defina un secreto de al menos 16 caracteres:

  ```
  JWT_SECRET=su-secreto-min-16-caracteres
  ```

- Opcional: `CORS_ALLOWED_ORIGINS` para producción (orígenes separados por coma).

### 4.5 Aplicar esquema y seed

Desde la raíz, con `DATABASE_URL` (y si aplica `REDIS_URL`, `JWT_SECRET`) ya configurados:

```bash
npm run db:setup
```

### 4.6 Iniciar la API

```bash
npm run dev
```

La API quedará en **http://localhost:3080**. Para producción: `npm run build --workspace=api` y luego `npm run start` (o `node dist/index.js` desde `apps/api`).

### 4.7 Iniciar los portales

En terminales separadas (o con un gestor de procesos):

```bash
npm run dev:public-portal    # Portal público
npm run dev:supplier-portal # Portal proveedor
npm run dev:entity-portal   # Portal entidad
npm run dev:admin           # Portal administrador
```

Cada portal usa por defecto `NEXT_PUBLIC_API_URL=http://localhost:3080` si no se redefine en su entorno. Puede configurarlo en `.env` de la raíz o en el entorno de cada app.

---

## 5. Verificación de la instalación

### 5.1 Health de la API

En el navegador o con curl:

```bash
curl http://localhost:3080/health
```

Respuesta esperada (ejemplo): `{"status":"ok","service":"api","database":"connected", ...}`. Si Redis está configurado, aparecerá también el estado de Redis.

*[FIG: Captura de respuesta JSON de /health en navegador o Postman.]*

### 5.2 Smoke test

Desde la raíz, con la API en marcha:

```bash
npm run smoke
```

Comprueba /health, /api/v1/tenders, /api/v1/pac, RAG/search y /ready. Si todo está correcto, no mostrará errores.

### 5.3 Probar un portal

1. Abra **http://localhost:3010** (portal público) o **http://localhost:3012** (proveedor).
2. En el portal público: compruebe que carga el listado de procesos (o mensaje vacío si no hay datos).
3. En el portal proveedor: vaya a **Login**, ingrese un correo de prueba (por ejemplo el del seed: `supplier@test.com`) y opcionalmente el RUC del proveedor de prueba; debe redirigir al inicio tras el login.

*[FIG: Portal público mostrando la página de inicio o listado de procesos.]*

### 5.4 Documentación de la API

Abra **http://localhost:3080/documentation** para acceder a la interfaz Swagger y probar endpoints desde el navegador.

*[FIG: Pantalla de Swagger UI con la lista de endpoints.]*

---

## 6. Solución de problemas frecuentes

| Síntoma | Posible causa | Acción |
|--------|----------------|--------|
| `ECONNREFUSED` al llamar a la API | API no está en marcha o puerto distinto | Verificar que la API esté levantada en 3080; revisar `NEXT_PUBLIC_API_URL` en los portales. |
| "Auth no configurado (JWT_SECRET)" | Falta o es corto `JWT_SECRET` | Definir `JWT_SECRET` con al menos 16 caracteres en el entorno de la API. |
| Error de Prisma / migración | Esquema desactualizado o BD vacía | Ejecutar `npm run db:push` (o `db:migrate` si usa migraciones) y luego `npm run db:seed`. |
| "Almacenamiento de documentos no configurado" | Variables S3 no definidas | Configurar S3_* o asumir que el upload no está disponible (503). |
| Portal muestra "Failed to fetch" | API no accesible desde el navegador o CORS | Asegurar que la API corre y que la URL en el portal es correcta; en producción revisar CORS. |
| Docker: API no arranca | Postgres/Redis no listos | Usar `depends_on` con healthcheck (ya en compose). Revisar logs: `docker compose logs api`. |
| Puerto ya en uso | Otro proceso usando 3080, 5432, etc. | Cambiar puerto en configuración o detener el proceso que ocupa el puerto. Puede usar `npm run ports:kill` si existe el script. |

*[FIG: Tabla de solución de problemas – puede incluir captura de un mensaje de error típico y su resolución.]*

---

**Resumen rápido (desarrollo con Docker):**

1. `git clone` → `npm install`  
2. `npm run docker:up`  
3. Definir `DATABASE_URL` en el host y ejecutar `npm run db:setup`  
4. (Opcional) `npm run start:all` o `npm run dev:portales`  
5. Verificar con `curl http://localhost:3080/health` y `npm run smoke`  
6. Abrir portales en 3010 (público), 3012 (proveedor), 3013 (entidad), 3014 (admin).

---

*Incluir capturas de pantalla en los lugares indicados con [FIG: …] para facilitar el seguimiento paso a paso.*
