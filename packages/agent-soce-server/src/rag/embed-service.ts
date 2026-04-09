import { Ollama } from 'ollama';
import type { LLMProvider } from '../llm/types.js';

type PrismaLike = {
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>;
};

export const KNOWN_DIMS: Record<string, number> = {
  'nomic-embed-text': 768,
  'mxbai-embed-large': 1024,
  'all-minilm': 384,
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-004': 768,
};

export interface EmbeddingProvider {
  id: string;
  model: string;
  dimensions: number;
  embedText(text: string): Promise<number[]>;
}

export interface RAGConfigLike {
  embeddingProviderId?: string | null;
  embeddingModel?: string;
  embeddingDims?: number;
}

interface LLMRouterLike {
  getProvider(id?: string): LLMProvider;
}

const BATCH_SIZE = 5;

/**
 * Resolves the correct embedding provider based on AgentRAGConfig.
 * If embeddingProviderId is set, uses that LLMProvider's embed().
 * Otherwise falls back to Ollama local embedding.
 */
export function getEmbeddingProvider(
  router: LLMRouterLike | null,
  ragConfig: RAGConfigLike | null,
): EmbeddingProvider {
  const model = ragConfig?.embeddingModel ?? 'nomic-embed-text';
  const dims = ragConfig?.embeddingDims ?? KNOWN_DIMS[model] ?? 768;
  const providerId = ragConfig?.embeddingProviderId;

  if (providerId && router) {
    const llmProvider = router.getProvider(providerId);
    return {
      id: llmProvider.id,
      model,
      dimensions: dims,
      embedText: (text: string) => llmProvider.embed(text),
    };
  }

  // Fallback: Ollama local embedding
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  const ollama = new Ollama({ host: ollamaUrl });

  return {
    id: 'ollama-local',
    model,
    dimensions: dims,
    embedText: async (text: string) => {
      const res = await ollama.embeddings({ model, prompt: text });
      return res.embedding;
    },
  };
}

/**
 * Embed all AgentRagChunk rows with NULL embedding using the given provider.
 */
export async function embedChunks(
  provider: EmbeddingProvider,
  prisma: PrismaLike,
  opts?: { documentId?: string; onProgress?: (done: number, total: number) => void },
): Promise<{ embedded: number; total: number }> {
  const whereClause = opts?.documentId
    ? `WHERE embedding IS NULL AND "documentId" = '${opts.documentId}'`
    : `WHERE embedding IS NULL`;

  const rows = await prisma.$queryRawUnsafe<{ id: string; title: string; content: string }[]>(
    `SELECT id, title, content FROM "AgentRagChunk" ${whereClause} ORDER BY "createdAt"`,
  );

  if (rows.length === 0) return { embedded: 0, total: 0 };

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (row) => {
        const text = `${row.title}\n${row.content}`;
        try {
          const vec = await provider.embedText(text);
          const vecStr = `[${vec.join(',')}]`;
          await prisma.$executeRawUnsafe(
            `UPDATE "AgentRagChunk" SET embedding = $1::vector WHERE id = $2`,
            vecStr,
            row.id,
          );
          done++;
          opts?.onProgress?.(done, rows.length);
        } catch {
          // Non-fatal: skip this chunk, caller can retry
        }
      }),
    );
  }

  return { embedded: done, total: rows.length };
}

// ─── Legacy compat: keep getEmbedService for any remaining callers ──────────

export interface EmbedServiceConfig {
  ollamaUrl: string;
  model: string;
  batchSize?: number;
}

export class EmbedService {
  private provider: EmbeddingProvider;

  constructor(config: EmbedServiceConfig) {
    const ollama = new Ollama({ host: config.ollamaUrl });
    const model = config.model;
    this.provider = {
      id: 'ollama-legacy',
      model,
      dimensions: KNOWN_DIMS[model] ?? 768,
      embedText: async (text: string) => {
        const res = await ollama.embeddings({ model, prompt: text });
        return res.embedding;
      },
    };
  }

  async embedText(text: string): Promise<number[]> {
    return this.provider.embedText(text);
  }

  async embedChunks(
    prisma: PrismaLike,
    opts?: { documentId?: string; onProgress?: (done: number, total: number) => void },
  ): Promise<{ embedded: number; total: number }> {
    return embedChunks(this.provider, prisma, opts);
  }
}

let _instance: EmbedService | null = null;

export function getEmbedService(overrides?: Partial<EmbedServiceConfig>): EmbedService {
  if (!_instance || overrides) {
    _instance = new EmbedService({
      ollamaUrl: overrides?.ollamaUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
      model: overrides?.model ?? process.env.AGENT_SOCE_EMBEDDING_MODEL ?? 'nomic-embed-text',
      batchSize: overrides?.batchSize,
    });
  }
  return _instance;
}
