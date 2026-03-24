/**
 * Dashboard Service
 * API calls for Business Intelligence Dashboard
 */

import { get } from '../utils/apiClient';
import { DASHBOARD_ROUTES, CLIENT_PORTAL_CONFIG_ROUTES, buildUrlWithParams } from '../config/api.routes';
import { isClientUser } from '../config/api.client';
import type {
  DashboardSummary,
  DashboardFilters,
  DashboardFilterOptions,
  VolumeByProduct,
  CurrencyDistribution,
  TrendData,
  StatusBreakdown,
  TopClient,
  ActivityHeatmap,
  ExpiryCountdown,
  ProductComparison,
} from '../types/dashboard';

class DashboardService {
  /**
   * Get complete dashboard summary with all KPIs and chart data.
   * Uses client portal endpoint for CLIENT users.
   */
  async getDashboardSummary(filters: DashboardFilters = { period: 'month' }): Promise<DashboardSummary> {
    const params: Record<string, any> = { period: filters.period };
    if (filters.productType) params.productType = filters.productType;
    if (filters.currency) params.currency = filters.currency;
    if (filters.topClientsLimit) params.topClientsLimit = filters.topClientsLimit;
    if (filters.statusFilter) params.statusFilter = filters.statusFilter;
    if (filters.createdBy) params.createdBy = filters.createdBy;
    if (filters.beneficiary) params.beneficiary = filters.beneficiary;
    if (filters.issuingBank) params.issuingBank = filters.issuingBank;
    if (filters.advisingBank) params.advisingBank = filters.advisingBank;
    if (filters.applicant) params.applicant = filters.applicant;
    // SWIFT field search
    if (filters.swiftSearch?.length) params.swiftFieldSearch = JSON.stringify(filters.swiftSearch);
    if (filters.swiftFreeText) params.swiftFreeText = filters.swiftFreeText;
    if (filters.customFieldValue) params.customFieldValue = filters.customFieldValue;
    if (filters.customFieldFilters && Object.keys(filters.customFieldFilters).length > 0) {
      params.customFieldFilters = JSON.stringify(filters.customFieldFilters);
    }

    // Use client portal endpoint for CLIENT users
    const baseUrl = isClientUser()
      ? CLIENT_PORTAL_CONFIG_ROUTES.DASHBOARD_SUMMARY
      : DASHBOARD_ROUTES.SUMMARY;
    const url = buildUrlWithParams(baseUrl, params);
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }
    return response.json();
  }

  /**
   * Get volume by product over time
   */
  async getVolumeByProduct(period: string = 'semester'): Promise<VolumeByProduct[]> {
    const url = buildUrlWithParams(DASHBOARD_ROUTES.VOLUME_BY_PRODUCT, { period });
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch volume by product');
    }
    return response.json();
  }

  /**
   * Get currency distribution
   */
  async getCurrencyDistribution(period: string = 'month', productType?: string): Promise<CurrencyDistribution[]> {
    const params: Record<string, any> = { period };
    if (productType) params.productType = productType;

    const url = buildUrlWithParams(DASHBOARD_ROUTES.CURRENCY_DISTRIBUTION, params);
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch currency distribution');
    }
    return response.json();
  }

  /**
   * Get monthly trend data
   */
  async getMonthlyTrend(months: number = 12): Promise<TrendData[]> {
    const url = buildUrlWithParams(DASHBOARD_ROUTES.TREND, { months });
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly trend');
    }
    return response.json();
  }

  /**
   * Get status breakdown
   */
  async getStatusBreakdown(productType?: string): Promise<StatusBreakdown[]> {
    const params: Record<string, any> = {};
    if (productType) params.productType = productType;

    const url = buildUrlWithParams(DASHBOARD_ROUTES.STATUS_BREAKDOWN, params);
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch status breakdown');
    }
    return response.json();
  }

  /**
   * Get top clients
   */
  async getTopClients(period: string = 'month', limit: number = 10, productType?: string): Promise<TopClient[]> {
    const params: Record<string, any> = { period, limit };
    if (productType) params.productType = productType;

    const url = buildUrlWithParams(DASHBOARD_ROUTES.TOP_CLIENTS, params);
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch top clients');
    }
    return response.json();
  }

  /**
   * Get activity heatmap data
   */
  async getActivityHeatmap(days: number = 90): Promise<ActivityHeatmap[]> {
    const url = buildUrlWithParams(DASHBOARD_ROUTES.ACTIVITY_HEATMAP, { days });
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch activity heatmap');
    }
    return response.json();
  }

  /**
   * Get upcoming expiries
   */
  async getUpcomingExpiries(productType?: string): Promise<ExpiryCountdown[]> {
    const params: Record<string, any> = {};
    if (productType) params.productType = productType;

    const url = buildUrlWithParams(DASHBOARD_ROUTES.UPCOMING_EXPIRIES, params);
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch upcoming expiries');
    }
    return response.json();
  }

  /**
   * Get product comparison
   */
  async getProductComparison(period: string = 'month'): Promise<ProductComparison[]> {
    const url = buildUrlWithParams(DASHBOARD_ROUTES.PRODUCT_COMPARISON, { period });
    const response = await get(url);
    if (!response.ok) {
      throw new Error('Failed to fetch product comparison');
    }
    return response.json();
  }

  /**
   * Get available filter options.
   * Uses client portal endpoint for CLIENT users.
   */
  async getFilterOptions(): Promise<DashboardFilterOptions> {
    // Use client portal endpoint for CLIENT users
    const endpoint = isClientUser()
      ? CLIENT_PORTAL_CONFIG_ROUTES.DASHBOARD_FILTERS
      : DASHBOARD_ROUTES.FILTERS;
    const response = await get(endpoint);
    if (!response.ok) {
      throw new Error('Failed to fetch filter options');
    }
    return response.json();
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
