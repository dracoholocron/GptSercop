import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { prisma } from './db.js';
import { audit } from './audit.js';
import { authPlugin } from './authPlugin.js';
import { sign, hasJwtSecret } from './auth.js';
import { isStorageConfigured, ensureBucket, uploadStream, getDownloadUrl, getUploadUrl } from './storage.js';
import { isRedisConfigured, pingRedis } from './redis.js';
import { searchRag } from './rag.js';
import { openapiSpec } from './openapi.js';
import { getCpcSuggestions } from './cpc.js';
import { Prisma } from '@prisma/client';

const app = Fastify({ logger: true, bodyLimit: 20 * 1024 * 1024 }); // 20MB (wizard docs usa presign; multipart legacy también)

// CORS: en producción usar CORS_ALLOWED_ORIGINS (lista separada por coma); si no, permitir todo (desarrollo)
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.trim();
const corsOpt = corsOrigins
  ? { origin: corsOrigins.split(',').map((o) => o.trim()).filter(Boolean) }
  : { origin: true };
await app.register(cors, corsOpt);
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB por archivo (legacy)
await app.register(authPlugin);

// Bucket MinIO se crea en el primer upload si hace falta

// Security headers (Fase 2)
app.addHook('onSend', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
});

// Login (Fase 2): emite JWT para pruebas; en producción usar IdP OIDC.
// Inspirado en portal legacy: puede recibir email o combinación RUC/usuario/password,
// pero por ahora solo se usa email + role (+ identifier/entityId como stub).
type LoginBody = {
  email?: string;
  role?: string;
  identifier?: string; // RUC proveedor/entidad (legacy: txtRUCRecordatorio)
  username?: string; // legacy: txtLogin (no usado aún para lookup)
  password?: string; // legacy: txtPassword (no persistido en este MVP)
  entityId?: string;
};
app.post<{ Body: LoginBody }>('/api/v1/auth/login', async (req, reply) => {
  const body = req.body as LoginBody;
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  // Para mantener compatibilidad y simplicidad, seguimos usando email como subject principal.
  // En una iteración futura se podría permitir login por RUC+usuario sin email.
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

// Recuperación de contraseña (MVP inspirado en EP/ReseteoContraseniaProveedor.cpe).
// No persiste contraseñas en este MVP; genera respuesta stub para pruebas.
type ResetRequestBody = { identifier?: string; email?: string; birthDate?: string };
app.post<{ Body: ResetRequestBody }>('/api/v1/auth/reset-request', async (req, reply) => {
  const body = req.body as ResetRequestBody;
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (!identifier && !email)
    return reply.status(400).send({ error: 'Debe proporcionar al menos RUC/identificador o correo electrónico' });
  // En una implementación completa se validaría contra Provider/User y se enviaría correo con token.
  return reply.status(200).send({ ok: true, message: 'Si los datos corresponden a una cuenta, se enviará un enlace de recuperación.' });
});

type ResetConfirmBody = { token: string; newPassword: string };
app.post<{ Body: ResetConfirmBody }>('/api/v1/auth/reset-confirm', async (req, reply) => {
  const body = req.body as ResetConfirmBody;
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
  if (!token || !newPassword)
    return reply.status(400).send({ error: 'token y newPassword son obligatorios' });
  if (newPassword.length < 8)
    return reply.status(400).send({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  // En una implementación completa se verificaría el token, se localizaría el usuario y se actualizaría el hash.
  return reply.status(200).send({ ok: true });
});

// RUP – Registro proveedor (wizard FO/RPE 1–8): API de borrador por pasos.
type RupRegistrationStepBody = {
  step: number;
  data: Record<string, unknown>;
};

// Obtiene el borrador de registro RUP para el proveedor autenticado (supplier).
app.get('/api/v1/rup/registration', async (req, reply) => {
  const user = req.user;
  if (!user || user.role !== 'supplier') return reply.status(401).send({ error: 'Solo proveedores autenticados pueden acceder a su registro RUP' });
  // En este MVP usamos email como sub; en una iteración siguiente se podría enlazar a providerId almacenado en claims.
  const email = user.sub;
  const provider = await prisma.provider.findFirst({
    where: { identifier: email },
    select: { id: true, registrationStep: true, registrationData: true },
  });
  // Si aún no existe un registro, devolver un borrador vacío.
  if (!provider) return reply.status(200).send({ data: { registrationStep: 0, registrationData: null } });
  return reply.status(200).send({ data: provider });
});

// Actualiza el borrador de registro RUP para un paso específico.
app.patch<{ Body: RupRegistrationStepBody }>('/api/v1/rup/registration', async (req, reply) => {
  const user = req.user;
  if (!user || user.role !== 'supplier') return reply.status(401).send({ error: 'Solo proveedores autenticados pueden actualizar su registro RUP' });
  const body = req.body as RupRegistrationStepBody;
  const step = typeof body?.step === 'number' ? body.step : NaN;
  if (!Number.isInteger(step) || step < 1 || step > 8)
    return reply.status(400).send({ error: 'step debe estar entre 1 y 8' });
  const data = body?.data && typeof body.data === 'object' ? body.data : {};
  const email = user.sub;
  // En este MVP usamos identifier=email como stub para localizar el proveedor.
  let provider = await prisma.provider.findFirst({ where: { identifier: email } });
  if (!provider) {
    provider = await prisma.provider.create({
      data: {
        name: email,
        identifier: email,
        status: 'active',
        registrationStep: step,
        registrationData: data as Prisma.InputJsonValue,
      },
    });
    return reply.status(200).send({ data: provider });
  }
  const nextStep = Math.max(provider.registrationStep ?? 0, step);
  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      registrationStep: nextStep,
      registrationData: data as Prisma.InputJsonValue,
    },
    select: { id: true, registrationStep: true, registrationData: true },
  });
  return reply.status(200).send({ data: updated });
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
const TERRITORY_PREFERENCE_VALUES = ['ninguna', 'amazonia', 'galapagos'] as const;

// Cronograma licitación: días mínimos por monto (art. 91 preguntas, art. 96 entrega ofertas – Reglamento LOSNCP)
function getMinDaysQuestions(amount: number): number {
  if (amount > 500_000) return 10;
  if (amount > 100_000) return 4;
  if (amount > 10_000) return 2;
  return 0;
}
function getMinDaysBids(amount: number): number {
  if (amount >= 1_000_000) return 10;
  if (amount > 500_000) return 6;
  if (amount > 100_000) return 4;
  if (amount > 10_000) return 2;
  return 0;
}
function calendarDaysBetween(d1: Date, d2: Date): number {
  return Math.floor((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
}

app.get<{
  Querystring: {
    entityId?: string;
    method?: string;
    processType?: string;
    regime?: string;
    territoryPreference?: string;
    isRestrictedVisibility?: string;
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
    if (typeof q.processType === 'string' && q.processType.trim()) where.processType = q.processType.trim();
    if (typeof q.regime === 'string' && q.regime.trim()) where.regime = q.regime.trim();
    const tp = typeof q.territoryPreference === 'string' ? q.territoryPreference.trim().toLowerCase() : '';
    if (TERRITORY_PREFERENCE_VALUES.includes(tp as (typeof TERRITORY_PREFERENCE_VALUES)[number])) where.territoryPreference = tp;
    if (q.isRestrictedVisibility === 'true') where.isRestrictedVisibility = true;
    if (q.isRestrictedVisibility === 'false') where.isRestrictedVisibility = false;
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
          processType: true,
          regime: true,
          isRestrictedVisibility: true,
          estimatedAmount: true,
          territoryPreference: true,
          minimumQuotes: true,
          marketStudyDocumentId: true,
          apuDocumentId: true,
          liberationRequestedAt: true,
          liberationApprovedAt: true,
          liberationDocumentId: true,
          contingencyPlanDocumentId: true,
          referenceBudgetAmount: true,
          questionsDeadlineAt: true,
          bidsDeadlineAt: true,
          responsibleType: true,
          electronicSignatureRequired: true,
          bidsOpenedAt: true,
          bidOpeningActDocumentId: true,
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
      select: { id: true, name: true, identifier: true, status: true, legalName: true, tradeName: true, province: true, canton: true, address: true, isCompliantSRI: true, isCompliantIESS: true },
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
type ProviderUpdateBody = {
  name?: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string; status?: string;
  registrationStep?: number; registrationData?: Record<string, unknown>; activityCodes?: string[];
  legalEstablishmentDate?: string | null;
  patrimonyAmount?: number | null;
  isCompliantSRI?: boolean | null;
  isCompliantIESS?: boolean | null;
};
app.put<{ Params: { id: string }; Body: ProviderUpdateBody }>('/api/v1/providers/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as ProviderUpdateBody) || {};
  const data: Prisma.ProviderUpdateInput = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.identifier === 'string') data.identifier = body.identifier.trim() || null;
  if (typeof body.legalName === 'string') data.legalName = body.legalName.trim() || null;
  if (typeof body.tradeName === 'string') data.tradeName = body.tradeName.trim() || null;
  if (typeof body.province === 'string') data.province = body.province.trim() || null;
  if (typeof body.canton === 'string') data.canton = body.canton.trim() || null;
  if (typeof body.address === 'string') data.address = body.address.trim() || null;
  if (['active', 'inactive', 'suspended'].includes(String(body.status))) data.status = body.status;
  if (typeof body.registrationStep === 'number' && body.registrationStep >= 0 && body.registrationStep <= 14)
    data.registrationStep = body.registrationStep;
  if (body.registrationData && typeof body.registrationData === 'object')
    data.registrationData = body.registrationData as Prisma.InputJsonValue;
  if (Array.isArray(body.activityCodes)) data.activityCodes = body.activityCodes.filter((c): c is string => typeof c === 'string');
  if (body.legalEstablishmentDate !== undefined) {
    if (body.legalEstablishmentDate === null) data.legalEstablishmentDate = null;
    else if (typeof body.legalEstablishmentDate === 'string' && body.legalEstablishmentDate.trim()) {
      const d = new Date(body.legalEstablishmentDate.trim());
      if (Number.isFinite(d.getTime())) data.legalEstablishmentDate = d;
    }
  }
  if (body.patrimonyAmount !== undefined)
    data.patrimonyAmount = typeof body.patrimonyAmount === 'number' && Number.isFinite(body.patrimonyAmount) ? body.patrimonyAmount : body.patrimonyAmount === null ? null : undefined;
  if (body.isCompliantSRI !== undefined) data.isCompliantSRI = typeof body.isCompliantSRI === 'boolean' ? body.isCompliantSRI : body.isCompliantSRI === null ? null : undefined;
  if (body.isCompliantIESS !== undefined) data.isCompliantIESS = typeof body.isCompliantIESS === 'boolean' ? body.isCompliantIESS : body.isCompliantIESS === null ? null : undefined;
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

// CPC (Clasificador Central de Productos) – ver módulo cpc.ts (stub; en producción integrar con SRI)
app.get<{ Querystring: { q?: string; limit?: string } }>('/api/v1/cpc/suggestions', async (req, reply) => {
  try {
    const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
    const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit || '15', 10) || 15));
    const data = getCpcSuggestions(q, limit);
    return { data };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener sugerencias CPC' });
  }
});

// POST /api/v1/tenders (crear proceso de contratación)
type TenderBody = {
  procurementPlanId: string;
  title: string;
  description?: string;
  procurementMethod?: string;
  processType?: string;
  regime?: string;
  territoryPreference?: string;
  isRestrictedVisibility?: boolean;
  claimWindowDays?: number;
  minimumQuotes?: number;
  marketStudyDocumentId?: string | null;
  apuDocumentId?: string | null;
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
};
app.post<{ Body: TenderBody }>('/api/v1/tenders', async (req, reply) => {
  const body = req.body as TenderBody;
  const planId = typeof body?.procurementPlanId === 'string' ? body.procurementPlanId.trim() : '';
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!planId || !title) return reply.status(400).send({ error: 'procurementPlanId y title son obligatorios' });
  try {
    const plan = await prisma.procurementPlan.findUnique({ where: { id: planId } });
    if (!plan) return reply.status(400).send({ error: 'Plan de contratación no encontrado' });
    const regime = typeof body?.regime === 'string' ? body.regime.trim() : '';
    let minimumQuotes: number | undefined;
    if (typeof body?.minimumQuotes === 'number' && Number.isInteger(body.minimumQuotes) && body.minimumQuotes > 0) {
      if (regime === 'infima_cuantia' && body.minimumQuotes < 3)
        return reply.status(400).send({ error: 'En ínfima cuantía el mínimo de cotizaciones debe ser al menos 3' });
      minimumQuotes = body.minimumQuotes;
    }
    const marketStudyDocumentId = typeof body?.marketStudyDocumentId === 'string' ? body.marketStudyDocumentId.trim() || null : body?.marketStudyDocumentId === null ? null : undefined;
    const apuDocumentId = typeof body?.apuDocumentId === 'string' ? body.apuDocumentId.trim() || null : body?.apuDocumentId === null ? null : undefined;
    const liberationDocumentId = typeof body?.liberationDocumentId === 'string' ? body.liberationDocumentId.trim() || null : body?.liberationDocumentId === null ? null : undefined;
    const contingencyPlanDocumentId = typeof body?.contingencyPlanDocumentId === 'string' ? body.contingencyPlanDocumentId.trim() || null : body?.contingencyPlanDocumentId === null ? null : undefined;
    const tp = typeof body?.territoryPreference === 'string' ? body.territoryPreference.trim().toLowerCase() : '';
    const territoryPreference = TERRITORY_PREFERENCE_VALUES.includes(tp as (typeof TERRITORY_PREFERENCE_VALUES)[number]) ? tp : null;
    const refBudget = body?.referenceBudgetAmount != null ? Number(body.referenceBudgetAmount) : body?.estimatedAmount != null ? Number(body.estimatedAmount) : null;
    if (refBudget !== null && !Number.isFinite(refBudget)) return reply.status(400).send({ error: 'referenceBudgetAmount o estimatedAmount deben ser numéricos' });
    const processType = typeof body?.processType === 'string' ? body.processType.trim() : '';
    if (processType === 'licitacion' && refBudget != null && refBudget <= 10_000)
      return reply.status(400).send({ error: 'Licitación bienes y servicios requiere presupuesto referencial superior a $10.000' });
    if (processType === 'licitacion_obras' && refBudget != null && refBudget <= 10_000)
      return reply.status(400).send({ error: 'Licitación de obras requiere presupuesto referencial superior a $10.000' });
    if (processType === 'sie' && refBudget != null && refBudget < 10_000)
      return reply.status(400).send({ error: 'Subasta inversa electrónica requiere presupuesto referencial mayor o igual a $10.000' });
    const responsibleType = (body?.responsibleType === 'commission' || body?.responsibleType === 'delegate') ? body.responsibleType : null;
    if (refBudget != null && refBudget >= 100_000 && responsibleType === 'delegate')
      return reply.status(400).send({ error: 'Para montos >= $100.000 debe designarse comisión técnica (responsibleType: commission)' });
    const parseDate = (s: string | null | undefined): Date | undefined => {
      if (!s || typeof s !== 'string') return undefined;
      const d = new Date(s);
      return Number.isFinite(d.getTime()) ? d : undefined;
    };
    const electronicSignatureRequired = typeof body?.electronicSignatureRequired === 'boolean' ? body.electronicSignatureRequired : true;
    const scoringDeadlineAt = parseDate(body?.scoringDeadlineAt);
    const awardResolutionDeadlineAt = parseDate(body?.awardResolutionDeadlineAt);
    if (scoringDeadlineAt && awardResolutionDeadlineAt) {
      const minAward = new Date(scoringDeadlineAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (awardResolutionDeadlineAt < minAward)
        return reply.status(400).send({ error: 'La fecha límite de resolución de adjudicación debe ser al menos 3 días después del fin de calificación (scoringDeadlineAt)' });
    }
    if ((processType === 'licitacion' || processType === 'licitacion_obras') && refBudget != null && Number.isFinite(refBudget) && refBudget > 0) {
      const now = new Date();
      const qDeadline = parseDate(body?.questionsDeadlineAt);
      const bDeadline = parseDate(body?.bidsDeadlineAt);
      if (qDeadline) {
        const minQ = getMinDaysQuestions(refBudget);
        if (minQ > 0 && calendarDaysBetween(now, qDeadline) < minQ)
          return reply.status(400).send({ error: `El plazo entre publicación y límite de preguntas no puede ser menor a ${minQ} días para el monto indicado (art. 91 Reglamento)` });
      }
      if (qDeadline && bDeadline) {
        const minB = getMinDaysBids(refBudget);
        if (minB > 0 && calendarDaysBetween(qDeadline, bDeadline) < minB)
          return reply.status(400).send({ error: `El plazo entre límite de preguntas y límite de ofertas no puede ser menor a ${minB} días para el monto indicado (art. 96 Reglamento)` });
      }
    }
    const convReq = parseDate(body?.convalidationRequestDeadlineAt);
    const convResp = parseDate(body?.convalidationResponseDeadlineAt);
    if (convReq && convResp) {
      const daysConv = calendarDaysBetween(convReq, convResp);
      if (daysConv < 2 || daysConv > 5)
        return reply.status(400).send({ error: 'El plazo de convalidación de errores debe ser entre 2 y 5 días (art. 100 Reglamento)' });
    }
    const tender = await prisma.tender.create({
      data: {
        procurementPlanId: planId,
        title,
        description: body?.description?.trim() || null,
        procurementMethod: typeof body?.procurementMethod === 'string' && body.procurementMethod.trim()
          ? body.procurementMethod.trim()
          : undefined,
        processType: processType || undefined,
        regime: regime || undefined,
        territoryPreference: territoryPreference || undefined,
        isRestrictedVisibility:
          typeof body?.isRestrictedVisibility === 'boolean' ? body.isRestrictedVisibility : undefined,
        claimWindowDays:
          typeof body?.claimWindowDays === 'number' && Number.isInteger(body.claimWindowDays) && body.claimWindowDays > 0
            ? body.claimWindowDays
            : undefined,
        minimumQuotes,
        marketStudyDocumentId: marketStudyDocumentId !== undefined ? marketStudyDocumentId : undefined,
        apuDocumentId: apuDocumentId !== undefined ? apuDocumentId : undefined,
        liberationDocumentId: liberationDocumentId !== undefined ? liberationDocumentId : undefined,
        contingencyPlanDocumentId: contingencyPlanDocumentId !== undefined ? contingencyPlanDocumentId : undefined,
        referenceBudgetAmount: refBudget != null ? refBudget : undefined,
        estimatedAmount: body?.estimatedAmount != null ? Number(body.estimatedAmount) : refBudget ?? undefined,
        questionsDeadlineAt: parseDate(body?.questionsDeadlineAt) ?? undefined,
        bidsDeadlineAt: parseDate(body?.bidsDeadlineAt) ?? undefined,
        clarificationResponseDeadlineAt: parseDate(body?.clarificationResponseDeadlineAt) ?? undefined,
        convalidationRequestDeadlineAt: parseDate(body?.convalidationRequestDeadlineAt) ?? undefined,
        convalidationResponseDeadlineAt: parseDate(body?.convalidationResponseDeadlineAt) ?? undefined,
        scoringDeadlineAt: scoringDeadlineAt ?? undefined,
        awardResolutionDeadlineAt: awardResolutionDeadlineAt ?? undefined,
        responsibleType: responsibleType ?? undefined,
        electronicSignatureRequired,
        sustainabilityCriteria: body?.sustainabilityCriteria && typeof body.sustainabilityCriteria === 'object' ? (body.sustainabilityCriteria as Prisma.InputJsonValue) : undefined,
        valueForMoneyCriteria: body?.valueForMoneyCriteria && typeof body.valueForMoneyCriteria === 'object' ? (body.valueForMoneyCriteria as Prisma.InputJsonValue) : undefined,
      },
    });
    await audit({ action: 'tender.create', entityType: 'Tender', entityId: tender.id, payload: { title: tender.title }, contractingEntityId: plan.entityId });
    return reply.status(201).send(tender);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear proceso' });
  }
});

// PUT /api/v1/tenders/:id (editar proceso; solo draft)
type TenderUpdateBody = {
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
   apuDocumentId?: string | null;
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
};
app.put<{ Params: { id: string }; Body: TenderUpdateBody }>('/api/v1/tenders/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as TenderUpdateBody) || {};
  const parseDateUp = (s: string | null | undefined): Date | undefined => {
    if (!s || typeof s !== 'string') return undefined;
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d : undefined;
  };
  const data: {
    title?: string;
    description?: string | null;
    status?: string;
    publishedAt?: Date | null;
    procurementMethod?: string;
    processType?: string | null;
    regime?: string | null;
    territoryPreference?: string | null;
    isRestrictedVisibility?: boolean;
    claimWindowDays?: number;
    minimumQuotes?: number | null;
    marketStudyDocumentId?: string | null;
    apuDocumentId?: string | null;
    liberationDocumentId?: string | null;
    contingencyPlanDocumentId?: string | null;
    referenceBudgetAmount?: number | null;
    estimatedAmount?: number | null;
    questionsDeadlineAt?: Date | null;
    bidsDeadlineAt?: Date | null;
    clarificationResponseDeadlineAt?: Date | null;
    convalidationRequestDeadlineAt?: Date | null;
    convalidationResponseDeadlineAt?: Date | null;
    scoringDeadlineAt?: Date | null;
    awardResolutionDeadlineAt?: Date | null;
    responsibleType?: string | null;
    electronicSignatureRequired?: boolean;
    sustainabilityCriteria?: object | null;
    valueForMoneyCriteria?: object | null;
  } = {};
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === 'string') data.description = body.description.trim() || null;
  if (['draft', 'published', 'closed'].includes(String(body.status))) {
    data.status = body.status;
    if (body.status === 'published') data.publishedAt = new Date();
  }
  if (typeof body.procurementMethod === 'string' && body.procurementMethod.trim())
    data.procurementMethod = body.procurementMethod.trim();
  if (typeof body.processType === 'string')
    data.processType = body.processType.trim() || null;
  if (typeof body.regime === 'string')
    data.regime = body.regime.trim() || null;
  if (body.territoryPreference !== undefined) {
    if (body.territoryPreference === null) data.territoryPreference = null;
    else {
      const tp = typeof body.territoryPreference === 'string' ? body.territoryPreference.trim().toLowerCase() : '';
      data.territoryPreference = TERRITORY_PREFERENCE_VALUES.includes(tp as (typeof TERRITORY_PREFERENCE_VALUES)[number]) ? tp : null;
    }
  }
  if (typeof body.isRestrictedVisibility === 'boolean')
    data.isRestrictedVisibility = body.isRestrictedVisibility;
  if (typeof body.claimWindowDays === 'number' && Number.isInteger(body.claimWindowDays) && body.claimWindowDays > 0)
    data.claimWindowDays = body.claimWindowDays;
  if (body.minimumQuotes !== undefined) {
    const v = body.minimumQuotes;
    data.minimumQuotes = typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null;
    if (data.minimumQuotes !== null && body.regime === 'infima_cuantia' && data.minimumQuotes < 3)
      return reply.status(400).send({ error: 'En ínfima cuantía el mínimo de cotizaciones debe ser al menos 3' });
  }
  if (body.marketStudyDocumentId !== undefined)
    data.marketStudyDocumentId = typeof body.marketStudyDocumentId === 'string' ? body.marketStudyDocumentId.trim() || null : null;
  if (body.apuDocumentId !== undefined)
    data.apuDocumentId = typeof body.apuDocumentId === 'string' ? body.apuDocumentId.trim() || null : null;
  if (body.liberationDocumentId !== undefined)
    data.liberationDocumentId = typeof body.liberationDocumentId === 'string' ? body.liberationDocumentId.trim() || null : null;
  if (body.contingencyPlanDocumentId !== undefined)
    data.contingencyPlanDocumentId = typeof body.contingencyPlanDocumentId === 'string' ? body.contingencyPlanDocumentId.trim() || null : null;
  if (body.sustainabilityCriteria !== undefined)
    data.sustainabilityCriteria = body.sustainabilityCriteria && typeof body.sustainabilityCriteria === 'object' ? body.sustainabilityCriteria : null;
  if (body.valueForMoneyCriteria !== undefined)
    data.valueForMoneyCriteria = body.valueForMoneyCriteria && typeof body.valueForMoneyCriteria === 'object' ? body.valueForMoneyCriteria : null;
  if (body.referenceBudgetAmount !== undefined)
    data.referenceBudgetAmount = typeof body.referenceBudgetAmount === 'number' && Number.isFinite(body.referenceBudgetAmount) ? body.referenceBudgetAmount : body.referenceBudgetAmount === null ? null : undefined;
  if (body.estimatedAmount !== undefined)
    data.estimatedAmount = typeof body.estimatedAmount === 'number' && Number.isFinite(body.estimatedAmount) ? body.estimatedAmount : body.estimatedAmount === null ? null : undefined;
  if (body.questionsDeadlineAt !== undefined) data.questionsDeadlineAt = parseDateUp(body.questionsDeadlineAt) ?? (body.questionsDeadlineAt === null ? null : undefined);
  if (body.bidsDeadlineAt !== undefined) data.bidsDeadlineAt = parseDateUp(body.bidsDeadlineAt) ?? (body.bidsDeadlineAt === null ? null : undefined);
  if (body.clarificationResponseDeadlineAt !== undefined) data.clarificationResponseDeadlineAt = parseDateUp(body.clarificationResponseDeadlineAt) ?? (body.clarificationResponseDeadlineAt === null ? null : undefined);
  if (body.convalidationRequestDeadlineAt !== undefined) data.convalidationRequestDeadlineAt = parseDateUp(body.convalidationRequestDeadlineAt) ?? (body.convalidationRequestDeadlineAt === null ? null : undefined);
  if (body.convalidationResponseDeadlineAt !== undefined) data.convalidationResponseDeadlineAt = parseDateUp(body.convalidationResponseDeadlineAt) ?? (body.convalidationResponseDeadlineAt === null ? null : undefined);
  if (body.scoringDeadlineAt !== undefined) data.scoringDeadlineAt = parseDateUp(body.scoringDeadlineAt) ?? (body.scoringDeadlineAt === null ? null : undefined);
  if (body.awardResolutionDeadlineAt !== undefined) data.awardResolutionDeadlineAt = parseDateUp(body.awardResolutionDeadlineAt) ?? (body.awardResolutionDeadlineAt === null ? null : undefined);
  if (body.responsibleType !== undefined)
    data.responsibleType = (body.responsibleType === 'commission' || body.responsibleType === 'delegate' || body.responsibleType === null) ? body.responsibleType : undefined;
  if (typeof body.electronicSignatureRequired === 'boolean') data.electronicSignatureRequired = body.electronicSignatureRequired;
  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
  const existing = await prisma.tender.findUnique({
    where: { id },
    select: {
      scoringDeadlineAt: true,
      awardResolutionDeadlineAt: true,
      processType: true,
      referenceBudgetAmount: true,
      estimatedAmount: true,
      publishedAt: true,
      createdAt: true,
      questionsDeadlineAt: true,
      bidsDeadlineAt: true,
      convalidationRequestDeadlineAt: true,
      convalidationResponseDeadlineAt: true,
    },
  });
  if (existing) {
    const effScoring = data.scoringDeadlineAt !== undefined ? data.scoringDeadlineAt : existing.scoringDeadlineAt;
    const effAward = data.awardResolutionDeadlineAt !== undefined ? data.awardResolutionDeadlineAt : existing.awardResolutionDeadlineAt;
    if (effScoring && effAward) {
      const minAward = new Date(effScoring.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (effAward < minAward)
        return reply.status(400).send({ error: 'La fecha límite de resolución de adjudicación debe ser al menos 3 días después del fin de calificación (scoringDeadlineAt)' });
    }
    const effProcessType = data.processType !== undefined ? data.processType : existing.processType;
    const effRefBudget = data.referenceBudgetAmount !== undefined ? data.referenceBudgetAmount : (existing.referenceBudgetAmount != null ? Number(existing.referenceBudgetAmount) : null);
    const effEstAmount = data.estimatedAmount !== undefined ? data.estimatedAmount : (existing.estimatedAmount != null ? Number(existing.estimatedAmount) : null);
    const refAmount = effRefBudget ?? effEstAmount;
    if ((effProcessType === 'licitacion' || effProcessType === 'licitacion_obras') && refAmount != null && Number.isFinite(refAmount) && refAmount > 0) {
      const effPublishedAt = data.publishedAt !== undefined ? data.publishedAt : existing.publishedAt;
      const effCreatedAt = existing.createdAt;
      const startQuestions = effPublishedAt ?? effCreatedAt;
      const effQ = data.questionsDeadlineAt !== undefined ? data.questionsDeadlineAt : existing.questionsDeadlineAt;
      const effB = data.bidsDeadlineAt !== undefined ? data.bidsDeadlineAt : existing.bidsDeadlineAt;
      if (effQ && startQuestions) {
        const minQ = getMinDaysQuestions(refAmount);
        if (minQ > 0 && calendarDaysBetween(startQuestions, effQ) < minQ)
          return reply.status(400).send({ error: `El plazo entre publicación y límite de preguntas no puede ser menor a ${minQ} días para el monto indicado (art. 91 Reglamento)` });
      }
      if (effQ && effB) {
        const minB = getMinDaysBids(refAmount);
        if (minB > 0 && calendarDaysBetween(effQ, effB) < minB)
          return reply.status(400).send({ error: `El plazo entre límite de preguntas y límite de ofertas no puede ser menor a ${minB} días para el monto indicado (art. 96 Reglamento)` });
      }
    }
    if (effProcessType === 'sie' && refAmount != null && Number.isFinite(refAmount) && refAmount < 10_000)
      return reply.status(400).send({ error: 'Subasta inversa electrónica requiere presupuesto referencial mayor o igual a $10.000' });
    const effConvReq = data.convalidationRequestDeadlineAt !== undefined ? data.convalidationRequestDeadlineAt : existing.convalidationRequestDeadlineAt;
    const effConvResp = data.convalidationResponseDeadlineAt !== undefined ? data.convalidationResponseDeadlineAt : existing.convalidationResponseDeadlineAt;
    if (effConvReq && effConvResp) {
      const daysConv = calendarDaysBetween(effConvReq, effConvResp);
      if (daysConv < 2 || daysConv > 5)
        return reply.status(400).send({ error: 'El plazo de convalidación de errores debe ser entre 2 y 5 días (art. 100 Reglamento)' });
    }
  }
  const updatePayload: Prisma.TenderUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt }),
    ...(data.procurementMethod !== undefined && { procurementMethod: data.procurementMethod }),
    ...(data.processType !== undefined && { processType: data.processType }),
    ...(data.regime !== undefined && { regime: data.regime }),
    ...(data.territoryPreference !== undefined && { territoryPreference: data.territoryPreference }),
    ...(data.isRestrictedVisibility !== undefined && { isRestrictedVisibility: data.isRestrictedVisibility }),
    ...(data.claimWindowDays !== undefined && { claimWindowDays: data.claimWindowDays }),
    ...(data.minimumQuotes !== undefined && { minimumQuotes: data.minimumQuotes }),
    ...(data.marketStudyDocumentId !== undefined && { marketStudyDocumentId: data.marketStudyDocumentId }),
    ...(data.apuDocumentId !== undefined && { apuDocumentId: data.apuDocumentId }),
    ...(data.liberationDocumentId !== undefined && { liberationDocumentId: data.liberationDocumentId }),
    ...(data.contingencyPlanDocumentId !== undefined && { contingencyPlanDocumentId: data.contingencyPlanDocumentId }),
    ...(data.referenceBudgetAmount !== undefined && { referenceBudgetAmount: data.referenceBudgetAmount }),
    ...(data.estimatedAmount !== undefined && { estimatedAmount: data.estimatedAmount }),
    ...(data.questionsDeadlineAt !== undefined && { questionsDeadlineAt: data.questionsDeadlineAt }),
    ...(data.bidsDeadlineAt !== undefined && { bidsDeadlineAt: data.bidsDeadlineAt }),
    ...(data.clarificationResponseDeadlineAt !== undefined && { clarificationResponseDeadlineAt: data.clarificationResponseDeadlineAt }),
    ...(data.convalidationRequestDeadlineAt !== undefined && { convalidationRequestDeadlineAt: data.convalidationRequestDeadlineAt }),
    ...(data.convalidationResponseDeadlineAt !== undefined && { convalidationResponseDeadlineAt: data.convalidationResponseDeadlineAt }),
    ...(data.scoringDeadlineAt !== undefined && { scoringDeadlineAt: data.scoringDeadlineAt }),
    ...(data.awardResolutionDeadlineAt !== undefined && { awardResolutionDeadlineAt: data.awardResolutionDeadlineAt }),
    ...(data.responsibleType !== undefined && { responsibleType: data.responsibleType }),
    ...(data.electronicSignatureRequired !== undefined && { electronicSignatureRequired: data.electronicSignatureRequired }),
    ...(data.sustainabilityCriteria !== undefined && {
      sustainabilityCriteria: data.sustainabilityCriteria === null ? Prisma.JsonNull : (data.sustainabilityCriteria as Prisma.InputJsonValue),
    }),
    ...(data.valueForMoneyCriteria !== undefined && {
      valueForMoneyCriteria: data.valueForMoneyCriteria === null ? Prisma.JsonNull : (data.valueForMoneyCriteria as Prisma.InputJsonValue),
    }),
  };
  try {
    const tender = await prisma.tender.update({ where: { id }, data: updatePayload });
    const plan = await prisma.procurementPlan.findUnique({ where: { id: tender.procurementPlanId }, select: { entityId: true } });
    await audit({ action: 'tender.update', entityType: 'Tender', entityId: id, payload: data, contractingEntityId: plan?.entityId ?? undefined });
    return tender;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar proceso' });
  }
});

