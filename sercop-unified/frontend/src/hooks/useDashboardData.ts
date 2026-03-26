/**
 * useDashboardData Hook
 * Custom hook for fetching and managing dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import type {
  DashboardSummary,
  DashboardFilters,
  DashboardFilterOptions,
} from '../types/dashboard';

interface UseDashboardDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  externalFilters?: DashboardFilters;
  externalFilterOptions?: DashboardFilterOptions | null;
}

interface UseDashboardDataReturn {
  data: DashboardSummary | null;
  filterOptions: DashboardFilterOptions | null;
  filters: DashboardFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshInterval: number;
  setFilters: (filters: DashboardFilters) => void;
  setRefreshInterval: (interval: number) => void;
  refresh: () => Promise<void>;
}

export const useDashboardData = (
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn => {
  const { autoRefresh = false, refreshInterval: initialRefreshInterval = 300000, externalFilters, externalFilterOptions } = options;
  const enableDashboardApi = import.meta.env.VITE_ENABLE_DASHBOARD_API !== 'false';

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<DashboardFilterOptions | null>(null);
  const [internalFilters, setInternalFilters] = useState<DashboardFilters>({ period: 'month' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(initialRefreshInterval);

  // Use external filters/options if provided (from useOperationFilters), otherwise use internal state
  const filters = externalFilters || internalFilters;
  const setFilters = externalFilters ? (() => {}) as any : setInternalFilters;
  const effectiveFilterOptions = externalFilterOptions !== undefined ? externalFilterOptions : filterOptions;

  const fetchData = useCallback(async () => {
    if (!enableDashboardApi) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [summaryData, filtersData] = await Promise.all([
        dashboardService.getDashboardSummary(filters),
        effectiveFilterOptions ? Promise.resolve(effectiveFilterOptions) : dashboardService.getFilterOptions(),
      ]);

      setData(summaryData);
      if (!effectiveFilterOptions) {
        setFilterOptions(filtersData as DashboardFilterOptions);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [enableDashboardApi, filters, effectiveFilterOptions]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch and filter changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh (only if interval > 0, 0 means manual)
  useEffect(() => {
    if (!autoRefresh || refreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    filterOptions: effectiveFilterOptions,
    filters,
    loading,
    error,
    lastUpdated,
    refreshInterval,
    setFilters,
    setRefreshInterval,
    refresh,
  };
};

export default useDashboardData;
