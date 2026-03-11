'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getProviderId } from './lib/auth';
import Link from 'next/link';
import { SupplierShell } from './components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function SupplierDashboardPage() {
  const [bids, setBids] = useState<Array<Record<string, unknown>>>([]);
  const [tenders, setTenders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const providerId = getProviderId();

  useEffect(() => {
    if (token) setToken(token);
    Promise.all([
      providerId ? api.getProviderBids(providerId) : Promise.resolve({ data: [] }),
      api.getTenders(),
    ])
      .then(([bRes, tRes]) => {
        setBids(bRes.data as Array<Record<string, unknown>>);
        setTenders((tRes.data as Array<Record<string, unknown>>).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, providerId]);

  return (
    <SupplierShell activeId="inicio">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Portal proveedores</h1>
        {!token && (
          <Card title="Bienvenido" className="mb-8">
            <p className="mb-4 text-gray-600">Para presentar ofertas y gestionar su perfil, inicie sesión o regístrese.</p>
            <div className="flex gap-2">
              <Link href="/login"><Button>Iniciar sesión</Button></Link>
              <Link href="/registro"><Button variant="outline">Registrarme</Button></Link>
            </div>
          </Card>
        )}
        {token && !providerId && (
          <Card title="Proveedor no vinculado" className="mb-8">
            <p className="text-gray-600">Inicie sesión con su RUC para vincular su proveedor, o regístrese primero.</p>
            <Link href="/login" className="mt-2 inline-block"><Button size="sm">Ir a login</Button></Link>
          </Card>
        )}
        {token && providerId && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <Card title="Mis ofertas">
                {loading ? <p className="text-gray-500">Cargando…</p> : (
                  <p className="text-2xl font-semibold">{bids.length}</p>
                )}
                <Link href="/ofertas" className="mt-2 inline-block"><Button variant="outline" size="sm">Ver todas</Button></Link>
              </Card>
              <Card title="Procesos abiertos">
                {loading ? <p className="text-gray-500">Cargando…</p> : (
                  <p className="text-2xl font-semibold">{tenders.length}</p>
                )}
                <Link href="/procesos" className="mt-2 inline-block"><Button variant="outline" size="sm">Ver procesos</Button></Link>
              </Card>
            </div>
            <Card title="Procesos recientes">
              {loading ? <p className="text-gray-500">Cargando…</p> : tenders.length === 0 ? (
                <p className="text-gray-500">No hay procesos publicados.</p>
              ) : (
                <ul className="space-y-2">
                  {tenders.map((t) => (
                    <li key={String(t.id)} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                      <span className="font-medium">{String(t.title)}</span>
                      <Link href={`/procesos/${t.id}/oferta`}><Button size="sm" variant="outline">Participar</Button></Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </SupplierShell>
  );
}