// POST /api/v1/tenders/:id/request-liberation – solicitar liberación por no producción nacional
type RequestLiberationBody = { documentId?: string };
app.post<{ Params: { id: string }; Body: RequestLiberationBody }>('/api/v1/tenders/:id/request-liberation', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as RequestLiberationBody) || {};
  try {
    const tender = await prisma.tender.findUnique({ where: { id }, select: { status: true, procurementPlanId: true } });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    if (tender.status !== 'draft') return reply.status(400).send({ error: 'Solo se puede solicitar liberación en procesos en borrador' });
    const docId = typeof body.documentId === 'string' && body.documentId.trim() ? body.documentId.trim() : null;
    const updated = await prisma.tender.update({
      where: { id },
      data: {
        liberationRequestedAt: new Date(),
        ...(docId && { liberationDocumentId: docId }),
      },
    });
    const plan = await prisma.procurementPlan.findUnique({ where: { id: tender.procurementPlanId }, select: { entityId: true } });
    await audit({ action: 'tender.request_liberation', entityType: 'Tender', entityId: id, payload: {}, contractingEntityId: plan?.entityId ?? undefined });
    return reply.status(200).send(updated);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al solicitar liberación' });
  }
});

// POST /api/v1/tenders/:id/approve-liberation – aprobar liberación (admin)
app.post<{ Params: { id: string } }>('/api/v1/tenders/:id/approve-liberation', async (req, reply) => {
  const { id } = req.params;
  try {
    const tender = await prisma.tender.findUnique({ where: { id }, select: { procurementPlanId: true } });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const updated = await prisma.tender.update({
      where: { id },
      data: { liberationApprovedAt: new Date() },
    });
    const plan = await prisma.procurementPlan.findUnique({ where: { id: tender.procurementPlanId }, select: { entityId: true } });
    await audit({ action: 'tender.approve_liberation', entityType: 'Tender', entityId: id, payload: {}, contractingEntityId: plan?.entityId ?? undefined });
    return reply.status(200).send(updated);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al aprobar liberación' });
  }
});

