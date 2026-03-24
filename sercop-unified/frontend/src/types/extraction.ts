/**
 * Tipos para el servicio de extracción de documentos con IA
 * Sigue los patrones existentes de global_cmx
 */

/**
 * Proveedores de IA disponibles
 */
export type AIProviderType = 'claude' | 'openai' | 'local' | 'azure' | 'google';

/**
 * Estado del campo extraído
 */
export type ExtractionFieldStatus = 'pending' | 'approved' | 'rejected' | 'edited';

/**
 * Nivel de confianza de la extracción
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Tipo de documento a extraer
 */
export type DocumentSourceType =
  | 'swift_message'      // Mensaje SWIFT texto plano
  | 'bank_letter'        // Carta de banco escaneada/PDF
  | 'proforma_invoice'   // Factura proforma
  | 'commercial_invoice' // Factura comercial
  | 'bill_of_lading'     // Conocimiento de embarque
  | 'certificate'        // Certificados varios
  | 'other';

/**
 * Campo extraído por IA
 */
export interface ExtractedField {
  /** Código del campo SWIFT (ej: ':20:', ':32B:') */
  fieldCode: string;
  /** Valor extraído */
  value: string | Record<string, any>;
  /** Valor original (si fue editado) */
  originalValue?: string | Record<string, any>;
  /** Confianza de la extracción (0-1) */
  confidence: number;
  /** Nivel de confianza categorizado */
  confidenceLevel: ConfidenceLevel;
  /** Estado del campo */
  status: ExtractionFieldStatus;
  /** Ubicación en el documento (para resaltar) */
  sourceLocation?: {
    page?: number;
    line?: number;
    startChar?: number;
    endChar?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  };
  /** Razón si la confianza es baja */
  lowConfidenceReason?: string;
  /** Sugerencias alternativas */
  alternatives?: Array<{
    value: string;
    confidence: number;
  }>;
  /** Timestamp de cuándo fue revisado */
  reviewedAt?: string;
  /** Usuario que revisó */
  reviewedBy?: string;
}

/**
 * Resultado de extracción completo
 */
export interface ExtractionResult {
  /** ID único de la extracción */
  id: string;
  /** Tipo de mensaje detectado (MT700, MT760, etc.) */
  messageType: string;
  /** Campos extraídos */
  fields: ExtractedField[];
  /** Estadísticas de la extracción */
  stats: {
    totalFields: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    approved: number;
    rejected: number;
    edited: number;
  };
  /** Metadatos del documento fuente */
  sourceDocument: {
    fileName: string;
    fileType: string;
    fileSize: number;
    documentType: DocumentSourceType;
    pageCount?: number;
  };
  /** Proveedor de IA usado */
  provider: AIProviderType;
  /** Modelo específico usado */
  model: string;
  /** Tiempo de procesamiento (ms) */
  processingTime: number;
  /** Costo estimado de la extracción */
  estimatedCost?: number;
  /** Timestamp de creación */
  createdAt: string;
  /** Texto crudo extraído (si aplica) */
  rawText?: string;
  /** Errores durante la extracción */
  errors?: string[];
  /** Advertencias */
  warnings?: string[];
}

/**
 * Configuración de proveedor de IA
 */
export interface AIProviderConfig {
  /** Tipo de proveedor */
  type: AIProviderType;
  /** Nombre para mostrar */
  displayName: string;
  /** Si está habilitado */
  enabled: boolean;
  /** Endpoint API (si es custom) */
  apiEndpoint?: string;
  /** Modelo a usar */
  model: string;
  /** Modelos disponibles */
  availableModels: string[];
  /** Configuración de timeout (ms) */
  timeout: number;
  /** Máximo de tokens */
  maxTokens: number;
  /** Temperatura para respuestas */
  temperature: number;
  /** Si requiere API key del cliente */
  requiresApiKey: boolean;
  /** Costo aproximado por documento */
  costPerDocument?: number;
  /** Capacidades del proveedor */
  capabilities: {
    supportsImages: boolean;
    supportsPDF: boolean;
    supportsStreaming: boolean;
    maxImageSize?: number;
    maxPDFPages?: number;
  };
}

