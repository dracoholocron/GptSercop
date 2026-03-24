/**
 * Guarantee Document Generation Service
 * Handles PDF generation for bank guarantees
 */

import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';

const GUARANTEES_URL = `${API_BASE_URL}/foreign-trade/bank-guarantees`;

export type Language = 'ES' | 'EN';

export interface GuaranteeTemplateData {
  numeroGarantia: string;
  tipo: string;
  subtipo: string;
  estado: string;
  tipoDescripcion: string;
  moneda: string;
  monto: number;
  montoFormateado: string;
  montoLetras: string;
  fechaEmision: string;
  fechaVencimiento: string;
  ordenanteNombre: string;
  beneficiarioNombre: string;
  bancoGaranteNombre: string;
  numeroContrato?: string;
  objetoContrato?: string;
  [key: string]: string | number | boolean | undefined;
}

class GuaranteeDocumentService {
  /**
   * Generate PDF for a guarantee by ID
   * @param guaranteeId - The guarantee ID
   * @param language - Language for the document (ES or EN)
   * @returns Blob containing the PDF
   */
  async generatePdf(guaranteeId: number | string, language: Language = 'ES'): Promise<Blob> {
    const token = localStorage.getItem('globalcmx_token');
    const url = `${GUARANTEES_URL}/generate-pdf/${guaranteeId}?language=${language}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Garantia no encontrada');
      }
      throw new Error('Error al generar el documento PDF');
    }

    return response.blob();
  }

  /**
   * Generate PDF for a guarantee by number/reference
   * Uses the operation_readmodel endpoint that searches by reference
   * @param numeroGarantia - The guarantee number/reference
   * @param language - Language for the document (ES or EN)
   * @returns Blob containing the PDF
   */
  async generatePdfByNumber(numeroGarantia: string, language: Language = 'ES'): Promise<Blob> {
    const token = localStorage.getItem('globalcmx_token');
    const url = `${GUARANTEES_URL}/generate-pdf-by-reference/${encodeURIComponent(numeroGarantia)}?language=${language}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Garantia no encontrada');
      }
      throw new Error('Error al generar el documento PDF');
    }

    return response.blob();
  }

  /**
   * Generate HTML preview for a guarantee
   * @param guaranteeId - The guarantee ID
   * @param language - Language for the document (ES or EN)
   * @returns HTML string
   */
  async generatePreview(guaranteeId: number | string, language: Language = 'ES'): Promise<string> {
    const token = localStorage.getItem('globalcmx_token');
    const url = `${GUARANTEES_URL}/generate-preview/${guaranteeId}?language=${language}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Garantia no encontrada');
      }
      throw new Error('Error al generar la vista previa');
    }

    return response.text();
  }

  /**
   * Get template data for a guarantee
   * @param guaranteeId - The guarantee ID
   * @param language - Language for the data (ES or EN)
   * @returns Template data object
   */
  async getTemplateData(guaranteeId: number | string, language: Language = 'ES'): Promise<GuaranteeTemplateData> {
    const token = localStorage.getItem('globalcmx_token');
    const url = `${GUARANTEES_URL}/${guaranteeId}/document/data?language=${language}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Garantia no encontrada');
      }
      throw new Error('Error al obtener los datos');
    }

    return response.json();
  }

  /**
   * Get list of available template variables
   * @returns Array of variable names
   */
  async getAvailableVariables(): Promise<string[]> {
    const token = localStorage.getItem('globalcmx_token');
    const url = `${GUARANTEES_URL}/document-variables`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las variables disponibles');
    }

    return response.json();
  }

  /**
   * Download PDF and trigger browser download
   * @param guaranteeId - The guarantee ID
   * @param language - Language for the document (ES or EN)
   * @param filename - Optional custom filename
   */
  async downloadPdf(guaranteeId: number | string, language: Language = 'ES', filename?: string): Promise<void> {
    const blob = await this.generatePdf(guaranteeId, language);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `garantia_${guaranteeId}_${language.toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Open PDF in new tab
   * @param guaranteeId - The guarantee ID
   * @param language - Language for the document (ES or EN)
   */
  async openPdfInNewTab(guaranteeId: number | string, language: Language = 'ES'): Promise<void> {
    const blob = await this.generatePdf(guaranteeId, language);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Don't revoke immediately as the new tab needs time to load
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
}

export const guaranteeDocumentService = new GuaranteeDocumentService();
export default guaranteeDocumentService;
