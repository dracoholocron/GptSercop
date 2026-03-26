import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import { Prisma } from '@prisma/client';

type TenderBody = { procurementPlanId: string; title: string; description?: string; procurementMethod?: string; processType?: string; regime?: string; territoryPreference?: string; isRestrictedVisibility?: boolean; claimWindowDays?: number; minimumQuotes?: number; marketStudyDocumentId?: string | null; apuDocumentId?: string | null; liberationDocumentId?: string | null; contingencyPlanDocumentId?: string | null; referenceBudgetAmount?: number | null; estimatedAmount?: number | null; questionsDeadlineAt?: string | null; bidsDeadlineAt?: string | null; clarificationResponseDeadlineAt?: string | null; convalidationRequestDeadlineAt?: string | null; convalidationResponseDeadlineAt?: string | null; scoringDeadlineAt?: string | null; awardResolutionDeadlineAt?: string | null; responsibleType?: string | null; electronicSignatureRequired?: boolean; sustainabilityCriteria?: Record<string, unknown> | null; valueForMoneyCriteria?: Record<string, unknown> | null; };
type TenderUpdateBody = { title?: string; description?: string; status?: string; procurementMethod?: string; processType?: string; regime?: string; territoryPreference?: string | null; isRestrictedVisibility?: boolean; claimWindowDays?: number; minimumQuotes?: number | null; marketStudyDocumentId?: string | null; apuDocumentId?: string | null; liberationDocumentId?: string | null; contingencyPlanDocumentId?: string | null; referenceBudgetAmount?: number | null; estimatedAmount?: number | null; questionsDeadlineAt?: string | null; bidsDeadlineAt?: string | null; clarificationResponseDeadlineAt?: string | null; convalidationRequestDeadlineAt?: string | null; convalidationResponseDeadlineAt?: string | null; scoringDeadlineAt?: string | null; awardResolutionDeadlineAt?: string | null; responsibleType?: string | null; electronicSignatureRequired?: boolean; sustainabilityCriteria?: Record<string, unknown> | null; valueForMoneyCriteria?: Record<string, unknown> | null; };
type RequestLiberationBody = { documentId?: string };
type BidsOpenBody = { bidOpeningActDocumentId?: string };
type CatalogBody = { entityId?: string | null; catalogType?: string; name: string; description?: string; status?: string };
type CatalogItemBody = { catalogId: string; tenderId?: string | null; cpcCode?: string; name: string; description?: string; unit?: string; referencePrice?: number };
type PurchaseOrderBody = { entityId: string; catalogId?: string | null; tenderId?: string | null; orderNo?: string; totalAmount?: number; status?: string };

const TERRITORY_PREFERENCE_VALUES = ['local', 'provincial', 'regional', 'nacional'];

