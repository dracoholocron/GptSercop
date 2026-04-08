import type { FastifyPluginAsync } from 'fastify';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import configRoutes from './routes/config.js';
import streamRoutes from './routes/stream.js';
import loginRoutes from './routes/login.js';
import { prisma } from './db/client.js';

const agentSocePlugin: FastifyPluginAsync = async (fastify) => {
  // Public: authentication (no JWT required)
  await fastify.register(loginRoutes, { prefix: '/auth' });

  // Public: list active LLM providers for the widget selector (no API keys exposed)
  fastify.get('/providers', async () => {
    const providers = await prisma.agentLLMProvider.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, model: true, isDefault: true },
      orderBy: { name: 'asc' },
    });
    return providers;
  });

  // Protected routes
  await fastify.register(chatRoutes, { prefix: '/chat' });
  await fastify.register(adminRoutes, { prefix: '/admin' });
  await fastify.register(configRoutes, { prefix: '/config' });
  await fastify.register(streamRoutes, { prefix: '/stream' });
};

export default agentSocePlugin;
export { agentSocePlugin };
