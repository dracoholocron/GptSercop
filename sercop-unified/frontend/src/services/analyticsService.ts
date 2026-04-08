/**
 * Analytics Service – API calls for SERCOP analytics module.
 * Uses Vite proxy (/api → Node.js backend).
 */
const BASE = '/api/v1/analytics';
const PUBLIC_BASE = '/api/v1/public/analytics';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('globalcmx_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function patchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'PATCH', headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export type DashboardData = {
  totalTenders: number;
  totalContracts: number;
  totalProviders: number;
  totalEntities: number;
  totalContractAmount: number;
  avgBidders: number;
  riskDistribution: { high: number; medium: number; low: number };
  openAlerts: number;
};

export type RiskScoreItem = {
  id: string;
  tenderId: string;
  totalScore: number;
  riskLevel: string;
  flags: string[];
  competitionRisk: number;
  priceRisk: number;
  supplierRisk: number;
  processRisk: number;
  executionRisk: number;
  calculatedAt: string;
  tender?: { id: string; code: string; title: string; processType: string; procurementPlan?: { entity?: { id: string; name: string } } };
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type AlertItem = {
  id: string;
  alertType: string;
  severity: string;
  entityType: string;
  entityId: string;
  message: string;
  metadata: unknown;
  resolvedAt: string | null;
  createdAt: string;
};

export type CompetitionData = {
  avgBidders: number;
  bySector: Array<{
    processType: string;
    tenderCount: number;
    singleBidderCount: number;
    avgBidders: number;
    singleBidderPct: number;
  }>;
  hhiByEntity: Array<{ entityName: string; hhi: number }>;
};

export type MarketItem = {
  entityName?: string;
  province?: string;
  processType?: string;
  contractCount?: number;
  tenderCount?: number;
  totalAmount: number;
  avgAmount?: number;
  providerCount?: number;
};

export type PacItem = {
  entityName: string;
  planned: number;
  executed: number;
  plannedAmount: number;
  executedAmount: number;
  executionRate: number;
  deviation: number;
};

export type ProviderScoreItem = {
  id: string;
  providerId: string;
  complianceScore: number;
  deliveryScore: number;
  priceScore: number;
  diversityScore: number;
  totalScore: number;
  tier: string;
  provider?: { id: string; name: string; identifier: string; province: string };
};

export type PriceIndexItem = {
  processType: string;
  entityName: string;
  avgContractPrice: number;
  nationalAvg: number;
  deviation: number;
  contractCount: number;
};

export type PriceAnomalyItem = {
  tenderId: string;
  tenderCode: string;
  entityName: string;
  contractAmount: number;
  nationalAvg: number;
  deviationPct: number;
  processType: string;
};

export type ContractHealthItem = {
  contractId: string;
  contractNo: string;
  providerName: string;
  entityName: string;
  amount: number;
  status: string;
  amendmentCount: number;
  durationDays: number | null;
  healthLevel: string;
};

export type AmendmentPatternItem = {
  entityName: string;
  totalContracts: number;
  contractsWithAmendments: number;
  totalAmendments: number;
  amendmentRate: number;
};

export type FragmentationAlertItem = {
  id: string;
  entityId: string;
  pattern: string;
  contractIds: string[];
  totalAmount: number;
  contractCount: number;
  severity: string;
  resolvedAt: string | null;
  createdAt: string;
};

export type NetworkData = {
  nodes: Array<{ id: string; name: string; contractCount: number; totalAmount: number }>;
  edges: Array<{ source: string; target: string; sharedTenders: number }>;
};

export type RiskPrediction = {
  tenderId: string;
  predictedScore: number;
  predictedLevel: string;
  factors: Record<string, number>;
  confidence: number;
};

// ---- Dashboard ----
export const getDashboard = () => fetchJson<DashboardData>(`${BASE}/dashboard`);

// ---- Risk Scores ----
export const getRiskScores = (params?: { level?: string; entityId?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.level) q.set('level', params.level);
  if (params?.entityId) q.set('entityId', params.entityId);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return fetchJson<PaginatedResponse<RiskScoreItem>>(`${BASE}/risk-scores?${q}`);
};

export const computeRisk = (tenderId: string) => postJson<RiskScoreItem>(`${BASE}/compute-risk/${tenderId}`);

// ---- Competition ----
export const getCompetition = (year?: number) =>
  fetchJson<CompetitionData>(`${BASE}/competition${year ? `?year=${year}` : ''}`);

// ---- Market ----
export const getMarket = (groupBy = 'entity', year?: number) => {
  const q = new URLSearchParams({ groupBy });
  if (year) q.set('year', String(year));
  return fetchJson<{ data: MarketItem[] }>(`${BASE}/market?${q}`);
};

// ---- PAC ----
export const getPacVsExecuted = (year?: number) =>
  fetchJson<{ data: PacItem[] }>(`${BASE}/pac-vs-executed${year ? `?year=${year}` : ''}`);

// ---- Alerts ----
export const getAlerts = (params?: { severity?: string; resolved?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.severity) q.set('severity', params.severity);
  if (params?.resolved) q.set('resolved', params.resolved);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return fetchJson<PaginatedResponse<AlertItem>>(`${BASE}/alerts?${q}`);
};

export const resolveAlert = (alertId: string) => patchJson<{ ok: boolean }>(`${BASE}/alerts/${alertId}/resolve`);

// ---- Provider Network ----
export const getProviderNetwork = (minShared = 2) =>
  fetchJson<NetworkData>(`${BASE}/provider-network?minShared=${minShared}`);

export const getProviderNeighbors = (providerId: string) =>
  fetchJson<{ data: Array<{ providerId: string; name: string; sharedTenders: number }> }>(
    `${BASE}/provider-network/${providerId}/neighbors`,
  );

// ---- Provider Scores ----
export const getProviderScores = (params?: { page?: number; limit?: number; tier?: string }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.tier) q.set('tier', params.tier);
  return fetchJson<PaginatedResponse<ProviderScoreItem>>(`${BASE}/provider-scores?${q}`);
};