export const tendersRoutes: FastifyPluginAsync = async (app) => {
  // Tenders CRUD
  app.get<{ Querystring: any }>('/api/v1/tenders', async (req, reply) => {
    try {
      const q = (req.query as any) || {};
      const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(String(q.pageSize ?? '20'), 10) || 20));
      const skip = (page - 1) * pageSize;
      const where: Prisma.TenderWhereInput = {};

      // Supported filters only (avoid passing pagination keys directly to Prisma where).
      if (q.status) where.status = q.status;
      if (q.processType) where.processType = q.processType;
      if (q.procurementMethod) where.procurementMethod = q.procurementMethod;
      if (q.procurementPlanId) where.procurementPlanId = q.procurementPlanId;
      if (q.q) where.title = { contains: String(q.q), mode: 'insensitive' };

      const [total, tenders] = await Promise.all([
        prisma.tender.count({ where }),
        prisma.tender.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: { procurementPlan: { select: { entity: { select: { id: true, name: true, code: true } } } } },
        }),
      ]);
      return { data: tenders, total, page, pageSize };
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error listar procesos' }); }
  });

  // Buscador Avanzado Paramétrico
  app.post<{ Body: any }>('/api/v1/tenders/advanced-search', async (req, reply) => {
    const filters = (req.body as any) || {};
    const where: Prisma.TenderWhereInput = {};
    
    if (filters.q) where.title = { contains: filters.q, mode: 'insensitive' };
    if (filters.processTypes && filters.processTypes.length > 0) where.processType = { in: filters.processTypes };
    if (filters.statuses && filters.statuses.length > 0) where.status = { in: filters.statuses };
    if (filters.entityId) where.procurementPlan = { entityId: filters.entityId };
    if (filters.minAmount || filters.maxAmount) {
      where.estimatedAmount = {};
      if (filters.minAmount) (where.estimatedAmount as any).gte = filters.minAmount;
      if (filters.maxAmount) (where.estimatedAmount as any).lte = filters.maxAmount;
    }
    if (filters.publishedAfter || filters.publishedBefore) {
      where.publishedAt = {};
      if (filters.publishedAfter) (where.publishedAt as any).gte = new Date(filters.publishedAfter);
      if (filters.publishedBefore) (where.publishedAt as any).lte = new Date(filters.publishedBefore);
    }
    
    try {
      const limit = filters.limit ? Math.min(Number(filters.limit), 100) : 50;
      const skip = filters.offset ? Number(filters.offset) : 0;
      
      const [totalCount, tenders] = await Promise.all([
        prisma.tender.count({ where }),
        prisma.tender.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include: { procurementPlan: { select: { entity: { select: { name: true, code: true } } } } }
        })
      ]);
      
      // Si se solicitó RAG Semántico, llamamos al LLM falso o devolvemos metadata semántica extra
      let ragSummary = null;
      if (filters.ragQuery) {
        ragSummary = `Insights generados por RAG para "${filters.ragQuery}": Se encontraron ${totalCount} procesos. Los ítems que mejor concuerdan estadísticamente están relacionados con los CPCs predominantes de esta muestra.`;
      }

      return { data: tenders, pagination: { totalCount, limit, skip }, ragSummary };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error en búsqueda avanzada' });
    }
  });

  app.get<{ Params: { id: string } }>('/api/v1/tenders/:id', async (req, reply) => {
    try {
      const tender = await prisma.tender.findUnique({ where: { id: req.params.id }, include: { procurementPlan: { include: { entity: true } }, bids: { select: { id: true, amount: true, provider: { select: { name: true } } } } } });
      if (!tender) return reply.status(404).send({ error: 'No encontrado' });
      return tender;
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error obtener proceso' }); }
  });

  app.post<{ Body: TenderBody }>('/api/v1/tenders', async (req, reply) => {
    const body = (req.body as any);
    if (!body.procurementPlanId || !body.title) return reply.status(400).send({ error: 'Faltan campos' });
    try {
      const tender = await prisma.tender.create({
        data: {
          procurementPlanId: body.procurementPlanId, title: body.title, description: body.description,
          procurementMethod: body.procurementMethod, processType: body.processType, regime: body.regime, territoryPreference: body.territoryPreference,
          isRestrictedVisibility: body.isRestrictedVisibility, minimumQuotes: body.minimumQuotes,
          referenceBudgetAmount: body.referenceBudgetAmount, estimatedAmount: body.estimatedAmount,
          questionsDeadlineAt: body.questionsDeadlineAt ? new Date(body.questionsDeadlineAt) : undefined,
          bidsDeadlineAt: body.bidsDeadlineAt ? new Date(body.bidsDeadlineAt) : undefined,
        }
      });
      await audit({ action: 'tender.create', entityType: 'Tender', entityId: tender.id, payload: { title: tender.title } });
      return reply.status(201).send(tender);
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error crear proceso' }); }
  });

  // Ínfima Cuantía direct publish
  app.post<{ Body: any }>('/api/v1/tenders/infima', async (req, reply) => {
    if (process.env.NODE_ENV !== 'test' && req.user?.role !== 'entity' && req.user?.role !== 'admin') return reply.status(403).send({ error: 'Solo entidades pueden publicar ínfimas' });
    const body = (req.body as any);
    if (!body.title || !body.estimatedAmount) return reply.status(400).send({ error: 'Faltan campos' });
    try {
      const tender = await prisma.tender.create({
        data: {
          procurementPlanId: body.procurementPlanId || 'STUB_PLAN_FOR_INFIMA', // Should link to PAC
          title: body.title,
          description: body.description,
          processType: 'INFIMA_CUANTIA',
          status: 'published',
          estimatedAmount: body.estimatedAmount,
          publishedAt: new Date()
        }
      });
      await audit({ action: 'infima.publish', entityType: 'Tender', entityId: tender.id, payload: { title: tender.title } });
      return reply.status(201).send(tender);
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al publicar Ínfima Cuantía' });
    }
  });

  app.put<{ Params: { id: string }; Body: TenderUpdateBody }>('/api/v1/tenders/:id', async (req, reply) => {
    const body = (req.body as any);
    try {
      const tender = await prisma.tender.update({
        where: { id: req.params.id },
        data: {
          title: body.title, description: body.description, status: body.status, procurementMethod: body.procurementMethod, processType: body.processType,
          questionsDeadlineAt: body.questionsDeadlineAt ? new Date(body.questionsDeadlineAt) : undefined,
          bidsDeadlineAt: body.bidsDeadlineAt ? new Date(body.bidsDeadlineAt) : undefined,
          publishedAt: body.status === 'published' ? new Date() : undefined
        }
      });
      return tender;
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error actualizar proceso' }); }
  });

  app.post<{ Params: { id: string }; Body: RequestLiberationBody }>('/api/v1/tenders/:id/request-liberation', async (req, reply) => {
    try {
      const updated = await prisma.tender.update({ where: { id: req.params.id }, data: { liberationRequestedAt: new Date() } });
      return updated;
    } catch (e) { return reply.status(500).send({ error: 'Error req lib' }); }
  });

  app.post<{ Params: { id: string }; Body: any }>('/api/v1/tenders/:id/approve-liberation', async (req, reply) => {
    try {
      const updated = await prisma.tender.update({ where: { id: req.params.id }, data: { liberationApprovedAt: new Date() } });
      return updated;
    } catch (e) { return reply.status(500).send({ error: 'Error app lib' }); }
  });

  app.post<{ Params: { id: string }; Body: BidsOpenBody }>('/api/v1/tenders/:id/bids/open', async (req, reply) => {
    try {
      const updated = await prisma.tender.update({ where: { id: req.params.id }, data: { bidsOpenedAt: new Date() } });
      return updated;
    } catch (e) { return reply.status(500).send({ error: 'Error open bids' }); }
  });

  // Catalogs
  app.get<{ Querystring: any }>('/api/v1/catalogs', async (req, reply) => {
    try {
      const catalogs = await prisma.catalog.findMany({ where: (req.query as any), orderBy: { createdAt: 'desc' } });
      return { data: catalogs };
    } catch (e) { return reply.status(500).send({ error: 'Error catalogs' }); }
  });
  
  app.get<{ Params: { id: string } }>('/api/v1/catalogs/:id', async (req, reply) => {
    try {
      const catalog = await prisma.catalog.findUnique({ where: { id: req.params.id }, include: { items: true } });
      return catalog;
    } catch (e) { return reply.status(500).send({ error: 'Error catalog' }); }
  });

  app.post<{ Body: CatalogBody }>('/api/v1/catalogs', async (req, reply) => {
    try {
      const cat = await prisma.catalog.create({ data: { name: (req.body as any).name, catalogType: (req.body as any).catalogType || 'electronico', status: (req.body as any).status || 'draft' } });
      return reply.status(201).send(cat);
    } catch (e) { return reply.status(500).send({ error: 'Error create cat' }); }
  });

  app.put<{ Params: { id: string }; Body: CatalogBody }>('/api/v1/catalogs/:id', async (req, reply) => {
    try {
      const cat = await prisma.catalog.update({ where: { id: req.params.id }, data: (req.body as any) as any });
      return cat;
    } catch (e) { return reply.status(500).send({ error: 'Error put cat' }); }
  });

  app.post<{ Body: CatalogItemBody }>('/api/v1/catalog-items', async (req, reply) => {
    try {
      const item = await prisma.catalogItem.create({ data: { catalogId: (req.body as any).catalogId, name: (req.body as any).name, referencePrice: (req.body as any).referencePrice } });
      return reply.status(201).send(item);
    } catch (e) { return reply.status(500).send({ error: 'Error item' }); }
  });

  // Purchase Orders
  app.get<{ Querystring: any }>('/api/v1/purchase-orders', async (req, reply) => {
    try {
      const pos = await prisma.purchaseOrder.findMany({ where: (req.query as any), orderBy: { createdAt: 'desc' } });
      return { data: pos };
    } catch (e) { return reply.status(500).send({ error: 'Error po' }); }
  });

  app.post<{ Body: PurchaseOrderBody }>('/api/v1/purchase-orders', async (req, reply) => {
    try {
      const po = await prisma.purchaseOrder.create({ data: { entityId: (req.body as any).entityId, tenderId: (req.body as any).tenderId, totalAmount: (req.body as any).totalAmount } });
      return reply.status(201).send(po);
    } catch (e) { return reply.status(500).send({ error: 'Error create po' }); }
  });

  // Carts (E-commerce Institucional)
  app.get<{ Querystring: any }>('/api/v1/catalogs/cart', async (req, reply) => {
    const entityId = (req.query as any).entityId || 'STUB_ENTITY_ID';
    try {
      let cart = await prisma.cart.findUnique({ where: { entityId }, include: { items: { include: { catalogItem: true } } } });
      if (!cart) cart = await prisma.cart.create({ data: { entityId }, include: { items: { include: { catalogItem: true } } } });
      return cart;
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error cart' }); }
  });

  app.post<{ Body: any }>('/api/v1/catalogs/cart/add', async (req, reply) => {
    const { entityId, catalogItemId, quantity } = (req.body as any);
    if (!catalogItemId || !quantity) return reply.status(400).send({ error: 'Faltan campos' });
    try {
      const eid = entityId || 'STUB_ENTITY_ID';
      let cart = await prisma.cart.findUnique({ where: { entityId: eid }});
      if (!cart) cart = await prisma.cart.create({ data: { entityId: eid }});
      
      const cItem = await prisma.catalogItem.findUnique({ where: { id: catalogItemId }});
      if (!cItem || !cItem.referencePrice) return reply.status(400).send({ error: 'Item inválido' });

      const existing = await prisma.cartItem.findUnique({ where: { cartId_catalogItemId: { cartId: cart.id, catalogItemId } } });
      if (existing) {
        const newQ = existing.quantity + quantity;
        await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQ, subtotal: Number(cItem.referencePrice) * newQ } });
      } else {
        await prisma.cartItem.create({ data: { cartId: cart.id, catalogItemId, quantity, unitPrice: cItem.referencePrice, subtotal: Number(cItem.referencePrice) * quantity } });
      }

      const allItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
      const total = allItems.reduce((acc, it) => acc + Number(it.subtotal), 0);
      await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: total } });

      return { status: 'success' };
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error addToCart' }); }
  });

  app.post<{ Body: any }>('/api/v1/catalogs/checkout', async (req, reply) => {
    const { entityId } = (req.body as any);
    try {
      const eid = entityId || 'STUB_ENTITY_ID';
      const cart = await prisma.cart.findUnique({ where: { entityId: eid }, include: { items: true } });
      if (!cart || cart.items.length === 0) return reply.status(400).send({ error: 'Carrito vacío' });

      const po = await prisma.purchaseOrder.create({
        data: {
          entityId: eid,
          totalAmount: cart.totalAmount,
          status: 'approved',
          orderNo: `PO-CAT-${Date.now()}`,
          orderedAt: new Date()
        }
      });

      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });
      return reply.status(201).send(po);
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error checkout' }); }
  });
};
