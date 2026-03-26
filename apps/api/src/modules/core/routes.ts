import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import crypto from 'crypto';
import { isStorageConfigured, ensureBucket, uploadStream, getUploadUrl, getDownloadUrl } from '../../storage.js';
import { searchRag } from '../../rag.js';

const GPTSERCOP_ANALYSIS_CONTRACT_VERSION = 'gptsercop.analysis.v1';

type AiMode = 'deterministic' | 'hybrid';
type FallbackReason = 'AI_DISABLED' | 'AI_MODE_DETERMINISTIC' | 'AI_ERROR' | 'RAG_DISABLED' | 'RAG_ERROR';
type RouteOutcome = 'success' | 'fallback' | 'error' | 'denied';

type AnalyzeMetrics = {
  total: number;
  success: number;
  fallback: number;
  error: number;
  denied: number;
  latencyMsTotal: number;
  latencyMsMax: number;
  fallbackReasons: Record<FallbackReason, number>;
};

function forbiddenPayload(params: {
  code: 'PERMISSION_DENIED' | 'ROLE_FORBIDDEN';
  route: string;
  required: string[];
  role?: string;
}) {
  return {
    error: 'Forbidden',
    errorCode: params.code,
    message: 'You do not have permissions for this module action',
    route: params.route,
    requiredPermissions: params.required,
    userRole: params.role ?? null,
  };
}

function hasGptModuleAccess(role: string | undefined): boolean {
  if (!role) return true; // AUTH disabled / dev mode
  return role === 'admin' || role === 'entity' || role === 'supplier';
}

function isAdminRole(role: string | undefined): boolean {
  if (!role) return true; // AUTH disabled / dev mode
  return role === 'admin';
}

const gptsercopAnalyzeMetrics: AnalyzeMetrics = {
  total: 0,
  success: 0,
  fallback: 0,
  error: 0,
  denied: 0,
  latencyMsTotal: 0,
  latencyMsMax: 0,
  fallbackReasons: {
    AI_DISABLED: 0,
    AI_MODE_DETERMINISTIC: 0,
    AI_ERROR: 0,
    RAG_DISABLED: 0,
    RAG_ERROR: 0,
  },
};

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return defaultValue;
  const value = raw.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

function getAiMode(): AiMode {
  const raw = String(process.env.AI_MODE ?? 'hybrid').trim().toLowerCase();
  return raw === 'deterministic' ? 'deterministic' : 'hybrid';
}

function detectSensitiveSignals(input: string): string[] {
  const signals: string[] = [];
  if (!input) return signals;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(input)) signals.push('EMAIL');
  if (/\b(?:\+?\d[\d\s\-().]{7,}\d)\b/.test(input)) signals.push('PHONE');
  if (/\b\d{10,13}\b/.test(input)) signals.push('IDENTIFIER');
  return signals;
}

function sanitizeSensitiveInput(input: string): string {
  if (!input) return input;
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/\b(?:\+?\d[\d\s\-().]{7,}\d)\b/g, '[REDACTED_PHONE]')
    .replace(/\b\d{10,13}\b/g, '[REDACTED_ID]');
}

function shortHash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function recordAnalyzeMetrics(params: { durationMs: number; outcome: RouteOutcome; fallbackReason?: FallbackReason }): void {
  gptsercopAnalyzeMetrics.total += 1;
  gptsercopAnalyzeMetrics.latencyMsTotal += params.durationMs;
  gptsercopAnalyzeMetrics.latencyMsMax = Math.max(gptsercopAnalyzeMetrics.latencyMsMax, params.durationMs);
  gptsercopAnalyzeMetrics[params.outcome] += 1;
  if (params.fallbackReason) gptsercopAnalyzeMetrics.fallbackReasons[params.fallbackReason] += 1;
}

type AnalysisProcess = {
  id: string;
  title: string;
  status: string;
  entity: { name: string; code: string | null } | null;
} | null;

