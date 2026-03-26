import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { API_BASE_URL_WITH_PREFIX, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../config/api.config';
import { attemptTokenRefresh, getTokenExpiration } from '../utils/tokenRefresh';

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  roles: string[];
  role: UserRole; // Para compatibilidad con código existente
  avatarUrl?: string;
  identityProvider?: string;
  userType?: string; // INTERNAL or CLIENT
  participantId?: string; // For client portal users (cliente_id)
  participantName?: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  errorCode?: string;  // e.g., 'SCHEDULE_ACCESS_DENIED', 'INVALID_CREDENTIALS'
  reasonKey?: string;  // i18n key e.g., 'schedule.error.outside_operation_hours'
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  loginWithToken: (token: string, userData: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapRolesToUserRole = (roles: string[]): UserRole => {
  if (roles.includes('ROLE_ADMIN')) return 'admin';
  if (roles.includes('ROLE_USER')) return 'manager';
  return 'user';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState<User | null>(() => {
    // Recuperar usuario de localStorage al iniciar
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      setIsLoading(true);

      // Obtener timezone del usuario para validación de horarios
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Enviar timezone como query parameter para evitar problemas de CORS con headers personalizados
      const loginUrl = `${API_BASE_URL_WITH_PREFIX}/auth/login?timezone=${encodeURIComponent(userTimezone)}`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Error de autenticación';
        let reasonKey: string | undefined;
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
          // Extraer la clave de traducción si existe (para errores de horario)
          if (error.data?.reason) {
            reasonKey = error.data.reason;
          }
          console.error('Error en login:', error);
        } catch (e) {
          console.error('Error en login - respuesta no válida:', response.status, response.statusText);
        }
        return { success: false, message: errorMessage, reasonKey };
      }

      const raw = await response.json();
      const data = raw?.data ?? raw;
      if (!data?.token) {
        return {
          success: false,
          message: raw?.message || 'Respuesta de autenticacion invalida',
        };
      }
      const roles = Array.isArray(data.roles) ? data.roles : [];

      // Crear objeto User
      const authenticatedUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles,
        role: mapRolesToUserRole(roles),
        userType: data.userType,
        participantId: data.participantId,
        participantName: data.participantName,
      };

      // Guardar en estado y localStorage
      setUser(authenticatedUser);
      setToken(data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);

      // Dispatch event for other contexts to react (e.g., BrandContext)
      window.dispatchEvent(new CustomEvent('auth:login'));

      return { success: true };
    } catch (error) {
      console.error('Error en login (excepción):', error);
      // Verificar si es un error de conexión
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080');
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo conectar al servidor',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  /**
   * Login with token (for SSO callback)
   */
  const loginWithToken = useCallback((newToken: string, userData: Partial<User>) => {
    const authenticatedUser: User = {
      id: userData.id || 0,
      username: userData.username || userData.email || '',
      email: userData.email || userData.username || '',
      name: userData.name,
      roles: userData.roles || ['ROLE_USER'],
      role: mapRolesToUserRole(userData.roles || ['ROLE_USER']),
      avatarUrl: userData.avatarUrl,
      identityProvider: userData.identityProvider,
      userType: userData.userType,
      participantId: userData.participantId,
      participantName: userData.participantName,
    };

    setUser(authenticatedUser);
    setToken(newToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
  }, []);

  // Proactive token refresh: schedule renewal 2 minutes before expiry
  useEffect(() => {
    if (!token) return;

    const exp = getTokenExpiration(token);
    if (!exp) return;

    const REFRESH_BUFFER_MS = 2 * 60 * 1000; // 2 minutes before expiry
    const msUntilRefresh = exp - Date.now() - REFRESH_BUFFER_MS;

    if (msUntilRefresh <= 0) {
      // Token already near expiry or expired, refresh immediately
      attemptTokenRefresh().then((refreshed) => {
        if (refreshed) {
          const newToken = localStorage.getItem(TOKEN_STORAGE_KEY);
          if (newToken) setToken(newToken);
        }
      });
      return;
    }

    const timerId = setTimeout(async () => {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const newToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (newToken) setToken(newToken);
      }
    }, msUntilRefresh);

    return () => clearTimeout(timerId);
  }, [token]);

  /**
   * Check if user is admin
   */
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role) || false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithToken,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAdmin,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
