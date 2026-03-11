'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@sercop/design-system';
import { api, setBaseUrl } from '@sercop/api-client';
import Link from 'next/link';
import { SupplierShell } from '../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function ProcesosPage() {
  const [tenders, setTenders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTenders().then((r) => { setTenders(r.data as Array<Record<string, unknown>>); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <SupplierShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Procesos abiertos</h1>
        {loading ? <p>Cargando…</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {tenders.length === 0 && <p className="col-span-full text-gray-500">No hay procesos publicados.</p>}
            {tenders.map((t) => (
              <Card key={String(t.id)} title={String(t.title)}>
                <p className="text-sm text-gray-600 line-clamp-2">{String(t.description || '—')}</p>
                <Link href={`/procesos/${t.id}/oferta`} className="mt-2 inline-block">
                  <Button size="sm">Presentar oferta</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SupplierShell>
  );
}
