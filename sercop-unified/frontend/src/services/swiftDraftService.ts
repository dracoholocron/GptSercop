/**
 * SwiftDraftService - Generic service for SWIFT drafts
 *
 * This is a single service for all product types:
 * - LC Import (MT700)
 * - LC Export (MT710, MT720)
 * - Guarantees (MT760)
 * - Free messages (MT799)
 *
 * The SWIFT message is stored as text and is the source of truth.
 */

import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import { buildSwiftMessage, extractMetadataFromFields } from '../utils/swiftMessageBuilder';
import { parseSwiftMessage } from '../utils/swiftMessageParser';
import type { SwiftFieldConfig, ValidationResult, ValidationError } from '../types/swiftField';
import { SwiftValidationService } from './swiftValidationService';
import { swiftFieldConfigService } from './swiftFieldConfigService';
import { notify } from '../components/ui/toaster';

/**
 * Error personalizado para errores de validación SWIFT
 * Permite a los componentes detectar si el error ya fue mostrado via notificación
 */
export class SwiftValidationError extends Error {
  public readonly errors: ValidationError[];
  public readonly notificationShown: boolean;
  public readonly draftId?: string;

  constructor(message: string, errors: ValidationError[], notificationShown: boolean = true, draftId?: string) {
    super(message);
    this.name = 'SwiftValidationError';
    this.errors = errors;
    this.notificationShown = notificationShown;
    this.draftId = draftId;
  }
}

/**
 * Product types supported by the draft system (all in English)
 */
export type ProductType =
  | 'LC_IMPORT'      // Letter of Credit - Import (MT700)
  | 'LC_EXPORT'      // Letter of Credit - Export (MT710, MT720)
  | 'GUARANTEE'      // Bank Guarantee (MT760)
  | 'STANDBY_LC'     // Standby Letter of Credit (MT760)
  | 'FREE_MESSAGE'   // Free format message (MT799)
  | 'TRANSFERABLE_LC' // Transferable LC (MT720)
  | 'BACK_TO_BACK_LC' // Back-to-Back LC
  | 'LC_AMENDMENT'   // LC Amendment (MT707)
  | 'COLLECTION';    // Documentary Collection (MT400, MT410)

/**
 * Draft status
 */
export type DraftStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

/**
 * Draft creation mode
 * Allows reopening the draft in its original mode
 */
export type DraftMode = 'EXPERT' | 'CLIENT' | 'WIZARD';

/**
 * Draft history item (event)
 */
export interface DraftHistoryItem {
  version: number;
  eventType: string;
  timestamp: string;
  aggregateType: string;
}

/**
 * SWIFT Draft DTO
 */
export interface SwiftDraft {
  id: number;
  draftId: string;
  messageType: string;
  productType: ProductType;
  reference?: string;
  status: DraftStatus;
  mode?: DraftMode;
  swiftMessage: string;

  // Metadata
  currency?: string;
  amount?: number;
  issueDate?: string;
  expiryDate?: string;
  applicantId?: number;
  beneficiaryId?: number;
  issuingBankId?: number;
  advisingBankId?: number;

  // Custom fields data in JSON format
  customData?: string;

  // Rejection data
  rejectionReason?: string;
  fieldComments?: Record<string, { comment: string; commentedAt: string; commentedBy: string }>;

  // Audit
  createdBy?: string;
  creationDate?: string;
  modifiedBy?: string;
  modificationDate?: string;
  version?: number;
}

/**
 * Create draft command
 */
export interface CreateSwiftDraftCommand {
  messageType: string;
  productType: ProductType;
  mode?: DraftMode;
  swiftMessage: string;
  reference?: string;
  currency?: string;
  amount?: number;
  issueDate?: string;
  expiryDate?: string;
  applicantId?: number;
  beneficiaryId?: number;
  issuingBankId?: number;
  issuingBankBic?: string;
  advisingBankId?: number;
  advisingBankBic?: string;
  customData?: string;
  createdBy?: string;
}

/**
 * Update draft command
 */
