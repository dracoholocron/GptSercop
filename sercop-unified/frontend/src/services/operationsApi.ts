/**
 * API Service for Operations and SWIFT Messages
 */

import type {
  Operation,
  SwiftMessage,
  OperationEventLog,
  EventTypeConfig,
  EventFlowConfig,
  SwiftResponseConfig,
  ApproveOperationCommand,
  ExecuteEventCommand,
  SendSwiftMessageCommand,
  ReceiveSwiftMessageCommand,
  EventTypeConfigCommand,
  EventFlowConfigCommand,
  SwiftResponseConfigCommand,
  EventAlertTemplate,
  OperationFilter,
  FieldHistoryItem,
  SwiftMessageFilter,
  ProductType,
  OperationAlert,
  OperationAnalysisSummary,
} from '../types/operations';
import { API_BASE_URL_WITH_PREFIX, TOKEN_STORAGE_KEY } from '../config/api.config';
import { attemptTokenRefresh } from '../utils/tokenRefresh';
import {
  OPERATIONS_ROUTES,
  SWIFT_MESSAGES_ROUTES,
  EVENT_CONFIG_ROUTES,
  EVENT_LOG_ROUTES,
  buildUrlWithParams,
} from '../config/api.routes';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper to create authenticated headers
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Helper for authenticated fetch requests
 */
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  // Handle 401: attempt token refresh before redirecting
  if (response.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers },
      });
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.location.href = '/login';
  }

  return response;
};

// ==================== Operation Queries ====================

export const operationsApi = {
  // Get operation by ID
  async getByOperationId(operationId: string): Promise<Operation | null> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.BY_ID(operationId)}`);
    if (response.status === 404) return null;
    const result: ApiResponse<Operation> = await response.json();
    return result.data || null;
  },

  // Get operations with filters
  async getOperations(filters?: OperationFilter): Promise<Operation[]> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.BASE, filters || {});
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (!response.ok) return [];
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Get operations by product type
  // Always include closed operations - frontend handles filtering
  async getByProductType(productType: ProductType): Promise<Operation[]> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.BY_PRODUCT_TYPE(productType), { includeClosed: true });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Get operations awaiting response
  async getAwaitingResponse(productType?: ProductType): Promise<Operation[]> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.AWAITING_RESPONSE, productType ? { productType } : {});
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Get overdue responses
  async getOverdueResponses(): Promise<Operation[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.OVERDUE_RESPONSES}`);
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Get expiring soon
  async getExpiringSoon(days: number = 30): Promise<Operation[]> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.EXPIRING_SOON, { days });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (!response.ok) return [];
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Search by reference (uses base operations endpoint with reference filter)
  async searchByReference(reference: string): Promise<Operation[]> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.BASE, { reference });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (!response.ok) return [];
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Search by operationId as query param (not path param which 404s)
  async searchByOperationId(operationId: string): Promise<Operation[]> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.BASE, { operationId });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (!response.ok) return [];
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Count by product type
  async countByProductType(productType: ProductType): Promise<number> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.COUNT_BY_PRODUCT(productType)}`);
    if (!response.ok) return 0;
    const result: ApiResponse<number> = await response.json();
    return result.data || 0;
  },

  // Count awaiting response
  async countAwaitingResponse(): Promise<number> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.COUNT_AWAITING_RESPONSE}`);
    if (!response.ok) return 0;
    const result: ApiResponse<number> = await response.json();
    return result.data || 0;
  },

  // Get operations with alerts
  async getWithAlerts(productType?: ProductType): Promise<Operation[]> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.WITH_ALERTS, productType ? { productType } : {});
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<Operation[]> = await response.json();
    return result.data || [];
  },

  // Get historical values for a SWIFT field (efficient backend query)
  async getFieldHistory(fieldCode: string, messageType: string, applicantId?: number, limit?: number): Promise<FieldHistoryItem[]> {
    const params: Record<string, any> = { fieldCode, messageType };
    if (applicantId) params.applicantId = applicantId;
    if (limit) params.limit = limit;
    const url = buildUrlWithParams(`${OPERATIONS_ROUTES.BASE}/field-history`, params);
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (!response.ok) return [];
    const result: ApiResponse<FieldHistoryItem[]> = await response.json();
    return result.data || [];
  },

  // Count operations with alerts
  async countWithAlerts(productType?: ProductType): Promise<number> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.COUNT_WITH_ALERTS, productType ? { productType } : {});
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (!response.ok) return 0;
    const result: ApiResponse<number> = await response.json();
    return result.data || 0;
  },

  // Get operation summary (analysis with alerts)
  async getOperationSummary(operationId: string): Promise<OperationAnalysisSummary | null> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.SUMMARY(operationId)}`);
    if (response.status === 404) return null;
    const result: ApiResponse<OperationAnalysisSummary> = await response.json();
    return result.data || null;
  },

  // Get operation alerts
  async getOperationAlerts(operationId: string): Promise<OperationAlert[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.ALERTS(operationId)}`);
    const result: ApiResponse<OperationAlert[]> = await response.json();
    return result.data || [];
  },

  // Refresh operation summary
  async refreshOperationSummary(operationId: string): Promise<OperationAnalysisSummary> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.SUMMARY_REFRESH(operationId)}`, {
      method: 'POST',
    });
    const result: ApiResponse<OperationAnalysisSummary> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },
};

// ==================== Operation Commands ====================

export const operationCommands = {
  // Approve draft and create operation
  async approveDraft(command: ApproveOperationCommand): Promise<Operation> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.APPROVE}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<Operation> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  // Execute event on operation
  async executeEvent(operationId: string, command: Omit<ExecuteEventCommand, 'operationId'>): Promise<Operation> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${OPERATIONS_ROUTES.EXECUTE_EVENT(operationId)}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<Operation> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  // Mark response received
  async markResponseReceived(operationId: string, responseMessageType: string): Promise<void> {
    const url = buildUrlWithParams(OPERATIONS_ROUTES.RESPONSE_RECEIVED(operationId), { responseMessageType });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`, { method: 'POST' });
    const result: ApiResponse<void> = await response.json();
    if (!result.success) throw new Error(result.error);
  },
};

