'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, EmptyState, Skeleton, Search } from '@sercop/design-system';
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
      <section className="bg-hero-bg py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Encuentra procesos de contratación pública</h1>
          <p className="mt-2 text-lg text-text-secondary">Busque normativa, manuales y procesos publicados.</p>
          <div className="mt-6 flex max-w-2xl gap-2">
            <Input
              placeholder="Ej: contratación pública, RUP, PAC"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchRag()}
              iconLeft={<Search className="h-5 w-5" />}
              className="flex-1"
            />
            <Button variant="accent" onClick={searchRag} disabled={ragLoading}>Buscar</Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Card title="Buscar en normativa" variant="outline" className="mb-8">
          <p className="mb-3 text-sm text-text-secondary">LOSNCP, reglamentos, manuales, resoluciones.</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: contratación pública, RUP, PAC"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchRag()}
              className="flex-1"
            />
            <Button variant="accent" onClick={searchRag} disabled={ragLoading}>Buscar</Button>
          </div>
          {ragLoading && <p className="mt-2 text-sm text-text-secondary">Buscando…</p>}
          {ragResults !== null && (
            <div className="mt-4 space-y-2">
              {ragResults.length === 0 ? (
                <EmptyState title="Sin resultados" description="Pruebe con otros términos." action={{ label: 'Limpiar', onClick: () => setRagResults(null) }} />
              ) : ragResults.map((r) => (
                <div key={r.id} className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm">
                  <p className="font-medium text-text-primary">{r.title}</p>
                  <p className="mt-1 text-text-secondary">{r.snippet || r.source}</p>
                  <span className="mt-1 inline-block text-xs text-neutral-500">{r.source} / {r.document_type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <h2 className="mb-4 text-lg font-semibold text-text-primary">Procesos publicados</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="outline"><Skeleton variant="card" /></Card>
            ))}
          </div>
        ) : tenders.length === 0 ? (
          <EmptyState title="No hay procesos publicados" description="No hay procesos de contratación en este momento." action={{ label: 'Buscar procesos', href: '/procesos' }} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {tenders.slice(0, 6).map((t) => (
                <Card key={t.id} title={t.title} variant="outline">
                  <p className="text-sm text-text-secondary line-clamp-2">{t.description || '—'}</p>
                  <Link href={`/proceso/${t.id}`} className="mt-2 inline-block">
                    <Button variant="accent" size="sm">Ver detalle</Button>
                  </Link>
                </Card>
              ))}
            </div>
            {tenders.length > 6 && (
              <Link href="/procesos" className="mt-4 inline-block">
                <Button variant="secondary">Ver todos los procesos</Button>
              </Link>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