// POST /api/v1/tenders/:id/bids/open – apertura de ofertas (acto público, mínimo 1h después del límite – art. 92)
type BidsOpenBody = { bidOpeningActDocumentId?: string };
app.post<{ Params: { id: string }; Body: BidsOpenBody }>('/api/v1/tenders/:id/bids/open', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as BidsOpenBody) || {};
  try {
    const tender = await prisma.tender.findUnique({ where: { id }, select: { bidsDeadlineAt: true, procurementPlanId: true } });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const now = new Date();
    if (tender.bidsDeadlineAt) {
      const oneHourAfter = new Date(tender.bidsDeadlineAt.getTime() + 60 * 60 * 1000);
      if (now < oneHourAfter)
        return reply.status(400).send({ error: 'La apertura de ofertas debe realizarse al menos 1 hora después del límite de entrega (bidsDeadlineAt)' });
    }
    const docId = typeof body.bidOpeningActDocumentId === 'string' && body.bidOpeningActDocumentId.trim() ? body.bidOpeningActDocumentId.trim() : null;
    const updated = await prisma.tender.update({
      where: { id },
      data: { bidsOpenedAt: now, ...(docId && { bidOpeningActDocumentId: docId }) },
    });
    const plan = await prisma.procurementPlan.findUnique({ where: { id: tender.procurementPlanId }, select: { entityId: true } });
    await audit({ action: 'tender.bids_open', entityType: 'Tender', entityId: id, payload: {}, contractingEntityId: plan?.entityId ?? undefined });
    return reply.status(200).send(updated);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al abrir ofertas' });
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
    await audit({ action: 'pac.create', entityType: 'ProcurementPlan', entityId: plan.id, payload: { year: plan.year }, contractingEntityId: entityId });
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
    const planRow = await prisma.procurementPlan.findUnique({ where: { id }, select: { entityId: true } });
    await audit({ action: 'pac.update', entityType: 'ProcurementPlan', entityId: id, payload: data, contractingEntityId: planRow?.entityId ?? undefined });
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

type BidBody = { providerId: string; amount?: number; baePercentage?: number; nationalParticipation?: boolean; declareNoInability?: boolean; invitationType?: 'invited' | 'self_invited' };
app.post<{ Params: { id: string }; Body: BidBody }>('/api/v1/tenders/:id/bids', async (req, reply) => {
  const tenderId = req.params.id;
  const body = req.body as BidBody;
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  if (!providerId) return reply.status(400).send({ error: 'providerId es obligatorio' });
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      select: { bidsDeadlineAt: true, referenceBudgetAmount: true, estimatedAmount: true },
    });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, legalEstablishmentDate: true, patrimonyAmount: true, isCompliantSRI: true, isCompliantIESS: true },
    });
    if (!provider) return reply.status(400).send({ error: 'Proveedor no encontrado' });
    if (provider.isCompliantSRI === false || provider.isCompliantIESS === false)
      return reply.status(400).send({ error: 'El proveedor no se encuentra al día en obligaciones tributarias o laborales; no puede recibir invitación ni autoinvitarse hasta regularizar.' });
    const refAmount = tender.referenceBudgetAmount != null ? Number(tender.referenceBudgetAmount) : tender.estimatedAmount != null ? Number(tender.estimatedAmount) : null;
    if (refAmount != null && refAmount > 500_000 && provider.legalEstablishmentDate) {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      if (provider.legalEstablishmentDate > threeYearsAgo)
        return reply.status(400).send({ error: 'Para procesos con presupuesto superior a $500.000, la persona jurídica debe tener al menos 3 años de existencia legal desde la fecha de constitución' });
    }
    if (refAmount != null && refAmount > 500_000 && !provider.legalEstablishmentDate)
      return reply.status(400).send({ error: 'Para procesos con presupuesto superior a $500.000 se requiere registrar la fecha de constitución (existencia legal) del proveedor' });
    if (refAmount != null && refAmount > 500_000) {
      const patrimony = provider.patrimonyAmount != null ? Number(provider.patrimonyAmount) : null;
      if (patrimony == null || patrimony < refAmount)
        return reply.status(400).send({ error: 'Para procesos con presupuesto referencial superior a $500.000 se requiere acreditar patrimonio igual o superior al presupuesto referencial (art. 93 Reglamento)' });
    }
    const invitationType = (body?.invitationType === 'invited' || body?.invitationType === 'self_invited') ? body.invitationType : undefined;
    if (invitationType === 'self_invited' && tender.bidsDeadlineAt && new Date() > tender.bidsDeadlineAt)
      return reply.status(400).send({ error: 'Autoinvitación no permitida después del cierre de ofertas (bidsDeadlineAt)' });
    const declareNoInability = body?.declareNoInability === true;
    // Art. 95 Reglamento: una vez presentada la oferta se prohíbe el retiro o desistimiento; no se expone endpoint de retiro.
    const bid = await prisma.bid.create({
      data: {
        tenderId,
        providerId,
        amount: body?.amount != null ? body.amount : undefined,
        baePercentage: body?.baePercentage != null ? body.baePercentage : undefined,
        nationalParticipation: body?.nationalParticipation,
        inabilityDeclarationAt: declareNoInability ? new Date() : undefined,
        invitationType: invitationType ?? undefined,
        submittedAt: new Date(),
      },
    });
    const bidPlan = await prisma.tender.findUnique({ where: { id: tenderId }, select: { procurementPlanId: true } }).then((t) => t && prisma.procurementPlan.findUnique({ where: { id: t.procurementPlanId }, select: { entityId: true } }));
    await audit({ action: 'bid.create', entityType: 'Bid', entityId: bid.id, payload: { tenderId, providerId }, contractingEntityId: bidPlan?.entityId ?? undefined });
    return reply.status(201).send(bid);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear oferta' });
  }
});

// Verificación BAE / participación nacional por la entidad (art. 51)
app.post<{ Params: { id: string } }>('/api/v1/bids/:id/verify-bae', async (req, reply) => {
  const bidId = req.params.id;
  try {
    const bid = await prisma.bid.findUnique({ where: { id: bidId }, include: { tender: { include: { procurementPlan: true } } } });
    if (!bid) return reply.status(404).send({ error: 'Oferta no encontrada' });
    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: { baeVerifiedAt: new Date(), nationalParticipationVerifiedAt: new Date() },
    });
    await audit({
      action: 'bid.verify-bae',
      entityType: 'Bid',
      entityId: bidId,
      contractingEntityId: bid.tender?.procurementPlan?.entityId ?? undefined,
    });
    return reply.send(updated);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al verificar BAE' });
  }
});

// POST /api/v1/bids/:id/request-convalidation – proveedor solicita convalidación de errores (plazo 2–5 días)
type RequestConvalidationBody = { errorsDescription?: string };
app.post<{ Params: { id: string }; Body: RequestConvalidationBody }>('/api/v1/bids/:id/request-convalidation', async (req, reply) => {
  const bidId = req.params.id;
  const body = (req.body as RequestConvalidationBody) || {};
  const errorsDescription = typeof body.errorsDescription === 'string' ? body.errorsDescription.trim() || null : null;
  try {
    const bid = await prisma.bid.findUnique({ where: { id: bidId }, include: { tender: { select: { convalidationRequestDeadlineAt: true, procurementPlanId: true } } } });
    if (!bid) return reply.status(404).send({ error: 'Oferta no encontrada' });
    if (bid.convalidationRequestedAt) return reply.status(400).send({ error: 'Ya se solicitó convalidación para esta oferta' });
    const deadline = bid.tender?.convalidationRequestDeadlineAt;
    if (deadline && new Date() > deadline) return reply.status(400).send({ error: 'Plazo para solicitar convalidación vencido' });
    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: {
        convalidationRequestedAt: new Date(),
        convalidationStatus: 'pending',
        ...(errorsDescription != null && { convalidationErrorsDescription: errorsDescription }),
      },
    });
    const plan = await prisma.procurementPlan.findUnique({ where: { id: bid.tender?.procurementPlanId }, select: { entityId: true } });
    await audit({ action: 'bid.request_convalidation', entityType: 'Bid', entityId: bidId, payload: { errorsDescription: errorsDescription ?? undefined }, contractingEntityId: plan?.entityId ?? undefined });
    return reply.status(200).send(updated);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al solicitar convalidación' });
  }
});

// PATCH /api/v1/bids/:id/convalidation – entidad acepta o rechaza convalidación
type ConvalidationBody = { status: 'accepted' | 'rejected'; response?: string };
app.patch<{ Params: { id: string }; Body: ConvalidationBody }>('/api/v1/bids/:id/convalidation', async (req, reply) => {
  const bidId = req.params.id;
  const body = req.body as ConvalidationBody;
  const status = body?.status === 'accepted' || body?.status === 'rejected' ? body.status : null;
  if (!status) return reply.status(400).send({ error: 'status debe ser accepted o rejected' });
  const response = typeof body?.response === 'string' ? body.response.trim() || null : null;
  try {
    const bid = await prisma.bid.findUnique({ where: { id: bidId }, include: { tender: { select: { convalidationResponseDeadlineAt: true, procurementPlanId: true } } } });
    if (!bid) return reply.status(404).send({ error: 'Oferta no encontrada' });
    if (!bid.convalidationRequestedAt) return reply.status(400).send({ error: 'No hay solicitud de convalidación pendiente' });
    if (bid.convalidationStatus && bid.convalidationStatus !== 'pending') return reply.status(400).send({ error: 'Convalidación ya respondida' });
    const deadline = bid.tender?.convalidationResponseDeadlineAt;
    if (deadline && new Date() > deadline) return reply.status(400).send({ error: 'Plazo para responder convalidación vencido' });
    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: {
        convalidationRespondedAt: new Date(),
        convalidationStatus: status,
        ...(response != null && { convalidationResponse: response }),
      },
    });
    const plan = await prisma.procurementPlan.findUnique({ where: { id: bid.tender?.procurementPlanId }, select: { entityId: true } });
    await audit({ action: 'bid.convalidation_response', entityType: 'Bid', entityId: bidId, payload: { status, response: response ?? undefined }, contractingEntityId: plan?.entityId ?? undefined });
    return reply.send(updated);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al responder convalidación' });
  }
});

