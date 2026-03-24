import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import { Prisma } from '@prisma/client';

type ContractBody = { providerId: string; contractNo?: string; amount?: number; administratorName?: string; administratorEmail?: string; disputeDeadlineDays?: number; awardResolutionIssuedAt?: string | null; awardPublishedAt?: string | null; };
type ContractUpdateBody = { status?: string; amount?: number; administratorName?: string; administratorEmail?: string; administratorObjectionReason?: string; terminatedAt?: string; suspendedAt?: string; terminationCause?: string; suspensionCause?: string; disputeDeadlineDays?: number | null; resultReportDocumentId?: string | null; awardResolutionIssuedAt?: string | null; awardPublishedAt?: string | null; };
type ContractPaymentBody = { sequenceNo: number; amount: number; status?: string; dueDate?: string; };
type ContractPaymentUpdateBody = { status?: string; amount?: number; dueDate?: string; paidAt?: string; };

export const contractsRoutes: FastifyPluginAsync = async (app) => {
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
      const disputeDeadlineDays = typeof body?.disputeDeadlineDays === 'number' && Number.isInteger(body.disputeDeadlineDays) && body.disputeDeadlineDays > 0 ? body.disputeDeadlineDays : undefined;
      let awardResolutionIssuedAt: Date | undefined;
      if (body?.awardResolutionIssuedAt != null && typeof body.awardResolutionIssuedAt === 'string' && body.awardResolutionIssuedAt.trim()) {
        const d = new Date(body.awardResolutionIssuedAt.trim());
        if (Number.isFinite(d.getTime())) awardResolutionIssuedAt = d;
      }
      let awardPublishedAt: Date | undefined;
      if (body?.awardPublishedAt != null && typeof body.awardPublishedAt === 'string' && body.awardPublishedAt.trim()) {
        const d = new Date(body.awardPublishedAt.trim());
        if (Number.isFinite(d.getTime())) awardPublishedAt = d;
      }
      if (awardPublishedAt && awardResolutionIssuedAt) {
        const maxPublish = new Date(awardResolutionIssuedAt.getTime() + 24 * 60 * 60 * 1000);
        if (awardPublishedAt.getTime() > maxPublish.getTime()) return reply.status(400).send({ error: 'La publicación debe ser máx 1 día después de emisión (art. 112)' });
      }
      const contract = await prisma.contract.create({
        data: {
          tenderId, providerId, contractNo: body?.contractNo?.trim() || undefined, amount: body?.amount != null ? body.amount : undefined,
          administratorName: typeof body?.administratorName === 'string' && body.administratorName.trim() ? body.administratorName.trim() : undefined,
          administratorEmail: typeof body?.administratorEmail === 'string' && body.administratorEmail.trim() ? body.administratorEmail.trim() : undefined,
          disputeDeadlineDays, awardResolutionIssuedAt, awardPublishedAt,
        },
      });
      return reply.status(201).send(contract);
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al crear contrato' });
    }
  });

  app.get<{ Querystring: { page?: string; pageSize?: string } }>('/api/v1/contracts/public', async (req, reply) => {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
      const pageSize = Math.min(50, Math.max(5, parseInt(req.query.pageSize || '20', 10) || 20));
      const skip = (page - 1) * pageSize;
      const where = { signedAt: { not: null } as { not: null } };
      const [data, total] = await Promise.all([
        prisma.contract.findMany({ where, orderBy: { signedAt: 'desc' }, skip, take: pageSize, select: { id: true, status: true, amount: true, signedAt: true, tender: { select: { id: true, title: true } }, provider: { select: { id: true, name: true, identifier: true } } } }),
        prisma.contract.count({ where }),
      ]);
      return { data, total, page, pageSize };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al listar contratos públicos' });
    }
  });

  app.get<{ Querystring: { status?: string; page?: string; pageSize?: string } }>('/api/v1/contracts', async (req, reply) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'entity')) return reply.status(403).send({ error: 'Forbidden' });
      const q = req.query;
      const where: Prisma.ContractWhereInput = {};
      if (typeof q.status === 'string' && q.status.trim()) where.status = q.status.trim();
      const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
      const pageSize = Math.min(50, Math.max(5, parseInt(q.pageSize || '20', 10) || 20));
      const skip = (page - 1) * pageSize;
      const [data, total] = await Promise.all([
        prisma.contract.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize, select: { id: true, status: true, amount: true, signedAt: true, contractNo: true, tender: { select: { id: true, title: true } }, provider: { select: { id: true, name: true, identifier: true } } } }),
        prisma.contract.count({ where }),
      ]);
      return { data, total, page, pageSize };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al listar contratos' });
    }
  });

  app.put<{ Params: { id: string }; Body: ContractUpdateBody }>('/api/v1/contracts/:id', async (req, reply) => {
    const { id } = req.params;
    const body = (req.body as ContractUpdateBody) || {};
    try {
      const existing = await prisma.contract.findUnique({ where: { id }, select: { administratorDesignatedAt: true } });
      if (!existing) return reply.status(404).send({ error: 'Contrato no encontrado' });
      const data: Prisma.ContractUpdateInput = {};
      if (typeof body.status === 'string' && body.status.trim()) data.status = body.status.trim();
      if (typeof body.amount === 'number') data.amount = body.amount;
      if (typeof body.administratorName === 'string') data.administratorName = body.administratorName.trim() || null;
      if (typeof body.administratorEmail === 'string') data.administratorEmail = body.administratorEmail.trim() || null;
      if ((body.administratorName !== undefined || body.administratorEmail !== undefined) && !existing.administratorDesignatedAt) data.administratorDesignatedAt = new Date();
      if (typeof body.administratorObjectionReason === 'string' && body.administratorObjectionReason.trim()) {
        if (!existing.administratorDesignatedAt) return reply.status(400).send({ error: 'No hay administrador designado' });
        if (Date.now() - existing.administratorDesignatedAt.getTime() > 3 * 24 * 60 * 60 * 1000) return reply.status(400).send({ error: 'Plazo 3 días vencido' });
        data.administratorObjectionAt = new Date(); data.administratorObjectionReason = body.administratorObjectionReason.trim();
      }
      const updated = await prisma.contract.update({ where: { id }, data });
      return updated;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al actualizar contrato' });
    }
  });

  app.get<{ Params: { id: string } }>('/api/v1/contracts/:id/payments', async (req, reply) => {
    try {
      const data = await prisma.contractPayment.findMany({ where: { contractId: req.params.id }, orderBy: [{ sequenceNo: 'asc' }] });
      return { data };
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error al listar pagos' }); }
  });

  app.post<{ Params: { id: string }; Body: ContractPaymentBody }>('/api/v1/contracts/:id/payments', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
    const { id } = req.params;
    const body = req.body as ContractPaymentBody;
    if (!Number.isInteger(body.sequenceNo) || body.amount <= 0) return reply.status(400).send({ error: 'Obligatorios: sequenceNo, amount' });
    try {
      const payment = await prisma.contractPayment.create({
        data: { contractId: id, sequenceNo: body.sequenceNo, amount: body.amount, status: body.status || 'planned', dueDate: body.dueDate ? new Date(body.dueDate) : undefined }
      });
      return reply.status(201).send(payment);
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error al crear pago' }); }
  });

  app.patch<{ Params: { paymentId: string }; Body: ContractPaymentUpdateBody }>('/api/v1/contract-payments/:paymentId', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
    const { paymentId } = req.params;
    const body = (req.body as ContractPaymentUpdateBody) || {};
    const data: Prisma.ContractPaymentUpdateInput = {};
    if (body.status) data.status = body.status;
    if (body.amount) data.amount = body.amount;
    if (body.dueDate) data.dueDate = new Date(body.dueDate);
    if (body.paidAt) data.paidAt = new Date(body.paidAt);
    try {
      return await prisma.contractPayment.update({ where: { id: paymentId }, data });
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error al actualizar pago' }); }
  });
};
