# Portal proveedores – especificaciones

## Menú

Inicio | Registrarme | Procesos Abiertos | Mis Ofertas | Normativa | Mi Perfil

## Pantallas

| Ruta | Contenido | API |
|------|-----------|-----|
| /login | Email + rol supplier | auth/login |
| /registro | Formulario RUP | providers POST |
| / | Dashboard ofertas y procesos | tenders, bids |
| /procesos | Tenders publicados | tenders |
| /procesos/[id]/oferta | Formulario bid | tenders/:id/bids POST |
| /ofertas | Mis ofertas | bids por provider |
| /perfil | Editar proveedor | providers GET/PUT |
| /normativa | Búsqueda RAG | rag/search |

## Campos registro (RUP)

- name (obligatorio), identifier (RUC), legalName, tradeName, province, canton, address

## Campos oferta

- providerId (obligatorio), amount
