'use client';

import { useEffect, useState } from 'react';
import { Card, Skeleton } from '@sercop/design-system';
import { api, setBaseUrl } from '@sercop/api-client';
import { PublicShell } from '../components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function CifrasPage() {
  const [data, setData] = useState<{ tenders: number; tendersPublished: number; providers: number; contracts: number } | null>(null);

  useEffect(() => {
    api.getAnalyticsPublic().then(setData).catch(() => setData(null));
  }, []);

  return (
    <PublicShell activeId="cifras">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Contratación pública en cifras</h1>
        <p className="mb-8 text-text-secondary">Resumen de la actividad del sistema.</p>

        {!data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} variant="outline"><Skeleton lines={2} /></Card>
            ))}
          </div>
        ) : (
          <section className="rounded-xl bg-hero-bg p-6">
            <h2 className="mb-6 text-lg font-semibold text-text-primary">En números</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card title="Procesos totales" variant="outline">
                <p className="text-3xl font-bold text-primary">{data.tenders}</p>
              </Card>
              <Card title="Procesos publicados" variant="outline">
                <p className="text-3xl font-bold text-accent">{data.tendersPublished}</p>
              </Card>
              <Card title="Proveedores registrados" variant="outline">
                <p className="text-3xl font-bold text-text-primary">{data.providers}</p>
              </Card>
              <Card title="Contratos adjudicados" variant="outline">
                <p className="text-3xl font-bold text-text-primary">{data.contracts}</p>
              </Card>
            </div>
          </section>
        )}
      </div>
    </PublicShell>
  );
}
