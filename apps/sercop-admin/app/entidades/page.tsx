'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function EntidadesPage() {
  const [entities, setEntities] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', legalName: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();

  const fetchEntities = () => {
    if (token) setToken(token);
    api.getEntities().then((r) => { setEntities(r.data as Array<Record<string, unknown>>); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntities();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Nombre es obligatorio'); return; }
    setSaving(true);
    try {
      await api.createEntity({ name: form.name.trim(), code: form.code.trim() || undefined, legalName: form.legalName.trim() || undefined });
      setShowCreate(false);
      setForm({ name: '', code: '', legalName: '' });
      fetchEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell activeId="entidades">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Entidades</h1>
        {!token ? (
          <Card title="Inicie sesión"><Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link></Card>
        ) : (
          <>
            <div className="mb-4">
              <Button onClick={() => setShowCreate(!showCreate)}>Crear entidad</Button>
            </div>
            {showCreate && (
              <Card title="Nueva entidad" className="mb-4">
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input label="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                  <Input label="Código" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="Ej: M001" />
                  <Input label="Razón social" value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={saving}>Crear</Button>
                </form>
              </Card>
            )}
            {loading ? <p>Cargando…</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead><tr><th className="px-4 py-2 text-left text-sm font-medium">Nombre</th><th className="px-4 py-2 text-left text-sm font-medium">Código</th><th className="px-4 py-2"></th></tr></thead>
                  <tbody>
                    {entities.map((e) => (
                      <tr key={String(e.id)} className="border-b">
                        <td className="px-4 py-2">{String(e.name)}</td>
                        <td className="px-4 py-2">{String(e.code || '—')}</td>
                        <td className="px-4 py-2"><Link href={`/entidades/${e.id}/editar`} className="text-blue-600 hover:underline">Editar</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
