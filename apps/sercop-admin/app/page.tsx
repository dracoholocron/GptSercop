'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, Skeleton, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from './lib/auth';
import { AdminShell } from './components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type MetricKey = 'tenders' | 'published' | 'providers' | 'contracts' | null;

const METRIC_LABELS: Record<NonNullable<MetricKey>, string> = {
  tenders: 'Procesos totales',
  published: 'Procesos publicados',
  providers: 'Proveedores',
  contracts: 'Contratos',
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<{ tenders: number; tendersPublished: number; providers: number; contracts: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(null);
  const [detailData, setDetailData] = useState<{ data: unknown[]; total: number; page: number; pageSize: number } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPage, setDetailPage] = useState(1);
  const token = getToken();

  useEffect(() => {
    if (token) setToken(token);
    api.getAnalyticsPublic().then(setMetrics).catch(() => setMetrics(null)).finally(() => setLoading(false));
  }, [token]);

  const loadDetail = useCallback((metric: NonNullable<MetricKey>, page = 1) => {
    setDetailLoading(true);
    const pageSize = 20;

    if (metric === 'tenders' || metric === 'published') {
      api
        .getTenders({ page, pageSize })
        .then((res) =>
          setDetailData({
            data: res.data,
            total: res.total ?? res.data.length,
            page: res.page ?? page,
            pageSize: res.pageSize ?? pageSize,
          })
        )
        .catch(() => setDetailData(null))
        .finally(() => setDetailLoading(false));
      return;
    }

    if (metric === 'providers') {
      api
        .getProviders()
        .then((res) => setDetailData({ data: res.data, total: res.data.length, page, pageSize: res.data.length || pageSize }))
        .catch(() => setDetailData(null))
        .finally(() => setDetailLoading(false));
      return;
    }

    if (metric === 'contracts') {
      // Usar el mismo listado público de contratos adjudicados que en el portal ciudadano
      api
        .getContractsPublic({ page, pageSize })
        .then((res) => setDetailData(res))
        .catch(() => setDetailData(null))
        .finally(() => setDetailLoading(false));
      return;
    }

    api
      .getAnalyticsPublicDetail({ metric, page, pageSize })
      .then(setDetailData)
      .catch(() => setDetailData(null))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    if (selectedMetric) loadDetail(selectedMetric, detailPage);
  }, [selectedMetric, detailPage, loadDetail]);

  const handleCardClick = (metric: NonNullable<MetricKey>) => {
    if (selectedMetric === metric) {
      setSelectedMetric(null);
      return;
    }
    setDetailPage(1);
    setDetailData(null);
    setSelectedMetric(metric);
  };

  if (!token) {
    return (
      <AdminShell activeId="inicio">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
          <Card title="Inicie sesión">
            <p className="mb-4 text-gray-600">Para acceder al panel de administración, inicie sesión con rol admin.</p>
            <Link href="/login"><button type="button" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Iniciar sesión</button></Link>
          </Card>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeId="inicio">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><Skeleton lines={2} /></Card>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-neutral-500">Haga clic en una tarjeta para ver el detalle.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => handleCardClick('tenders')}
                className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedMetric === 'tenders' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200'
                }`}
              >
                <p className="text-2xl font-semibold text-blue-600">{metrics?.tenders ?? 0}</p>
                <p className="text-sm font-medium text-neutral-600">Procesos totales</p>
              </button>
              <button
                type="button"
                onClick={() => handleCardClick('published')}
                className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedMetric === 'published' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200'
                }`}
              >
                <p className="text-2xl font-semibold text-green-600">{metrics?.tendersPublished ?? 0}</p>
                <p className="text-sm font-medium text-neutral-600">Procesos publicados</p>
              </button>
              <button
                type="button"
                onClick={() => handleCardClick('providers')}
                className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedMetric === 'providers' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200'
                }`}
              >
                <p className="text-2xl font-semibold text-neutral-800">{metrics?.providers ?? 0}</p>
                <p className="text-sm font-medium text-neutral-600">Proveedores</p>
              </button>
              <button
                type="button"
                onClick={() => handleCardClick('contracts')}
                className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedMetric === 'contracts' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200'
                }`}
              >
                <p className="text-2xl font-semibold text-neutral-800">{metrics?.contracts ?? 0}</p>
                <p className="text-sm font-medium text-neutral-600">Contratos</p>
              </button>
            </div>

            {selectedMetric && (
              <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">
                      Detalle: {METRIC_LABELS[selectedMetric]}
                    </h2>
                    {selectedMetric === 'tenders' && (
                      <p className="mt-1 text-sm text-neutral-500">
                        Listado de procesos publicados (el total incluye también borradores no publicados).
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedMetric(null)}>
                    Cerrar detalle
                  </Button>
                </div>
                {detailLoading ? (
                  <Skeleton lines={5} />
                ) : detailData && detailData.data.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px] text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 text-left text-neutral-600">
                            {selectedMetric === 'tenders' || selectedMetric === 'published' ? (
                              <>
                                <th className="pb-2 pr-4 font-medium">Título</th>
                                <th className="pb-2 pr-4 font-medium">Estado</th>
                                <th className="pb-2 pr-4 font-medium">Método</th>
                                <th className="pb-2 pr-4 font-medium">Año / Entidad</th>
                                <th className="pb-2 font-medium">Publicado</th>
                              </>
                            ) : selectedMetric === 'providers' ? (
                              <>
                                <th className="pb-2 pr-4 font-medium">Nombre / Razón social</th>
                                <th className="pb-2 pr-4 font-medium">Identificador</th>
                                <th className="pb-2 font-medium">Fecha registro</th>
                              </>
                            ) : (
                              <>
                                <th className="pb-2 pr-4 font-medium">Proceso</th>
                                <th className="pb-2 pr-4 font-medium">Proveedor</th>
                                <th className="pb-2 font-medium">Fecha firma</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(detailData.data as Array<Record<string, unknown>>).map((row, i) => (
                            <tr key={(row.id as string) || i} className="border-b border-neutral-100">
                              {selectedMetric === 'tenders' || selectedMetric === 'published' ? (
                                <>
                                  <td className="py-2 pr-4">
                                    <Link
                                      href={`/procesos/${row.id}`}
                                      className="text-blue-600 underline-offset-2 hover:underline"
                                    >
                                      {(row.title as string) || '—'}
                                    </Link>
                                  </td>
                                  <td className="py-2 pr-4">{String(row.status || '—')}</td>
                                  <td className="py-2 pr-4">{String(row.procurementMethod || '—')}</td>
                                  <td className="py-2 pr-4">
                                    {row.procurementPlan && typeof row.procurementPlan === 'object'
                                      ? `${(row.procurementPlan as { year?: number }).year || '—'} · ${((row.procurementPlan as { entity?: { name?: string } }).entity?.name) || '—'}`
                                      : '—'}
                                  </td>
                                  <td className="py-2">
                                    {row.publishedAt
                                      ? new Date(row.publishedAt as string).toLocaleDateString('es-EC')
                                      : '—'}
                                  </td>
                                </>
                              ) : selectedMetric === 'providers' ? (
                                <>
                                  <td className="py-2 pr-4">{String(row.name || row.legalName || '—')}</td>
                                  <td className="py-2 pr-4">{String(row.identifier || '—')}</td>
                                  <td className="py-2">
                                    {row.createdAt
                                      ? new Date(row.createdAt as string).toLocaleDateString('es-EC')
                                      : '—'}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 pr-4">
                                    {row.tender && typeof row.tender === 'object'
                                      ? (row.tender as { title?: string }).title || '—'
                                      : '—'}
                                  </td>
                                  <td className="py-2 pr-4">
                                    {row.provider && typeof row.provider === 'object'
                                      ? `${(row.provider as { name?: string }).name || '—'} ${((row.provider as { identifier?: string }).identifier ? `(${(row.provider as { identifier?: string }).identifier})` : '')}`
                                      : '—'}
                                  </td>
                                  <td className="py-2">
                                    {row.signedAt
                                      ? new Date(row.signedAt as string).toLocaleDateString('es-EC')
                                      : '—'}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
                      <span>
                        Mostrando {(detailPage - 1) * detailData.pageSize + 1}–{Math.min(detailPage * detailData.pageSize, detailData.total)} de {detailData.total}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={detailPage <= 1}
                          onClick={() => setDetailPage((p) => p - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={detailPage * detailData.pageSize >= detailData.total}
                          onClick={() => setDetailPage((p) => p + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-neutral-500">No hay registros para mostrar.</p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
