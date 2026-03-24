import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface CatalogoPersonalizado {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel: number; // 1 = Catálogo, 2 = Registro
  catalogoPadreId?: number;
  codigoCatalogoPadre?: string;
  nombreCatalogoPadre?: string;
  activo: boolean;
  isSystem?: boolean; // System catalogs cannot be deleted
  orden: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCatalogoPersonalizadoCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel: number;
  catalogoPadreId?: number;
  activo: boolean;
  orden: number;
  createdBy?: string;
}

export interface UpdateCatalogoPersonalizadoCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel: number;
  catalogoPadreId?: number;
  activo: boolean;
  orden: number;
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

class CatalogoPersonalizadoService {
  // Queries (Lectura)
  async getAllCatalogosPersonalizados(): Promise<CatalogoPersonalizado[]> {
    try {
      const response = await get(`${API_BASE_URL}/custom-catalogs/queries`);
      const result: ApiResponse<CatalogoPersonalizado[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener catálogos personalizados');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching catálogos personalizados:', error);
      throw error;
    }
  }

  async getCatalogoPersonalizadoById(id: number): Promise<CatalogoPersonalizado> {
    try {
      const response = await get(`${API_BASE_URL}/custom-catalogs/queries/${id}`);
      const result: ApiResponse<CatalogoPersonalizado> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener catálogo personalizado');
      }

      if (!result.data) {
        throw new Error('Catálogo personalizado no encontrado');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching catálogo personalizado:', error);
      throw error;
    }
  }

  async getCatalogosByCatalogoPadreId(catalogoPadreId: number): Promise<CatalogoPersonalizado[]> {
    try {
      const response = await get(`${API_BASE_URL}/custom-catalogs/queries/padre/${catalogoPadreId}`);
      const result: ApiResponse<CatalogoPersonalizado[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener catálogos personalizados');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching catálogos by padre:', error);
      throw error;
    }
  }

  async getCatalogosByNivel(nivel: number): Promise<CatalogoPersonalizado[]> {
    try {
      const response = await get(`${API_BASE_URL}/custom-catalogs/queries/nivel/${nivel}`);
      const result: ApiResponse<CatalogoPersonalizado[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener catálogos personalizados');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching catálogos by nivel:', error);
      throw error;
    }
  }

  async getCatalogosByCodigoPadre(codigoPadre: string): Promise<CatalogoPersonalizado[]> {
    try {
      const response = await get(`${API_BASE_URL}/custom-catalogs/queries/codigo-padre/${codigoPadre}`);
      const result: ApiResponse<CatalogoPersonalizado[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener catálogos personalizados');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching catálogos by código padre:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/custom-catalogs/queries/${id}/event-history`);
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
  async createCatalogoPersonalizado(command: CreateCatalogoPersonalizadoCommand): Promise<CatalogoPersonalizado> {
    try {
      const response = await post(`${API_BASE_URL}/custom-catalogs/commands`, {
        ...command,
        createdBy: command.createdBy || 'system',
      });

      const result: any = await response.json();

      if (!response.ok) {
        // Extraer información detallada del error de validación
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const fieldErrors = result.errors.map((err: any) =>
            `Campo "${err.field}": ${err.defaultMessage}`
          ).join('\n');
          throw new Error(`Error de validación:\n${fieldErrors}`);
        }
        throw new Error(result.message || 'Error al crear catálogo personalizado');
      }

      if (!result.data) {
        throw new Error('No se recibió el catálogo personalizado creado');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating catálogo personalizado:', error);
      throw error;
    }
  }

  async updateCatalogoPersonalizado(id: number, command: UpdateCatalogoPersonalizadoCommand): Promise<CatalogoPersonalizado> {
    try {
      const response = await put(`${API_BASE_URL}/custom-catalogs/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<CatalogoPersonalizado> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar catálogo personalizado');
      }

      if (!result.data) {
        throw new Error('No se recibió el catálogo personalizado actualizado');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating catálogo personalizado:', error);
      throw error;
    }
  }

  async deleteCatalogoPersonalizado(id: number, deletedBy?: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/custom-catalogs/commands/${id}`);
      if (deletedBy) {
        url.searchParams.append('deletedBy', deletedBy);
      }

      const response = await del(url.toString());

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar catálogo personalizado');
      }
    } catch (error) {
      console.error('Error deleting catálogo personalizado:', error);
      throw error;
    }
  }
}

export const catalogoPersonalizadoService = new CatalogoPersonalizadoService();
