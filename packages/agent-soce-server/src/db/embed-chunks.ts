/**
 * Generates and stores vector embeddings for all AgentRagChunk rows
 * that don't have an embedding yet.
 *
 * Uses nomic-embed-text via Ollama (must be running).
 *
 * Usage:
 *   node dist/db/embed-chunks.js
 *   or (dev):
 *   tsx src/db/embed-chunks.ts
 */
import { Ollama } from 'ollama';
import { PrismaClient } from '../generated/client/index.js';

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const EMBED_MODEL = process.env.AGENT_SOCE_EMBEDDING_MODEL ?? 'nomic-embed-text';
const BATCH_SIZE = 5;

const prisma = new PrismaClient();
const ollama = new Ollama({ host: OLLAMA_URL });

async function embedText(text: string): Promise<number[]> {
  const res = await ollama.embeddings({ model: EMBED_MODEL, prompt: text });
  return res.embedding;
}

async function main() {
  console.log(`🔢 Embedding RAG chunks with ${EMBED_MODEL} @ ${OLLAMA_URL}`);

  // Fetch chunks that have no embedding (raw SQL — Prisma doesn't expose vector)
  const rows = await prisma.$queryRawUnsafe<{ id: string; title: string; content: string }[]>(
    `SELECT id, title, content FROM "AgentRagChunk" WHERE embedding IS NULL ORDER BY "createdAt"`,
  );

  console.log(`  ${rows.length} chunks need embeddings`);
  if (rows.length === 0) {
    console.log('✅ All chunks already have embeddings.');
    return;
  }

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (row) => {
        const text = `${row.title}\n${row.content}`;
        try {
          const vec = await embedText(text);
          const vecStr = `[${vec.join(',')}]`;
          await prisma.$executeRawUnsafe(
            `UPDATE "AgentRagChunk" SET embedding = $1::vector WHERE id = $2`,
            vecStr,
            row.id,
          );
          done++;
          process.stdout.write(`\r  ${done}/${rows.length} embedded...`);
        } catch (e) {
          console.error(`\n  ⚠️  Failed to embed chunk ${row.id}: ${e}`);
        }
      }),
    );
  }

  console.log(`\n✅ Embedded ${done}/${rows.length} chunks successfully.`);
}

main()
  .catch((e) => { console.error('❌ embed-chunks failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
