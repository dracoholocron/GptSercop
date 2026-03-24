/**
 * Service for Pending Approvals (CQRS)
 */
import type {
  PendingApproval,
  SubmitEventForApprovalCommand,
  ReviewApprovalCommand,
  PendingApprovalStatistics,
} from '../types/operations';
import { TOKEN_STORAGE_KEY, API_V1_URL } from '../config/api.config';

const API_BASE = API_V1_URL;

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

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.location.href = '/login';
  }

  return response;
};

// ==================== Query Service (Read) ====================

export const pendingApprovalQueries = {
  /**
   * Get all pending approvals
   */
  async getAllPending(): Promise<PendingApproval[]> {
    const response = await authFetch(`${API_BASE}/pending-approvals`);
    const result: ApiResponse<PendingApproval[]> = await response.json();
    return result.data || [];
  },

  /**
   * Get pending approvals by product type
   */
  async getByProductType(productType: string): Promise<PendingApproval[]> {
    const response = await authFetch(`${API_BASE}/pending-approvals?productType=${productType}`);
    const result: ApiResponse<PendingApproval[]> = await response.json();
    return result.data || [];
  },

  /**
   * Get pending approvals by approval type
   */
  async getByApprovalType(approvalType: 'NEW_OPERATION' | 'OPERATION_EVENT'): Promise<PendingApproval[]> {
    const response = await authFetch(`${API_BASE}/pending-approvals?approvalType=${approvalType}`);
    const result: ApiResponse<PendingApproval[]> = await response.json();
    return result.data || [];
  },

  /**
   * Get a specific approval by ID
   */
  async getByApprovalId(approvalId: string): Promise<PendingApproval | null> {
    const response = await authFetch(`${API_BASE}/pending-approvals/${approvalId}`);
    if (response.status === 404) return null;
    const result: ApiResponse<PendingApproval> = await response.json();
    return result.data || null;
  },

  /**
   * Search pending approvals
   */
  async search(searchTerm: string): Promise<PendingApproval[]> {
    const response = await authFetch(`${API_BASE}/pending-approvals?search=${encodeURIComponent(searchTerm)}`);
    const result: ApiResponse<PendingApproval[]> = await response.json();
    return result.data || [];
  },

  /**
   * Get statistics
   */
  async getStatistics(): Promise<PendingApprovalStatistics> {
    const response = await authFetch(`${API_BASE}/pending-approvals/statistics`);
    const result: ApiResponse<PendingApprovalStatistics> = await response.json();
    return result.data || { totalPending: 0, byType: {}, byProductType: {} };
  },

  /**
   * Get approvals submitted by a user
   */
  async getSubmittedBy(username: string): Promise<PendingApproval[]> {
    const response = await authFetch(`${API_BASE}/pending-approvals/submitted-by/${username}`);
    const result: ApiResponse<PendingApproval[]> = await response.json();
    return result.data || [];
  },

  /**
   * Get latest rejected approval for a draft (to load field comments)
   */
  async getLatestRejectedByDraftId(draftId: string): Promise<PendingApproval | null> {
    const response = await authFetch(`${API_BASE}/pending-approvals/rejected-by-draft/${draftId}`);
    const result: ApiResponse<PendingApproval> = await response.json();
    return result.data || null;
  },

  /**
   * Get list of operation IDs that have pending approvals
   */
  async getPendingOperationIds(): Promise<string[]> {
    const response = await authFetch(`${API_BASE}/pending-approvals/pending-operation-ids`);
    const result: ApiResponse<string[]> = await response.json();
    return result.data || [];
  },
};

// ==================== Command Service (Write) ====================

export const pendingApprovalCommands = {
  /**
   * Submit an event for approval
   */
  async submitForApproval(command: SubmitEventForApprovalCommand): Promise<PendingApproval> {
    const response = await authFetch(`${API_BASE}/pending-approvals/submit`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<PendingApproval> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  /**
   * Approve a pending approval
   */
  async approve(approvalId: string, reviewedBy: string, comments?: string): Promise<PendingApproval> {
    const params = new URLSearchParams({ reviewedBy });
    if (comments) params.append('comments', comments);

    const response = await authFetch(`${API_BASE}/pending-approvals/${approvalId}/approve?${params}`, {
      method: 'POST',
    });
    const result: ApiResponse<PendingApproval> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  /**
   * Reject a pending approval
   */
  async reject(
    approvalId: string,
    reviewedBy: string,
    rejectionReason: string,
    comments?: string,
    fieldComments?: Record<string, { comment: string }>
  ): Promise<PendingApproval> {
    const command: ReviewApprovalCommand = {
      approvalId,
      action: 'REJECT',
      reviewedBy,
      rejectionReason,
      comments,
      fieldComments,
    };
    const response = await authFetch(`${API_BASE}/pending-approvals/${approvalId}/review`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<PendingApproval> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },

  /**
   * Review a pending approval (generic)
   */
  async review(command: ReviewApprovalCommand): Promise<PendingApproval> {
    const response = await authFetch(`${API_BASE}/pending-approvals/${command.approvalId}/review`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
    const result: ApiResponse<PendingApproval> = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data!;
  },
};

// Export default service
export const pendingApprovalService = {
  ...pendingApprovalQueries,
  ...pendingApprovalCommands,
};

export default pendingApprovalService;
