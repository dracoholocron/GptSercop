'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, Select } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import type { PurchaseOrder, Catalog } from '@sercop/api-client';
import { getToken, getEntityId } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function OrdenesCompraPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [catalogId, setCatalogId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();
  const entityId = getEntityId();

  const load = () => {
    if (!entityId) return;
    api
      .listPurchaseOrders({ entityId, pageSize: 50 })
      .then((r) => {
        setOrders(r.data);
        setTotal(r.total);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setToken(token);
    if (entityId) {
      setLoading(true);
      load();
      api.listCatalogs({ entityId, pageSize: 100 }).then((r) => setCatalogs(r.data)).catch(() => setCatalogs([]));
    } else setLoading(false);
  }, [token, entityId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!entityId) {
      setError('Debe iniciar sesión con una entidad');
      return;
    }
    setSaving(true);
    try {
      await api.createPurchaseOrder({
        entityId,
        orderNo: orderNo.trim() || undefined,
        totalAmount: totalAmount.trim() ? parseFloat(totalAmount) : undefined,
        catalogId: catalogId.trim() || undefined,
        status: 'draft',
      });
      setShowCreate(false);
      setOrderNo('');
      setTotalAmount('');
      setCatalogId('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear orden de compra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="ordenes-compra">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Órdenes de compra</h1>
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
              <Button onClick={() => setShowCreate(!showCreate)}>Nueva orden de compra</Button>
            </div>
            {showCreate && (
              <Card title="Nueva orden de compra" className="mb-4">
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input label="Número de orden (opcional)" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="OC-2025-001" />
                  <Input label="Monto total (opcional)" type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" />
                  <Select
                    label="Catálogo (opcional)"
                    value={catalogId}
                    onChange={(e) => setCatalogId(e.target.value)}
                    options={[{ value: '', label: '— Sin catálogo —' }, ...catalogs.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Crear'}</Button>
                    <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
                  </div>
                </form>
              </Card>
            )}
            {loading ? (
              <p>Cargando…</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Total: {total} orden(es)</p>
                {orders.length === 0 ? (
                  <Card variant="outline">
                    <p className="text-gray-500">No hay órdenes de compra. Cree una para asociar a catálogo o proceso.</p>
                  </Card>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 rounded-lg border border-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Nº orden</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Estado</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Monto</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Catálogo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 bg-white">
                        {orders.map((o) => (
                          <tr key={o.id}>
                            <td className="px-4 py-2 text-sm">{o.orderNo || '—'}</td>
                            <td className="px-4 py-2 text-sm">{o.status}</td>
                            <td className="px-4 py-2 text-sm">{o.totalAmount != null ? o.totalAmount : '—'}</td>
                            <td className="px-4 py-2 text-sm">{o.catalog?.name ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
