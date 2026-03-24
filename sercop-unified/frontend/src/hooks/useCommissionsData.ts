/**
 * useCommissionsData Hook
 * Custom hook for fetching and managing commissions dashboard data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { gleService, type GleCommissionsReport, type CommissionsFilter, type PendingCommissionsReport } from '../services/gleService';

export interface CommissionsFilters {
  period: 'month' | 'quarter' | 'semester' | 'year' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  currency?: string;
  productType?: string;
  accounts?: string[];  // Filtro por cuentas contables específicas
}

interface UseCommissionsDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface MonthlyTrend {
  month: string;
  sortKey: string;
  total: number;
}

interface ProductTypeSummary {
  productType: string;
  label: string;
  total: number;
  count: number;
  currencies: { currency: string; amount: number }[];
}

interface CurrencySummary {
  currency: string;
  total: number;
  count: number;
  percentage: number;
}

export interface AvailableAccount {
  account: string;
  count: number;
  total: number;
}

// ============================================================================
// COMISIONES PENDIENTES (datos procesados)
// ============================================================================

export interface PendingCommissionsData {
  totalPending: number;
  totalOperations: number;
  byCurrency: {
    currency: string;
    balance: number;
    operationCount: number;
  }[];
  byProductType: {
    productType: string;
    label: string;
    balance: number;
    count: number;
  }[];
  topOperations: {
    reference: string;
    productType: string;
    currency: string;
    balance: number;
    formattedAmount: string;
  }[];
}

export interface CommissionsData {
  // Raw data
  report: GleCommissionsReport;

  // KPIs
  totalCommissions: number;
  totalOperations: number;
  averageCommission: number;

  // Monthly trend
  monthlyTrend: MonthlyTrend[];
  currentMonthTotal: number;
  previousMonthTotal: number;
  monthOverMonthChange: number | null;

  // By product type
  byProductType: ProductTypeSummary[];

  // By currency
  byCurrency: CurrencySummary[];

  // Top operations
  topOperations: {
    reference: string;
    productType: string;
    currency: string;
    amount: number;
    formattedAmount: string;
  }[];

  // Period info
  periodLabel: string;
  startDate: string;
  endDate: string;

  // Available accounts for filter
  availableAccounts: AvailableAccount[];
}

interface UseCommissionsDataReturn {
  data: CommissionsData | null;
  pendingData: PendingCommissionsData | null;
  pendingLoading: boolean;
  filters: CommissionsFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshInterval: number;
  setFilters: (filters: CommissionsFilters) => void;
  setRefreshInterval: (interval: number) => void;
  refresh: () => Promise<void>;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  'LC_IMPORT': 'LC Importación',
  'LC_EXPORT': 'LC Exportación',
  'GUARANTEE': 'Garantía',
  'GUARANTEE_ISSUED': 'Garantía Emitida',
  'GUARANTEE_RECEIVED': 'Garantía Recibida',
  'AVAL': 'Aval',
  'STANDBY_LC': 'Standby LC',
  'COLLECTION_IMPORT': 'Cobranza Importación',
  'COLLECTION_EXPORT': 'Cobranza Exportación',
  'COLLECTION': 'Cobranza',
  'UNKNOWN': 'Sin Tipo',
};

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatCurrency = (amount: number, currency?: string): string => {
  return new Intl.NumberFormat('es-MX', {
    style: currency ? 'currency' : 'decimal',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getProductTypeLabel = (pt: string): string => {
  return PRODUCT_TYPE_LABELS[pt] || pt;
};

const periodToMonths = (period: CommissionsFilters['period']): number | null => {
  switch (period) {
    case 'month': return 1;
    case 'quarter': return 3;
    case 'semester': return 6;
    case 'year': return 12;
    case 'all': return null; // No limit
    default: return 3;
  }
};

const getPeriodLabel = (period: CommissionsFilters['period'], startDate?: string, endDate?: string): string => {
  switch (period) {
    case 'month': return 'Último Mes';
    case 'quarter': return 'Último Trimestre';
    case 'semester': return 'Último Semestre';
    case 'year': return 'Último Año';
    case 'all': return 'Todo el Historial';
    case 'custom':
      if (startDate && endDate) {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return `${start.toLocaleDateString('es-MX', options)} - ${end.toLocaleDateString('es-MX', options)}`;
      }
      return 'Período Personalizado';
    default: return 'Último Trimestre';
  }
};

export const useCommissionsData = (
  options: UseCommissionsDataOptions = {}
): UseCommissionsDataReturn => {
  const { autoRefresh = false, refreshInterval: initialRefreshInterval = 300000 } = options;

  const [rawData, setRawData] = useState<GleCommissionsReport | null>(null);
  const [rawPendingData, setRawPendingData] = useState<PendingCommissionsReport | null>(null);
  const [filters, setFilters] = useState<CommissionsFilters>({ period: 'quarter' });
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(initialRefreshInterval);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiFilter: CommissionsFilter = {};

      if (filters.period === 'custom' && filters.startDate && filters.endDate) {
        apiFilter.startDate = filters.startDate;
        apiFilter.endDate = filters.endDate;
      } else if (filters.period === 'all') {
        apiFilter.months = 0; // Backend interprets 0 as "all time"
      } else {
        const months = periodToMonths(filters.period);
        if (months) apiFilter.months = months;
      }

      // Agregar filtro de cuentas si está seleccionado
      if (filters.accounts && filters.accounts.length > 0) {
        apiFilter.accounts = filters.accounts;
      }

      const report = await gleService.getCommissionsCharged(apiFilter);
      setRawData(report);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching commissions data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos de comisiones');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch pending commissions (separate from charged commissions)
  const fetchPendingData = useCallback(async () => {
    setPendingLoading(true);
    try {
      const pendingReport = await gleService.getPendingCommissions();
      setRawPendingData(pendingReport);
    } catch (err) {
      console.error('Error fetching pending commissions:', err);
      // Don't set error here to not block the main data
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchData(), fetchPendingData()]);
  }, [fetchData, fetchPendingData]);

  // Initial fetch and filter changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch pending data once on mount (not affected by filters)
  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Process raw data into dashboard format
  const data = useMemo((): CommissionsData | null => {
    if (!rawData) return null;

    // Filter by currency if specified
    let filteredByRef = rawData.byReference;
    let filteredByProduct = rawData.byProductType;
    let filteredByCurrency = rawData.byCurrency;
    let filteredEntries = rawData.entries;

    if (filters.currency) {
      filteredByRef = rawData.byReference.filter(r => r.currency === filters.currency);
      filteredByProduct = rawData.byProductType.filter(p => p.currency === filters.currency);
      filteredByCurrency = rawData.byCurrency.filter(c => c.currency === filters.currency);
      filteredEntries = rawData.entries.filter(e => e.currency === filters.currency);
    }

    if (filters.productType) {
      filteredByRef = filteredByRef.filter(r => r.productType === filters.productType);
      filteredByProduct = filteredByProduct.filter(p => p.productType === filters.productType);
      filteredEntries = filteredEntries.filter(e => e.productType === filters.productType);
    }

    // Calculate totals from filtered data
    const totalCommissions = filters.currency || filters.productType
      ? filteredByRef.reduce((sum, r) => sum + r.amount, 0)
      : rawData.totalCommissions;

    // Get unique operations count
    const uniqueOperations = new Set(filteredByRef.map(r => r.reference)).size;

    // Average commission
    const averageCommission = uniqueOperations > 0 ? totalCommissions / uniqueOperations : 0;

    // Monthly trend from backend aggregated data (byMonth)
    const monthlyTrend: MonthlyTrend[] = (rawData.byMonth || [])
      .map(m => {
        // Convert YYYY-MM to readable format
        const [year, monthNum] = m.month.split('-');
        const monthIndex = parseInt(monthNum, 10) - 1;
        const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;
        return {
          month: monthLabel,
          sortKey: m.month,
          total: m.amount,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Current and previous month totals from backend aggregated data
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    let currentMonthTotal = 0;
    let previousMonthTotal = 0;

    // Use backend aggregated monthly data
    (rawData.byMonth || []).forEach(m => {
      if (m.month === currentMonthKey) {
        currentMonthTotal = m.amount;
      } else if (m.month === prevMonthKey) {
        previousMonthTotal = m.amount;
      }
    });

    const monthOverMonthChange = previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal * 100)
      : null;

    // By product type (aggregate across currencies)
    const productTypeTotals: Record<string, { total: number; count: number; currencies: Record<string, number> }> = {};
    filteredByProduct.forEach(pt => {
      if (!productTypeTotals[pt.productType]) {
        productTypeTotals[pt.productType] = { total: 0, count: 0, currencies: {} };
      }
      productTypeTotals[pt.productType].total += pt.amount;
      productTypeTotals[pt.productType].count += pt.count;
      productTypeTotals[pt.productType].currencies[pt.currency] =
        (productTypeTotals[pt.productType].currencies[pt.currency] || 0) + pt.amount;
    });

    const byProductType: ProductTypeSummary[] = Object.entries(productTypeTotals)
      .map(([productType, data]) => ({
        productType,
        label: getProductTypeLabel(productType),
        total: data.total,
        count: data.count,
        currencies: Object.entries(data.currencies).map(([currency, amount]) => ({ currency, amount })),
      }))
      .sort((a, b) => b.total - a.total);

    // By currency
    const currencyTotal = filteredByCurrency.reduce((sum, c) => sum + c.credits, 0);
    const byCurrency: CurrencySummary[] = filteredByCurrency
      .map(c => ({
        currency: c.currency,
        total: c.credits,
        count: c.count,
        percentage: currencyTotal > 0 ? (c.credits / currencyTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Top operations
    const topOperations = filteredByRef
      .slice(0, 20)
      .map(ref => ({
        reference: ref.reference,
        productType: getProductTypeLabel(ref.productType),
        currency: ref.currency,
        amount: ref.amount,
        formattedAmount: formatCurrency(ref.amount, ref.currency),
      }));

    // Available accounts for filter (from backend)
    const availableAccounts: AvailableAccount[] = (rawData.availableAccounts || []).map(a => ({
      account: a.account,
      count: a.count,
      total: a.total,
    }));

    return {
      report: rawData,
      totalCommissions,
      totalOperations: uniqueOperations,
      averageCommission,
      monthlyTrend,
      currentMonthTotal,
      previousMonthTotal,
      monthOverMonthChange,
      byProductType,
      byCurrency,
      topOperations,
      periodLabel: getPeriodLabel(filters.period, rawData.startDate, rawData.endDate),
      startDate: rawData.startDate || '',
      endDate: rawData.endDate || '',
      availableAccounts,
    };
  }, [rawData, filters]);

  // Process pending commissions data
  const pendingData = useMemo((): PendingCommissionsData | null => {
    if (!rawPendingData) return null;

    const byCurrency = rawPendingData.byCurrency.map(c => ({
      currency: c.currency,
      balance: c.balance,
      operationCount: c.operationCount,
    }));

    const byProductType = rawPendingData.byProductType.map(pt => ({
      productType: pt.productType,
      label: getProductTypeLabel(pt.productType),
      balance: pt.balance,
      count: pt.count,
    }));

    const topOperations = rawPendingData.operations.slice(0, 20).map(op => ({
      reference: op.reference,
      productType: getProductTypeLabel(op.productType),
      currency: op.currency,
      balance: op.balance,
      formattedAmount: formatCurrency(op.balance, op.currency),
    }));

    return {
      totalPending: rawPendingData.totalPending,
      totalOperations: rawPendingData.totalOperations,
      byCurrency,
      byProductType,
      topOperations,
    };
  }, [rawPendingData]);

  return {
    data,
    pendingData,
    pendingLoading,
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

export default useCommissionsData;
