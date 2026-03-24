# Configuración de Catálogos Personalizados

Este directorio contiene la configuración centralizada de IDs de catálogos personalizados utilizados en la aplicación.

## Archivo Principal: `catalogs.config.ts`

Este archivo centraliza todos los IDs de catálogos para facilitar el mantenimiento y evitar valores hardcodeados dispersos en el código.

### Estructura

```typescript
export const CATALOG_IDS = {
  PRODUCT: 1763762814138,
  COUNTRY: null,
  // ... más catálogos
};
```

### Uso

#### Importar la configuración

```typescript
import { CATALOG_IDS, getCatalogId, isCatalogDefined } from '../config/catalogs.config';
```

#### Acceder a un ID de catálogo

```typescript
// Opción 1: Acceso directo (recomendado cuando el catálogo siempre está definido)
const productCatalogId = CATALOG_IDS.PRODUCT;

// Opción 2: Con validación (recomendado para catálogos opcionales)
const currencyCatalogId = getCatalogId('CURRENCY'); // Lanza error si no está configurado

// Opción 3: Verificar si está definido
if (isCatalogDefined('COUNTRY')) {
  const countryId = CATALOG_IDS.COUNTRY;
  // ... usar el ID
}
```

#### Ejemplo completo

```typescript
import { catalogoPersonalizadoService } from '../services/customCatalogService';
import { CATALOG_IDS } from '../config/catalogs.config';

const loadProducts = async () => {
  if (!CATALOG_IDS.PRODUCT) {
    throw new Error('El catálogo PRODUCT no está configurado');
  }

  const products = await catalogoPersonalizadoService
    .getCatalogosByCatalogoPadreId(CATALOG_IDS.PRODUCT);

  return products;
};
```

## Agregar Nuevos Catálogos

### 1. Agregar el ID al archivo `catalogs.config.ts`

```typescript
export const CATALOG_IDS = {
  // ... catálogos existentes

  /**
   * Catálogo de sucursales bancarias
   * Contiene: Sucursal Centro, Sucursal Norte, etc.
   */
  BRANCH: 1234567890123, // Reemplazar con el ID real
} as const;
```

### 2. Agregar al módulo correspondiente (opcional)

```typescript
export const CATALOG_BY_MODULE = {
  // ... módulos existentes

  LOCATIONS: {
    BRANCH: CATALOG_IDS.BRANCH,
    COUNTRY: CATALOG_IDS.COUNTRY,
  },
} as const;
```

### 3. Usar en tu componente

```typescript
import { CATALOG_IDS } from '../config/catalogs.config';

const branchId = CATALOG_IDS.BRANCH;
```

## Actualizar IDs Existentes

Si un ID de catálogo cambia en el futuro:

1. Abre `src/config/catalogs.config.ts`
2. Actualiza el valor correspondiente
3. Guarda el archivo
4. Recarga la aplicación

**IMPORTANTE**: No es necesario buscar y reemplazar en múltiples archivos, ya que todos usan la configuración centralizada.

## Catálogos Configurados

### PRODUCT (ID: 1763762814138)

Catálogo de tipos de productos financieros.

**Esquema de datos**:
| Campo | Propósito | Ejemplo |
|-------|-----------|---------|
| `codigo` | Identificador del producto | LC_IMPORT, LC_EXPORT |
| `nombre` | **Letra para referencia SWIFT** | M, E, B, O, I, S, J |
| `descripcion` | Descripción legible | CARTA DE CREDITO DE IMPORTACION |

**IMPORTANTE**: El campo `nombre` contiene la letra de un solo carácter que se usa para generar referencias SWIFT (:20:), NO el código completo del producto.

**Productos actuales**:
| Código | Nombre (SWIFT) | Descripción |
|--------|----------------|-------------|
| LC_IMPORT | **M** | Carta de Crédito de Importación |
| LC_EXPORT | **E** | Carta de Crédito de Exportación |

**Ejemplo de uso en ReferenceNumberConfig**:
```typescript
const products = catalogItems.map((item) => ({
  value: item.nombre,        // Usa 'M' o 'E' para la referencia
  label: `${item.nombre} - ${item.descripcion}`,  // Muestra "M - CARTA DE CREDITO..."
}));
```

**Usado en**:
- `ReferenceNumberConfig.tsx` - Configuración de números de referencia SWIFT
- Generación de referencias SWIFT (:20:)
- Módulo de Cartas de Crédito

### Otros Catálogos

Los siguientes catálogos están definidos pero pendientes de configuración (valor `null`):

- **COUNTRY**: Catálogo de países
- **CURRENCY**: Catálogo de monedas
- **GUARANTEE_TYPE**: Tipos de garantías
- **ACCOUNTING_RULES**: Reglas contables

Para configurarlos:
1. Crea el catálogo en la base de datos a través de la UI (Custom Catalogs)
2. Obtén el ID generado
3. Actualiza `catalogs.config.ts` con el ID real

## Mejores Prácticas

### ✅ Hacer

- Siempre importar IDs desde `catalogs.config.ts`
- Agregar comentarios descriptivos al definir nuevos catálogos
- Verificar que el catálogo esté definido antes de usarlo (especialmente si es `null`)
- Usar nombres de catálogo descriptivos y en MAYÚSCULAS

### ❌ Evitar

- NO hardcodear IDs de catálogos directamente en componentes
- NO usar números mágicos (ejemplo: `getCatalogos(1763762814138)`)
- NO duplicar la definición de IDs en múltiples archivos
- NO olvidar actualizar la documentación al agregar nuevos catálogos

## Troubleshooting

### Error: "El catálogo X no ha sido configurado"

**Causa**: El catálogo tiene valor `null` en `catalogs.config.ts`

**Solución**:
1. Crear el catálogo en la UI (Custom Catalogs)
2. Obtener el ID generado
3. Actualizar `catalogs.config.ts`

### Los cambios no se reflejan en la aplicación

**Solución**:
1. Verifica que guardaste `catalogs.config.ts`
2. Recarga la aplicación en el navegador (Ctrl+R o Cmd+R)
3. Si usas TypeScript, verifica que no haya errores de compilación

## Arquitectura

```
src/
├── config/
│   ├── catalogs.config.ts  ← Configuración centralizada de IDs
│   └── README.md            ← Esta documentación
├── services/
│   └── customCatalogService.ts  ← Servicio para consultar catálogos
└── pages/
    └── ReferenceNumberConfig.tsx  ← Ejemplo de uso
```

## Soporte

Para más información sobre catálogos personalizados, consulta:
- Backend: `CustomCatalogoController.java`
- Frontend Service: `src/services/customCatalogService.ts`
- UI: Navega a "Custom Catalogs" en la aplicación
