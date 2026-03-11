'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getEntityId } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type TenderRow = { id: string; title: string; status?: string; estimatedAmount?: number; publishedAt?: string };

export default function ReportesPage() {
  const [pacCount, setPacCount] = useState<number>(0);
  const [tendersCount, setTendersCount] = useState<number>(0);
  const [tenders, setTenders] = useState<TenderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const entityId = getEntityId();

  useEffect(() => {
    if (!token || !entityId) {
      setLoading(false);
      return;
    }
    setToken(token);
    Promise.all([
      api.getPac({ entityId }),
      api.getTenders({ entityId }),
    ])
      .then(([pRes, tRes]) => {
        const pacList = pRes.data || [];
        const tendersList = (tRes.data as TenderRow[]) || [];
        setPacCount(pacList.length);
        setTendersCount(tendersList.length);
        setTenders(tendersList.slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, entityId]);

  return (
    <EntityShell activeId="reportes">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Reportes</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">
              Ir a login
            </Link>
          </Card>
        ) : !entityId ? (
          <Card title="Entidad no seleccionada">
            <p className="text-gray-600">Inicie sesión con una cuenta de entidad para ver reportes.</p>
            <Link href="/login" className="mt-2 inline-block text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <Card title="Planes anuales (PAC)">
                {loading ? <p className="text-gray-500">Cargando…</p> : <p className="text-2xl font-semibold">{pacCount}</p>}
                <p className="mt-1 text-sm text-gray-600">Total de PAC de su entidad</p>
                <Link href="/pac" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Ver PAC</Link>
              </Card>
              <Card title="Procesos de contratación">
                {loading ? <p className="text-gray-500">Cargando…</p> : <p className="text-2xl font-semibold">{tendersCount}</p>}
                <p className="mt-1 text-sm text-gray-600">Procesos asociados a su entidad</p>
                <Link href="/procesos" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Ver procesos</Link>
              </Card>
            </div>
            <Card title="Últimos procesos">
              {loading ? (
                <p className="text-gray-500">Cargando…</p>
              ) : tenders.length === 0 ? (
                <p className="text-gray-500">No hay procesos para mostrar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Título</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Monto est.</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenders.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100">
                          <td className="max-w-[300px] truncate px-4 py-2" title={t.title}>{t.title}</td>
                          <td className="px-4 py-2">{t.status ?? '—'}</td>
                          <td className="px-4 py-2">{t.estimatedAmount != null ? Number(t.estimatedAmount).toLocaleString() : '—'}</td>
                          <td className="px-4 py-2">
                            <Link href={`/procesos/${t.id}/ofertas`} className="text-blue-600 hover:underline">Ofertas</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </EntityShell>
  );
}
