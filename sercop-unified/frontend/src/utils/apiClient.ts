/**
 * API Client utility for making authenticated requests to the backend.
 * Automatically includes JWT token from localStorage in all requests.
 */

import { API_BASE_URL, NODE_API_BASE_URL, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../config/api.config';
import { attemptTokenRefresh } from './tokenRefresh';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Makes an authenticated API request with automatic JWT token injection.
 * @param endpoint - API endpoint WITHOUT /api prefix (e.g., '/foreign-trade/letters-of-credit/queries')
 *                   The API_BASE_URL already includes /api, so endpoints should start with the module path
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise with the response
 */
export const apiClient = async (endpoint: string, options: RequestOptions = {}): Promise<Response> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add X-Client-Id header for client-portal routes (required by security filter)
  if (endpoint.includes('/client-portal')) {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Use participantId or clienteId as the client ID
        const clientId = user.participantId || user.clienteId;
        if (clientId) {
          headers['X-Client-Id'] = String(clientId);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  // Add X-User-Id and X-User-Name headers for backoffice routes (required by controllers)
  if (endpoint.includes('/backoffice/')) {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.id) {
          headers['X-User-Id'] = String(user.id);
        }
        if (user.name || user.username) {
          headers['X-User-Name'] = user.name || user.username;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // Build URL: avoid duplicating /api prefix
  let url: string;
  // Multi-backend router: legacy Java + GPTsercop Fastify (/v1)
  const isNodeApi = endpoint.includes('/v1/');

  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else if (isNodeApi) {
    // Route /v1 through GPTsercop API to embed AI capabilities in legacy UI.
    url = endpoint.startsWith('/api') 
      ? `${NODE_API_BASE_URL}${endpoint}` 
      : `${NODE_API_BASE_URL}/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  } else if (endpoint.startsWith('/api')) {
    if (import.meta.env.DEV) {
      url = endpoint; // Runs through vite proxy -> java 8080
    } else {
      url = endpoint.startsWith(API_BASE_URL) ? endpoint : endpoint;
    }
  } else if (endpoint.startsWith('/')) {
    url = `${API_BASE_URL}${endpoint}`;
  } else {
    url = `${API_BASE_URL}/${endpoint}`;
  }

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized, attempt token refresh before redirecting
    if (response.status === 401) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const newToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        return fetch(url, { ...config, headers: retryHeaders });
      }
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.location.href = '/login';
      return response;
    }

    // If 403 Forbidden, verificar si es por token inválido
    if (response.status === 403) {
      // Intentar leer el body para ver si es un error de autenticación
      const clonedResponse = response.clone();
      try {
        const error = await clonedResponse.json();
        // Si el error indica token inválido o expirado, redirigir a login
        if (error.message?.toLowerCase().includes('token') || 
            error.message?.toLowerCase().includes('expired') || 
            error.message?.toLowerCase().includes('invalid') ||
            error.message?.toLowerCase().includes('unauthorized')) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          window.location.href = '/login';
          return response;
        }
      } catch (e) {
        // Si no se puede parsear, verificar si hay token
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
          window.location.href = '/login';
          return response;
        }
      }
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Convenience method for GET requests
 */
export const get = (endpoint: string, options?: RequestOptions) => {
  return apiClient(endpoint, { ...options, method: 'GET' });
};

/**
 * Convenience method for POST requests
 */
export const post = (endpoint: string, data?: any, options?: RequestOptions) => {
  return apiClient(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Convenience method for PUT requests
 */
export const put = (endpoint: string, data?: any, options?: RequestOptions) => {
  return apiClient(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Convenience method for PATCH requests
 */
export const patch = (endpoint: string, data?: any, options?: RequestOptions) => {
  return apiClient(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Convenience method for DELETE requests
 */
export const del = (endpoint: string, options?: RequestOptions) => {
  return apiClient(endpoint, { ...options, method: 'DELETE' });
};

export default apiClient;
