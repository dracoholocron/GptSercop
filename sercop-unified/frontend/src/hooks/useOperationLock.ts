/**
 * useOperationLock Hook
 * Custom hook for managing operation lock state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { operationLockService } from '../services/operationLockService';
import type { OperationLock, AcquireLockRequest } from '../services/operationLockService';

export interface UseOperationLockOptions {
  operationId: string;
  operationReference?: string;
  productType?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
  onLockExpiring?: (remainingSeconds: number) => void;
  onLockExpired?: () => void;
  onLockAcquired?: (lock: OperationLock) => void;
  onLockReleased?: () => void;
  onLockError?: (error: Error) => void;
}

export interface UseOperationLockReturn {
  lock: OperationLock | null;
  loading: boolean;
  error: string | null;
  isLocked: boolean;
  isLockedByMe: boolean;
  canOperate: boolean;
  remainingSeconds: number;
  isExpiringSoon: boolean;
  acquireLock: (durationSeconds?: number) => Promise<void>;
  releaseLock: () => Promise<void>;
  extendLock: (additionalSeconds: number) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const EXPIRING_THRESHOLD = 60; // seconds

export const useOperationLock = (options: UseOperationLockOptions): UseOperationLockReturn => {
  const {
    operationId,
    operationReference,
    productType,
    autoRefresh = true,
    refreshInterval = 10000, // 10 seconds
    onLockExpiring,
    onLockExpired,
    onLockAcquired,
    onLockReleased,
    onLockError,
  } = options;

  const [lock, setLock] = useState<OperationLock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const refreshRef = useRef<NodeJS.Timeout | null>(null);
  const hasNotifiedExpiring = useRef(false);

  // Clear all intervals
  const clearIntervals = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (refreshRef.current) {
      clearInterval(refreshRef.current);
      refreshRef.current = null;
    }
  }, []);

  // Start countdown timer
  const startCountdown = useCallback((lock: OperationLock) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setRemainingSeconds(lock.remainingSeconds);
    hasNotifiedExpiring.current = false;

    countdownRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = Math.max(0, prev - 1);

        // Notify when expiring soon
        if (newValue <= EXPIRING_THRESHOLD && newValue > 0 && !hasNotifiedExpiring.current) {
          hasNotifiedExpiring.current = true;
          onLockExpiring?.(newValue);
        }

        // Notify when expired
        if (newValue === 0) {
          onLockExpired?.();
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
        }

        return newValue;
      });
    }, 1000);
  }, [onLockExpiring, onLockExpired]);

  // Refresh lock status
  const refreshStatus = useCallback(async () => {
    // Don't make API calls if operationId is empty
    if (!operationId) {
      setLoading(false);
      setLock(null);
      setRemainingSeconds(0);
      return;
    }

    try {
      const status = await operationLockService.getLockStatus(operationId);
      setLock(status);
      setError(null);

      if (status.locked && status.lockedByCurrentUser) {
        startCountdown(status);
      } else {
        setRemainingSeconds(status.remainingSeconds || 0);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get lock status';
      setError(message);
      onLockError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [operationId, startCountdown, onLockError]);

  // Acquire lock
  const acquireLock = useCallback(async (durationSeconds?: number) => {
    if (!operationId) {
      throw new Error('Cannot acquire lock: no operationId provided');
    }

    setLoading(true);
    setError(null);

    try {
      const request: AcquireLockRequest = {
        durationSeconds,
        operationReference,
        productType,
      };

      const newLock = await operationLockService.acquireLock(operationId, request);
      setLock(newLock);
      startCountdown(newLock);
      onLockAcquired?.(newLock);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to acquire lock';
      setError(message);
      onLockError?.(err instanceof Error ? err : new Error(message));

      // If there's lock info in the error, update the state
      if ((err as any).lockInfo) {
        setLock((err as any).lockInfo);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [operationId, operationReference, productType, startCountdown, onLockAcquired, onLockError]);

  // Release lock
  const releaseLock = useCallback(async () => {
    if (!operationId) {
      throw new Error('Cannot release lock: no operationId provided');
    }

    setLoading(true);
    setError(null);

    try {
      await operationLockService.releaseLock(operationId);
      setLock(prev => prev ? { ...prev, locked: false, lockedByCurrentUser: false, canCurrentUserOperate: true } : null);
      clearIntervals();
      setRemainingSeconds(0);
      onLockReleased?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to release lock';
      setError(message);
      onLockError?.(err instanceof Error ? err : new Error(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operationId, clearIntervals, onLockReleased, onLockError]);

  // Extend lock
  const extendLock = useCallback(async (additionalSeconds: number) => {
    if (!operationId) {
      throw new Error('Cannot extend lock: no operationId provided');
    }

    setLoading(true);
    setError(null);

    try {
      const extendedLock = await operationLockService.extendLock(operationId, { additionalSeconds });
      setLock(extendedLock);
      startCountdown(extendedLock);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extend lock';
      setError(message);
      onLockError?.(err instanceof Error ? err : new Error(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operationId, startCountdown, onLockError]);

  // Initial fetch
  useEffect(() => {
    refreshStatus();
  }, [operationId]); // Only re-fetch when operationId changes

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    refreshRef.current = setInterval(refreshStatus, refreshInterval);

    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, refreshStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, [clearIntervals]);

  return {
    lock,
    loading,
    error,
    isLocked: lock?.locked ?? false,
    isLockedByMe: lock?.lockedByCurrentUser ?? false,
    canOperate: lock?.canCurrentUserOperate ?? true,
    remainingSeconds,
    isExpiringSoon: remainingSeconds > 0 && remainingSeconds <= EXPIRING_THRESHOLD,
    acquireLock,
    releaseLock,
    extendLock,
    refreshStatus,
  };
};

export default useOperationLock;
