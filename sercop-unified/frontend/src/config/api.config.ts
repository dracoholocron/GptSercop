/**
 * Configuración centralizada para las URLs de la API
 */

// URL base del backend.
// En dev usamos ruta relativa para que Vite proxy resuelva el backend.
const getApiBaseUrl = (): string => {
  // Si hay una variable de entorno configurada, usarla
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // En desarrollo y producción usar URL relativa para evitar dependencias
  // de localhost en el navegador del cliente.
  if (import.meta.env.DEV) {
    return '/api';
  }

  // Producción: usar URL relativa para que nginx haga proxy
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// URL base con el prefijo /api para los endpoints
export const API_BASE_URL_WITH_PREFIX = API_BASE_URL;

// URL base para API v1 (estandarizado)
export const API_V1_URL = `${API_BASE_URL}/v1`;

// Endpoint del API GPTsercop (Fastify). Se puede sobreescribir por entorno.
const getNodeApiBaseUrl = (): string => {
  if (import.meta.env.VITE_GPTSERCOP_API_BASE_URL) {
    return import.meta.env.VITE_GPTSERCOP_API_BASE_URL;
  }
  // Puerto expuesto por gptsercop-api en docker compose local/remoto.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3080`;
  }
  return 'http://localhost:3080';
};

export const NODE_API_BASE_URL = getNodeApiBaseUrl();

// Token storage key
export const TOKEN_STORAGE_KEY = 'globalcmx_token';
export const USER_STORAGE_KEY = 'globalcmx_user';
