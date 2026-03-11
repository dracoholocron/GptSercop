import crypto from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { prisma } from './db.js';
import { audit } from './audit.js';
import { authPlugin } from './authPlugin.js';
import { sign, hasJwtSecret } from './auth.js';
import { isStorageConfigured, ensureBucket, uploadStream, getDownloadUrl } from './storage.js';
import { isRedisConfigured, pingRedis } from './redis.js';
import { searchRag } from './rag.js';
import { openapiSpec } from './openapi.js';

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 }); // 10MB para uploads

// CORS: en producción usar CORS_ALLOWED_ORIGINS (lista separada por coma); si no, permitir todo (desarrollo)
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.trim();
const corsOpt = corsOrigins
  ? { origin: corsOrigins.split(',').map((o) => o.trim()).filter(Boolean) }
  : { origin: true };
await app.register(cors, corsOpt);
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB por archivo
await app.register(authPlugin);

// Bucket MinIO se crea en el primer upload si hace falta

// Security headers (Fase 2)
app.addHook('onSend', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
});

// Login (Fase 2): emite JWT para pruebas; en producción usar IdP OIDC
type LoginBody = { email: string; role?: string; identifier?: string; entityId?: string };
app.post<{ Body: LoginBody }>('/api/v1/auth/login', async (req, reply) => {
  const body = req.body as LoginBody;
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (!email) return reply.status(400).send({ error: 'email es obligatorio' });
  if (!hasJwtSecret()) return reply.status(503).send({ error: 'Auth no configurado (JWT_SECRET)' });
  const allowedRoles = ['supplier', 'entity', 'admin'] as const;
  const role = typeof body?.role === 'string' && allowedRoles.includes(body.role as (typeof allowedRoles)[number])
    ? (body.role as (typeof allowedRoles)[number])
    : 'supplier';
  let providerId: string | undefined;
  let entityId: string | undefined;
  if (role === 'supplier' && typeof body?.identifier === 'string' && body.identifier.trim()) {
    const p = await prisma.provider.findFirst({ where: { identifier: body.identifier.trim() }, select: { id: true } });
    if (p) providerId = p.id;
  }
  if (role === 'entity') {
    const u = await prisma.user.findUnique({ where: { email }, select: { organizationId: true } });
    if (u?.organizationId) entityId = u.organizationId;
    else if (typeof body?.entityId === 'string' && body.entityId.trim()) entityId = body.entityId.trim();
  }
  const token = sign({ sub: email, role });
  return reply.send({ token, expiresIn: 86400, providerId: providerId ?? null, entityId: entityId ?? null });
});

// Health check (Fase 4: DB + Redis)
app.get('/health', async (req, reply) => {
  let db: 'connected' | 'disconnected' = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'connected';
  } catch (_) {}
  const payload: Record<string, string> = { status: db === 'connected' ? 'ok' : 'degraded', service: 'api', database: db };
  if (isRedisConfigured()) {
    payload.redis = await pingRedis();
    if (payload.status === 'ok' && payload.redis === 'disconnected') payload.status = 'degraded';
  }
  if (payload.status === 'degraded') return reply.status(503).send(payload);
  return payload;
});

// Ready (K8s: tráfico listo)
app.get('/ready', async (_req, reply) => {
  return { ready: true };
});

// OpenAPI spec y documentación (públicos)
app.get('/openapi.json', async (_req, reply) => {
  return reply.type('application/json').send(openapiSpec);
});
app.get('/documentation', async (_req, reply) => {
  const html = `<!DOCTYPE html><html><head><title>SERCOP API – Documentación</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' })</script></body></html>`;
  return reply.type('text/html').send(html);
});

