'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { setEntityId as persistEntityId, setToken as setAuthToken } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function EntityLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getEntities().then((r) => setEntities(r.data)).catch(() => {});
  }, []);

  const entityOptions: SelectOption[] = [{ value: '', label: 'Seleccione entidad' }, ...entities.map((e) => ({ value: e.id, label: e.name }))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('El correo es obligatorio'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Ingrese un correo electrónico válido'); return; }
    if (!selectedEntityId.trim()) { setError('Seleccione una entidad'); return; }
    setLoading(true);
    try {
      const res = await api.login(email.trim(), 'entity', undefined, selectedEntityId.trim());
      setToken(res.token);
      setAuthToken(res.token);
      persistEntityId(res.entityId || selectedEntityId.trim());
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EntityShell>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <Card title="Iniciar sesión (entidad)">
          <p className="mb-4 text-sm text-gray-600">Ingrese su correo y seleccione su entidad.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@entidad.gob.ec" />
            <Select label="Entidad" options={entityOptions} value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">Entrar</Button>
          </form>
        </Card>
      </div>
    </EntityShell>
  );
}
