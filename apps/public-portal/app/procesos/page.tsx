'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, Select, type SelectOption, EmptyState, Skeleton, X, Badge } from '@sercop/design-system';
import { api, setBaseUrl, type Tender } from '@sercop/api-client';
import Link from 'next/link';
import { PublicShell } from '../components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const PAGE_SIZE = 10;

const METHOD_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Licitación' },
  { value: 'direct', label: 'Contratación directa' },
  { value: 'catalog', label: 'Catálogo electrónico' },
];

const PROCESS_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'licitacion', label: 'Licitación' },
  { value: 'contratacion_directa', label: 'Contratación directa' },
  { value: 'catalogo', label: 'Catálogo' },
  { value: 'sie', label: 'SIE' },
  { value: 'feria_inclusiva', label: 'Feria inclusiva' },
  { value: 'emergencia', label: 'Emergencia' },
];

const REGIME_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'ordinario', label: 'Ordinario' },
  { value: 'infima_cuantia', label: 'Ínfima cuantía' },
  { value: 'especial', label: 'Régimen especial' },
  { value: 'emergencia', label: 'Emergencia' },
];

const TERRITORY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todas' },
  { value: 'amazonia', label: 'Amazonía' },
  { value: 'galapagos', label: 'Galápagos' },
];

export default function ProcesosPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
  const [method, setMethod] = useState('');
  const [processType, setProcessType] = useState('');
  const [regime, setRegime] = useState('');
  const [entityId, setEntityId] = useState('');
  const [year, setYear] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [territoryPreference, setTerritoryPreference] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchTenders = (nextPage?: number) => {
    const p = nextPage ?? page;
    if (nextPage != null) setPage(nextPage);
    setLoading(true);
    const filters: Parameters<typeof api.getTenders>[0] = {
      page: p,
      pageSize: PAGE_SIZE,
    };
    if (method) filters.method = method;
    if (processType) filters.processType = processType;
    if (regime) filters.regime = regime;
    if (territoryPreference) filters.territoryPreference = territoryPreference;
    if (entityId) filters.entityId = entityId;
    if (year) filters.year = parseInt(year, 10);
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    api.getTenders(filters)
      .then((r) => {
        setTenders(r.data);
        setTotal(r.total ?? r.data.length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  useEffect(() => {
    api.getEntities().then((r) => setEntities(r.data)).catch(() => {});
  }, []);

  const handleSearch = () => {
    fetchTenders(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const entityOptions: SelectOption[] = [{ value: '', label: 'Todas las entidades' }, ...entities.map((e) => ({ value: e.id, label: e.name }))];

  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];
  if (method) activeFilters.push({ key: 'method', label: `Método: ${METHOD_OPTIONS.find((o) => o.value === method)?.label ?? method}`, onClear: () => setMethod('') });
  if (processType) activeFilters.push({ key: 'processType', label: `Tipo: ${PROCESS_TYPE_OPTIONS.find((o) => o.value === processType)?.label ?? processType}`, onClear: () => setProcessType('') });
  if (regime) activeFilters.push({ key: 'regime', label: `Régimen: ${REGIME_OPTIONS.find((o) => o.value === regime)?.label ?? regime}`, onClear: () => setRegime('') });
  if (territoryPreference) activeFilters.push({ key: 'territory', label: `Territorio: ${TERRITORY_OPTIONS.find((o) => o.value === territoryPreference)?.label ?? territoryPreference}`, onClear: () => setTerritoryPreference('') });
  if (entityId) activeFilters.push({ key: 'entity', label: `Entidad: ${entities.find((e) => e.id === entityId)?.name ?? entityId}`, onClear: () => setEntityId('') });
  if (year) activeFilters.push({ key: 'year', label: `Año: ${year}`, onClear: () => setYear('') });
  if (minAmount) activeFilters.push({ key: 'min', label: `Mín: $${minAmount}`, onClear: () => setMinAmount('') });
  if (maxAmount) activeFilters.push({ key: 'max', label: `Máx: $${maxAmount}`, onClear: () => setMaxAmount('') });

  const clearAllFilters = () => {
    setMethod('');
    setProcessType('');
    setRegime('');
    setTerritoryPreference('');
    setEntityId('');
    setYear('');
    setMinAmount('');
    setMaxAmount('');
    fetchTenders(1);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const handleExport = () => {
    const params = new URLSearchParams();
    params.set('format', 'csv');
    if (method) params.set('method', method);
    if (processType) params.set('processType', processType);
    if (regime) params.set('regime', regime);
    if (territoryPreference) params.set('territoryPreference', territoryPreference);
    if (entityId) params.set('entityId', entityId);
    if (year) params.set('year', year);
    if (minAmount) params.set('minAmount', minAmount);
    if (maxAmount) params.set('maxAmount', maxAmount);
    setExporting(true);
    fetch(`${apiBase}/api/v1/tenders/export?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('Error al exportar');
        return r.text();
      })
      .then((csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'procesos.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {})
      .finally(() => setExporting(false));
  };

  return (
    <PublicShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Buscar procesos</h1>

        <details className="mb-6 md:block">
          <summary className="cursor-pointer list-none text-text-secondary md:list-item md:cursor-default">Filtros</summary>
          <Card title="Filtros" variant="outline" className="mt-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select label="Método" options={METHOD_OPTIONS} value={method} onChange={(e) => setMethod(e.target.value)} />
              <Select label="Tipo de proceso" options={PROCESS_TYPE_OPTIONS} value={processType} onChange={(e) => setProcessType(e.target.value)} />
              <Select label="Régimen" options={REGIME_OPTIONS} value={regime} onChange={(e) => setRegime(e.target.value)} />
              <Select label="Preferencia territorial" options={TERRITORY_OPTIONS} value={territoryPreference} onChange={(e) => setTerritoryPreference(e.target.value)} />
              <Select label="Entidad" options={entityOptions} value={entityId} onChange={(e) => setEntityId(e.target.value)} />
              <Input label="Año" type="number" placeholder="Ej: 2025" value={year} onChange={(e) => setYear(e.target.value)} />
              <Input label="Monto mín. ($)" type="number" placeholder="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
              <Input label="Monto máx. ($)" type="number" placeholder="100000" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </div>
            <div className="mt-4">
              <Button variant="accent" onClick={handleSearch} disabled={loading}>Buscar</Button>
            </div>
          </Card>
        </details>

        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">Filtros activos:</span>
            {activeFilters.map((f) => (
              <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-sm text-primary">
                {f.label}
                <button type="button" onClick={f.onClear} aria-label="Quitar filtro" className="rounded p-0.5 hover:bg-primary/20">
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
            <button type="button" onClick={clearAllFilters} className="text-sm text-primary hover:underline">Limpiar todo</button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {loading ? 'Resultados' : `${total} proceso${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
          </h2>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || loading}>
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="outline"><Skeleton variant="card" /></Card>
            ))}
          </div>
        ) : tenders.length === 0 ? (
          <EmptyState
            title="No hay procesos que coincidan"
            description="Pruebe otros filtros o limpie la búsqueda."
            action={{ label: 'Limpiar filtros', onClick: clearAllFilters }}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {tenders.map((t) => (
                <Link key={t.id} href={`/proceso/${t.id}`} className="block">
                  <Card
                    title={t.title}
                    variant="interactive"
                    className="h-full transition-shadow"
                  >
                    <div className="mb-2 flex flex-wrap gap-1">
                      {t.processType && (
                        <Badge variant="default">
                          {PROCESS_TYPE_OPTIONS.find((o) => o.value === t.processType)?.label ?? t.processType}
                        </Badge>
                      )}
                      {(t.territoryPreference === 'amazonia' || t.territoryPreference === 'galapagos') && (
                        <Badge variant="success">
                          {t.territoryPreference === 'amazonia' ? 'Amazonía' : 'Galápagos'}
                        </Badge>
                      )}
                    </div>
                    {(t.referenceBudgetAmount != null || t.bidsDeadlineAt) && (
                      <p className="mb-1 text-xs text-text-secondary">
                        {t.referenceBudgetAmount != null && `Presupuesto ref.: $${Number(t.referenceBudgetAmount).toLocaleString()}`}
                        {t.referenceBudgetAmount != null && t.bidsDeadlineAt && ' · '}
                        {t.bidsDeadlineAt && `Cierre: ${new Date(t.bidsDeadlineAt).toLocaleDateString('es-EC')}`}
                      </p>
                    )}
                    <p className="text-sm text-text-secondary line-clamp-2">{t.description || '—'}</p>
                    <span className="mt-2 inline-block text-sm font-medium text-accent">Ver detalle</span>
                  </Card>
                </Link>
              ))}
            </div>
            {total > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-neutral-200 pt-4">
                <span className="text-sm text-text-secondary">
                  Mostrando {from}–{to} de {total} resultados
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => fetchTenders(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchTenders(page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
                <span className="text-sm text-text-secondary">
                  Página {page} de {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
