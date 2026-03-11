'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { setProviderId, setToken as setAuthToken } from '../lib/auth';
import Link from 'next/link';
import { SupplierShell } from '../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('El correo es obligatorio'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Ingrese un correo electrónico válido'); return; }
    if (identifier.trim() && !/^\d{13}$/.test(identifier.trim())) { setError('El RUC debe tener 13 dígitos'); return; }
    setLoading(true);
    try {
      const res = await api.login(email.trim(), 'supplier', identifier.trim() || undefined);
      setToken(res.token);
      setAuthToken(res.token);
      if (res.providerId) setProviderId(res.providerId);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupplierShell>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <Card title="Iniciar sesión">
        <p className="mb-4 text-sm text-gray-600">Ingrese su correo y opcionalmente su RUC para vincular su proveedor.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
          <Input label="RUC (opcional)" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Para vincular su proveedor" />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">Entrar</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          ¿No tiene cuenta? <Link href="/registro" className="text-blue-600 hover:underline">Registrarse</Link>
        </p>
      </Card>
    </div>
    </SupplierShell>
  );
}
