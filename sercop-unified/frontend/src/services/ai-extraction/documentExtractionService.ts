/**
 * Servicio de Extracción de Documentos con IA
 * Gestiona múltiples proveedores y proporciona una API unificada
 *
 * Sigue los patrones de global_cmx (apiClient, singleton, etc.)
 */

import type { IAIProvider } from './AIProvider.interface';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import type {
  AIProviderType,
  AIProviderConfig,
  ExtractionRequest,
  ExtractionResult,
  ExtractedField,
  ExtractionProgressCallback,
  ExtractionConfig,
  ExtractionHistory,
  ExtractionHistoryFilter,
  ReviewFieldCommand,
  ApplyExtractionCommand,
  ConfidenceThresholds,
} from '../../types/extraction';
import type { SwiftFieldConfig } from '../../types/swiftField';
import { get, post, put } from '../../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../../config/api.config';

/**
 * Configuración por defecto
 */
const DEFAULT_CONFIG: ExtractionConfig = {
  defaultProvider: 'claude',
  confidenceThresholds: {
    high: 0.90,
    medium: 0.70,
  },
  autoApproveHighConfidence: false,
  saveHistory: true,
  maxQueueSize: 10,
  providers: [],
};

/**
 * Servicio principal de extracción de documentos
 */
class DocumentExtractionService {
  private config: ExtractionConfig;
  private providers: Map<AIProviderType, IAIProvider>;
  private activeExtractions: Map<string, ExtractionResult>;
  private fieldConfigs: SwiftFieldConfig[] = [];

  constructor() {
    this.config = DEFAULT_CONFIG;
    this.providers = new Map();
    this.activeExtractions = new Map();

    // Registrar proveedores disponibles
    this.registerProvider(new ClaudeProvider());
    this.registerProvider(new OpenAIProvider());
  }

  // ============================================================
  // GESTIÓN DE PROVEEDORES
  // ============================================================

  /**
   * Registra un proveedor de IA
   */
  registerProvider(provider: IAIProvider): void {
    this.providers.set(provider.type, provider);
    console.log(`🤖 AI Provider registered: ${provider.displayName}`);
  }

  /**
   * Obtiene un proveedor por tipo
   */
  getProvider(type: AIProviderType): IAIProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Obtiene el proveedor por defecto
   */
  getDefaultProvider(): IAIProvider {
    const provider = this.providers.get(this.config.defaultProvider);
    if (!provider) {
      throw new Error(`Default provider '${this.config.defaultProvider}' not found`);
    }
    return provider;
  }

  /**
   * Lista todos los proveedores disponibles
   */
  getAvailableProviders(): Array<{
    type: AIProviderType;
    displayName: string;
    config: AIProviderConfig;
  }> {
    return Array.from(this.providers.values()).map(p => ({
      type: p.type,
      displayName: p.displayName,
      config: p.config,
    }));
  }

  /**
   * Verifica si un proveedor está disponible
   */
  async isProviderAvailable(type: AIProviderType): Promise<boolean> {
    const provider = this.providers.get(type);
    if (!provider) return false;
    return provider.isAvailable();
  }