// POST /api/v1/bids/:id/verify-rup – verificación RUP por etapa (apertura, adjudicación, contrato). Art. 26 Reglamento: en apertura, adjudicación y suscripción del contrato la entidad debe verificar que el proveedor esté habilitado; para personas jurídicas debe verificarse también la habilitación de socios, partícipes o accionistas.
type VerifyRupBody = { stage: 'opening' | 'award' | 'contract' };
app.post<{ Params: { id: string }; Body: VerifyRupBody }>('/api/v1/bids/:id/verify-rup', async (req, reply) => {
  const bidId = req.params.id;
  const body = req.body as VerifyRupBody;
  const stage = body?.stage;
  if (stage !== 'opening' && stage !== 'award' && stage !== 'contract') return reply.status(400).send({ error: 'stage debe ser opening, award o contract' });
  try {
    const bid = await prisma.bid.findUnique({ where: { id: bidId }, include: { tender: { select: { procurementPlanId: true } } } });
    if (!bid) return reply.status(404).send({ error: 'Oferta no encontrada' });
    const data: { rupVerifiedAtOpening?: Date; rupVerifiedAtAward?: Date; rupVerifiedAtContract?: Date } = {};
    if (stage === 'opening') data.rupVerifiedAtOpening = new Date();
    else if (stage === 'award') data.rupVerifiedAtAward = new Date();
    else data.rupVerifiedAtContract = new Date();
    const updated = await prisma.bid.update({ where: { id: bidId }, data });
    const plan = await prisma.procurementPlan.findUnique({ where: { id: bid.tender?.procurementPlanId }, select: { entityId: true } });
    await audit({ action: 'bid.verify_rup', entityType: 'Bid', entityId: bidId, payload: { stage }, contractingEntityId: plan?.entityId ?? undefined });
    return reply.send(updated);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al verificar RUP' });
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

type ContractBody = {
  providerId: string;
  contractNo?: string;
  amount?: number;
  administratorName?: string;
  administratorEmail?: string;
  disputeDeadlineDays?: number;
  awardResolutionIssuedAt?: string | null;
  awardPublishedAt?: string | null;
};
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
    const disputeDeadlineDays =
      typeof body?.disputeDeadlineDays === 'number' && Number.isInteger(body.disputeDeadlineDays) && body.disputeDeadlineDays > 0
        ? body.disputeDeadlineDays
        : undefined;
    let awardResolutionIssuedAt: Date | undefined;
    if (body?.awardResolutionIssuedAt != null && typeof body.awardResolutionIssuedAt === 'string' && body.awardResolutionIssuedAt.trim()) {
      const d = new Date(body.awardResolutionIssuedAt.trim());
      if (Number.isFinite(d.getTime())) awardResolutionIssuedAt = d;
    }
    let awardPublishedAt: Date | undefined;
    if (body?.awardPublishedAt != null) {
      if (typeof body.awardPublishedAt === 'string' && body.awardPublishedAt.trim()) {
        const d = new Date(body.awardPublishedAt.trim());
        if (Number.isFinite(d.getTime())) awardPublishedAt = d;
      }
    }
    if (awardPublishedAt && awardResolutionIssuedAt) {
      const maxPublish = new Date(awardResolutionIssuedAt.getTime() + 24 * 60 * 60 * 1000);
      if (awardPublishedAt.getTime() > maxPublish.getTime())
        return reply.status(400).send({ error: 'La publicación de la resolución de adjudicación debe realizarse a más tardar 1 día después de su emisión (art. 112 Reglamento)' });
    }
    const contract = await prisma.contract.create({
      data: {
        tenderId,
        providerId,
        contractNo: body?.contractNo?.trim() || undefined,
        amount: body?.amount != null ? body.amount : undefined,
        administratorName:
          typeof body?.administratorName === 'string' && body.administratorName.trim()
            ? body.administratorName.trim()
            : undefined,
        administratorEmail:
          typeof body?.administratorEmail === 'string' && body.administratorEmail.trim()
            ? body.administratorEmail.trim()
            : undefined,
        disputeDeadlineDays,
        awardResolutionIssuedAt: awardResolutionIssuedAt ?? undefined,
        awardPublishedAt: awardPublishedAt ?? undefined,
      },
    });
    const plan = await prisma.tender.findUnique({ where: { id: tenderId }, select: { procurementPlanId: true } }).then((t) => t && prisma.procurementPlan.findUnique({ where: { id: t.procurementPlanId }, select: { entityId: true } }));
    await audit({ action: 'contract.create', entityType: 'Contract', entityId: contract.id, payload: { tenderId, providerId }, contractingEntityId: plan?.entityId ?? undefined });
    return reply.status(201).send(contract);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear contrato' });
  }
});

type ContractUpdateBody = {
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
  awardResolutionIssuedAt?: string | null;
  awardPublishedAt?: string | null;
};

// PUT /api/v1/contracts/:id (actualizar datos de ejecución y administrador)
app.put<{ Params: { id: string }; Body: ContractUpdateBody }>('/api/v1/contracts/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as ContractUpdateBody) || {};
  try {
    const existing = await prisma.contract.findUnique({ where: { id }, select: { administratorDesignatedAt: true, awardResolutionIssuedAt: true, awardPublishedAt: true } });
    if (!existing) return reply.status(404).send({ error: 'Contrato no encontrado' });
    const data: Prisma.ContractUpdateInput = {};
    if (typeof body.status === 'string' && body.status.trim()) data.status = body.status.trim();
    if (typeof body.amount === 'number') data.amount = body.amount;
    if (typeof body.administratorName === 'string')
      data.administratorName = body.administratorName.trim() || null;
    if (typeof body.administratorEmail === 'string')
      data.administratorEmail = body.administratorEmail.trim() || null;
    // Al designar administrador por primera vez, registrar fecha
    if ((body.administratorName !== undefined || body.administratorEmail !== undefined) && !existing.administratorDesignatedAt)
      data.administratorDesignatedAt = new Date();
    if (typeof body.administratorObjectionReason === 'string' && body.administratorObjectionReason.trim()) {
      if (!existing.administratorDesignatedAt)
        return reply.status(400).send({ error: 'No hay administrador designado para objetar' });
      const designatedAt = existing.administratorDesignatedAt.getTime();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - designatedAt > threeDaysMs)
        return reply.status(400).send({ error: 'Plazo de objeción de 3 días vencido' });
      data.administratorObjectionAt = new Date();
      data.administratorObjectionReason = body.administratorObjectionReason.trim();
    }
    if (typeof body.terminatedAt === 'string' && body.terminatedAt.trim())
      data.terminatedAt = new Date(body.terminatedAt);
    if (typeof body.suspendedAt === 'string' && body.suspendedAt.trim())
      data.suspendedAt = new Date(body.suspendedAt);
    if (typeof body.terminationCause === 'string') data.terminationCause = body.terminationCause.trim() || null;
    if (typeof body.suspensionCause === 'string') data.suspensionCause = body.suspensionCause.trim() || null;
    if (body.disputeDeadlineDays !== undefined) {
      data.disputeDeadlineDays =
        typeof body.disputeDeadlineDays === 'number' && Number.isInteger(body.disputeDeadlineDays) && body.disputeDeadlineDays > 0
          ? body.disputeDeadlineDays
          : null;
    }
    const docId = typeof body.resultReportDocumentId === 'string' ? body.resultReportDocumentId.trim() || null : undefined;
    if (docId !== undefined)
      (data as Record<string, unknown>).resultReportDocument = docId ? { connect: { id: docId } } : { disconnect: true };
    if (body.awardResolutionIssuedAt !== undefined) {
      if (body.awardResolutionIssuedAt === null) (data as Prisma.ContractUpdateInput).awardResolutionIssuedAt = null;
      else if (typeof body.awardResolutionIssuedAt === 'string' && body.awardResolutionIssuedAt.trim()) {
        const d = new Date(body.awardResolutionIssuedAt.trim());
        if (Number.isFinite(d.getTime())) (data as Prisma.ContractUpdateInput).awardResolutionIssuedAt = d;
      }
    }
    if (body.awardPublishedAt !== undefined) {
      if (body.awardPublishedAt === null) (data as Prisma.ContractUpdateInput).awardPublishedAt = null;
      else if (typeof body.awardPublishedAt === 'string' && body.awardPublishedAt.trim()) {
        const d = new Date(body.awardPublishedAt.trim());
        if (Number.isFinite(d.getTime())) {
          const issuedStr = body.awardResolutionIssuedAt != null && typeof body.awardResolutionIssuedAt === 'string' && body.awardResolutionIssuedAt.trim()
            ? new Date(body.awardResolutionIssuedAt.trim())
            : existing.awardResolutionIssuedAt;
          if (issuedStr && Number.isFinite(issuedStr.getTime())) {
            const maxPublish = new Date(issuedStr.getTime() + 24 * 60 * 60 * 1000);
            if (d.getTime() > maxPublish.getTime())
              return reply.status(400).send({ error: 'La publicación de la resolución de adjudicación debe realizarse a más tardar 1 día después de su emisión (art. 112 Reglamento)' });
          }
          (data as Prisma.ContractUpdateInput).awardPublishedAt = d;
        }
      }
    }
    if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
    const updated = await prisma.contract.update({ where: { id }, data });
    const plan = await prisma.tender.findUnique({ where: { id: updated.tenderId }, select: { procurementPlanId: true } }).then((t) => t && prisma.procurementPlan.findUnique({ where: { id: t.procurementPlanId }, select: { entityId: true } }));
    await audit({ action: 'contract.update', entityType: 'Contract', entityId: id, payload: data, contractingEntityId: plan?.entityId ?? undefined });
    return updated;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar contrato' });
  }
});

// Documentos del contrato (informe de resultado + documentación al cierre)
app.get<{ Params: { id: string } }>('/api/v1/contracts/:id/documents', async (req, reply) => {
  const contractId = req.params.id;
  try {
    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) return reply.status(404).send({ error: 'Contrato no encontrado' });
    const docs = await prisma.document.findMany({
      where: { ownerType: 'contract', ownerId: contractId },
    });
    return { data: docs };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar documentos del contrato' });
  }
});

// POST /api/v1/contracts/:id/declare-failed-awardee – adjudicatario fallido: sanción 3 años (art. 99)
app.post<{ Params: { id: string } }>('/api/v1/contracts/:id/declare-failed-awardee', async (req, reply) => {
  const contractId = req.params.id;
  try {
    const contract = await prisma.contract.findUnique({ where: { id: contractId }, select: { tenderId: true, providerId: true } });
    if (!contract) return reply.status(404).send({ error: 'Contrato no encontrado' });
    const threeYearsMs = 3 * 365.25 * 24 * 60 * 60 * 1000;
    const sanctionedUntil = new Date(Date.now() + threeYearsMs);
    const bid = await prisma.bid.findFirst({ where: { tenderId: contract.tenderId, providerId: contract.providerId } });
    if (bid) {
      await prisma.bid.update({
        where: { id: bid.id },
        data: { status: 'failed_awardee', sanctionedUntil },
      });
    }
    const plan = await prisma.tender.findUnique({ where: { id: contract.tenderId }, select: { procurementPlanId: true } }).then((t) => t && prisma.procurementPlan.findUnique({ where: { id: t.procurementPlanId }, select: { entityId: true } }));
    await audit({ action: 'contract.declare_failed_awardee', entityType: 'Contract', entityId: contractId, payload: { providerId: contract.providerId }, contractingEntityId: plan?.entityId ?? undefined });
    return reply.status(200).send({ ok: true, bidId: bid?.id, sanctionedUntil });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al declarar adjudicatario fallido' });
  }
});

// Fase 4: Documentos (MinIO/S3)
app.post('/api/v1/documents/upload', async (req, reply) => {
  if (!isStorageConfigured()) return reply.status(503).send({ error: 'Almacenamiento de documentos no configurado (S3_*)' });
  try {
    const parts = req.parts();
    let ownerType = '';
    let ownerId = '';
    // documentType: attachment (default), bid_opening_act (acta apertura), clarifications_act (acta preguntas y aclaraciones), scoring_act (acta calificación), scoring_report (informe calificación/recomendación), need_report (informe de necesidad), budget_availability_certificate (cert. disponibilidad presupuestaria), tender_start_resolution (resolución de inicio), apu (análisis de precios unitarios para obras)
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

// Catálogo electrónico (entity/admin)
app.get<{ Querystring: { entityId?: string; status?: string; page?: string; pageSize?: string } }>('/api/v1/catalogs', async (req, reply) => {
  try {
    const where: Prisma.CatalogWhereInput = {};
    if (typeof req.query?.entityId === 'string' && req.query.entityId.trim()) where.entityId = req.query.entityId.trim();
    if (typeof req.query?.status === 'string' && req.query.status.trim()) where.status = req.query.status.trim();
    const page = Math.max(1, parseInt(req.query?.page || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query?.pageSize || '10', 10) || 10));
    const [data, total] = await Promise.all([
      prisma.catalog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { entity: { select: { id: true, name: true, code: true } } } }),
      prisma.catalog.count({ where }),
    ]);
    return { data, total, page, pageSize };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar catálogos' });
  }
});
app.get<{ Params: { id: string } }>('/api/v1/catalogs/:id', async (req, reply) => {
  try {
    const catalog = await prisma.catalog.findUnique({
      where: { id: req.params.id },
      include: { entity: { select: { id: true, name: true, code: true } }, items: true },
    });
    if (!catalog) return reply.status(404).send({ error: 'Catálogo no encontrado' });
    return catalog;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener catálogo' });
  }
});
type CatalogBody = { entityId?: string | null; catalogType?: string; name: string; description?: string; status?: string };
const VALID_CATALOG_TYPES = ['electronico', 'dinamico_inclusivo'];
app.post<{ Body: CatalogBody }>('/api/v1/catalogs', async (req, reply) => {
  const body = req.body as CatalogBody;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return reply.status(400).send({ error: 'name es obligatorio' });
  const catalogType = typeof body?.catalogType === 'string' && VALID_CATALOG_TYPES.includes(body.catalogType.trim()) ? body.catalogType.trim() : 'electronico';
  try {
    const catalog = await prisma.catalog.create({
      data: {
        entityId: typeof body?.entityId === 'string' && body.entityId.trim() ? body.entityId.trim() : null,
        catalogType,
        name,
        description: typeof body?.description === 'string' ? body.description.trim() || null : null,
        status: (body?.status as string)?.trim() || 'draft',
      },
    });
    await audit({ action: 'catalog.create', entityType: 'Catalog', entityId: catalog.id, payload: { name } });
    return reply.status(201).send(catalog);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear catálogo' });
  }
});
app.put<{ Params: { id: string }; Body: CatalogBody }>('/api/v1/catalogs/:id', async (req, reply) => {
  const { id } = req.params;
  const body = (req.body as CatalogBody) || {};
  const data: Prisma.CatalogUpdateInput = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === 'string') data.description = body.description.trim() || null;
  if (body.entityId !== undefined)
    (data as Record<string, unknown>).entity = body.entityId && typeof body.entityId === 'string' && body.entityId.trim()
      ? { connect: { id: body.entityId.trim() } }
      : { disconnect: true };
  if (['draft', 'published'].includes(String(body.status))) data.status = body.status;
  if (typeof body.catalogType === 'string' && VALID_CATALOG_TYPES.includes(body.catalogType.trim())) data.catalogType = body.catalogType.trim();
  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
  try {
    const catalog = await prisma.catalog.update({ where: { id }, data });
    await audit({ action: 'catalog.update', entityType: 'Catalog', entityId: id, payload: data });
    return catalog;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025') return reply.status(404).send({ error: 'Catálogo no encontrado' });
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar catálogo' });
  }
});

