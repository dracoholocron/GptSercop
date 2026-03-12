'use client';

import { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type Offer } from '@sercop/api-client';
import { getToken, getProviderId } from '../lib/auth';
import Link from 'next/link';
import { SupplierShell } from '../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function OfertasPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [legacyBids, setLegacyBids] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const providerId = getProviderId();

  useEffect(() => {
    if (token) setToken(token);
    if (providerId) {
      Promise.all([
        api.listOffers({ providerId }).then((r) => r.data),
        api.getProviderBids(providerId).then((r) => r.data as Array<Record<string, unknown>>).catch(() => []),
      ]).then(([o, b]) => {
        setOffers(o);
        setLegacyBids(b);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [token, providerId]);

  return (
    <SupplierShell activeId="ofertas">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Mis ofertas</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <p className="text-text-secondary">Debe iniciar sesión para ver sus ofertas.</p>
            <Link href="/login" className="mt-2 inline-block text-primary hover:underline">Ir a login</Link>
          </Card>
        ) : !providerId ? (
          <Card title="Proveedor no vinculado">
            <p className="text-text-secondary">Inicie sesión con su RUC para vincular su proveedor.</p>
          </Card>
        ) : loading ? (
          <p className="text-text-secondary">Cargando…</p>
        ) : offers.length === 0 && legacyBids.length === 0 ? (
          <Card title="Sin ofertas">
            <p className="text-text-secondary">Aún no ha presentado ofertas. <Link href="/procesos" className="text-primary hover:underline">Ver procesos abiertos</Link></p>
          </Card>
        ) : (
          <div className="space-y-6">
            {offers.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-text-primary">Ofertas enviadas (con acuse)</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {offers.map((o) => (
                    <Card key={o.id} title={o.receiptFolio} variant="outline">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={o.status === 'submitted' || o.status === 'under_review' ? 'success' : 'default'}>
                          {o.status}
                        </Badge>
                        <span className="text-xs text-text-secondary">
                          {new Date(o.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Link href={`/ofertas/${o.id}`}>
                          <Button size="sm" variant="outline">Ver detalle y aclaraciones</Button>
                        </Link>
                        {o.tenderId && (
                          <Link href={`/procesos/${o.tenderId}/oferta`}>
                            <Button size="sm" variant="secondary">Ir al proceso</Button>
                          </Link>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {legacyBids.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-text-primary">Otras ofertas</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {legacyBids.map((b) => (
                    <Card key={String(b.id)} title={(b.tender as { title?: string })?.title || 'Proceso'} variant="outline">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={b.status === 'submitted' ? 'success' : 'default'}>{String(b.status)}</Badge>
                        {b.amount != null && <span className="text-sm text-text-secondary">Monto: ${Number(b.amount).toLocaleString()}</span>}
                      </div>
                      <Link href={`/procesos/${(b.tender as { id?: string })?.id}/oferta`} className="mt-2 inline-block text-sm text-primary hover:underline">Ver proceso</Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SupplierShell>
  );
}
