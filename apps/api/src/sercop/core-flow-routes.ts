import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  GptAnalysisAdapter,
  PrismaProcessRepository,
  UnifiedSercopCoreFlowService,
  type UnifiedCoreFlowInput,
} from './core-flow.js';

const service = new UnifiedSercopCoreFlowService(
  new PrismaProcessRepository(prisma),
  new GptAnalysisAdapter(),
);

type CoreFlowBody = UnifiedCoreFlowInput;

export async function registerCoreFlowRoutes(app: FastifyInstance) {
  app.post<{ Body: CoreFlowBody }>('/api/v1/sercop/core-flow/analyze', async (req, reply) => {
    const body = (req.body || {}) as CoreFlowBody;

    const hasQuery = typeof body.query === 'string' && body.query.trim().length > 0;
    const hasProcessId = typeof body.processId === 'string' && body.processId.trim().length > 0;

    if (!hasQuery && !hasProcessId) {
      return reply.status(400).send({ error: 'Debe enviar query o processId.' });
    }

    const result = await service.run(body);
    return reply.status(200).send(result);
  });
}
