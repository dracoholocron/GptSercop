'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type RiskScore } from '@sercop/api-client';
import { getToken } from '../../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

function RiskBadge({ level }: { level: string }) {
  if (level === 'high') return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Alto</span>;
  if (level === 'medium') return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">Medio</span>;
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Bajo</span>;
}

export default function RiskPage() {
  const [rows, setRows] = useState<RiskScore[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState<string | null>(null);
  const token = getToken();
  const limit = 20;

  const load = (p: number, l: typeof level) => {
    setLoading(true);
    api.getRiskScores({ level: l === 'all' ? undefined : l, page: p, limit })
      .then((r) => { setRows(r.data); setTotal(r.total); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (token) setToken(token);
    load(page, level);
  }, [token, page, level]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompute = async (tenderId: string) => {
    setComputing(tenderId);
    try {
      await api.computeRisk(tenderId);
      load(page, level);
    } finally {
      setComputing(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminShell activeId="analytics">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard de Riesgo</h1>
            <p className="text-sm text-text-secondary">Procesos evaluados por el motor de riesgo analítico</p>
          </div>
          <div className="flex gap-3">
            <Link href="/analytics" className="text-sm text-primary hover:underline">← Volver</Link>
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value as typeof level); setPage(1); }}
              className="rounded border border-neutral-200 px-3 py-1.5 text-sm"
            >
              <option value="all">Todos los niveles</option>
              <option value="high">Alto riesgo</option>
              <option value="medium">Riesgo medio</option>
              <option value="low">Bajo riesgo</option>
            </select>
          </div>
        </div>

        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />
        ) : (
          <Card title={`Procesos evaluados (${total})`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-text-secondary">Proceso</th>
                    <th className="px-4 py-2 text-left font-medium text-text-secondary">Entidad</th>
                    <th className="px-4 py-2 text-center font-medium text-text-secondary">Nivel</th>
                    <th className="px-4 py-2 text-right font-medium text-text-secondary">Score</th>
                    <th className="px-4 py-2 text-left font-medium text-text-secondary">Indicadores</th>
                    <th className="px-4 py-2 text-right font-medium text-text-secondary">Calculado</th>
                    <th className="px-4 py-2 text-center font-medium text-text-secondary">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-text-secondary">Sin evaluaciones de riesgo. Ejecute el cálculo desde un proceso.</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-2">
                        <div className="font-medium">{r.tender?.code ?? r.tenderId.slice(0, 8)}</div>
                        <div className="text-xs text-text-secondary">{r.tender?.title?.slice(0, 40)}…</div>
                      </td>
                      <td className="px-4 py-2 text-text-secondary">
                        {r.tender?.procurementPlan?.entity?.name ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <RiskBadge level={r.riskLevel} />
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-semibold">
                        {r.totalScore.toFixed(0)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {r.flags.slice(0, 4).map((f) => (
                            <span key={f} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-text-secondary">{f}</span>
                          ))}
                          {r.flags.length > 4 && (
                            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-text-secondary">+{r.flags.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-text-secondary">
                        {new Date(r.calculatedAt).toLocaleDateString('es-EC')}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          disabled={computing === r.tenderId}
                          onClick={() => handleCompute(r.tenderId)}
                          className="rounded border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50"
                        >
                          {computing === r.tenderId ? '…' : 'Recalcular'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                <p className="text-sm text-text-secondary">Página {page} de {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded border border-neutral-200 px-3 py-1 text-sm disabled:opacity-40 hover:bg-neutral-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded border border-neutral-200 px-3 py-1 text-sm disabled:opacity-40 hover:bg-neutral-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
