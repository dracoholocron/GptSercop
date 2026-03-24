import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface InstitucionFinanciera {
  id: number;
  codigo: string;
  nombre: string;
  swiftCode?: string;
  pais?: string;
  ciudad?: string;
  direccion?: string;
  tipo: string;
  rating?: string;
  esCorresponsal?: boolean;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  aggregateId?: string;
  version?: number;
}

export interface CreateInstitucionFinancieraCommand {
  codigo: string;
  nombre: string;
  swiftCode?: string;
  pais?: string;
  ciudad?: string;
  direccion?: string;
  tipo: string;
  rating?: string;
  esCorresponsal?: boolean;
  activo?: boolean;
  createdBy?: string;
}

export interface UpdateInstitucionFinancieraCommand {
  codigo: string;
  nombre: string;
  swiftCode?: string;
  pais?: string;
  ciudad?: string;
  direccion?: string;
  tipo: string;
  rating?: string;
  esCorresponsal?: boolean;
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

export interface SearchFilters {
  codigo?: string;
  nombre?: string;
  swiftCode?: string;
  pais?: string;
  ciudad?: string;
  tipo?: string;
  esCorresponsal?: boolean;
  activo?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

class InstitucionFinancieraService {
  // Queries (Lectura) - Paginada
  async searchInstitucionesFinancieras(
    filters: SearchFilters = {},
    page: number = 0,
    size: number = 20,
    sortBy: string = 'nombre',
    sortDir: 'asc' | 'desc' = 'asc'
  ): Promise<PaginatedResponse<InstitucionFinanciera>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      if (filters.codigo) params.append('codigo', filters.codigo);
      if (filters.nombre) params.append('nombre', filters.nombre);
      if (filters.swiftCode) params.append('swiftCode', filters.swiftCode);
      if (filters.pais) params.append('pais', filters.pais);
      if (filters.ciudad) params.append('ciudad', filters.ciudad);
      if (filters.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo);
      if (filters.esCorresponsal !== undefined && filters.esCorresponsal !== null) {
        params.append('esCorresponsal', filters.esCorresponsal.toString());
      }
      if (filters.activo !== undefined && filters.activo !== null) {
        params.append('activo', filters.activo.toString());
      }

      const response = await get(`${API_BASE_URL}/foreign-trade/financial-institutions/search?${params.toString()}`);
      const result: PaginatedResponse<InstitucionFinanciera> = await response.json();

      if (!response.ok) {
        throw new Error((result as any).message || 'Error en la búsqueda');
      }

      return result;
    } catch (error) {
      console.error('Error searching instituciones financieras:', error);
      throw error;
    }
  }

  // Queries (Lectura) - Todas (para compatibilidad)
  async getAllInstitucionesFinancieras(): Promise<InstitucionFinanciera[]> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/financial-institutions`);
      const result: ApiResponse<InstitucionFinanciera[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener instituciones financieras');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching instituciones financieras:', error);
      throw error;
    }
  }

  async getInstitucionFinancieraById(id: number): Promise<InstitucionFinanciera> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/financial-institutions/${id}`);
      const result: ApiResponse<InstitucionFinanciera> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener institución financiera');
      }

      if (!result.data) {
        throw new Error('Institución financiera no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching institución financiera:', error);
      throw error;
    }
  }

  async getInstitucionesCorresponsales(): Promise<InstitucionFinanciera[]> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/financial-institutions/corresponsales`);
      const result: ApiResponse<InstitucionFinanciera[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener instituciones corresponsales');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching instituciones corresponsales:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/financial-institutions/${id}/history`);
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
  async createInstitucionFinanciera(command: CreateInstitucionFinancieraCommand): Promise<InstitucionFinanciera> {
    try {
      const response = await post(`${API_BASE_URL}/foreign-trade/financial-institutions/commands`, {
        ...command,
        createdBy: command.createdBy || 'system',
      });

      const result: any = await response.json();

      if (!response.ok) {
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const fieldErrors = result.errors.map((err: any) =>
            `Campo "${err.field}": ${err.defaultMessage}`
          ).join('\n');
          throw new Error(`Error de validación:\n${fieldErrors}`);
        }
        throw new Error(result.message || 'Error al crear institución financiera');
      }

      if (!result.data) {
        throw new Error('No se recibió la institución financiera creada');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating institución financiera:', error);
      throw error;
    }
  }

  async updateInstitucionFinanciera(id: number, command: UpdateInstitucionFinancieraCommand): Promise<InstitucionFinanciera> {
    try {
      const response = await put(`${API_BASE_URL}/foreign-trade/financial-institutions/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<InstitucionFinanciera> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar institución financiera');
      }

      if (!result.data) {
        throw new Error('No se recibió la institución financiera actualizada');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating institución financiera:', error);
      throw error;
    }
  }

  async deleteInstitucionFinanciera(id: number, deletedBy?: string): Promise<void> {
    try {
      const params = deletedBy ? `?deletedBy=${encodeURIComponent(deletedBy)}` : '';
      const response = await del(`${API_BASE_URL}/foreign-trade/financial-institutions/commands/${id}${params}`);

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar institución financiera');
      }
    } catch (error) {
      console.error('Error deleting institución financiera:', error);
      throw error;
    }
  }
}

export const institucionFinancieraService = new InstitucionFinancieraService();
