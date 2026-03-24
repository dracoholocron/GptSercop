/**
 * Proveedor de IA Claude (Anthropic) para extracción de documentos
 */

import { BaseAIProvider } from '../AIProvider.interface';
import type {
  AIProviderType,
  AIProviderConfig,
  ExtractionRequest,
  ExtractionResult,
  ExtractedField,
  ExtractionProgressCallback,
  ConfidenceLevel,
} from '../../../types/extraction';
import type { SwiftFieldConfig } from '../../../types/swiftField';
import { getConfidenceLevel } from '../../../types/extraction';
import { post } from '../../../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX } from '../../../config/api.config';

/**
 * Configuración por defecto para Claude
 */
const DEFAULT_CLAUDE_CONFIG: AIProviderConfig = {
  type: 'claude',
  displayName: 'Claude (Anthropic)',
  enabled: true,
  model: 'claude-sonnet-4-20250514',
  availableModels: [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-haiku-20240307',
  ],
  timeout: 120000, // 2 minutos
  maxTokens: 8192,
  temperature: 0.1, // Bajo para mayor precisión
  requiresApiKey: false, // El backend maneja la API key
  costPerDocument: 0.05,
  capabilities: {
    supportsImages: true,
    supportsPDF: true,
    supportsStreaming: true,
    maxImageSize: 20 * 1024 * 1024, // 20MB
    maxPDFPages: 100,
  },
};

/**
 * Implementación del proveedor Claude
 */
export class ClaudeProvider extends BaseAIProvider {
  readonly type: AIProviderType = 'claude';
  readonly displayName = 'Claude (Anthropic)';
  readonly config: AIProviderConfig;

  private abortController?: AbortController;

  constructor(customConfig?: Partial<AIProviderConfig>) {
    super();
    this.config = { ...DEFAULT_CLAUDE_CONFIG, ...customConfig };
  }