export const computeProviderScore = (providerId: string) =>
  postJson<ProviderScoreItem>(`${BASE}/compute-provider-score/${providerId}`);

// ---- Price Index ----
export const getPriceIndex = (year?: number, processType?: string) => {
  const q = new URLSearchParams();
  if (year) q.set('year', String(year));
  if (processType) q.set('processType', processType);
  return fetchJson<{ data: PriceIndexItem[] }>(`${BASE}/price-index?${q}`);
};

export const getPriceAnomalies = (year?: number, threshold?: number) => {
  const q = new URLSearchParams();
  if (year) q.set('year', String(year));
  if (threshold) q.set('threshold', String(threshold));
  return fetchJson<{ data: PriceAnomalyItem[] }>(`${BASE}/price-anomalies?${q}`);
};

// ---- Contract Health ----
export const getContractHealth = (params?: { page?: number; limit?: number; healthLevel?: string }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.healthLevel) q.set('healthLevel', params.healthLevel);
  return fetchJson<PaginatedResponse<ContractHealthItem>>(`${BASE}/contract-health?${q}`);
};

export const getAmendmentPatterns = (year?: number) =>
  fetchJson<{ data: AmendmentPatternItem[] }>(`${BASE}/amendment-patterns${year ? `?year=${year}` : ''}`);

// ---- Fragmentation ----
export const getFragmentationAlerts = (params?: { page?: number; limit?: number; severity?: string }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.severity) q.set('severity', params.severity);
  return fetchJson<PaginatedResponse<FragmentationAlertItem>>(`${BASE}/fragmentation-alerts?${q}`);
};

// ---- Predictive ----
export const getRiskPrediction = (tenderId: string) =>
  fetchJson<RiskPrediction>(`${BASE}/risk-prediction/${tenderId}`);

// ---- Public ----
export const getPublicMarketOverview = () => fetchJson<unknown>(`${PUBLIC_BASE}/market-overview`);
export const getPublicTopProviders = (limit = 10) => fetchJson<unknown>(`${PUBLIC_BASE}/top-providers?limit=${limit}`);
export const getPublicRiskSummary = () => fetchJson<unknown>(`${PUBLIC_BASE}/risk-summary`);
