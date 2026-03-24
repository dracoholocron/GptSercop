/**
 * Configuración centralizada para las URLs de la API
 */

// URL base del backend - Kong API Gateway (puerto 8000)
// Siempre usar Kong para todas las llamadas API
const getApiBaseUrl = (): string => {
  // Si hay una variable de entorno configurada, usarla
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // En producción usar URLs relativas (nginx proxy)
  // En desarrollo local, usar Kong API Gateway directamente
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }

  // Producción: usar URL relativa para que nginx haga proxy
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// URL base con el prefijo /api para los endpoints
export const API_BASE_URL_WITH_PREFIX = API_BASE_URL;

// URL base para API v1 (estandarizado)
export const API_V1_URL = `${API_BASE_URL}/v1`;

// Token storage key
export const TOKEN_STORAGE_KEY = 'globalcmx_token';
export const USER_STORAGE_KEY = 'globalcmx_user';
