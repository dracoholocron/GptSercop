'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  Skeleton,
  Button,
} from '@sercop/design-system';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api, setBaseUrl } from '@sercop/api-client';
import { PublicShell } from '../components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type MetricKey = 'tenders' | 'published' | 'providers' | 'contracts' | null;

const METRIC_LABELS: Record<NonNullable<MetricKey>, string> = {
  tenders: 'Procesos totales',
  published: 'Procesos publicados',
  providers: 'Proveedores registrados',
  contracts: 'Contratos adjudicados',
};

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function formatMonth(monthStr: string): string {
  const [, m] = monthStr.split('-');
  return MONTH_LABELS[m] || monthStr;
}

const CHART_COLORS = ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#9333ea', '#0d9488'];

export default function CifrasPage() {
  const [data, setData] = useState<{ tenders: number; tendersPublished: number; providers: number; contracts: number } | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(null);
  const [detailData, setDetailData] = useState<{ data: unknown[]; total: number; page: number; pageSize: number } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chartData, setChartData] = useState<{
    processesByMonth: Array<{ month: string; total: number; publicados: number }>;
    processesByType: Array<{ type: string; count: number }>;
    providersByMonth: Array<{ month: string; count: number }>;
    contractsByMonth: Array<{ month: string; count: number }>;
  } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMethod, setFilterMethod] = useState<string>('');
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    api.getAnalyticsPublic().then(setData).catch(() => setData(null));
  }, []);

  const loadCharts = useCallback(() => {
    setChartLoading(true);
    api
      .getAnalyticsPublicCharts({ year: filterYear, method: filterMethod || undefined })
      .then(setChartData)
      .catch(() => setChartData(null))
      .finally(() => setChartLoading(false));
  }, [filterYear, filterMethod]);

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  const loadDetail = useCallback((metric: NonNullable<MetricKey>, page = 1) => {
    setDetailLoading(true);
    const pageSize = 20;

    if (metric === 'tenders' || metric === 'published') {
      // Usar el endpoint público de procesos (siempre devuelve procesos publicados)
      api
        .getTenders({ page, pageSize })
        .then((res) =>
          setDetailData({
            data: res.data || [],
            total: res.total || 0,
            page: res.page || page,
            pageSize: res.pageSize || pageSize,
          }),
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

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  const methodOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'open', label: 'Abierto' },
    { value: 'LICITACION', label: 'Licitación' },
    { value: 'SUBASTA', label: 'Subasta' },
    { value: 'CATALOGO', label: 'Catálogo' },
    { value: 'contratacion_directa', label: 'Contratación directa' },
  ];

  return (
    <PublicShell activeId="cifras">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Contratación pública en cifras</h1>
        <p className="mb-8 text-text-secondary">Resumen de la actividad del sistema.</p>

        {!data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} variant="outline">
                <Skeleton lines={2} />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <section className="mb-10 rounded-xl bg-hero-bg p-6">
              <h2 className="mb-6 text-lg font-semibold text-text-primary">En números</h2>
              <p className="mb-4 text-sm text-text-secondary">Haga clic en una tarjeta para ver el detalle.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => handleCardClick('tenders')}
                  className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    selectedMetric === 'tenders' ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-200'
                  }`}
                >
                  <p className="text-3xl font-bold text-primary">{data.tenders}</p>
                  <p className="text-sm font-medium text-text-secondary">Procesos totales</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleCardClick('published')}
                  className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    selectedMetric === 'published' ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-200'
                  }`}
                >
                  <p className="text-3xl font-bold text-accent">{data.tendersPublished}</p>
                  <p className="text-sm font-medium text-text-secondary">Procesos publicados</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleCardClick('providers')}
                  className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    selectedMetric === 'providers' ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-200'
                  }`}
                >
                  <p className="text-3xl font-bold text-text-primary">{data.providers}</p>
                  <p className="text-sm font-medium text-text-secondary">Proveedores registrados</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleCardClick('contracts')}
                  className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    selectedMetric === 'contracts' ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-200'
                  }`}
                >
                  <p className="text-3xl font-bold text-text-primary">{data.contracts}</p>
                  <p className="text-sm font-medium text-text-secondary">Contratos adjudicados</p>
                </button>
              </div>
            </section>

            {selectedMetric && (
              <section className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      Detalle: {METRIC_LABELS[selectedMetric]}
                    </h2>
                    {selectedMetric === 'tenders' && (
                      <p className="mt-1 text-sm text-text-secondary">
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
                          <tr className="border-b border-neutral-200 text-left text-text-secondary">
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
                          {detailData.data.map((row: any, i: number) => (
                            <tr key={(row.id as string) || i} className="border-b border-neutral-100">
                              {selectedMetric === 'tenders' || selectedMetric === 'published' ? (
                                <>
                                  <td className="py-2 pr-4">
                                    <Link
                                      href={`/proceso/${row.id}`}
                                      className="text-primary underline-offset-2 hover:underline"
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
                    <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
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
                  <p className="text-text-secondary">No hay registros para el filtro seleccionado.</p>
                )}
              </section>
            )}

            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Gráficos por tipo y fecha</h2>
              <div className="mb-6 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Año:</span>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-text-primary"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Tipo de proceso:</span>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-text-primary"
                  >
                    {methodOptions.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {chartLoading ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[280px] rounded-lg bg-neutral-100">
                      <Skeleton lines={4} />
                    </div>
                  ))}
                </div>
              ) : chartData ? (
                <div className="space-y-10">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">Procesos por mes (total y publicados)</h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(chartData.processesByMonth || []).map((d) => ({
                            ...d,
                            name: formatMonth(d.month),
                          }))}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" name="Total creados" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="publicados" name="Publicados" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">Procesos por tipo / método</h3>
                    <div className="h-[280px] w-full max-w-md">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(chartData.processesByType || []).map((d) => ({ ...d, name: d.type || 'otro' }))}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ type, count }) => `${type}: ${count}`}
                          >
                            {(chartData.processesByType || []).map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">Proveedores registrados por mes</h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(chartData.providersByMonth || []).map((d) => ({ ...d, name: formatMonth(d.month) }))}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" name="Proveedores" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">Contratos adjudicados por mes</h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(chartData.contractsByMonth || []).map((d) => ({ ...d, name: formatMonth(d.month) }))}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" name="Contratos" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary">No se pudieron cargar los gráficos.</p>
              )}
            </section>
          </>
        )}
      </div>
    </PublicShell>
  );
}
