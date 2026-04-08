import { hybridSearch } from './hybrid-search.js';

interface RagResult {
  id: string;
  title: string;
  snippet: string | null;
  source: string;
  documentType: string;
  score: number;
}

interface RagRow {
  id: string;
  title: string;
  snippet: string | null;
  source: string;
  document_type: string;
}

type PrismaLike = {
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
};

function sanitizeQuery(q: string): string {
  return q.replace(/[&|!()]/g, ' ').trim();
}

export async function keywordSearch(
  prisma: PrismaLike,
  query: string,
  limit: number,
): Promise<RagResult[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  const rows = await prisma.$queryRawUnsafe<RagRow[]>(
    `SELECT id, title, source, "documentType" AS document_type,
       ts_headline('spanish', content, plainto_tsquery('spanish', $1::text),
                   'MaxFragments=2, MaxWords=50') AS snippet
     FROM "AgentRagChunk"
     WHERE to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,''))
           @@ plainto_tsquery('spanish', $1::text)
     ORDER BY ts_rank(
       to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'')),
       plainto_tsquery('spanish', $1::text)
     ) DESC
     LIMIT $2`,
    sanitized,
    safeLimit,
  );

  return rows.map((r, i) => ({
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    source: r.source,
    documentType: r.document_type,
    score: 1 - i / safeLimit,
  }));
}

export async function searchRag(
  prisma: PrismaLike,
  query: string,
  embedding: number[] | null,
  limit: number,
): Promise<RagResult[]> {
  if (embedding && embedding.length > 0) {
    return hybridSearch(prisma, query, embedding, limit);
  }
  return keywordSearch(prisma, query, limit);
}
