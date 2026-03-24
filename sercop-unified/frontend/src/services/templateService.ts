import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface Plantilla {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoDocumento?: string;
  nombreArchivo?: string;
  rutaArchivo?: string;
  tamanioArchivo?: number;
  activo: boolean;
  variables?: string; // JSON string con variables detectadas
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreatePlantillaCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoDocumento?: string;
  nombreArchivo?: string;
  rutaArchivo?: string;
  tamanioArchivo?: number;
  activo: boolean;
  createdBy?: string;
}

export interface UpdatePlantillaCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoDocumento?: string;
  nombreArchivo?: string;
  rutaArchivo?: string;
  tamanioArchivo?: number;
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

class PlantillaService {
  // Queries (Lectura)
  async getAllPlantillas(): Promise<Plantilla[]> {
    try {
      const response = await get(`${API_BASE_URL}/templates/queries`);
      const result: ApiResponse<Plantilla[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener plantillas');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching plantillas:', error);
      throw error;
    }
  }

  async getPlantillaById(id: number): Promise<Plantilla> {
    try {
      const response = await get(`${API_BASE_URL}/templates/queries/${id}`);
      const result: ApiResponse<Plantilla> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener plantilla');
      }

      if (!result.data) {
        throw new Error('Plantilla no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching plantilla:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/templates/queries/${id}/event-history`);
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
  async createPlantilla(command: CreatePlantillaCommand): Promise<Plantilla> {
    try {
      const response = await post(`${API_BASE_URL}/templates/commands`, {
        ...command,
        createdBy: command.createdBy || 'system',
      });

      const result: any = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear plantilla');
      }

      if (!result.data) {
        throw new Error('No se recibió la plantilla creada');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating plantilla:', error);
      throw error;
    }
  }

  async updatePlantilla(id: number, command: UpdatePlantillaCommand): Promise<Plantilla> {
    try {
      const response = await put(`${API_BASE_URL}/templates/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<Plantilla> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar plantilla');
      }

      if (!result.data) {
        throw new Error('No se recibió la plantilla actualizada');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating plantilla:', error);
      throw error;
    }
  }

  async deletePlantilla(id: number, deletedBy?: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/templates/commands/${id}`);
      if (deletedBy) {
        url.searchParams.append('deletedBy', deletedBy);
      }

      const response = await del(url.toString());

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar plantilla');
      }
    } catch (error) {
      console.error('Error deleting plantilla:', error);
      throw error;
    }
  }

  // File operations
  async uploadFile(file: File): Promise<{ nombreArchivo: string; rutaArchivo: string; tamanioArchivo: number; tipoDocumento: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/templates/files/upload`, {
        method: 'POST',
        body: formData,
      });

      const result: ApiResponse<any> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cargar archivo');
      }

      return result.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  getDownloadUrl(id: number): string {
    return `${API_BASE_URL}/templates/files/download/${id}`;
  }

  getPreviewUrl(id: number): string {
    return `${API_BASE_URL}/templates/files/preview/${id}`;
  }

  getPreviewPdfUrl(id: number): string {
    return `${API_BASE_URL}/templates/files/preview-pdf/${id}`;
  }

  // Nuevos métodos para generación de PDF desde plantillas HTML
  async getTemplateVariables(id: number): Promise<string[]> {
    try {
      const response = await get(`${API_BASE_URL}/templates/generation/${id}/variables`);
      const result: ApiResponse<{ variables: string[]; valid: boolean }> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener variables de plantilla');
      }

      return result.data?.variables || [];
    } catch (error) {
      console.error('Error fetching template variables:', error);
      throw error;
    }
  }

  async generatePdfFromTemplate(id: number, data: Record<string, any>, filename?: string): Promise<Blob> {
    try {
      const response = await post(`${API_BASE_URL}/templates/generation/${id}/generate-pdf`, {
        data,
        filename: filename || 'documento.pdf',
      });

      if (!response.ok) {
        const errorMessage = response.headers.get('X-Error-Message');
        throw new Error(errorMessage || 'Error al generar PDF');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  getPreviewHtmlUrl(id: number): string {
    return `${API_BASE_URL}/templates/generation/${id}/preview-html`;
  }

  getPreviewPdfGenerationUrl(id: number): string {
    return `${API_BASE_URL}/templates/generation/${id}/preview-pdf`;
  }

  getGenerationPreviewPdfUrl(id: number): string {
    return `${API_BASE_URL}/templates/generation/${id}/preview-pdf`;
  }
}

export const plantillaService = new PlantillaService();
