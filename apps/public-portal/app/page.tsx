'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, type Tender, type RagSearchResult } from '@sercop/api-client';
import Link from 'next/link';
import { PublicShell } from './components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function PublicPortalPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<RagSearchResult[] | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  useEffect(() => {
    api.getTenders().then((r) => { setTenders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const searchRag = () => {
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    setRagResults(null);
    api.rag.search(ragQuery.trim(), 5).then((r) => { setRagResults(r.results); setRagLoading(false); }).catch(() => setRagLoading(false));
  };

  return (
    <PublicShell activeId="inicio">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-gray-600">Búsqueda de procesos de contratación y normativa.</p>

        <Card title="Buscar en normativa" className="mb-8">
          <p className="mb-3 text-sm text-gray-600">LOSNCP, reglamentos, manuales, resoluciones.</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: contratación pública, RUP, PAC"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchRag()}
              className="flex-1"
            />
            <Button onClick={searchRag} disabled={ragLoading}>Buscar</Button>
          </div>
          {ragLoading && <p className="mt-2 text-sm text-gray-500">Buscando…</p>}
          {ragResults !== null && (
            <div className="mt-4 space-y-2">
              {ragResults.length === 0 ? <p className="text-sm text-gray-500">Sin resultados.</p> : ragResults.map((r) => (
                <div key={r.id} className="rounded border border-gray-100 bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">{r.title}</p>
                  <p className="mt-1 text-gray-600">{r.snippet || r.source}</p>
                  <span className="mt-1 inline-block text-xs text-gray-400">{r.source} / {r.document_type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <h2 className="mb-4 text-lg font-semibold">Procesos publicados</h2>
        {loading ? <p>Cargando…</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {tenders.length === 0 && <p>No hay procesos publicados.</p>}
            {tenders.slice(0, 6).map((t) => (
              <Card key={t.id} title={t.title}>
                <p className="text-sm text-gray-600 line-clamp-2">{t.description || '—'}</p>
                <Link href={`/proceso/${t.id}`} className="mt-2 inline-block">
                  <Button variant="outline" size="sm">Ver detalle</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
        {!loading && tenders.length > 6 && (
          <Link href="/procesos" className="mt-4 inline-block">
            <Button variant="secondary">Ver todos los procesos</Button>
          </Link>
        )}
      </div>
    </PublicShell>
  );
}
