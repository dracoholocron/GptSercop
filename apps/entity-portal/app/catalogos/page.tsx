'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, Select } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import type { Catalog } from '@sercop/api-client';
import { getToken, getEntityId } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function CatalogosPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [catalogType, setCatalogType] = useState('electronico');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();
  const entityId = getEntityId();

  const load = () => {
    if (!entityId) return;
    api
      .listCatalogs({ entityId, pageSize: 50 })
      .then((r) => {
        setCatalogs(r.data);
        setTotal(r.total);
      })
      .catch(() => setCatalogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) setToken(token);
    if (entityId) {
      setLoading(true);
      load();
    } else setLoading(false);
  }, [token, entityId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await api.createCatalog({
        entityId: entityId || undefined,
        catalogType: catalogType || 'electronico',
        name: name.trim(),
        description: description.trim() || undefined,
        status: 'draft',
      });
      setShowCreate(false);
      setCatalogType('electronico');
      setName('');
      setDescription('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear catálogo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="catalogos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Catálogos</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : !entityId ? (
          <Card title="Seleccione entidad">
            <Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : (
          <>
            <div className="mb-4">
              <Button onClick={() => setShowCreate(!showCreate)}>Nuevo catálogo</Button>
            </div>
            {showCreate && (
              <Card title="Nuevo catálogo" className="mb-4">
                <form onSubmit={handleCreate} className="space-y-4">
                  <Select
                    label="Tipo de catálogo"
                    value={catalogType}
                    onChange={(e) => setCatalogType(e.target.value)}
                    options={[
                      { value: 'electronico', label: 'Catálogo electrónico (todos los proveedores)' },
                      { value: 'dinamico_inclusivo', label: 'Catálogo dinámico inclusivo (MIPyMEs y economía popular solidaria)' },
                    ]}
                  />
                  <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Catálogo de bienes 2025" required />
                  <Input label="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción" />
                  {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Crear'}</Button>
                    <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setError(''); }}>Cancelar</Button>
                  </div>
                </form>
              </Card>
            )}
            {loading ? (
              <p>Cargando…</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Total: {total} catálogo(s)</p>
                {catalogs.length === 0 ? (
                  <Card variant="outline">
                    <p className="text-gray-500">No hay catálogos. Cree uno para gestionar ítems y órdenes de compra.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {catalogs.map((c) => (
                      <Card key={c.id} title={c.name} variant="outline">
                        <p className="text-sm text-gray-600">{c.description || '—'}</p>
                        <p className="mt-1 text-xs text-gray-500">Tipo: {c.catalogType === 'dinamico_inclusivo' ? 'Dinámico inclusivo' : 'Electrónico'} · Estado: {c.status}</p>
                        <div className="mt-3 flex gap-2">
                          <Link href={`/catalogos/${c.id}`}>
                            <Button variant="outline" size="sm">Ver ítems</Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </EntityShell>
  );
}