export interface UpdateSwiftDraftCommand {
  swiftMessage: string;
  reference?: string;
  currency?: string;
  amount?: number;
  issueDate?: string;
  expiryDate?: string;
  applicantId?: number;
  beneficiaryId?: number;
  issuingBankId?: number;
  issuingBankBic?: string;
  advisingBankId?: number;
  advisingBankBic?: string;
  customData?: string;
  modifiedBy?: string;
}

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

/**
 * Swift Draft Service
 */
class SwiftDraftService {
  private readonly baseUrl = `${API_BASE_URL}/swift-drafts`;

  /**
   * Valida los campos SWIFT según las reglas de swift_field_config_readmodel
   *
   * @param messageType - Tipo de mensaje SWIFT (ej: 'MT700')
   * @param fieldsData - Datos de los campos SWIFT
   * @param fieldConfigs - Configuraciones de campos (opcional, se cargan si no se proveen)
   * @returns Resultado de validación con isValid y lista de errores
   */
  async validateSwiftFields(
    messageType: string,
    fieldsData: Record<string, any>,
    fieldConfigs?: SwiftFieldConfig[]
  ): Promise<ValidationResult> {
    try {
      // Si no se proveen las configuraciones, cargarlas desde el servidor
      const configs = fieldConfigs || await swiftFieldConfigService.getAll(messageType, true);

      if (!configs || configs.length === 0) {
        console.warn(`No se encontraron configuraciones SWIFT para ${messageType}`);
        return { isValid: true, errors: [] };
      }

      const validationService = new SwiftValidationService(configs);
      return validationService.validateAllFields(fieldsData);
    } catch (error) {
      console.error('Error validating SWIFT fields:', error);
      // En caso de error al validar, permitir continuar pero loguearlo
      return { isValid: true, errors: [] };
    }
  }

  /**
   * Genera un mensaje de error formateado a partir de los errores de validación
   * Incluye la sección y el código del campo SWIFT para facilitar identificación
   */
  formatValidationErrors(errors: ValidationError[]): string {
    const errorMessages = errors
      .filter(e => e.severity === 'error')
      .map(e => {
        const sectionPrefix = e.section ? `[${e.section}] ` : '';
        return `• ${sectionPrefix}::${e.field}:: ${e.message}`;
      })
      .join('\n');
    return errorMessages || 'Errores de validación desconocidos';
  }

  /**
   * Muestra errores de validación usando el centro de notificaciones
   * Agrupa errores por sección para mejor visualización
   */
  private showValidationErrors(errors: ValidationError[], action: 'submit' | 'approve'): void {
    const criticalErrors = errors.filter(e => e.severity === 'error');
    const actionText = action === 'submit' ? 'enviar a aprobación' : 'aprobar';

    // Formato: [SECTION] :49: Confirmation Instructions - Campo obligatorio
    const formatError = (e: ValidationError) => {
      const sectionPrefix = e.section ? `[${e.section}] ` : '';
      const fieldLabel = e.fieldName ? `::${e.field}:: ${e.fieldName}` : `::${e.field}::`;
      return `${sectionPrefix}${fieldLabel} - ${e.message}`;
    };

    if (criticalErrors.length === 1) {
      // Un solo error: mostrar completo
      const error = criticalErrors[0];
      notify.error(
        `No se puede ${actionText}`,
        formatError(error),
        10000
      );
    } else {
      // Agrupar errores por sección para mejor organización
      const errorsBySection = criticalErrors.reduce((acc, e) => {
        const section = e.section || 'GENERAL';
        if (!acc[section]) acc[section] = [];
        acc[section].push(e);
        return acc;
      }, {} as Record<string, ValidationError[]>);

      // Formatear errores agrupados por sección
      const errorList = Object.entries(errorsBySection)
        .map(([section, sectionErrors]) => {
          const sectionHeader = `── ${section} ──`;
          const errorItems = sectionErrors
            .map(e => {
              const fieldLabel = e.fieldName ? `::${e.field}:: ${e.fieldName}` : `::${e.field}::`;
              return `• ${fieldLabel} - ${e.message}`;
            })
            .join('\n');
          return `${sectionHeader}\n${errorItems}`;
        })
        .join('\n\n');

      notify.error(
        `No se puede ${actionText} - ${criticalErrors.length} errores de validación`,
        errorList,
        15000
      );
    }
  }

