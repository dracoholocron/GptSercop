'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function OfertasPage() {
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [bids, setBids] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
    Promise.all([api.getTender(id), api.getTenderBids(id)]).then(([tRes, bRes]) => {
      setTender(tRes as Record<string, unknown>);
      setBids(bRes.data as Array<Record<string, unknown>>);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!tender ? <p>Cargando…</p> : (
          <Card title={`Ofertas – ${tender.title}`}>
            {loading ? <p>Cargando…</p> : bids.length === 0 ? (
              <p className="text-gray-500">No hay ofertas presentadas.</p>
            ) : (
              <ul className="space-y-4">
                {bids.map((b) => (
                  <li key={String(b.id)} className="flex items-center justify-between border-b py-2">
                    <div>
                      <span className="font-medium">Proveedor: {String((b.provider as { name?: string })?.name || b.providerId)}</span>
                      {b.amount != null ? <span className="ml-2 text-sm">${Number(b.amount).toLocaleString()}</span> : null}
                    </div>
                    <span className="text-sm text-gray-500">{String(b.status)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/procesos/${id}/contrato`} className="mt-4 inline-block"><Button size="sm">Crear contrato</Button></Link>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
