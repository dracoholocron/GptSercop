'use client';

import { useEffect, useState } from 'react';
import { Card, Button, StatCard, FileText, BarChart3 } from '@sercop/design-system';
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
      <section className="border-b border-neutral-200 bg-primary-light/50 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-xl font-semibold text-text-primary">Portal proveedores</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {token ? 'Gestione sus ofertas y participe en procesos.' : 'Inicie sesión o regístrese para participar.'}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {!token && (
          <Card title="Bienvenido" className="mb-8">
            <p className="mb-4 text-text-secondary">Para presentar ofertas y gestionar su perfil, inicie sesión o regístrese.</p>
            <div className="flex gap-2">
              <Link href="/login"><Button>Iniciar sesión</Button></Link>
              <Link href="/registro"><Button variant="outline">Registrarme</Button></Link>
            </div>
          </Card>
        )}
        {token && !providerId && (
          <Card title="Proveedor no vinculado" className="mb-8">
            <p className="text-text-secondary">Inicie sesión con su RUC para vincular su proveedor, o regístrese primero.</p>
            <Link href="/login" className="mt-2 inline-block"><Button size="sm">Ir a login</Button></Link>
          </Card>
        )}
        {token && providerId && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={<FileText className="h-5 w-5" />}
                value={loading ? '—' : bids.length}
                label="Mis ofertas"
                href="/ofertas"
                linkLabel="Ver todas"
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                value={loading ? '—' : tenders.length}
                label="Procesos abiertos"
                href="/procesos"
                linkLabel="Ver procesos"
              />
            </div>
            <Card title="Procesos recientes">
              {loading ? <p className="text-text-secondary">Cargando…</p> : tenders.length === 0 ? (
                <p className="text-text-secondary">No hay procesos publicados.</p>
              ) : (
                <ul className="space-y-2">
                  {tenders.map((t) => (
                    <li key={String(t.id)} className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-0">
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
