/**
 * Service for Product Type Configuration
 * Centralized mapping between product types and their UI views/wizards
 */
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL, TOKEN_STORAGE_KEY } from '../config/api.config';
import { PRODUCT_TYPE_CONFIG_ROUTES, CLIENT_PORTAL_CONFIG_ROUTES } from '../config/api.routes';
import { isClientUser } from '../config/api.client';

const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export interface ProductTypeConfig {
  id: number;
  productType: string;
  baseUrl: string;
  wizardUrl: string;
  viewModeTitleKey: string;
  description: string;
  swiftMessageType: string;
  category: string;
  accountPrefix?: string;
  active: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductTypeRouting {
  baseUrl: string;
  wizardUrl: string;
  viewModeTitleKey: string;
  category: string;
}

export interface ProductTypeRoutingMap {
  [productType: string]: ProductTypeRouting;
}

/**
 * Get all active product type configurations.
 * Uses client portal endpoint for CLIENT users.
 */
export const getAllConfigs = async (): Promise<ProductTypeConfig[]> => {
  // Use client portal endpoint for CLIENT users
  const endpoint = isClientUser()
    ? CLIENT_PORTAL_CONFIG_ROUTES.PRODUCT_TYPE_CONFIG
    : PRODUCT_TYPE_CONFIG_ROUTES.BASE;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error('Error al cargar configuraciones de tipos de producto');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get configuration for a specific product type.
 * Uses client portal endpoint for CLIENT users.
 */
export const getConfigByProductType = async (productType: string): Promise<ProductTypeConfig | null> => {
  // Use client portal endpoint for CLIENT users
  const endpoint = isClientUser()
    ? CLIENT_PORTAL_CONFIG_ROUTES.PRODUCT_TYPE_CONFIG_BY_CODE(productType)
    : PRODUCT_TYPE_CONFIG_ROUTES.BY_CODE(productType);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeader(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Error al cargar configuración para ${productType}`);
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get configurations by category
 */
export const getConfigsByCategory = async (category: string): Promise<ProductTypeConfig[]> => {
  const response = await fetch(`${API_BASE_URL}${PRODUCT_TYPE_CONFIG_ROUTES.BY_CATEGORY(category)}`, {
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error(`Error al cargar configuraciones para categoría ${category}`);
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get routing map for frontend navigation
 * Returns a map of productType -> routing info
 */
export const getRoutingMap = async (): Promise<ProductTypeRoutingMap> => {
  const response = await fetch(`${API_BASE_URL}${PRODUCT_TYPE_CONFIG_ROUTES.ROUTING_MAP}`, {
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error('Error al cargar mapa de rutas');
  }

  const result = await response.json();
  return result.data;
};

// Cache for routing map to avoid repeated API calls
let routingMapCache: ProductTypeRoutingMap | null = null;

/**
 * Get routing info for a specific product type (with caching)
 */
export const getRouting = async (productType: string): Promise<ProductTypeRouting | null> => {
  if (!routingMapCache) {
    routingMapCache = await getRoutingMap();
  }
  return routingMapCache[productType] || null;
};

/**
 * Clear the routing map cache (useful after updates)
 */
export const clearRoutingCache = (): void => {
  routingMapCache = null;
};

/**
 * Get base URL for navigation based on product type
 */
export const getBaseUrl = async (productType: string): Promise<string> => {
  const routing = await getRouting(productType);
  if (routing) {
    return routing.baseUrl;
  }
  // Fallback to lc-imports if not found
  console.warn(`No routing found for product type: ${productType}, using default`);
  return '/lc-imports';
};

/**
 * Get wizard URL for navigation based on product type
 */
export const getWizardUrl = async (productType: string): Promise<string> => {
  const routing = await getRouting(productType);
  if (routing) {
    return routing.wizardUrl;
  }
  // Fallback
  return '/lc-imports/issuance-wizard';
};

export const productTypeConfigService = {
  getAllConfigs,
  getConfigByProductType,
  getConfigsByCategory,
  getRoutingMap,
  getRouting,
  clearRoutingCache,
  getBaseUrl,
  getWizardUrl,
};
