import type { MensajeSWIFT, ConfiguracionComision, ComisionResponse } from '../types/comision';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import { get, post, put, del } from '../utils/apiClient';

// Re-export types for backward compatibility
export type { MensajeSWIFT, ConfiguracionComision, ComisionResponse };


interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ComisionService {
  /**
   * Calcula la comisión para un mensaje SWIFT
   */
  async calcularComision(mensaje: MensajeSWIFT): Promise<ComisionResponse> {
    try {
      const response = await post(`${API_BASE_URL}/commissions/calcular`, mensaje);

      const result: ApiResponse<ComisionResponse> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Error al calcular comisión');
      }

      if (!result.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return result.data;
    } catch (error) {
      console.error('Error calculando comisión:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado del servicio de comisiones
   */
  async healthCheck(): Promise<{ status: string; service: string; message: string }> {
    try {
      const response = await get(`${API_BASE_URL}/commissions/health`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error('Servicio de comisiones no disponible');
      }

      return result;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  /**
   * Recarga las reglas de comisiones desde el archivo Excel
   */
  async recargarReglas(): Promise<void> {
    try {
      const response = await post(`${API_BASE_URL}/commissions/recargar`, {});

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al recargar reglas');
      }
    } catch (error) {
      console.error('Error recargando reglas:', error);
      throw error;
    }
  }
}

export const comisionService = new ComisionService();

// Mapa de tipos de mensaje SWIFT a códigos MT
export const SWIFT_MESSAGE_TYPES: Record<string, string> = {
  // Cobranzas Documentarias
  'CobranzasAcuseRecibo': 'MT410',
  'CobranzasAvisoAceptacion': 'MT412',
  'CobranzasAvisoNoPago': 'MT420',
  'CobranzasAvisoPago': 'MT416',
  'CobranzasTracer': 'MT420',

  // Cartas de Crédito Importación/Exportación
  'LCImportacionEmision': 'MT700',
  'LCExportacionEmision': 'MT700',
  'LCImportacionEnmienda': 'MT707',
  'LCExportacionEnmienda': 'MT707',
  'LCImportacionPago': 'MT754',
  'LCExportacionPago': 'MT754',
  'LCImportacionDiscrepancias': 'MT750',
  'LCExportacionDiscrepancias': 'MT750',
  'LCImportacionNegociacion': 'MT752',
  'LCExportacionNegociacion': 'MT752',
  'LCImportacionReembolso': 'MT756',
  'LCExportacionReembolso': 'MT756',
  'LCImportacionTransferencia': 'MT720',
  'LCExportacionTransferencia': 'MT720',
  'LCImportacionReconocimiento': 'MT730',
  'LCExportacionReconocimiento': 'MT730',
  'LCExportacionPreaviso': 'MT710',
  'LCImportacionMensajeLibre': 'MT799',
  'LCExportacionMensajeLibre': 'MT799',

  // Garantías Bancarias
  'GarantiasEmision': 'MT760',
  'GarantiasEnmienda': 'MT767',
  'GarantiasPago': 'MT754',
  'GarantiasReduccion': 'MT767',
  'GarantiasReconocimiento': 'MT730',
  'GarantiasMensajeLibre': 'MT799',
};

// Mapa de páginas a eventos SWIFT (códigos alineados con DRL de comisiones)
export const SWIFT_EVENT_TYPES: Record<string, string> = {
  // Cobranzas Documentarias
  'CobranzasAcuseRecibo': 'ACKNOWLEDGE',
  'CobranzasAvisoAceptacion': 'ACCEPT',
  'CobranzasAvisoNoPago': 'TRACER',
  'CobranzasAvisoPago': 'PAYMENT_COLLECTION',
  'CobranzasTracer': 'TRACER',

  // Cartas de Crédito Importación
  'LCImportacionEmision': 'EMISSION_LC_IMPORT',
  'LCImportacionEnmienda': 'AMENDMENT_LC_IMPORT',
  'LCImportacionPago': 'PAYMENT_LC_IMPORT',
  'LCImportacionDiscrepancias': 'CLAIM',
  'LCImportacionNegociacion': 'NEGOTIATION_LC_EXPORT',
  'LCImportacionReembolso': 'REIMBURSEMENT_ADVICE',
  'LCImportacionTransferencia': 'TRANSFER',
  'LCImportacionReconocimiento': 'PRESENT_DOCUMENTS',
  'LCImportacionMensajeLibre': 'FREE_FORMAT',

  // Cartas de Crédito Exportación
  'LCExportacionEmision': 'EMISSION_LC_EXPORT',
  'LCExportacionEnmienda': 'AMENDMENT_LC_IMPORT',
  'LCExportacionPago': 'PAYMENT_LC_IMPORT',
  'LCExportacionDiscrepancias': 'CLAIM',
  'LCExportacionNegociacion': 'NEGOTIATION_LC_EXPORT',
  'LCExportacionReembolso': 'REIMBURSEMENT_ADVICE',
  'LCExportacionTransferencia': 'TRANSFER',
  'LCExportacionReconocimiento': 'PRESENT_DOCUMENTS',
  'LCExportacionPreaviso': 'ADVICE_LC_EXPORT',
  'LCExportacionMensajeLibre': 'FREE_FORMAT',

  // Garantías Bancarias
  'GarantiasEmision': 'GUARANTEE_ISSUANCE',
  'GarantiasEnmienda': 'AMEND',
  'GarantiasPago': 'PAYMENT_LC_IMPORT',
  'GarantiasReduccion': 'AMEND',
  'GarantiasReconocimiento': 'PRESENT_DOCUMENTS',
  'GarantiasMensajeLibre': 'FREE_FORMAT',
};
