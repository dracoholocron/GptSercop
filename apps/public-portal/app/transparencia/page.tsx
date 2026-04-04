'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl } from '@sercop/api-client';
import { PublicShell } from '../components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type MarketOverview = {
  year: number;
  totalContractAmount: number;
  byProcessType: Array<{ processType: string; tenderCount: number; totalAmount: number }>;
};

type TopProvider = { providerId: string; name: string; totalAmount: number; contractCount: number };
type RiskSummary = { low: number; medium: number; high: number; total: number };

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={`rounded-xl border p-6 shadow-sm bg-white ${color ? `border-${color}-200` : 'border-neutral-200'}`}>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color ? `text-${color}-700` : 'text-text-primary'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

function downloadCSV(data: TopProvider[]) {
  const header = 'Proveedor,Contratos,Monto Total\n';
  const rows = data.map((p) => `"${p.name}",${p.contractCount},${p.totalAmount}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `top-proveedores-${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransparenciaPage() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [topProviders, setTopProviders] = useState<TopProvider[]>([]);
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProviders, setFilteredProviders] = useState<TopProvider[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPublicMarketOverview({ year }),
      api.getPublicTopProviders({ year, limit: 20 }),
      api.getPublicRiskSummary(),
    ])
      .then(([ov, tp, rs]) => {
        setOverview(ov);
        setTopProviders(tp.data);
        setFilteredProviders(tp.data);
        setRiskSummary(rs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProviders(topProviders);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredProviders(topProviders.filter((p) => p.name.toLowerCase().includes(q)));
  }, [searchQuery, topProviders]);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Portal de Transparencia</h1>
          <p className="mt-2 text-text-secondary">
            Información pública sobre contratación gubernamental en Ecuador. Datos actualizados periódicamente.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-text-secondary">Año fiscal:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded border border-neutral-200 px-3 py-1.5 text-sm"
          >
            {[2026, 2025, 2024, 2023, 2022].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <>
            {/* KPIs nacionales */}
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Indicadores Nacionales {year}</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <KpiCard
                  label="Monto total contratado"
                  value={overview ? fmtCurrency(overview.totalContractAmount) : '—'}
                  sub="USD acumulado"
                />
                <KpiCard
                  label="Modalidades activas"
                  value={overview?.byProcessType.length ?? 0}
                  sub="tipos de proceso"
                />
                <KpiCard
                  label="Procesos alto riesgo"
                  value={riskSummary?.high ?? 0}
                  sub={riskSummary ? `de ${riskSummary.total} evaluados` : ''}
                  color="red"
                />
                <KpiCard
                  label="Procesos bajo riesgo"
                  value={riskSummary?.low ?? 0}
                  sub={riskSummary?.total ? `${Math.round(((riskSummary.low) / riskSummary.total) * 100)}% del total` : ''}
                  color="green"
                />
              </div>
            </section>

            {/* Distribución por modalidad */}
            {overview?.byProcessType && overview.byProcessType.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">Distribución por Modalidad</h2>
                <Card title="">
                  <div className="divide-y divide-neutral-100">
                    {overview.byProcessType.map((t) => {
                      const pct = overview.totalContractAmount > 0
                        ? Math.round((t.totalAmount / overview.totalContractAmount) * 100)
                        : 0;
                      return (
                        <div key={t.processType} className="py-3">
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-medium">{(t.processType || 'otro').replace(/_/g, ' ')}</span>
                            <span className="text-text-secondary">{t.tenderCount} procesos · {fmtCurrency(t.totalAmount)} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded bg-neutral-100">
                            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </section>
            )}

            {/* Top proveedores con buscador */}
            <section className="mb-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Top Proveedores por Monto</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar proveedor…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => downloadCSV(filteredProviders)}
                    disabled={filteredProviders.length === 0}
                    className="flex items-center gap-1 rounded border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    Descargar CSV
                  </button>
                </div>
              </div>

              <Card title="">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-text-secondary">#</th>
                        <th className="px-4 py-2 text-left font-medium text-text-secondary">Proveedor</th>
                        <th className="px-4 py-2 text-right font-medium text-text-secondary">Contratos</th>
                        <th className="px-4 py-2 text-right font-medium text-text-secondary">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProviders.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-text-secondary">Sin resultados</td></tr>
                      )}
                      {filteredProviders.map((p, i) => (
                        <tr key={p.providerId} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="px-4 py-2 text-text-secondary">{i + 1}</td>
                          <td className="px-4 py-2 font-medium">{p.name}</td>
                          <td className="px-4 py-2 text-right">{p.contractCount.toLocaleString('es-EC')}</td>
                          <td className="px-4 py-2 text-right font-semibold">{fmtCurrency(p.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            {/* Nota legal */}
            <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-text-secondary">
              <strong>Nota:</strong> Los datos presentados en este portal provienen del sistema de contratación pública SERCOP.
              La información es de carácter público y se actualiza periódicamente. Los indicadores de riesgo son generados
              automáticamente por el motor analítico y no constituyen una acusación formal.
            </section>
          </>
        )}
      </div>
    </PublicShell>
  );
}
