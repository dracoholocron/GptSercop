import type { FastifyPluginAsync } from 'fastify';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import configRoutes from './routes/config.js';
import streamRoutes from './routes/stream.js';
import loginRoutes from './routes/login.js';
import knowledgeRoutes from './routes/knowledge.js';
import adminChatRoutes from './routes/admin-chat.js';
import { prisma } from './db/client.js';

async function validateEmbeddingDimensions(log: { warn: (...args: unknown[]) => void }): Promise<void> {
  try {
    const ragConfig = await prisma.agentRAGConfig.findFirst();
    if (!ragConfig) return;

    const result = await prisma.$queryRawUnsafe<[{ dim: number | null }]>(
      `SELECT atttypmod AS dim FROM pg_attribute
       WHERE attrelid = '"AgentRagChunk"'::regclass
         AND attname = 'embedding'
         AND atttypmod > 0`,
    ).catch(() => [{ dim: null }]);

    const columnDim = result[0]?.dim;
    if (columnDim && columnDim !== ragConfig.embeddingDims) {
      log.warn(
        `[Agent SOCE] Embedding dimension mismatch: AgentRAGConfig.embeddingDims=${ragConfig.embeddingDims} but pgvector column is vector(${columnDim}). RAG search may produce incorrect results.`,
      );
    }
  } catch {
    // Non-fatal on startup
  }
}

const agentSocePlugin: FastifyPluginAsync = async (fastify) => {
  // Validate embedding dimensions on startup
  await validateEmbeddingDimensions(fastify.log);
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
  await fastify.register(knowledgeRoutes, { prefix: '/admin/knowledge' });
  await fastify.register(adminChatRoutes, { prefix: '/admin/chat' });
  await fastify.register(configRoutes, { prefix: '/config' });
  await fastify.register(streamRoutes, { prefix: '/stream' });
};

export default agentSocePlugin;
export { agentSocePlugin };
