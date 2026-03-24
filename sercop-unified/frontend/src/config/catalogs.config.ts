/**
 * Configuración centralizada de IDs de catálogos personalizados
 *
 * Este archivo contiene todos los IDs de catálogos utilizados en la aplicación.
 * Si los IDs cambian en el futuro, solo es necesario actualizar este archivo.
 *
 * IMPORTANTE: Los IDs aquí definidos deben coincidir con los registros
 * en la base de datos (tabla custom_catalogs en el read model).
 */

export const CATALOG_IDS = {
  /**
   * Catálogo de tipos de productos financieros
   * Contiene: LC_IMPORT, LC_EXPORT, GUARANTEE, etc.
   *
   * IMPORTANTE: Los productos usan estos campos:
   * - codigo: Identificador del producto (LC_IMPORT, LC_EXPORT, etc.)
   * - nombre: Letra SWIFT de un carácter (M, E, B, O, I, S, J)
   * - descripcion: Descripción legible del producto
   *
   * Para referencias SWIFT, usar el campo 'nombre', NO 'codigo'
   */
  PRODUCT: 1763762814138,

  /**
   * Catálogo de países
   * Contiene: Ecuador, México, Estados Unidos, etc.
   */
  COUNTRY: null as number | null, // TODO: Definir cuando se cree

  /**
   * Catálogo de monedas
   * Contiene: USD, EUR, MXN, etc.
   */
  CURRENCY: null as number | null, // TODO: Definir cuando se cree

  /**
   * Catálogo de tipos de garantías
   * Contiene: Performance Bond, Bid Bond, etc.
   */
  GUARANTEE_TYPE: null as number | null, // TODO: Definir cuando se cree

  /**
   * Catálogo de reglas contables
   * Contiene: Reglas de débito/crédito, etc.
   */
  ACCOUNTING_RULES: null as number | null, // TODO: Definir cuando se cree
} as const;

/**
 * Tipo para acceder a los IDs de catálogos de forma segura
 */
export type CatalogId = keyof typeof CATALOG_IDS;

/**
 * Verifica si un ID de catálogo está definido
 */
export const isCatalogDefined = (catalogId: CatalogId): boolean => {
  return CATALOG_IDS[catalogId] !== null;
};

/**
 * Obtiene el ID de un catálogo o lanza un error si no está definido
 */
export const getCatalogId = (catalogId: CatalogId): number => {
  const id = CATALOG_IDS[catalogId];
  if (id === null) {
    throw new Error(`El catálogo ${catalogId} no ha sido configurado. Por favor, actualiza src/config/catalogs.config.ts`);
  }
  return id;
};

/**
 * IDs de catálogos específicos para diferentes módulos
 * Facilita la organización y búsqueda de catálogos por funcionalidad
 */
export const CATALOG_BY_MODULE = {
  REFERENCE_NUMBERS: {
    PRODUCT: CATALOG_IDS.PRODUCT,
    COUNTRY: CATALOG_IDS.COUNTRY,
  },
  LETTER_OF_CREDIT: {
    PRODUCT: CATALOG_IDS.PRODUCT,
    CURRENCY: CATALOG_IDS.CURRENCY,
  },
  GUARANTEES: {
    TYPE: CATALOG_IDS.GUARANTEE_TYPE,
    CURRENCY: CATALOG_IDS.CURRENCY,
  },
  ACCOUNTING: {
    RULES: CATALOG_IDS.ACCOUNTING_RULES,
  },
} as const;
