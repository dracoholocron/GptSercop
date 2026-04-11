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

async function patchJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
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
  entityId: string;
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
  entityName?: string;
  pattern: string;
  contractIds: string[];
  totalAmount: number;
  contractCount: number;
  periodDays?: number;
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

export type EntityOverview = {
  entity: { id: string; name: string; code: string | null; organizationType: string | null };
  totalTenders: number;
  totalContracts: number;
  totalSpend: number;
  avgBidders: number;
  riskDistribution: { high: number; medium: number; low: number };
  openAlerts: number;
};

export type ProviderContractItem = {
  contractId: string;
  contractNo: string;
  amount: number;
  status: string;
  amendmentCount: number;
  healthLevel: string;
  tenderId?: string;
  tenderCode?: string;
  tenderTitle?: string;
  processType?: string;
  entityId?: string;
  entityName?: string;
  signedAt?: string | null;
};

export type ProviderOverview = {
  provider: { id: string; name: string; identifier: string | null; province: string | null; status: string };
  score: {
    complianceScore: number;
    deliveryScore: number;
    priceScore: number;
    diversityScore: number;
    totalScore: number;
    tier: string;
    calculatedAt: string;
  } | null;
  contracts: PaginatedResponse<ProviderContractItem>;
  bidsCount: number;
  neighborCount: number;
};

// ---- Dashboard ----
export const getDashboard = () => fetchJson<DashboardData>(`${BASE}/dashboard`);

// ---- Risk Scores ----
export const getRiskScores = (params?: { level?: string; entityId?: string; processType?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.level) q.set('level', params.level);
  if (params?.entityId) q.set('entityId', params.entityId);
  if (params?.processType) q.set('processType', params.processType);
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
export const getPacVsExecuted = (year?: number, entityId?: string) => {
  const q = new URLSearchParams();
  if (year) q.set('year', String(year));
  if (entityId) q.set('entityId', entityId);
  const qs = q.toString();
  return fetchJson<{ data: PacItem[] }>(`${BASE}/pac-vs-executed${qs ? `?${qs}` : ''}`);
};

// ---- Alerts ----
export const getAlerts = (params?: { severity?: string; resolved?: string; entityId?: string; page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.severity) q.set('severity', params.severity);
  if (params?.resolved) q.set('resolved', params.resolved);
  if (params?.entityId) q.set('entityId', params.entityId);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return fetchJson<PaginatedResponse<AlertItem>>(`${BASE}/alerts?${q}`);
};

export const resolveAlert = (
  alertId: string,
  opts?: { notes?: string; actionTaken?: string; resolvedBy?: string },
) => {
  if (opts && Object.keys(opts).length > 0) {
    return patchJson<{ ok: boolean }>(`${BASE}/alerts/${alertId}/resolve`, opts);
  }
  return patchJson<{ ok: boolean }>(`${BASE}/alerts/${alertId}/resolve`);
};

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

// ---- Entity & Provider Overviews ----
export const getEntityOverview = (entityId: string) =>
  fetchJson<EntityOverview>(`${BASE}/entities/${entityId}/overview`);

export const getProviderOverview = (providerId: string, page?: number, limit?: number) => {
  const q = new URLSearchParams();
  if (page) q.set('page', String(page));
  if (limit) q.set('limit', String(limit));
  const qs = q.toString();
  return fetchJson<ProviderOverview>(`${BASE}/providers/${providerId}/overview${qs ? `?${qs}` : ''}`);
};

// ---- Predictive ----
export const getRiskPrediction = (tenderId: string) =>
  fetchJson<RiskPrediction>(`${BASE}/risk-prediction/${tenderId}`);

// ---- Geographic Analysis ----
export type GeoItem = {
  province: string;
  contractCount: number;
  totalAmount: number;
  entityCount: number;
};
export const getGeoAnalytics = (year?: number) =>
  fetchJson<{ year?: number; data: GeoItem[] }>(`${BASE}/geo${year ? `?year=${year}` : ''}`);

// ---- Process Efficiency ----
export type EfficiencyItem = {
  processType: string;
  count: number;
  avgPublishToBidsDays: number | null;
  avgBidsToAwardDays: number | null;
  cancelledCount: number;
};
export const getProcessEfficiency = (year?: number) =>
  fetchJson<{ year?: number; data: EfficiencyItem[] }>(`${BASE}/process-efficiency${year ? `?year=${year}` : ''}`);

// ---- Savings Analysis ----
export type SavingsItem = {
  groupKey: string;
  count: number;
  totalEstimated: number;
  totalAwarded: number;
  savingsAmount: number;
  savingsPct: number;
};
export const getSavingsAnalysis = (year?: number, groupBy?: 'processType' | 'entity') => {
  const q = new URLSearchParams();
  if (year) q.set('year', String(year));
  if (groupBy) q.set('groupBy', groupBy);
  return fetchJson<{ year?: number; groupBy: string; data: SavingsItem[] }>(`${BASE}/savings?${q}`);
};

// ---- MIPYME Participation ----
export type MipymeItem = {
  category: string;
  providerCount: number;
  contractCount: number;
  totalAmount: number;
  contractPct: number;
  amountPct: number;
};
export const getMipymeAnalytics = (year?: number) =>
  fetchJson<{ year?: number; data: MipymeItem[] }>(`${BASE}/mipyme${year ? `?year=${year}` : ''}`);

// ---- Emergency Contracts ----
export type EmergencyItem = {
  id: string;
  code: string | null;
  title: string;
  status: string;
  estimatedAmount: number | null;
  entityName: string | null;
  entityId: string | null;
  contractAmount: number | null;
  contractStatus: string | null;
  providerName: string | null;
  providerId: string | null;
  createdAt: string;
};
export type EmergencyData = {
  total: number;
  allTendersCount: number;
  emergencyPct: number;
  emergencyAmountTotal: number;
  allAmountTotal: number;
  emergencyAmountPct: number;
  page: number;
  limit: number;
  data: EmergencyItem[];
};
export const getEmergencyContracts = (params?: { page?: number; limit?: number; year?: number }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.year) q.set('year', String(params.year));
  return fetchJson<EmergencyData>(`${BASE}/emergency?${q}`);
};