function buildDeterministicAnalysis(params: {
  tender: {
    id: string;
    title: string;
    status: string;
    estimatedAmount: unknown;
    questionsDeadlineAt: Date | null;
    bidsDeadlineAt: Date | null;
    description?: string | null;
    procurementPlan?: { entity?: { name: string; code: string | null } | null } | null;
  } | null;
  ragResults: Array<{ id: string; title: string; source: string; snippet: string | null }>;
  mode: AiMode;
  fallbackReason?: FallbackReason;
  hadSensitiveInput?: boolean;
}): {
  contractVersion: string;
  mode: AiMode;
  isFallback: boolean;
  fallbackReason?: FallbackReason;
  summary: string;
  confidence: number;
  riskFlags: string[];
  recommendations: string[];
  citations: Array<{ id: string; title: string; source: string; snippet: string | null }>;
  process: AnalysisProcess;
} {
  const { tender, ragResults, mode, fallbackReason, hadSensitiveInput } = params;

  const riskFlags: string[] = [];
  if (tender?.estimatedAmount != null && Number(tender.estimatedAmount) > 500000) {
    riskFlags.push('MONTO_ALTO_REQUIERE_VALIDACIONES');
  }
  if (!tender?.questionsDeadlineAt || !tender?.bidsDeadlineAt) {
    riskFlags.push('CRONOGRAMA_INCOMPLETO');
  }

  const recommendations = [
    'Verificar consistencia entre presupuesto referencial y criterios de evaluacion.',
    'Confirmar que el cronograma publicado cumple tiempos minimos normativos.',
  ];
  if (riskFlags.includes('MONTO_ALTO_REQUIERE_VALIDACIONES')) {
    recommendations.push('Incluir validacion juridica y tecnica reforzada por monto alto.');
  }
  if (fallbackReason === 'RAG_DISABLED' || fallbackReason === 'RAG_ERROR') {
    recommendations.push('Completar revision con normativa institucional al no disponer de contexto RAG completo.');
  }
  if (hadSensitiveInput) {
    riskFlags.push('DATOS_SENSIBLES_REDACTADOS');
    recommendations.push('Validar manualmente los datos sensibles redactados antes de decisiones finales.');
  }

  const summary = tender
    ? `Analisis GPTsercop para "${tender.title}" con ${ragResults.length} referencias normativas encontradas.`
    : `Analisis GPTsercop basado en consulta libre con ${ragResults.length} referencias normativas.`;

  return {
    contractVersion: GPTSERCOP_ANALYSIS_CONTRACT_VERSION,
    mode,
    isFallback: Boolean(fallbackReason),
    fallbackReason,
    summary,
    confidence: ragResults.length >= 3 ? 0.82 : 0.64,
    riskFlags,
    recommendations,
    citations: ragResults.map((r) => ({ id: r.id, title: r.title, source: r.source, snippet: r.snippet })),
    process: tender
      ? {
          id: tender.id,
          title: tender.title,
          status: tender.status,
          entity: tender.procurementPlan?.entity ? { name: tender.procurementPlan.entity.name, code: tender.procurementPlan.entity.code } : null,
        }
      : null,
  };
}
export const coreRoutes: FastifyPluginAsync = async (app) => {
  // Documents (uploads)
  app.post('/api/v1/documents/upload', async (req, reply) => {
    if (!isStorageConfigured()) return reply.status(503).send({ error: 'S3 no configurado' });
    try {
      const parts = req.parts();
      let ownerType = ''; let ownerId = ''; let fileName = ''; let mimeType = ''; let stream: NodeJS.ReadableStream | null = null;
      for await (const part of parts) {
        if (part.type === 'field') { if (part.fieldname === 'ownerType') ownerType = part.value as string; else if (part.fieldname === 'ownerId') ownerId = part.value as string; }
        else if (part.type === 'file') { stream = part.file; fileName = part.filename; mimeType = part.mimetype; }
      }
      if (!stream) return reply.status(400).send({ error: 'Archivo faltante' });
      await ensureBucket();
      const key = `${ownerType}/${ownerId}/${crypto.randomUUID()}-${fileName}`;
      await uploadStream(key, stream, mimeType);
      const doc = await prisma.document.create({ data: { ownerType, ownerId, documentType: 'attachment', fileName, storageKey: key, isPublic: false } });
      return reply.status(201).send(doc);
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error subir' }); }
  });

  app.post<{ Body: any }>('/api/v1/documents/presign', async (req, reply) => {
    if (!isStorageConfigured()) return reply.status(503).send({ error: 'S3 no configurado' });
    const { offerId, draftId, mimeType, fileName } = (req.body as any);
    await ensureBucket();
    const key = `${offerId ? `offers/${offerId}` : `offer-drafts/${draftId}`}/${crypto.randomUUID()}-${fileName}`;
    const uploadUrl = await getUploadUrl(key, mimeType);
    return { uploadUrl, storageKey: key };
  });

  app.post<{ Body: any }>('/api/v1/documents/commit', async (req, reply) => {
    try {
      const doc = await prisma.offerDocument.create({ data: (req.body as any) as any });
      return reply.status(201).send(doc);
    } catch (e) { return reply.status(500).send({ error: 'Error commit' }); }
  });

  app.get<{ Querystring: any }>('/api/v1/documents', async (req, reply) => {
    try {
      const docs = await prisma.document.findMany({ where: (req.query as any) });
      return { data: docs };
    } catch (e) { return reply.status(500).send({ error: 'Error get docs' }); }
  });

  app.get<{ Querystring: any }>('/api/v1/offer-documents', async (req, reply) => {
    try {
      const docs = await prisma.offerDocument.findMany({ where: (req.query as any) });
      return { data: docs };
    } catch (e) { return reply.status(500).send({ error: 'Error get docs' }); }
  });

  app.get<{ Params: { id: string } }>('/api/v1/documents/:id', async (req, reply) => {
    try {
      const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
      if (!doc) return reply.status(404).send({ error: 'NotFound' });
      const out: any = { ...doc };
      if (isStorageConfigured()) out.downloadUrl = await getDownloadUrl(doc.storageKey).catch(() => null);
      return out;
    } catch (e) { return reply.status(500).send({ error: 'Error doc' }); }
  });

  // Analytics
  app.get('/api/v1/analytics/dashboard', async (req, reply) => {
    try {
      const [tenders, providers, contracts, documents] = await Promise.all([
        prisma.tender.count(), prisma.provider.count(), prisma.contract.count(), prisma.document.count(),
      ]);
      const tendersPublished = await prisma.tender.count({ where: { status: 'published' } });
      return { tenders, tendersPublished, providers, contracts, documents };
    } catch (e) { return reply.status(500).send({ error: 'Error stats' }); }
  });

  app.get('/api/v1/analytics/public', async (req, reply) => {
    try {
      const [tenders, providers, contractsAdjudicated] = await Promise.all([ prisma.tender.count(), prisma.provider.count(), prisma.contract.count({ where: { signedAt: { not: null } } }) ]);
      return { tenders, tendersPublished: tenders, providers, contracts: contractsAdjudicated };
    } catch (e) { return reply.status(500).send({ error: 'Error stats' }); }
  });

  app.get<{ Querystring: any }>('/api/v1/analytics/public/detail', async (req, reply) => {
    return { data: [], total: 0, page: 1, pageSize: 20 }; // Stub for details
  });

  app.get<{ Querystring: any }>('/api/v1/analytics/public/charts', async (req, reply) => {
    return { processesByMonth: [], processesByType: [], providersByMonth: [], contractsByMonth: [] }; // Stub charts
  });

  // Audit
  app.get<{ Querystring: any }>('/api/v1/audit', async (req, reply) => {
    try {
      const logs = await prisma.auditLog.findMany({ take: 50, orderBy: { occurredAt: 'desc' }, where: (req.query as any) });
      return { data: logs, total: logs.length };
    } catch (e) { return reply.status(500).send({ error: 'Error audit' }); }
  });

  // Entities
  app.get('/api/v1/entities', async (req, reply) => {
    try {
      const items = await prisma.entity.findMany({ orderBy: { name: 'asc' } });
      return { data: items };
    } catch (e) { return reply.status(500).send({ error: 'Error entities' }); }
  });
  app.get<{ Params: { id: string } }>('/api/v1/entities/:id', async (req, reply) => {
    try { return await prisma.entity.findUnique({ where: { id: req.params.id } }); } catch (e) { return reply.status(500).send({ error: 'Error entity' }); }
  });
  app.post<{ Body: any }>('/api/v1/entities', async (req, reply) => {
    try { const r = await prisma.entity.create({ data: (req.body as any) }); return reply.status(201).send(r); } catch (e) { return reply.status(500).send({ error: 'Error create entity' }); }
  });
  app.put<{ Params: { id: string }; Body: any }>('/api/v1/entities/:id', async (req, reply) => {
    try { const r = await prisma.entity.update({ where: { id: req.params.id }, data: (req.body as any) }); return r; } catch (e) { return reply.status(500).send({ error: 'Error put entity' }); }
  });

  // Users
  app.get<{ Querystring: any }>('/api/v1/users', async (req, reply) => {
    try {
      const users = await prisma.user.findMany({ where: (req.query as any), select: { id: true, email: true, fullName: true, status: true, organizationId: true, organization: { select: { name: true } } } });
      return { data: users, total: users.length };
    } catch (e) { return reply.status(500).send({ error: 'Error users' }); }
  });

  // RAG
  app.get<{ Querystring: any }>('/api/v1/rag/search', async (req, reply) => {
    try {
      const results = await searchRag((req.query as any).q || '', 5);
      return { results };
    } catch (e) { return reply.status(500).send({ error: 'Error rag' }); }
  });

  app.post<{ Body: any }>('/api/v1/rag/ask', async (req, reply) => {
    try {
      return { answer: 'Stub answer', sources: [] };
    } catch (e) { return reply.status(500).send({ error: 'Error rag ask' }); }
  });

  // GPTsercop: analisis asistido sobre proceso de compra + contexto normativo (RAG)
  app.post<{ Body: { tenderId?: string; question?: string } }>('/api/v1/gptsercop/analyze-procurement', async (req, reply) => {
    const startedAtMs = Date.now();
    if (!hasGptModuleAccess(req.user?.role)) {
      const durationMs = Date.now() - startedAtMs;
      recordAnalyzeMetrics({ durationMs, outcome: 'denied' });
      req.log.warn(
        {
          module: 'gptsercop.assistant',
          route: '/api/v1/gptsercop/analyze-procurement',
          outcome: 'denied',
          userRole: req.user?.role ?? null,
        },
        'GPTsercop analyze denied by role'
      );
      await audit({
        action: 'gptsercop.analyze.denied',
        entityType: 'AIAnalysis',
        payload: {
          route: '/api/v1/gptsercop/analyze-procurement',
          durationMs,
          userRole: req.user?.role ?? null,
          requiredPermissions: ['GPT_ASSISTANT_USE'],
        },
      });
      return reply.status(403).send(forbiddenPayload({
        code: 'ROLE_FORBIDDEN',
        route: '/api/v1/gptsercop/analyze-procurement',
        required: ['GPT_ASSISTANT_USE'],
        role: req.user?.role,
      }));
    }

    const aiEnabled = envFlag('AI_ENABLED', true);
    const ragEnabled = envFlag('RAG_ENABLED', true);
    const aiMode = getAiMode();
    const tenderId = typeof req.body?.tenderId === 'string' ? req.body.tenderId.trim() : '';
    const question = typeof req.body?.question === 'string' ? req.body.question.trim().slice(0, 2000) : '';
    const sensitiveSignals = detectSensitiveSignals(question);
    const hadSensitiveInput = sensitiveSignals.length > 0;
    const sanitizedQuestion = sanitizeSensitiveInput(question);
    if (!tenderId && !question) return reply.status(400).send({ error: 'tenderId o question es obligatorio' });

    const finish = async (params: {
      outcome: RouteOutcome;
      fallbackReason?: FallbackReason;
      ragResultCount: number;
      payload: unknown;
    }) => {
      const durationMs = Date.now() - startedAtMs;
      recordAnalyzeMetrics({ durationMs, outcome: params.outcome, fallbackReason: params.fallbackReason });
      req.log.info(
        {
          aiMode,
          aiEnabled,
          ragEnabled,
          outcome: params.outcome,
          fallbackReason: params.fallbackReason,
          durationMs,
          tenderId: tenderId || null,
          hadSensitiveInput,
          sensitiveSignals,
          ragResultCount: params.ragResultCount,
        },
        'GPTsercop analyze completed'
      );
      await audit({
        action: 'gptsercop.analyze',
        entityType: 'AIAnalysis',
        entityId: tenderId || undefined,
        payload: {
          mode: aiMode,
          aiEnabled,
          ragEnabled,
          outcome: params.outcome,
          fallbackReason: params.fallbackReason ?? null,
          durationMs,
          tenderId: tenderId || null,
          questionHash: question ? shortHash(question) : null,
          questionLength: question.length,
          hadSensitiveInput,
          sensitiveSignals,
          ragResultCount: params.ragResultCount,
        },
      });
      return params.payload;
    };

    let tender: {
      id: string;
      title: string;
      status: string;
      estimatedAmount: unknown;
      description?: string | null;
      questionsDeadlineAt: Date | null;
      bidsDeadlineAt: Date | null;
      procurementPlan?: { entity?: { name: string; code: string | null } | null } | null;
    } | null = null;
    try {
      if (tenderId) {
        tender = await prisma.tender.findUnique({
          where: { id: tenderId },
          include: {
            procurementPlan: { include: { entity: { select: { id: true, name: true, code: true } } } },
          },
        });
      }
    } catch (e) {
      req.log.error(e);
      const durationMs = Date.now() - startedAtMs;
      recordAnalyzeMetrics({ durationMs, outcome: 'error' });
      await audit({
        action: 'gptsercop.analyze',
        entityType: 'AIAnalysis',
        entityId: tenderId || undefined,
        payload: {
          mode: aiMode,
          aiEnabled,
          ragEnabled,
          outcome: 'error',
          errorCode: 'TENDER_LOOKUP_ERROR',
          durationMs,
          tenderId: tenderId || null,
          questionHash: question ? shortHash(question) : null,
          questionLength: question.length,
          hadSensitiveInput,
          sensitiveSignals,
          ragResultCount: 0,
        },
      });
      return reply.status(500).send({ error: 'Error consultando proceso' });
    }
    if (tenderId && !tender) return reply.status(404).send({ error: 'Proceso no encontrado' });

    const safeTenderContext = tender ? sanitizeSensitiveInput(`${tender.title} ${tender.description || ''}`) : '';
    const contextQuery = sanitizedQuestion || safeTenderContext;
    let ragResults: Array<{ id: string; title: string; source: string; snippet: string | null }> = [];
    let ragFallbackReason: 'RAG_DISABLED' | 'RAG_ERROR' | undefined;
    if (!ragEnabled) {
      ragFallbackReason = 'RAG_DISABLED';
    } else if (contextQuery) {
      try {
        ragResults = await searchRag(contextQuery, 5);
      } catch (e) {
        req.log.warn({ err: e }, 'RAG unavailable; using deterministic fallback context');
        ragFallbackReason = 'RAG_ERROR';
      }
    }

    if (!aiEnabled) {
      const payload = buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: 'AI_DISABLED',
        hadSensitiveInput,
      });
      return finish({ outcome: 'fallback', fallbackReason: 'AI_DISABLED', ragResultCount: ragResults.length, payload });
    }
    if (aiMode === 'deterministic') {
      const payload = buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: 'AI_MODE_DETERMINISTIC',
        hadSensitiveInput,
      });
      return finish({ outcome: 'fallback', fallbackReason: 'AI_MODE_DETERMINISTIC', ragResultCount: ragResults.length, payload });
    }

    try {
      const payload = buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: ragFallbackReason,
        hadSensitiveInput,
      });
      return finish({
        outcome: ragFallbackReason ? 'fallback' : 'success',
        fallbackReason: ragFallbackReason,
        ragResultCount: ragResults.length,
        payload,
      });
    } catch (e) {
      req.log.error(e);
      const payload = buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: 'AI_ERROR',
        hadSensitiveInput,
      });
      return finish({ outcome: 'fallback', fallbackReason: 'AI_ERROR', ragResultCount: ragResults.length, payload });
    }
  });

  app.get('/api/v1/gptsercop/metrics', async (req, reply) => {
    if (!isAdminRole(req.user?.role)) {
      req.log.warn(
        {
          module: 'gptsercop.metrics',
          route: '/api/v1/gptsercop/metrics',
          outcome: 'denied',
          userRole: req.user?.role ?? null,
        },
        'GPTsercop metrics denied by role'
      );
      return reply.status(403).send(forbiddenPayload({
        code: 'ROLE_FORBIDDEN',
        route: '/api/v1/gptsercop/metrics',
        required: ['GPT_ADMIN_VIEW'],
        role: req.user?.role,
      }));
    }

    const avgLatencyMs = gptsercopAnalyzeMetrics.total > 0
      ? Number((gptsercopAnalyzeMetrics.latencyMsTotal / gptsercopAnalyzeMetrics.total).toFixed(2))
      : 0;
    return {
      route: '/api/v1/gptsercop/analyze-procurement',
      total: gptsercopAnalyzeMetrics.total,
      success: gptsercopAnalyzeMetrics.success,
      fallback: gptsercopAnalyzeMetrics.fallback,
      error: gptsercopAnalyzeMetrics.error,
      denied: gptsercopAnalyzeMetrics.denied,
      avgLatencyMs,
      maxLatencyMs: gptsercopAnalyzeMetrics.latencyMsMax,
      fallbackReasons: gptsercopAnalyzeMetrics.fallbackReasons,
    };
  });

  app.get<{ Querystring: any }>('/api/v1/rag/chunks', async (req, reply) => {
    try {
      const data = await prisma.ragChunk.findMany({ where: (req.query as any) });
      return { data, total: data.length };
    } catch (e) { return reply.status(500).send({ error: 'Error chunks' }); }
  });

  app.post<{ Body: any }>('/api/v1/rag/chunks', async (req, reply) => {
    try {
      const c = await prisma.ragChunk.create({ data: (req.body as any) });
      return reply.status(201).send(c);
    } catch (e) { return reply.status(500).send({ error: 'Error create chunk' }); }
  });
  app.put<{ Params: { id: string }; Body: any }>('/api/v1/rag/chunks/:id', async (req, reply) => {
    try { return await prisma.ragChunk.update({ where: { id: req.params.id }, data: (req.body as any) }); } catch (e) { return reply.status(500).send({ error: 'Error put chunk' }); }
  });
};
