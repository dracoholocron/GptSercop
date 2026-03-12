'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import type { Catalog, CatalogItem } from '@sercop/api-client';
import { getToken } from '../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function CatalogDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemCpcCode, setItemCpcCode] = useState('');
  const [itemRefPrice, setItemRefPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }
    setToken(token);
    api
      .getCatalog(id)
      .then(setCatalog)
      .catch(() => setCatalog(null))
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!itemName.trim()) {
      setError('El nombre del ítem es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await api.createCatalogItem({
        catalogId: id,
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        unit: itemUnit.trim() || undefined,
        cpcCode: itemCpcCode.trim() || undefined,
        referencePrice: itemRefPrice.trim() ? parseFloat(itemRefPrice) : undefined,
      });
      setShowAddItem(false);
      setItemName('');
      setItemDescription('');
      setItemUnit('');
      setItemCpcCode('');
      setItemRefPrice('');
      const updated = await api.getCatalog(id);
      setCatalog(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar ítem');
    } finally {
      setSaving(false);
    }
  };

  const items: CatalogItem[] = catalog?.items ?? [];

  return (
    <EntityShell activeId="catalogos">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/catalogos" className="mb-4 inline-block text-sm text-blue-600 hover:underline">← Volver a catálogos</Link>
        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : loading ? (
          <p>Cargando…</p>
        ) : !catalog ? (
          <Card title="Error"><p className="text-gray-600">Catálogo no encontrado.</p></Card>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-semibold">{catalog.name}</h1>
            <p className="mb-4 text-sm text-gray-600">{catalog.description || '—'} · Estado: {catalog.status}</p>

            <div className="mb-4">
              <Button onClick={() => setShowAddItem(!showAddItem)}>Agregar ítem</Button>
            </div>
            {showAddItem && (
              <Card title="Nuevo ítem" className="mb-4">
                <form onSubmit={handleAddItem} className="space-y-3">
                  <Input label="Nombre" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ej. Laptop" required />
                  <Input label="Descripción (opcional)" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} />
                  <Input label="Unidad (opcional)" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} placeholder="Ej. unidad" />
                  <Input label="Código CPC (opcional)" value={itemCpcCode} onChange={(e) => setItemCpcCode(e.target.value)} placeholder="Ej. 30213100" />
                  <Input label="Precio referencia (opcional)" type="number" step="0.01" value={itemRefPrice} onChange={(e) => setItemRefPrice(e.target.value)} placeholder="0.00" />
                  {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Agregar'}</Button>
                    <Button type="button" variant="secondary" onClick={() => setShowAddItem(false)}>Cancelar</Button>
                  </div>
                </form>
              </Card>
            )}

            <Card title="Ítems del catálogo" variant="outline">
              {items.length === 0 ? (
                <p className="text-gray-500">No hay ítems. Agregue ítems para usar en órdenes de compra.</p>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {items.map((it) => (
                    <div key={it.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                      <div>
                        <div className="font-medium text-text-primary">{it.name}</div>
                        <div className="text-xs text-text-secondary">{it.description || '—'} · {it.unit || '—'} · CPC: {it.cpcCode || '—'} · Ref: {it.referencePrice != null ? it.referencePrice : '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </EntityShell>
  );
}
