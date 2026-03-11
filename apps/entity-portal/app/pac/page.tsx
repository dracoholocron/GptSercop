'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getEntityId } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function PacPage() {
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
  const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [year, setYear] = useState('');
  const [entityId, setEntityId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();
  const currentEntityId = getEntityId();

  useEffect(() => {
    if (token) setToken(token);
    api.getPac(currentEntityId ? { entityId: currentEntityId } : undefined).then((r) => {
      setPlans(r.data as Array<Record<string, unknown>>);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.getEntities().then((r) => setEntities(r.data)).catch(() => {});
  }, [token, currentEntityId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const eid = entityId || currentEntityId;
    if (!eid || !year) { setError('Entidad y año son obligatorios'); return; }
    const y = parseInt(year, 10);
    if (isNaN(y) || y < 2000) { setError('Año inválido'); return; }
    setSaving(true);
    try {
      await api.createPac({ entityId: eid, year: y });
      setShowCreate(false);
      setYear('');
      api.getPac(currentEntityId ? { entityId: currentEntityId } : undefined).then((r) => setPlans(r.data as Array<Record<string, unknown>>));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear PAC');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="pac">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Planes anuales de contratación (PAC)</h1>
        {!token ? (
          <Card title="Inicie sesión"><Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link></Card>
        ) : (
          <>
            <div className="mb-4">
              <Button onClick={() => setShowCreate(!showCreate)}>Crear PAC</Button>
            </div>
            {showCreate && (
              <Card title="Nuevo PAC" className="mb-4">
                <form onSubmit={handleCreate} className="space-y-4">
                  <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="rounded border p-2">
                    <option value="">{currentEntityId ? 'Usar entidad actual' : 'Seleccione entidad'}</option>
                    {entities.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <Input label="Año" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" required />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={saving}>Crear</Button>
                </form>
              </Card>
            )}
            {loading ? <p>Cargando…</p> : (
              <div className="grid gap-4 md:grid-cols-2">
                {plans.length === 0 && <p className="col-span-full text-gray-500">No hay PAC.</p>}
                {plans.map((p) => (
                  <Card key={String(p.id)} title={`PAC ${p.year}`}>
                    <p className="text-sm text-gray-600">Estado: {String(p.status)}</p>
                    <p className="text-sm">Entidad: {(p.entity as { name?: string })?.name || String(p.entityId)}</p>
                    <Link href={`/pac/${p.id}`} className="mt-2 inline-block"><Button size="sm" variant="outline">Ver detalle</Button></Link>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </EntityShell>
  );
}