// Ítems de catálogo
type CatalogItemBody = { catalogId: string; tenderId?: string | null; cpcCode?: string; name: string; description?: string; unit?: string; referencePrice?: number };
app.post<{ Body: CatalogItemBody }>('/api/v1/catalog-items', async (req, reply) => {
  const body = req.body as CatalogItemBody;
  const catalogId = typeof body?.catalogId === 'string' ? body.catalogId.trim() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!catalogId || !name) return reply.status(400).send({ error: 'catalogId y name son obligatorios' });
  try {
    const item = await prisma.catalogItem.create({
      data: {
        catalogId,
        tenderId: typeof body?.tenderId === 'string' && body.tenderId.trim() ? body.tenderId.trim() : null,
        cpcCode: typeof body?.cpcCode === 'string' ? body.cpcCode.trim() || null : null,
        name,
        description: typeof body?.description === 'string' ? body.description.trim() || null : null,
        unit: typeof body?.unit === 'string' ? body.unit.trim() || null : null,
        referencePrice: body?.referencePrice != null ? body.referencePrice : null,
      },
    });
    await audit({ action: 'catalogItem.create', entityType: 'CatalogItem', entityId: item.id, payload: { catalogId, name } });
    return reply.status(201).send(item);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear ítem de catálogo' });
  }
});

// Órdenes de compra (MVP)
app.get<{ Querystring: { entityId?: string; status?: string; page?: string; pageSize?: string } }>('/api/v1/purchase-orders', async (req, reply) => {
  try {
    const where: Prisma.PurchaseOrderWhereInput = {};
    if (typeof req.query?.entityId === 'string' && req.query.entityId.trim()) where.entityId = req.query.entityId.trim();
    if (typeof req.query?.status === 'string' && req.query.status.trim()) where.status = req.query.status.trim();
    const page = Math.max(1, parseInt(req.query?.page || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query?.pageSize || '10', 10) || 10));
    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { entity: { select: { id: true, name: true, code: true } }, catalog: { select: { id: true, name: true } }, tender: { select: { id: true, title: true } } } }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total, page, pageSize };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar órdenes de compra' });
  }
});
type PurchaseOrderBody = { entityId: string; catalogId?: string | null; tenderId?: string | null; orderNo?: string; totalAmount?: number; status?: string };
app.post<{ Body: PurchaseOrderBody }>('/api/v1/purchase-orders', async (req, reply) => {
  const body = req.body as PurchaseOrderBody;
  const entityId = typeof body?.entityId === 'string' ? body.entityId.trim() : '';
  if (!entityId) return reply.status(400).send({ error: 'entityId es obligatorio' });
  try {
    const po = await prisma.purchaseOrder.create({
      data: {
        entityId,
        catalogId: typeof body?.catalogId === 'string' && body.catalogId.trim() ? body.catalogId.trim() : null,
        tenderId: typeof body?.tenderId === 'string' && body.tenderId.trim() ? body.tenderId.trim() : null,
        orderNo: typeof body?.orderNo === 'string' ? body.orderNo.trim() || null : null,
        totalAmount: body?.totalAmount,
        status: (body?.status as string)?.trim() || 'draft',
      },
    });
    await audit({ action: 'purchaseOrder.create', entityType: 'PurchaseOrder', entityId: po.id, payload: { entityId } });
    return reply.status(201).send(po);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear orden de compra' });
  }
});

