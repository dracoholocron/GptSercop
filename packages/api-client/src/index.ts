/**
 * @sercop/api-client – Cliente API SERCOP V2 (Fase 3)
 */

export type Tender = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  publishedAt?: string | null;
  procurementMethod?: string | null;
  processType?: string | null;
  regime?: string | null;
  territoryPreference?: string | null; // ninguna | amazonia | galapagos
  isRestrictedVisibility?: boolean;
  estimatedAmount?: number | null;
  minimumQuotes?: number | null;
  marketStudyDocumentId?: string | null;
  liberationRequestedAt?: string | null;
  liberationApprovedAt?: string | null;
  liberationDocumentId?: string | null;
  contingencyPlanDocumentId?: string | null;
  referenceBudgetAmount?: number | null;
  questionsDeadlineAt?: string | null;
  bidsDeadlineAt?: string | null;
  clarificationResponseDeadlineAt?: string | null;
  convalidationRequestDeadlineAt?: string | null;
  convalidationResponseDeadlineAt?: string | null;
  scoringDeadlineAt?: string | null;
  awardResolutionDeadlineAt?: string | null;
  responsibleType?: string | null; // commission | delegate
  electronicSignatureRequired?: boolean;
  bidsOpenedAt?: string | null;
  bidOpeningActDocumentId?: string | null;
  claimWindowDays?: number | null;
  procurementPlan?: { year?: number; entity?: { name?: string; code?: string | null } };
};

export type Bid = {
  id: string;
  tenderId: string;
  providerId: string;
  amount?: number | null;
  baePercentage?: number | null;
  nationalParticipation?: boolean | null;
  inabilityDeclarationAt?: string | null;
  baeVerifiedAt?: string | null;
  nationalParticipationVerifiedAt?: string | null;
  convalidationRequestedAt?: string | null;
  convalidationRespondedAt?: string | null;
  convalidationStatus?: string | null; // pending | accepted | rejected
  convalidationErrorsDescription?: string | null;
  convalidationResponse?: string | null;
  rupVerifiedAtOpening?: string | null;
  rupVerifiedAtAward?: string | null;
  rupVerifiedAtContract?: string | null;
  sanctionedUntil?: string | null;
  invitationType?: string | null; // invited | self_invited
  status: string;
  submittedAt?: string | null;
  provider?: { id: string; name: string; identifier?: string | null };
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
  activityCodes?: string[];
  registrationStep?: number;
  registrationData?: Record<string, unknown>;
  legalEstablishmentDate?: string | null;
  patrimonyAmount?: number | null;
};

// ---- Analytics types ----
export type RiskScore = {
  id: string;
  tenderId: string;
  competitionRisk: number;
  priceRisk: number;
  supplierRisk: number;
  processRisk: number;
  executionRisk: number;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  calculatedAt: string;
  tender?: {
    id: string;
    code?: string | null;
    title: string;
    processType?: string | null;
    procurementPlan?: { entity?: { id: string; name: string } | null } | null;
  };
};

export type AlertEvent = {
  id: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  entityType: string;
  entityId: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  resolvedAt?: string | null;
  createdAt: string;
};

export type MarketStats = {
  entityId?: string;
  entityName?: string;
  entityCode?: string;
  province?: string;
  processType?: string;
  contractCount: number;
  tenderCount?: number;
  totalAmount: number;
  avgAmount?: number;
  providerCount?: number;
};

export type Catalog = {
  id: string;
  entityId?: string | null;
  catalogType?: string; // electronico | dinamico_inclusivo
  name: string;
  description?: string | null;
  status: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  entity?: { id: string; name: string; code?: string | null };
  items?: CatalogItem[];
};

export type CatalogItem = {
  id: string;
  catalogId: string;
  tenderId?: string | null;
  cpcCode?: string | null;
  name: string;
  description?: string | null;
  unit?: string | null;
  referencePrice?: number | null;
  status: string;
};

