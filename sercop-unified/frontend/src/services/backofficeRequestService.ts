/**
 * Backoffice Request Service
 * Service for internal bank users to process client portal requests
 */

import { get, post } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import type { ClientRequest, PageResponse, BackofficeStats, SearchParams } from './clientPortalTypes';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface DocumentInfo {
  documentId: string;
  originalFileName: string;
  storedFileName?: string;
  mimeType: string;
  fileSize: number;
  formattedFileSize?: string;
  categoryCode?: string;
  documentTypeCode?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  downloadUrl?: string;
  previewUrl?: string;
  viewCount?: number;
  downloadCount?: number;
}

class BackofficeRequestService {
  private baseUrl = `${API_BASE_URL}/backoffice/client-requests`;

  /**
   * List all client requests with filters (paginated)
   */
  async listRequests(params: SearchParams = {}): Promise<PageResponse<ClientRequest>> {
    try {
      const searchParams = new URLSearchParams();

      if (params.clientId) searchParams.append('clientId', params.clientId);
      if (params.productType) searchParams.append('productType', params.productType);
      if (params.status) searchParams.append('status', params.status);
      if (params.assignedToUserId) searchParams.append('assignedToUserId', params.assignedToUserId);
      if (params.internalProcessingStage) searchParams.append('internalProcessingStage', params.internalProcessingStage);
      if (params.search) searchParams.append('search', params.search);
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.size !== undefined) searchParams.append('size', params.size.toString());
      if (params.sort) searchParams.append('sort', params.sort);

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      const response = await get(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener solicitudes');
      }

      return response.json();
    } catch (error) {
      console.error('Error listing requests:', error);
      throw error;
    }
  }

  /**
   * Get a specific request by ID
   */
  async getRequest(id: string): Promise<ClientRequest> {
    try {
      const response = await get(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Solicitud no encontrada');
      }

      return response.json();
    } catch (error) {
      console.error('Error getting request:', error);
      throw error;
    }
  }

  /**
   * Assign a request to a processor
   */
  async assignRequest(id: string, assigneeId: string, assigneeName: string): Promise<ClientRequest> {
    try {
      const response = await post(`${this.baseUrl}/${id}/assign`, {
        assigneeId,
        assigneeName,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al asignar solicitud');
      }

      return response.json();
    } catch (error) {
      console.error('Error assigning request:', error);
      throw error;
    }
  }

  /**
   * Request additional documents from client
   */
  async requestDocuments(id: string, details: string): Promise<ClientRequest> {
    try {
      const response = await post(`${this.baseUrl}/${id}/request-documents`, {
        details,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al solicitar documentos');
      }

      return response.json();
    } catch (error) {
      console.error('Error requesting documents:', error);
      throw error;
    }
  }

  /**
   * Approve a request
   */
  async approveRequest(id: string, userId?: string, userName?: string): Promise<ClientRequest> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(`${this.baseUrl}/${id}/approve`, {}, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al aprobar solicitud');
      }

      return response.json();
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  /**
   * Reject a request
   */
  async rejectRequest(id: string, reason: string, userId?: string, userName?: string): Promise<ClientRequest> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(`${this.baseUrl}/${id}/reject`, { reason }, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al rechazar solicitud');
      }

      return response.json();
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  /**
   * Get backoffice statistics
   */
  async getStatistics(): Promise<BackofficeStats> {
    try {
      const response = await get(`${this.baseUrl}/stats`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener estadísticas');
      }

      return response.json();
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Get pending requests count
   */
  async getPendingCount(): Promise<number> {
    try {
      const response = await get(`${this.baseUrl}/stats/pending`);

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Get my assigned requests count
   */
  async getMyAssignedCount(): Promise<number> {
    try {
      const response = await get(`${this.baseUrl}/stats/my-assigned`);

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error getting my assigned count:', error);
      return 0;
    }
  }

  /**
   * Get documents associated with a request
   */
  async getRequestDocuments(id: string): Promise<DocumentInfo[]> {
    try {
      const response = await get(`${this.baseUrl}/${id}/documents`);

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch (error) {
      console.error('Error getting request documents:', error);
      return [];
    }
  }

  /**
   * Get workflow configuration for a request
   */
  async getWorkflowConfig(id: string, language: string = 'es'): Promise<WorkflowConfig | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/workflow-config?language=${language}`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting workflow config:', error);
      return null;
    }
  }

  /**
   * Get status flow/history for a request
   */
  async getStatusFlow(id: string): Promise<StatusFlowResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/status-flow`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting status flow:', error);
      return null;
    }
  }

  // ==================== Internal Processing Methods ====================

  /**
   * Get internal processing workflow configuration
   */
  async getInternalProcessingConfig(id: string, language: string = 'es'): Promise<InternalProcessingConfig | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/internal-processing-config?language=${language}`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting internal processing config:', error);
      return null;
    }
  }

  /**
   * Get internal processing status/history
   */
  async getInternalProcessingStatus(id: string, language: string = 'es'): Promise<InternalProcessingStatus | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/internal-processing-status?language=${language}`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting internal processing status:', error);
      return null;
    }
  }

  /**
   * Execute an internal processing transition
   */
  async executeInternalProcessingTransition(
    id: string,
    eventCode: string,
    comments?: string,
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; request?: ClientRequest; newStage?: string; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(
        `${this.baseUrl}/${id}/internal-processing/transition`,
        { eventCode, comments },
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Error al ejecutar transición' };
      }

      return response.json();
    } catch (error) {
      console.error('Error executing internal processing transition:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // ==================== WorkboxDrafts Integration Methods ====================

  /**
   * Get client requests pending registration (in REGISTRO stage)
   */
  async getPendingRegistration(productType?: string): Promise<ClientRequest[]> {
    try {
      const params = productType ? `?productType=${productType}` : '';
      const response = await get(`${this.baseUrl}/pending-registration${params}`);

      if (!response.ok) {
        console.error('Error fetching pending registration requests');
        return [];
      }

      return response.json();
    } catch (error) {
      console.error('Error getting pending registration requests:', error);
      return [];
    }
  }

  /**
   * Get mapped data for creating an operation from a client request
   */
  async getMappedDataForOperation(id: string): Promise<MappedDataResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/mapped-data`);

      if (!response.ok) {
        const error = await response.json();
        console.error('Error getting mapped data:', error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting mapped data:', error);
      return null;
    }
  }

  /**
   * Get form data from the SWIFT draft associated with a client request
   */
  async getFormDataFromDraft(id: string): Promise<FormDataFromDraftResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/form-data`);

      if (!response.ok) {
        const error = await response.json();
        console.error('Error getting form data from draft:', error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting form data from draft:', error);
      return null;
    }
  }

  /**
   * Get a client request by operation reference
   */
  async getByOperationReference(operationReference: string): Promise<ClientRequest | null> {
    try {
      const response = await get(`${this.baseUrl}/by-operation-reference/${operationReference}`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting request by operation reference:', error);
      return null;
    }
  }

  /**
   * Get documents associated with a client request by operation reference
   */
  async getDocumentsByOperationReference(operationReference: string): Promise<DocumentInfo[]> {
    try {
      const response = await get(`${this.baseUrl}/by-operation-reference/${operationReference}/documents`);

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch (error) {
      console.error('Error getting documents by operation reference:', error);
      return [];
    }
  }

  /**
   * Link a created operation to the client request
   */
  async linkOperation(
    id: string,
    operationId: string,
    operationReference: string,
    userId?: string,
    userName?: string
  ): Promise<ClientRequest | null> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(
        `${this.baseUrl}/${id}/link-operation`,
        { operationId, operationReference },
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error linking operation:', error);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error linking operation:', error);
      return null;
    }
  }

  // ==================== Workflow Validation & Approval Methods ====================

  /**
   * Get user permissions for a specific request
   */
  async getUserPermissions(id: string): Promise<UserPermissionsResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/permissions`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return null;
    }
  }

  /**
   * Get validation results for a request (Core Banking validations)
   */
  async getValidationResults(id: string): Promise<ValidationResultsResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/validations`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting validation results:', error);
      return null;
    }
  }

  /**
   * Get compliance/screening results for a request
   */
  async getComplianceResults(id: string): Promise<ComplianceResultsResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/compliance`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting compliance results:', error);
      return null;
    }
  }

  /**
   * Get retry preview for a validation check.
   * Returns the data that will be sent to the external API, allowing user to edit values.
   */
  async getRetryPreview(id: string, checkCode: string): Promise<RetryPreviewResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/validations/${checkCode}/retry-preview`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error getting retry preview:', error);
      return null;
    }
  }

  /**
   * Get retry preview for a compliance screening.
   */
  async getComplianceRetryPreview(id: string, screeningCode: string): Promise<RetryPreviewResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/compliance/${screeningCode}/retry-preview`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error getting compliance retry preview:', error);
      return null;
    }
  }

  /**
   * Retry a specific validation check for a request
   */
  async retryValidation(id: string, checkCode: string, contextOverrides?: Record<string, unknown>): Promise<{ success: boolean; validation?: ValidationResult; error?: string }> {
    try {
      const body = contextOverrides && Object.keys(contextOverrides).length > 0
        ? { contextOverrides }
        : {};
      const response = await post(`${this.baseUrl}/${id}/validations/${checkCode}/retry`, body);
      return response.json();
    } catch (error) {
      console.error('Error retrying validation:', error);
      return { success: false, error: 'Error al reintentar validación' };
    }
  }

  /**
   * Skip a validation check with documented reason
   */
  async skipValidation(id: string, checkCode: string, reason: string, userId?: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(
        `${this.baseUrl}/${id}/validations/${checkCode}/skip`,
        { reason },
        { headers }
      );
      return response.json();
    } catch (error) {
      console.error('Error skipping validation:', error);
      return { success: false, error: 'Error al saltar validación' };
    }
  }

  /**
   * Retry a specific compliance screening for a request
   */
  async retryCompliance(id: string, screeningCode: string, contextOverrides?: Record<string, unknown>): Promise<{ success: boolean; screening?: ComplianceResult; error?: string }> {
    try {
      const body = contextOverrides && Object.keys(contextOverrides).length > 0
        ? { contextOverrides }
        : {};
      const response = await post(`${this.baseUrl}/${id}/compliance/${screeningCode}/retry`, body);
      return response.json();
    } catch (error) {
      console.error('Error retrying compliance screening:', error);
      return { success: false, error: 'Error al reintentar screening' };
    }
  }

  /**
   * Skip a compliance screening with documented reason
   */
  async skipCompliance(id: string, screeningCode: string, reason: string, userId?: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(
        `${this.baseUrl}/${id}/compliance/${screeningCode}/skip`,
        { reason },
        { headers }
      );
      return response.json();
    } catch (error) {
      console.error('Error skipping compliance screening:', error);
      return { success: false, error: 'Error al saltar screening' };
    }
  }

  /**
   * Get API call history for a specific validation/compliance check.
   * Returns all attempts (retries, skips) from the external API call log.
   */
  async getApiCallHistory(id: string, apiConfigCode: string): Promise<ApiCallHistoryResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/api-call-logs/${apiConfigCode}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error getting API call history:', error);
      return null;
    }
  }

  /**
   * Get approval chain status for a request
   */
  async getApprovalChainStatus(id: string): Promise<ApprovalChainStatusResponse | null> {
    try {
      const response = await get(`${this.baseUrl}/${id}/approval-chain`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting approval chain status:', error);
      return null;
    }
  }

  /**
   * Process approval in the multi-level approval chain
   */
  async processApprovalChainApproval(
    id: string,
    comments?: string,
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; request?: ClientRequest; chainStatus?: ApprovalChainStatusResponse; message?: string; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(
        `${this.baseUrl}/${id}/approval-chain/approve`,
        { comments },
        { headers }
      );

      return response.json();
    } catch (error) {
      console.error('Error processing approval:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Process rejection in the multi-level approval chain
   */
  async processApprovalChainRejection(
    id: string,
    comments: string,
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; request?: ClientRequest; message?: string; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(
        `${this.baseUrl}/${id}/approval-chain/reject`,
        { comments },
        { headers }
      );

      return response.json();
    } catch (error) {
      console.error('Error processing rejection:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Execute internal processing transition with role verification (v2)
   */
  async executeInternalProcessingTransitionV2(
    id: string,
    eventCode: string,
    comments?: string,
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; request?: ClientRequest; newStage?: string; approvalChainStatus?: ApprovalChainStatusResponse; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['X-User-Id'] = userId;
      if (userName) headers['X-User-Name'] = userName;

      const response = await post(
        `${this.baseUrl}/${id}/internal-processing/transition-v2`,
        { eventCode, comments },
        { headers }
      );

      return response.json();
    } catch (error) {
      console.error('Error executing internal processing transition:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Get pending approvals for current user
   */
  async getPendingApprovalsForUser(): Promise<PendingApprovalItem[]> {
    try {
      const response = await get(`${this.baseUrl}/pending-approvals`);

      if (!response.ok) {
        return [];
      }

      return response.json();
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  }

  /**
   * Get request counts grouped by internal processing stage
   */
  async getStageCounts(): Promise<Record<string, number>> {
    try {
      const response = await get(`${this.baseUrl}/stats/stage-counts`);

      if (!response.ok) {
        return {};
      }

      return response.json();
    } catch (error) {
      console.error('Error getting stage counts:', error);
      return {};
    }
  }

  /**
   * Get stage role configuration
   */
  async getStageConfig(stageCode: string): Promise<{ stageCode: string; roleAssignments: unknown[]; requiresApproval: boolean } | null> {
    try {
      const response = await get(`${this.baseUrl}/stage-config/${stageCode}`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting stage config:', error);
      return null;
    }
  }
}

// Workflow configuration types
export interface EventTypeConfig {
  id: string;
  eventCode: string;
  operationType: string;
  language: string;
  eventName: string;
  eventDescription?: string;
  helpText?: string;
  outboundMessageType?: string;
  inboundMessageType?: string;
  validFromStages?: string;
  validFromStatuses?: string;
  resultingStage?: string;
  resultingStatus?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  requiresApproval: boolean;
  isReversible?: boolean;
}

export interface EventFlowConfig {
  id: string;
  operationType: string;
  fromEventCode?: string;
  fromStage?: string;
  toEventCode: string;
  toEventName?: string;
  toEventDescription?: string;
  toEventHelpText?: string;
  toEventIcon?: string;
  toEventColor?: string;
  conditions?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  sequenceOrder: number;
  language: string;
  transitionLabel?: string;
  transitionHelp?: string;
  isActive: boolean;
}

export interface WorkflowConfig {
  productType: string;
  operationType: string;
  eventTypes: EventTypeConfig[];
  flows: EventFlowConfig[];
  initialEvents: EventFlowConfig[];
}

export interface StatusEvent {
  status: string;
  label: string;
  timestamp: string;
  actor?: string;
  icon: string;
  color?: string;
}

export interface StatusTransition {
  action: string;
  targetStatus: string;
  label: string;
}

export interface StatusFlowResponse {
  requestId: string;
  requestNumber: string;
  currentStatus: string;
  currentStatusColor?: string;
  statusDetail?: string;
  statusHistory: StatusEvent[];
  operationId?: string;
  operationReference?: string;
  availableTransitions: StatusTransition[];
  statusColors?: Record<string, string>;
  productType?: string;
  productTypeLabel?: string;
}

// Internal Processing Types
export interface InternalProcessingStep {
  eventCode: string;
  eventName: string;
  eventDescription?: string;
  helpText?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  resultingStage?: string;
  resultingStatus?: string;
}

export interface InternalProcessingConfig {
  requestId: string;
  requestNumber: string;
  operationType: string;
  steps: InternalProcessingStep[];
  allEventTypes: InternalProcessingStep[];
  flows: EventFlowConfig[];
  initialEvents: EventFlowConfig[];
  currentStage?: string;
  processingStartedAt?: string;
}

export interface InternalProcessingHistoryEntry {
  id: string;
  eventCode: string;
  fromStage?: string;
  toStage: string;
  executedBy: string;
  executedByName?: string;
  comments?: string;
  executionTimeMs?: number;
  createdAt: string;
  // Enriched from event types
  eventName?: string;
  eventDescription?: string;
  icon?: string;
  color?: string;
}

export interface InternalProcessingTransition {
  eventCode: string;
  label: string;
  help?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  targetStage?: string;
  icon?: string;
  color?: string;
}

export interface InternalProcessingStatus {
  requestId: string;
  requestNumber: string;
  currentStage?: string;
  processingStartedAt?: string;
  history: InternalProcessingHistoryEntry[];
  availableTransitions: InternalProcessingTransition[];
  isCompleted: boolean;
  isRejected: boolean;
}

// Mapped Data Types for Operation Creation
export interface MappedDataResponse {
  success: boolean;
  requestId: string;
  requestNumber: string;
  sourceProductType: string;
  targetProductType: string;
  sourceData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  clientInfo: {
    clientId: string;
    clientName: string;
    clientIdentification?: string;
  };
  error?: string;
}

// Form Data from Draft Response
export interface FormDataFromDraftResponse {
  requestId: string;
  requestNumber: string;
  draftId: string | null;
  formData: Record<string, unknown>;
  hasDraft: boolean;
  clientInfo: {
    clientId: string;
    clientName: string;
    clientIdentification?: string;
  };
}

// Retry Preview Response
export interface RetryPreviewResponse {
  apiConfigCode: string;
  apiName: string;
  httpMethod: string;
  resolvedUrl: string;
  bodyTemplate: string | null;
  contextData: Record<string, unknown>;
  fieldLabels: Record<string, string>;
}

// Validation Result
export interface ValidationResult {
  checkCode: string;
  checkName: string;
  passed: boolean;
  message?: string;
  status: 'PENDING' | 'PASSED' | 'FAILED';
  executedAt?: string;
  executionTimeMs?: number;
  responseData?: string;
}

// Compliance/Screening Result
export interface ComplianceResult {
  screeningCode: string;
  screeningName: string;
  completed: boolean;
  hasMatch: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  status: 'PENDING' | 'CLEAR' | 'MATCH' | 'ERROR';
  matchDetails?: string;
  executedAt?: string;
  executionTimeMs?: number;
  responseData?: string;
}

// Approval Chain Entry
export interface ApprovalChainEntry {
  id: number;
  requestId: string;
  stageCode: string;
  approvalLevel: number;
  requiredRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  comments?: string;
  createdAt: string;
}

// Approval Chain Status Response
export interface ApprovalChainStatusResponse {
  requestId: string;
  stageCode: string;
  approvals: ApprovalChainEntry[];
  allComplete: boolean;
  hasRejection: boolean;
  currentPendingLevel?: number;
  canUserApproveNow: boolean;
  userRoles: string[];
  currentStage?: string;
}

// Validation Results Response
export interface ValidationResultsResponse {
  requestId: string;
  validations: ValidationResult[];
  totalCount: number;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
  allPassed: boolean;
  allExecuted: boolean;
  currentStage?: string;
}

// Compliance Results Response
export interface ComplianceResultsResponse {
  requestId: string;
  screenings: ComplianceResult[];
  totalCount: number;
  clearCount: number;
  matchCount: number;
  pendingCount: number;
  errorCount: number;
  allExecuted: boolean;
  hasMatches: boolean;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  currentStage?: string;
}

// User Permissions Response
export interface UserPermissionsResponse {
  requestId: string;
  permissions: {
    canView: boolean;
    canExecute: boolean;
    canApprove: boolean;
    canReject: boolean;
    canReturn: boolean;
    canApproveNow?: boolean;
  };
  userRoles: string[];
}

// API Call History
export interface ApiCallLogEntry {
  id: number;
  apiConfigCode: string;
  requestMethod: string;
  requestUrl: string;
  responseStatusCode: number;
  executionTimeMs: number;
  attemptNumber: number;
  success: boolean;
  errorMessage?: string;
  correlationId: string;
  eventType: string;
  triggeredBy: string;
  createdAt: string;
  responseBody?: string;
  skipped: boolean;
  skipReason?: string;
  skippedByName?: string;
}

export interface ApiCallHistoryResponse {
  requestId: string;
  apiConfigCode: string;
  entries: ApiCallLogEntry[];
  totalEntries: number;
}

// Pending Approval Item
export interface PendingApprovalItem {
  approvalId: number;
  requestId: string;
  stageCode: string;
  approvalLevel: number;
  requiredRole: string;
  pendingSince: string;
  requestNumber?: string;
  clientName?: string;
  productType?: string;
  amount?: number;
  currency?: string;
}

export const backofficeRequestService = new BackofficeRequestService();
export default backofficeRequestService;
