'use client';

import { useEffect, useState } from 'react';
import { Card, Button, StatCard, FileText, BarChart3 } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getEntityId } from './lib/auth';
import Link from 'next/link';
import { EntityShell } from './components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function EntityDashboardPage() {
  const [pac, setPac] = useState<Array<Record<string, unknown>>>([]);
  const [tenders, setTenders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const entityId = getEntityId();

  useEffect(() => {
    if (token) setToken(token);
    if (entityId) {
      Promise.all([
        api.getPac({ entityId }),
        api.getTenders({ entityId }),
      ])
        .then(([pRes, tRes]) => {
          setPac((pRes.data as Array<Record<string, unknown>>).slice(0, 3));
          setTenders((tRes.data as Array<Record<string, unknown>>).slice(0, 5));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, [token, entityId]);

  return (
    <EntityShell activeId="inicio">
      <section className="border-b border-neutral-200 bg-primary-light/50 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-xl font-semibold text-text-primary">Portal entidad</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {token && entityId ? 'Gestione PAC, procesos y evaluaciones.' : 'Inicie sesión para gestionar contratación.'}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {!token ? (
          <Card title="Bienvenido" className="mb-8">
            <p className="mb-4 text-text-secondary">Para gestionar PAC, procesos y evaluación, inicie sesión.</p>
            <Link href="/login"><Button>Iniciar sesión</Button></Link>
          </Card>
        ) : !entityId ? (
          <Card title="Entidad no seleccionada" className="mb-8">
            <p className="text-text-secondary">Inicie sesión y seleccione su entidad.</p>
            <Link href="/login" className="mt-2 inline-block"><Button size="sm">Ir a login</Button></Link>
          </Card>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={<FileText className="h-5 w-5" />}
                value={loading ? '—' : pac.length}
                label="PAC activos"
                href="/pac"
                linkLabel="Ver PAC"
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                value={loading ? '—' : tenders.length}
                label="Procesos"
                href="/procesos"
                linkLabel="Ver procesos"
              />
            </div>
            <Card title="Procesos recientes">
              {loading ? <p className="text-text-secondary">Cargando…</p> : tenders.length === 0 ? (
                <p className="text-text-secondary">
                  No hay procesos. <Link href="/procesos/nuevo" className="text-primary hover:underline">Crear proceso</Link>
                </p>
              ) : (
                <ul className="space-y-2">
                  {tenders.map((t) => (
                    <li key={String(t.id)} className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-0">
                      <span className="font-medium">{String(t.title)}</span>
                      <Link href={`/procesos/${t.id}/ofertas`}><Button size="sm" variant="outline">Ver ofertas</Button></Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </EntityShell>
  );
}
