/**
 * @sercop/api-client – Cliente API SERCOP V2 (Fase 3)
 */

export type Tender = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  publishedAt?: string | null;
};

export type Provider = {
  id: string;
  name: string;
  identifier?: string | null;
  status: string;
  legalName?: string | null;
  tradeName?: string | null;
  province?: string | null;
  canton?: string | null;
  address?: string | null;
};

export type PacPlan = {
  id: string;
  entityId: string;
  year: number;
  status: string;
  totalAmount?: number;
};

export type RagSearchResult = {
  id: string;
  title: string;
  snippet: string;
  source: string;
  document_type?: string;
};

export type RagAskResponse = {
  answer: string;
  sources: Array<{ title: string; id: string }>;
};

let baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3080';
let token: string | null = null;

export function setBaseUrl(url: string): void {
  baseUrl = url.replace(/\/$/, '');
}

export function setToken(t: string | null): void {
  token = t;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: HeadersInit = { ...(options.headers as Record<string, string>) };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status}`);
  return text ? (JSON.parse(text) as T) : (null as T);
}

export type TenderFilters = {
  entityId?: string;
  method?: string;
  minAmount?: number;
  maxAmount?: number;
  year?: number;
  page?: number;
  pageSize?: number;
};

export type GetTendersResponse = {
  data: Tender[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export const api = {
  async getTenders(filters?: TenderFilters): Promise<GetTendersResponse> {
    const params = new URLSearchParams();
    if (filters?.entityId) params.set('entityId', filters.entityId);
    if (filters?.method) params.set('method', filters.method);
    if (filters?.minAmount != null) params.set('minAmount', String(filters.minAmount));
    if (filters?.maxAmount != null) params.set('maxAmount', String(filters.maxAmount));
    if (filters?.year != null) params.set('year', String(filters.year));
    if (filters?.page != null) params.set('page', String(filters.page));
    if (filters?.pageSize != null) params.set('pageSize', String(filters.pageSize));
    const q = params.toString();
    return request<GetTendersResponse>(`/api/v1/tenders${q ? `?${q}` : ''}`);
  },
  async getTender(id: string): Promise<Tender & { procurementPlan?: unknown }> {
    return request(`/api/v1/tenders/${id}`);
  },
  async getProviders(params?: { identifier?: string }): Promise<{ data: Provider[] }> {
    const q = params?.identifier ? `?identifier=${encodeURIComponent(params.identifier)}` : '';
    return request<{ data: Provider[] }>(`/api/v1/providers${q}`);
  },
  async getProvider(id: string): Promise<Provider> {
    return request(`/api/v1/providers/${id}`);
  },
  async getProviderBids(providerId: string): Promise<{ data: Array<Record<string, unknown>> }> {
    return request(`/api/v1/providers/${providerId}/bids`);
  },
  async getPac(params?: { entityId?: string; year?: number }): Promise<{ data: PacPlan[] }> {
    const q = new URLSearchParams();
    if (params?.entityId) q.set('entityId', params.entityId);
    if (params?.year != null) q.set('year', String(params.year));
    const query = q.toString();
    return request<{ data: PacPlan[] }>(`/api/v1/pac${query ? `?${query}` : ''}`);
  },
  async getPacById(id: string): Promise<Record<string, unknown>> {
    return request(`/api/v1/pac/${id}`);
  },
  async createProvider(data: { name: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string }): Promise<Provider> {
    return request('/api/v1/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async updateProvider(id: string, data: { name?: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string; status?: string }): Promise<Provider> {
    return request(`/api/v1/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async createBid(tenderId: string, data: { providerId: string; amount?: number }): Promise<unknown> {
    return request(`/api/v1/tenders/${tenderId}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getTenderBids(tenderId: string): Promise<{ data: unknown[] }> {
    return request(`/api/v1/tenders/${tenderId}/bids`);
  },
  async createContract(tenderId: string, data: { providerId: string; contractNo?: string; amount?: number }): Promise<unknown> {
    return request(`/api/v1/tenders/${tenderId}/contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async createTender(data: { procurementPlanId: string; title: string; description?: string }): Promise<unknown> {
    return request('/api/v1/tenders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async updateTender(id: string, data: { title?: string; description?: string; status?: string }): Promise<unknown> {
    return request(`/api/v1/tenders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async createPac(data: { entityId: string; year: number; totalAmount?: number }): Promise<unknown> {
    return request('/api/v1/pac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async updatePac(id: string, data: { status?: string; totalAmount?: number }): Promise<unknown> {
    return request(`/api/v1/pac/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getAnalyticsPublic(): Promise<{ tenders: number; tendersPublished: number; providers: number; contracts: number }> {
    return request('/api/v1/analytics/public');
  },
  async getAudit(params?: { limit?: number; offset?: number; action?: string; entityType?: string }): Promise<{ data: unknown[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.action) q.set('action', params.action);
    if (params?.entityType) q.set('entityType', params.entityType);
    return request(`/api/v1/audit${q.toString() ? `?${q}` : ''}`);
  },
  async getUsers(params?: { limit?: number; offset?: number; organizationId?: string }): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.organizationId) q.set('organizationId', params.organizationId);
    return request(`/api/v1/users${q.toString() ? `?${q}` : ''}`);
  },
  async getEntities(): Promise<{ data: Array<{ id: string; name: string; code?: string | null }> }> {
    return request('/api/v1/entities');
  },
  async getEntity(id: string): Promise<Record<string, unknown>> {
    return request(`/api/v1/entities/${id}`);
  },
  async createEntity(data: { name: string; code?: string; legalName?: string; organizationType?: string }): Promise<Record<string, unknown>> {
    return request('/api/v1/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async updateEntity(id: string, data: { name?: string; code?: string; legalName?: string; organizationType?: string }): Promise<Record<string, unknown>> {
    return request(`/api/v1/entities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getTenderEvaluations(tenderId: string): Promise<{ data: unknown[] }> {
    return request(`/api/v1/tenders/${tenderId}/evaluations`);
  },
  async createEvaluation(tenderId: string, data: { bidId: string; technicalScore?: number; financialScore?: number; totalScore?: number; status?: string }): Promise<unknown> {
    return request(`/api/v1/tenders/${tenderId}/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async login(email: string, role?: string, identifier?: string, entityId?: string): Promise<{ token: string; expiresIn: number; providerId?: string | null; entityId?: string | null }> {
    return request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, identifier, entityId }),
    });
  },
  rag: {
    async search(q: string, limit?: number): Promise<{ results: RagSearchResult[] }> {
      const params = new URLSearchParams({ q });
      if (limit != null) params.set('limit', String(limit));
      return request(`/api/v1/rag/search?${params}`);
    },
    async ask(question: string): Promise<RagAskResponse> {
      return request('/api/v1/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
    },
    async getChunks(params?: { limit?: number; offset?: number; source?: string; documentType?: string }): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
      const q = new URLSearchParams();
      if (params?.limit != null) q.set('limit', String(params.limit));
      if (params?.offset != null) q.set('offset', String(params.offset));
      if (params?.source) q.set('source', params.source);
      if (params?.documentType) q.set('documentType', params.documentType);
      return request(`/api/v1/rag/chunks${q.toString() ? `?${q}` : ''}`);
    },
    async getChunk(id: string): Promise<Record<string, unknown>> {
      return request(`/api/v1/rag/chunks/${id}`);
    },
    async createChunk(data: { title: string; content: string; source: string; documentType: string; url?: string; date?: string; jurisdiction?: string; version?: string }): Promise<Record<string, unknown>> {
      return request('/api/v1/rag/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    async updateChunk(id: string, data: { title?: string; content?: string; source?: string; documentType?: string; url?: string; date?: string; jurisdiction?: string; version?: string }): Promise<Record<string, unknown>> {
      return request(`/api/v1/rag/chunks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    async deleteChunk(id: string): Promise<void> {
      await request(`/api/v1/rag/chunks/${id}`, { method: 'DELETE' });
    },
  },
};
