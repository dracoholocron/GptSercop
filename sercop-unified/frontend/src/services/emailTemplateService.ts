import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface PlantillaCorreo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  asunto: string; // Asunto del correo con variables
  cuerpoHtml: string; // Cuerpo HTML del correo con variables
  plantillasAdjuntas?: string; // JSON array de IDs de plantillas de documentos
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreatePlantillaCorreoCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  asunto: string;
  cuerpoHtml: string;
  plantillasAdjuntas?: string;
  activo: boolean;
  createdBy?: string;
}

export interface UpdatePlantillaCorreoCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  asunto: string;
  cuerpoHtml: string;
  plantillasAdjuntas?: string;
  activo: boolean;
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
}

class PlantillaCorreoService {
  // Queries (Lectura)
  async getAllPlantillasCorreo(): Promise<PlantillaCorreo[]> {
    try {
      const response = await get(`${API_BASE_URL}/email-templates/queries`);
      const result: ApiResponse<PlantillaCorreo[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener plantillas de correo');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching plantillas correo:', error);
      throw error;
    }
  }

  async getPlantillaCorreoById(id: number): Promise<PlantillaCorreo> {
    try {
      const response = await get(`${API_BASE_URL}/email-templates/queries/${id}`);
      const result: ApiResponse<PlantillaCorreo> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener plantilla de correo');
      }

      if (!result.data) {
        throw new Error('Plantilla de correo no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching plantilla correo:', error);
      throw error;
    }
  }

  async getPlantillaCorreoByCodigo(codigo: string): Promise<PlantillaCorreo> {
    try {
      const response = await get(`${API_BASE_URL}/email-templates/queries/codigo/${codigo}`);
      const result: ApiResponse<PlantillaCorreo> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener plantilla de correo');
      }

      if (!result.data) {
        throw new Error('Plantilla de correo no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching plantilla correo by codigo:', error);
      throw error;
    }
  }

  async getActivePlantillasCorreo(): Promise<PlantillaCorreo[]> {
    try {
      const response = await get(`${API_BASE_URL}/email-templates/queries/activas`);
      const result: ApiResponse<PlantillaCorreo[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener plantillas de correo activas');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching active plantillas correo:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/email-templates/queries/${id}/event-history`);
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
  async createPlantillaCorreo(command: CreatePlantillaCorreoCommand): Promise<PlantillaCorreo> {
    try {
      const response = await post(`${API_BASE_URL}/email-templates/commands`, {
        ...command,
        createdBy: command.createdBy || 'system',
      });

      const result: any = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear plantilla de correo');
      }

      if (!result.data) {
        throw new Error('No se recibió la plantilla de correo creada');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating plantilla correo:', error);
      throw error;
    }
  }

  async updatePlantillaCorreo(id: number, command: UpdatePlantillaCorreoCommand): Promise<PlantillaCorreo> {
    try {
      const response = await put(`${API_BASE_URL}/email-templates/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<PlantillaCorreo> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar plantilla de correo');
      }

      if (!result.data) {
        throw new Error('No se recibió la plantilla de correo actualizada');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating plantilla correo:', error);
      throw error;
    }
  }

  async deletePlantillaCorreo(id: number, deletedBy?: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/email-templates/commands/${id}`);
      if (deletedBy) {
        url.searchParams.append('deletedBy', deletedBy);
      }

      const response = await del(url.toString());

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar plantilla de correo');
      }
    } catch (error) {
      console.error('Error deleting plantilla correo:', error);
      throw error;
    }
  }

  // Helper methods for email preview
  extractVariables(text: string): string[] {
    const variablePattern = /\$\{([^}]+)\}|\[\[?\$\{([^}]+)\}\]?\]/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(text)) !== null) {
      const variableName = match[1] || match[2];
      if (variableName) {
        variables.add(variableName);
      }
    }

    return Array.from(variables);
  }

  renderEmailPreview(asunto: string, cuerpoHtml: string, variables: Record<string, any>): { asunto: string; cuerpo: string } {
    let renderedAsunto = asunto;
    let renderedCuerpo = cuerpoHtml;

    // Replace variables in subject and body
    Object.entries(variables).forEach(([key, value]) => {
      const regex1 = new RegExp(`\\$\\{${key}\\}`, 'g');
      const regex2 = new RegExp(`\\[\\[\\$\\{${key}\\}\\]\\]`, 'g');
      const stringValue = String(value);

      renderedAsunto = renderedAsunto.replace(regex1, stringValue).replace(regex2, stringValue);
      renderedCuerpo = renderedCuerpo.replace(regex1, stringValue).replace(regex2, stringValue);
    });

    return {
      asunto: renderedAsunto,
      cuerpo: renderedCuerpo,
    };
  }
}

export const plantillaCorreoService = new PlantillaCorreoService();
