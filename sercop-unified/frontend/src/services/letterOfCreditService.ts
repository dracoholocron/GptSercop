import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface LetterOfCredit {
  id: number;
  aggregateId?: string;  // ID del agregado en Event Store
  numeroOperacion: string;
  tipoLc: string;
  modalidad: string;
  formaPago: string;
  estado: string;
  ordenanteId: number;
  beneficiarioId: number;
  bancoEmisorId?: number;
  bancoAvisadorId?: number;
  bancoConfirmadorId?: number;
  bancoPagadorId?: number;
  moneda: string;
  monto: number;
  montoUtilizado?: number;
  porcentajeTolerancia?: number;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaUltimoEmbarque?: string;
  lugarEmbarque?: string;
  lugarDestino?: string;
  requiereFacturaComercial?: boolean;
  requierePackingList?: boolean;
  requiereConocimientoEmbarque?: boolean;
  requiereCertificadoOrigen?: boolean;
  requiereCertificadoSeguro?: boolean;
  documentosAdicionales?: string;
  incoterm?: string;
  descripcionMercancia?: string;
  condicionesEspeciales?: string;
  instruccionesEmbarque?: string;
  draft?: boolean;
  usuarioCreacion?: string;
  fechaCreacion?: string;
  usuarioModificacion?: string;
  fechaModificacion?: string;
  swiftOptionalFields?: string;  // JSON string with optional SWIFT fields
}

export interface DraftHistory {
  id: number;
  draftId: number;
  changeType: string;
  changeDescription: string;
  previousData?: string;
  newData?: string;
  changedBy: string;
  changeDate: string;
  draftVersion?: number;
}

export interface CreateLetterOfCreditCommand {
  numeroOperacion?: string;
  tipoLc?: string;
  modalidad?: string;
  formaPago?: string;
  estado?: string;
  ordenanteId?: number;  // Opcional para borradores
  beneficiarioId?: number;  // Opcional para borradores
  bancoEmisorId?: number;
  bancoAvisadorId?: number;
  bancoConfirmadorId?: number;
  bancoPagadorId?: number;
  moneda?: string;  // Opcional para borradores
  monto?: number;  // Opcional para borradores
  porcentajeTolerancia?: number;
  fechaEmision?: string;  // Opcional para borradores
  fechaVencimiento?: string;  // Opcional para borradores
  fechaUltimoEmbarque?: string;
  lugarEmbarque?: string;
  lugarDestino?: string;
  requiereFacturaComercial?: boolean;
  requierePackingList?: boolean;
  requiereConocimientoEmbarque?: boolean;
  requiereCertificadoOrigen?: boolean;
  requiereCertificadoSeguro?: boolean;
  documentosAdicionales?: string;
  incoterm?: string;
  descripcionMercancia?: string;
  condicionesEspeciales?: string;
  instruccionesEmbarque?: string;
  swiftOptionalFields?: string;  // JSON string with optional SWIFT fields
  draft?: boolean;
  usuarioCreacion?: string;
}

