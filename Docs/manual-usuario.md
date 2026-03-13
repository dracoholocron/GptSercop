# Manual de Usuario – Plataforma SERCOP V2

**Versión:** 1.0  
**Fecha:** 2026  
**Alcance:** Portal público, Portal proveedor, Portal entidad y Portal administrador.

---

## Índice

1. [Introducción](#1-introducción)
2. [Acceso a la plataforma](#2-acceso-a-la-plataforma)
3. [Portal público (ciudadanía)](#3-portal-público-ciudadanía)
4. [Portal proveedor](#4-portal-proveedor)
5. [Portal entidad contratante](#5-portal-entidad-contratante)
6. [Portal administrador](#6-portal-administrador)
7. [Glosario y ayuda](#7-glosario-y-ayuda)

---

## 1. Introducción

La **Plataforma SERCOP V2** es un sistema de contratación pública que permite:

- **Consultar** procesos de contratación, planes anuales (PAC) y normativa.
- **Presentar ofertas** como proveedor en procesos abiertos (licitación, subasta inversa electrónica SIE).
- **Gestionar procesos** como entidad contratante (crear, publicar, evaluar, adjudicar).
- **Administrar** entidades, usuarios, denuncias y parámetros del sistema.

Este manual describe las pantallas y flujos implementados para cada tipo de usuario. Donde se indica *[FIG: descripción]* se recomienda incluir una captura de pantalla para facilitar la lectura.

---

## 2. Acceso a la plataforma

### 2.1 URLs por entorno

| Portal            | Desarrollo (ejemplo)     | Descripción                          |
|-------------------|---------------------------|--------------------------------------|
| Portal público    | http://localhost:3010     | Procesos, normativa, denuncias       |
| Portal proveedor  | http://localhost:3012     | Login proveedor, ofertas, procesos    |
| Portal entidad    | http://localhost:3013     | Login entidad, PAC, procesos          |
| Portal administrador | http://localhost:3014  | Admin, entidades, usuarios            |
| API               | http://localhost:3080     | Backend (documentación en /documentation) |

*[FIG: Mapa de portales – diagrama con las cuatro URLs y un ícono por portal.]*

### 2.2 Navegadores recomendados

- Chrome, Edge o Firefox (versiones recientes).
- JavaScript habilitado y cookies para mantener la sesión.

---

## 3. Portal público (ciudadanía)

El portal público no requiere inicio de sesión. Cualquier persona puede consultar información.

### 3.1 Inicio (home)

- Página principal con enlaces a **Procesos**, **Normativa**, **Denuncias**, **Cifras**, **Servicios**, **Certificación**, **Modelos y pliegos**, **Notificaciones** y **Enlaces**.

*[FIG: Captura del portal público – barra de navegación y contenido principal.]*

### 3.2 Procesos de contratación

- **Listado:** Muestra procesos publicados con filtros (palabras clave, fechas, etc.) y botón **Buscar**.
- **Detalle:** Al hacer clic en un proceso se abre la ficha con descripción, plazos, enlace a “Presentar oferta” (redirige al portal proveedor) y sección de aclaraciones.

*[FIG: Listado de procesos con filtros colapsables y tarjetas de resultados.]*  
*[FIG: Detalle de un proceso con pestañas o secciones (datos, plazos, aclaraciones).]*

### 3.3 Normativa

- Búsqueda en normativa y manuales (RAG). Campo de búsqueda y resultados con fragmentos relevantes.

*[FIG: Pantalla de normativa con caja de búsqueda y resultados.]*

### 3.4 Denuncias

- Formulario para enviar una **denuncia** (categoría, resumen y otros campos según implementación). Botón **Enviar denuncia**.

*[FIG: Formulario de denuncia con categoría, resumen y botón Enviar.]*

### 3.5 Otras secciones

- **Cifras**, **Servicios**, **Certificación**, **Modelos y pliegos**, **Notificaciones**, **Enlaces**: páginas informativas o de enlaces; la navegación es directa desde el menú.

---

## 4. Portal proveedor

Dirigido a **proveedores** que desean participar en procesos de contratación.

### 4.1 Inicio de sesión

- Ruta: **/login**.
- Campos: **Correo electrónico** (obligatorio), **RUC** (opcional, para vincular el proveedor).
- Botón **Entrar**. Enlace “¿No tiene cuenta? Registrarse”.

*[FIG: Pantalla de login del portal proveedor con correo, RUC opcional y botón Entrar.]*

Tras un login correcto se redirige al inicio del portal y se muestra el menú (Procesos, Ofertas, Normativa, Perfil, Registro).

### 4.2 Registro de proveedor (RUP)

- Ruta: **/registro**.
- Formulario con: Nombre/razón social, RUC, nombre legal, nombre comercial, provincia, cantón, dirección.
- Opción de completar **registro RUP** (pasos y códigos CPC de actividad) si ya existe un proveedor vinculado.

*[FIG: Formulario de registro con datos básicos y bloque de códigos CPC.]*

### 4.3 Procesos

- **Listado:** Procesos publicados en los que el proveedor puede participar. En cada tarjeta: enlace **Presentar oferta** o **Subasta inversa (SIE)** según el tipo de proceso.

*[FIG: Listado de procesos del proveedor con botones Presentar oferta / SIE.]*

### 4.4 Presentar oferta (wizard)

- Desde el listado se accede al **wizard de oferta** (pasos: datos, contacto, económica, etc.).
- Botones **Anterior** y **Siguiente** para navegar. Paso de contacto con email/teléfono; paso económico con monto.
- Al finalizar se envía la oferta al proceso.

*[FIG: Wizard de oferta – paso de contacto con campos email y teléfono.]*  
*[FIG: Wizard de oferta – paso económica con monto.]*

### 4.5 Subasta inversa electrónica (SIE)

- Para procesos tipo SIE: pantalla con estado de la subasta, mejor oferta y opción de **Enviar** puja o **Refrescar**.

*[FIG: Pantalla SIE con estado, mejor oferta y botón Enviar/Refrescar.]*

### 4.6 Mis ofertas

- Ruta: **/ofertas**. Listado de ofertas presentadas por el proveedor; enlace **Ver detalle** por cada una.

*[FIG: Listado de ofertas del proveedor con enlace Ver detalle.]*

### 4.7 Perfil y normativa

- **Perfil:** Datos del usuario/proveedor (según implementación).
- **Normativa:** Misma búsqueda RAG que en el portal público.

### 4.8 Autoinvitación

- En el **detalle de un proceso** (portal proveedor), si el proceso lo permite, aparece el enlace **Registrarse a este proceso**. Al usarlo con `autoinvitation=1` se llega al wizard de oferta para inscribirse y presentar oferta.

*[FIG: Detalle proceso con enlace “Registrarse a este proceso”.]*

---

## 5. Portal entidad contratante

Dirigido a **entidades** que publican y gestionan procesos de contratación.

### 5.1 Inicio de sesión

- Ruta: **/login**.
- Campos: **Correo electrónico**, **Entidad** (selector con lista de entidades).
- Botón **Entrar**.

*[FIG: Login entidad con correo y selector de entidad.]*

### 5.2 Inicio e índice

- Tras el login: menú con **Procesos**, **PAC**, **Catálogos**, **Órdenes de compra**, **Rendición de cuentas**, **Reportes**, **Documentos**, **Normativa**.

### 5.3 Procesos

- **Listado:** Procesos de la entidad. Acceso a **Nuevo proceso** y a cada proceso por id.
- **Nuevo proceso:** Creación de proceso (título, descripción, método, tipo, etc.).
- **Editar proceso:** Datos generales, plazos, documentos (estudio de mercado, acta de aclaraciones, informe de necesidad, certificación presupuestaria, resolución de inicio, documento APU para obras).
- **Ofertas:** Listado de ofertas recibidas en el proceso.
- **Evaluaciones:** Carga de evaluaciones (puntajes técnico, financiero, BAE, participación nacional; para obras: experiencia general/específica, subcontratación, otros).
- **Contrato:** Gestión del contrato adjudicado (datos, resolución de adjudicación, informe de resultado).
- **Aclaraciones:** Preguntas y respuestas del proceso.

*[FIG: Listado de procesos de la entidad con botón Nuevo.]*  
*[FIG: Edición de proceso con pestañas o secciones (datos, plazos, documentos).]*  
*[FIG: Pantalla de evaluaciones con campos de puntaje.]*

### 5.4 PAC (Plan Anual de Contratación)

- **Listado:** PAC por entidad y año. **Detalle:** Procesos asociados al plan.

*[FIG: Listado PAC con año y entidad.]*

### 5.5 Catálogos, órdenes de compra, reportes y documentos

- **Catálogos:** Gestión de catálogos electrónicos e ítems (código CPC, nombre, precio ref.).
- **Órdenes de compra:** Listado y gestión de órdenes vinculadas a catálogo o proceso.
- **Reportes:** Pantallas de reportes (según implementación).
- **Documentos:** Acceso a documentos subidos (por proceso o entidad).

### 5.6 Rendición de cuentas y normativa

- **Rendición de cuentas:** Información o enlaces según implementación.
- **Normativa:** Búsqueda RAG en normativa y manuales.

---

## 6. Portal administrador

Dirigido a **administradores** del sistema (SERCOP o soporte).

### 6.1 Inicio de sesión

- Ruta: **/login** (admin). Credenciales con rol **admin** (correo configurado en seed o IdP).

*[FIG: Pantalla de login del administrador.]*

### 6.2 Dashboard e índice

- Menú: **Dashboard**, **Procesos**, **Entidades**, **Denuncias**, **Reclamos**, **Usuarios**, **Auditoría**, **Parámetros**, **Normativa**.

### 6.3 Entidades

- Listado y alta/edición de **entidades** (nombre, código, etc.).

*[FIG: Listado de entidades en el admin.]*

### 6.4 Usuarios

- Gestión de **usuarios** (vínculo con entidad si aplica). Según implementación: listado, edición, roles.

*[FIG: Pantalla de usuarios del admin.]*

### 6.5 Procesos

- Vista global de **procesos** (todas las entidades). Enlace a configuración de oferta (**Config oferta**) por proceso.

*[FIG: Listado de procesos en admin con enlace a configuración.]*

### 6.6 Denuncias y reclamos

- **Denuncias:** Listado y seguimiento de denuncias públicas.
- **Reclamos:** Reclamos formales de proveedores sobre procesos (evaluación, adjudicación, etc.).

### 6.7 Auditoría y parámetros

- **Auditoría:** Registro de acciones (quién, qué, cuándo) para trazabilidad.
- **Parámetros:** Configuración global del sistema (si está implementado).

### 6.8 Normativa

- Acceso a la misma búsqueda RAG de normativa que en los otros portales.

---

## 7. Glosario y ayuda

| Término        | Definición breve                                                                 |
|----------------|-----------------------------------------------------------------------------------|
| PAC            | Plan Anual de Contratación; agrupa los procesos de una entidad por año.          |
| RUP            | Registro Único de Proveedores; datos y códigos CPC del proveedor.                 |
| SIE            | Subasta Inversa Electrónica; proceso con puja en tiempo real (mín. 10.000 USD).   |
| Licitación     | Procedimiento de contratación (bienes/servicios u obras) con ofertas y evaluación.|
| BAE            | Contenido de Bienes con Valor Agregado Ecuatoriano (porcentaje nacional).        |
| APU            | Análisis de Precios Unitarios; instrumento de presupuesto en licitación de obras.|
| Convalidación  | Plazo para que el proveedor solicite corrección de errores formales en su oferta. |

**Ayuda adicional:** Para problemas de acceso o errores “Failed to fetch”, compruebe que la API esté en ejecución (puerto 3080 en desarrollo) y que la URL de la API configurada en cada portal sea correcta. Para recuperación de contraseña, use las opciones “¿Olvidó su contraseña?” cuando estén disponibles en login.

---

*Documento generado para la plataforma SERCOP V2. Incluir capturas de pantalla en los lugares marcados con [FIG: …] para una lectura más sencilla.*
