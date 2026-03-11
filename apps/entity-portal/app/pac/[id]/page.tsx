'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function PacDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
    api.getPacById(id).then(setPlan).catch(() => setPlan(null));
  }, [id]);

  return (
    <EntityShell activeId="pac">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/pac" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!plan ? <p>Cargando…</p> : (
          <Card title={`PAC ${plan.year}`}>
            <p className="text-gray-600">Entidad: {(plan.entity as { name?: string })?.name || String(plan.entityId)}</p>
            <p className="text-sm">Estado: {String(plan.status)}</p>
            <h3 className="mt-4 font-semibold">Procesos del plan</h3>
            <ul className="mt-2 space-y-2">
              {((plan.tenders as Array<{ id: string; title: string; status: string }>) || []).map((t) => (
                <li key={t.id} className="flex items-center justify-between border-b py-2">
                  <span>{t.title}</span>
                  <Link href={`/procesos/${t.id}/ofertas`}><Button size="sm" variant="outline">Ver ofertas</Button></Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
