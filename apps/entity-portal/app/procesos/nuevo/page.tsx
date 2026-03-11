'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getEntityId } from '../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function NuevoProcesoPage() {
  const router = useRouter();
  const [pacPlans, setPacPlans] = useState<Array<Record<string, unknown>>>([]);
  const [procurementPlanId, setProcurementPlanId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();
  const entityId = getEntityId();

  useEffect(() => {
    if (token) setToken(token);
    if (entityId) {
      api.getPac({ entityId }).then((r) => {
        setPacPlans(r.data as Array<Record<string, unknown>>);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [token, entityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!procurementPlanId || !title.trim()) { setError('Plan y título son obligatorios'); return; }
    setSaving(true);
    try {
      await api.createTender({ procurementPlanId, title: title.trim(), description: description.trim() || undefined });
      router.push('/procesos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        <Card title="Nuevo proceso">
          {!token || !entityId ? (
            <p className="text-gray-600">Inicie sesión para crear procesos.</p>
          ) : loading ? (
            <p>Cargando…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium">Plan PAC</label>
              <select value={procurementPlanId} onChange={(e) => setProcurementPlanId(e.target.value)} className="w-full rounded border p-2" required>
                <option value="">Seleccione plan</option>
                {pacPlans.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>{`PAC ${p.year} – ${(p.entity as { name?: string })?.name || ''}`}</option>
                ))}
              </select>
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>Crear proceso</Button>
            </form>
          )}
        </Card>
      </div>
    </EntityShell>
  );
}
