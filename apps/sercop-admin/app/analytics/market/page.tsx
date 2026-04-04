'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type MarketStats } from '@sercop/api-client';
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
  ResponsiveContainer,
  Cell,
} from 'recharts';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea', '#0d9488'];

export default function MarketPage() {
  const [data, setData] = useState<MarketStats[]>([]);
  const [byType, setByType] = useState<MarketStats[]>([]);
  const [groupBy, setGroupBy] = useState<'entity' | 'province' | 'processType'>('entity');
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (token) setToken(token);
    setLoading(true);
    Promise.all([
      api.getMarket({ year: parseInt(year), groupBy }),
      api.getMarket({ year: parseInt(year), groupBy: 'processType' }),
    ])
      .then(([main, types]) => {
        setData(main.data);
        setByType(types.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, year, groupBy]);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  const chartData = data.slice(0, 15).map((d) => ({
    name: (d.entityName || d.province || d.processType || '—').slice(0, 20),
    monto: d.totalAmount,
    contratos: d.contractCount,
  }));

  const typeData = byType.map((d) => ({
    name: (d.processType || '—').replace(/_/g, ' '),
    monto: d.totalAmount,
    procesos: Number(d.tenderCount ?? 0),
  }));

  return (
    <AdminShell activeId="analytics">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Análisis de Mercado</h1>
            <p className="text-sm text-text-secondary">Distribución del gasto público en contratación</p>
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
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              className="rounded border border-neutral-200 px-3 py-1.5 text-sm"
            >
              <option value="entity">Por Entidad</option>
              <option value="province">Por Provincia</option>
              <option value="processType">Por Modalidad</option>
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
              <div key={i} className="h-64 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <Card title={`Gasto por ${groupBy === 'entity' ? 'Entidad' : groupBy === 'province' ? 'Provincia' : 'Modalidad'} (top 15)`}>
              {chartData.length === 0 ? (
                <p className="py-6 text-center text-text-secondary">Sin datos para el período seleccionado</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                    <Bar dataKey="monto" name="Monto contratado" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Distribución por Modalidad de Contratación">
              {typeData.length === 0 ? (
                <p className="py-6 text-center text-text-secondary">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={115} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                    <Bar dataKey="monto" name="Monto" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Detalle">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-text-secondary">
                        {groupBy === 'entity' ? 'Entidad' : groupBy === 'province' ? 'Provincia' : 'Modalidad'}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Contratos</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-text-secondary">Sin datos</td></tr>
                    )}
                    {data.map((d, i) => (
                      <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="px-4 py-2">{d.entityName || d.province || d.processType || '—'}</td>
                        <td className="px-4 py-2 text-right">{Number(d.contractCount).toLocaleString('es-EC')}</td>
                        <td className="px-4 py-2 text-right font-medium">{fmtCurrency(d.totalAmount)}</td>
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
