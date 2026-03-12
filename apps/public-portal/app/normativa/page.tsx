'use client';

import { useState } from 'react';
import { Card, Button, Input, EmptyState, Skeleton, Search } from '@sercop/design-system';
import { api, setBaseUrl, type RagSearchResult } from '@sercop/api-client';
import { PublicShell } from '../components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function NormativaPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RagSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const search = () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    api.rag.search(query.trim(), 10).then((r) => { setResults(r.results); setLoading(false); }).catch(() => setLoading(false));
  };

  return (
    <PublicShell activeId="normativa">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Normativa y documentación</h1>
        <p className="mb-6 text-text-secondary">Busque en la LOSNCP, reglamentos, manuales, resoluciones SERCOP y guías.</p>

        <Card title="Búsqueda" variant="outline" className="mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: contratación pública, RUP, PAC, adjudicación"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              iconLeft={<Search className="h-5 w-5" />}
              className="flex-1"
            />
            <Button variant="accent" onClick={search} disabled={loading}>Buscar</Button>
          </div>
          {loading && <p className="mt-2 text-sm text-text-secondary">Buscando…</p>}
        </Card>

        {results !== null && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Resultados</h2>
            {results.length === 0 ? (
              <EmptyState title="Sin resultados" description="Pruebe con otros términos de búsqueda." />
            ) : (
              results.map((r) => (
                <Card key={r.id} title={r.title} variant="outline">
                  <p className="text-sm text-text-secondary">{r.snippet || r.source}</p>
                  <span className="mt-2 inline-block text-xs text-neutral-500">{r.source} / {r.document_type}</span>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