// Wizard docs: presign + commit (20MB archivo, 100MB total por draft/oferta)
type PresignBody = { draftId?: string; offerId?: string; docType: string; fileName: string; mimeType: string; sizeBytes: number };
app.post<{ Body: PresignBody }>('/api/v1/documents/presign', async (req, reply) => {
  const body = req.body as PresignBody;
  const draftId = typeof body?.draftId === 'string' ? body.draftId.trim() : '';
  const offerId = typeof body?.offerId === 'string' ? body.offerId.trim() : '';
  const docType = typeof body?.docType === 'string' ? body.docType.trim() : '';
  const fileName = typeof body?.fileName === 'string' ? body.fileName.trim() : '';
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : '';
  const sizeBytes = typeof body?.sizeBytes === 'number' ? body.sizeBytes : NaN;
  if ((!draftId && !offerId) || (draftId && offerId)) return reply.status(400).send({ error: 'draftId u offerId (solo uno) es obligatorio' });
  if (!docType) return reply.status(400).send({ error: 'docType es obligatorio' });
  if (!fileName) return reply.status(400).send({ error: 'fileName es obligatorio' });
  if (!mimeType) return reply.status(400).send({ error: 'mimeType es obligatorio' });
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return reply.status(400).send({ error: 'sizeBytes inválido' });

  const MAX_FILE = 20 * 1024 * 1024;
  if (sizeBytes > MAX_FILE) return reply.status(413).send({ error: 'Archivo demasiado grande (máx 20MB)' });

  if (!isStorageConfigured()) return reply.status(503).send({ error: 'Almacenamiento de documentos no configurado (S3_*)' });

  const allowedExt = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
  const lower = fileName.toLowerCase();
  const ext = allowedExt.find((e) => lower.endsWith(e));
  if (!ext) return reply.status(422).send({ error: 'Extensión no permitida' });

  await ensureBucket();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${offerId ? `offers/${offerId}` : `offer-drafts/${draftId}`}/${crypto.randomUUID()}-${safeName}`;
  const uploadUrl = await getUploadUrl(key, mimeType);
  return { uploadUrl, storageKey: key };
});

type CommitBody = { draftId?: string; offerId?: string; docType: string; fileName: string; mimeType: string; sizeBytes: number; hash: string; storageKey: string };
app.post<{ Body: CommitBody }>('/api/v1/documents/commit', async (req, reply) => {
  const body = req.body as CommitBody;
  const draftId = typeof body?.draftId === 'string' ? body.draftId.trim() : '';
  const offerId = typeof body?.offerId === 'string' ? body.offerId.trim() : '';
  const docType = typeof body?.docType === 'string' ? body.docType.trim() : '';
  const fileName = typeof body?.fileName === 'string' ? body.fileName.trim() : '';
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : '';
  const storageKey = typeof body?.storageKey === 'string' ? body.storageKey.trim() : '';
  const hash = typeof body?.hash === 'string' ? body.hash.trim() : '';
  const sizeBytes = typeof body?.sizeBytes === 'number' ? body.sizeBytes : NaN;
  if ((!draftId && !offerId) || (draftId && offerId)) return reply.status(400).send({ error: 'draftId u offerId (solo uno) es obligatorio' });
  if (!docType || !fileName || !mimeType || !storageKey || !hash) return reply.status(400).send({ error: 'Campos obligatorios faltantes' });
  const MAX_FILE = 20 * 1024 * 1024;
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE) return reply.status(413).send({ error: 'Archivo inválido o demasiado grande (máx 20MB)' });

  const MAX_TOTAL = 100 * 1024 * 1024;
  const existing = await prisma.offerDocument.findMany({
    where: offerId ? { offerId } : { draftId },
    select: { sizeBytes: true },
  });
  const currentTotal = existing.reduce((acc, d) => acc + d.sizeBytes, 0);
  if (currentTotal + sizeBytes > MAX_TOTAL) {
    return reply.status(413).send({ error: 'Excede el tamaño total permitido por oferta (máx 100MB)' });
  }

  try {
    const doc = await prisma.offerDocument.create({
      data: { offerId: offerId || undefined, draftId: draftId || undefined, docType, fileName, mimeType, sizeBytes, hash, storageKey },
    });
    await audit({ action: 'offerDocument.commit', entityType: 'OfferDocument', entityId: doc.id, payload: { offerId: offerId || null, draftId: draftId || null } });
    return reply.status(201).send(doc);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al registrar documento' });
  }
});

app.get<{ Querystring: { draftId?: string; offerId?: string } }>('/api/v1/offer-documents', async (req, reply) => {
  const draftId = typeof req.query?.draftId === 'string' ? req.query.draftId.trim() : '';
  const offerId = typeof req.query?.offerId === 'string' ? req.query.offerId.trim() : '';
  if ((!draftId && !offerId) || (draftId && offerId)) return reply.status(400).send({ error: 'draftId u offerId (solo uno) es obligatorio' });
  try {
    const docs = await prisma.offerDocument.findMany({
      where: offerId ? { offerId } : { draftId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: docs };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar documentos de oferta' });
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

// OfferFormConfig (wizard de ofertas) – stub inicial por proceso
app.get<{ Params: { id: string } }>('/api/v1/processes/:id/offer-form-config', async (req, reply) => {
  const processId = req.params.id;
  try {
    const existing = await prisma.offerFormConfig.findUnique({ where: { processId } });
    if (existing) return existing.config;

    // Stub por defecto. En fases posteriores se guarda en DB por proceso.
    return {
      processId,
      modality: 'LICITACION',
      version: '1',
      limits: {
        maxFileBytes: 20 * 1024 * 1024,
        maxTotalBytes: 100 * 1024 * 1024,
        allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'],
      },
      otp: { enabled: true, channels: ['SMS', 'EMAIL'], ttlSeconds: 600, maxAttempts: 5, cooldownSeconds: 60 },
      signature: { enabled: true, provider: 'STUB', mode: 'REMOTE' },
      steps: [
        { id: 'ELIGIBILITY', title: 'Elegibilidad', enabled: true, fields: [] },
        { id: 'BIDDER', title: 'Datos del oferente', enabled: true, fields: [] },
        { id: 'TECHNICAL', title: 'Oferta técnica', enabled: true, fields: [] },
        { id: 'ECONOMIC', title: 'Oferta económica', enabled: true, fields: [] },
        { id: 'DOCUMENTS', title: 'Documentos', enabled: true, fields: [] },
        { id: 'DECLARATIONS', title: 'Declaraciones', enabled: true, fields: [] },
        { id: 'REVIEW', title: 'Revisión y envío', enabled: true, fields: [] },
      ],
      documents: [
        { docType: 'FORMULARIO_OFERTA', label: 'Formulario de oferta', required: false, allowedExtensions: ['.pdf', '.doc', '.docx'] },
        { docType: 'DESGLOSE_ECONOMICO', label: 'Desglose económico', required: false, allowedExtensions: ['.pdf', '.xls', '.xlsx'] },
      ],
      constraints: { timeline: null, budgetRules: { hasReferenceBudget: false } },
    };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener configuración de oferta' });
  }
});

// Admin: upsert OfferFormConfig por proceso
type UpsertOfferFormConfigBody = { processId: string; modality: string; version?: string; config: Record<string, unknown> };
app.put<{ Params: { id: string }; Body: UpsertOfferFormConfigBody }>('/api/v1/processes/:id/offer-form-config', async (req, reply) => {
  const processId = req.params.id;
  const body = req.body as UpsertOfferFormConfigBody;
  const modality = typeof body?.modality === 'string' ? body.modality.trim() : '';
  const version = typeof body?.version === 'string' && body.version.trim() ? body.version.trim() : '1';
  const config = body?.config && typeof body.config === 'object' ? body.config : null;
  if (!modality) return reply.status(400).send({ error: 'modality es obligatorio' });
  if (!config) return reply.status(400).send({ error: 'config es obligatorio' });

  // RBAC mínimo: solo admin
  if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });

  try {
    const configJson = config as unknown as Prisma.InputJsonValue;
    const saved = await prisma.offerFormConfig.upsert({
      where: { processId },
      update: { modality, version, config: configJson },
      create: { processId, modality, version, config: configJson },
    });
    await audit({ action: 'offerFormConfig.upsert', entityType: 'OfferFormConfig', entityId: saved.id, payload: { processId, modality, version } });
    return saved.config;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al guardar configuración de oferta' });
  }
});

// Ofertas – drafts (wizard)
type CreateOfferDraftBody = { processId: string; tenderId?: string; providerId: string; modality?: string };
app.post<{ Body: CreateOfferDraftBody }>('/api/v1/offers/drafts', async (req, reply) => {
  const body = req.body as CreateOfferDraftBody;
  const processId = typeof body?.processId === 'string' ? body.processId.trim() : '';
  const tenderId = typeof body?.tenderId === 'string' ? body.tenderId.trim() : '';
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  const modality = typeof body?.modality === 'string' && body.modality.trim() ? body.modality.trim() : 'LICITACION';
  if (!processId) return reply.status(400).send({ error: 'processId es obligatorio' });
  if (!providerId) return reply.status(400).send({ error: 'providerId es obligatorio' });
  try {
    const draft = await prisma.offerDraft.create({
      data: { processId, tenderId: tenderId || undefined, providerId, modality, status: 'draft', stepData: {} },
    });
    await audit({ action: 'offerDraft.create', entityType: 'OfferDraft', entityId: draft.id, payload: { processId, tenderId, providerId } });
    return reply.status(201).send(draft);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al crear borrador de oferta' });
  }
});

app.get<{ Params: { id: string } }>('/api/v1/offers/drafts/:id', async (req, reply) => {
  const id = req.params.id;
  try {
    const draft = await prisma.offerDraft.findUnique({ where: { id } });
    if (!draft) return reply.status(404).send({ error: 'Borrador no encontrado' });
    return draft;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener borrador' });
  }
});

type PatchOfferDraftBody = { stepData?: unknown; status?: string };
app.patch<{ Params: { id: string }; Body: PatchOfferDraftBody }>('/api/v1/offers/drafts/:id', async (req, reply) => {
  const id = req.params.id;
  const body = req.body as PatchOfferDraftBody;
  try {
    const existing = await prisma.offerDraft.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Borrador no encontrado' });
    const nextStatus = typeof body?.status === 'string' && body.status.trim() ? body.status.trim() : undefined;
    // Merge superficial de stepData (objeto JSON)
    const patchData = (body?.stepData && typeof body.stepData === 'object') ? (body.stepData as object) : undefined;
    const merged = patchData ? { ...(existing.stepData as object), ...(patchData as object) } : undefined;
    const updated = await prisma.offerDraft.update({
      where: { id },
      data: {
        ...(merged ? { stepData: merged } : {}),
        ...(nextStatus ? { status: nextStatus } : {}),
      },
    });
    await audit({ action: 'offerDraft.update', entityType: 'OfferDraft', entityId: updated.id, payload: { status: nextStatus ?? null } });
    return updated;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar borrador' });
  }
});

function getStubOfferFormConfig(processId: string): Record<string, unknown> {
  return {
    processId,
    modality: 'LICITACION',
    version: '1',
    limits: {
      maxFileBytes: 20 * 1024 * 1024,
      maxTotalBytes: 100 * 1024 * 1024,
      allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'],
    },
    otp: { enabled: true, channels: ['SMS', 'EMAIL'], ttlSeconds: 600, maxAttempts: 5, cooldownSeconds: 60 },
    signature: { enabled: true, provider: 'STUB', mode: 'REMOTE' },
    steps: [
      { id: 'ELIGIBILITY', title: 'Elegibilidad', enabled: true, fields: [] },
      { id: 'BIDDER', title: 'Datos del oferente', enabled: true, fields: [] },
      { id: 'TECHNICAL', title: 'Oferta técnica', enabled: true, fields: [] },
      { id: 'ECONOMIC', title: 'Oferta económica', enabled: true, fields: [] },
      { id: 'DOCUMENTS', title: 'Documentos', enabled: true, fields: [] },
      { id: 'DECLARATIONS', title: 'Declaraciones', enabled: true, fields: [] },
      { id: 'REVIEW', title: 'Revisión y envío', enabled: true, fields: [] },
    ],
    documents: [
      { docType: 'FORMULARIO_OFERTA', label: 'Formulario de oferta', required: false, allowedExtensions: ['.pdf', '.doc', '.docx'] },
      { docType: 'DESGLOSE_ECONOMICO', label: 'Desglose económico', required: false, allowedExtensions: ['.pdf', '.xls', '.xlsx'] },
    ],
    constraints: { timeline: null, budgetRules: { hasReferenceBudget: false } },
  };
}

async function loadOfferFormConfig(processId: string): Promise<Record<string, unknown>> {
  const existing = await prisma.offerFormConfig.findUnique({ where: { processId } });
  if (existing && existing.config && typeof existing.config === 'object') return existing.config as Record<string, unknown>;
  return getStubOfferFormConfig(processId);
}

// Validación server-side: verifica requeridos y prepara firma/OTP
app.post<{ Params: { id: string } }>('/api/v1/offers/:id/validate', async (req, reply) => {
  const id = req.params.id;
  try {
    const draft = await prisma.offerDraft.findUnique({ where: { id } });
    if (!draft) return reply.status(404).send({ error: 'Borrador no encontrado' });
    const cfg = await loadOfferFormConfig(draft.processId);
    const data = (draft.stepData || {}) as Record<string, unknown>;
    const issues: Array<{ path: string; message: string }> = [];

    const contactEmail = (data?.contact as Record<string, unknown> | undefined)?.email;
    if (typeof contactEmail !== 'string' || !contactEmail.includes('@')) {
      issues.push({ path: 'contact.email', message: 'Email de contacto es obligatorio' });
    }

    // Económica: TOTAL o ITEMS
    const econ = (data?.economic as Record<string, unknown> | undefined) || {};
    const mode = typeof econ.mode === 'string' ? econ.mode : 'TOTAL';
    if (mode !== 'TOTAL' && mode !== 'ITEMS') issues.push({ path: 'economic.mode', message: 'Modo económico inválido' });
    if (mode === 'TOTAL') {
      const amount = typeof econ.amount === 'number' ? econ.amount : NaN;
      if (!Number.isFinite(amount) || amount <= 0) issues.push({ path: 'economic.amount', message: 'Monto total es obligatorio' });
    } else {
      const items = Array.isArray(econ.items) ? econ.items : [];
      if (items.length === 0) issues.push({ path: 'economic.items', message: 'Debe ingresar al menos un ítem' });
      items.forEach((it: any, idx: number) => {
        if (!it || typeof it !== 'object') return issues.push({ path: `economic.items[${idx}]`, message: 'Ítem inválido' });
        if (typeof it.description !== 'string' || !it.description.trim())
          issues.push({ path: `economic.items[${idx}].description`, message: 'Descripción es obligatoria' });
        const qty = typeof it.quantity === 'number' ? it.quantity : NaN;
        const up = typeof it.unitPrice === 'number' ? it.unitPrice : NaN;
        if (!Number.isFinite(qty) || qty <= 0) issues.push({ path: `economic.items[${idx}].quantity`, message: 'Cantidad inválida' });
        if (!Number.isFinite(up) || up <= 0) issues.push({ path: `economic.items[${idx}].unitPrice`, message: 'Precio unitario inválido' });
      });
    }

    // Docs requeridos por config
    const docsCfg = Array.isArray((cfg as any).documents) ? (cfg as any).documents : [];
    const requiredDocTypes = docsCfg.filter((d: any) => d?.required === true && typeof d?.docType === 'string').map((d: any) => d.docType);
    if (requiredDocTypes.length > 0) {
      const docs = await prisma.offerDocument.findMany({ where: { draftId: id }, select: { docType: true, sizeBytes: true } });
      for (const dt of requiredDocTypes) {
        if (!docs.some((d) => d.docType === dt)) issues.push({ path: `documents.${dt}`, message: `Documento requerido faltante: ${dt}` });
      }
      const totalBytes = docs.reduce((acc, d) => acc + d.sizeBytes, 0);
      const maxTotalBytes = typeof (cfg as any)?.limits?.maxTotalBytes === 'number' ? (cfg as any).limits.maxTotalBytes : 100 * 1024 * 1024;
      if (totalBytes > maxTotalBytes) issues.push({ path: 'documents.total', message: 'Tamaño total de documentos excedido' });
    }

    if (issues.length > 0) return reply.status(422).send({ error: 'Validación', issues });

    const updated = await prisma.offerDraft.update({ where: { id }, data: { status: 'pending_signature' } });
    await audit({ action: 'offerDraft.validate', entityType: 'OfferDraft', entityId: id, payload: { ok: true } });
    return { ok: true, status: updated.status };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al validar borrador' });
  }
});

// Firma electrónica (stub)
type SignStartBody = { provider?: string; returnUrl?: string };
app.post<{ Params: { id: string }; Body: SignStartBody }>('/api/v1/offers/:id/sign/start', async (req, reply) => {
  const offerId = req.params.id;
  try {
    const draft = await prisma.offerDraft.findUnique({ where: { id: offerId } });
    if (!draft) return reply.status(404).send({ error: 'Borrador no encontrado' });
    if (draft.status !== 'pending_signature') return reply.status(409).send({ error: 'Estado inválido para firma' });
    const session = await prisma.signSession.create({ data: { offerId, provider: 'STUB', status: 'started' } });
    await audit({ action: 'sign.start', entityType: 'SignSession', entityId: session.id, payload: { offerId } });
    return { signSessionId: session.id, status: 'STARTED', challenge: { type: 'SCREEN_CONFIRM', message: 'Simulación de firma: confirme para continuar.' } };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al iniciar firma' });
  }
});

type SignCompleteBody = { signSessionId: string; action?: string };
app.post<{ Params: { id: string }; Body: SignCompleteBody }>('/api/v1/offers/:id/sign/complete', async (req, reply) => {
  const offerId = req.params.id;
  const body = req.body as SignCompleteBody;
  const signSessionId = typeof body?.signSessionId === 'string' ? body.signSessionId.trim() : '';
  if (!signSessionId) return reply.status(400).send({ error: 'signSessionId es obligatorio' });
  try {
    const session = await prisma.signSession.findUnique({ where: { id: signSessionId } });
    if (!session || session.offerId !== offerId) return reply.status(404).send({ error: 'Sesión de firma no encontrada' });
    if (session.status !== 'started') return reply.status(409).send({ error: 'Sesión de firma en estado inválido' });

    // Artefacto stub: document record reutiliza tabla Document existente (ownerType=signature)
    const artifactPayload = {
      offerId,
      signedAt: new Date().toISOString(),
      actor: req.user?.sub ?? null,
      role: req.user?.role ?? null,
    };
    const artifactKey = `signature/${offerId}/${crypto.randomUUID()}.json`;
    if (isStorageConfigured()) {
      await ensureBucket();
      await uploadStream(artifactKey, Readable.from([JSON.stringify(artifactPayload)]), 'application/json');
    }
    const artifactDoc = await prisma.document.create({
      data: {
        ownerType: 'signature',
        ownerId: offerId,
        documentType: 'signature_artifact',
        fileName: 'signature.json',
        storageKey: artifactKey,
        isPublic: false,
      },
    });

    await prisma.signSession.update({ where: { id: signSessionId }, data: { status: 'completed', artifactDocId: artifactDoc.id, signedAt: new Date() } });
    await prisma.offerDraft.update({ where: { id: offerId }, data: { status: 'pending_otp' } });
    await audit({ action: 'sign.complete', entityType: 'SignSession', entityId: signSessionId, payload: { offerId } });
    return { status: 'COMPLETED', signature: { provider: 'STUB', signedAt: new Date().toISOString(), artifact: { id: artifactDoc.id } } };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al completar firma' });
  }
});

// OTP (stub) – SMS/Email
type OtpSendBody = { channel: 'SMS' | 'EMAIL'; destination: string };
app.post<{ Params: { id: string }; Body: OtpSendBody }>('/api/v1/offers/:id/otp/send', async (req, reply) => {
  const offerId = req.params.id;
  const body = req.body as OtpSendBody;
  const channel = body?.channel;
  const destination = typeof body?.destination === 'string' ? body.destination.trim() : '';
  if (channel !== 'SMS' && channel !== 'EMAIL') return reply.status(400).send({ error: 'channel inválido' });
  if (!destination) return reply.status(400).send({ error: 'destination es obligatorio' });
  try {
    const draft = await prisma.offerDraft.findUnique({ where: { id: offerId } });
    if (!draft) return reply.status(404).send({ error: 'Borrador no encontrado' });
    if (draft.status !== 'pending_otp') return reply.status(409).send({ error: 'Estado inválido para OTP' });

    const now = Date.now();
    const ttlSeconds = 600;
    const cooldownSeconds = 60;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const session = await prisma.otpSession.create({
      data: {
        offerId,
        channel,
        destination,
        codeHash,
        expiresAt: new Date(now + ttlSeconds * 1000),
        cooldownUntil: new Date(now + cooldownSeconds * 1000),
      },
    });
    await audit({ action: 'otp.send', entityType: 'OtpSession', entityId: session.id, payload: { offerId, channel } });

    // En stub, retornamos el código solo en desarrollo para facilitar QA.
    const debugCode = process.env.NODE_ENV === 'development' ? code : undefined;
    return { otpSessionId: session.id, channel, ttlSeconds, cooldownSeconds, ...(debugCode ? { debugCode } : {}) };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al enviar OTP' });
  }
});

type OtpVerifyBody = { otpSessionId: string; code: string };
app.post<{ Params: { id: string }; Body: OtpVerifyBody }>('/api/v1/offers/:id/otp/verify', async (req, reply) => {
  const offerId = req.params.id;
  const body = req.body as OtpVerifyBody;
  const otpSessionId = typeof body?.otpSessionId === 'string' ? body.otpSessionId.trim() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!otpSessionId || !code) return reply.status(400).send({ error: 'otpSessionId y code son obligatorios' });
  try {
    const s = await prisma.otpSession.findUnique({ where: { id: otpSessionId } });
    if (!s || s.offerId !== offerId) return reply.status(404).send({ error: 'Sesión OTP no encontrada' });
    if (s.verifiedAt) return { status: 'VERIFIED', verifiedAt: s.verifiedAt.toISOString() };
    if (s.expiresAt.getTime() < Date.now()) return reply.status(401).send({ error: 'OTP expirado' });
    if (s.cooldownUntil && s.cooldownUntil.getTime() > Date.now()) return reply.status(429).send({ error: 'Cooldown activo' });
    if (s.attempts >= 5) return reply.status(429).send({ error: 'Demasiados intentos' });
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== s.codeHash) {
      await prisma.otpSession.update({ where: { id: otpSessionId }, data: { attempts: { increment: 1 } } });
      return reply.status(400).send({ error: 'OTP inválido' });
    }
    const verifiedAt = new Date();
    await prisma.otpSession.update({ where: { id: otpSessionId }, data: { verifiedAt } });
    await audit({ action: 'otp.verify', entityType: 'OtpSession', entityId: otpSessionId, payload: { offerId } });
    return { status: 'VERIFIED', verifiedAt: verifiedAt.toISOString() };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al verificar OTP' });
  }
});

// Submit final: requiere firma + OTP verificado, crea Offer y acuse; opcionalmente declara inhabilidades (arts. 75-76) y crea/actualiza Bid
type OfferSubmitBody = { declareNoInability?: boolean; invitationType?: 'self_invited' };
app.post<{ Params: { id: string }; Body: OfferSubmitBody }>('/api/v1/offers/:id/submit', async (req, reply) => {
  const draftId = req.params.id;
  const body = (req.body as OfferSubmitBody) || {};
  const declareNoInability = body.declareNoInability === true;
  const invitationType = (body.invitationType === 'self_invited' || body.invitationType === 'invited') ? body.invitationType : undefined;
  try {
    const draft = await prisma.offerDraft.findUnique({ where: { id: draftId } });
    if (!draft) return reply.status(404).send({ error: 'Borrador no encontrado' });
    if (draft.status !== 'pending_otp') return reply.status(409).send({ error: 'Estado inválido para submit' });

    const sign = await prisma.signSession.findFirst({ where: { offerId: draftId, status: 'completed' }, orderBy: { createdAt: 'desc' } });
    if (!sign) return reply.status(400).send({ error: 'Firma requerida' });
    const otp = await prisma.otpSession.findFirst({ where: { offerId: draftId, verifiedAt: { not: null } }, orderBy: { createdAt: 'desc' } });
    if (!otp) return reply.status(400).send({ error: 'OTP requerido' });

    if (invitationType === 'self_invited' && draft.tenderId) {
      const tender = await prisma.tender.findUnique({ where: { id: draft.tenderId }, select: { bidsDeadlineAt: true } });
      if (tender?.bidsDeadlineAt && new Date() > tender.bidsDeadlineAt)
        return reply.status(400).send({ error: 'Autoinvitación no permitida después del cierre de ofertas (bidsDeadlineAt)' });
      const prov = await prisma.provider.findUnique({ where: { id: draft.providerId }, select: { isCompliantSRI: true, isCompliantIESS: true } });
      if (prov && (prov.isCompliantSRI === false || prov.isCompliantIESS === false))
        return reply.status(400).send({ error: 'El proveedor no se encuentra al día en obligaciones tributarias o laborales; no puede recibir invitación ni autoinvitarse hasta regularizar.' });
    }

    const docs = await prisma.offerDocument.findMany({ where: { draftId }, select: { hash: true, storageKey: true, sizeBytes: true } });
    const manifest = { draftId, processId: draft.processId, providerId: draft.providerId, docs, stepData: draft.stepData };
    const manifestHash = crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
    const receiptFolio = `SERCOP-OF-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const offer = await prisma.offer.create({
      data: {
        processId: draft.processId,
        tenderId: draft.tenderId ?? undefined,
        providerId: draft.providerId,
        draftId: draft.id,
        receiptFolio,
        manifestHash,
        status: 'submitted',
      },
    });
    await prisma.offerDraft.update({ where: { id: draftId }, data: { status: 'submitted' } });

    if (draft.tenderId && (declareNoInability || invitationType)) {
      const stepData = (draft.stepData as Record<string, unknown>) || {};
      const amount = typeof stepData.amount === 'number' ? stepData.amount : null;
      const existingBid = await prisma.bid.findFirst({ where: { tenderId: draft.tenderId, providerId: draft.providerId } });
      if (existingBid) {
        await prisma.bid.update({
          where: { id: existingBid.id },
          data: {
            ...(declareNoInability && { inabilityDeclarationAt: new Date() }),
            ...(invitationType && { invitationType }),
          },
        });
      } else {
        const tenderForBid = await prisma.tender.findUnique({
          where: { id: draft.tenderId },
          select: { referenceBudgetAmount: true, estimatedAmount: true },
        });
        const providerForBid = await prisma.provider.findUnique({
          where: { id: draft.providerId },
          select: { legalEstablishmentDate: true, patrimonyAmount: true },
        });
        const refAmt = tenderForBid?.referenceBudgetAmount != null ? Number(tenderForBid.referenceBudgetAmount) : tenderForBid?.estimatedAmount != null ? Number(tenderForBid.estimatedAmount) : null;
        if (refAmt != null && refAmt > 500_000 && providerForBid) {
          if (providerForBid.legalEstablishmentDate) {
            const threeYearsAgo = new Date();
            threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
            if (providerForBid.legalEstablishmentDate > threeYearsAgo)
              return reply.status(400).send({ error: 'Para procesos con presupuesto superior a $500.000, la persona jurídica debe tener al menos 3 años de existencia legal desde la fecha de constitución' });
          } else
            return reply.status(400).send({ error: 'Para procesos con presupuesto superior a $500.000 se requiere registrar la fecha de constitución (existencia legal) del proveedor' });
          const patrimony = providerForBid.patrimonyAmount != null ? Number(providerForBid.patrimonyAmount) : null;
          if (patrimony == null || patrimony < refAmt)
            return reply.status(400).send({ error: 'Para procesos con presupuesto referencial superior a $500.000 se requiere acreditar patrimonio igual o superior al presupuesto referencial (art. 93 Reglamento)' });
        }
        await prisma.bid.create({
          data: {
            tenderId: draft.tenderId,
            providerId: draft.providerId,
            amount: amount ?? undefined,
            inabilityDeclarationAt: declareNoInability ? new Date() : undefined,
            invitationType: invitationType ?? undefined,
            submittedAt: new Date(),
          },
        });
      }
    }

    await audit({ action: 'offer.submit', entityType: 'Offer', entityId: offer.id, payload: { draftId, receiptFolio } });
    return { status: 'SUBMITTED', receipt: { folio: receiptFolio, submittedAt: offer.submittedAt.toISOString(), manifestHash } };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al enviar oferta' });
  }
});

