import type { FastifyPluginAsync } from 'fastify';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import configRoutes from './routes/config.js';
import streamRoutes from './routes/stream.js';
import loginRoutes from './routes/login.js';

const agentSocePlugin: FastifyPluginAsync = async (fastify) => {
  // Public: authentication (no JWT required)
  await fastify.register(loginRoutes, { prefix: '/auth' });

  // Protected routes
  await fastify.register(chatRoutes, { prefix: '/chat' });
  await fastify.register(adminRoutes, { prefix: '/admin' });
  await fastify.register(configRoutes, { prefix: '/config' });
  await fastify.register(streamRoutes, { prefix: '/stream' });
};

export default agentSocePlugin;
export { agentSocePlugin };
