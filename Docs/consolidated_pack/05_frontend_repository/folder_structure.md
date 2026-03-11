# Estructura del repositorio frontend (monorepo)

En la raíz del repo (`apps/` y `packages/`):

```
  apps/
    public-portal
    supplier-portal
    entity-portal
    sercop-admin
  packages/
    design-system    # Componentes React compartidos (Button, Card, Table, Modal, etc.)
    api-client       # Cliente API (@sercop/api-client)
```

**Nota:** No existe un package separado `ui-components`; los componentes de UI reutilizables están en `design-system`. Las apps consumen `@sercop/design-system` y `@sercop/api-client`.
