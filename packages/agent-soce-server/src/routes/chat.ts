import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, getAgentUser } from './auth.js';
import { prisma } from '../db/client.js';
import { logInteraction, updateFeedback } from '../telemetry/audit.js';
import type { ChatMessage, UIContext } from '../types/index.js';

interface ChatBody {
  messages: ChatMessage[];
  context?: UIContext;
  sessionId?: string;
}

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAuth);

  fastify.post<{ Body: ChatBody }>('/', async (request, reply) => {
    const user = getAgentUser(request)!;
    const { messages, context, sessionId } = request.body;

    if (!messages?.length) {
      return reply.code(400).send({ error: 'messages array is required' });
    }

    const sid = sessionId ?? crypto.randomUUID();
    const start = Date.now();

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const lastMsg = messages[messages.length - 1];
    await logInteraction(prisma as unknown as Parameters<typeof logInteraction>[0], {
      sessionId: sid,
      userId: user.sub,
      messageRole: lastMsg.role,
      content: lastMsg.content,
      screenContext: context?.route,
    });

    // Stream a basic echo response for now (orchestrator integration in Phase 1A completion)
    const responseText = `Entendido. Has preguntado: "${lastMsg.content}". El sistema Agent SOCE está procesando tu solicitud.`;

    reply.raw.write(`data: ${JSON.stringify({ type: 'text', data: responseText })}\n\n`);

    const latencyMs = Date.now() - start;
    await logInteraction(prisma as unknown as Parameters<typeof logInteraction>[0], {
      sessionId: sid,
      userId: user.sub,
      messageRole: 'assistant',
      content: responseText,
      latencyMs,
    });

    reply.raw.write(`data: ${JSON.stringify({ type: 'done', data: null })}\n\n`);
    reply.raw.end();
  });

  fastify.patch<{ Params: { id: string }; Body: { rating: number; text?: string } }>(
    '/interactions/:id/feedback',
    async (request, reply) => {
      const { id } = request.params;
      const { rating, text } = request.body;

      if (!rating || rating < 1 || rating > 5) {
        return reply.code(400).send({ error: 'Rating must be 1-5' });
      }

      await updateFeedback(
        prisma as unknown as Parameters<typeof updateFeedback>[0],
        id,
        rating,
        text,
      );

      return { ok: true };
    },
  );
};

export default chatRoutes;