// -----------------------------
// SIE – Subasta Inversa (MVP)
// Normativa (transcript "Subasta Inversa Electrónica", art. 10 Reglamento):
// - SIE aplica a bienes y servicios estandarizados (valor por dinero).
// - Calificación cumple/no cumple; no se exige experiencia ni patrimonio.
// - Oferta económica inicial debe coincidir con la declaración BAE (validación cruzada futura).
// - Puja: duración 15–60 min; si no hay al menos 2 oferentes, reprogramación una sola vez 24 h;
//   en reprogramación la postura debe ser inferior a la mínima de la puja inicial.
// - Negociación: rebaja mínima 5% del presupuesto referencial.
// - RUP: verificar habilitación en apertura, adjudicación y suscripción del contrato (y socios si PJ).
// -----------------------------
const SIE_BIDDING_DURATION_MIN = 15;
const SIE_BIDDING_DURATION_MAX = 60;
const SIE_BIDDING_DURATION_DEFAULT = 30;

async function getOrCreateAuction(tenderId: string) {
  const existing = await prisma.auction.findUnique({ where: { tenderId } });
  if (existing) return existing;
  const now = Date.now();
  const initialEndsAt = new Date(now + 10 * 60 * 1000); // ventana inicial (stub)
  const durationMin = SIE_BIDDING_DURATION_DEFAULT;
  const biddingEndsAt = new Date(initialEndsAt.getTime() + durationMin * 60 * 1000);
  return prisma.auction.create({
    data: {
      tenderId,
      status: 'INITIAL_WINDOW_OPEN',
      currentRound: 1,
      initialEndsAt,
      biddingEndsAt,
      biddingDurationMinutes: durationMin,
    },
  });
}

app.get<{ Params: { tenderId: string }; Querystring: { providerId?: string } }>('/api/v1/sie/:tenderId/status', async (req, reply) => {
  const tenderId = req.params.tenderId;
  const providerId = typeof req.query?.providerId === 'string' ? req.query.providerId.trim() : '';
  try {
    const auction = await getOrCreateAuction(tenderId);
    const best = await prisma.auctionBid.findFirst({
      where: { auctionId: auction.id },
      orderBy: { amount: 'asc' },
    });
    const mine = providerId
      ? await prisma.auctionBid.findFirst({
          where: { auctionId: auction.id, providerId },
          orderBy: { createdAt: 'desc' },
        })
      : null;
    return {
      auction: {
        id: auction.id,
        tenderId: auction.tenderId,
        status: auction.status,
        currentRound: auction.currentRound,
        initialEndsAt: auction.initialEndsAt?.toISOString() ?? null,
        biddingEndsAt: auction.biddingEndsAt?.toISOString() ?? null,
      },
      bestBid: best ? { providerId: best.providerId, amount: Number(best.amount), roundNo: best.roundNo, kind: best.kind } : null,
      myLastBid: mine ? { amount: Number(mine.amount), roundNo: mine.roundNo, kind: mine.kind, createdAt: mine.createdAt.toISOString() } : null,
    };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener estado SIE' });
  }
});

type SieBidBody = { providerId: string; amount: number };
app.post<{ Params: { tenderId: string }; Body: SieBidBody }>('/api/v1/sie/:tenderId/initial', async (req, reply) => {
  const tenderId = req.params.tenderId;
  const body = req.body as SieBidBody;
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  const amount = typeof body?.amount === 'number' ? body.amount : NaN;
  if (!providerId) return reply.status(400).send({ error: 'providerId es obligatorio' });
  if (!Number.isFinite(amount) || amount <= 0) return reply.status(400).send({ error: 'amount inválido' });
  try {
    const auction = await getOrCreateAuction(tenderId);
    // estado mínimo: permitir en ventana inicial
    if (!['INITIAL_WINDOW_OPEN', 'INITIAL_DRAFT', 'INITIAL_SUBMITTED'].includes(auction.status)) {
      return reply.status(409).send({ error: 'Subasta no está en ventana inicial' });
    }
    const bid = await prisma.auctionBid.create({
      data: { auctionId: auction.id, providerId, amount, roundNo: 1, kind: 'INITIAL' },
    });
    await prisma.auction.update({ where: { id: auction.id }, data: { status: 'INITIAL_SUBMITTED', startAmount: amount } });
    await audit({ action: 'sie.initial.submit', entityType: 'AuctionBid', entityId: bid.id, payload: { tenderId, providerId, amount } });
    return reply.status(201).send({ ok: true, bidId: bid.id });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al enviar oferta inicial SIE' });
  }
});

app.post<{ Params: { tenderId: string }; Body: SieBidBody }>('/api/v1/sie/:tenderId/bids', async (req, reply) => {
  const tenderId = req.params.tenderId;
  const body = req.body as SieBidBody;
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  const amount = typeof body?.amount === 'number' ? body.amount : NaN;
  if (!providerId) return reply.status(400).send({ error: 'providerId es obligatorio' });
  if (!Number.isFinite(amount) || amount <= 0) return reply.status(400).send({ error: 'amount inválido' });
  try {
    const auction = await getOrCreateAuction(tenderId);
    if (!['BIDDING_OPEN', 'BIDDING'].includes(auction.status)) {
      // transicionar automáticamente a puja cuando ya hay inicial
      if (auction.status === 'INITIAL_SUBMITTED') {
        await prisma.auction.update({ where: { id: auction.id }, data: { status: 'BIDDING_OPEN' } });
      } else {
        return reply.status(409).send({ error: 'Subasta no está en puja' });
      }
    }
    const best = await prisma.auctionBid.findFirst({ where: { auctionId: auction.id }, orderBy: { amount: 'asc' } });
    if (best && amount >= Number(best.amount)) return reply.status(422).send({ error: 'La puja debe mejorar (ser menor) que la mejor oferta' });
    const bid = await prisma.auctionBid.create({
      data: { auctionId: auction.id, providerId, amount, roundNo: auction.currentRound, kind: 'BID' },
    });
    await prisma.auction.update({ where: { id: auction.id }, data: { status: 'BIDDING' } });
    await audit({ action: 'sie.bid.place', entityType: 'AuctionBid', entityId: bid.id, payload: { tenderId, providerId, amount } });
    return reply.status(201).send({ ok: true, bidId: bid.id });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al registrar puja SIE' });
  }
});

app.post<{ Params: { tenderId: string }; Body: SieBidBody }>('/api/v1/sie/:tenderId/negotiation/final', async (req, reply) => {
  const tenderId = req.params.tenderId;
  const body = req.body as SieBidBody;
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  const amount = typeof body?.amount === 'number' ? body.amount : NaN;
  if (!providerId) return reply.status(400).send({ error: 'providerId es obligatorio' });
  if (!Number.isFinite(amount) || amount <= 0) return reply.status(400).send({ error: 'amount inválido' });
  try {
    const auction = await getOrCreateAuction(tenderId);
    // transición stub: permitir negociación si ya hubo pujas
    if (!['NEGOTIATION', 'BIDDING', 'BIDDING_CLOSED'].includes(auction.status)) {
      return reply.status(409).send({ error: 'Subasta no está en negociación' });
    }
    const tender = await prisma.tender.findUnique({
      where: { id: auction.tenderId },
      select: { referenceBudgetAmount: true, estimatedAmount: true },
    });
    const refAmount = tender?.referenceBudgetAmount != null ? Number(tender.referenceBudgetAmount) : tender?.estimatedAmount != null ? Number(tender.estimatedAmount) : null;
    if (refAmount != null && Number.isFinite(refAmount) && refAmount > 0) {
      const maxAllowed = refAmount * 0.95;
      if (amount > maxAllowed)
        return reply.status(400).send({ error: 'La oferta de negociación debe ser al menos 5% inferior al presupuesto referencial' });
    }
    const best = await prisma.auctionBid.findFirst({ where: { auctionId: auction.id }, orderBy: { amount: 'asc' } });
    if (best && amount >= Number(best.amount)) return reply.status(422).send({ error: 'La oferta final debe mejorar (ser menor) que la mejor oferta' });
    const bid = await prisma.auctionBid.create({
      data: { auctionId: auction.id, providerId, amount, roundNo: auction.currentRound, kind: 'NEGOTIATION_FINAL' },
    });
    await prisma.auction.update({ where: { id: auction.id }, data: { status: 'NEGOTIATION' } });
    await audit({ action: 'sie.negotiation.final', entityType: 'AuctionBid', entityId: bid.id, payload: { tenderId, providerId, amount } });
    return reply.status(201).send({ ok: true, bidId: bid.id });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al enviar oferta final de negociación' });
  }
});

// -----------------------------
// Revisión / aclaraciones (MVP)
// -----------------------------
app.get<{ Querystring: { processId?: string; tenderId?: string; status?: string; providerId?: string } }>('/api/v1/offers', async (req, reply) => {
  const processId = typeof req.query?.processId === 'string' ? req.query.processId.trim() : '';
  const tenderId = typeof req.query?.tenderId === 'string' ? req.query.tenderId.trim() : '';
  const status = typeof req.query?.status === 'string' ? req.query.status.trim() : '';
  const providerId = typeof req.query?.providerId === 'string' ? req.query.providerId.trim() : '';
  if (!processId && !tenderId) return reply.status(400).send({ error: 'processId o tenderId es obligatorio' });
  try {
    const where: Record<string, unknown> = {};
    if (processId) where.processId = processId;
    if (tenderId) where.tenderId = tenderId;
    if (status) where.status = status;
    if (providerId) where.providerId = providerId;
    const offers = await prisma.offer.findMany({ where: where as any, orderBy: { submittedAt: 'desc' } });
    return { data: offers };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar ofertas' });
  }
});

type OfferStatusBody = { status: string };
app.post<{ Params: { id: string }; Body: OfferStatusBody }>('/api/v1/offers/:id/status', async (req, reply) => {
  const id = req.params.id;
  const status = typeof (req.body as OfferStatusBody)?.status === 'string' ? (req.body as OfferStatusBody).status.trim() : '';
  if (!status) return reply.status(400).send({ error: 'status es obligatorio' });
  if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
  try {
    const updated = await prisma.offer.update({ where: { id }, data: { status } });
    await audit({ action: 'offer.status.update', entityType: 'Offer', entityId: id, payload: { status } });
    return updated;
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al actualizar estado' });
  }
});

type ClarificationCreateBody = { subject: string; message: string };
app.post<{ Params: { id: string }; Body: ClarificationCreateBody }>('/api/v1/offers/:id/clarifications', async (req, reply) => {
  const offerId = req.params.id;
  const subject = typeof (req.body as ClarificationCreateBody)?.subject === 'string' ? (req.body as ClarificationCreateBody).subject.trim() : '';
  const message = typeof (req.body as ClarificationCreateBody)?.message === 'string' ? (req.body as ClarificationCreateBody).message.trim() : '';
  if (!subject || !message) return reply.status(400).send({ error: 'subject y message son obligatorios' });
  if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
  try {
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) return reply.status(404).send({ error: 'Oferta no encontrada' });
    const c = await prisma.offerClarification.create({ data: { offerId, subject, message, status: 'OPEN' } });
    await prisma.offer.update({ where: { id: offerId }, data: { status: 'clarification_requested' } });
    await audit({ action: 'offer.clarification.request', entityType: 'OfferClarification', entityId: c.id, payload: { offerId } });
    return reply.status(201).send(c);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al solicitar aclaración' });
  }
});

// -----------------------------
// Denuncias públicas y reclamos de proceso
// -----------------------------

type ComplaintBody = {
  tenderId?: string;
  entityId?: string;
  providerId?: string;
  channel: string;
  category: string;
  summary: string;
  details?: string;
  contactEmail?: string;
  contactPhone?: string;
};

// POST /api/v1/complaints – creación pública (sin auth obligatoria)
app.post<{ Body: ComplaintBody }>('/api/v1/complaints', async (req, reply) => {
  const body = req.body as ComplaintBody;
  const summary = typeof body?.summary === 'string' ? body.summary.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const channel = typeof body?.channel === 'string' ? body.channel.trim() : '';
  if (!summary || !category || !channel) return reply.status(400).send({ error: 'channel, category y summary son obligatorios' });
  try {
    const complaint = await prisma.complaint.create({
      data: {
        tenderId: typeof body?.tenderId === 'string' && body.tenderId.trim() ? body.tenderId.trim() : undefined,
        entityId: typeof body?.entityId === 'string' && body.entityId.trim() ? body.entityId.trim() : undefined,
        providerId: typeof body?.providerId === 'string' && body.providerId.trim() ? body.providerId.trim() : undefined,
        channel,
        category,
        summary,
        details: typeof body?.details === 'string' && body.details.trim() ? body.details.trim() : undefined,
        contactEmail:
          typeof body?.contactEmail === 'string' && body.contactEmail.trim() ? body.contactEmail.trim() : undefined,
        contactPhone:
          typeof body?.contactPhone === 'string' && body.contactPhone.trim() ? body.contactPhone.trim() : undefined,
      },
    });
    await audit({
      action: 'complaint.create',
      entityType: 'Complaint',
      entityId: complaint.id,
      payload: { tenderId: complaint.tenderId, entityId: complaint.entityId, providerId: complaint.providerId },
    });
    return reply.status(201).send(complaint);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al registrar denuncia' });
  }
});

