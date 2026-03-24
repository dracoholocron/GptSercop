/**
 * Proveedor de IA OpenAI (GPT-4) para extracción de documentos
 * Alternativa a Claude con soporte para visión
 */

import { BaseAIProvider } from '../AIProvider.interface';
import type {
  AIProviderType,
  AIProviderConfig,
  ExtractionRequest,
  ExtractionResult,
  ExtractedField,
  ExtractionProgressCallback,
} from '../../../types/extraction';
import type { SwiftFieldConfig } from '../../../types/swiftField';
import { getConfidenceLevel } from '../../../types/extraction';
import { post } from '../../../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX } from '../../../config/api.config';

/**
 * Configuración por defecto para OpenAI
 */
const DEFAULT_OPENAI_CONFIG: AIProviderConfig = {
  type: 'openai',
  displayName: 'OpenAI (GPT-4)',
  enabled: true,
  model: 'gpt-4o',
  availableModels: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
  ],
  timeout: 120000,
  maxTokens: 8192,
  temperature: 0.1,
  requiresApiKey: false,
  costPerDocument: 0.08,
  capabilities: {
    supportsImages: true,
    supportsPDF: true,
    supportsStreaming: true,
    maxImageSize: 20 * 1024 * 1024,
    maxPDFPages: 50,
  },
};

/**
 * Implementación del proveedor OpenAI
 */
export class OpenAIProvider extends BaseAIProvider {
  readonly type: AIProviderType = 'openai';
  readonly displayName = 'OpenAI (GPT-4)';
  readonly config: AIProviderConfig;

  private abortController?: AbortController;

  constructor(customConfig?: Partial<AIProviderConfig>) {
    super();
    this.config = { ...DEFAULT_OPENAI_CONFIG, ...customConfig };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await post(`${API_BASE_URL}/ai/extraction/health`, {
        provider: 'openai',
      });
      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('OpenAI provider not available:', error);
      return false;
    }
  }

  async extractFields(
    request: ExtractionRequest,
    fieldConfigs: SwiftFieldConfig[],
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    this.abortController = new AbortController();

    try {
      onProgress?.({
        stage: 'uploading',
        percent: 10,
        message: 'Preparando documento...',
      });

      const messageType = request.expectedMessageType || 'MT700';
      const relevantConfigs = fieldConfigs.filter(
        c => c.isActive && c.messageType === messageType
      );

      const prompt = this.generateExtractionPrompt(
        relevantConfigs,
        messageType,
        request.language || 'es'
      );

      onProgress?.({
        stage: 'processing',
        percent: 30,
        message: 'Enviando a GPT-4 para análisis...',
      });

      const response = await post(
        `${API_BASE_URL}/ai/extraction/extract`,
        {
          provider: 'openai',
          model: request.model || this.config.model,
          file: request.file,
          prompt,
          messageType,
          language: request.language || 'es',
          context: request.context,
        },
        {
          signal: this.abortController.signal,
          timeout: this.config.timeout,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error en la extracción con OpenAI');
      }

      onProgress?.({
        stage: 'extracting',
        percent: 70,
        message: 'Procesando respuesta...',
      });

      const result = await response.json();
      const aiResponse = this.parseAIResponse(result.data.content);

      onProgress?.({
        stage: 'validating',
        percent: 90,
        message: 'Validando campos extraídos...',
      });

      const extractedFields: ExtractedField[] = aiResponse.fields.map(field => {
        const config = relevantConfigs.find(c => c.fieldCode === field.fieldCode);
        const confidenceLevel = getConfidenceLevel(field.confidence);

        const extractedField: ExtractedField = {
          fieldCode: field.fieldCode,
          value: field.value,
          confidence: field.confidence,
          confidenceLevel,
          status: 'pending',
          alternatives: field.alternatives,
        };

        if (config) {
          const validation = this.validateField(extractedField, config);
          if (!validation.isValid) {
            extractedField.lowConfidenceReason = validation.errors.join('; ');
            extractedField.confidence = Math.min(extractedField.confidence, 0.5);
            extractedField.confidenceLevel = 'low';
          }
        }

        return extractedField;
      });

      const stats = {
        totalFields: extractedFields.length,
        highConfidence: extractedFields.filter(f => f.confidenceLevel === 'high').length,
        mediumConfidence: extractedFields.filter(f => f.confidenceLevel === 'medium').length,
        lowConfidence: extractedFields.filter(f => f.confidenceLevel === 'low').length,
        approved: 0,
        rejected: 0,
        edited: 0,
      };

      onProgress?.({
        stage: 'complete',
        percent: 100,
        message: 'Extracción completada',
      });

      return {
        id: crypto.randomUUID(),
        messageType,
        fields: extractedFields,
        stats,
        sourceDocument: {
          fileName: request.file.fileName,
          fileType: request.file.mimeType,
          fileSize: request.file.content.length,
          documentType: request.documentType || 'other',
        },
        provider: 'openai',
        model: request.model || this.config.model,
        processingTime: Date.now() - startTime,
        estimatedCost: this.estimateCost(request),
        createdAt: new Date().toISOString(),
        rawText: aiResponse.rawText,
        warnings: aiResponse.warnings,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Extracción cancelada por el usuario');
      }
      throw error;
    } finally {
      this.abortController = undefined;
    }
  }

  estimateCost(request: ExtractionRequest): number {
    const inputTokens = Math.ceil(request.file.content.length / 4);
    const outputTokens = 2000;

    // Precios de GPT-4o (aproximados)
    const inputPrice = 5.0 / 1_000_000;
    const outputPrice = 15.0 / 1_000_000;

    return (inputTokens * inputPrice) + (outputTokens * outputPrice);
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

export const createOpenAIProvider = (config?: Partial<AIProviderConfig>): OpenAIProvider => {
  return new OpenAIProvider(config);
};

export const openAIProvider = new OpenAIProvider();
