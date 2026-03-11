'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function EditarProcesoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
    api.getTender(id).then((r) => {
      setTender(r as Record<string, unknown>);
      setTitle(String(r.title || ''));
      setDescription(String(r.description || ''));
    }).catch(() => setTender(null));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.updateTender(id, { title: title.trim(), description: description.trim() || undefined });
      router.push('/procesos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!tender ? <p>Cargando…</p> : (
          <Card title="Editar proceso">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>Guardar</Button>
            </form>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