// ==================== SWIFT Message Queries ====================

export const swiftMessagesApi = {
  // Get message by ID
  async getByMessageId(messageId: string): Promise<SwiftMessage | null> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.BY_ID(messageId)}`);
    if (response.status === 404) return null;
    const result: ApiResponse<SwiftMessage> = await response.json();
    return result.data || null;
  },

  // Get messages with filters
  async getMessages(filters?: SwiftMessageFilter): Promise<SwiftMessage[]> {
    const url = buildUrlWithParams(SWIFT_MESSAGES_ROUTES.BASE, filters || {});
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<SwiftMessage[]> = await response.json();
    return result.data || [];
  },

  // Get messages by operation
  async getByOperationId(operationId: string): Promise<SwiftMessage[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.BY_OPERATION(operationId)}`);
    const result: ApiResponse<SwiftMessage[]> = await response.json();
    return result.data || [];
  },

  // Get pending responses
  async getPendingResponses(): Promise<SwiftMessage[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.PENDING_RESPONSES}`);
    const result: ApiResponse<SwiftMessage[]> = await response.json();
    return result.data || [];
  },

  // Get overdue responses
  async getOverdueResponses(): Promise<SwiftMessage[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.OVERDUE_RESPONSES}`);
    const result: ApiResponse<SwiftMessage[]> = await response.json();
    return result.data || [];
  },

  // Get pending ACK
  async getPendingAck(): Promise<SwiftMessage[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.PENDING_ACK}`);
    const result: ApiResponse<SwiftMessage[]> = await response.json();
    return result.data || [];
  },

  // Count by direction
  async countByDirection(direction: 'OUTBOUND' | 'INBOUND'): Promise<number> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.COUNT_BY_DIRECTION(direction)}`);
    const result: ApiResponse<number> = await response.json();
    return result.data || 0;
  },

  // Count pending responses
  async countPendingResponses(): Promise<number> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.COUNT_PENDING_RESPONSES}`);
    const result: ApiResponse<number> = await response.json();
    return result.data || 0;
  },

  // Search by text (searches in content, references, BICs)
  async searchByText(text: string): Promise<SwiftMessage[]> {
    const url = buildUrlWithParams(SWIFT_MESSAGES_ROUTES.SEARCH, { text });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<SwiftMessage[]> = await response.json();
    return result.data || [];
  },

  // Search by content only
  async searchByContent(text: string): Promise<SwiftMessage[]> {
    const url = buildUrlWithParams(SWIFT_MESSAGES_ROUTES.SEARCH_CONTENT, { text });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<SwiftMessage[]> = await response.json();
    return result.data || [];
  },
};

// ==================== SWIFT Message Commands ====================

export const swiftMessageCommands = {
  // Send message
  async sendMessage(command: SendSwiftMessageCommand): Promise<SwiftMessage> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.SEND}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<SwiftMessage> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  // Receive message
  async receiveMessage(command: ReceiveSwiftMessageCommand): Promise<SwiftMessage> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.RECEIVE}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<SwiftMessage> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  // Record ACK
  async recordAck(messageId: string, ackContent?: string): Promise<void> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${SWIFT_MESSAGES_ROUTES.ACK(messageId)}`, {
      method: 'POST',
      body: ackContent || '',
    });
    const result: ApiResponse<void> = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  // Mark processed
  async markProcessed(messageId: string, processedBy: string): Promise<void> {
    const url = buildUrlWithParams(SWIFT_MESSAGES_ROUTES.PROCESSED(messageId), { processedBy });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`, { method: 'POST' });
    const result: ApiResponse<void> = await response.json();
    if (!result.success) throw new Error(result.error);
  },
};

// ==================== Event Config Queries ====================

export const eventConfigApi = {
  // Get event types for operation
  async getEventTypes(operationType: string, language: string = 'en'): Promise<EventTypeConfig[]> {
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.TYPES.BY_OPERATION(operationType), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<EventTypeConfig[]> = await response.json();
    return result.data || [];
  },

  // Get specific event type
  async getEventType(operationType: string, eventCode: string, language: string = 'en'): Promise<EventTypeConfig | null> {
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.TYPES.BY_OPERATION_AND_CODE(operationType, eventCode), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (response.status === 404) return null;
    const result: ApiResponse<EventTypeConfig> = await response.json();
    return result.data || null;
  },

  // Get available events (next possible actions)
  async getAvailableEvents(
    operationType: string,
    currentStage?: string,
    currentEvent?: string,
    language: string = 'en'
  ): Promise<EventFlowConfig[]> {
    const params: Record<string, string> = { language };
    if (currentStage) params.currentStage = currentStage;
    if (currentEvent) params.currentEvent = currentEvent;
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.FLOWS.AVAILABLE(operationType), params);
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<EventFlowConfig[]> = await response.json();
    return result.data || [];
  },

  // Get available events for a specific operation with condition evaluation
  // This endpoint evaluates configurable conditions (e.g., SWIFT field 57a existence)
  async getAvailableEventsForOperation(
    operationId: string,
    currentStage?: string,
    currentEvent?: string,
    language: string = 'en'
  ): Promise<EventFlowConfig[]> {
    const params: Record<string, string> = { language };
    if (currentStage) params.currentStage = currentStage;
    if (currentEvent) params.currentEvent = currentEvent;
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.FLOWS.AVAILABLE_FOR_OPERATION(operationId), params);
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<EventFlowConfig[]> = await response.json();
    return result.data || [];
  },

  // Get initial events
  async getInitialEvents(operationType: string, language: string = 'en'): Promise<EventFlowConfig[]> {
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.FLOWS.INITIAL(operationType), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<EventFlowConfig[]> = await response.json();
    return result.data || [];
  },

  // Get all flows
  async getAllFlows(operationType: string, language: string = 'en'): Promise<EventFlowConfig[]> {
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.FLOWS.BY_OPERATION(operationType), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<EventFlowConfig[]> = await response.json();
    return result.data || [];
  },

  // Get response configs
  async getResponseConfigs(operationType: string, language: string = 'en'): Promise<SwiftResponseConfig[]> {
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.RESPONSES.BY_OPERATION(operationType), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<SwiftResponseConfig[]> = await response.json();
    return result.data || [];
  },

  // Get operation types
  async getOperationTypes(): Promise<string[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.OPERATION_TYPES}`);
    const result: ApiResponse<string[]> = await response.json();
    return result.data || [];
  },

  // Get distinct stages (all or by operation type)
  async getStages(operationType?: string): Promise<string[]> {
    const url = operationType
      ? `${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.STAGES_BY_OPERATION(operationType)}`
      : `${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.STAGES}`;
    const response = await authFetch(url);
    const result: ApiResponse<string[]> = await response.json();
    return result.data || [];
  },

  // Get distinct SWIFT message types from BD
  async getSwiftMessageTypes(): Promise<string[]> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.SWIFT_MESSAGE_TYPES}`);
    const result: ApiResponse<string[]> = await response.json();
    return result.data || [];
  },

  // Get alert templates for operation
  async getAlertTemplates(operationType: string, language: string = 'es'): Promise<EventAlertTemplate[]> {
    const url = buildUrlWithParams(EVENT_CONFIG_ROUTES.ALERT_TEMPLATES.BY_OPERATION(operationType), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<EventAlertTemplate[]> = await response.json();
    return result.data || [];
  },

  // Get alert templates for a specific event (operationType + eventCode)
  async getAlertTemplatesForEvent(operationType: string, eventCode: string, language: string = 'es'): Promise<EventAlertTemplate[]> {
    const url = buildUrlWithParams(
      EVENT_CONFIG_ROUTES.ALERT_TEMPLATES.BY_EVENT(operationType, eventCode),
      { language }
    );
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<EventAlertTemplate[]> = await response.json();
    return result.data || [];
  },
};

// ==================== Event Log Queries ====================

export const eventLogApi = {
  // Get event history for operation
  async getEventHistory(operationId: string, language: string = 'en'): Promise<OperationEventLog[]> {
    const url = buildUrlWithParams(EVENT_LOG_ROUTES.BY_OPERATION(operationId), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<OperationEventLog[]> = await response.json();
    return result.data || [];
  },

  // Get recent events for operation
  async getRecentEvents(operationId: string, language: string = 'en'): Promise<OperationEventLog[]> {
    const url = buildUrlWithParams(EVENT_LOG_ROUTES.RECENT(operationId), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<OperationEventLog[]> = await response.json();
    return result.data || [];
  },

  // Get last event for operation
  async getLastEvent(operationId: string, language: string = 'en'): Promise<OperationEventLog | null> {
    const url = buildUrlWithParams(EVENT_LOG_ROUTES.LAST(operationId), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    if (response.status === 404) return null;
    const result: ApiResponse<OperationEventLog> = await response.json();
    return result.data || null;
  },

  // Get state transitions
  async getStateTransitions(operationId: string, language: string = 'en'): Promise<OperationEventLog[]> {
    const url = buildUrlWithParams(EVENT_LOG_ROUTES.TRANSITIONS(operationId), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<OperationEventLog[]> = await response.json();
    return result.data || [];
  },

  // Get events by message
  async getEventsByMessage(swiftMessageId: string, language: string = 'en'): Promise<OperationEventLog[]> {
    const url = buildUrlWithParams(EVENT_LOG_ROUTES.BY_MESSAGE(swiftMessageId), { language });
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${url}`);
    const result: ApiResponse<OperationEventLog[]> = await response.json();
    return result.data || [];
  },

  // Count by operation
  async countByOperation(operationId: string): Promise<number> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_LOG_ROUTES.COUNT_BY_OPERATION(operationId)}`);
    const result: ApiResponse<number> = await response.json();
    return result.data || 0;
  },
};

// ==================== Event Config Admin Commands ====================

export const eventConfigCommands = {
  // Event Type Config CRUD
  async createEventType(command: EventTypeConfigCommand): Promise<EventTypeConfig> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.TYPES.BASE}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<EventTypeConfig> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async updateEventType(id: number, command: EventTypeConfigCommand): Promise<EventTypeConfig> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.TYPES.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<EventTypeConfig> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async deleteEventType(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.TYPES.BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  // Event Flow Config CRUD
  async createEventFlow(command: EventFlowConfigCommand): Promise<EventFlowConfig> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.FLOWS.BASE}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<EventFlowConfig> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async updateEventFlow(id: number, command: EventFlowConfigCommand): Promise<EventFlowConfig> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.FLOWS.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<EventFlowConfig> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async deleteEventFlow(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.FLOWS.BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  // SWIFT Response Config CRUD
  async createResponseConfig(command: SwiftResponseConfigCommand): Promise<SwiftResponseConfig> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.RESPONSES.BASE}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<SwiftResponseConfig> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async updateResponseConfig(id: number, command: SwiftResponseConfigCommand): Promise<SwiftResponseConfig> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.RESPONSES.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<SwiftResponseConfig> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async deleteResponseConfig(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.RESPONSES.BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  // Alert Template CRUD
  async createAlertTemplate(template: EventAlertTemplate): Promise<EventAlertTemplate> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.ALERT_TEMPLATES.BASE}`, {
      method: 'POST',
      body: JSON.stringify(template),
    });
    const result: ApiResponse<EventAlertTemplate> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async updateAlertTemplate(id: number, template: EventAlertTemplate): Promise<EventAlertTemplate> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.ALERT_TEMPLATES.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
    const result: ApiResponse<EventAlertTemplate> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async deleteAlertTemplate(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.ALERT_TEMPLATES.BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  async generateAlertTemplates(operationType: string, eventCode: string, language: string = 'es'): Promise<EventAlertTemplate[]> {
    const url = `${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.ALERT_TEMPLATES.GENERATE_FOR_EVENT(operationType, eventCode)}?language=${language}`;
    const response = await authFetch(url, { method: 'POST' });
    const result: ApiResponse<EventAlertTemplate[]> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  async generateAllAlertTemplates(operationType: string, language: string = 'es'): Promise<EventAlertTemplate[]> {
    const url = `${API_BASE_URL_WITH_PREFIX}${EVENT_CONFIG_ROUTES.ALERT_TEMPLATES.GENERATE_FOR_ALL(operationType)}?language=${language}`;
    const response = await authFetch(url, { method: 'POST' });
    const result: ApiResponse<EventAlertTemplate[]> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },
};
