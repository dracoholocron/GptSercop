'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../../../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function EditarEntidadPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [entity, setEntity] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ name: '', code: '', legalName: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
    api.getEntity(id).then((r) => {
      setEntity(r);
      setForm({ name: String(r.name || ''), code: String(r.code || ''), legalName: String(r.legalName || '') });
    }).catch(() => setEntity(null));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.updateEntity(id, { name: form.name.trim(), code: form.code.trim() || undefined, legalName: form.legalName.trim() || undefined });
      router.push('/entidades');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell activeId="entidades">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/entidades" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!entity ? <p>Cargando…</p> : (
          <Card title="Editar entidad">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label="Código" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              <Input label="Razón social" value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>Guardar</Button>
            </form>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
