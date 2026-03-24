/**
 * useOperationFilters - Reusable hook for operation filters.
 * Encapsulates: filter state, options loading, ROLE_OPERATOR auto-filter.
 * Used by: BusinessDashboard, MobileHomeDashboard, and any future page.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { DashboardFilters, DashboardFilterOptions } from '../types/dashboard';

interface UseOperationFiltersOptions {
  defaults?: Partial<DashboardFilters>;
}

export function useOperationFilters(options: UseOperationFiltersOptions = {}) {
  const { defaults } = options;
  const { user, hasRole } = useAuth();
  const isOperator = hasRole('ROLE_OPERATOR');

  const [filters, _setFilters] = useState<DashboardFilters>({
    period: 'month',
    statusFilter: 'OPEN',
    ...defaults,
    // ROLE_OPERATOR: auto-set createdBy to current user
    ...(isOperator && user?.username ? { createdBy: user.username } : {}),
  });

  const [filterOptions, setFilterOptions] = useState<DashboardFilterOptions | null>(null);

  // Safe setFilters: operators cannot clear their createdBy
  const setFilters = useCallback((newFilters: DashboardFilters) => {
    if (isOperator && user?.username) {
      _setFilters({ ...newFilters, createdBy: user.username });
    } else {
      _setFilters(newFilters);
    }
  }, [isOperator, user?.username]);

  // Load filter options once
  const loadFilterOptions = useCallback(async () => {
    if (filterOptions) return filterOptions;
    try {
      const opts = await dashboardService.getFilterOptions();
      setFilterOptions(opts);
      return opts;
    } catch (err) {
      console.error('Error loading filter options:', err);
      return null;
    }
  }, [filterOptions]);

  // Auto-load on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Count of active advanced filters (for badges)
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (filters.createdBy) count++;
    if (filters.beneficiary) count++;
    if (filters.issuingBank) count++;
    if (filters.advisingBank) count++;
    if (filters.applicant) count++;
    return count;
  }, [filters.createdBy, filters.beneficiary, filters.issuingBank, filters.advisingBank, filters.applicant]);

  // Count of active SWIFT search conditions (for badges)
  const activeSwiftCount = useMemo(() => {
    let count = 0;
    if (filters.swiftSearch?.length) count += filters.swiftSearch.length;
    if (filters.swiftFreeText) count++;
    if (filters.customFieldValue) count++;
    return count;
  }, [filters.swiftSearch, filters.swiftFreeText, filters.customFieldValue]);

  return {
    filters,
    setFilters,
    filterOptions,
    loadFilterOptions,
    isOperator,
    activeAdvancedCount,
    activeSwiftCount,
  };
}

export default useOperationFilters;
