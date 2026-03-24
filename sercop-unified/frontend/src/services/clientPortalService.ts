import { apiClient as api } from '../config/api.client';

// Document information from central document service
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

// Re-export types from the types file
export type {
  ClientRequest,
  CreateClientRequestDTO,
  ClientOperation,
  ClientOperationDetail,
  PageResponse,
  ClientStats,
  BackofficeStats,
  ClientCompanyInfo,
  AccessibleCompany,
  AccessibleCompaniesResponse,
  CompanyHierarchyNode,
  CompanyHierarchyResponse,
  SearchParams,
  AvailableEvent,
  EventRequestDTO,
  EventRequestResponse,
  OperationEventLog,
  MyEventRequest,
} from './clientPortalTypes';

// Import types for internal use
import type {
  ClientRequest,
  CreateClientRequestDTO,
  ClientOperation,
  ClientOperationDetail,
  PageResponse,
  ClientStats,
  BackofficeStats,
  ClientCompanyInfo,
  AccessibleCompany,
  AccessibleCompaniesResponse,
  CompanyHierarchyResponse,
  SearchParams,
  AvailableEvent,
  EventRequestDTO,
  EventRequestResponse,
  OperationEventLog,
  MyEventRequest,
} from './clientPortalTypes';

// Client Portal Service
const clientPortalService = {
  // ==========================================
  // Client Portal Endpoints
  // ==========================================

  /**
   * Create a new request
   */
  async createRequest(request: CreateClientRequestDTO): Promise<ClientRequest> {
    const response = await api.post<ClientRequest>('/client-portal/requests', request);
    return response.data;
  },

  /**
   * Get a specific request by ID
   */
  async getRequest(id: string): Promise<ClientRequest> {
    const response = await api.get<ClientRequest>(`/client-portal/requests/${id}`);
    return response.data;
  },

  /**
   * Get documents associated with a request.
   * Uses the central document service (provider-agnostic).
   */
  async getRequestDocuments(id: string): Promise<DocumentInfo[]> {
    const response = await api.get<DocumentInfo[]>(`/client-portal/requests/${id}/documents`);
    return response.data;
  },

  /**
   * List all requests for the current client
   */
  async listRequests(params: SearchParams = {}): Promise<PageResponse<ClientRequest>> {
    const response = await api.get<PageResponse<ClientRequest>>('/client-portal/requests', { params });
    return response.data;
  },

  /**
   * Get my requests (alias for listRequests)
   */
  async getMyRequests(params: SearchParams = {}): Promise<PageResponse<ClientRequest>> {
    return this.listRequests(params);
  },

  /**
   * Update a draft request
   */
  async updateRequest(id: string, updates: Partial<ClientRequest>): Promise<ClientRequest> {
    const response = await api.put<ClientRequest>(`/client-portal/requests/${id}`, updates);
    return response.data;
  },

  /**
   * Submit a request for review
   */
  async submitRequest(id: string): Promise<ClientRequest> {
    const response = await api.post<ClientRequest>(`/client-portal/requests/${id}/submit`);
    return response.data;
  },

  /**
   * Cancel a request
   */
  async cancelRequest(id: string): Promise<ClientRequest> {
    const response = await api.post<ClientRequest>(`/client-portal/requests/${id}/cancel`);
    return response.data;
  },

  /**
   * Get client statistics for dashboard
   */
  async getClientStats(): Promise<ClientStats> {
    const response = await api.get<ClientStats>('/client-portal/stats');
    return response.data;
  },

  /**
   * Get active operations count
   */
  async getActiveOperationsCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/client-portal/stats/active-operations');
    return response.data;
  },

  /**
   * Get pending requests count
   */
  async getPendingRequestsCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/client-portal/stats/pending-requests');
    return response.data;
  },

  /**
   * Get the company information for the current client
   */
  async getMyCompany(): Promise<ClientCompanyInfo> {
    const response = await api.get<ClientCompanyInfo>('/client-portal/my-company');
    return response.data;
  },

  // ==========================================
  // Corporation / Multi-Company Endpoints
  // ==========================================

  /**
   * Get all companies accessible by the current user.
   * For corporation users: returns all child companies.
   * For company users: returns only their own company.
   */
  async getAccessibleCompanies(): Promise<AccessibleCompaniesResponse> {
    const response = await api.get<AccessibleCompaniesResponse>('/client-portal/accessible-companies');
    return response.data;
  },

  /**
   * Get the company hierarchy tree.
   * Returns the full tree structure from the root corporation.
   */
  async getCompanyHierarchy(): Promise<CompanyHierarchyResponse> {
    const response = await api.get<CompanyHierarchyResponse>('/client-portal/company-hierarchy');
    return response.data;
  },

  // ==========================================
  // Operations Endpoints
  // ==========================================

  /**
   * List client operations
   */
  async listOperations(params: SearchParams = {}): Promise<PageResponse<ClientOperation>> {
    const response = await api.get<PageResponse<ClientOperation>>('/client-portal/operations', { params });
    return response.data;
  },

  /**
   * Get a specific operation by ID
   */
  async getOperation(operationId: string): Promise<ClientOperation> {
    const response = await api.get<ClientOperation>(`/client-portal/operations/${operationId}`);
    return response.data;
  },

  /**
   * Get operation details with available events
   */
  async getOperationDetail(operationId: string, language: string = 'es'): Promise<ClientOperationDetail> {
    const response = await api.get<ClientOperationDetail>(`/client-portal/operations/${operationId}`);
    const operation = response.data;

    // Get available events for this operation (using client portal facade endpoint)
    try {
      const eventsResponse = await api.get<AvailableEvent[]>(
        `/client-portal/operations/${operationId}/available-events`,
        { params: { language } }
      );
      // The apiClient already unwraps .data, so eventsResponse.data is the array directly
      operation.availableEvents = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
    } catch (err) {
      console.warn('Failed to load available events:', err);
      operation.availableEvents = [];
    }

    // Get event history (using client portal facade endpoint)
    try {
      const historyResponse = await api.get<OperationEventLog[]>(
        `/client-portal/operations/${operationId}/event-history`
      );
      // The apiClient already unwraps .data
      operation.eventHistory = Array.isArray(historyResponse.data) ? historyResponse.data : [];
    } catch (err) {
      console.warn('Failed to load event history:', err);
      operation.eventHistory = [];
    }

    return operation;
  },

  /**
   * Create a post-issuance event request
   */
  async createEventRequest(request: EventRequestDTO): Promise<EventRequestResponse> {
    const response = await api.post<EventRequestResponse>(
      `/client-portal/operations/${request.operationId}/event-requests`,
      request
    );
    return response.data;
  },

  /**
   * Get event requests for an operation
   */
  async getEventRequests(operationId: string): Promise<EventRequestResponse[]> {
    const response = await api.get<EventRequestResponse[]>(
      `/client-portal/operations/${operationId}/event-requests`
    );
    return response.data;
  },

  /**
   * Get all event requests for the current client (post-issuance requests)
   */
  async getMyEventRequests(): Promise<MyEventRequest[]> {
    const response = await api.get<MyEventRequest[]>('/client-portal/my-event-requests');
    return response.data;
  },

  // ==========================================
  // Backoffice Endpoints
  // ==========================================

  /**
   * List all requests (backoffice)
   */
  async listAllRequests(params: SearchParams = {}): Promise<PageResponse<ClientRequest>> {
    const response = await api.get<PageResponse<ClientRequest>>('/backoffice/client-requests', { params });
    return response.data;
  },

  /**
   * Get a specific request by ID (backoffice)
   */
  async getRequestBackoffice(id: string): Promise<ClientRequest> {
    const response = await api.get<ClientRequest>(`/backoffice/client-requests/${id}`);
    return response.data;
  },

  /**
   * Assign a request to a processor
   */
  async assignRequest(id: string, assigneeId: string, assigneeName: string): Promise<ClientRequest> {
    const response = await api.post<ClientRequest>(`/backoffice/client-requests/${id}/assign`, {
      assigneeId,
      assigneeName,
    });
    return response.data;
  },

  /**
   * Request additional documents from client
   */
  async requestDocuments(id: string, details: string): Promise<ClientRequest> {
    const response = await api.post<ClientRequest>(`/backoffice/client-requests/${id}/request-documents`, {
      details,
    });
    return response.data;
  },

  /**
   * Approve a request
   */
  async approveRequest(id: string): Promise<ClientRequest> {
    const response = await api.post<ClientRequest>(`/backoffice/client-requests/${id}/approve`);
    return response.data;
  },

  /**
   * Reject a request
   */
  async rejectRequest(id: string, reason: string): Promise<ClientRequest> {
    const response = await api.post<ClientRequest>(`/backoffice/client-requests/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  /**
   * Get backoffice statistics
   */
  async getBackofficeStats(): Promise<BackofficeStats> {
    const response = await api.get<BackofficeStats>('/backoffice/client-requests/stats');
    return response.data;
  },

  /**
   * Get pending total count
   */
  async getPendingTotalCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/backoffice/client-requests/stats/pending');
    return response.data;
  },

  /**
   * Get my assigned count
   */
  async getMyAssignedCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/backoffice/client-requests/stats/my-assigned');
    return response.data;
  },

  /**
   * Get SLA at risk count
   */
  async getSlaAtRiskCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/backoffice/client-requests/stats/sla-at-risk');
    return response.data;
  },

  /**
   * Get SLA breached count
   */
  async getSlaBreachedCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/backoffice/client-requests/stats/sla-breached');
    return response.data;
  },

  // ==========================================
  // Helper functions
  // ==========================================

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      DRAFT: 'gray',
      SUBMITTED: 'blue',
      IN_REVIEW: 'yellow',
      PENDING_DOCUMENTS: 'orange',
      APPROVED: 'green',
      REJECTED: 'red',
      CANCELLED: 'gray',
    };
    return colors[status] || 'gray';
  },

  /**
   * Get SLA status color for UI
   */
  getSlaStatusColor(status?: string): string {
    const colors: Record<string, string> = {
      ON_TRACK: 'green',
      WARNING: 'yellow',
      CRITICAL: 'orange',
      BREACHED: 'red',
    };
    return status ? colors[status] || 'gray' : 'gray';
  },

  /**
   * Get priority color for UI
   */
  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      LOW: 'gray',
      NORMAL: 'blue',
      HIGH: 'orange',
      URGENT: 'red',
    };
    return colors[priority] || 'blue';
  },

  /**
   * Get product icon
   */
  getProductIcon(productType: string): string {
    const icons: Record<string, string> = {
      GUARANTEE_REQUEST: 'Shield',
      LC_IMPORT_REQUEST: 'Download',
      LC_EXPORT_REQUEST: 'Upload',
      COLLECTION_REQUEST: 'DollarSign',
    };
    return icons[productType] || 'FileText';
  },

  /**
   * Get product color
   */
  getProductColor(productType: string): string {
    const colors: Record<string, string> = {
      GUARANTEE_REQUEST: 'purple',
      LC_IMPORT_REQUEST: 'blue',
      LC_EXPORT_REQUEST: 'green',
      COLLECTION_REQUEST: 'orange',
    };
    return colors[productType] || 'gray';
  },

  /**
   * Format amount with currency
   */
  formatAmount(amount?: number, currency?: string): string {
    if (!amount) return '-';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return currency ? `${currency} ${formatted}` : formatted;
  },

  /**
   * Calculate SLA remaining time
   */
  calculateSlaRemaining(slaDeadline?: string): string {
    if (!slaDeadline) return '-';
    const deadline = new Date(slaDeadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return 'Breached';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  },
};

export default clientPortalService;
