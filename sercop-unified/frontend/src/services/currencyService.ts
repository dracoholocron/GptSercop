import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';

// Client Portal endpoint for currencies
const CLIENT_PORTAL_CURRENCIES_URL = `${API_BASE_URL}/client-portal/catalogs/currencies`;


export interface Moneda {
  id: number;
  codigo: string;
  nombre: string;
  simbolo?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateMonedaCommand {
  codigo: string;
  nombre: string;
  simbolo?: string;
  activo?: boolean;
  createdBy?: string;
}

export interface UpdateMonedaCommand {
  codigo: string;
  nombre: string;
  simbolo?: string;
  activo?: boolean;
  updatedBy?: string;
}

export interface EventHistory {
  eventId: string;
  eventType: string;
  timestamp: string;
  performedBy: string;
  version: number;
  eventData: Record<string, any>;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

class MonedaService {
  // Queries (Lectura)
  async getAllMonedas(): Promise<Moneda[]> {
    try {
      const response = await get(`${API_BASE_URL}/currencies/queries`);
      const result: ApiResponse<Moneda[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener monedas');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching monedas:', error);
      throw error;
    }
  }

  async getMonedaById(id: number): Promise<Moneda> {
    try {
      const response = await get(`${API_BASE_URL}/currencies/queries/${id}`);
      const result: ApiResponse<Moneda> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener moneda');
      }

      if (!result.data) {
        throw new Error('Moneda no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching moneda:', error);
      throw error;
    }
  }

  async getMonedaByCodigo(codigo: string): Promise<Moneda> {
    try {
      const response = await get(`${API_BASE_URL}/currencies/queries/codigo/${codigo}`);
      const result: ApiResponse<Moneda> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener moneda');
      }

      if (!result.data) {
        throw new Error('Moneda no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching moneda by codigo:', error);
      throw error;
    }
  }

  async getActiveMonedas(): Promise<Moneda[]> {
    try {
      const response = await get(`${API_BASE_URL}/currencies/queries/active`);
      const result: ApiResponse<Moneda[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener monedas activas');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching active monedas:', error);
      throw error;
    }
  }

  /**
   * Obtiene monedas activas usando el endpoint del Portal Cliente.
   * Este método debe usarse cuando el usuario es del Portal Cliente (ROLE_CLIENT).
   */
  async getActiveMonedasForClientPortal(): Promise<Moneda[]> {
    try {
      const response = await get(CLIENT_PORTAL_CURRENCIES_URL);
      const result: ApiResponse<Moneda[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener monedas');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching monedas for client portal:', error);
      throw error;
    }
  }

  /**
   * Detecta si el usuario actual es del Portal Cliente basándose en userType o roles.
   * Verifica tanto userType === 'CLIENT' como roles incluyendo 'ROLE_CLIENT'.
   */
  private isClientPortalUser(): boolean {
    try {
      const userDataStr = localStorage.getItem('globalcmx_user');
      if (!userDataStr) return false;
      const userData = JSON.parse(userDataStr);
      return userData?.userType === 'CLIENT' || userData?.roles?.includes('ROLE_CLIENT') || false;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene monedas activas usando el endpoint apropiado según el tipo de usuario.
   * - Usuario del Portal Cliente: usa /client-portal/catalogs/currencies
   * - Usuario interno: usa /currencies/queries/active
   */
  async getActiveMonedasAuto(): Promise<Moneda[]> {
    if (this.isClientPortalUser()) {
      return this.getActiveMonedasForClientPortal();
    }
    return this.getActiveMonedas();
  }

  async searchByNombre(nombre: string): Promise<Moneda[]> {
    try {
      const response = await get(`${API_BASE_URL}/currencies/queries/search?nombre=${encodeURIComponent(nombre)}`);
      const result: ApiResponse<Moneda[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al buscar monedas');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error searching monedas:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/currencies/queries/${id}/history`);
      const result: ApiResponse<EventHistory[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener historial de eventos');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching event history:', error);
      throw error;
    }
  }

  // Commands (Escritura)
  async createMoneda(command: CreateMonedaCommand): Promise<Moneda> {
    try {
      const response = await post(`${API_BASE_URL}/currencies/commands`, {
        ...command,
        activo: command.activo !== undefined ? command.activo : true,
        createdBy: command.createdBy || 'system',
      });

      const result: ApiResponse<Moneda> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear moneda');
      }

      if (!result.data) {
        throw new Error('No se recibió la moneda creada');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating moneda:', error);
      throw error;
    }
  }

  async updateMoneda(id: number, command: UpdateMonedaCommand): Promise<Moneda> {
    try {
      const response = await put(`${API_BASE_URL}/currencies/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<Moneda> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar moneda');
      }

      if (!result.data) {
        throw new Error('No se recibió la moneda actualizada');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating moneda:', error);
      throw error;
    }
  }

  async deleteMoneda(id: number, deletedBy?: string): Promise<void> {
    try {
      let url = `${API_BASE_URL}/currencies/commands/${id}`;
      if (deletedBy) {
        url += `?deletedBy=${encodeURIComponent(deletedBy)}`;
      }

      const response = await del(url);

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar moneda');
      }
    } catch (error) {
      console.error('Error deleting moneda:', error);
      throw error;
    }
  }
}

export const monedaService = new MonedaService();