  /**
   * Verifica si Claude está disponible (el backend debe tener la API key configurada)
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await post(`${API_BASE_URL}/ai/extraction/health`, {
        provider: 'claude',
      });
      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('Claude provider not available:', error);
      return false;
    }
  }

  /**
   * Extrae campos de un documento usando Claude
   */
  async extractFields(
    request: ExtractionRequest,
    fieldConfigs: SwiftFieldConfig[],
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    this.abortController = new AbortController();

    try {
      // Reportar inicio
      onProgress?.({
        stage: 'uploading',
        percent: 10,
        message: 'Preparando documento...',
      });

      // Determinar tipo de mensaje
      const messageType = request.expectedMessageType || this.detectMessageType(request);

      // Filtrar configs para el tipo de mensaje
      const relevantConfigs = fieldConfigs.filter(
        c => c.isActive && c.messageType === messageType
      );

      // Generar prompt
      const prompt = this.generateExtractionPrompt(
        relevantConfigs,
        messageType,
        request.language || 'es'
      );

      onProgress?.({
        stage: 'processing',
        percent: 30,
        message: 'Enviando a Claude para análisis...',
      });

      // Llamar al backend que maneja la API de Claude
      const response = await post(
        `${API_BASE_URL}/ai/extraction/extract`,
        {
          provider: 'claude',
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
        throw new Error(error.message || 'Error en la extracción con Claude');
      }

      onProgress?.({
        stage: 'extracting',
        percent: 70,
        message: 'Procesando respuesta...',
      });

      const result = await response.json();

      // Parsear y procesar la respuesta
      const aiResponse = this.parseAIResponse(result.data.content);

      onProgress?.({
        stage: 'validating',
        percent: 90,
        message: 'Validando campos extraídos...',
      });

      // Construir campos extraídos con validación
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

        // Validar si tenemos configuración
        if (config) {
          const validation = this.validateField(extractedField, config);
          if (!validation.isValid) {
            extractedField.lowConfidenceReason = validation.errors.join('; ');
            // Reducir confianza si hay errores de validación
            extractedField.confidence = Math.min(extractedField.confidence, 0.5);
            extractedField.confidenceLevel = 'low';
          }
        }

        return extractedField;
      });

      // Calcular estadísticas
      const stats = this.calculateStats(extractedFields);

      onProgress?.({
        stage: 'complete',
        percent: 100,
        message: 'Extracción completada',
      });

      const processingTime = Date.now() - startTime;

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
        provider: 'claude',
        model: request.model || this.config.model,
        processingTime,
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

  /**
   * Estima el costo específico para Claude
   */
  estimateCost(request: ExtractionRequest): number {
    const inputTokens = Math.ceil(request.file.content.length / 4);
    const outputTokens = 2000;

    // Precios de Claude (aproximados, USD por 1M tokens)
    const inputPrice = 3.0 / 1_000_000;  // $3 por millón de tokens de entrada
    const outputPrice = 15.0 / 1_000_000; // $15 por millón de tokens de salida

    return (inputTokens * inputPrice) + (outputTokens * outputPrice);
  }

  /**
   * Cancela la extracción en progreso
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Detecta el tipo de mensaje basándose en el contenido
   */
  private detectMessageType(request: ExtractionRequest): string {
    const content = request.file.content.toLowerCase();

    // Detectar por patrones comunes
    if (content.includes('mt700') || content.includes('documentary credit')) {
      return 'MT700';
    }
    if (content.includes('mt760') || content.includes('guarantee')) {
      return 'MT760';
    }
    if (content.includes('mt710') || content.includes('advice of')) {
      return 'MT710';
    }
    if (content.includes('mt707') || content.includes('amendment')) {
      return 'MT707';
    }

    // Por defecto, asumir MT700
    return 'MT700';
  }

  /**
   * Calcula estadísticas de los campos extraídos
   */
  private calculateStats(fields: ExtractedField[]) {
    return {
      totalFields: fields.length,
      highConfidence: fields.filter(f => f.confidenceLevel === 'high').length,
      mediumConfidence: fields.filter(f => f.confidenceLevel === 'medium').length,
      lowConfidence: fields.filter(f => f.confidenceLevel === 'low').length,
      approved: fields.filter(f => f.status === 'approved').length,
      rejected: fields.filter(f => f.status === 'rejected').length,
      edited: fields.filter(f => f.status === 'edited').length,
    };
  }

  /**
   * Sobrescribe el prompt para Claude con instrucciones más específicas
   */
  protected generateExtractionPrompt(
    fieldConfigs: SwiftFieldConfig[],
    messageType: string,
    language: 'es' | 'en' = 'es'
  ): string {
    const basePrompt = super.generateExtractionPrompt(fieldConfigs, messageType, language);

    const claudeSpecificInstructions = language === 'es'
      ? `
INSTRUCCIONES ADICIONALES PARA CLAUDE:
- Analiza el documento completo antes de extraer cualquier campo
- Para campos de fecha, convierte al formato SWIFT (YYMMDD o YYYYMMDD según el campo)
- Para montos, extrae tanto la moneda (ISO 4217) como el valor numérico
- Para direcciones y nombres de partes, mantén el formato multilínea si aplica
- Si encuentras información parcial, extráela con confianza reducida
- Presta especial atención a los campos BIC/SWIFT (formato: 8 u 11 caracteres)

CRÍTICO PARA CAMPOS TEXTAREA (campos de texto largo):
- Los campos TEXTAREA están marcados en la lista de campos arriba
- Busca secciones del documento que coincidan con los títulos indicados en el mapeo
- Extrae el contenido COMPLETO de cada sección (todas las líneas)
- NO resumas el contenido, cópialo íntegro
- Incluye listas numeradas, viñetas y todo el texto de la sección
`
      : `
ADDITIONAL INSTRUCTIONS FOR CLAUDE:
- Analyze the complete document before extracting any field
- For date fields, convert to SWIFT format (YYMMDD or YYYYMMDD depending on field)
- For amounts, extract both currency (ISO 4217) and numeric value
- For addresses and party names, maintain multiline format if applicable
- If you find partial information, extract it with reduced confidence
- Pay special attention to BIC/SWIFT codes (format: 8 or 11 characters)

CRITICAL FOR TEXTAREA FIELDS (long text fields):
- TEXTAREA fields are marked in the field list above
- Look for document sections that match the titles indicated in the mapping
- Extract the COMPLETE content of each section (all lines)
- Do NOT summarize the content, copy it entirely
- Include numbered lists, bullet points, and all text from the section
`;

    return basePrompt + claudeSpecificInstructions;
  }
}

/**
 * Factory para crear instancia de ClaudeProvider
 */
export const createClaudeProvider = (config?: Partial<AIProviderConfig>): ClaudeProvider => {
  return new ClaudeProvider(config);
};

/**
 * Instancia singleton por defecto
 */
export const claudeProvider = new ClaudeProvider();
