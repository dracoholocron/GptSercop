'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { setToken as setAuthToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('El correo es obligatorio'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Ingrese un correo electrónico válido'); return; }
    setLoading(true);
    try {
      const res = await api.login(email.trim(), 'admin');
      setToken(res.token);
      setAuthToken(res.token);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <Card title="Iniciar sesión (admin)">
          <p className="mb-4 text-sm text-gray-600">Ingrese su correo con rol administrador.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@sercop.gob.ec" />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">Entrar</Button>
          </form>
        </Card>
      </div>
    </AdminShell>
  );
}
