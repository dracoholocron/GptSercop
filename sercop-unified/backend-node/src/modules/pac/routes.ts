import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';

type PacBody = { entityId: string; year: number; totalAmount?: number };
type PacUpdateBody = { status?: string; totalAmount?: number };

export const pacRoutes: FastifyPluginAsync = async (app) => {
  // PAC (Plan Anual de Contratación)
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
};
