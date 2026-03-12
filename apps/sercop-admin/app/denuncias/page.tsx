'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type Complaint } from '@sercop/api-client';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abierta' },
  { value: 'UNDER_REVIEW', label: 'En revisión' },
  { value: 'CLOSED', label: 'Cerrada' },
];

export default function DenunciasPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const token = getToken();

  const load = () => {
    if (!token) return;
    setToken(token);
    setLoading(true);
    api.listComplaints(statusFilter ? { status: statusFilter } : undefined)
      .then((r) => { setComplaints(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token, statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.updateComplaint(id, { status });
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminShell activeId="denuncias">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Denuncias</h1>
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
            ) : complaints.length === 0 ? (
              <Card variant="outline"><p className="text-text-secondary">No hay denuncias que coincidan con el filtro.</p></Card>
            ) : (
              <div className="space-y-4">
                {complaints.map((c) => (
                  <Card key={c.id} variant="outline">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary">{c.summary}</p>
                        {c.details && <p className="mt-1 text-sm text-text-secondary">{c.details}</p>}
                        <p className="mt-2 text-xs text-text-secondary">
                          Canal: {c.channel} · Categoría: {c.category} · {new Date(c.createdAt).toLocaleString()}
                          {c.tenderId && ` · Proceso: ${c.tenderId}`}
                          {c.contactEmail && ` · Contacto: ${c.contactEmail}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">{c.status}</span>
                        <Select
                          options={STATUS_OPTIONS.filter((o) => o.value)}
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          className="w-36"
                          disabled={updatingId === c.id}
                        />
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
