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
  score: number;
}

function sanitizeQuery(q: string): string {
  return q.replace(/[&|!()]/g, ' ').trim();
}

type PrismaLike = {
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
};

export interface SearchWeights {
  semantic: number;
  keyword: number;
}

const DEFAULT_WEIGHTS: SearchWeights = { semantic: 0.6, keyword: 0.4 };

export async function hybridSearch(
  prisma: PrismaLike,
  query: string,
  embedding: number[],
  limit: number,
  weights?: SearchWeights,
  catalogIds?: string[],
): Promise<RagResult[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  const w = weights ?? DEFAULT_WEIGHTS;
  const semW = Math.max(0, Math.min(1, w.semantic));
  const kwW = Math.max(0, Math.min(1, w.keyword));

  const vecStr = `[${embedding.join(',')}]`;

  const catalogFilter = catalogIds?.length
    ? `AND "documentId" IN (SELECT id FROM "AgentKnowledgeDocument" WHERE "catalogId" = ANY($4::text[]))`
    : '';

  const params: unknown[] = [vecStr, sanitized, safeLimit];
  if (catalogIds?.length) params.push(catalogIds);

  const rows = await prisma.$queryRawUnsafe<RagRow[]>(
    `
    WITH semantic AS (
      SELECT id, 1 - (embedding <=> $1::vector) AS score
      FROM "AgentRagChunk"
      WHERE embedding IS NOT NULL ${catalogFilter}
      ORDER BY embedding <=> $1::vector
      LIMIT 20
    ),
    keyword AS (
      SELECT id,
        ts_rank(
          to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'')),
          plainto_tsquery('spanish', $2::text)
        ) AS score
      FROM "AgentRagChunk"
      WHERE to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,''))
            @@ plainto_tsquery('spanish', $2::text)
            ${catalogFilter}
      LIMIT 20
    ),
    fused AS (
      SELECT
        COALESCE(s.id, k.id) AS id,
        COALESCE(s.score, 0) * ${semW} + COALESCE(k.score, 0) * ${kwW} AS score
      FROM semantic s
      FULL OUTER JOIN keyword k ON s.id = k.id
    )
    SELECT
      r.id,
      r.title,
      ts_headline('spanish', r.content, plainto_tsquery('spanish', $2::text),
                  'MaxFragments=2, MaxWords=50') AS snippet,
      r.source,
      r."documentType" AS document_type,
      f.score
    FROM fused f
    JOIN "AgentRagChunk" r ON r.id = f.id
    ORDER BY f.score DESC
    LIMIT $3
    `,
    ...params,
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    source: r.source,
    documentType: r.document_type,
    score: Number(r.score),
  }));
}