export type PurchaseOrder = {
  id: string;
  entityId: string;
  catalogId?: string | null;
  tenderId?: string | null;
  orderNo?: string | null;
  status: string;
  totalAmount?: number | null;
  orderedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  entity?: { id: string; name: string; code?: string | null };
  catalog?: { id: string; name: string };
  tender?: { id: string; title: string };
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

export type GptSercopCitation = {
  id: string;
  title: string;
  source: string;
  snippet?: string | null;
};

export type GptSercopAnalysis = {
  contractVersion: 'gptsercop.analysis.v1' | string;
  mode: 'deterministic' | 'hybrid';
  isFallback: boolean;
  fallbackReason?: 'AI_DISABLED' | 'AI_MODE_DETERMINISTIC' | 'AI_ERROR' | 'RAG_DISABLED' | 'RAG_ERROR';
  summary: string;
  confidence: number;
  riskFlags: string[];
  recommendations: string[];
  citations: GptSercopCitation[];
  process?: {
    id: string;
    title: string;
    status?: string;
    entity?: { name?: string; code?: string | null } | null;
  } | null;
};

export type OfferDraft = {
  id: string;
  processId: string;
  tenderId?: string | null;
  providerId: string;
  modality: string;
  status: string;
  stepData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type OfferReceipt = {
  folio: string;
  submittedAt: string;
  manifestHash: string;
};

export type Offer = {
  id: string;
  processId: string;
  tenderId?: string | null;
  providerId: string;
  draftId?: string | null;
  status: string;
  receiptFolio: string;
  manifestHash: string;
  submittedAt: string;
  createdAt: string;
};

export type OfferClarification = {
  id: string;
  offerId: string;
  status: string;
  subject: string;
  message: string;
  response?: string | null;
  requestedAt: string;
  respondedAt?: string | null;
};

export type Complaint = {
  id: string;
  tenderId?: string | null;
  entityId?: string | null;
  providerId?: string | null;
  channel: string;
  category: string;
  status: string;
  summary: string;
  details?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProcessClaim = {
  id: string;
  tenderId: string;
  providerId: string;
  kind: string;
  status: string;
  subject: string;
  message: string;
  response?: string | null;
  createdAt: string;
  updatedAt: string;
  tender?: { id: string; title: string; status: string };
  provider?: { id: string; name: string; identifier?: string | null };
};

export type TenderClarification = {
  id: string;
  tenderId: string;
  askedByProviderId?: string | null;
  status: string;
  question: string;
  answer?: string | null;
  askedAt: string;
  answeredAt?: string | null;
  askedByProvider?: { id: string; name: string; identifier?: string | null } | null;
};

export type Contract = {
  id: string;
  tenderId: string;
  providerId: string;
  contractNo?: string | null;
  status: string;
  amount?: number | null;
  signedAt?: string | null;
  administratorName?: string | null;
  administratorEmail?: string | null;
  administratorDesignatedAt?: string | null;
  administratorObjectionAt?: string | null;
  administratorObjectionReason?: string | null;
  terminatedAt?: string | null;
  suspendedAt?: string | null;
  terminationCause?: string | null;
  suspensionCause?: string | null;
  disputeDeadlineDays?: number | null;
  resultReportDocumentId?: string | null;
  awardPublishedAt?: string | null;
  provider?: { id: string; name: string; identifier?: string | null };
};

export type ContractPayment = {
  id: string;
  contractId: string;
  sequenceNo: number;
  status: string;
  amount: number;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PresignDocumentResponse = {
  uploadUrl: string;
  storageKey: string;
};

export type OfferDocument = {
  id: string;
  offerId?: string | null;
  draftId?: string | null;
  docType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hash: string;
  storageKey: string;
  createdAt: string;
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

/** Subir documento (multipart). Devuelve el documento creado con id. */
export async function uploadDocument(params: { ownerType: string; ownerId: string; documentType?: string; file: File }): Promise<{ id: string }> {
  const path = '/api/v1/documents/upload';
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const form = new FormData();
  form.append('ownerType', params.ownerType);
  form.append('ownerId', params.ownerId);
  if (params.documentType) form.append('documentType', params.documentType);
  form.append('file', params.file, params.file.name);
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status}`);
  const data = text ? (JSON.parse(text) as { id: string }) : { id: '' };
  return data;
}

export type TenderFilters = {
  entityId?: string;
  method?: string;
  processType?: string;
  regime?: string;
  territoryPreference?: string; // ninguna | amazonia | galapagos
  isRestrictedVisibility?: boolean;
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
  async getOfferFormConfig(processId: string): Promise<Record<string, unknown>> {
    return request(`/api/v1/processes/${processId}/offer-form-config`);
  },
  async putOfferFormConfig(processId: string, data: { modality: string; version?: string; config: Record<string, unknown> }): Promise<Record<string, unknown>> {
    return request(`/api/v1/processes/${processId}/offer-form-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async createOfferDraft(data: { processId: string; tenderId?: string; providerId: string; modality?: string }): Promise<OfferDraft> {
    return request('/api/v1/offers/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getOfferDraft(id: string): Promise<OfferDraft> {
    return request(`/api/v1/offers/drafts/${id}`);
  },
  async patchOfferDraft(id: string, data: { stepData?: Record<string, unknown>; status?: string }): Promise<OfferDraft> {
    return request(`/api/v1/offers/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async validateOfferDraft(id: string): Promise<{ ok: boolean; status: string }> {
    return request(`/api/v1/offers/${id}/validate`, { method: 'POST' });
  },
  async signStart(id: string): Promise<{ signSessionId: string; status: string; challenge?: unknown }> {
    return request(`/api/v1/offers/${id}/sign/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'STUB' }),
    });
  },
  async signComplete(id: string, data: { signSessionId: string; action?: string }): Promise<Record<string, unknown>> {
    return request(`/api/v1/offers/${id}/sign/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async otpSend(id: string, data: { channel: 'SMS' | 'EMAIL'; destination: string }): Promise<Record<string, unknown>> {
    return request(`/api/v1/offers/${id}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async otpVerify(id: string, data: { otpSessionId: string; code: string }): Promise<Record<string, unknown>> {
    return request(`/api/v1/offers/${id}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async submitOfferDraft(id: string, data?: { declareNoInability?: boolean; invitationType?: 'self_invited' | 'invited' }): Promise<{ status: string; receipt: OfferReceipt }> {
    return request(`/api/v1/offers/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ?? {}),
    });
  },
  async documentsPresign(data: { draftId?: string; offerId?: string; docType: string; fileName: string; mimeType: string; sizeBytes: number }): Promise<PresignDocumentResponse> {
    return request('/api/v1/documents/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async documentsCommit(data: { draftId?: string; offerId?: string; docType: string; fileName: string; mimeType: string; sizeBytes: number; hash: string; storageKey: string }): Promise<OfferDocument> {
    return request('/api/v1/documents/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async listOfferDocuments(params: { draftId?: string; offerId?: string }): Promise<{ data: OfferDocument[] }> {
    const q = new URLSearchParams();
    if (params.draftId) q.set('draftId', params.draftId);
    if (params.offerId) q.set('offerId', params.offerId);
    return request(`/api/v1/offer-documents?${q}`);
  },
  sie: {
    async status(tenderId: string, providerId?: string): Promise<Record<string, unknown>> {
      const q = new URLSearchParams();
      if (providerId) q.set('providerId', providerId);
      return request(`/api/v1/sie/${tenderId}/status${q.toString() ? `?${q}` : ''}`);
    },
    async submitInitial(tenderId: string, data: { providerId: string; amount: number }): Promise<Record<string, unknown>> {
      return request(`/api/v1/sie/${tenderId}/initial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    async placeBid(tenderId: string, data: { providerId: string; amount: number }): Promise<Record<string, unknown>> {
      return request(`/api/v1/sie/${tenderId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    async submitNegotiationFinal(tenderId: string, data: { providerId: string; amount: number }): Promise<Record<string, unknown>> {
      return request(`/api/v1/sie/${tenderId}/negotiation/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  },
  async listOffers(params: { processId?: string; tenderId?: string; status?: string; providerId?: string }): Promise<{ data: Offer[] }> {
    const q = new URLSearchParams();
    if (params.processId) q.set('processId', params.processId);
    if (params.tenderId) q.set('tenderId', params.tenderId);
    if (params.status) q.set('status', params.status);
    if (params.providerId) q.set('providerId', params.providerId);
    return request(`/api/v1/offers?${q}`);
  },
  async setOfferStatus(offerId: string, status: string): Promise<Offer> {
    return request(`/api/v1/offers/${offerId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },
  async listOfferClarifications(offerId: string): Promise<{ data: OfferClarification[] }> {
    return request(`/api/v1/offers/${offerId}/clarifications`);
  },
  async requestOfferClarification(offerId: string, data: { subject: string; message: string }): Promise<OfferClarification> {
    return request(`/api/v1/offers/${offerId}/clarifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async respondOfferClarification(offerId: string, clarificationId: string, response: string): Promise<OfferClarification> {
    return request(`/api/v1/offers/${offerId}/clarifications/${clarificationId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    });
  },
  async getTenders(filters?: TenderFilters): Promise<GetTendersResponse> {
    const params = new URLSearchParams();
    if (filters?.entityId) params.set('entityId', filters.entityId);
    if (filters?.method) params.set('method', filters.method);
    if (filters?.processType) params.set('processType', filters.processType);
    if (filters?.regime) params.set('regime', filters.regime);
    if (filters?.territoryPreference) params.set('territoryPreference', filters.territoryPreference);
    if (filters?.isRestrictedVisibility !== undefined) params.set('isRestrictedVisibility', String(filters.isRestrictedVisibility));
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
  async analyzeProcurement(data: { tenderId?: string; question?: string }): Promise<GptSercopAnalysis> {
    return request('/api/v1/gptsercop/analyze-procurement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
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
  async updateProvider(
    id: string,
    data: {
      name?: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string; status?: string;
      registrationStep?: number; registrationData?: Record<string, unknown>; activityCodes?: string[];
      legalEstablishmentDate?: string | null; patrimonyAmount?: number | null;
    }
  ): Promise<Provider> {
    return request(`/api/v1/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getCpcSuggestions(params?: { q?: string; limit?: number }): Promise<{ data: Array<{ code: string; description: string }> }> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString();
    return request(`/api/v1/cpc/suggestions${query ? `?${query}` : ''}`);
  },
  async listCatalogs(params?: { entityId?: string; status?: string; page?: number; pageSize?: number }): Promise<{ data: Catalog[]; total: number; page: number; pageSize: number }> {
    const q = new URLSearchParams();
    if (params?.entityId) q.set('entityId', params.entityId);
    if (params?.status) q.set('status', params.status);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.pageSize != null) q.set('pageSize', String(params.pageSize));
    return request(`/api/v1/catalogs${q.toString() ? `?${q}` : ''}`);
  },
  async getCatalog(id: string): Promise<Catalog> {
    return request(`/api/v1/catalogs/${id}`);
  },
  async createCatalog(data: { entityId?: string | null; catalogType?: string; name: string; description?: string; status?: string }): Promise<Catalog> {
    return request('/api/v1/catalogs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  async updateCatalog(id: string, data: { entityId?: string | null; catalogType?: string; name?: string; description?: string; status?: string }): Promise<Catalog> {
    return request(`/api/v1/catalogs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  async createCatalogItem(data: { catalogId: string; tenderId?: string | null; cpcCode?: string; name: string; description?: string; unit?: string; referencePrice?: number }): Promise<CatalogItem> {
    return request('/api/v1/catalog-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  async listPurchaseOrders(params?: { entityId?: string; status?: string; page?: number; pageSize?: number }): Promise<{ data: PurchaseOrder[]; total: number; page: number; pageSize: number }> {
    const q = new URLSearchParams();
    if (params?.entityId) q.set('entityId', params.entityId);
    if (params?.status) q.set('status', params.status);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.pageSize != null) q.set('pageSize', String(params.pageSize));
    return request(`/api/v1/purchase-orders${q.toString() ? `?${q}` : ''}`);
  },
  async createPurchaseOrder(data: { entityId: string; catalogId?: string | null; tenderId?: string | null; orderNo?: string; totalAmount?: number; status?: string }): Promise<PurchaseOrder> {
    return request('/api/v1/purchase-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  async createBid(tenderId: string, data: { providerId: string; amount?: number; baePercentage?: number; nationalParticipation?: boolean; declareNoInability?: boolean; invitationType?: 'invited' | 'self_invited' }): Promise<unknown> {
    return request(`/api/v1/tenders/${tenderId}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getTenderBids(tenderId: string): Promise<{ data: Bid[] }> {
    return request(`/api/v1/tenders/${tenderId}/bids`);
  },
  async openBids(tenderId: string, data?: { bidOpeningActDocumentId?: string }): Promise<Tender> {
    return request(`/api/v1/tenders/${tenderId}/bids/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ?? {}),
    });
  },
  async requestConvalidation(bidId: string, data?: { errorsDescription?: string }): Promise<Bid> {
    return request(`/api/v1/bids/${bidId}/request-convalidation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ?? {}),
    });
  },
  async patchConvalidation(bidId: string, data: { status: 'accepted' | 'rejected'; response?: string }): Promise<Bid> {
    return request(`/api/v1/bids/${bidId}/convalidation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async verifyRup(bidId: string, data: { stage: 'opening' | 'award' | 'contract' }): Promise<Bid> {
    return request(`/api/v1/bids/${bidId}/verify-rup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async createContract(
    tenderId: string,
    data: { providerId: string; contractNo?: string; amount?: number; administratorName?: string; administratorEmail?: string; disputeDeadlineDays?: number; awardPublishedAt?: string | null }
  ): Promise<unknown> {
    return request(`/api/v1/tenders/${tenderId}/contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async getContractByTenderId(tenderId: string): Promise<Contract | null> {
    try {
      return await request<Contract>(`/api/v1/tenders/${tenderId}/contract`);
    } catch {
      return null;
    }
  },
  async updateContract(
    contractId: string,
    data: {
      status?: string;
      amount?: number;
      administratorName?: string;
      administratorEmail?: string;
      administratorObjectionReason?: string;
      terminatedAt?: string;
      suspendedAt?: string;
      terminationCause?: string;
      suspensionCause?: string;
      disputeDeadlineDays?: number | null;
      resultReportDocumentId?: string | null;
      awardPublishedAt?: string | null;
    }
  ): Promise<Contract> {
    return request(`/api/v1/contracts/${contractId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async listContractDocuments(contractId: string): Promise<{ data: Array<{ id: string; documentType: string; fileName: string; createdAt?: string }> }> {
    return request(`/api/v1/contracts/${contractId}/documents`);
  },
  async listContractPayments(contractId: string): Promise<{ data: ContractPayment[] }> {
    return request(`/api/v1/contracts/${contractId}/payments`);
  },
  async verifyBidBae(bidId: string): Promise<unknown> {
    return request(`/api/v1/bids/${bidId}/verify-bae`, { method: 'POST' });
  },
  async declareFailedAwardee(contractId: string): Promise<{ ok: boolean; bidId?: string; sanctionedUntil?: string }> {
    return request(`/api/v1/contracts/${contractId}/declare-failed-awardee`, { method: 'POST' });
  },
  async createContractPayment(
    contractId: string,
    data: { sequenceNo: number; amount: number; status?: string; dueDate?: string }
  ): Promise<ContractPayment> {
    return request(`/api/v1/contracts/${contractId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async updateContractPayment(
    paymentId: string,
    data: { status?: string; amount?: number; dueDate?: string; paidAt?: string }
  ): Promise<ContractPayment> {
    return request(`/api/v1/contract-payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async createComplaint(data: {
    tenderId?: string;
    entityId?: string;
    providerId?: string;
    channel: string;
    category: string;
    summary: string;
    details?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<Complaint> {
    return request('/api/v1/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async listComplaints(params?: { tenderId?: string; entityId?: string; providerId?: string; status?: string }): Promise<{ data: Complaint[] }> {
    const q = new URLSearchParams();
    if (params?.tenderId) q.set('tenderId', params.tenderId);
    if (params?.entityId) q.set('entityId', params.entityId);
    if (params?.providerId) q.set('providerId', params.providerId);
    if (params?.status) q.set('status', params.status);
    return request(`/api/v1/complaints${q.toString() ? `?${q}` : ''}`);
  },
  async updateComplaint(id: string, data: { status?: string; category?: string }): Promise<Complaint> {
    return request(`/api/v1/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async createProcessClaim(data: {
    tenderId: string;
    providerId: string;
    kind: string;
    subject: string;
    message: string;
  }): Promise<ProcessClaim> {
    return request('/api/v1/process-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async listProcessClaims(params?: { tenderId?: string; providerId?: string; status?: string }): Promise<{ data: ProcessClaim[] }> {
    const q = new URLSearchParams();
    if (params?.tenderId) q.set('tenderId', params.tenderId);
    if (params?.providerId) q.set('providerId', params.providerId);
    if (params?.status) q.set('status', params.status);
    return request(`/api/v1/process-claims${q.toString() ? `?${q}` : ''}`);
  },
  async updateProcessClaim(id: string, data: { status?: string; response?: string }): Promise<ProcessClaim> {
    return request(`/api/v1/process-claims/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async listTenderClarifications(tenderId: string): Promise<{ data: TenderClarification[] }> {
    return request(`/api/v1/tenders/${tenderId}/clarifications`);
  },
  async createTenderClarification(tenderId: string, data: { question: string; askedByProviderId?: string }): Promise<TenderClarification> {
    return request(`/api/v1/tenders/${tenderId}/clarifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async answerTenderClarification(clarificationId: string, answer: string): Promise<TenderClarification> {
    return request(`/api/v1/tender-clarifications/${clarificationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
  },
  async createTender(data: {
    procurementPlanId: string;
    title: string;
    description?: string;
    procurementMethod?: string;
    processType?: string;
    regime?: string;
    territoryPreference?: string | null;
    isRestrictedVisibility?: boolean;
    claimWindowDays?: number;
    minimumQuotes?: number;
    marketStudyDocumentId?: string | null;
    liberationDocumentId?: string | null;
    contingencyPlanDocumentId?: string | null;
    referenceBudgetAmount?: number | null;
    estimatedAmount?: number | null;
    questionsDeadlineAt?: string | null;
    bidsDeadlineAt?: string | null;
    clarificationResponseDeadlineAt?: string | null;
    convalidationRequestDeadlineAt?: string | null;
    convalidationResponseDeadlineAt?: string | null;
    scoringDeadlineAt?: string | null;
    awardResolutionDeadlineAt?: string | null;
    responsibleType?: string | null;
    electronicSignatureRequired?: boolean;
    sustainabilityCriteria?: Record<string, unknown> | null;
    valueForMoneyCriteria?: Record<string, unknown> | null;
  }): Promise<unknown> {
    return request('/api/v1/tenders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async updateTender(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    procurementMethod?: string;
    processType?: string;
    regime?: string;
    territoryPreference?: string | null;
    isRestrictedVisibility?: boolean;
    claimWindowDays?: number;
    minimumQuotes?: number | null;
    marketStudyDocumentId?: string | null;
    liberationDocumentId?: string | null;
    contingencyPlanDocumentId?: string | null;
    referenceBudgetAmount?: number | null;
    estimatedAmount?: number | null;
    questionsDeadlineAt?: string | null;
    bidsDeadlineAt?: string | null;
    clarificationResponseDeadlineAt?: string | null;
    convalidationRequestDeadlineAt?: string | null;
    convalidationResponseDeadlineAt?: string | null;
    scoringDeadlineAt?: string | null;
    awardResolutionDeadlineAt?: string | null;
    responsibleType?: string | null;
    electronicSignatureRequired?: boolean;
    sustainabilityCriteria?: Record<string, unknown> | null;
    valueForMoneyCriteria?: Record<string, unknown> | null;
  }): Promise<unknown> {
    return request(`/api/v1/tenders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  async requestLiberation(tenderId: string, data?: { documentId?: string }): Promise<unknown> {
    return request(`/api/v1/tenders/${tenderId}/request-liberation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
  },
  async approveLiberation(tenderId: string): Promise<unknown> {
    return request(`/api/v1/tenders/${tenderId}/approve-liberation`, {
      method: 'POST',
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
  async getAnalyticsPublicDetail(params: {
    metric: 'tenders' | 'published' | 'providers' | 'contracts';
    page?: number;
    pageSize?: number;
    year?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; pageSize: number }> {
    const q = new URLSearchParams();
    q.set('metric', params.metric);
    if (params.page != null) q.set('page', String(params.page));
    if (params.pageSize != null) q.set('pageSize', String(params.pageSize));
    if (params.year != null) q.set('year', String(params.year));
    return request(`/api/v1/analytics/public/detail?${q}`);
  },
  async getAnalyticsPublicCharts(params?: { year?: number; method?: string }): Promise<{
    processesByMonth: Array<{ month: string; total: number; publicados: number }>;
    processesByType: Array<{ type: string; count: number }>;
    providersByMonth: Array<{ month: string; count: number }>;
    contractsByMonth: Array<{ month: string; count: number }>;
  }> {
    const q = new URLSearchParams();
    if (params?.year != null) q.set('year', String(params.year));
    if (params?.method) q.set('method', params.method);
    return request(`/api/v1/analytics/public/charts${q.toString() ? `?${q}` : ''}`);
  },
  async getContractsPublic(params?: { page?: number; pageSize?: number }): Promise<{ data: Array<Record<string, unknown>>; total: number; page: number; pageSize: number }> {
    const q = new URLSearchParams();
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.pageSize != null) q.set('pageSize', String(params.pageSize));
    const qs = q.toString();
    return request(`/api/v1/contracts/public${qs ? `?${qs}` : ''}`);
  },
  async getContractsAdmin(params?: { status?: string; page?: number; pageSize?: number }): Promise<{ data: Array<Record<string, unknown>>; total: number; page: number; pageSize: number }> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.pageSize != null) q.set('pageSize', String(params.pageSize));
    const qs = q.toString();
    return request(`/api/v1/contracts${qs ? `?${qs}` : ''}`);
  },
  async getAudit(params?: { limit?: number; offset?: number; action?: string; entityType?: string; contractingEntityId?: string }): Promise<{ data: unknown[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.action) q.set('action', params.action);
    if (params?.entityType) q.set('entityType', params.entityType);
    if (params?.contractingEntityId) q.set('contractingEntityId', params.contractingEntityId);
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
  async createEvaluation(tenderId: string, data: { bidId: string; technicalScore?: number; financialScore?: number; baeScore?: number; nationalPartScore?: number; totalScore?: number; status?: string }): Promise<unknown> {
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

  // ---- Analytics module ----
  async getAnalyticsDashboard(): Promise<{
    totalTenders: number;
    totalContracts: number;
    totalProviders: number;
    totalEntities: number;
    totalContractAmount: number;
    avgBidders: number;
    riskDistribution: { high: number; medium: number; low: number };
    openAlerts: number;
  }> {
    return request('/api/v1/analytics/dashboard');
  },

  async getRiskScores(params?: {
    level?: 'low' | 'medium' | 'high';
    entityId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: RiskScore[]; total: number; page: number; limit: number }> {
    const q = new URLSearchParams();
    if (params?.level) q.set('level', params.level);
    if (params?.entityId) q.set('entityId', params.entityId);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    return request(`/api/v1/analytics/risk-scores${q.toString() ? `?${q}` : ''}`);
  },

  async getCompetition(params?: { year?: number }): Promise<{
    avgBidders: number;
    bySector: Array<{ processType: string; tenderCount: number; avgBidders: number; singleBidderPct: number }>;
    hhiByEntity: Array<{ entityId: string; entityName: string; hhi: number }>;
  }> {
    const q = new URLSearchParams();
    if (params?.year != null) q.set('year', String(params.year));
    return request(`/api/v1/analytics/competition${q.toString() ? `?${q}` : ''}`);
  },

  async getMarket(params?: {
    year?: number;
    groupBy?: 'entity' | 'province' | 'processType';
  }): Promise<{ data: MarketStats[] }> {
    const q = new URLSearchParams();
    if (params?.year != null) q.set('year', String(params.year));
    if (params?.groupBy) q.set('groupBy', params.groupBy);
    return request(`/api/v1/analytics/market${q.toString() ? `?${q}` : ''}`);
  },

  async getPacVsExecuted(params?: { year?: number }): Promise<{
    data: Array<{
      entityId: string;
      entityName: string;
      planned: number;
      executed: number;
      plannedAmount: number;
      executedAmount: number;
      executionRate: number;
      deviation: number;
    }>;
  }> {
    const q = new URLSearchParams();
    if (params?.year != null) q.set('year', String(params.year));
    return request(`/api/v1/analytics/pac-vs-executed${q.toString() ? `?${q}` : ''}`);
  },

  async getAlerts(params?: {
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    resolved?: boolean;
    from?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AlertEvent[]; total: number; page: number; limit: number }> {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.resolved != null) q.set('resolved', String(params.resolved));
    if (params?.from) q.set('from', params.from);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    return request(`/api/v1/analytics/alerts${q.toString() ? `?${q}` : ''}`);
  },

  async computeRisk(tenderId: string): Promise<RiskScore> {
    return request(`/api/v1/analytics/compute-risk/${tenderId}`, { method: 'POST' });
  },

  async getProviderNetwork(params?: { minShared?: number }): Promise<{
    nodes: Array<{ id: string; name: string; contractCount: number; totalAmount: number }>;
    edges: Array<{ providerAId: string; providerBId: string; sharedTenders: number }>;
  }> {
    const q = new URLSearchParams();
    if (params?.minShared != null) q.set('minShared', String(params.minShared));
    return request(`/api/v1/analytics/provider-network${q.toString() ? `?${q}` : ''}`);
  },

  async getProviderNeighbors(providerId: string): Promise<{
    data: Array<{ id: string; name: string; contractCount: number; totalAmount: number }>;
  }> {
    return request(`/api/v1/analytics/provider-network/${providerId}/neighbors`);
  },

  async getPublicMarketOverview(params?: { year?: number }): Promise<{
    year: number;
    totalContractAmount: number;
    byProcessType: Array<{ processType: string; tenderCount: number; totalAmount: number }>;
  }> {
    const q = new URLSearchParams();
    if (params?.year != null) q.set('year', String(params.year));
    return request(`/api/v1/public/analytics/market-overview${q.toString() ? `?${q}` : ''}`);
  },

  async getPublicTopProviders(params?: { year?: number; limit?: number }): Promise<{
    data: Array<{ providerId: string; name: string; totalAmount: number; contractCount: number }>;
  }> {
    const q = new URLSearchParams();
    if (params?.year != null) q.set('year', String(params.year));
    if (params?.limit != null) q.set('limit', String(params.limit));
    return request(`/api/v1/public/analytics/top-providers${q.toString() ? `?${q}` : ''}`);
  },

  async getPublicRiskSummary(): Promise<{ low: number; medium: number; high: number; total: number }> {
    return request('/api/v1/public/analytics/risk-summary');
  },
};
