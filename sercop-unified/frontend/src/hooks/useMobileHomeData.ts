/**
 * useMobileHomeData - Hook centralizado de datos para el dashboard mobile
 *
 * Uses only endpoints that actually exist in the backend:
 * - /v1/operations (with status filter for active count)
 * - /v1/operations/awaiting-response (list)
 * - /v1/operations/with-alerts (list)
 * - /dashboard/summary (KPIs, upcoming expiries, etc.)
 *
 * Counts are derived from the actual operation lists (user-scoped).
 */

import { useState, useEffect, useCallback } from 'react';
import { operationsApi } from '../services/operationsApi';
import { dashboardService } from '../services/dashboardService';
import type { Operation } from '../types/operations';
import type { ExpiryCountdown, DashboardSummary, DashboardFilters } from '../types/dashboard';

export interface MobileHomeData {
  activeOpsCount: number;
  awaitingResponseCount: number;
  alertCount: number;
  activeOps: Operation[];
  awaitingResponseOps: Operation[];
  opsWithAlerts: Operation[];
  expiringSoonOps: Operation[];
  upcomingExpiries: ExpiryCountdown[];
  dashboardSummary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMobileHomeData(filters?: DashboardFilters): MobileHomeData {
  const enableDashboardApi = import.meta.env.VITE_ENABLE_DASHBOARD_API !== 'false';
  const [activeOps, setActiveOps] = useState<Operation[]>([]);
  const [awaitingResponseOps, setAwaitingResponseOps] = useState<Operation[]>([]);
  const [opsWithAlerts, setOpsWithAlerts] = useState<Operation[]>([]);
  const [upcomingExpiries, setUpcomingExpiries] = useState<ExpiryCountdown[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboardFilters: DashboardFilters = filters || { period: 'month' };
      const [allActiveOps, awaitingOps, alertOps, summary] = await Promise.all([
        operationsApi.getOperations({ status: 'ACTIVE' as any }).catch(() => []),
        operationsApi.getAwaitingResponse().catch(() => []),
        operationsApi.getWithAlerts().catch(() => []),
        enableDashboardApi
          ? dashboardService.getDashboardSummary(dashboardFilters).catch(() => null)
          : Promise.resolve(null),
      ]);

      // Store full lists - counts come from actual data
      setActiveOps(allActiveOps);
      setAwaitingResponseOps(awaitingOps);
      setOpsWithAlerts(alertOps);

      // Dashboard summary data (for expiries, trends, etc.)
      if (summary) {
        setDashboardSummary(summary);
        setUpcomingExpiries(summary.upcomingExpiries || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [enableDashboardApi, filters?.period, filters?.productType, filters?.currency, filters?.statusFilter,
      filters?.createdBy, filters?.beneficiary, filters?.issuingBank, filters?.advisingBank, filters?.applicant]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    activeOpsCount: activeOps.length,
    awaitingResponseCount: awaitingResponseOps.length,
    alertCount: opsWithAlerts.length,
    activeOps,
    awaitingResponseOps,
    opsWithAlerts,
    expiringSoonOps: [],
    upcomingExpiries,
    dashboardSummary,
    isLoading,
    error,
    refresh,
  };
}
