/**
 * Dashboard Types
 * TypeScript types for Business Intelligence Dashboard
 */

export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';
export type ClientTrendDirection = 'STRONG_UP' | 'UP' | 'STABLE' | 'DOWN' | 'STRONG_DOWN';
export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface KPICard {
  label: string;
  value: string;
  formattedValue: string;
  numericValue: number;
  currency?: string;
  changePercent: number;
  changeLabel: string;
  trend: TrendDirection;
  icon: string;
  color: string;
}

export interface VolumeByProduct {
  period: string;
  periodLabel: string;
  // Legacy fields for backwards compatibility
  lcImport: number;
  lcExport: number;
  guarantee: number;
  collection: number;
  total: number;
  lcImportCount: number;
  lcExportCount: number;
  guaranteeCount: number;
  collectionCount: number;
  // Dynamic product volumes - key is productType (e.g., "LC_IMPORT", "GUARANTEE_ISSUED")
  productVolumes?: Record<string, number>;
  // Dynamic product counts - key is productType
  productCounts?: Record<string, number>;
}

export interface CurrencyDistribution {
  currency: string;
  amount: number;
  percentage: number;
  operationCount: number;
  color: string;
}

export interface TrendData {
  month: string;
  monthLabel: string;
  year: number;
  volume: number;
  operationCount: number;
  newClients: number;
  avgOperationSize: number;
}

export interface StatusBreakdown {
  status: string;
  statusLabel: string;
  count: number;
  percentage: number;
  volume: number;
  color: string;
}

export interface TopClient {
  clientId: number;
  clientName: string;
  clientType: 'APPLICANT' | 'BENEFICIARY';
  totalVolume: number;
  primaryCurrency: string;
  operationCount: number;
  preferredProduct: string;
  trend: ClientTrendDirection;
  activityScore: number;
  changePercent: number;
  lastActivityDate: string;
}

export interface ActivityHeatmap {
  date: string;
  dayOfWeek: number;
  weekNumber: number;
  operationCount: number;
  level: number; // 0-4
  tooltip: string;
}

export interface ExpiryProductBreakdown {
  productType: string;
  productLabel: string;
  count: number;
  volume: number;
  color: string;
}

export interface ExpiryCountdown {
  range: string;
  rangeLabel: string;
  count: number;
  totalVolume: number;
  urgencyLevel: UrgencyLevel;
  color: string;
  productBreakdown?: ExpiryProductBreakdown[];
}

export interface ProductComparison {
  productType: string;
  productLabel: string;
  totalOperations: number;
  activeOperations: number;
  totalVolume: number;
  pendingBalance: number;  // Saldo pendiente calculado desde GLE
  avgOperationSize: number;
  volumePercentage: number;
  uniqueClients: number;
  growthPercent: number;
  color: string;
  icon: string;
}

export interface UserActivity {
  username: string;
  fullName?: string;
  operationsToday: number;
  operationsThisWeek: number;
  operationsThisMonth: number;
  volumeThisMonth: number;
  lastActivityDate: string;
  mostUsedProduct: string;
}

export interface UserActivitySummary {
  totalOperationsToday: number;
  totalOperationsPeriod: number;
  totalVolumePeriod: number;
  totalActiveUsers: number;
  users: UserActivity[];
}

export interface DashboardSummary {
  // KPI Cards
  volumeByC: KPICard[];  // Volume KPIs per currency
  operationsByC: KPICard[];  // Operations KPIs per currency
  clientsByC: KPICard[];  // Active clients KPIs per currency
  operationsToday: KPICard;
  pendingApprovals: KPICard;
  operationsWithAlerts: KPICard;

  // Chart Data
  volumeByProduct: VolumeByProduct[];
  currencyDistribution: CurrencyDistribution[];
  monthlyTrend: TrendData[];
  statusBreakdown: StatusBreakdown[];
  topClients: TopClient[];
  activityHeatmap: ActivityHeatmap[];
  upcomingExpiries: ExpiryCountdown[];
  productComparison: ProductComparison[];
  userActivity: UserActivitySummary;

  // Metadata
  lastUpdated: string;
  periodLabel: string;
}

export interface SwiftSearchCondition {
  field: string;       // Field code without colons (e.g., "20", "32B", "59")
  op: 'contains' | 'equals' | 'startsWith';
  value: string;
  fieldLabel?: string; // Display label for chip (e.g., "Beneficiario")
}

export interface DashboardFilters {
  period: string;
  productType?: string;
  currency?: string;
  topClientsLimit?: number;
  statusFilter?: string; // OPEN, CLOSED, ALL
  // Advanced filters
  createdBy?: string;
  beneficiary?: string;
  issuingBank?: string;
  advisingBank?: string;
  applicant?: string;
  // SWIFT field search
  swiftSearch?: SwiftSearchCondition[];
  swiftFreeText?: string;
  customFieldValue?: string;
  // Extended custom field filters
  customFieldFilters?: Record<string, string>;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface CustomFieldConfigOption {
  fieldCode: string;
  fieldNameKey: string;
  componentType: string;
  fieldOptions: string;
  dataSourceCode?: string;
  stepNameKey?: string;
  productType?: string;
}

export interface DashboardFilterOptions {
  periods: FilterOption[];
  productTypes: FilterOption[];
  currencies: string[];
  statusFilters: FilterOption[];
  // Advanced filter options
  createdByOptions: string[];
  beneficiaryOptions: string[];
  issuingBankOptions: string[];
  advisingBankOptions: string[];
  applicantOptions: string[];
  // Custom field configs for extended filters
  customFieldConfigs?: CustomFieldConfigOption[];
}
