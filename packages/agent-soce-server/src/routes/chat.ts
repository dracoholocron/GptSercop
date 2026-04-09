import type { FastifyPluginAsync } from 'fastify';
import { requireAuth, getAgentUser } from './auth.js';
import { prisma } from '../db/client.js';
import { logInteraction, updateFeedback } from '../telemetry/audit.js';
import type { ChatMessage, UIContext } from '../types/index.js';
import { LLMRouter } from '../llm/router.js';
import { orchestrate } from '../orchestrator/index.js';
import { getEmbeddingProvider } from '../rag/embed-service.js';
import { AGENT_TOOLS } from '../tools/definitions.js';
import { SERCOP_FLOWS } from '../manifest/sercop-manifest.js';

interface ChatBody {
  messages: ChatMessage[];
  context?: UIContext;
  sessionId?: string;
  providerId?: string;
}

// LLM router is initialised once per process from the DB config.
// We use a lazy singleton so it's ready after the first request.
let llmRouterCache: LLMRouter | null = null;

async function getLLMRouter(): Promise<LLMRouter> {
  if (llmRouterCache) return llmRouterCache;
  const providers = await prisma.agentLLMProvider.findMany({ where: { isActive: true } });
  llmRouterCache = LLMRouter.fromConfig(providers as Parameters<typeof LLMRouter.fromConfig>[0]);
  return llmRouterCache;
}

// Flow map built once from the SERCOP manifest
const FLOW_MAP = new Map(SERCOP_FLOWS.map((f) => [f.id, f]));

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAuth);

  fastify.post<{ Body: ChatBody }>('/', async (request, reply) => {
    const user = getAgentUser(request)!;
    const { messages, context, sessionId, providerId } = request.body;

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

    // Log user turn
    await logInteraction(prisma as unknown as Parameters<typeof logInteraction>[0], {
      sessionId: sid,
      userId: user.sub,
      messageRole: lastMsg.role,
      content: lastMsg.content,
      screenContext: context?.route,
    });

    let assistantContent = '';

    try {
      const router = await getLLMRouter();
      // Resolve the chat provider: use requested one or fallback to default
      const provider = providerId ? (() => {
        try { return router.getProvider(providerId); } catch { return router.getProvider(); }
      })() : router.getProvider();

      // Resolve the embedding provider from RAG config (independent of chat provider)
      const ragConfig = await prisma.agentRAGConfig.findFirst();
      const embProvider = getEmbeddingProvider(router, ragConfig);

      const llm = {
        chat: provider.chat.bind(provider),
        embed: (text: string) => embProvider.embedText(text),
        getProvider: () => provider,
      } as unknown as Parameters<typeof orchestrate>[0]['llm'];

      const { stream } = await orchestrate(
        {
          llm,
          prisma: prisma as unknown as Parameters<typeof orchestrate>[0]['prisma'],
          embed: (text: string) => embProvider.embedText(text),
          tools: AGENT_TOOLS,
          flows: FLOW_MAP,
        },
        { messages, context, sessionId: sid },
      );

      for await (const event of stream) {
        // Skip orchestrator's own 'done' — we emit a single one after logging
        if (event.type === 'done') continue;
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === 'text') {
          assistantContent += String(event.data);
        }
      }
    } catch (err) {
      const errorEvent = { type: 'error', data: 'Error al procesar tu consulta. Por favor intenta de nuevo.' };
      reply.raw.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
      fastify.log.error(err, 'Orchestrator error');
    }

    // Log assistant turn
    const latencyMs = Date.now() - start;
    if (assistantContent) {
      await logInteraction(prisma as unknown as Parameters<typeof logInteraction>[0], {
        sessionId: sid,
        userId: user.sub,
        messageRole: 'assistant',
        content: assistantContent,
        latencyMs,
      });
    }

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
