import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import crypto from 'crypto';
import { isStorageConfigured, ensureBucket, uploadStream, getUploadUrl, getDownloadUrl } from '../../storage.js';
import { searchRag } from '../../rag.js';

const GPTSERCOP_ANALYSIS_CONTRACT_VERSION = 'gptsercop.analysis.v1';

type AiMode = 'deterministic' | 'hybrid';

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
  fallbackReason?: 'AI_DISABLED' | 'AI_MODE_DETERMINISTIC' | 'AI_ERROR' | 'RAG_DISABLED' | 'RAG_ERROR';
}): {
  contractVersion: string;
  mode: AiMode;
  isFallback: boolean;
  fallbackReason?: 'AI_DISABLED' | 'AI_MODE_DETERMINISTIC' | 'AI_ERROR' | 'RAG_DISABLED' | 'RAG_ERROR';
  summary: string;
  confidence: number;
  riskFlags: string[];
  recommendations: string[];
  citations: Array<{ id: string; title: string; source: string; snippet: string | null }>;
  process: AnalysisProcess;
} {
  const { tender, ragResults, mode, fallbackReason } = params;

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
    const aiEnabled = envFlag('AI_ENABLED', true);
    const ragEnabled = envFlag('RAG_ENABLED', true);
    const aiMode = getAiMode();
    const tenderId = typeof req.body?.tenderId === 'string' ? req.body.tenderId.trim() : '';
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!tenderId && !question) return reply.status(400).send({ error: 'tenderId o question es obligatorio' });

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
      return reply.status(500).send({ error: 'Error consultando proceso' });
    }
    if (tenderId && !tender) return reply.status(404).send({ error: 'Proceso no encontrado' });

    const contextQuery = question || (tender ? `${tender.title} ${tender.description || ''}` : '');
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
      return buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: 'AI_DISABLED',
      });
    }
    if (aiMode === 'deterministic') {
      return buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: 'AI_MODE_DETERMINISTIC',
      });
    }

    try {
      return buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: ragFallbackReason,
      });
    } catch (e) {
      req.log.error(e);
      return buildDeterministicAnalysis({
        tender,
        ragResults,
        mode: aiMode,
        fallbackReason: 'AI_ERROR',
      });
    }
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
