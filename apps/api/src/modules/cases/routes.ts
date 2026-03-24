import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import { Prisma } from '@prisma/client';

type ComplaintBody = { tenderId?: string; entityId?: string; providerId?: string; channel: string; category: string; summary: string; details?: string; contactEmail?: string; contactPhone?: string; };
type ProcessClaimBody = { tenderId: string; providerId: string; kind: string; subject: string; message: string; };
type ComplaintUpdateBody = { status?: string; category?: string };
type ProcessClaimUpdateBody = { status?: string; response?: string };
type TenderClarificationCreateBody = { question: string; askedByProviderId?: string };
type TenderClarificationAnswerBody = { answer: string };
type ClarificationRespondBody = { response: string };

export const casesRoutes: FastifyPluginAsync = async (app) => {
  // Complaints
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
          channel, category, summary,
          details: typeof body?.details === 'string' && body.details.trim() ? body.details.trim() : undefined,
          contactEmail: typeof body?.contactEmail === 'string' && body.contactEmail.trim() ? body.contactEmail.trim() : undefined,
          contactPhone: typeof body?.contactPhone === 'string' && body.contactPhone.trim() ? body.contactPhone.trim() : undefined,
        },
      });
      await audit({ action: 'complaint.create', entityType: 'Complaint', entityId: complaint.id, payload: { tenderId: complaint.tenderId } });
      return reply.status(201).send(complaint);
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al registrar denuncia' });
    }
  });

  app.get<{ Querystring: { tenderId?: string; entityId?: string; providerId?: string; status?: string } }>('/api/v1/complaints', async (req, reply) => {
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
  });

  app.patch<{ Params: { id: string }; Body: ComplaintUpdateBody }>('/api/v1/complaints/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
    const { id } = req.params;
    const body = (req.body as ComplaintUpdateBody) || {};
    const data: Prisma.ComplaintUpdateInput = {};
    if (typeof body.status === 'string' && body.status.trim()) data.status = body.status.trim();
    if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
    if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });
    try {
      const updated = await prisma.complaint.update({ where: { id }, data });
      return updated;
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error actualizar denuncia' }); }
  });

  // Process Claims
  app.post<{ Body: ProcessClaimBody }>('/api/v1/process-claims', async (req, reply) => {
    if (req.user?.role !== 'supplier') return reply.status(403).send({ error: 'Forbidden' });
    const body = req.body as ProcessClaimBody;
    if (!body.tenderId || !body.providerId || !body.kind || !body.subject || !body.message) return reply.status(400).send({ error: 'Campos obligatorios faltantes' });
    try {
      const tender = await prisma.tender.findUnique({ where: { id: body.tenderId }, select: { id: true, claimWindowDays: true, bidsOpenedAt: true, bidsDeadlineAt: true } });
      if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
      const windowDays = tender.claimWindowDays ?? 3;
      const finEtapa = tender.bidsOpenedAt ?? tender.bidsDeadlineAt ?? null;
      if (finEtapa && new Date() > new Date(finEtapa.getTime() + windowDays * 24 * 60 * 60 * 1000))
        return reply.status(400).send({ error: `Plazo reclamos (${windowDays} días) vencido.` });
      const claim = await prisma.processClaim.create({ data: { tenderId: body.tenderId, providerId: body.providerId, kind: body.kind, subject: body.subject, message: body.message, status: 'OPEN' } });
      return reply.status(201).send(claim);
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error registrar reclamo' }); }
  });

  app.get<{ Querystring: { tenderId?: string; providerId?: string; status?: string } }>('/api/v1/process-claims', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
    try {
      const where: Prisma.ProcessClaimWhereInput = {};
      if (req.query.tenderId) where.tenderId = req.query.tenderId.trim();
      if (req.query.providerId) where.providerId = req.query.providerId.trim();
      if (req.query.status) where.status = req.query.status.trim();
      const data = await prisma.processClaim.findMany({ where, orderBy: { createdAt: 'desc' }, include: { tender: { select: { id: true, title: true, status: true } }, provider: { select: { id: true, name: true, identifier: true } } } });
      return { data };
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error listar reclamos' }); }
  });

  app.patch<{ Params: { id: string }; Body: ProcessClaimUpdateBody }>('/api/v1/process-claims/:id', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
    const { id } = req.params;
    const body = req.body as ProcessClaimUpdateBody;
    const data: Prisma.ProcessClaimUpdateInput = {};
    if (body.status) data.status = body.status;
    if (body.response) data.response = body.response;
    try {
      return await prisma.processClaim.update({ where: { id }, data });
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error actualizar reclamo' }); }
  });

  // Tender Clarifications
  app.get<{ Params: { id: string } }>('/api/v1/tenders/:id/clarifications', async (req, reply) => {
    try {
      const data = await prisma.tenderClarification.findMany({ where: { tenderId: req.params.id }, orderBy: { askedAt: 'desc' }, include: { askedByProvider: { select: { id: true, name: true, identifier: true } } } });
      return { data };
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error listar aclaraciones proceso' }); }
  });

  app.post<{ Params: { id: string }; Body: TenderClarificationCreateBody }>('/api/v1/tenders/:id/clarifications', async (req, reply) => {
    const tenderId = req.params.id;
    const body = req.body as TenderClarificationCreateBody;
    if (!body.question) return reply.status(400).send({ error: 'question obligatorio' });
    try {
      const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
      if (!tender) return reply.status(404).send({ error: 'Proceso no encontrado' });
      if (tender.status !== 'published') return reply.status(400).send({ error: 'Solo en procesos publicados' });
      const clarification = await prisma.tenderClarification.create({ data: { tenderId, question: body.question, askedByProviderId: body.askedByProviderId, status: 'OPEN' } });
      return reply.status(201).send(clarification);
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error registrar pregunta' }); }
  });

  app.patch<{ Params: { clarificationId: string }; Body: TenderClarificationAnswerBody }>('/api/v1/tender-clarifications/:clarificationId', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
    const answer = typeof req.body.answer === 'string' ? req.body.answer.trim() : '';
    if (!answer) return reply.status(400).send({ error: 'answer obligatorio' });
    try {
      return await prisma.tenderClarification.update({ where: { id: req.params.clarificationId }, data: { answer, answeredAt: new Date(), status: 'ANSWERED' } });
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error responder aclaración' }); }
  });

  // Offer Clarifications
  app.get<{ Params: { id: string } }>('/api/v1/offers/:id/clarifications', async (req, reply) => {
    try {
      const data = await prisma.offerClarification.findMany({ where: { offerId: req.params.id }, orderBy: { requestedAt: 'desc' } });
      return { data };
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error listar aclaraciones' }); }
  });

  app.post<{ Params: { id: string }; Body: { subject: string; message: string } }>('/api/v1/offers/:id/clarifications', async (req, reply) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'entity') return reply.status(403).send({ error: 'Forbidden' });
    const { id } = req.params;
    const { subject, message } = req.body;
    if (!subject || !message) return reply.status(400).send({ error: 'subject y message obligatorios' });
    try {
      const c = await prisma.offerClarification.create({ data: { offerId: id, subject, message, status: 'OPEN' } });
      await prisma.offer.update({ where: { id }, data: { status: 'clarification_requested' } });
      return reply.status(201).send(c);
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error solicitar aclaración' }); }
  });

  app.post<{ Params: { clarificationId: string; id: string }; Body: ClarificationRespondBody }>('/api/v1/offers/:id/clarifications/:clarificationId/respond', async (req, reply) => {
    const { clarificationId, id } = req.params;
    const response = req.body?.response?.trim();
    if (!response) return reply.status(400).send({ error: 'response obligatorio' });
    try {
      const updated = await prisma.offerClarification.update({ where: { id: clarificationId }, data: { response, status: 'RESPONDED', respondedAt: new Date() } });
      await prisma.offer.update({ where: { id }, data: { status: 'clarified' } });
      return updated;
    } catch (e) { req.log.error(e); return reply.status(500).send({ error: 'Error responder' }); }
  });
};