/**
 * Request para extracción
 */
export interface ExtractionRequest {
  /** Archivo a procesar (base64 o URL) */
  file: {
    content: string;
    type: 'base64' | 'url';
    mimeType: string;
    fileName: string;
  };
  /** Tipo de documento (si se conoce) */
  documentType?: DocumentSourceType;
  /** Tipo de mensaje esperado (MT700, MT760, etc.) */
  expectedMessageType?: string;
  /** Proveedor a usar (si no se especifica, usa el default) */
  provider?: AIProviderType;
  /** Modelo específico (si no se especifica, usa el default del proveedor) */
  model?: string;
  /** Campos específicos a extraer (si no se especifica, extrae todos) */
  targetFields?: string[];
  /** Idioma del documento */
  language?: 'es' | 'en';
  /** Contexto adicional para mejorar extracción */
  context?: {
    applicantCountry?: string;
    beneficiaryCountry?: string;
    currency?: string;
  };
}

/**
 * Response de extracción (wrapper API)
 */
export interface ExtractionResponse {
  success: boolean;
  message?: string;
  data?: ExtractionResult;
  errors?: string[];
}

/**
 * Comando para aprobar/rechazar campos
 */
export interface ReviewFieldCommand {
  extractionId: string;
  fieldCode: string;
  action: 'approve' | 'reject' | 'edit';
  newValue?: string | Record<string, any>;
  reason?: string;
}

/**
 * Comando para aplicar extracción al formulario
 */
export interface ApplyExtractionCommand {
  extractionId: string;
  /** Solo aplicar campos con estos estados */
  filterByStatus?: ExtractionFieldStatus[];
  /** Solo aplicar campos con confianza >= este valor */
  minConfidence?: number;
  /** Sobrescribir campos existentes */
  overwriteExisting?: boolean;
}

/**
 * Historial de extracciones
 */
export interface ExtractionHistory {
  id: string;
  fileName: string;
  messageType: string;
  provider: AIProviderType;
  fieldsExtracted: number;
  fieldsApproved: number;
  createdAt: string;
  createdBy: string;
  status: 'pending_review' | 'partially_applied' | 'fully_applied' | 'discarded';
}

/**
 * Filtro para historial
 */
export interface ExtractionHistoryFilter {
  messageType?: string;
  provider?: AIProviderType;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * Umbrales de confianza configurables
 */
export interface ConfidenceThresholds {
  high: number;    // >= este valor es alta confianza (default: 0.90)
  medium: number;  // >= este valor es media confianza (default: 0.70)
  // < medium es baja confianza
}

/**
 * Configuración global de extracción
 */
export interface ExtractionConfig {
  /** Proveedor por defecto */
  defaultProvider: AIProviderType;
  /** Umbrales de confianza */
  confidenceThresholds: ConfidenceThresholds;
  /** Auto-aprobar campos con alta confianza */
  autoApproveHighConfidence: boolean;
  /** Guardar historial de extracciones */
  saveHistory: boolean;
  /** Máximo de archivos en cola */
  maxQueueSize: number;
  /** Proveedores configurados */
  providers: AIProviderConfig[];
}

/**
 * Callback para progreso de extracción
 */
export type ExtractionProgressCallback = (progress: {
  stage: 'uploading' | 'processing' | 'extracting' | 'validating' | 'complete';
  percent: number;
  message: string;
  currentField?: string;
}) => void;

/**
 * Helper para calcular nivel de confianza
 */
export function getConfidenceLevel(
  confidence: number,
  thresholds: ConfidenceThresholds = { high: 0.90, medium: 0.70 }
): ConfidenceLevel {
  if (confidence >= thresholds.high) return 'high';
  if (confidence >= thresholds.medium) return 'medium';
  return 'low';
}

/**
 * Helper para obtener color según confianza
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'green';
    case 'medium': return 'yellow';
    case 'low': return 'red';
  }
}
