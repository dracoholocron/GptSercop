import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';


export interface ReglaEvento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoOperacion: string;
  eventoTrigger: string;
  condicionesDRL: string;
  accionesJson: string;
  prioridad: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateReglaEventoCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoOperacion: string;
  eventoTrigger: string;
  condicionesDRL: string;
  accionesJson: string;
  prioridad: number;
  activo: boolean;
  createdBy?: string;
}

export interface UpdateReglaEventoCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoOperacion: string;
  eventoTrigger: string;
  condicionesDRL: string;
  accionesJson: string;
  prioridad: number;
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

export interface TestReglaRequest {
  operationType?: string;
  operationAmount?: number;
  currency?: string;
  userCode?: string;
  userRole?: string;
  approverCode?: string;
  contraparteCountry?: string;
  contraparteRiskRating?: string;
  [key: string]: any;
}

export interface TestReglaResponse {
  success: boolean;
  message: string;
  regla: ReglaEvento;
  testData: TestReglaRequest;
  resultado: {
    ruleMatched: boolean;
    firedRulesCount: number;
    triggeredActions: string[];
    outputData: Record<string, any>;
    messages: string[];
    executionTimeMs: number;
    errorMessage?: string;
  };
}

export interface ValidateDrlRequest {
  condicionesDRL: string;
}

export interface ValidateDrlResponse {
  success: boolean;
  valido: boolean;
  errors: string[];
  warnings: string[];
  errorCount: number;
  warningCount: number;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ReglaEventoService {
  // Queries (Lectura)
  async getAllReglasEventos(): Promise<ReglaEvento[]> {
    try {
      const response = await get(`${API_BASE_URL}/event-rules/queries`);
      const result: ApiResponse<ReglaEvento[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener reglas de eventos');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching reglas eventos:', error);
      throw error;
    }
  }

  async getReglaEventoById(id: number): Promise<ReglaEvento> {
    try {
      const response = await get(`${API_BASE_URL}/event-rules/queries/${id}`);
      const result: ApiResponse<ReglaEvento> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener regla de evento');
      }

      if (!result.data) {
        throw new Error('Regla de evento no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching regla evento:', error);
      throw error;
    }
  }

  async getReglaEventoByCodigo(codigo: string): Promise<ReglaEvento> {
    try {
      const response = await get(`${API_BASE_URL}/event-rules/queries/codigo/${codigo}`);
      const result: ApiResponse<ReglaEvento> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener regla de evento');
      }

      if (!result.data) {
        throw new Error('Regla de evento no encontrada');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching regla evento by codigo:', error);
      throw error;
    }
  }

  async getReglasActivas(): Promise<ReglaEvento[]> {
    try {
      const response = await get(`${API_BASE_URL}/event-rules/queries/activas`);
      const result: ApiResponse<ReglaEvento[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener reglas activas');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching reglas activas:', error);
      throw error;
    }
  }

  async getEventHistory(id: number): Promise<EventHistory[]> {
    try {
      const response = await get(`${API_BASE_URL}/event-rules/queries/${id}/event-history`);
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
  async createReglaEvento(command: CreateReglaEventoCommand): Promise<ReglaEvento> {
    try {
      const response = await post(`${API_BASE_URL}/event-rules/commands`, {
        ...command,
        createdBy: command.createdBy || 'system',
      });

      const result: any = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear regla de evento');
      }

      if (!result.data) {
        throw new Error('No se recibió la regla de evento creada');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating regla evento:', error);
      throw error;
    }
  }

  async updateReglaEvento(id: number, command: UpdateReglaEventoCommand): Promise<ReglaEvento> {
    try {
      const response = await put(`${API_BASE_URL}/event-rules/commands/${id}`, {
        ...command,
        updatedBy: command.updatedBy || 'system',
      });

      const result: ApiResponse<ReglaEvento> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar regla de evento');
      }

      if (!result.data) {
        throw new Error('No se recibió la regla de evento actualizada');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating regla evento:', error);
      throw error;
    }
  }

  async deleteReglaEvento(id: number, deletedBy?: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/event-rules/commands/${id}`);
      if (deletedBy) {
        url.searchParams.append('deletedBy', deletedBy);
      }

      const response = await del(url.toString());

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar regla de evento');
      }
    } catch (error) {
      console.error('Error deleting regla evento:', error);
      throw error;
    }
  }

  // Testing
  async testReglaEvento(id: number, testData: TestReglaRequest): Promise<TestReglaResponse> {
    try {
      const response = await post(`${API_BASE_URL}/event-rules/test/${id}`, testData);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al probar regla');
      }

      return result;
    } catch (error) {
      console.error('Error testing regla:', error);
      throw error;
    }
  }

  async validateDrl(drlContent: string): Promise<ValidateDrlResponse> {
    try {
      const response = await post(`${API_BASE_URL}/event-rules/test/validate-drl`, { condicionesDRL: drlContent });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al validar DRL');
      }

      return result;
    } catch (error) {
      console.error('Error validating DRL:', error);
      throw error;
    }
  }

  // Helper methods
  getTiposOperacion(): string[] {
    return [
      'LC_IMPORTACION',
      'LC_EXPORTACION',
      'GARANTIA',
      'COBRANZA',
      'TRANSFERENCIA',
      'FORWARD',
      'SWAP',
      'PLANTILLA',
    ];
  }

  getEventosTrigger(): string[] {
    return [
      'CREATED',
      'UPDATED',
      'DELETED',
      'APPROVED',
      'REJECTED',
      'SUBMITTED',
      'COMPLETED',
      'CANCELLED',
    ];
  }

  getTiposAccion(): string[] {
    return ['EMAIL', 'DOCUMENTO', 'API', 'AUDITORIA'];
  }

  getPlantillaDRL(): string {
    return `package com.globalcmx.rules;

import com.globalcmx.api.dto.drools.RuleContext;
import java.math.BigDecimal;

rule "Nombre de la Regla"
    when
        \$ctx : RuleContext(
            operationAmount > 10000,
            currency == "USD"
        )
    then
        \$ctx.setRuleMatched(true);
        \$ctx.addTriggeredAction("ACCION_EJEMPLO");
        \$ctx.addOutputData("reason", "Condición cumplida");
        \$ctx.addMessage("Regla ejecutada exitosamente");
end`;
  }

  getPlantillaAcciones(): string {
    return JSON.stringify(
      [
        {
          tipo: 'EMAIL',
          orden: 1,
          async: false,
          continueOnError: true,
          config: {
            destinatarios: ['usuario@ejemplo.com'],
            cc: [],
            asunto: 'Notificación de Evento',
            plantillaCorreoCodigo: 'CODIGO_PLANTILLA',
            variables: {},
          },
        },
        {
          tipo: 'AUDITORIA',
          orden: 2,
          async: true,
          continueOnError: true,
          config: {
            categoria: 'CATEGORIA_EVENTO',
            severidad: 'INFO',
            mensaje: 'Descripción del evento',
          },
        },
      ],
      null,
      2
    );
  }
}

export const reglaEventoService = new ReglaEventoService();
