'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
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
        <h1 className="mb-6 text-2xl font-semibold">Contratación pública en cifras</h1>
        <p className="mb-8 text-gray-600">Resumen de la actividad del sistema.</p>

        {!data ? <p>Cargando…</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Procesos totales">
              <p className="text-3xl font-bold text-blue-600">{data.tenders}</p>
            </Card>
            <Card title="Procesos publicados">
              <p className="text-3xl font-bold text-green-600">{data.tendersPublished}</p>
            </Card>
            <Card title="Proveedores registrados">
              <p className="text-3xl font-bold text-gray-700">{data.providers}</p>
            </Card>
            <Card title="Contratos adjudicados">
              <p className="text-3xl font-bold text-gray-700">{data.contracts}</p>
            </Card>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
