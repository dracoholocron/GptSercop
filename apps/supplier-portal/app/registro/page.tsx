'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { setProviderId } from '../lib/auth';
import { SupplierShell } from '../components/SupplierShell';
import Link from 'next/link';

// Usar '' para same-origin (Next.js rewrites proxy /api -> backend)
setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', identifier: '', legalName: '', tradeName: '', province: '', canton: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    if (form.identifier.trim() && !/^\d{13}$/.test(form.identifier.trim())) { setError('El RUC debe tener 13 dígitos'); return; }
    setLoading(true);
    try {
      const provider = await api.createProvider({
        name: form.name.trim(),
        identifier: form.identifier.trim() || undefined,
        legalName: form.legalName.trim() || undefined,
        tradeName: form.tradeName.trim() || undefined,
        province: form.province.trim() || undefined,
        canton: form.canton.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setProviderId(provider.id);
      router.push('/login?registered=1');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar';
      setError(msg.includes('fetch') || msg.includes('Failed') ? 'No se pudo conectar con el servidor. Asegúrese de que la API esté ejecutándose (npm run dev).' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupplierShell activeId="registro">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Registro RUP (Registro Único de Proveedores)</h1>
        <Card title="Datos del proveedor">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre / Razón social *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Ej: Empresa XYZ S.A." />
            <Input label="RUC / Identificador" value={form.identifier} onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))} placeholder="Ej: 1234567890001" />
            <Input label="Nombre legal" value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} placeholder="Razón social legal" />
            <Input label="Nombre comercial" value={form.tradeName} onChange={(e) => setForm((f) => ({ ...f, tradeName: e.target.value }))} placeholder="Nombre de fantasía" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Provincia" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} placeholder="Pichincha" />
              <Input label="Cantón" value={form.canton} onChange={(e) => setForm((f) => ({ ...f, canton: e.target.value }))} placeholder="Quito" />
            </div>
            <Input label="Dirección" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Av. Principal 123" />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" disabled={loading}>Registrarme</Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            ¿Ya tiene cuenta? <Link href="/login" className="text-blue-600 hover:underline">Iniciar sesión</Link>
          </p>
        </Card>
      </div>
    </SupplierShell>
  );
}
