'use client';

import { useEffect, useState } from 'react';
import { Card, Badge } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getProviderId } from '../lib/auth';
import Link from 'next/link';
import { SupplierShell } from '../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function OfertasPage() {
  const [bids, setBids] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const providerId = getProviderId();

  useEffect(() => {
    if (token) setToken(token);
    if (providerId) {
      api.getProviderBids(providerId).then((r) => { setBids(r.data as Array<Record<string, unknown>>); setLoading(false); }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [token, providerId]);

  return (
    <SupplierShell activeId="ofertas">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Mis ofertas</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <p className="text-gray-600">Debe iniciar sesión para ver sus ofertas.</p>
            <Link href="/login" className="mt-2 inline-block text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : !providerId ? (
          <Card title="Proveedor no vinculado">
            <p className="text-gray-600">Inicie sesión con su RUC para vincular su proveedor.</p>
          </Card>
        ) : loading ? (
          <p>Cargando…</p>
        ) : bids.length === 0 ? (
          <Card title="Sin ofertas">
            <p className="text-gray-600">Aún no ha presentado ofertas. <Link href="/procesos" className="text-blue-600 hover:underline">Ver procesos abiertos</Link></p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bids.map((b) => (
              <Card key={String(b.id)} title={(b.tender as { title?: string })?.title || 'Proceso'}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={b.status === 'submitted' ? 'success' : 'default'}>{String(b.status)}</Badge>
                  {b.amount != null && <span className="text-sm">Monto: ${Number(b.amount).toLocaleString()}</span>}
                </div>
                <Link href={`/procesos/${(b.tender as { id?: string })?.id}/oferta`} className="mt-2 text-sm text-blue-600 hover:underline">Ver proceso</Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SupplierShell>
  );
}
