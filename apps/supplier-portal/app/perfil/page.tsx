'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type Provider } from '@sercop/api-client';
import { getToken, getProviderId } from '../lib/auth';
import Link from 'next/link';
import { SupplierShell } from '../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function PerfilPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [form, setForm] = useState({ name: '', identifier: '', legalName: '', tradeName: '', province: '', canton: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();
  const providerId = getProviderId();

  useEffect(() => {
    if (token) setToken(token);
    if (providerId) {
      api.getProvider(providerId).then((p) => {
        setProvider(p);
        setForm({
          name: p.name,
          identifier: p.identifier || '',
          legalName: p.legalName || '',
          tradeName: p.tradeName || '',
          province: p.province || '',
          canton: p.canton || '',
          address: p.address || '',
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [token, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;
    setError('');
    setSaving(true);
    try {
      await api.updateProvider(providerId, {
        name: form.name.trim() || undefined,
        identifier: form.identifier.trim() || undefined,
        legalName: form.legalName.trim() || undefined,
        tradeName: form.tradeName.trim() || undefined,
        province: form.province.trim() || undefined,
        canton: form.canton.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setProvider({ ...provider!, ...form });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SupplierShell activeId="perfil">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Mi perfil</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <p className="text-gray-600">Debe iniciar sesión para editar su perfil.</p>
            <Link href="/login" className="mt-2 inline-block text-blue-600 hover:underline">Ir a login</Link>
          </Card>
        ) : !providerId ? (
          <Card title="Proveedor no vinculado">
            <p className="text-gray-600">Inicie sesión con su RUC para vincular su proveedor.</p>
          </Card>
        ) : loading ? (
          <p>Cargando…</p>
        ) : !provider ? (
          <Card title="Proveedor no encontrado">
            <p className="text-gray-600">No se encontró el proveedor vinculado.</p>
          </Card>
        ) : (
          <Card title="Editar datos">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nombre / Razón social" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label="RUC / Identificador" value={form.identifier} onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))} />
              <Input label="Nombre legal" value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} />
              <Input label="Nombre comercial" value={form.tradeName} onChange={(e) => setForm((f) => ({ ...f, tradeName: e.target.value }))} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Provincia" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
                <Input label="Cantón" value={form.canton} onChange={(e) => setForm((f) => ({ ...f, canton: e.target.value }))} />
              </div>
              <Input label="Dirección" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <Button type="submit" disabled={saving}>Guardar cambios</Button>
            </form>
          </Card>
        )}
      </div>
    </SupplierShell>
  );
}
