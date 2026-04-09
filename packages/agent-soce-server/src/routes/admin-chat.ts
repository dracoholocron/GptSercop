import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from './auth.js';
import { prisma } from '../db/client.js';
import { LLMRouter } from '../llm/router.js';
import { getEmbeddingProvider } from '../rag/embed-service.js';
import { searchRag } from '../rag/search.js';
import type { SearchWeights } from '../rag/hybrid-search.js';
import type { ChatMessage } from '../types/index.js';
import type { AgentLLMProviderRecord } from '../types/index.js';

async function buildRouter(): Promise<LLMRouter> {
  const providers = await prisma.agentLLMProvider.findMany({ where: { isActive: true } });
  return LLMRouter.fromConfig(providers as unknown as AgentLLMProviderRecord[]);
}

const adminChatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAdmin);

  // ─── Folders CRUD ──────────────────────────────────────

  fastify.get('/folders', async () => {
    return prisma.adminChatFolder.findMany({
      include: { _count: { select: { chats: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  });

  fastify.post<{ Body: { name: string; icon?: string; color?: string } }>(
    '/folders',
    async (request, reply) => {
      const { name, icon, color } = request.body;
      if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });
      return prisma.adminChatFolder.create({
        data: { name: name.trim(), icon: icon ?? 'folder', color: color ?? '#0073E6' },
      });
    },
  );

  fastify.put<{
    Params: { id: string };
    Body: { name?: string; icon?: string; color?: string; sortOrder?: number };
  }>('/folders/:id', async (request) => {
    const data: Record<string, unknown> = {};
    const { name, icon, color, sortOrder } = request.body;
    if (name !== undefined) data.name = name.trim();
    if (icon !== undefined) data.icon = icon;
    if (color !== undefined) data.color = color;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    return prisma.adminChatFolder.update({ where: { id: request.params.id }, data });
  });

  fastify.delete<{ Params: { id: string } }>('/folders/:id', async (request, reply) => {
    await prisma.adminChatFolder.delete({ where: { id: request.params.id } });
    return reply.code(204).send();
  });

  // ─── Conversations CRUD ────────────────────────────────

  fastify.get<{
    Querystring: { search?: string; folderId?: string; limit?: string };
  }>('/conversations', async (request) => {
    const { search, folderId, limit } = request.query;
    const take = Math.min(Number(limit) || 50, 200);

    const where: Record<string, unknown> = {};
    if (folderId) where.folderId = folderId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return prisma.adminChat.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true, icon: true, color: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, role: true, createdAt: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });
  });

  fastify.post<{
    Body: { title?: string; folderId?: string; catalogIds?: string[]; providerId?: string; systemPrompt?: string };
  }>('/conversations', async (request) => {
    const { title, folderId, catalogIds, providerId, systemPrompt } = request.body;
    return prisma.adminChat.create({
      data: {
        title: title?.trim() || 'Nueva conversacion',
        folderId: folderId || null,
        catalogIds: catalogIds ?? [],
        providerId: providerId || null,
        systemPrompt: systemPrompt || null,
      },
    });
  });

  fastify.get<{ Params: { id: string } }>('/conversations/:id', async (request, reply) => {
    const chat = await prisma.adminChat.findUnique({
      where: { id: request.params.id },
      include: {
        folder: { select: { id: true, name: true, icon: true, color: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!chat) return reply.code(404).send({ error: 'Chat not found' });
    return chat;
  });

  fastify.put<{
    Params: { id: string };
    Body: { title?: string; isPinned?: boolean; folderId?: string | null; catalogIds?: string[]; providerId?: string | null; systemPrompt?: string | null };
  }>('/conversations/:id', async (request) => {
    const data: Record<string, unknown> = {};
    const { title, isPinned, folderId, catalogIds, providerId, systemPrompt } = request.body;
    if (title !== undefined) data.title = title.trim();
    if (isPinned !== undefined) data.isPinned = isPinned;
    if (folderId !== undefined) data.folderId = folderId;
    if (catalogIds !== undefined) data.catalogIds = catalogIds;
    if (providerId !== undefined) data.providerId = providerId;
    if (systemPrompt !== undefined) data.systemPrompt = systemPrompt;
    return prisma.adminChat.update({ where: { id: request.params.id }, data });
  });

  fastify.delete<{ Params: { id: string } }>('/conversations/:id', async (request, reply) => {
    await prisma.adminChat.delete({ where: { id: request.params.id } });
    return reply.code(204).send();
  });

  // ─── Send Message (streaming SSE) ─────────────────────

  fastify.post<{ Params: { id: string }; Body: { content: string } }>(
    '/conversations/:id/messages',
    async (request, reply) => {
      const chat = await prisma.adminChat.findUnique({ where: { id: request.params.id } });
      if (!chat) return reply.code(404).send({ error: 'Chat not found' });

      const { content } = request.body;
      if (!content?.trim()) return reply.code(400).send({ error: 'content is required' });

      const start = Date.now();

      // Persist user message
      await prisma.adminChatMessage.create({
        data: { chatId: chat.id, role: 'user', content: content.trim() },
      });

      // Load full conversation history
      const allMessages = await prisma.adminChatMessage.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
      });

      const messages: ChatMessage[] = allMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      // SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      let assistantContent = '';
      let ragChunks: Array<{ id: string; title: string; source: string; score: number; snippet: string | null }> = [];
      let usedProvider = '';
      let usedModel = '';

      try {
        const router = await buildRouter();
        const provider = chat.providerId
          ? (() => { try { return router.getProvider(chat.providerId!); } catch { return router.getProvider(); } })()
          : router.getProvider();

        usedProvider = (provider as unknown as { id?: string }).id ?? chat.providerId ?? '';
        usedModel = (provider as unknown as { model?: string }).model ?? '';

        const ragConfig = await prisma.agentRAGConfig.findFirst();
        const embProvider = getEmbeddingProvider(router, ragConfig);

        // RAG search scoped to the chat's catalogIds
        const lastUserMsg = content.trim();
        let ragContext = '';
        try {
          let weights: SearchWeights | undefined;
          if (ragConfig?.searchWeight && typeof ragConfig.searchWeight === 'object') {
            const w = ragConfig.searchWeight as { semantic?: number; keyword?: number };
            if (w.semantic !== undefined && w.keyword !== undefined) {
              weights = { semantic: w.semantic, keyword: w.keyword };
            }
          }
          const embedding = await embProvider.embedText(lastUserMsg);
          const chunks = await searchRag(
            prisma as unknown as Parameters<typeof searchRag>[0],
            lastUserMsg,
            embedding,
            5,
            weights,
            chat.catalogIds.length > 0 ? chat.catalogIds : undefined,
          );
          ragChunks = chunks;
          if (chunks.length > 0) {
            ragContext = '\n\nContexto relevante (documentos):\n' +
              chunks.map((c) => `[${c.source}] ${c.title}: ${c.snippet}`).join('\n');
          }
        } catch {
          // RAG failure is non-fatal
        }

        // Emit RAG sources before streaming text
        if (ragChunks.length > 0) {
          reply.raw.write(`data: ${JSON.stringify({ type: 'rag_sources', data: ragChunks })}\n\n`);
        }

        // Build prompt with system prompt + RAG context
        const systemPrompt = buildPlaygroundSystemPrompt(chat.systemPrompt, ragContext);
        const enriched: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          ...messages,
        ];

        const llmStream = provider.chat(enriched, {});

        for await (const chunk of llmStream) {
          const event = { type: 'text', data: chunk };
          reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
          assistantContent += String(chunk);
        }
      } catch (err) {
        const errorEvent = { type: 'error', data: 'Error al procesar la consulta.' };
        reply.raw.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        fastify.log.error(err, 'Admin chat error');
      }

      const latencyMs = Date.now() - start;

      // Persist assistant message
      if (assistantContent) {
        await prisma.adminChatMessage.create({
          data: {
            chatId: chat.id,
            role: 'assistant',
            content: assistantContent,
            ragChunksUsed: ragChunks.length > 0 ? ragChunks : undefined,
            providerId: usedProvider || null,
            model: usedModel || null,
            latencyMs,
          },
        });
      }

      // Auto-generate title from first user message
      const msgCount = await prisma.adminChatMessage.count({ where: { chatId: chat.id, role: 'user' } });
      if (msgCount === 1) {
        const shortTitle = content.trim().slice(0, 50) + (content.trim().length > 50 ? '...' : '');
        prisma.adminChat.update({ where: { id: chat.id }, data: { title: shortTitle } }).catch(() => {});
      }

      // Touch the chat's updatedAt
      prisma.adminChat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } }).catch(() => {});

      reply.raw.write(`data: ${JSON.stringify({ type: 'done', data: null })}\n\n`);
      reply.raw.end();
    },
  );

  // ─── Message Feedback ──────────────────────────────────

  fastify.patch<{ Params: { id: string }; Body: { rating: number } }>(
    '/messages/:id/feedback',
    async (request, reply) => {
      const { rating } = request.body;
      if (rating !== 1 && rating !== -1) return reply.code(400).send({ error: 'Rating must be 1 or -1' });
      await prisma.adminChatMessage.update({
        where: { id: request.params.id },
        data: { feedbackRating: rating },
      });
      return { ok: true };
    },
  );

  // ─── Search ────────────────────────────────────────────

  fastify.get<{ Querystring: { q?: string; limit?: string } }>(
    '/search',
    async (request) => {
      const { q, limit } = request.query;
      if (!q?.trim()) return [];
      const take = Math.min(Number(limit) || 20, 100);

      const messages = await prisma.adminChatMessage.findMany({
        where: { content: { contains: q.trim(), mode: 'insensitive' } },
        include: { chat: { select: { id: true, title: true, folderId: true } } },
        orderBy: { createdAt: 'desc' },
        take,
      });

      return messages;
    },
  );
};

function buildPlaygroundSystemPrompt(customPrompt: string | null, ragContext: string): string {
  const base = customPrompt?.trim() ||
    `Eres Agent SOCE, asistente inteligente del Sistema Nacional de Contratacion Publica del Ecuador (SERCOP). Ayudas a usuarios con procesos de contratacion, normativa vigente, gestion de proveedores y entidades.

Responde en español, de forma clara y concisa. Cuando cites normativa, indica la fuente.

REGLA IMPORTANTE: Si el contexto RAG contiene informacion relevante, usala para responder. Cita las fuentes cuando sea posible.`;

  return base + ragContext;
}

export default adminChatRoutes;