  /**
   * Cambia el proveedor por defecto
   */
  setDefaultProvider(type: AIProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Provider '${type}' not registered`);
    }
    this.config.defaultProvider = type;
    console.log(`🔄 Default AI provider changed to: ${type}`);
  }

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================

  /**
   * Obtiene la configuración actual
   */
  getConfig(): ExtractionConfig {
    return { ...this.config };
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(updates: Partial<ExtractionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Actualiza los umbrales de confianza
   */
  setConfidenceThresholds(thresholds: ConfidenceThresholds): void {
    this.config.confidenceThresholds = thresholds;
  }

  /**
   * Carga la configuración de campos SWIFT desde la base de datos
   */
  async loadFieldConfigs(messageType?: string): Promise<SwiftFieldConfig[]> {
    try {
      const url = messageType
        ? `${API_BASE_URL}/swift-field-configs?messageType=${messageType}`
        : `${API_BASE_URL}/swift-field-configs`;

      const response = await get(url);
      const result = await response.json();

      if (response.ok && result.data) {
        this.fieldConfigs = result.data;
        return this.fieldConfigs;
      }

      throw new Error(result.message || 'Error loading field configs');
    } catch (error) {
      console.error('Error loading field configs:', error);
      throw error;
    }
  }

  // ============================================================
  // EXTRACCIÓN DE DOCUMENTOS
  // ============================================================

  /**
   * Extrae campos de un documento
   * @param request - Request con el documento
   * @param onProgress - Callback para progreso
   * @returns Resultado de la extracción
   */
  async extractDocument(
    request: ExtractionRequest,
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    // Obtener proveedor
    const providerType = request.provider || this.config.defaultProvider;
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`Provider '${providerType}' not available`);
    }

    // Cargar configuraciones de campo si no están cargadas
    if (this.fieldConfigs.length === 0) {
      await this.loadFieldConfigs(request.expectedMessageType);
    }

    // Ejecutar extracción
    const result = await provider.extractFields(
      request,
      this.fieldConfigs,
      onProgress
    );

    // Auto-aprobar campos de alta confianza si está configurado
    if (this.config.autoApproveHighConfidence) {
      result.fields.forEach(field => {
        if (field.confidenceLevel === 'high') {
          field.status = 'approved';
        }
      });

      // Recalcular estadísticas
      result.stats.approved = result.fields.filter(f => f.status === 'approved').length;
    }

    // Guardar en extracciones activas
    this.activeExtractions.set(result.id, result);

    // Guardar en historial si está configurado
    if (this.config.saveHistory) {
      await this.saveToHistory(result);
    }

    return result;
  }

  /**
   * Extrae campos de un archivo subido
   * @param file - Archivo del input
   * @param options - Opciones adicionales
   * @param onProgress - Callback para progreso
   */
  async extractFromFile(
    file: File,
    options?: Partial<ExtractionRequest>,
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    // Convertir archivo a base64
    const content = await this.fileToBase64(file);

    const request: ExtractionRequest = {
      file: {
        content,
        type: 'base64',
        mimeType: file.type,
        fileName: file.name,
      },
      documentType: this.detectDocumentType(file.name, file.type),
      ...options,
    };

    return this.extractDocument(request, onProgress);
  }

  /**
   * Obtiene una extracción activa por ID
   */
  getExtraction(id: string): ExtractionResult | undefined {
    return this.activeExtractions.get(id);
  }

  /**
   * Cancela una extracción en progreso
   */
  cancelExtraction(providerType?: AIProviderType): void {
    const provider = providerType
      ? this.providers.get(providerType)
      : this.getDefaultProvider();

    if (provider?.cancel) {
      provider.cancel();
    }
  }

  // ============================================================
  // REVISIÓN DE CAMPOS
  // ============================================================

  /**
   * Revisa un campo extraído (aprobar, rechazar, editar)
   */
  reviewField(command: ReviewFieldCommand): ExtractedField | null {
    const extraction = this.activeExtractions.get(command.extractionId);
    if (!extraction) return null;

    const field = extraction.fields.find(f => f.fieldCode === command.fieldCode);
    if (!field) return null;

    switch (command.action) {
      case 'approve':
        field.status = 'approved';
        extraction.stats.approved++;
        break;

      case 'reject':
        field.status = 'rejected';
        extraction.stats.rejected++;
        break;

      case 'edit':
        if (command.newValue !== undefined) {
          field.originalValue = field.value;
          field.value = command.newValue;
          field.status = 'edited';
          field.confidence = 1.0; // Editado por usuario = 100% confianza
          field.confidenceLevel = 'high';
          extraction.stats.edited++;
        }
        break;
    }

    field.reviewedAt = new Date().toISOString();

    return field;
  }

  /**
   * Aprueba todos los campos con alta confianza
   */
  approveAllHighConfidence(extractionId: string): number {
    const extraction = this.activeExtractions.get(extractionId);
    if (!extraction) return 0;

    let count = 0;
    extraction.fields.forEach(field => {
      if (field.confidenceLevel === 'high' && field.status === 'pending') {
        field.status = 'approved';
        field.reviewedAt = new Date().toISOString();
        count++;
      }
    });

    extraction.stats.approved += count;
    return count;
  }

  /**
   * Aprueba todos los campos pendientes
   */
  approveAll(extractionId: string): number {
    const extraction = this.activeExtractions.get(extractionId);
    if (!extraction) return 0;

    let count = 0;
    extraction.fields.forEach(field => {
      if (field.status === 'pending') {
        field.status = 'approved';
        field.reviewedAt = new Date().toISOString();
        count++;
      }
    });

    extraction.stats.approved += count;
    return count;
  }

  // ============================================================
  // APLICAR AL FORMULARIO
  // ============================================================

  /**
   * Obtiene los campos aprobados listos para aplicar al formulario
   */
  getApprovedFields(extractionId: string): Record<string, any> {
    const extraction = this.activeExtractions.get(extractionId);
    if (!extraction) return {};

    const formData: Record<string, any> = {};

    extraction.fields
      .filter(f => f.status === 'approved' || f.status === 'edited')
      .forEach(field => {
        formData[field.fieldCode] = field.value;
      });

    return formData;
  }

  /**
   * Aplica una extracción a un callback de formulario
   */
  applyToForm(
    extractionId: string,
    onFieldChange: (fieldCode: string, value: any) => void,
    options?: Partial<ApplyExtractionCommand>
  ): number {
    const extraction = this.activeExtractions.get(extractionId);
    if (!extraction) return 0;

    const statusFilter = options?.filterByStatus || ['approved', 'edited'];
    const minConfidence = options?.minConfidence || 0;

    let count = 0;

    extraction.fields
      .filter(f => {
        if (!statusFilter.includes(f.status)) return false;
        if (f.confidence < minConfidence) return false;
        return true;
      })
      .forEach(field => {
        onFieldChange(field.fieldCode, field.value);
        count++;
      });

    return count;
  }

  // ============================================================
  // HISTORIAL
  // ============================================================

  /**
   * Guarda extracción en historial
   */
  private async saveToHistory(result: ExtractionResult): Promise<void> {
    try {
      await post(`${API_BASE_URL}/ai/extraction/history`, {
        id: result.id,
        fileName: result.sourceDocument.fileName,
        messageType: result.messageType,
        provider: result.provider,
        model: result.model,
        fieldsExtracted: result.stats.totalFields,
        fieldsApproved: result.stats.approved,
        processingTime: result.processingTime,
        estimatedCost: result.estimatedCost,
      });
    } catch (error) {
      console.error('Error saving extraction to history:', error);
    }
  }

  /**
   * Obtiene historial de extracciones
   */
  async getHistory(filter?: ExtractionHistoryFilter): Promise<ExtractionHistory[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.messageType) params.append('messageType', filter.messageType);
      if (filter?.provider) params.append('provider', filter.provider);
      if (filter?.status) params.append('status', filter.status);
      if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter?.dateTo) params.append('dateTo', filter.dateTo);
      if (filter?.limit) params.append('limit', filter.limit.toString());
      if (filter?.offset) params.append('offset', filter.offset.toString());

      const response = await get(`${API_BASE_URL}/ai/extraction/history?${params}`);
      const result = await response.json();

      if (response.ok && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching extraction history:', error);
      return [];
    }
  }

  // ============================================================
  // UTILIDADES
  // ============================================================

  /**
   * Convierte un archivo a base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remover el prefijo data:mime/type;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Detecta el tipo de documento basándose en el nombre y tipo MIME
   */
  private detectDocumentType(
    fileName: string,
    mimeType: string
  ): ExtractionRequest['documentType'] {
    const name = fileName.toLowerCase();

    if (name.includes('mt700') || name.includes('mt-700') || name.includes('swift')) {
      return 'swift_message';
    }
    if (name.includes('proforma') || name.includes('pi-')) {
      return 'proforma_invoice';
    }
    if (name.includes('invoice') || name.includes('factura')) {
      return 'commercial_invoice';
    }
    if (name.includes('bl') || name.includes('bill of lading') || name.includes('conocimiento')) {
      return 'bill_of_lading';
    }
    if (name.includes('certificate') || name.includes('certificado')) {
      return 'certificate';
    }
    if (mimeType.includes('pdf') || mimeType.includes('image')) {
      return 'bank_letter';
    }

    return 'other';
  }

  /**
   * Estima el costo de una extracción antes de ejecutarla
   */
  estimateCost(
    file: File,
    providerType?: AIProviderType
  ): number {
    const provider = providerType
      ? this.providers.get(providerType)
      : this.getDefaultProvider();

    if (!provider) return 0;

    return provider.estimateCost({
      file: {
        content: '', // No necesitamos el contenido para estimar
        type: 'base64',
        mimeType: file.type,
        fileName: file.name,
      },
    });
  }
}

// Exportar instancia singleton
export const documentExtractionService = new DocumentExtractionService();

// Exportar tipos para conveniencia
export type {
  ExtractionRequest,
  ExtractionResult,
  ExtractedField,
  ExtractionProgressCallback,
  AIProviderType,
};