export interface UpdateLetterOfCreditCommand {
  numeroOperacion?: string;
  tipoLc?: string;
  modalidad?: string;
  formaPago?: string;
  estado?: string;
  ordenanteId?: number;
  beneficiarioId?: number;
  bancoEmisorId?: number;
  bancoAvisadorId?: number;
  bancoConfirmadorId?: number;
  bancoPagadorId?: number;
  moneda?: string;
  monto?: number;
  montoUtilizado?: number;
  porcentajeTolerancia?: number;
  fechaEmision?: string;
  fechaVencimiento?: string;
  fechaUltimoEmbarque?: string;
  lugarEmbarque?: string;
  lugarDestino?: string;
  requiereFacturaComercial?: boolean;
  requierePackingList?: boolean;
  requiereConocimientoEmbarque?: boolean;
  requiereCertificadoOrigen?: boolean;
  requiereCertificadoSeguro?: boolean;
  documentosAdicionales?: string;
  incoterm?: string;
  descripcionMercancia?: string;
  condicionesEspeciales?: string;
  instruccionesEmbarque?: string;
  draft?: boolean;
  usuarioModificacion?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

class LetterOfCreditService {
  // Queries (Lectura)
  async getAllLettersOfCredit(): Promise<LetterOfCredit[]> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/letters-of-credit/queries`);
      const result: ApiResponse<LetterOfCredit[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al obtener cartas de crédito');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching letters of credit:', error);
      throw error;
    }
  }

  async getLetterOfCreditById(id: number): Promise<LetterOfCredit> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/letters-of-credit/queries/${id}`);
      const result: ApiResponse<LetterOfCredit> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Carta de crédito no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error(`Error fetching letter of credit ${id}:`, error);
      throw error;
    }
  }

  // Commands (Escritura)
  async createLetterOfCredit(command: CreateLetterOfCreditCommand): Promise<LetterOfCredit> {
    try {
      const response = await post(`${API_BASE_URL}/foreign-trade/letters-of-credit/commands`, command);
      const result: ApiResponse<LetterOfCredit> = await response.json();

      if (!result.success) {
        // Si hay errores de validación, incluirlos en el mensaje
        const errorMessage = result.message || 'Error al crear carta de crédito';
        throw new Error(errorMessage);
      }

      if (!result.data) {
        throw new Error('No se recibieron datos del servidor');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating letter of credit:', error);
      throw error;
    }
  }

  // Draft Commands (Borradores)
  async createDraft(command: CreateLetterOfCreditCommand): Promise<LetterOfCredit> {
    try {
      const response = await post(`${API_BASE_URL}/foreign-trade/letters-of-credit/drafts`, command);
      const result: ApiResponse<LetterOfCredit> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al crear borrador');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  }

  async getAllDrafts(): Promise<LetterOfCredit[]> {
    try {
      const url = `${API_BASE_URL}/foreign-trade/letters-of-credit/drafts`;
      console.log('🔍 getAllDrafts URL:', url);

      const response = await get(url);
      console.log('📡 getAllDrafts response status:', response.status);

      if (!response.ok) {
        console.error('❌ getAllDrafts failed with status:', response.status);
        throw new Error(`HTTP ${response.status}: Error al obtener borradores`);
      }

      const result: ApiResponse<LetterOfCredit[]> = await response.json();
      console.log('📦 getAllDrafts result:', result);

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al obtener borradores');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching drafts:', error);
      throw error;
    }
  }

  async getDraftById(id: number): Promise<LetterOfCredit> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/letters-of-credit/drafts/${id}`);
      const result: ApiResponse<LetterOfCredit> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Borrador no encontrado');
      }

      return result.data;
    } catch (error) {
      console.error(`Error fetching draft ${id}:`, error);
      throw error;
    }
  }

  async updateDraft(id: number | string, command: UpdateLetterOfCreditCommand): Promise<LetterOfCredit> {
    try {
      const url = `${API_BASE_URL}/foreign-trade/letters-of-credit/drafts/${id}`;
      console.log('🔄 updateDraft URL:', url);
      console.log('🔄 updateDraft command:', JSON.stringify(command, null, 2));

      const response = await put(url, command);
      console.log('📡 updateDraft response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ updateDraft failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Error al actualizar borrador'}`);
      }

      const result: ApiResponse<LetterOfCredit> = await response.json();
      console.log('📦 updateDraft result:', result);

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al actualizar borrador de carta de crédito: ' + (result.message || 'Error desconocido'));
      }

      return result.data;
    } catch (error) {
      console.error(`Error updating draft ${id}:`, error);
      throw error;
    }
  }

  async deleteDraft(id: number): Promise<void> {
    try {
      const response = await del(`${API_BASE_URL}/foreign-trade/letters-of-credit/drafts/${id}`);
      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al eliminar borrador');
      }
    } catch (error) {
      console.error(`Error deleting draft ${id}:`, error);
      throw error;
    }
  }

  async getDraftHistory(id: number): Promise<DraftHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/foreign-trade/letters-of-credit/drafts/${id}/history`);
      const result: ApiResponse<DraftHistory[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al obtener historial del borrador');
      }

      return result.data;
    } catch (error) {
      console.error(`Error fetching draft history ${id}:`, error);
      throw error;
    }
  }

  async submitDraftForApproval(id: number): Promise<LetterOfCredit> {
    try {
      const response = await post(`${API_BASE_URL}/foreign-trade/letters-of-credit/drafts/${id}/submit`, {});
      const result: ApiResponse<LetterOfCredit> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al enviar borrador para aprobación');
      }

      return result.data;
    } catch (error) {
      console.error(`Error submitting draft ${id} for approval:`, error);
      throw error;
    }
  }

  async updateLetterOfCredit(id: number, command: UpdateLetterOfCreditCommand): Promise<LetterOfCredit> {
    try {
      const response = await put(`${API_BASE_URL}/foreign-trade/letters-of-credit/commands/${id}`, command);
      const result: ApiResponse<LetterOfCredit> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al actualizar carta de crédito');
      }

      return result.data;
    } catch (error) {
      console.error(`Error updating letter of credit ${id}:`, error);
      throw error;
    }
  }

  async deleteLetterOfCredit(id: number): Promise<void> {
    try {
      const response = await del(`${API_BASE_URL}/foreign-trade/letters-of-credit/commands/${id}`);
      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al eliminar carta de crédito');
      }
    } catch (error) {
      console.error(`Error deleting letter of credit ${id}:`, error);
      throw error;
    }
  }
}

export const letterOfCreditService = new LetterOfCreditService();
