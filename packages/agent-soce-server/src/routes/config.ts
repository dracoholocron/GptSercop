import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from './auth.js';
import { prisma } from '../db/client.js';

const configRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAdmin);

  // ─── LLM Providers ───────────────────────────────────────

  fastify.get('/llm-providers', async () => {
    const providers = await prisma.agentLLMProvider.findMany({ orderBy: { name: 'asc' } });
    return providers.map((p: { apiKey?: string | null; [key: string]: unknown }) => ({ ...p, apiKey: p.apiKey ? '***' : null }));
  });

  fastify.post<{ Body: { name: string; type: string; model: string; apiKey?: string; baseUrl?: string; isDefault?: boolean; maxTokens?: number; temperature?: number; metadata?: Record<string, unknown> } }>(
    '/llm-providers',
    async (request) => {
      return prisma.agentLLMProvider.create({ data: request.body as Parameters<typeof prisma.agentLLMProvider.create>[0]['data'] });
    },
  );

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/llm-providers/:id',
    async (request) => {
      return prisma.agentLLMProvider.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  fastify.post<{ Params: { id: string } }>('/llm-providers/:id/test', async (request) => {
    const provider = await prisma.agentLLMProvider.findUnique({ where: { id: request.params.id } });
    if (!provider) return { ok: false, error: 'Provider not found' };

    const { LLMRouter } = await import('../llm/router.js');
    const router = LLMRouter.fromConfig([provider as unknown as Parameters<typeof LLMRouter.fromConfig>[0][0]]);
    try {
      const ok = await router.healthCheck(provider.id);
      return { ok, provider: provider.name };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // ─── RAG Config ──────────────────────────────────────────

  fastify.get('/rag', async () => {
    return prisma.agentRAGConfig.findFirst() ?? {};
  });

  fastify.put<{ Body: { embeddingModel?: string; embeddingDims?: number; chunkSize?: number; chunkOverlap?: number; searchWeight?: unknown; rerankerEnabled?: boolean } }>(
    '/rag',
    async (request) => {
      const existing = await prisma.agentRAGConfig.findFirst();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = request.body as any;
      if (existing) {
        return prisma.agentRAGConfig.update({ where: { id: existing.id }, data: body });
      }
      return prisma.agentRAGConfig.create({ data: body });
    },
  );

  fastify.post('/rag/reindex', async () => {
    // Placeholder for reindexing pipeline
    return { status: 'reindex_queued', message: 'Reindexing will begin shortly' };
  });

  // ─── Vector DB Config ────────────────────────────────────

  fastify.get('/vector', async () => {
    return { indexType: 'ivfflat', lists: 100, status: 'active' };
  });

  fastify.post('/vector/rebuild-index', async () => {
    try {
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS idx_agent_rag_chunk_embedding ON "AgentRagChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`,
      );
      return { ok: true, message: 'Index rebuilt' };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // ─── Graph Config ────────────────────────────────────────

  fastify.get('/graph', async () => {
    return prisma.agentGraphConfig.findFirst() ?? {};
  });

  fastify.put<{ Body: { graphName?: string; syncEnabled?: boolean; syncCron?: string } }>(
    '/graph',
    async (request) => {
      const existing = await prisma.agentGraphConfig.findFirst();
      if (existing) {
        return prisma.agentGraphConfig.update({
          where: { id: existing.id },
          data: request.body,
        });
      }
      return prisma.agentGraphConfig.create({ data: request.body });
    },
  );

  fastify.post('/graph/sync', async () => {
    return { status: 'sync_queued', message: 'Graph sync will begin shortly' };
  });

  // ─── Theme Config ────────────────────────────────────────

  fastify.get('/theme', async () => {
    const active = await prisma.agentThemeConfig.findFirst({ where: { isActive: true } });
    return active ?? prisma.agentThemeConfig.findFirst();
  });

  fastify.get('/themes', async () => {
    return prisma.agentThemeConfig.findMany({ orderBy: { name: 'asc' } });
  });

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/theme/:id',
    async (request) => {
      if (request.body.isActive) {
        await prisma.agentThemeConfig.updateMany({ data: { isActive: false } });
      }
      return prisma.agentThemeConfig.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  fastify.post<{ Body: { name: string } & Record<string, unknown> }>(
    '/theme',
    async (request) => {
      return prisma.agentThemeConfig.create({ data: request.body });
    },
  );

  // ─── General Config ──────────────────────────────────────

  fastify.get('/general', async () => {
    return prisma.agentGeneralConfig.findFirst() ?? {};
  });

  fastify.put<{ Body: Record<string, unknown> }>(
    '/general',
    async (request) => {
      const existing = await prisma.agentGeneralConfig.findFirst();
      if (existing) {
        return prisma.agentGeneralConfig.update({
          where: { id: existing.id },
          data: request.body,
        });
      }
      return prisma.agentGeneralConfig.create({ data: request.body });
    },
  );
};

export default configRoutes;
