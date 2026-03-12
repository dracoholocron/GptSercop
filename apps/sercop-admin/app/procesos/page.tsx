'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';
import { Card, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../lib/auth';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function AdminProcesosPage() {
  const token = getToken();
  const [tenders, setTenders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) setToken(token);
    api.getTenders({ page: 1, pageSize: 50 })
      .then((r) => setTenders(r.data as Array<Record<string, unknown>>))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AdminShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Procesos</h1>
        {loading ? <p>Cargando…</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {tenders.length === 0 && <p className="col-span-full text-text-secondary">No hay procesos.</p>}
            {tenders.map((t) => (
              <Card key={String(t.id)} title={String(t.title)}>
                <p className="text-sm text-text-secondary line-clamp-2">{String(t.description || '—')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={`/procesos/${t.id}/ofertas`} className="inline-block">
                    <Button size="sm">Revisar ofertas</Button>
                  </Link>
                  <Link href={`/procesos/${t.id}/config-oferta`} className="inline-block">
                    <Button size="sm" variant="outline">Config. wizard</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

