import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from './auth.js';
import { prisma } from '../db/client.js';
import { ingestDocument, isSupportedMimeType } from '../rag/ingest-pipeline.js';
import { getEmbeddingProvider, embedChunks } from '../rag/embed-service.js';
import { scrapeUrl } from '../rag/web-scraper.js';
import { LLMRouter } from '../llm/router.js';
import type { AgentLLMProviderRecord } from '../types/index.js';
import path from 'node:path';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sanitizeFileName(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

async function buildRouter(): Promise<LLMRouter> {
  const providers = await prisma.agentLLMProvider.findMany({ where: { isActive: true } });
  return LLMRouter.fromConfig(providers as unknown as AgentLLMProviderRecord[]);
}

const knowledgeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAdmin);

  // ─── Stats ──────────────────────────────────────────────

  fastify.get('/stats', async () => {
    const [catalogs, documents, totalChunks, embeddedChunks] = await Promise.all([
      prisma.agentKnowledgeCatalog.count(),
      prisma.agentKnowledgeDocument.count(),
      prisma.agentRagChunk.count(),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM "AgentRagChunk" WHERE embedding IS NOT NULL`,
      ),
    ]);

    return {
      catalogs,
      documents,
      totalChunks,
      embeddedChunks: Number(embeddedChunks[0]?.count ?? 0),
      pendingEmbeddings: totalChunks - Number(embeddedChunks[0]?.count ?? 0),
    };
  });

  // ─── Catalogs CRUD ──────────────────────────────────────

  fastify.get('/catalogs', async () => {
    return prisma.agentKnowledgeCatalog.findMany({
      include: { _count: { select: { documents: true } } },
      orderBy: { name: 'asc' },
    });
  });

  fastify.post<{
    Body: { name: string; description?: string; icon?: string; color?: string };
  }>('/catalogs', async (request, reply) => {
    const { name, description, icon, color } = request.body;
    if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });

    const slug = slugify(name);
    return prisma.agentKnowledgeCatalog.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() ?? null,
        icon: icon ?? '📁',
        color: color ?? '#0073E6',
      },
    });
  });

  fastify.put<{
    Params: { id: string };
    Body: { name?: string; description?: string; icon?: string; color?: string; isActive?: boolean };
  }>('/catalogs/:id', async (request) => {
    const data: Record<string, unknown> = {};
    const { name, description, icon, color, isActive } = request.body;
    if (name !== undefined) {
      data.name = name.trim();
      data.slug = slugify(name);
    }
    if (description !== undefined) data.description = description?.trim() ?? null;
    if (icon !== undefined) data.icon = icon;
    if (color !== undefined) data.color = color;
    if (isActive !== undefined) data.isActive = isActive;

    return prisma.agentKnowledgeCatalog.update({
      where: { id: request.params.id },
      data,
    });
  });

  fastify.delete<{ Params: { id: string } }>('/catalogs/:id', async (request) => {
    await prisma.agentKnowledgeCatalog.delete({ where: { id: request.params.id } });
    return { ok: true };
  });

  // ─── Documents ──────────────────────────────────────────

  fastify.get<{ Params: { catalogId: string } }>(
    '/catalogs/:catalogId/documents',
    async (request) => {
      return prisma.agentKnowledgeDocument.findMany({
        where: { catalogId: request.params.catalogId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, fileName: true, mimeType: true,
          fileSizeBytes: true, status: true, chunkCount: true,
          errorMessage: true, createdAt: true, updatedAt: true,
        },
      });
    },
  );

  fastify.post<{ Params: { catalogId: string } }>(
    '/catalogs/:catalogId/documents',
    async (request, reply) => {
      const catalog = await prisma.agentKnowledgeCatalog.findUnique({
        where: { id: request.params.catalogId },
      });
      if (!catalog) return reply.code(404).send({ error: 'Catalog not found' });

      const router = await buildRouter();
      const parts = request.parts();
      const results: Array<{ id: string; fileName: string; status: string }> = [];

      for await (const part of parts) {
        if (part.type !== 'file' || !part.filename) continue;

        const mime = part.mimetype;
        if (!isSupportedMimeType(mime)) {
          results.push({ id: '', fileName: part.filename, status: `unsupported_type: ${mime}` });
          continue;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        if (buffer.length > MAX_FILE_SIZE) {
          results.push({ id: '', fileName: part.filename, status: 'file_too_large' });
          continue;
        }

        const safeName = sanitizeFileName(part.filename);
        const title = safeName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');

        const doc = await prisma.agentKnowledgeDocument.create({
          data: {
            catalogId: catalog.id,
            title,
            fileName: safeName,
            mimeType: mime,
            fileSizeBytes: buffer.length,
            status: 'pending',
          },
        });

        ingestDocument(
          prisma as unknown as Parameters<typeof ingestDocument>[0],
          {
            id: doc.id,
            buffer,
            mimeType: mime,
            title,
            source: catalog.name,
            documentType: catalog.slug,
          },
          router,
        ).catch(() => {});

        results.push({ id: doc.id, fileName: safeName, status: 'processing' });
      }

      return results;
    },
  );

  fastify.get<{ Params: { id: string } }>('/documents/:id', async (request, reply) => {
    const doc = await prisma.agentKnowledgeDocument.findUnique({
      where: { id: request.params.id },
      include: {
        catalog: { select: { id: true, name: true, slug: true } },
        _count: { select: { chunks: true } },
      },
    });
    if (!doc) return reply.code(404).send({ error: 'Document not found' });
    return doc;
  });

  fastify.delete<{ Params: { id: string } }>('/documents/:id', async (request) => {
    await prisma.agentKnowledgeDocument.delete({ where: { id: request.params.id } });
    return { ok: true };
  });

  fastify.post<{ Params: { id: string } }>(
    '/documents/:id/reprocess',
    async (request, reply) => {
      const doc = await prisma.agentKnowledgeDocument.findUnique({
        where: { id: request.params.id },
      });
      if (!doc) return reply.code(404).send({ error: 'Document not found' });
      if (!doc.rawText) return reply.code(400).send({ error: 'No raw text available for reprocessing' });

      const catalog = await prisma.agentKnowledgeCatalog.findUnique({
        where: { id: doc.catalogId },
      });

      const router = await buildRouter();

      ingestDocument(
        prisma as unknown as Parameters<typeof ingestDocument>[0],
        {
          id: doc.id,
          buffer: Buffer.from(doc.rawText, 'utf-8'),
          mimeType: 'text/plain',
          title: doc.title,
          source: catalog?.name ?? 'unknown',
          documentType: catalog?.slug ?? 'unknown',
        },
        router,
      ).catch(() => {});

      return { status: 'reprocessing', documentId: doc.id };
    },
  );

  // ─── Web page ingestion ──────────────────────────────────

  fastify.post<{
    Params: { catalogId: string };
    Body: { url: string; title?: string };
  }>('/catalogs/:catalogId/web-pages', async (request, reply) => {
    const catalog = await prisma.agentKnowledgeCatalog.findUnique({
      where: { id: request.params.catalogId },
    });
    if (!catalog) return reply.code(404).send({ error: 'Catalog not found' });

    const { url, title: customTitle } = request.body;
    if (!url?.trim()) return reply.code(400).send({ error: 'url is required' });

    // Validate URL
    try {
      const u = new URL(url.trim());
      if (!['http:', 'https:'].includes(u.protocol)) {
        return reply.code(400).send({ error: 'Only http:// and https:// URLs are supported' });
      }
    } catch {
      return reply.code(400).send({ error: 'Invalid URL format' });
    }

    const cleanUrl = url.trim();

    // Create the document record immediately (status: pending)
    const doc = await prisma.agentKnowledgeDocument.create({
      data: {
        catalogId: catalog.id,
        title: customTitle?.trim() || new URL(cleanUrl).hostname,
        fileName: new URL(cleanUrl).hostname,
        mimeType: 'text/html',
        fileSizeBytes: 0,
        sourceUrl: cleanUrl,
        status: 'pending',
      },
    });

    const router = await buildRouter();

    // Fire-and-forget scrape + ingest
    (async () => {
      try {
        await prisma.agentKnowledgeDocument.update({
          where: { id: doc.id },
          data: { status: 'processing', errorMessage: null },
        });

        const scraped = await scrapeUrl(cleanUrl);

        // Update title and file size from scraped content
        await prisma.agentKnowledgeDocument.update({
          where: { id: doc.id },
          data: {
            title: customTitle?.trim() || scraped.title,
            fileSizeBytes: scraped.contentLength,
            lastCrawledAt: new Date(),
          },
        });

        await ingestDocument(
          prisma as unknown as Parameters<typeof ingestDocument>[0],
          {
            id: doc.id,
            buffer: Buffer.from(scraped.text, 'utf-8'),
            mimeType: 'text/plain',
            title: customTitle?.trim() || scraped.title,
            source: new URL(cleanUrl).hostname,
            documentType: 'web',
          },
          router,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.agentKnowledgeDocument.update({
          where: { id: doc.id },
          data: { status: 'error', errorMessage: message },
        }).catch(() => {});
      }
    })();

    return { id: doc.id, status: 'processing', url: cleanUrl };
  });

  // ─── Re-crawl web page ───────────────────────────────────

  fastify.post<{ Params: { id: string } }>(
    '/documents/:id/recrawl',
    async (request, reply) => {
      const doc = await prisma.agentKnowledgeDocument.findUnique({
        where: { id: request.params.id },
      });
      if (!doc) return reply.code(404).send({ error: 'Document not found' });
      if (doc.mimeType !== 'text/html' || !doc.sourceUrl) {
        return reply.code(400).send({ error: 'Document is not a web page or has no source URL' });
      }

      const catalog = await prisma.agentKnowledgeCatalog.findUnique({
        where: { id: doc.catalogId },
      });

      const router = await buildRouter();

      (async () => {
        try {
          await prisma.agentKnowledgeDocument.update({
            where: { id: doc.id },
            data: { status: 'processing', errorMessage: null },
          });

          const scraped = await scrapeUrl(doc.sourceUrl!);

          await prisma.agentKnowledgeDocument.update({
            where: { id: doc.id },
            data: {
              fileSizeBytes: scraped.contentLength,
              lastCrawledAt: new Date(),
            },
          });

          await ingestDocument(
            prisma as unknown as Parameters<typeof ingestDocument>[0],
            {
              id: doc.id,
              buffer: Buffer.from(scraped.text, 'utf-8'),
              mimeType: 'text/plain',
              title: doc.title,
              source: catalog?.name ?? new URL(doc.sourceUrl!).hostname,
              documentType: 'web',
            },
            router,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await prisma.agentKnowledgeDocument.update({
            where: { id: doc.id },
            data: { status: 'error', errorMessage: message },
          }).catch(() => {});
        }
      })();

      return { status: 'recrawling', documentId: doc.id, url: doc.sourceUrl };
    },
  );

  // ─── Document chunks ────────────────────────────────────

  fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/documents/:id/chunks',
    async (request, reply) => {
      const doc = await prisma.agentKnowledgeDocument.findUnique({ where: { id: request.params.id } });
      if (!doc) return reply.code(404).send({ error: 'Document not found' });

      const page = Math.max(1, Number(request.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 20)));

      const [chunks, total] = await Promise.all([
        prisma.agentRagChunk.findMany({
          where: { documentId: doc.id },
          orderBy: { createdAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          select: { id: true, title: true, content: true, source: true, createdAt: true },
        }),
        prisma.agentRagChunk.count({ where: { documentId: doc.id } }),
      ]);

      return { chunks, total, page, limit, pages: Math.ceil(total / limit) };
    },
  );

  // ─── Catalog reindex ────────────────────────────────────

  fastify.post<{ Params: { catalogId: string } }>(
    '/catalogs/:catalogId/reindex',
    async (request, reply) => {
      const catalog = await prisma.agentKnowledgeCatalog.findUnique({
        where: { id: request.params.catalogId },
        include: { _count: { select: { documents: true } } },
      });
      if (!catalog) return reply.code(404).send({ error: 'Catalog not found' });

      const docs = await prisma.agentKnowledgeDocument.findMany({
        where: { catalogId: catalog.id },
        select: { id: true },
      });

      const router = await buildRouter();
      const ragConfig = await prisma.agentRAGConfig.findFirst();
      const provider = getEmbeddingProvider(router, ragConfig);

      const promises = docs.map((d) =>
        embedChunks(
          provider,
          prisma as unknown as Parameters<typeof embedChunks>[1],
          { documentId: d.id },
        ).catch(() => ({ embedded: 0, total: 0 })),
      );

      Promise.all(promises).catch(() => {});

      return {
        status: 'reindex_started',
        catalogId: catalog.id,
        documentCount: docs.length,
      };
    },
  );
};

export default knowledgeRoutes;