// GET /api/v1/complaints – listado para administración (requiere rol admin)
app.get<{ Querystring: { tenderId?: string; entityId?: string; providerId?: string; status?: string } }>(
  '/api/v1/complaints',
  async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
    const { tenderId, entityId, providerId, status } = req.query;
    try {
      const where: Prisma.ComplaintWhereInput = {};
      if (typeof tenderId === 'string' && tenderId.trim()) where.tenderId = tenderId.trim();
      if (typeof entityId === 'string' && entityId.trim()) where.entityId = entityId.trim();
      if (typeof providerId === 'string' && providerId.trim()) where.providerId = providerId.trim();
      if (typeof status === 'string' && status.trim()) where.status = status.trim();
      const data = await prisma.complaint.findMany({ where, orderBy: { createdAt: 'desc' } });
      return { data };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al listar denuncias' });
    }
  }
);

type ComplaintUpdateBody = { status?: string; category?: string };

// PATCH /api/v1/complaints/:id – gestión básica de estado/categoría (admin)
app.patch<{ Params: { id: string }; Body: ComplaintUpdateBody }>(
  '/api/v1/complaints/:id',
  async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
    const { id } = req.params;
    const body = (req.body as ComplaintUpdateBody) || {};
    const data: Prisma.ComplaintUpdateInput = {};
    if (typeof body.status === 'string' && body.status.trim()) data.status = body.status.trim();
    if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
    if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
    try {
      const updated = await prisma.complaint.update({ where: { id }, data });
      await audit({ action: 'complaint.update', entityType: 'Complaint', entityId: id, payload: data });
      return updated;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al actualizar denuncia' });
    }
  }
);

type ProcessClaimBody = {
  tenderId: string;
  providerId: string;
  kind: string;
  subject: string;
  message: string;
};

// POST /api/v1/process-claims – reclamo formal de proveedor (requiere rol supplier)
app.post<{ Body: ProcessClaimBody }>('/api/v1/process-claims', async (req, reply) => {
  if (req.user?.role !== 'supplier') return reply.status(403).send({ error: 'Forbidden' });
  const body = req.body as ProcessClaimBody;
  const tenderId = typeof body?.tenderId === 'string' ? body.tenderId.trim() : '';
  const providerId = typeof body?.providerId === 'string' ? body.providerId.trim() : '';
  const kind = typeof body?.kind === 'string' ? body.kind.trim() : '';
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!tenderId || !providerId || !kind || !subject || !message)
    return reply.status(400).send({ error: 'tenderId, providerId, kind, subject y message son obligatorios' });
  try {
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      select: { id: true, claimWindowDays: true, bidsOpenedAt: true, bidsDeadlineAt: true },
    });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const windowDays = tender.claimWindowDays ?? 3;
    const finEtapa = tender.bidsOpenedAt ?? tender.bidsDeadlineAt ?? null;
    if (finEtapa) {
      const finVentana = new Date(finEtapa.getTime() + windowDays * 24 * 60 * 60 * 1000);
      if (new Date() > finVentana)
        return reply.status(400).send({ error: `El plazo para presentar reclamos (${windowDays} días desde el cierre de la etapa) ha vencido.` });
    }
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) return reply.status(400).send({ error: 'Proveedor no encontrado' });
    const claim = await prisma.processClaim.create({
      data: { tenderId, providerId, kind, subject, message, status: 'OPEN' },
    });
    await audit({
      action: 'process-claim.create',
      entityType: 'ProcessClaim',
      entityId: claim.id,
      payload: { tenderId, providerId, kind },
    });
    return reply.status(201).send(claim);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al registrar reclamo' });
  }
});

// GET /api/v1/process-claims – filtros por tender, provider, status (admin/entity)
app.get<{ Querystring: { tenderId?: string; providerId?: string; status?: string } }>(
  '/api/v1/process-claims',
  async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity')
      return reply.status(403).send({ error: 'Forbidden' });
    const { tenderId, providerId, status } = req.query;
    try {
      const where: Prisma.ProcessClaimWhereInput = {};
      if (typeof tenderId === 'string' && tenderId.trim()) where.tenderId = tenderId.trim();
      if (typeof providerId === 'string' && providerId.trim()) where.providerId = providerId.trim();
      if (typeof status === 'string' && status.trim()) where.status = status.trim();
      const data = await prisma.processClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          tender: { select: { id: true, title: true, status: true } },
          provider: { select: { id: true, name: true, identifier: true } },
        },
      });
      return { data };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al listar reclamos' });
    }
  }
);

type ProcessClaimUpdateBody = { status?: string; response?: string };

// PATCH /api/v1/process-claims/:id – resolución de reclamo (admin/entity)
app.patch<{ Params: { id: string }; Body: ProcessClaimUpdateBody }>(
  '/api/v1/process-claims/:id',
  async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity')
      return reply.status(403).send({ error: 'Forbidden' });
    const { id } = req.params;
    const body = (req.body as ProcessClaimUpdateBody) || {};
    const data: Prisma.ProcessClaimUpdateInput = {};
    if (typeof body.status === 'string' && body.status.trim()) data.status = body.status.trim();
    if (typeof body.response === 'string' && body.response.trim()) data.response = body.response.trim();
    if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
    try {
      const updated = await prisma.processClaim.update({ where: { id }, data });
      await audit({ action: 'process-claim.update', entityType: 'ProcessClaim', entityId: id, payload: data });
      return updated;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al actualizar reclamo' });
    }
  }
);

// -----------------------------
// Aclaraciones a nivel de proceso (TenderClarification)
// -----------------------------

type TenderClarificationCreateBody = { question: string; askedByProviderId?: string };

// GET /api/v1/tenders/:id/clarifications – listar preguntas/aclaraciones del proceso (público para publicados)
app.get<{ Params: { id: string } }>('/api/v1/tenders/:id/clarifications', async (req, reply) => {
  const { id } = req.params;
  try {
    const tender = await prisma.tender.findUnique({ where: { id } });
    if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
    const data = await prisma.tenderClarification.findMany({
      where: { tenderId: id },
      orderBy: { askedAt: 'desc' },
      include: {
        askedByProvider: { select: { id: true, name: true, identifier: true } },
      },
    });
    return { data };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar aclaraciones del proceso' });
  }
});

// POST /api/v1/tenders/:id/clarifications – formular pregunta (supplier o anónimo según política)
app.post<{ Params: { id: string }; Body: TenderClarificationCreateBody }>(
  '/api/v1/tenders/:id/clarifications',
  async (req, reply) => {
    const tenderId = req.params.id;
    const body = req.body as TenderClarificationCreateBody;
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question) return reply.status(400).send({ error: 'question es obligatorio' });
    try {
      const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
      if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
      if (tender.status !== 'published')
        return reply.status(400).send({ error: 'Solo se pueden formular preguntas en procesos publicados' });
      const askedByProviderId =
        typeof body?.askedByProviderId === 'string' && body.askedByProviderId.trim()
          ? body.askedByProviderId.trim()
          : undefined;
      const clarification = await prisma.tenderClarification.create({
        data: { tenderId, question, askedByProviderId, status: 'OPEN' },
      });
      await audit({
        action: 'tender.clarification.create',
        entityType: 'TenderClarification',
        entityId: clarification.id,
        payload: { tenderId, askedByProviderId: askedByProviderId ?? null },
      });
      return reply.status(201).send(clarification);
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al registrar pregunta' });
    }
  }
);

type TenderClarificationAnswerBody = { answer: string };

// PATCH /api/v1/tender-clarifications/:clarificationId – responder/cerrar (admin/entity)
app.patch<{ Params: { clarificationId: string }; Body: TenderClarificationAnswerBody }>(
  '/api/v1/tender-clarifications/:clarificationId',
  async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity')
      return reply.status(403).send({ error: 'Forbidden' });
    const { clarificationId } = req.params;
    const body = req.body as TenderClarificationAnswerBody;
    const answer = typeof body?.answer === 'string' ? body.answer.trim() : '';
    const data: Prisma.TenderClarificationUpdateInput = {};
    if (answer) {
      data.answer = answer;
      data.answeredAt = new Date();
      data.status = 'ANSWERED';
    }
    if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'answer es obligatorio' });
    try {
      const updated = await prisma.tenderClarification.update({
        where: { id: clarificationId },
        data,
      });
      await audit({
        action: 'tender.clarification.answer',
        entityType: 'TenderClarification',
        entityId: clarificationId,
        payload: { tenderId: updated.tenderId },
      });
      return updated;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al responder aclaración' });
    }
  }
);

app.get<{ Params: { id: string } }>('/api/v1/offers/:id/clarifications', async (req, reply) => {
  const offerId = req.params.id;
  try {
    const data = await prisma.offerClarification.findMany({ where: { offerId }, orderBy: { requestedAt: 'desc' } });
    return { data };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar aclaraciones' });
  }
});

type ClarificationRespondBody = { response: string };
app.post<{ Params: { id: string; clarificationId: string }; Body: ClarificationRespondBody }>(
  '/api/v1/offers/:id/clarifications/:clarificationId/respond',
  async (req, reply) => {
    const offerId = req.params.id;
    const clarificationId = req.params.clarificationId;
    const response = typeof (req.body as ClarificationRespondBody)?.response === 'string' ? (req.body as ClarificationRespondBody).response.trim() : '';
    if (!response) return reply.status(400).send({ error: 'response es obligatorio' });
    // supplier (respuesta) o admin/entity (cierre)
    try {
      const c = await prisma.offerClarification.findUnique({ where: { id: clarificationId } });
      if (!c || c.offerId !== offerId) return reply.status(404).send({ error: 'Aclaración no encontrada' });
      const updated = await prisma.offerClarification.update({
        where: { id: clarificationId },
        data: { response, status: 'RESPONDED', respondedAt: new Date() },
      });
      // si responde proveedor, deja la oferta en clarified para revisión
      await prisma.offer.update({ where: { id: offerId }, data: { status: 'clarified' } });
      await audit({ action: 'offer.clarification.respond', entityType: 'OfferClarification', entityId: clarificationId, payload: { offerId } });
      return updated;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al responder aclaración' });
    }
  }
);

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
// Contratos = solo adjudicados (firmados: signedAt no nulo)
app.get('/api/v1/analytics/public', async (req, reply) => {
  try {
    const [tenders, tendersPublished, providers, contractsAdjudicated] = await Promise.all([
      prisma.tender.count(),
      prisma.tender.count({ where: { status: 'published' } }),
      prisma.provider.count(),
      prisma.contract.count({ where: { signedAt: { not: null } } }),
    ]);
    const tendersPublishedCoherent = Math.min(tendersPublished, tenders);
    return {
      tenders,
      tendersPublished: tendersPublishedCoherent,
      providers,
      contracts: contractsAdjudicated,
    };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al obtener estadísticas' });
  }
});

// -----------------------------
// Pagos de contrato
// -----------------------------

type ContractPaymentBody = {
  sequenceNo: number;
  amount: number;
  status?: string;
  dueDate?: string;
};

// GET /api/v1/contracts/:id/payments – listado de pagos asociados
app.get<{ Params: { id: string } }>('/api/v1/contracts/:id/payments', async (req, reply) => {
  const { id } = req.params;
  try {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return reply.status(404).send({ error: 'Contrato no encontrado' });
    const data = await prisma.contractPayment.findMany({
      where: { contractId: id },
      orderBy: [{ sequenceNo: 'asc' }, { createdAt: 'asc' }],
    });
    return { data };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Error al listar pagos de contrato' });
  }
});

// POST /api/v1/contracts/:id/payments – creación de un hito de pago (entity/admin)
app.post<{ Params: { id: string }; Body: ContractPaymentBody }>(
  '/api/v1/contracts/:id/payments',
  async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity')
      return reply.status(403).send({ error: 'Forbidden' });
    const { id } = req.params;
    const body = req.body as ContractPaymentBody;
    const sequenceNo = body?.sequenceNo;
    const amount = body?.amount;
    if (!Number.isInteger(sequenceNo) || sequenceNo <= 0 || typeof amount !== 'number' || amount <= 0) {
      return reply
        .status(400)
        .send({ error: 'sequenceNo (entero > 0) y amount (> 0) son obligatorios' });
    }
    try {
      const contract = await prisma.contract.findUnique({ where: { id } });
      if (!contract) return reply.status(404).send({ error: 'Contrato no encontrado' });
      const payment = await prisma.contractPayment.create({
        data: {
          contractId: id,
          sequenceNo,
          amount,
          status: typeof body?.status === 'string' && body.status.trim() ? body.status.trim() : 'planned',
          dueDate: typeof body?.dueDate === 'string' && body.dueDate.trim()
            ? new Date(body.dueDate)
            : undefined,
        },
      });
      await audit({
        action: 'contract.payment.create',
        entityType: 'ContractPayment',
        entityId: payment.id,
        payload: { contractId: id, sequenceNo, amount },
      });
      return reply.status(201).send(payment);
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al crear pago de contrato' });
    }
  }
);

type ContractPaymentUpdateBody = {
  status?: string;
  amount?: number;
  dueDate?: string;
  paidAt?: string;
};

// PATCH /api/v1/contract-payments/:paymentId – actualización de estado/fechas
app.patch<{ Params: { paymentId: string }; Body: ContractPaymentUpdateBody }>(
  '/api/v1/contract-payments/:paymentId',
  async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity')
      return reply.status(403).send({ error: 'Forbidden' });
    const { paymentId } = req.params;
    const body = (req.body as ContractPaymentUpdateBody) || {};
    const data: Prisma.ContractPaymentUpdateInput = {};
    if (typeof body.status === 'string' && body.status.trim()) data.status = body.status.trim();
    if (typeof body.amount === 'number' && body.amount > 0) data.amount = body.amount;
    if (typeof body.dueDate === 'string' && body.dueDate.trim())
      data.dueDate = new Date(body.dueDate);
    if (typeof body.paidAt === 'string' && body.paidAt.trim())
      data.paidAt = new Date(body.paidAt);
    if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
    try {
      const updated = await prisma.contractPayment.update({ where: { id: paymentId }, data });
      await audit({
        action: 'contract.payment.update',
        entityType: 'ContractPayment',
        entityId: paymentId,
        payload: data,
      });
      return updated;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al actualizar pago de contrato' });
    }
  }
);

// Auditoría (protegido; admin/entity; entityId = contractingEntityId para rendición de cuentas)
app.get<{ Querystring: { limit?: string; offset?: string; action?: string; entityType?: string; contractingEntityId?: string } }>(
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
      if (typeof req.query?.contractingEntityId === 'string' && req.query.contractingEntityId.trim())
        where.contractingEntityId = req.query.contractingEntityId.trim();
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

type EvaluationBody = {
  bidId: string;
  technicalScore?: number;
  financialScore?: number;
  baeScore?: number;
  nationalPartScore?: number;
  experienceGeneralScore?: number;
  experienceSpecificScore?: number;
  subcontractingScore?: number;
  otherParamsScore?: number;
  totalScore?: number;
  status?: string;
};
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
        baeScore: body?.baeScore,
        nationalPartScore: body?.nationalPartScore,
        experienceGeneralScore: body?.experienceGeneralScore,
        experienceSpecificScore: body?.experienceSpecificScore,
        subcontractingScore: body?.subcontractingScore,
        otherParamsScore: body?.otherParamsScore,
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