// API pública v1 – Tenders (filtros + paginación: page, pageSize; default 10 por página)
app.get<{
  Querystring: {
    entityId?: string;
    method?: string;
    minAmount?: string;
    maxAmount?: string;
    year?: string;
    page?: string;
    pageSize?: string;
  };
}>('/api/v1/tenders', async (req, reply) => {
  try {
    const q = req.query;
    const procurementPlanWhere: Record<string, unknown> = {};
    if (typeof q.entityId === 'string' && q.entityId.trim()) procurementPlanWhere.entityId = q.entityId.trim();
    if (typeof q.year === 'string' && q.year.trim()) {
      const y = parseInt(q.year, 10);
      if (!isNaN(y)) procurementPlanWhere.year = y;
    }
    const estimatedWhere: { gte?: number; lte?: number } = {};
    if (typeof q.minAmount === 'string' && q.minAmount.trim()) {
      const min = parseFloat(q.minAmount);
      if (!isNaN(min)) estimatedWhere.gte = min;
    }
    if (typeof q.maxAmount === 'string' && q.maxAmount.trim()) {
      const max = parseFloat(q.maxAmount);
      if (!isNaN(max)) estimatedWhere.lte = max;
    }
    const where: Record<string, unknown> = { status: 'published' };
    if (Object.keys(procurementPlanWhere).length > 0) where.procurementPlan = procurementPlanWhere;
    if (typeof q.method === 'string' && q.method.trim()) where.procurementMethod = q.method.trim();
    if (Object.keys(estimatedWhere).length > 0) where.estimatedAmount = estimatedWhere;

    const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize || '10', 10) || 10));
    const skip = (page - 1) * pageSize;

    const [tenders, total] = await Promise.all([
      prisma.tender.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          publishedAt: true,
          procurementMethod: true,
          estimatedAmount: true,
          procurementPlan: { select: { year: true, entity: { select: { name: true, code: true } } } },
        },
      }),
      prisma.tender.count({ where }),
    ]);
    return { data: tenders, total, page, pageSize };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar procesos' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/tenders/:id', async (req, reply) => {
  const { id } = req.params;
  try {
    const tender = await prisma.tender.findUnique({
      where: { id },
      include: {
        procurementPlan: { select: { year: true, entity: { select: { name: true, code: true } } } },
      },
    });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    return tender;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener proceso' });
  }
});

