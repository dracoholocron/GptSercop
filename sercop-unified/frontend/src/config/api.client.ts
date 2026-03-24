/**
 * API Client - Centralized HTTP client with authentication support
 */
import { API_BASE_URL_WITH_PREFIX, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './api.config';

/**
 * Check if the current user is a CLIENT type user (portal user).
 * CLIENT users have restricted access to certain APIs.
 */
export const isClientUser = (): boolean => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) return false;
  try {
    const user = JSON.parse(storedUser);
    return user.userType === 'CLIENT' || (user.roles && user.roles.includes('ROLE_CLIENT'));
  } catch {
    return false;
  }
};

interface ApiResponse<T> {
  data: T;
}

interface RequestConfig {
  params?: Record<string, string | number | boolean | undefined>;
}

const getAuthHeaders = (url?: string): HeadersInit => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add X-Client-Id header for client-portal routes
  if (url && url.includes('/client-portal')) {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.participantId) {
          headers['X-Client-Id'] = String(user.participantId);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return headers;
};

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  // Manejar 401 (Unauthorized) - token inválido o expirado
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('globalcmx_user');
    window.location.href = '/login';
    throw new Error('Unauthorized - Please login again');
  }

  // Manejar 403 (Forbidden) - puede ser token inválido o falta de permisos
  if (response.status === 403) {
    // Intentar parsear el error
    try {
      const error = await response.json();
      // Si el error indica token inválido o expirado, redirigir a login
      const errorMessage = error.message || error.error || '';
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes('token') || 
          lowerMessage.includes('expired') || 
          lowerMessage.includes('invalid') ||
          lowerMessage.includes('unauthorized') ||
          lowerMessage.includes('authentication')) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem('globalcmx_user');
        window.location.href = '/login';
        throw new Error('Session expired - Please login again');
      }
      // Si es solo un problema de permisos, lanzar error pero no redirigir
      throw new Error(errorMessage || 'Access forbidden - Insufficient permissions');
    } catch (e) {
      // Si el error ya fue lanzado (redirección a login), propagarlo
      if (e instanceof Error && e.message.includes('Session expired')) {
        throw e;
      }
      // Si no se puede parsear, verificar si hay token
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        window.location.href = '/login';
        throw new Error('No authentication token found');
      }
      // Si hay token pero aún así hay 403, podría ser un problema de permisos
      // No redirigir automáticamente, solo lanzar el error
      throw new Error('Access forbidden - Check your permissions');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { data: data.data || data };
};

const buildUrl = (url: string, config?: RequestConfig): string => {
  const fullUrl = `${API_BASE_URL_WITH_PREFIX}${url}`;
  if (config?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }
  return fullUrl;
};

export const apiClient = {
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const fullUrl = buildUrl(url, config);
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getAuthHeaders(url),
    });
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    const headers = getAuthHeaders(url);

    // For FormData, don't set Content-Type (browser will set it with boundary)
    if (isFormData) {
      delete (headers as Record<string, string>)['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${url}`, {
      method: 'POST',
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
    return handleResponse<T>(response);
  },

  async put<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(url),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(url),
    });
    return handleResponse<T>(response);
  },
};

export default apiClient;