  /**
   * Create a new draft from SWIFT fields data
   *
   * @param messageType - The SWIFT message type (e.g., 'MT700')
   * @param productType - The product type (e.g., 'LC_IMPORT')
   * @param fieldsData - The SWIFT fields data (Record<string, any>)
   * @param fieldConfigs - Optional field configurations
   * @param createdBy - The user creating the draft
   * @param mode - Optional draft mode (EXPERT, CLIENT, WIZARD)
   * @param skipValidation - Skip validation (default: false)
   */
  async createDraftFromFields(
    messageType: string,
    productType: ProductType,
    fieldsData: Record<string, any>,
    fieldConfigs?: SwiftFieldConfig[],
    createdBy?: string,
    mode?: DraftMode,
    skipValidation: boolean = false,
    customData?: Record<string, any>
  ): Promise<SwiftDraft> {
    // Validar campos SWIFT antes de crear el draft (solo advertencias, no bloquea)
    if (!skipValidation) {
      const validationResult = await this.validateSwiftFields(messageType, fieldsData, fieldConfigs);
      if (!validationResult.isValid) {
        const warnings = validationResult.errors.filter(e => e.severity === 'warning');
        const errors = validationResult.errors.filter(e => e.severity === 'error');

        if (errors.length > 0) {
          console.warn('⚠️ Draft created with validation errors:', errors);
        }
        if (warnings.length > 0) {
          console.info('ℹ️ Draft created with warnings:', warnings);
        }
      }
    }

    // Build SWIFT message from fields
    const swiftMessage = buildSwiftMessage(fieldsData, fieldConfigs);

    // Extract metadata from fields (pass fieldConfigs to extract bank IDs)
    const metadata = extractMetadataFromFields(fieldsData, fieldConfigs);

    // Create command
    const command: CreateSwiftDraftCommand = {
      messageType,
      productType,
      swiftMessage,
      createdBy,
      mode,
      customData: customData ? JSON.stringify(customData) : undefined,
      ...metadata
    };

    return this.createDraft(command);
  }

