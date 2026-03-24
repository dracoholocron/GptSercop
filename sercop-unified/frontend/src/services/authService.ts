import { API_BASE_URL_WITH_PREFIX, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../config/api.config';
import { AUTH_ROUTES, buildUrlWithParams } from '../config/api.routes';

/**
 * Identity Provider information
 */
export interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  authorizationUrl: string | null;
  isDefault: boolean;
}

/**
 * User information returned from authentication
 */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  name?: string;
  roles: string[];
  permissions?: string[];
  avatarUrl?: string;
  identityProvider?: string;
}

/**
 * Authentication response from backend
 */
export interface AuthResponse {
  token: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  newUser?: boolean;
  provider?: string;
  id?: number;
  email?: string;
  roles?: string[];
}

/**
 * OAuth2 initiation response
 */
export interface OAuth2InitResponse {
  authorizationUrl: string;
  state: string;
}

/**
 * Authentication Service
 * Handles local and SSO authentication
 */
class AuthService {
  /**
   * Get list of enabled identity providers
   */
  async getEnabledProviders(): Promise<ProviderInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${AUTH_ROUTES.PROVIDERS}`);
      if (!response.ok) {
        console.error('Failed to fetch providers');
        return this.getDefaultProviders();
      }
      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      return this.getDefaultProviders();
    }
  }

  /**
   * Default providers (fallback)
   */
  private getDefaultProviders(): ProviderInfo[] {
    return [
      {
        id: 'LOCAL',
        name: 'Local Authentication',
        icon: 'key',
        authorizationUrl: null,
        isDefault: true,
      },
    ];
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${AUTH_ROUTES.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      this.saveAuthData(data);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Initiate OAuth2 SSO flow
   */
  async initiateOAuth2(providerId: string, returnUrl?: string): Promise<string> {
    try {
      const params: Record<string, string> = {};
      if (returnUrl) {
        params.returnUrl = returnUrl;
      }

      const url = buildUrlWithParams(AUTH_ROUTES.OAUTH2_INITIATE(providerId), params);
      const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${url}`);

      if (!response.ok) {
        throw new Error('Failed to initiate OAuth2');
      }

      const data: { data: OAuth2InitResponse } = await response.json();

      // Store state for CSRF validation
      if (data.data?.state) {
        sessionStorage.setItem('oauth2_state', data.data.state);
      }

      return data.data.authorizationUrl;
    } catch (error) {
      console.error('OAuth2 initiation error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth2 callback
   */
  async handleOAuth2Callback(provider: string, code: string, state: string): Promise<AuthResponse> {
    // Validate state
    const storedState = sessionStorage.getItem('oauth2_state');
    if (storedState && state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('oauth2_state');

    const url = buildUrlWithParams(AUTH_ROUTES.OAUTH2_CALLBACK(provider), { code, state });
    const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${url}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'OAuth2 callback failed');
    }

    const data = await response.json();
    const authData = data.data || data;
    this.saveAuthData(authData);
    return authData;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem('oauth2_state');
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<string[]> {
    const token = this.getToken();
    if (!token) return [];

    try {
      const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${AUTH_ROUTES.MY_PERMISSIONS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  }

  /**
   * Save authentication data to storage
   */
  private saveAuthData(data: AuthResponse): void {
    if (data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    }

    const user: AuthUser = {
      id: data.id || 0,
      username: data.username,
      email: data.email || data.username,
      name: data.name,
      roles: data.roles || [],
      avatarUrl: data.avatarUrl,
      identityProvider: data.provider,
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Refresh token (if supported by backend)
   */
  async refreshToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${AUTH_ROUTES.REFRESH}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
