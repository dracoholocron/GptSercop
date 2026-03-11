'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@sercop/design-system';
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Portal entidad</h1>
        {!token ? (
          <Card title="Bienvenido" className="mb-8">
            <p className="mb-4 text-gray-600">Para gestionar PAC, procesos y evaluación, inicie sesión.</p>
            <Link href="/login"><Button>Iniciar sesión</Button></Link>
          </Card>
        ) : !entityId ? (
          <Card title="Entidad no seleccionada" className="mb-8">
            <p className="text-gray-600">Inicie sesión y seleccione su entidad.</p>
            <Link href="/login" className="mt-2 inline-block"><Button size="sm">Ir a login</Button></Link>
          </Card>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <Card title="PAC activos">
                {loading ? <p className="text-gray-500">Cargando…</p> : <p className="text-2xl font-semibold">{pac.length}</p>}
                <Link href="/pac" className="mt-2 inline-block"><Button variant="outline" size="sm">Ver PAC</Button></Link>
              </Card>
              <Card title="Procesos">
                {loading ? <p className="text-gray-500">Cargando…</p> : <p className="text-2xl font-semibold">{tenders.length}</p>}
                <Link href="/procesos" className="mt-2 inline-block"><Button variant="outline" size="sm">Ver procesos</Button></Link>
              </Card>
            </div>
            <Card title="Procesos recientes">
              {loading ? <p className="text-gray-500">Cargando…</p> : tenders.length === 0 ? (
                <p className="text-gray-500">No hay procesos. <Link href="/procesos/nuevo" className="text-blue-600 hover:underline">Crear proceso</Link></p>
              ) : (
                <ul className="space-y-2">
                  {tenders.map((t) => (
                    <li key={String(t.id)} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
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