// ---- Public ----
export const getPublicMarketOverview = () => fetchJson<unknown>(`${PUBLIC_BASE}/market-overview`);
export const getPublicTopProviders = (limit = 10) => fetchJson<unknown>(`${PUBLIC_BASE}/top-providers?limit=${limit}`);
export const getPublicRiskSummary = () => fetchJson<unknown>(`${PUBLIC_BASE}/risk-summary`);

// --- Graph Analytics Types ---

export type GraphOverview = {
  totalProviders: number;
  totalRelations: number;
  totalCommunities: number;
  avgDegree: number;
  networkDensity: number;
  topCommunities: Array<{
    communityId: number;
    memberCount: number;
    totalSharedTenders: number;
    members: Array<{ id: string; name: string; degree: number }>;
  }>;
  riskSummary: {
    highRiskNodes: number;
    collusionCandidates: number;
    isolatedWinners: number;
  };
};

export type CollusionCandidate = {
  clusterId: number;
  members: Array<{ id: string; name: string; province?: string | null }>;
  evidence: {
    sharedTenders: number;
    rotationScore: number;
    bidSimilarityScore: number;
    sameAddress: boolean;
  };
  totalAmount: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'INFO';
};

export type CentralityItem = {
  providerId: string;
  providerName: string;
  province: string | null;
  degree: number;
  pageRank: number;
  betweenness: number;
  contractCount: number;
  totalAmount: number;
};

export type EgoNetwork = {
  center: { id: string; name: string; riskScore?: number };
  nodes: Array<{ id: string; name: string; degree: number; riskLevel?: string }>;
  edges: Array<{ from: string; to: string; sharedTenders: number }>;
};

export type RiskPropagationItem = {
  providerId: string;
  providerName: string;
  ownRiskScore: number;
  networkRiskScore: number;
  connectedHighRisk: number;
  riskIncrease: number;
};

// --- Graph Analytics Functions ---

export async function getGraphOverview(): Promise<GraphOverview> {
  return fetchJson<GraphOverview>(`${BASE}/graph-analytics/overview`);
}

export async function getCollusionCandidates(): Promise<{ data: CollusionCandidate[]; total: number }> {
  return fetchJson<{ data: CollusionCandidate[]; total: number }>(`${BASE}/graph-analytics/collusion`);
}

export async function getCentralityRankings(limit = 50): Promise<{ data: CentralityItem[] }> {
  return fetchJson<{ data: CentralityItem[] }>(`${BASE}/graph-analytics/centrality?limit=${limit}`);
}

export async function getProviderEgoNetwork(providerId: string, maxHops = 2): Promise<EgoNetwork> {
  return fetchJson<EgoNetwork>(`${BASE}/graph-analytics/provider/${providerId}/network?maxHops=${maxHops}`);
}

export async function getRiskPropagation(limit = 50): Promise<{ data: RiskPropagationItem[] }> {
  return fetchJson<{ data: RiskPropagationItem[] }>(`${BASE}/graph-analytics/risk-propagation?limit=${limit}`);
}
