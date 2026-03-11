# Evidencia Fase 2 – Admin: usuarios y normativa

## Contenido implementado

- **/usuarios**: Listado de usuarios (email, nombre, estado, entidad) desde `GET /api/v1/users`. Enlace en menú Admin.
- **/normativa**: Listado de chunks RAG con tabla; botón "Nuevo chunk"; formulario (título, contenido, fuente, tipo, URL); editar y eliminar con confirmación. Usa `GET/POST/GET/:id/PUT/DELETE /api/v1/rag/chunks`.

## Cómo reproducir

1. API en marcha con JWT_SECRET y db:seed (usuarios admin@mec.gob.ec, etc.).
2. Admin: `npm run dev:admin` (puerto 3004).
3. Login con email `admin@mec.gob.ec` y rol admin.
4. Navegar a Usuarios y a Normativa; crear/editar/eliminar un chunk.

## Capturas recomendadas

- Pantalla /usuarios con tabla de usuarios.
- Pantalla /normativa con listado de chunks.
- Modal "Nuevo chunk" o "Editar chunk" con formulario.
- Mensaje o estado tras crear/editar/eliminar.
