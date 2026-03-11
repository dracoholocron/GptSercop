'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
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

export default function ProcesosPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
  const [method, setMethod] = useState('');
  const [entityId, setEntityId] = useState('');
  const [year, setYear] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const fetchTenders = (nextPage?: number) => {
    const p = nextPage ?? page;
    if (nextPage != null) setPage(nextPage);
    setLoading(true);
    const filters: Parameters<typeof api.getTenders>[0] = {
      page: p,
      pageSize: PAGE_SIZE,
    };
    if (method) filters.method = method;
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

  return (
    <PublicShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Buscar procesos</h1>

        <Card title="Filtros" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select label="Método" options={METHOD_OPTIONS} value={method} onChange={(e) => setMethod(e.target.value)} />
            <Select label="Entidad" options={entityOptions} value={entityId} onChange={(e) => setEntityId(e.target.value)} />
            <Input label="Año" type="number" placeholder="Ej: 2025" value={year} onChange={(e) => setYear(e.target.value)} />
            <Input label="Monto mín. ($)" type="number" placeholder="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            <Input label="Monto máx. ($)" type="number" placeholder="100000" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </div>
          <div className="mt-4">
            <Button onClick={handleSearch} disabled={loading}>Buscar</Button>
          </div>
        </Card>

        <h2 className="mb-4 text-lg font-semibold">Resultados</h2>
        {loading ? (
          <p>Cargando…</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {tenders.length === 0 && <p>No hay procesos que coincidan con los filtros.</p>}
              {tenders.map((t) => (
                <Card key={t.id} title={t.title}>
                  <p className="text-sm text-gray-600 line-clamp-2">{t.description || '—'}</p>
                  <Link href={`/proceso/${t.id}`} className="mt-2 inline-block">
                    <Button variant="outline" size="sm">Ver detalle</Button>
                  </Link>
                </Card>
              ))}
            </div>
            {total > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
                <span className="text-sm text-gray-600">
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
                <span className="text-sm text-gray-500">
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
