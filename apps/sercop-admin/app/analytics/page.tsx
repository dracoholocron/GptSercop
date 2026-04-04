'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type Dashboard = {
  totalTenders: number;
  totalContracts: number;
  totalProviders: number;
  totalEntities: number;
  totalContractAmount: number;
  avgBidders: number;
  riskDistribution: { high: number; medium: number; low: number };
  openAlerts: number;
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-bold text-text-primary">{value}</p>
      {sub && <p className="mt-1 text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  useEffect(() => {
    if (token) setToken(token);
    api.getAnalyticsDashboard()
      .then((d) => { setDashboard(d); setLoading(false); })
      .catch(() => { setError('Error al cargar datos analíticos'); setLoading(false); });
  }, [token]);

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <AdminShell activeId="analytics">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Plataforma Analítica</h1>
          <nav className="flex gap-3 text-sm">
            <Link href="/analytics/market" className="text-primary hover:underline">Mercado</Link>
            <Link href="/analytics/pac" className="text-primary hover:underline">PAC vs Ejecutado</Link>
            <Link href="/analytics/risk" className="text-primary hover:underline">Riesgo</Link>
          </nav>
        </div>

        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : error ? (
          <Card title="Error"><p className="text-red-600">{error}</p></Card>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : dashboard ? (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total Procesos" value={dashboard.totalTenders.toLocaleString('es-EC')} />
              <StatCard label="Total Contratos" value={dashboard.totalContracts.toLocaleString('es-EC')} />
              <StatCard label="Proveedores" value={dashboard.totalProviders.toLocaleString('es-EC')} />
              <StatCard label="Entidades" value={dashboard.totalEntities.toLocaleString('es-EC')} />
              <StatCard
                label="Monto Contratado"
                value={fmtCurrency(dashboard.totalContractAmount)}
                sub="Total histórico USD"
              />
              <StatCard
                label="Promedio Oferentes"
                value={dashboard.avgBidders.toFixed(1)}
                sub="por proceso"
              />
              <StatCard
                label="Procesos Alto Riesgo"
                value={dashboard.riskDistribution.high.toLocaleString('es-EC')}
                sub="riskLevel = high"
              />
              <StatCard
                label="Alertas Abiertas"
                value={dashboard.openAlerts.toLocaleString('es-EC')}
                sub="sin resolver"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card title="Distribución de Riesgo">
                <div className="space-y-3">
                  {[
                    { label: 'Alto', value: dashboard.riskDistribution.high, color: 'bg-red-500' },
                    { label: 'Medio', value: dashboard.riskDistribution.medium, color: 'bg-yellow-500' },
                    { label: 'Bajo', value: dashboard.riskDistribution.low, color: 'bg-green-500' },
                  ].map(({ label, value, color }) => {
                    const total = dashboard.riskDistribution.high + dashboard.riskDistribution.medium + dashboard.riskDistribution.low;
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{label}</span>
                          <span className="font-semibold">{value} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded bg-neutral-100">
                          <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card title="Acciones Rápidas">
                <div className="space-y-2">
                  <Link href="/analytics/risk" className="block rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 hover:bg-red-100">
                    Ver {dashboard.riskDistribution.high} procesos de alto riesgo →
                  </Link>
                  <Link href="/analytics/market" className="block rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 hover:bg-blue-100">
                    Análisis de mercado y gasto →
                  </Link>
                  <Link href="/analytics/pac" className="block rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-text-primary hover:bg-neutral-100">
                    Desviación PAC vs ejecutado →
                  </Link>
                </div>
              </Card>

              <Card title="Estado de Alertas">
                <div className="flex flex-col items-center justify-center py-4">
                  <span className={`text-5xl font-bold ${dashboard.openAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {dashboard.openAlerts}
                  </span>
                  <p className="mt-2 text-sm text-text-secondary">alertas pendientes</p>
                  {dashboard.openAlerts > 0 && (
                    <Link href="/analytics/risk" className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                      Revisar alertas
                    </Link>
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