// API v1 – Providers (RUP; Docs/03_technical_specs/04_MODULE_RUP)
app.get<{ Querystring: { identifier?: string } }>('/api/v1/providers', async (req, reply) => {
  try {
    const where: { status: string; identifier?: string } = { status: 'active' };
    if (typeof req.query?.identifier === 'string' && req.query.identifier.trim())
      where.identifier = req.query.identifier.trim();
    const providers = await prisma.provider.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, identifier: true, status: true, legalName: true, tradeName: true, province: true, canton: true, address: true },
    });
    return { data: providers };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar proveedores' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/providers/:id', async (req, reply) => {
  const { id } = req.params;
  try {
    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) return reply.status(404).send({ error: 'Proveedor no encontrado' });
    return provider;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener proveedor' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/providers/:id/bids', async (req, reply) => {
  const { id } = req.params;
  try {
    const bids = await prisma.bid.findMany({
      where: { providerId: id },
      include: { tender: { select: { id: true, title: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: bids };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar ofertas del proveedor' });
  }
});

// POST /api/v1/providers (RUP – registro proveedor)
type ProviderBody = { name: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string };
app.post<{ Body: ProviderBody }>('/api/v1/providers', async (req, reply) => {
  const body = req.body as ProviderBody;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return reply.status(400).send({ error: 'name es obligatorio' });
  try {
    const provider = await prisma.provider.create({
      data: {
        name,
        identifier: body?.identifier?.trim() || null,
        legalName: body?.legalName?.trim() || null,
        tradeName: body?.tradeName?.trim() || null,
        province: body?.province?.trim() || null,
        canton: body?.canton?.trim() || null,
        address: body?.address?.trim() || null,
      },
    });
    await audit({ action: 'provider.create', entityType: 'Provider', entityId: provider.id, payload: { name: provider.name } });
    return reply.status(201).send(provider);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear proveedor' });
  }
});

// PUT /api/v1/providers/:id
type ProviderUpdateBody = { name?: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string; status?: string };
app.put<{ Params: { id: string }; Body: ProviderUpdateBody }>('/api/v1/providers/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as ProviderUpdateBody) || {};
  const data: { name?: string; identifier?: string | null; legalName?: string | null; tradeName?: string | null; province?: string | null; canton?: string | null; address?: string | null; status?: string } = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.identifier === 'string') data.identifier = body.identifier.trim() || null;
  if (typeof body.legalName === 'string') data.legalName = body.legalName.trim() || null;
  if (typeof body.tradeName === 'string') data.tradeName = body.tradeName.trim() || null;
  if (typeof body.province === 'string') data.province = body.province.trim() || null;
  if (typeof body.canton === 'string') data.canton = body.canton.trim() || null;
  if (typeof body.address === 'string') data.address = body.address.trim() || null;
  if (['active', 'inactive', 'suspended'].includes(String(body.status))) data.status = body.status;
  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
  try {
    const provider = await prisma.provider.update({ where: { id }, data });
    await audit({ action: 'provider.update', entityType: 'Provider', entityId: id, payload: data });
    return provider;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
      return reply.status(404).send({ error: 'Proveedor no encontrado' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar proveedor' });
  }
});

// POST /api/v1/tenders (crear proceso de contratación)
type TenderBody = { procurementPlanId: string; title: string; description?: string };
app.post<{ Body: TenderBody }>('/api/v1/tenders', async (req, reply) => {
  const body = req.body as TenderBody;
  const planId = typeof body?.procurementPlanId === 'string' ? body.procurementPlanId.trim() : '';
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!planId || !title) return reply.status(400).send({ error: 'procurementPlanId y title son obligatorios' });
  try {
    const plan = await prisma.procurementPlan.findUnique({ where: { id: planId } });
    if (!plan) return reply.status(400).send({ error: 'Plan de contratación no encontrado' });
    const tender = await prisma.tender.create({
      data: {
        procurementPlanId: planId,
        title,
        description: body?.description?.trim() || null,
      },
    });
    await audit({ action: 'tender.create', entityType: 'Tender', entityId: tender.id, payload: { title: tender.title } });
    return reply.status(201).send(tender);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear proceso' });
  }
});

// PUT /api/v1/tenders/:id (editar proceso; solo draft)
type TenderUpdateBody = { title?: string; description?: string; status?: string };
app.put<{ Params: { id: string }; Body: TenderUpdateBody }>('/api/v1/tenders/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as TenderUpdateBody) || {};
  const data: { title?: string; description?: string | null; status?: string; publishedAt?: Date | null } = {};
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === 'string') data.description = body.description.trim() || null;
  if (['draft', 'published', 'closed'].includes(String(body.status))) {
    data.status = body.status;
    if (body.status === 'published') data.publishedAt = new Date();
  }
  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
  try {
    const tender = await prisma.tender.update({ where: { id }, data });
    await audit({ action: 'tender.update', entityType: 'Tender', entityId: id, payload: data });
    return tender;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar proceso' });
  }
});

// PAC (Plan Anual de Contratación; Docs/03_technical_specs/05_MODULE_PAC)
app.get<{ Querystring: { entityId?: string; year?: string } }>('/api/v1/pac', async (req, reply) => {
  const { entityId, year } = req.query;
  try {
    const where: { entityId?: string; year?: number } = {};
    if (entityId) where.entityId = entityId;
    if (year) where.year = parseInt(year, 10);
    const plans = await prisma.procurementPlan.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: [{ year: 'desc' }, { updatedAt: 'desc' }],
      include: { entity: { select: { id: true, name: true, code: true } } },
    });
    return { data: plans };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar PAC' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/pac/:id', async (req, reply) => {
  const { id } = req.params;
  try {
    const plan = await prisma.procurementPlan.findUnique({
      where: { id },
      include: { entity: true, tenders: { select: { id: true, title: true, status: true } } },
    });
    if (!plan) return reply.status(404).send({ error: 'PAC no encontrado' });
    return plan;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener PAC' });
  }
});

type PacBody = { entityId: string; year: number; totalAmount?: number };
app.post<{ Body: PacBody }>('/api/v1/pac', async (req, reply) => {
  const body = req.body as PacBody;
  const entityId = typeof body?.entityId === 'string' ? body.entityId.trim() : '';
  const year = typeof body?.year === 'number' ? body.year : parseInt(String(body?.year), 10);
  if (!entityId || !Number.isInteger(year) || year < 2000) return reply.status(400).send({ error: 'entityId y year (entero >= 2000) son obligatorios' });
  try {
    const entity = await prisma.entity.findUnique({ where: { id: entityId } });
    if (!entity) return reply.status(400).send({ error: 'Entidad no encontrada' });
    const plan = await prisma.procurementPlan.create({
      data: {
        entityId,
        year,
        totalAmount: body?.totalAmount != null ? body.totalAmount : 0,
      },
    });
    await audit({ action: 'pac.create', entityType: 'ProcurementPlan', entityId: plan.id, payload: { year: plan.year } });
    return reply.status(201).send(plan);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear PAC' });
  }
});

type PacUpdateBody = { status?: string; totalAmount?: number };
app.put<{ Params: { id: string }; Body: PacUpdateBody }>('/api/v1/pac/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as PacUpdateBody) || {};
  const data: { status?: string; totalAmount?: number; publishedAt?: Date | null } = {};
  if (['draft', 'published'].includes(String(body.status))) {
    data.status = body.status;
    if (body.status === 'published') data.publishedAt = new Date();
  }
  if (typeof body.totalAmount === 'number') data.totalAmount = body.totalAmount;
  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
  try {
    const plan = await prisma.procurementPlan.update({ where: { id }, data });
    await audit({ action: 'pac.update', entityType: 'ProcurementPlan', entityId: id, payload: data });
    return plan;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
      return reply.status(404).send({ error: 'PAC no encontrado' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar PAC' });
  }
});

// Bids (ofertas; Docs/03_technical_specs/06_MODULE_PROCUREMENT)
app.get<{ Params: { id: string } }>('/api/v1/tenders/:id/bids', async (req, reply) => {
  const { id } = req.params;
  try {
    const tender = await prisma.tender.findUnique({ where: { id } });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const bids = await prisma.bid.findMany({
      where: { tenderId: id },
      include: { provider: { select: { id: true, name: true, identifier: true } } },
    });
    return { data: bids };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar ofertas' });
  }
});

type BidBody = { providerId: string; amount?: number };
app.post<{ Params: { id: string }; Body: BidBody }>('/api/v1/tenders/:id/bids', async (req, reply) => {
  const tenderId = req.params.id;
  const body = req.body as BidBody;
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  if (!providerId) return reply.status(400).send({ error: 'providerId es obligatorio' });
  try {
    const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) return reply.status(400).send({ error: 'Proveedor no encontrado' });
    const bid = await prisma.bid.create({
      data: {
        tenderId,
        providerId,
        amount: body?.amount != null ? body.amount : undefined,
        submittedAt: new Date(),
      },
    });
    await audit({ action: 'bid.create', entityType: 'Bid', entityId: bid.id, payload: { tenderId, providerId } });
    return reply.status(201).send(bid);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear oferta' });
  }
});

// Contract (adjudicación; Docs/03_technical_specs/09_DATA_MODEL)
app.get<{ Params: { id: string } }>('/api/v1/tenders/:id/contract', async (req, reply) => {
  const { id } = req.params;
  try {
    const contract = await prisma.contract.findUnique({
      where: { tenderId: id },
      include: { provider: { select: { id: true, name: true, identifier: true } } },
    });
    if (!contract) return reply.status(404).send({ error: 'Contrato no encontrado' });
    return contract;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener contrato' });
  }
});

type ContractBody = { providerId: string; contractNo?: string; amount?: number };
app.post<{ Params: { id: string }; Body: ContractBody }>('/api/v1/tenders/:id/contract', async (req, reply) => {
  const tenderId = req.params.id;
  const body = req.body as ContractBody;
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  if (!providerId) return reply.status(400).send({ error: 'providerId es obligatorio' });
  try {
    const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) return reply.status(400).send({ error: 'Proveedor no encontrado' });
    const existing = await prisma.contract.findUnique({ where: { tenderId } });
    if (existing) return reply.status(400).send({ error: 'El proceso ya tiene un contrato' });
    const contract = await prisma.contract.create({
      data: {
        tenderId,
        providerId,
        contractNo: body?.contractNo?.trim() || undefined,
        amount: body?.amount != null ? body.amount : undefined,
      },
    });
    await audit({ action: 'contract.create', entityType: 'Contract', entityId: contract.id, payload: { tenderId, providerId } });
    return reply.status(201).send(contract);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear contrato' });
  }
});

