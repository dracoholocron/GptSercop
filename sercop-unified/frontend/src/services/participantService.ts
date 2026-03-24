import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import { isClientUser } from '../config/api.client';


export interface Participante {
  id: number;
  identificacion: string;
  tipo: string;
  tipoReferencia?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  agencia?: string;
  ejecutivoAsignado?: string;
  ejecutivoId?: string;
  correoEjecutivo?: string;
  // Hierarchy fields for corporation support
  parentId?: number;
  hierarchyType?: 'CORPORATION' | 'COMPANY' | 'BRANCH';
  hierarchyLevel?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateParticipanteCommand {
  identificacion: string;
  tipo: string;
  tipoReferencia?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  agencia?: string;
  ejecutivoAsignado?: string;
  ejecutivoId?: string;
  correoEjecutivo?: string;
  // Hierarchy fields
  parentId?: number;
  hierarchyType?: 'CORPORATION' | 'COMPANY' | 'BRANCH';
  createdBy?: string;
}

export interface UpdateParticipanteCommand {
  identificacion: string;
  tipo: string;
  tipoReferencia?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  agencia?: string;
  ejecutivoAsignado?: string;
  ejecutivoId?: string;
  correoEjecutivo?: string;
  // Hierarchy fields
  parentId?: number;
  hierarchyType?: 'CORPORATION' | 'COMPANY' | 'BRANCH';
  updatedBy?: string;
}

export interface EventHistory {
  eventId: string;
  eventType: string;
  timestamp: string;
  performedBy: string;
  version: number;
  eventData: Record<string, unknown>;
}

export interface ParticipanteFilters {
  identificacion?: string;
  tipo?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  agencia?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

class ParticipanteService {
  // Queries (Lectura)
  async getAllParticipantes(): Promise<Participante[]> {
    try {
      const response = await get(`${API_BASE_URL}/participants/queries`);
      const result: ApiResponse<Participante[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener participantes');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching participantes:', error);
      throw error;
    }
  }

  async getParticipantesPaginated(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'id',
    sortDir: 'asc' | 'desc' = 'asc',
    filters: ParticipanteFilters = {}
  ): Promise<PaginatedResponse<Participante>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      // Add filters if they have values
      if (filters.identificacion) params.append('identificacion', filters.identificacion);
      if (filters.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo);
      if (filters.nombres) params.append('nombres', filters.nombres);
      if (filters.apellidos) params.append('apellidos', filters.apellidos);
      if (filters.email) params.append('email', filters.email);
      if (filters.agencia) params.append('agencia', filters.agencia);

      const url = `${API_BASE_URL}/participants/queries/paginated?${params.toString()}`;
      const response = await get(url);
      const result: PaginatedApiResponse<Participante> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener participantes');
      }

      return {
        data: result.data || [],
        totalElements: result.totalElements,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize,
        first: result.first,
        last: result.last,
      };
    } catch (error) {
      console.error('Error fetching participantes paginated:', error);
      throw error;
    }
  }

  /**
   * Search participants by a general term using OR logic across multiple fields.
   * Optimized for autocomplete/search components.
   * Searches in: identificacion, nombres, apellidos, email
   *
   * NOTE: For CLIENT users, this uses the client portal endpoint
   * which is allowed by the security filter.
   */
  async searchParticipantes(
    searchTerm: string,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<Participante>> {
    try {
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      params.append('page', page.toString());
      params.append('size', size.toString());

      // Use client portal endpoint for CLIENT users
      const isClient = isClientUser();
      const baseUrl = isClient
        ? `${API_BASE_URL}/client-portal/catalogs/participants/search`
        : `${API_BASE_URL}/participants/queries/search`;

      const url = `${baseUrl}?${params.toString()}`;
      const response = await get(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al buscar participantes');
      }

      // Client portal returns ApiResponse<Page<T>> with data containing the Page
      // Internal API returns PaginatedApiResponse<T> directly
      if (isClient) {
        // Client portal format: { success, message, data: { content, totalElements, ... } }
        const pageData = result.data || {};
        return {
          data: pageData.content || [],
          totalElements: pageData.totalElements || 0,
          totalPages: pageData.totalPages || 0,
          currentPage: pageData.number || 0,
          pageSize: pageData.size || size,
          first: pageData.first ?? true,
          last: pageData.last ?? true,
        };
      } else {
        // Internal API format: { data, totalElements, ... }
        return {
          data: result.data || [],
          totalElements: result.totalElements,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          pageSize: result.pageSize,
          first: result.first,
          last: result.last,
        };
      }
    } catch (error) {
      console.error('Error searching participantes:', error);
      throw error;
    }
  }

  async getParticipanteById(id: number): Promise<Participante> {
    try {
      // Use client portal endpoint for CLIENT users
      const url = isClientUser()
        ? `${API_BASE_URL}/client-portal/catalogs/participants/${id}`
        : `${API_BASE_URL}/participants/queries/${id}`;

      const response = await get(url);
      const result: ApiResponse<Participante> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener participante');
      }

      if (!result.data) {
        throw new Error('Participante no encontrado');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching participante:', error);
      throw error;
    }
  }

  async getParticipantesByTipo(tipo: string): Promise<Participante[]> {
    try {
      const response = await get(`${API_BASE_URL}/participants/queries/tipo/${tipo}`);
      const result: ApiResponse<Participante[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener participantes');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching participantes by tipo:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/participants/queries/${id}/history`);
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
  async createParticipante(command: CreateParticipanteCommand): Promise<Participante> {
    try {
      const response = await post(`${API_BASE_URL}/participants/commands`, {
        ...command,
        createdBy: command.createdBy || 'system',
      });

      const result: ApiResponse<Participante> & { errors?: Array<{ field: string; defaultMessage: string }> } = await response.json();

      if (!response.ok) {
        // Extraer informacion detallada del error de validacion
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const fieldErrors = result.errors.map((err) =>
            `Campo "${err.field}": ${err.defaultMessage}`
          ).join('\n');
          throw new Error(`Error de validacion:\n${fieldErrors}`);
        }
        throw new Error(result.message || 'Error al crear participante');
      }

      if (!result.data) {
        throw new Error('No se recibio el participante creado');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating participante:', error);
      throw error;
    }
  }

  async updateParticipante(id: number, command: UpdateParticipanteCommand): Promise<Participante> {
    try {
      const response = await put(`${API_BASE_URL}/participants/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<Participante> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar participante');
      }

      if (!result.data) {
        throw new Error('No se recibio el participante actualizado');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating participante:', error);
      throw error;
    }
  }

  async deleteParticipante(id: number, deletedBy?: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/participants/commands/${id}`, window.location.origin);
      if (deletedBy) {
        url.searchParams.append('deletedBy', deletedBy);
      }

      const response = await del(url.toString());

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar participante');
      }
    } catch (error) {
      console.error('Error deleting participante:', error);
      throw error;
    }
  }
}

export const participanteService = new ParticipanteService();
