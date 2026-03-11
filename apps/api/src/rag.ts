/**
 * Fase 4b: RAG – búsqueda full-text en normativa/manuales.
 * Usa tsvector de Postgres (configuración 'spanish').
 */
import { prisma } from './db.js';

export type RagSearchResult = {
  id: string;
  title: string;
  snippet: string | null;
  source: string;
  document_type: string;
};

type RagRow = {
  id: string;
  title: string;
  snippet: string | null;
  source: string;
  document_type: string;
};

export async function searchRag(q: string, limit: number): Promise<RagSearchResult[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  // Escapamos caracteres especiales de tsquery: & | ! ( ) para evitar errores
  const sanitized = q.replace(/[&|!()]/g, ' ').trim();
  if (!sanitized) return [];

  const rows = await prisma.$queryRawUnsafe<RagRow[]>(
    `SELECT id, title, source, "documentType" as document_type,
      ts_headline('spanish', content, plainto_tsquery('spanish', $1::text), 'MaxFragments=2, MaxWords=50') as snippet
    FROM "RagChunk"
    WHERE to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'')) @@ plainto_tsquery('spanish', $1::text)
    ORDER BY ts_rank(to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'')), plainto_tsquery('spanish', $1::text)) DESC
    LIMIT $2`,
    sanitized,
    safeLimit
  );

  return rows.map((r: RagRow) => ({
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    source: r.source,
    document_type: r.document_type,
  }));
}
