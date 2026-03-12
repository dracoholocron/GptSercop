'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getEntityId } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function ProcesosPage() {
  const [tenders, setTenders] = useState<Array<Record<string, unknown>>>([]);
  const [pacPlans, setPacPlans] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const entityId = getEntityId();

  useEffect(() => {
    if (token) setToken(token);
    if (entityId) {
      Promise.all([
        api.getTenders({ entityId }),
        api.getPac({ entityId }),
      ]).then(([tRes, pRes]) => {
        setTenders(tRes.data as Array<Record<string, unknown>>);
        setPacPlans(pRes.data as Array<Record<string, unknown>>);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [token, entityId]);

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Procesos de contratación</h1>
        {!token ? (
          <Card title="Inicie sesión"><Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link></Card>
        ) : !entityId ? (
          <Card title="Seleccione entidad"><Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link></Card>
        ) : (
          <>
            <Link href="/procesos/nuevo" className="mb-4 inline-block"><Button>Crear proceso</Button></Link>
            {loading ? <p>Cargando…</p> : (
              <div className="grid gap-4 md:grid-cols-2">
                {tenders.length === 0 && <p className="col-span-full text-gray-500">No hay procesos. Cree uno desde un PAC.</p>}
                {tenders.map((t) => (
                  <Card key={String(t.id)} title={String(t.title)}>
                    <p className="text-sm text-gray-600">Estado: {String(t.status)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href={`/procesos/${t.id}/editar`}><Button size="sm" variant="outline">Editar</Button></Link>
                      <Link href={`/procesos/${t.id}/ofertas`}><Button size="sm">Ver ofertas</Button></Link>
                      <Link href={`/procesos/${t.id}/aclaraciones`}><Button size="sm" variant="outline">Aclaraciones</Button></Link>
                      <Link href={`/procesos/${t.id}/evaluaciones`}><Button size="sm" variant="outline">Evaluaciones</Button></Link>
                      <Link href={`/procesos/${t.id}/contrato`}><Button size="sm" variant="outline">Contrato</Button></Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </EntityShell>
  );
}
