import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import { USER_ROUTES, buildUrlWithParams } from '../config/api.routes';

export interface User {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  roles: Role[];
  userType?: 'INTERNAL' | 'CLIENT';
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface CreateUserCommand {
  username: string;
  email: string;
  password: string;
  enabled?: boolean;
  roleIds?: number[];
  userType?: 'INTERNAL' | 'CLIENT';
  clienteId?: string;
}

export interface UpdateUserCommand {
  email?: string;
  password?: string;
  enabled?: boolean;
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  roleIds?: number[];
  userType?: 'INTERNAL' | 'CLIENT';
  clienteId?: string;
}

export interface EventHistory {
  eventId: string;
  eventType: string;
  timestamp: string;
  performedBy: string;
  version: number;
  eventData: Record<string, any>;
}

/**
 * Servicio para gestionar usuarios del sistema
 */
export const userService = {
  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await get(`${API_BASE_URL}${USER_ROUTES.BASE}`);
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  /**
   * Obtener usuarios internos (ejecutivos de cuenta)
   */
  async getInternalUsers(): Promise<User[]> {
    try {
      const response = await get(`${API_BASE_URL}${USER_ROUTES.BASE}`);
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      const data: User[] = await response.json();
      // Filtrar usuarios internos (INTERNAL) habilitados
      return data.filter(user => user.userType === 'INTERNAL' && user.enabled);
    } catch (error) {
      console.error('Error al obtener usuarios internos:', error);
      throw error;
    }
  },

  /**
   * Obtener usuarios filtrados por rol
   * @param roleName Nombre del rol a filtrar (e.g., 'account_executive', 'ROLE_ACCOUNT_EXECUTIVE')
   * Maneja automáticamente el prefijo ROLE_ para mayor flexibilidad
   */
  async getUsersByRole(roleName: string): Promise<User[]> {
    try {
      const response = await get(`${API_BASE_URL}${USER_ROUTES.BASE}`);
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      const data: User[] = await response.json();

      // Normalizar el nombre del rol para comparación flexible
      const normalizedRoleName = roleName.toLowerCase().replace(/^role_/, '');

      // Filtrar usuarios habilitados que tengan el rol especificado
      return data.filter(user =>
        user.enabled &&
        user.roles?.some(role => {
          const normalizedUserRole = role.name.toLowerCase().replace(/^role_/, '');
          return normalizedUserRole === normalizedRoleName;
        })
      );
    } catch (error) {
      console.error(`Error al obtener usuarios con rol ${roleName}:`, error);
      throw error;
    }
  },

  /**
   * Obtener un usuario por ID
   */
  async getUserById(id: number): Promise<User> {
    try {
      const response = await get(`${API_BASE_URL}${USER_ROUTES.BY_ID(id)}`);
      if (!response.ok) {
        throw new Error('Error al obtener usuario');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo usuario
   */
  async createUser(command: CreateUserCommand): Promise<User> {
    try {
      const response = await post(`${API_BASE_URL}${USER_ROUTES.BASE}`, command);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear usuario');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  /**
   * Actualizar un usuario existente
   */
  async updateUser(id: number, command: UpdateUserCommand): Promise<User> {
    try {
      const response = await put(`${API_BASE_URL}${USER_ROUTES.BY_ID(id)}`, command);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar usuario');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  },

  /**
   * Eliminar un usuario (soft delete)
   */
  async deleteUser(id: number, soft: boolean = true): Promise<void> {
    try {
      const url = buildUrlWithParams(USER_ROUTES.BY_ID(id), soft ? { soft: 'true' } : {});
      const response = await del(`${API_BASE_URL}${url}`);
      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los roles disponibles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await get(`${API_BASE_URL}${USER_ROUTES.ROLES}`);
      if (!response.ok) {
        throw new Error('Error al obtener roles');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de eventos de un usuario
   */
  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}${USER_ROUTES.HISTORY(id)}`);
      if (!response.ok) {
        throw new Error('Error al obtener historial de eventos');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener historial de eventos:', error);
      throw error;
    }
  },
};

/**
 * Get users for dropdown selection (simplified format)
 */
export interface UserForSelect {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function getUsers(): Promise<UserForSelect[]> {
  const response = await get(`${API_BASE_URL}${USER_ROUTES.BASE}`);
  if (!response.ok) {
    throw new Error('Error al obtener usuarios');
  }
  const data: User[] = await response.json();
  // Return enabled users in simplified format
  return data
    .filter(u => u.enabled)
    .map(u => ({
      username: u.username,
      firstName: (u as any).firstName || u.username,
      lastName: (u as any).lastName || '',
      email: u.email,
    }));
}
