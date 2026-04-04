'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../../components/AdminShell';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type PacRow = {
  entityId: string;
  entityName: string;
  planned: number;
  executed: number;
  plannedAmount: number;
  executedAmount: number;
  executionRate: number;
  deviation: number;
};

function DeviationBadge({ rate }: { rate: number }) {
  const r = parseFloat(String(rate));
  if (r >= 80) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{r}%</span>;
  if (r >= 50) return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">{r}%</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{r}%</span>;
}

export default function PacPage() {
  const [rows, setRows] = useState<PacRow[]>([]);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (token) setToken(token);
    setLoading(true);
    api.getPacVsExecuted({ year: parseInt(year) })
      .then((r) => { setRows(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, year]);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  const chartData = rows.slice(0, 12).map((r) => ({
    name: r.entityName.slice(0, 18),
    Planificado: r.planned,
    Ejecutado: r.executed,
  }));

  const avgRate = rows.length
    ? (rows.reduce((s, r) => s + (parseFloat(String(r.executionRate)) || 0), 0) / rows.length).toFixed(1)
    : '0';

  const lowExecution = rows.filter((r) => (parseFloat(String(r.executionRate)) || 0) < 50).length;

  return (
    <AdminShell activeId="analytics">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">PAC vs Ejecutado</h1>
            <p className="text-sm text-text-secondary">Desviación entre el plan de compras y lo efectivamente contratado</p>
          </div>
          <div className="flex gap-3">
            <Link href="/analytics" className="text-sm text-primary hover:underline">← Volver</Link>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded border border-neutral-200 px-3 py-1.5 text-sm"
            >
              {[2026, 2025, 2024, 2023, 2022].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-text-secondary">Entidades analizadas</p>
                <p className="mt-1 text-2xl font-bold">{rows.length}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-text-secondary">Tasa ejecución promedio</p>
                <p className="mt-1 text-2xl font-bold">{avgRate}%</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">Baja ejecución (&lt;50%)</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{lowExecution}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-text-secondary">Año analizado</p>
                <p className="mt-1 text-2xl font-bold">{year}</p>
              </div>
            </div>

            <Card title="Procesos Planificados vs Ejecutados por Entidad">
              {chartData.length === 0 ? (
                <p className="py-6 text-center text-text-secondary">Sin datos para el período seleccionado</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '16px' }} />
                    <Bar dataKey="Planificado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ejecutado" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Detalle por Entidad">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-text-secondary">Entidad</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Planificados</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Ejecutados</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Monto Planificado</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Monto Ejecutado</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Tasa Ejecución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-text-secondary">Sin datos</td></tr>
                    )}
                    {rows.map((r) => (
                      <tr key={r.entityId} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-4 py-2">{r.entityName}</td>
                        <td className="px-4 py-2 text-right">{Number(r.planned)}</td>
                        <td className="px-4 py-2 text-right">{Number(r.executed)}</td>
                        <td className="px-4 py-2 text-right">{fmtCurrency(r.plannedAmount)}</td>
                        <td className="px-4 py-2 text-right">{fmtCurrency(r.executedAmount)}</td>
                        <td className="px-4 py-2 text-right">
                          <DeviationBadge rate={r.executionRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
