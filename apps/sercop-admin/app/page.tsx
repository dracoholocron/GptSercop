'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from './lib/auth';
import Link from 'next/link';
import { AdminShell } from './components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<{ tenders: number; tendersPublished: number; providers: number; contracts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (token) setToken(token);
    api.getAnalyticsPublic().then(setMetrics).catch(() => setMetrics(null)).finally(() => setLoading(false));
  }, [token]);

  return (
    <AdminShell activeId="inicio">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <p className="mb-4 text-gray-600">Para acceder al panel de administración, inicie sesión con rol admin.</p>
            <Link href="/login"><button type="button" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Iniciar sesión</button></Link>
          </Card>
        ) : loading ? (
          <p>Cargando…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Procesos totales">
              <p className="text-2xl font-semibold">{metrics?.tenders ?? 0}</p>
            </Card>
            <Card title="Procesos publicados">
              <p className="text-2xl font-semibold">{metrics?.tendersPublished ?? 0}</p>
            </Card>
            <Card title="Proveedores">
              <p className="text-2xl font-semibold">{metrics?.providers ?? 0}</p>
            </Card>
            <Card title="Contratos">
              <p className="text-2xl font-semibold">{metrics?.contracts ?? 0}</p>
            </Card>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