  /**
   * Create a new draft with direct command
   */
  async createDraft(command: CreateSwiftDraftCommand): Promise<SwiftDraft> {
    try {
      const response = await post(this.baseUrl, command);
      const result: ApiResponse<SwiftDraft> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error creating draft');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error creating SWIFT draft:', error);
      throw error;
    }
  }

  /**
   * Update an existing draft from SWIFT fields data
   *
   * @param draftId - The draft ID to update
   * @param fieldsData - The SWIFT fields data
   * @param fieldConfigs - Optional field configurations
   * @param modifiedBy - The user modifying the draft
   */
  async updateDraftFromFields(
    draftId: string,
    fieldsData: Record<string, any>,
    fieldConfigs?: SwiftFieldConfig[],
    modifiedBy?: string,
    customData?: Record<string, any>
  ): Promise<SwiftDraft> {
    // Build SWIFT message from fields
    const swiftMessage = buildSwiftMessage(fieldsData, fieldConfigs);

    // Extract metadata from fields (pass fieldConfigs to extract bank IDs)
    const metadata = extractMetadataFromFields(fieldsData, fieldConfigs);

    // Create command
    const command: UpdateSwiftDraftCommand = {
      swiftMessage,
      modifiedBy,
      customData: customData ? JSON.stringify(customData) : undefined,
      ...metadata
    };

    return this.updateDraft(draftId, command);
  }

  /**
   * Update an existing draft with direct command
   */
  async updateDraft(draftId: string, command: UpdateSwiftDraftCommand): Promise<SwiftDraft> {
    try {
      const response = await put(`${this.baseUrl}/${draftId}`, command);
      const result: ApiResponse<SwiftDraft> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error updating draft');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error updating SWIFT draft:', error);
      throw error;
    }
  }

  /**
   * MÉTODO CENTRALIZADO: Crear o actualizar borrador y enviar para aprobación
   *
   * Este método debe ser usado por TODOS los formularios (Wizard, Expert, Client)
   * para garantizar que la validación se ejecute de forma consistente.
   *
   * @param messageType - Tipo de mensaje SWIFT (MT700, MT760, etc.)
   * @param productType - Tipo de producto (LC_IMPORT, LC_EXPORT, GUARANTEE, etc.)
   * @param fieldsData - Datos de campos SWIFT
   * @param fieldConfigs - Configuración de campos para validación
   * @param submittedBy - Usuario que envía
   * @param mode - Modo del formulario (WIZARD, EXPERT, CLIENT)
   * @param existingDraftId - ID del borrador existente (si es actualización)
   * @returns El borrador enviado para aprobación
   */
  async createAndSubmitForApproval(
    messageType: string,
    productType: ProductType,
    fieldsData: Record<string, any>,
    fieldConfigs: SwiftFieldConfig[],
    submittedBy: string,
    mode: DraftMode,
    existingDraftId?: string,
    customData?: Record<string, any>
  ): Promise<SwiftDraft> {
    // 1. Crear o actualizar el borrador
    let draft: SwiftDraft;
    if (existingDraftId) {
      draft = await this.updateDraftFromFields(
        existingDraftId,
        fieldsData,
        fieldConfigs,
        submittedBy,
        customData
      );
    } else {
      draft = await this.createDraftFromFields(
        messageType,
        productType,
        fieldsData,
        fieldConfigs,
        submittedBy,
        mode,
        true, // skipValidation en create, se valida al enviar
        customData
      );
    }

    // 2. Enviar para aprobación (esto ejecuta la validación automáticamente)
    // submitForApproval carga las configs y parsea el mensaje SWIFT del draft guardado
    try {
      const submittedDraft = await this.submitForApproval(
        draft.draftId,
        submittedBy
      );
      return submittedDraft;
    } catch (error) {
      // Attach draftId to validation errors so callers can track the created draft
      if (error instanceof SwiftValidationError) {
        throw new SwiftValidationError(
          error.message,
          error.errors,
          error.notificationShown,
          draft.draftId
        );
      }
      // For non-validation errors, attach draftId as a property
      if (error instanceof Error) {
        (error as any).draftId = draft.draftId;
      }
      throw error;
    }
  }

  /**
   * Get a draft by ID
   */
  async getDraftById(draftId: string): Promise<SwiftDraft> {
    try {
      const response = await get(`${this.baseUrl}/${draftId}`);
      const result: ApiResponse<SwiftDraft> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Draft not found');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error getting SWIFT draft:', error);
      throw error;
    }
  }

  /**
   * Get a draft and parse its SWIFT message to fields
   *
   * @param draftId - The draft ID
   * @param fieldConfigs - Optional field configurations for parsing
   * @returns Object with draft data and parsed fields
   */
  async getDraftWithFields(
    draftId: string,
    fieldConfigs?: SwiftFieldConfig[]
  ): Promise<{ draft: SwiftDraft; fields: Record<string, any> }> {
    const draft = await this.getDraftById(draftId);

    // Parse SWIFT message to fields
    const fields = parseSwiftMessage(draft.swiftMessage, fieldConfigs);

    // Enrich party fields with IDs from the draft metadata
    // This preserves the participantId when loading an existing draft
    if (draft.applicantId && fields[':50:']) {
      const currentValue = fields[':50:'];
      if (typeof currentValue === 'string') {
        // Convert string to SwiftPartyValue with participantId
        fields[':50:'] = {
          text: currentValue,
          participantId: draft.applicantId
        };
      } else if (typeof currentValue === 'object' && !currentValue.participantId) {
        // Add participantId to existing object
        currentValue.participantId = draft.applicantId;
      }
    }

    if (draft.beneficiaryId && fields[':59:']) {
      const currentValue = fields[':59:'];
      if (typeof currentValue === 'string') {
        // Convert string to SwiftPartyValue with participantId
        fields[':59:'] = {
          text: currentValue,
          participantId: draft.beneficiaryId
        };
      } else if (typeof currentValue === 'object' && !currentValue.participantId) {
        // Add participantId to existing object
        currentValue.participantId = draft.beneficiaryId;
      }
    }

    return { draft, fields };
  }

  /**
   * Get all drafts
   */
  async getAllDrafts(): Promise<SwiftDraft[]> {
    try {
      const response = await get(this.baseUrl);
      const result: ApiResponse<SwiftDraft[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error getting drafts');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error getting SWIFT drafts:', error);
      throw error;
    }
  }

  /**
   * Get drafts by product type
   */
  async getDraftsByProductType(productType: ProductType): Promise<SwiftDraft[]> {
    try {
      const response = await get(`${this.baseUrl}/by-product/${productType}`);
      const result: ApiResponse<SwiftDraft[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error getting drafts');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error getting SWIFT drafts:', error);
      throw error;
    }
  }

  /**
   * Get drafts by message type
   */
  async getDraftsByMessageType(messageType: string): Promise<SwiftDraft[]> {
    try {
      const response = await get(`${this.baseUrl}/by-message/${messageType}`);
      const result: ApiResponse<SwiftDraft[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error getting drafts');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error getting SWIFT drafts:', error);
      throw error;
    }
  }

  /**
   * Search drafts with filters
   */
  async searchDrafts(filters: {
    productType?: ProductType;
    messageType?: string;
    status?: DraftStatus;
    createdBy?: string;
    reference?: string;
  }): Promise<SwiftDraft[]> {
    try {
      const params = new URLSearchParams();
      if (filters.productType) params.append('productType', filters.productType);
      if (filters.messageType) params.append('messageType', filters.messageType);
      if (filters.status) params.append('status', filters.status);
      if (filters.createdBy) params.append('createdBy', filters.createdBy);
      if (filters.reference) params.append('reference', filters.reference);

      const url = params.toString()
        ? `${this.baseUrl}?${params.toString()}`
        : this.baseUrl;

      const response = await get(url);
      const result: ApiResponse<SwiftDraft[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error searching drafts');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error searching SWIFT drafts:', error);
      throw error;
    }
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    try {
      const response = await del(`${this.baseUrl}/${draftId}`);
      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error deleting draft');
      }
    } catch (error) {
      console.error('❌ Error deleting SWIFT draft:', error);
      throw error;
    }
  }

  /**
   * Submit a draft for approval
   * Validates SWIFT fields before submission - blocks if there are errors
   *
   * @param draftId - The draft ID
   * @param submittedBy - The user submitting the draft
   * @param skipValidation - Skip validation (default: false, not recommended)
   */
  async submitForApproval(draftId: string, submittedBy?: string, skipValidation: boolean = false): Promise<SwiftDraft> {
    try {
      // Obtener el draft para validar
      if (!skipValidation) {
        const draft = await this.getDraftById(draftId);

        // Cargar configuraciones y parsear mensaje SWIFT
        const configs = await swiftFieldConfigService.getAll(draft.messageType, true);
        const fieldsData = parseSwiftMessage(draft.swiftMessage, configs);

        // Validar campos
        const validationResult = await this.validateSwiftFields(draft.messageType, fieldsData, configs);

        // Bloquear si hay errores críticos
        const criticalErrors = validationResult.errors.filter(e => e.severity === 'error');
        if (criticalErrors.length > 0) {
          // Mostrar notificación con el centro de notificaciones
          this.showValidationErrors(validationResult.errors, 'submit');
          // Lanzar error personalizado indicando que la notificación ya se mostró
          throw new SwiftValidationError(
            'Errores de validación SWIFT',
            criticalErrors,
            true // notificación ya mostrada
          );
        }

        // Loguear advertencias pero no bloquear
        const warnings = validationResult.errors.filter(e => e.severity === 'warning');
        if (warnings.length > 0) {
          console.warn('⚠️ Draft submitted with warnings:', warnings.map(w => w.message));
          // Mostrar advertencias como notificación warning
          warnings.forEach(w => {
            const sectionPrefix = w.section ? `[${w.section}] ` : '';
            const fieldLabel = w.fieldName ? `::${w.field}:: ${w.fieldName}` : `::${w.field}::`;
            notify.warning('Advertencia SWIFT', `${sectionPrefix}${fieldLabel} - ${w.message}`, 8000);
          });
        }
      }

      const url = submittedBy
        ? `${this.baseUrl}/${draftId}/submit?submittedBy=${encodeURIComponent(submittedBy)}`
        : `${this.baseUrl}/${draftId}/submit`;

      const response = await post(url, {});
      const result: ApiResponse<SwiftDraft> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error submitting draft');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error submitting SWIFT draft:', error);
      throw error;
    }
  }

  /**
   * Approve a draft
   * Validates SWIFT fields before approval - blocks if there are errors
   *
   * @param draftId - The draft ID
   * @param approvedBy - The user approving the draft
   * @param skipValidation - Skip validation (default: false, not recommended)
   */
  async approveDraft(draftId: string, approvedBy?: string, skipValidation: boolean = false): Promise<SwiftDraft> {
    try {
      // Validar antes de aprobar
      if (!skipValidation) {
        const draft = await this.getDraftById(draftId);

        // Cargar configuraciones y parsear mensaje SWIFT
        const configs = await swiftFieldConfigService.getAll(draft.messageType, true);
        const fieldsData = parseSwiftMessage(draft.swiftMessage, configs);

        // Validar campos
        const validationResult = await this.validateSwiftFields(draft.messageType, fieldsData, configs);

        // Bloquear si hay errores críticos
        const criticalErrors = validationResult.errors.filter(e => e.severity === 'error');
        if (criticalErrors.length > 0) {
          // Mostrar notificación con el centro de notificaciones
          this.showValidationErrors(validationResult.errors, 'approve');
          // Lanzar error personalizado indicando que la notificación ya se mostró
          throw new SwiftValidationError(
            'Errores de validación SWIFT',
            criticalErrors,
            true // notificación ya mostrada
          );
        }

        // Loguear advertencias pero no bloquear
        const warnings = validationResult.errors.filter(e => e.severity === 'warning');
        if (warnings.length > 0) {
          console.warn('⚠️ Draft approved with warnings:', warnings.map(w => w.message));
          // Mostrar advertencias como notificación warning
          warnings.forEach(w => {
            const sectionPrefix = w.section ? `[${w.section}] ` : '';
            const fieldLabel = w.fieldName ? `::${w.field}:: ${w.fieldName}` : `::${w.field}::`;
            notify.warning('Advertencia SWIFT', `${sectionPrefix}${fieldLabel} - ${w.message}`, 8000);
          });
        }
      }

      const url = approvedBy
        ? `${this.baseUrl}/${draftId}/approve?approvedBy=${encodeURIComponent(approvedBy)}`
        : `${this.baseUrl}/${draftId}/approve`;

      const response = await post(url, {});
      const result: ApiResponse<SwiftDraft> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error approving draft');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error approving SWIFT draft:', error);
      throw error;
    }
  }

  /**
   * Reject a draft
   */
  async rejectDraft(
    draftId: string,
    rejectedBy?: string,
    reason?: string,
    fieldComments?: Record<string, { comment: string }>
  ): Promise<SwiftDraft> {
    try {
      const url = `${this.baseUrl}/${draftId}/reject`;
      const body: Record<string, unknown> = {};
      if (rejectedBy) body.rejectedBy = rejectedBy;
      if (reason) body.reason = reason;
      if (fieldComments && Object.keys(fieldComments).length > 0) body.fieldComments = fieldComments;

      const response = await post(url, body);
      const result: ApiResponse<SwiftDraft> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error rejecting draft');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error rejecting SWIFT draft:', error);
      throw error;
    }
  }

  /**
   * Get draft history (events)
   */
  async getDraftHistory(draftId: string): Promise<DraftHistoryItem[]> {
    try {
      const response = await get(`${this.baseUrl}/${draftId}/history`);
      const result: ApiResponse<DraftHistoryItem[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error getting draft history');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error getting SWIFT draft history:', error);
      throw error;
    }
  }
}

export const swiftDraftService = new SwiftDraftService();
