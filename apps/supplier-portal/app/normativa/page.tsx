'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, type RagSearchResult } from '@sercop/api-client';
import { SupplierShell } from '../components/SupplierShell';

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
    <SupplierShell activeId="normativa">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Normativa y documentación</h1>
        <p className="mb-6 text-gray-600">Busque en la LOSNCP, reglamentos, manuales y guías.</p>

        <Card title="Búsqueda" className="mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: contratación pública, RUP, PAC"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              className="flex-1"
            />
            <Button onClick={search} disabled={loading}>Buscar</Button>
          </div>
          {loading && <p className="mt-2 text-sm text-gray-500">Buscando…</p>}
        </Card>

        {results !== null && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Resultados</h2>
            {results.length === 0 ? <p className="text-gray-500">Sin resultados.</p> : results.map((r) => (
              <Card key={r.id} title={r.title}>
                <p className="text-sm text-gray-600">{r.snippet || r.source}</p>
                <span className="mt-2 inline-block text-xs text-gray-400">{r.source} / {r.document_type}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SupplierShell>
  );
}
