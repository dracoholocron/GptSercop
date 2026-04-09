import { chunkText } from './chunker.js';
import { getEmbeddingProvider, embedChunks, type EmbeddingProvider } from './embed-service.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = {
  agentRAGConfig: { findFirst: (...args: any[]) => Promise<any> };
  agentKnowledgeDocument: { update: (...args: any[]) => Promise<any> };
  agentRagChunk: {
    createMany: (...args: any[]) => Promise<any>;
    deleteMany: (...args: any[]) => Promise<any>;
  };
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>;
};

interface LLMRouterLike {
  getProvider(id?: string): { id: string; embed(text: string): Promise<number[]> };
}

const SUPPORTED_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function isSupportedMimeType(mime: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mime);
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'text/plain':
    case 'text/markdown':
      return buffer.toString('utf-8');

    case 'application/pdf': {
      // pdf-parse v2 API:
      //   - data + verbosity go in the constructor (constructor converts Buffer→Uint8Array)
      //   - getText() is async, internally calls load(), returns { text: string, pages: [...] }
      const { PDFParse } = await import('pdf-parse') as unknown as {
        PDFParse: new (opts: { data: Buffer; verbosity: number }) => {
          getText(): Promise<{ text: string }>;
        };
      };
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      return result.text ?? '';
    }

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}

export interface IngestResult {
  documentId: string;
  chunkCount: number;
  embeddedCount: number;
  status: 'indexed' | 'error';
  error?: string;
}

/**
 * Full ingestion pipeline for a single document.
 * Uses getEmbeddingProvider to resolve the correct embedding model
 * from AgentRAGConfig, independent of the chat LLM selection.
 */
export async function ingestDocument(
  prisma: PrismaLike,
  doc: {
    id: string;
    buffer: Buffer;
    mimeType: string;
    title: string;
    source: string;
    documentType: string;
  },
  router?: LLMRouterLike | null,
): Promise<IngestResult> {
  try {
    await prisma.agentKnowledgeDocument.update({
      where: { id: doc.id },
      data: { status: 'processing', errorMessage: null },
    });

    const ragConfig = await prisma.agentRAGConfig.findFirst();
    const chunkSize = ragConfig?.chunkSize ?? 512;
    const chunkOverlap = ragConfig?.chunkOverlap ?? 64;

    const embeddingProvider: EmbeddingProvider = getEmbeddingProvider(
      router as Parameters<typeof getEmbeddingProvider>[0],
      ragConfig,
    );

    // 1. Parse
    const rawText = await extractText(doc.buffer, doc.mimeType);
    await prisma.agentKnowledgeDocument.update({
      where: { id: doc.id },
      data: { rawText },
    });

    // 2. Chunk
    const textChunks = chunkText(rawText, { chunkSize, chunkOverlap });
    if (textChunks.length === 0) {
      await prisma.agentKnowledgeDocument.update({
        where: { id: doc.id },
        data: { status: 'indexed', chunkCount: 0 },
      });
      return { documentId: doc.id, chunkCount: 0, embeddedCount: 0, status: 'indexed' };
    }

    await prisma.agentRagChunk.deleteMany({ where: { documentId: doc.id } });

    // 3. Store chunks
    const chunkData = textChunks.map((c, i) => ({
      title: `${doc.title} — chunk ${i + 1}`,
      content: c.text,
      source: doc.source,
      documentType: doc.documentType,
      documentId: doc.id,
    }));

    await prisma.agentRagChunk.createMany({ data: chunkData });

    await prisma.agentKnowledgeDocument.update({
      where: { id: doc.id },
      data: { chunkCount: textChunks.length },
    });

    // 4. Embed using the RAG-configured provider
    const { embedded } = await embedChunks(embeddingProvider, prisma, { documentId: doc.id });

    // 5. Update status
    await prisma.agentKnowledgeDocument.update({
      where: { id: doc.id },
      data: { status: 'indexed' },
    });

    return {
      documentId: doc.id,
      chunkCount: textChunks.length,
      embeddedCount: embedded,
      status: 'indexed',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.agentKnowledgeDocument.update({
      where: { id: doc.id },
      data: { status: 'error', errorMessage: message },
    }).catch(() => {});

    return {
      documentId: doc.id,
      chunkCount: 0,
      embeddedCount: 0,
      status: 'error',
      error: message,
    };
  }
}
