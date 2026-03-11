'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getProviderId } from '../../../lib/auth';
import Link from 'next/link';
import { SupplierShell } from '../../../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function OfertaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const token = getToken();
  const providerId = getProviderId();

  useEffect(() => {
    if (token) setToken(token);
    api.getTender(id).then(setTender).catch(() => setTender(null));
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!providerId) { setError('Debe iniciar sesión con su RUC para vincular su proveedor'); return; }
    setLoading(true);
    try {
      await api.createBid(id, { providerId, amount: amount ? parseFloat(amount) : undefined });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar oferta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupplierShell activeId="procesos">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!tender ? <p>Cargando…</p> : (
          <Card title={String(tender.title)}>
            <p className="mb-4 text-gray-600">{String(tender.description || '—')}</p>
            {!token ? (
              <p className="text-gray-600">Debe <Link href="/login" className="text-blue-600 underline">iniciar sesión</Link> para presentar una oferta.</p>
            ) : !providerId ? (
              <p className="text-gray-600">Inicie sesión con su RUC para vincular su proveedor y poder presentar ofertas.</p>
            ) : success ? (
              <p className="text-green-600">Oferta enviada correctamente.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Monto ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                <Button type="submit" disabled={loading}>Enviar oferta</Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </SupplierShell>
  );
}
