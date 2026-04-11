import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from './auth.js';
import { prisma } from '../db/client.js';
import { KNOWN_DIMS, getEmbeddingProvider, embedChunks } from '../rag/embed-service.js';
import { LLMRouter } from '../llm/router.js';
import type { AgentLLMProviderRecord } from '../types/index.js';

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

  fastify.put<{
    Body: {
      embeddingProviderId?: string | null;
      embeddingModel?: string;
      embeddingDims?: number;
      chunkSize?: number;
      chunkOverlap?: number;
      searchWeight?: unknown;
      rerankerEnabled?: boolean;
    };
  }>('/rag', async (request) => {
    const existing = await prisma.agentRAGConfig.findFirst();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = { ...request.body };

    // Detect if the embedding model or provider is changing
    const modelChanged =
      (body.embeddingModel !== undefined && body.embeddingModel !== existing?.embeddingModel) ||
      (body.embeddingProviderId !== undefined && body.embeddingProviderId !== existing?.embeddingProviderId);

    // Auto-resolve dimensions from KNOWN_DIMS if model changed and dims not explicitly provided
    if (modelChanged && body.embeddingModel && body.embeddingDims === undefined) {
      const knownDim = KNOWN_DIMS[body.embeddingModel];
      if (knownDim) body.embeddingDims = knownDim;
    }

    let reindexRequired = false;

    const saved = existing
      ? await prisma.agentRAGConfig.update({ where: { id: existing.id }, data: body })
      : await prisma.agentRAGConfig.create({ data: body });

    if (modelChanged && saved.embeddingDims) {
      const newDims = saved.embeddingDims;
      try {
        // Alter the vector column to match new dimensions
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "AgentRagChunk" ALTER COLUMN embedding TYPE vector(${newDims}) USING NULL`,
        );
        // Nullify all existing embeddings (they're from the old model)
        await prisma.$executeRawUnsafe(
          `UPDATE "AgentRagChunk" SET embedding = NULL`,
        );
        // Rebuild the index for the new dimension
        await prisma.$executeRawUnsafe(
          `DROP INDEX IF EXISTS idx_agent_rag_chunk_embedding`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS idx_agent_rag_chunk_embedding ON "AgentRagChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`,
        );
      } catch (err) {
        fastify.log.error(err, 'Failed to migrate vector column dimensions');
      }
      reindexRequired = true;
    }

    return { ...saved, reindexRequired };
  });

  fastify.post('/rag/reindex', async () => {
    const ragConfig = await prisma.agentRAGConfig.findFirst();
    const providers = await prisma.agentLLMProvider.findMany({ where: { isActive: true } });
    const router = LLMRouter.fromConfig(providers as unknown as AgentLLMProviderRecord[]);
    const provider = getEmbeddingProvider(router, ragConfig);

    // Nullify all embeddings first so embedChunks picks them all up
    await prisma.$executeRawUnsafe(`UPDATE "AgentRagChunk" SET embedding = NULL`);

    // Run re-embedding in the background
    embedChunks(
      provider,
      prisma as unknown as Parameters<typeof embedChunks>[1],
    ).catch((err) => {
      console.error('[reindex] Background embedding failed:', err);
    });

    const total = await prisma.agentRagChunk.count();
    return {
      status: 'reindex_started',
      message: `Re-embedding ${total} chunks with ${provider.model} (${provider.dimensions}d)`,
      provider: provider.id,
      model: provider.model,
      dimensions: provider.dimensions,
      totalChunks: total,
    };
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
    const { triggerSync } = await import('../graph/scheduler.js');
    return triggerSync();
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
