/**
 * Módulo de Extracción de Documentos con IA
 *
 * Uso:
 * ```typescript
 * import { documentExtractionService, AIProviderType } from './services/ai-extraction';
 *
 * // Extraer de un archivo
 * const result = await documentExtractionService.extractFromFile(file, {
 *   expectedMessageType: 'MT700',
 *   provider: 'claude',
 * }, (progress) => {
 *   console.log(`${progress.stage}: ${progress.percent}%`);
 * });
 *
 * // Revisar campos
 * documentExtractionService.reviewField({
 *   extractionId: result.id,
 *   fieldCode: ':20:',
 *   action: 'approve',
 * });
 *
 * // Aplicar al formulario
 * documentExtractionService.applyToForm(result.id, handleSwiftFieldChange);
 * ```
 */

// Servicio principal
export { documentExtractionService } from './documentExtractionService';

// Interface de proveedor
export type { IAIProvider, AIProviderFactory } from './AIProvider.interface';
export { BaseAIProvider } from './AIProvider.interface';

// Proveedores
export { ClaudeProvider, createClaudeProvider, claudeProvider } from './providers/ClaudeProvider';
export { OpenAIProvider, createOpenAIProvider, openAIProvider } from './providers/OpenAIProvider';

// Re-exportar tipos desde types/extraction para conveniencia
export type {
  AIProviderType,
  AIProviderConfig,
  ExtractionRequest,
  ExtractionResult,
  ExtractedField,
  ExtractionFieldStatus,
  ConfidenceLevel,
  DocumentSourceType,
  ExtractionProgressCallback,
  ExtractionConfig,
  ExtractionHistory,
  ExtractionHistoryFilter,
  ReviewFieldCommand,
  ApplyExtractionCommand,
  ConfidenceThresholds,
} from '../../types/extraction';

export {
  getConfidenceLevel,
  getConfidenceColor,
} from '../../types/extraction';
