'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type ProcessClaim } from '@sercop/api-client';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'UNDER_REVIEW', label: 'En revisión' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'REJECTED', label: 'Rechazado' },
];

export default function ReclamosPage() {
  const [claims, setClaims] = useState<ProcessClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [responseDraft, setResponseDraft] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const token = getToken();

  const load = () => {
    if (!token) return;
    setToken(token);
    setLoading(true);
    api.listProcessClaims(statusFilter ? { status: statusFilter } : undefined)
      .then((r) => { setClaims(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token, statusFilter]);

  const handleUpdate = async (id: string, status: string, response?: string) => {
    setUpdatingId(id);
    try {
      await api.updateProcessClaim(id, { status, response });
      setResponseDraft((prev) => ({ ...prev, [id]: '' }));
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminShell activeId="reclamos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-4 text-2xl font-semibold text-text-primary">Reclamos de proceso</h1>
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Plazo para cause estado:</strong> los proveedores tienen <strong>3 días</strong> desde la publicación o acto reclamado para presentar el reclamo. Una vez transcurridos los 3 días sin reclamo, las entidades pueden continuar con las siguientes etapas (adjudicación, suscripción de contrato) sin novedad.
        </div>
        {!token ? (
          <Card title="Inicie sesión"><Link href="/login" className="text-primary hover:underline">Ir a login</Link></Card>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Select
                label="Estado"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
            </div>
            {loading ? (
              <p className="text-text-secondary">Cargando…</p>
            ) : claims.length === 0 ? (
              <Card variant="outline"><p className="text-text-secondary">No hay reclamos que coincidan con el filtro.</p></Card>
            ) : (
              <div className="space-y-4">
                {claims.map((c) => (
                  <Card key={c.id} variant="outline">
                    <div className="space-y-2">
                      <p className="font-medium text-text-primary">{c.subject}</p>
                      <p className="text-sm text-text-secondary">{c.message}</p>
                      <p className="text-xs text-text-secondary">
                        Proceso: {c.tender?.title ?? c.tenderId} · Proveedor: {c.provider?.name ?? c.providerId} · Tipo: {c.kind} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                      {c.response && <p className="mt-2 rounded bg-neutral-100 p-2 text-sm text-text-secondary">Respuesta: {c.response}</p>}
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <Input
                          placeholder="Escribir respuesta..."
                          value={responseDraft[c.id] ?? ''}
                          onChange={(e) => setResponseDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          className="flex-1 min-w-[200px]"
                        />
                        <Select
                          options={STATUS_OPTIONS.filter((o) => o.value)}
                          value={c.status}
                          onChange={(e) => handleUpdate(c.id, e.target.value)}
                          className="w-36"
                          disabled={updatingId === c.id}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(c.id, c.status, (responseDraft[c.id] ?? '').trim() || undefined)}
                          disabled={updatingId === c.id}
                        >
                          {updatingId === c.id ? 'Guardando…' : 'Guardar'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
