import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, getAgentUser } from './auth.js';

const streamRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAuth);

  fastify.get('/', async (request, reply) => {
    const user = getAgentUser(request)!;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Agent-User': user.sub,
    });

    const heartbeat = setInterval(() => {
      reply.raw.write(`: heartbeat\n\n`);
    }, 15_000);

    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', userId: user.sub })}\n\n`);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
    });
  });
};

export default streamRoutes;
