/**
 * Operation Lock Service
 * Service for managing operation locks (pessimistic locking)
 */

import { API_BASE_URL_WITH_PREFIX as API_BASE_URL, TOKEN_STORAGE_KEY } from '../config/api.config';
import { OPERATION_LOCK_ROUTES, buildUrlWithParams } from '../config/api.routes';

// ============================================================================
// Types
// ============================================================================

export interface OperationLock {
  operationId: string;
  lockedBy: string;
  lockedByFullName: string;
  lockedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  lockDurationSeconds: number;
  operationReference: string | null;
  productType: string | null;
  locked: boolean;
  lockedByCurrentUser: boolean;
  expiringSoon: boolean;
  canCurrentUserOperate: boolean;
}

export interface AcquireLockRequest {
  durationSeconds?: number;
  operationReference?: string;
  productType?: string;
}

export interface ExtendLockRequest {
  additionalSeconds: number;
}

export interface ForceReleaseRequest {
  reason?: string;
}

export interface LockStatistics {
  activeLocks: number;
  byUser: Record<string, number>;
  byProductType: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  lockInfo?: OperationLock;
}

// ============================================================================
// Service Class
// ============================================================================

class OperationLockService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  /**
   * Acquire a lock on an operation
   */
  async acquireLock(operationId: string, request?: AcquireLockRequest): Promise<OperationLock> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.BY_ID(operationId)}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request || {}),
    });

    const result: ApiResponse<OperationLock> = await response.json();

    if (!response.ok || !result.success) {
      const error = new Error(result.message || 'Failed to acquire lock');
      (error as any).lockInfo = result.lockInfo;
      throw error;
    }

    return result.data!;
  }

  /**
   * Release a lock on an operation
   */
  async releaseLock(operationId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.BY_ID(operationId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<void> = await response.json();

    if (!response.ok || !result.success) {
      const error = new Error(result.message || 'Failed to release lock');
      (error as any).lockInfo = result.lockInfo;
      throw error;
    }
  }

  /**
   * Force release a lock (admin only)
   */
  async forceReleaseLock(operationId: string, request?: ForceReleaseRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.FORCE_RELEASE(operationId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request || {}),
    });

    const result: ApiResponse<void> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to force release lock');
    }
  }

  /**
   * Extend an existing lock
   */
  async extendLock(operationId: string, request: ExtendLockRequest): Promise<OperationLock> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.EXTEND(operationId)}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    const result: ApiResponse<OperationLock> = await response.json();

    if (!response.ok || !result.success) {
      const error = new Error(result.message || 'Failed to extend lock');
      (error as any).lockInfo = result.lockInfo;
      throw error;
    }

    return result.data!;
  }

  /**
   * Get lock status for an operation
   */
  async getLockStatus(operationId: string): Promise<OperationLock> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.BY_ID(operationId)}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get lock status');
    }

    return response.json();
  }

  /**
   * Get all active locks (admin only)
   */
  async getActiveLocks(): Promise<{ data: OperationLock[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.ACTIVE}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get active locks');
    }

    return response.json();
  }

  /**
   * Get lock status for multiple operations
   */
  async getBulkLockStatus(operationIds: string[]): Promise<Record<string, OperationLock>> {
    const url = buildUrlWithParams(OPERATION_LOCK_ROUTES.BULK, { operationIds });
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get bulk lock status');
    }

    return response.json();
  }

  /**
   * Get lock statistics (admin only)
   */
  async getLockStatistics(): Promise<LockStatistics> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.STATISTICS}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get lock statistics');
    }

    return response.json();
  }

  /**
   * Check if user can operate on an operation
   */
  async canOperate(operationId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}${OPERATION_LOCK_ROUTES.CAN_OPERATE(operationId)}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check operation permission');
    }

    const result = await response.json();
    return result.canOperate;
  }
}

export const operationLockService = new OperationLockService();
export default operationLockService;
