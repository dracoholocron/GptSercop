import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';

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

export const awardsRoutes: FastifyPluginAsync = async (app) => {
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
      await audit({ action: 'contract.declare_failed_awardee', entityType: 'Contract', entityId: contractId, payload: { providerId: contract.providerId } });
      return reply.status(200).send({ ok: true, bidId: bid?.id, sanctionedUntil });
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al declarar adjudicatario fallido' });
    }
  });
};
