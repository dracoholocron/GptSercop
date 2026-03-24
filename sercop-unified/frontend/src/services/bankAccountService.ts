import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface CuentaBancaria {
  id: number;
  identificacionParticipante: string;
  nombresParticipante: string;
  apellidosParticipante: string;
  numeroCuenta: string;
  identificacionCuenta: string;
  tipo: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCuentaBancariaCommand {
  identificacionParticipante: string;
  nombresParticipante: string;
  apellidosParticipante: string;
  numeroCuenta: string;
  identificacionCuenta: string;
  tipo: string;
  activo: boolean;
  createdBy?: string;
}

export interface UpdateCuentaBancariaCommand {
  identificacionParticipante: string;
  nombresParticipante: string;
  apellidosParticipante: string;
  numeroCuenta: string;
  identificacionCuenta: string;
  tipo: string;
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
  total?: number;
}

class CuentaBancariaService {
  // Queries (Lectura)
  async getAllCuentasBancarias(): Promise<CuentaBancaria[]> {
    try {
      const response = await get(`${API_BASE_URL}/bank-accounts/queries`);
      const result: ApiResponse<CuentaBancaria[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cuentas bancarias');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching cuentas bancarias:', error);
      throw error;
    }
  }

  async getCuentaBancariaById(id: number): Promise<CuentaBancaria> {
    try {
      const response = await get(`${API_BASE_URL}/bank-accounts/queries/${id}`);
      const result: ApiResponse<CuentaBancaria> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cuenta bancaria');
      }

      if (!result.data) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching cuenta bancaria:', error);
      throw error;
    }
  }

  async getCuentasBancariasByTipo(tipo: string): Promise<CuentaBancaria[]> {
    try {
      const response = await get(`${API_BASE_URL}/bank-accounts/queries/tipo/${tipo}`);
      const result: ApiResponse<CuentaBancaria[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cuentas bancarias');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching cuentas bancarias by tipo:', error);
      throw error;
    }
  }

  async getCuentasBancariasByParticipante(identificacionParticipante: string): Promise<CuentaBancaria[]> {
    try {
      const response = await get(`${API_BASE_URL}/bank-accounts/queries/participante/${identificacionParticipante}`);
      const result: ApiResponse<CuentaBancaria[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cuentas bancarias');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching cuentas bancarias by participante:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/bank-accounts/queries/${id}/history`);
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
  async createCuentaBancaria(command: CreateCuentaBancariaCommand): Promise<CuentaBancaria> {
    try {
      const response = await post(`${API_BASE_URL}/bank-accounts/commands`, {
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
        throw new Error(result.message || 'Error al crear cuenta bancaria');
      }

      if (!result.data) {
        throw new Error('No se recibió la cuenta bancaria creada');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating cuenta bancaria:', error);
      throw error;
    }
  }

  async updateCuentaBancaria(id: number, command: UpdateCuentaBancariaCommand): Promise<CuentaBancaria> {
    try {
      const response = await put(`${API_BASE_URL}/bank-accounts/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<CuentaBancaria> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar cuenta bancaria');
      }

      if (!result.data) {
        throw new Error('No se recibió la cuenta bancaria actualizada');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating cuenta bancaria:', error);
      throw error;
    }
  }

  async deleteCuentaBancaria(id: number, deletedBy?: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/bank-accounts/commands/${id}`);
      if (deletedBy) {
        url.searchParams.append('deletedBy', deletedBy);
      }

      const response = await del(url.toString());

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar cuenta bancaria');
      }
    } catch (error) {
      console.error('Error deleting cuenta bancaria:', error);
      throw error;
    }
  }
}

export const cuentaBancariaService = new CuentaBancariaService();
