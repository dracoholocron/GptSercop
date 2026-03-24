import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface Cotizacion {
  id: number;
  codigoMoneda: string;
  fecha: string;
  valorCompra: number;
  valorVenta: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCotizacionCommand {
  codigoMoneda: string;
  fecha: string;
  valorCompra: number;
  valorVenta: number;
  createdBy?: string;
}

export interface UpdateCotizacionCommand {
  codigoMoneda: string;
  fecha: string;
  valorCompra: number;
  valorVenta: number;
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

class CotizacionService {
  // Queries (Lectura)
  async getAllCotizaciones(): Promise<Cotizacion[]> {
    try {
      const response = await get(`${API_BASE_URL}/exchange-rates/queries`);
      const result: ApiResponse<Cotizacion[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizaciones');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      throw error;
    }
  }

  async getLatestCotizaciones(): Promise<Cotizacion[]> {
    try {
      const response = await get(`${API_BASE_URL}/exchange-rates/queries/latest`);
      const result: ApiResponse<Cotizacion[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizaciones más recientes');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching latest cotizaciones:', error);
      throw error;
    }
  }

  async getCotizacionById(id: number): Promise<Cotizacion> {
    try {
      const response = await get(`${API_BASE_URL}/exchange-rates/queries/${id}`);
      const result: ApiResponse<Cotizacion> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizacion');
      }

      if (!result.data) {
        throw new Error('Cotizacion no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching cotizacion:', error);
      throw error;
    }
  }

  async getCotizacionesByMoneda(codigoMoneda: string): Promise<Cotizacion[]> {
    try {
      const response = await get(`${API_BASE_URL}/exchange-rates/queries/moneda/${codigoMoneda}`);
      const result: ApiResponse<Cotizacion[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizaciones');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching cotizaciones by moneda:', error);
      throw error;
    }
  }

  async getCotizacionesByFecha(fecha: string): Promise<Cotizacion[]> {
    try {
      const response = await get(`${API_BASE_URL}/exchange-rates/queries/fecha/${fecha}`);
      const result: ApiResponse<Cotizacion[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizaciones');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching cotizaciones by fecha:', error);
      throw error;
    }
  }

  async getCotizacionByMonedaAndFecha(codigoMoneda: string, fecha: string): Promise<Cotizacion> {
    try {
      const response = await get(
        `${API_BASE_URL}/exchange-rates/queries/moneda/${codigoMoneda}/fecha/${fecha}`
      );
      const result: ApiResponse<Cotizacion> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cotizacion');
      }

      if (!result.data) {
        throw new Error('Cotizacion no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching cotizacion by moneda and fecha:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/exchange-rates/queries/${id}/history`);
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
  async createCotizacion(command: CreateCotizacionCommand): Promise<Cotizacion> {
    try {
      const response = await post(`${API_BASE_URL}/exchange-rates/commands`, {
        ...command,
        createdBy: command.createdBy || 'system',
      });

      const result: ApiResponse<Cotizacion> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear cotizacion');
      }

      if (!result.data) {
        throw new Error('No se recibió la cotizacion creada');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating cotizacion:', error);
      throw error;
    }
  }

  async updateCotizacion(id: number, command: UpdateCotizacionCommand): Promise<Cotizacion> {
    try {
      const response = await put(`${API_BASE_URL}/exchange-rates/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<Cotizacion> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar cotizacion');
      }

      if (!result.data) {
        throw new Error('No se recibió la cotizacion actualizada');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating cotizacion:', error);
      throw error;
    }
  }

  async deleteCotizacion(id: number, deletedBy?: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/exchange-rates/commands/${id}`);
      if (deletedBy) {
        url.searchParams.append('deletedBy', deletedBy);
      }

      const response = await del(url.toString());

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar cotizacion');
      }
    } catch (error) {
      console.error('Error deleting cotizacion:', error);
      throw error;
    }
  }
}

export const cotizacionService = new CotizacionService();
