'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button } from '@sercop/design-system';
import { api, setBaseUrl } from '@sercop/api-client';
import Link from 'next/link';
import { PublicShell } from '../../components/PublicShell';

const SUPPLIER_URL = process.env.NEXT_PUBLIC_SUPPLIER_URL || 'http://localhost:3002';
setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function TenderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.getTender(id).then(setTender).catch(() => setTender(null));
  }, [id]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block">
          <Button variant="secondary" size="sm">← Volver a procesos</Button>
        </Link>
        {!tender ? <p>Cargando…</p> : (
          <>
            <Card title={String(tender.title)}>
              <p className="text-gray-600">{String(tender.description || '—')}</p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {tender.status != null && tender.status !== '' ? (
                  <><dt className="font-medium text-gray-500">Estado</dt><dd>{String(tender.status)}</dd></>
                ) : null}
                {tender.procurementMethod != null && tender.procurementMethod !== '' ? (
                  <><dt className="font-medium text-gray-500">Método</dt><dd>{String(tender.procurementMethod)}</dd></>
                ) : null}
                {tender.estimatedAmount != null ? (
                  <><dt className="font-medium text-gray-500">Monto estimado</dt><dd>${Number(tender.estimatedAmount).toLocaleString()}</dd></>
                ) : null}
                {tender.procurementPlan ? (
                  <>
                    <dt className="font-medium text-gray-500">Entidad</dt>
                    <dd>{(tender.procurementPlan as { entity?: { name?: string } })?.entity?.name || '—'}</dd>
                    <dt className="font-medium text-gray-500">Año PAC</dt>
                    <dd>{(tender.procurementPlan as { year?: number })?.year || '—'}</dd>
                  </>
                ) : null}
              </dl>
              <a href={`${SUPPLIER_URL}/procesos/${id}/oferta`} className="mt-4 inline-block">
                <Button>Participar (presentar oferta)</Button>
              </a>
            </Card>
          </>
        )}
      </div>
    </PublicShell>
  );
}