// Fase 4: Documentos (MinIO/S3)
app.post('/api/v1/documents/upload', async (req, reply) => {
  if (!isStorageConfigured()) return reply.status(503).send({ error: 'Almacenamiento de documentos no configurado (S3_*)' });
  try {
    const parts = req.parts();
    let ownerType = '';
    let ownerId = '';
    let documentType = 'attachment';
    let isPublic = false;
    let fileData: { stream: NodeJS.ReadableStream; filename: string; mimetype: string } | null = null;
    for await (const part of parts) {
      if (part.type === 'field') {
        const v = (part as { fieldname: string; value: string }).value;
        if (part.fieldname === 'ownerType') ownerType = v.trim();
        else if (part.fieldname === 'ownerId') ownerId = v.trim();
        else if (part.fieldname === 'documentType') documentType = v.trim() || 'attachment';
        else if (part.fieldname === 'isPublic') isPublic = v === 'true' || v === '1';
      } else if (part.type === 'file' && part.fieldname === 'file') {
        const f = part as { file: NodeJS.ReadableStream; filename: string; mimetype: string };
        fileData = { stream: f.file, filename: f.filename || 'file', mimetype: f.mimetype || 'application/octet-stream' };
      }
    }
    if (!ownerType || !ownerId) return reply.status(400).send({ error: 'ownerType y ownerId son obligatorios' });
    if (!fileData) return reply.status(400).send({ error: 'Campo "file" es obligatorio' });
    await ensureBucket();
    const key = `${ownerType}/${ownerId}/${crypto.randomUUID()}-${fileData.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await uploadStream(key, fileData.stream, fileData.mimetype);
    const doc = await prisma.document.create({
      data: { ownerType, ownerId, documentType, fileName: fileData.filename, storageKey: key, isPublic },
    });
    await audit({ action: 'document.upload', entityType: 'Document', entityId: doc.id, payload: { ownerType, ownerId } });
    return reply.status(201).send(doc);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al subir documento' });
  }
});

app.get<{ Querystring: { ownerType?: string; ownerId?: string } }>('/api/v1/documents', async (req, reply) => {
  const ownerType = typeof req.query?.ownerType === 'string' ? req.query.ownerType.trim() : '';
  const ownerId = typeof req.query?.ownerId === 'string' ? req.query.ownerId.trim() : '';
  if (!ownerType || !ownerId) return reply.status(400).send({ error: 'ownerType y ownerId son obligatorios' });
  try {
    const docs = await prisma.document.findMany({ where: { ownerType, ownerId }, orderBy: { createdAt: 'desc' } });
    return { data: docs };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar documentos' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/documents/:id', async (req, reply) => {
  const { id } = req.params;
  try {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return reply.status(404).send({ error: 'Documento no encontrado' });
    const out: Record<string, unknown> = { ...doc };
    if (isStorageConfigured()) {
      try {
        (out as Record<string, unknown>).downloadUrl = await getDownloadUrl(doc.storageKey);
      } catch (_) {
        (out as Record<string, unknown>).downloadUrl = null;
      }
    }
    return out;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener documento' });
  }
});

// Fase 4: Analítica básica (dashboard; ruta protegida)
app.get('/api/v1/analytics/dashboard', async (req, reply) => {
  try {
    const [tenders, providers, contracts, documents] = await Promise.all([
      prisma.tender.count(),
      prisma.provider.count(),
      prisma.contract.count(),
      prisma.document.count(),
    ]);
    const tendersPublished = await prisma.tender.count({ where: { status: 'published' } });
    return {
      tenders,
      tendersPublished,
      providers,
      contracts,
      documents,
    };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener estadísticas' });
  }
});

// Analítica pública (portal cifras; sin auth)
app.get('/api/v1/analytics/public', async (req, reply) => {
  try {
    const [tenders, tendersPublished, providers, contracts] = await Promise.all([
      prisma.tender.count(),
      prisma.tender.count({ where: { status: 'published' } }),
      prisma.provider.count(),
      prisma.contract.count(),
    ]);
    return { tenders, tendersPublished, providers, contracts };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener estadísticas' });
  }
});

// Auditoría (protegido; admin/entity)
app.get<{ Querystring: { limit?: string; offset?: string; action?: string; entityType?: string } }>(
  '/api/v1/audit',
  async (req, reply) => {
    try {
      const limit = Math.min(parseInt(req.query?.limit || '50', 10), 100);
      const offset = parseInt(req.query?.offset || '0', 10);
      const where: Record<string, unknown> = {};
      if (typeof req.query?.action === 'string' && req.query.action.trim())
        where.action = { contains: req.query.action.trim(), mode: 'insensitive' };
      if (typeof req.query?.entityType === 'string' && req.query.entityType.trim())
        where.entityType = req.query.entityType.trim();
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: where as object,
          orderBy: { occurredAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.auditLog.count({ where: where as object }),
      ]);
      return { data: logs, total };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al obtener auditoría' });
    }
  }
);

// Entities CRUD (protegido; admin)
app.get('/api/v1/entities', async (req, reply) => {
  try {
    const entities = await prisma.entity.findMany({ orderBy: { name: 'asc' } });
    return { data: entities };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar entidades' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/entities/:id', async (req, reply) => {
  const { id } = req.params;
  try {
    const entity = await prisma.entity.findUnique({ where: { id } });
    if (!entity) return reply.status(404).send({ error: 'Entidad no encontrada' });
    return entity;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener entidad' });
  }
});

type EntityBody = { name: string; code?: string; legalName?: string; organizationType?: string };
app.post<{ Body: EntityBody }>('/api/v1/entities', async (req, reply) => {
  const body = req.body as EntityBody;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return reply.status(400).send({ error: 'name es obligatorio' });
  try {
    const entity = await prisma.entity.create({
      data: {
        name,
        code: body?.code?.trim() || null,
        legalName: body?.legalName?.trim() || null,
        organizationType: body?.organizationType?.trim() || null,
      },
    });
    await audit({ action: 'entity.create', entityType: 'Entity', entityId: entity.id, payload: { name } });
    return reply.status(201).send(entity);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear entidad' });
  }
});

type EntityUpdateBody = { name?: string; code?: string; legalName?: string; organizationType?: string };
app.put<{ Params: { id: string }; Body: EntityUpdateBody }>('/api/v1/entities/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as EntityUpdateBody) || {};
  const data: Record<string, string | null> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.code === 'string') data.code = body.code.trim() || null;
  if (typeof body.legalName === 'string') data.legalName = body.legalName.trim() || null;
  if (typeof body.organizationType === 'string') data.organizationType = body.organizationType.trim() || null;
  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
  try {
    const entity = await prisma.entity.update({ where: { id }, data });
    await audit({ action: 'entity.update', entityType: 'Entity', entityId: id, payload: data });
    return entity;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
      return reply.status(404).send({ error: 'Entidad no encontrada' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar entidad' });
  }
});

// Users (protegido; admin recomendado) – listado para panel admin
app.get<{
  Querystring: { limit?: string; offset?: string; organizationId?: string };
}>('/api/v1/users', async (req, reply) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit || '50', 10) || 50));
    const offset = Math.max(0, parseInt(req.query?.offset || '0', 10) || 0);
    const organizationId = typeof req.query?.organizationId === 'string' ? req.query.organizationId.trim() : undefined;
    const where = organizationId ? { organizationId } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { email: 'asc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          organizationId: true,
          organization: { select: { name: true, code: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { data: users, total };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar usuarios' });
  }
});

// Evaluations CRUD (protegido)
app.get<{ Params: { id: string } }>('/api/v1/tenders/:id/evaluations', async (req, reply) => {
  const { id } = req.params;
  try {
    const evals = await prisma.evaluation.findMany({
      where: { tenderId: id },
      include: { bid: { include: { provider: { select: { name: true, identifier: true } } } } },
    });
    return { data: evals };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar evaluaciones' });
  }
});

type EvaluationBody = { bidId: string; technicalScore?: number; financialScore?: number; totalScore?: number; status?: string };
app.post<{ Params: { id: string }; Body: EvaluationBody }>('/api/v1/tenders/:id/evaluations', async (req, reply) => {
  const tenderId = req.params.id;
  const body = req.body as EvaluationBody;
  const bidId = typeof body?.bidId === 'string' ? body.bidId.trim() : '';
  if (!bidId) return reply.status(400).send({ error: 'bidId es obligatorio' });
  try {
    const bid = await prisma.bid.findFirst({ where: { id: bidId, tenderId } });
    if (!bid) return reply.status(400).send({ error: 'Oferta no encontrada para este proceso' });
    const ev = await prisma.evaluation.create({
      data: {
        tenderId,
        bidId,
        technicalScore: body?.technicalScore,
        financialScore: body?.financialScore,
        totalScore: body?.totalScore,
        status: body?.status || 'pending',
      },
    });
    await audit({ action: 'evaluation.create', entityType: 'Evaluation', entityId: ev.id, payload: { tenderId, bidId } });
    return reply.status(201).send(ev);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear evaluación' });
  }
});

// RAG (Fase 4b) – búsqueda full-text en normativa/manuales (RagChunk)
app.get<{ Querystring: { q?: string; limit?: string } }>('/api/v1/rag/search', async (req, reply) => {
  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(Number(req.query?.limit) || 5, 20);
  if (!q) return reply.status(400).send({ error: 'Parámetro q es obligatorio' });
  try {
    const results = await searchRag(q, limit);
    return { results };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error en búsqueda RAG' });
  }
});

type RagAskBody = { question: string };
app.post<{ Body: RagAskBody }>('/api/v1/rag/ask', async (req, reply) => {
  const body = req.body as RagAskBody;
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question) return reply.status(400).send({ error: 'question es obligatorio' });
  try {
    const chunks = await searchRag(question, 3);
    const sources = chunks.map((c) => ({ title: c.title, id: c.id }));
    // Stub: sin LLM, devolvemos contexto de los chunks. En producción: enviar chunks a LLM para generar respuesta.
    const answer =
      chunks.length > 0
        ? `Según la normativa encontrada: ${chunks.map((c) => c.snippet || c.title).join(' ').slice(0, 500)}...`
        : `No se encontraron documentos relacionados con "${question}". Consulte el manual de contratación o la LOSNCP.`;
    return { answer, sources };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error en RAG ask' });
  }
});

// RAG chunks CRUD (protegido; admin) – gestión de chunks para búsqueda RAG
app.get<{
  Querystring: { limit?: string; offset?: string; source?: string; documentType?: string };
}>('/api/v1/rag/chunks', async (req, reply) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit || '20', 10) || 20));
    const offset = Math.max(0, parseInt(req.query?.offset || '0', 10) || 0);
    const where: Record<string, unknown> = {};
    if (typeof req.query?.source === 'string' && req.query.source.trim()) where.source = req.query.source.trim();
    if (typeof req.query?.documentType === 'string' && req.query.documentType.trim())
      where.documentType = req.query.documentType.trim();
    const [data, total] = await Promise.all([
      prisma.ragChunk.findMany({ where, orderBy: { createdAt: 'desc' }, skip: offset, take: limit }),
      prisma.ragChunk.count({ where }),
    ]);
    return { data, total };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar chunks RAG' });
  }
});

type RagChunkBody = {
  title: string;
  content: string;
  source: string;
  documentType: string;
  url?: string;
  date?: string;
  jurisdiction?: string;
  version?: string;
};
app.post<{ Body: RagChunkBody }>('/api/v1/rag/chunks', async (req, reply) => {
  const body = req.body as RagChunkBody;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const source = typeof body?.source === 'string' ? body.source.trim() : '';
  const documentType = typeof body?.documentType === 'string' ? body.documentType.trim() : '';
  if (!title || !content || !source || !documentType)
    return reply.status(400).send({ error: 'title, content, source y documentType son obligatorios' });
  try {
    const chunk = await prisma.ragChunk.create({
      data: {
        title,
        content,
        source,
        documentType,
        url: typeof body?.url === 'string' ? body.url.trim() || null : null,
        date: body?.date ? new Date(body.date) : null,
        jurisdiction: typeof body?.jurisdiction === 'string' ? body.jurisdiction.trim() || null : null,
        version: typeof body?.version === 'string' ? body.version.trim() || null : null,
      },
    });
    await audit({ action: 'ragchunk.create', entityType: 'RagChunk', entityId: chunk.id, payload: { title } });
    return reply.status(201).send(chunk);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear chunk RAG' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/rag/chunks/:id', async (req, reply) => {
  const { id } = req.params;
  try {
    const chunk = await prisma.ragChunk.findUnique({ where: { id } });
    if (!chunk) return reply.status(404).send({ error: 'Chunk no encontrado' });
    return chunk;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener chunk' });
  }
});

app.put<{ Params: { id: string }; Body: RagChunkBody }>('/api/v1/rag/chunks/:id', async (req, reply) => {
  const { id } = req.params;
  const body = req.body as RagChunkBody;
  const data: Record<string, unknown> = {};
  if (typeof body?.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body?.content === 'string') data.content = body.content.trim();
  if (typeof body?.source === 'string' && body.source.trim()) data.source = body.source.trim();
  if (typeof body?.documentType === 'string' && body.documentType.trim()) data.documentType = body.documentType.trim();
  if (typeof body?.url === 'string') data.url = body.url.trim() || null;
  if (typeof body?.date === 'string') data.date = body.date ? new Date(body.date) : null;
  if (typeof body?.jurisdiction === 'string') data.jurisdiction = body.jurisdiction.trim() || null;
  if (typeof body?.version === 'string') data.version = body.version.trim() || null;
  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
  try {
    const chunk = await prisma.ragChunk.update({ where: { id }, data: data as object });
    await audit({ action: 'ragchunk.update', entityType: 'RagChunk', entityId: id, payload: data });
    return chunk;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
      return reply.status(404).send({ error: 'Chunk no encontrado' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar chunk' });
  }
});

app.delete<{ Params: { id: string } }>('/api/v1/rag/chunks/:id', async (req, reply) => {
  const { id } = req.params;
  try {
    await prisma.ragChunk.delete({ where: { id } });
    await audit({ action: 'ragchunk.delete', entityType: 'RagChunk', entityId: id, payload: {} });
    return reply.status(204).send();
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
      return reply.status(404).send({ error: 'Chunk no encontrado' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al eliminar chunk' });
  }
});

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3080);

// Producción: exigir JWT_SECRET (mín. 16 caracteres) para no arrancar con auth desactivado
if (process.env.NODE_ENV === 'production' && !hasJwtSecret()) {
  app.log.error('En producción JWT_SECRET es obligatorio y debe tener al menos 16 caracteres. No se inicia la API.');
  process.exit(1);
}

try {
  await app.listen({ host, port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
