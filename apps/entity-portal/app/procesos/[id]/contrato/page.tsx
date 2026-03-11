'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function ContratoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [bids, setBids] = useState<Array<Record<string, unknown>>>([]);
  const [providerId, setProviderId] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
    Promise.all([api.getTender(id), api.getTenderBids(id)]).then(([tRes, bRes]) => {
      setTender(tRes as Record<string, unknown>);
      setBids(bRes.data as Array<Record<string, unknown>>);
      if (bRes.data.length > 0) setProviderId(String((bRes.data[0] as Record<string, unknown>).providerId));
    }).catch(() => {});
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!providerId) { setError('Seleccione proveedor'); return; }
    setSaving(true);
    try {
      await api.createContract(id, {
        providerId,
        contractNo: contractNo.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
      });
      router.push('/procesos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear contrato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href={`/procesos/${id}/ofertas`} className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!tender ? <p>Cargando…</p> : (
          <Card title={`Crear contrato – ${tender.title}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium">Proveedor adjudicado</label>
              <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-full rounded border p-2" required>
                <option value="">Seleccione</option>
                {bids.map((b) => (
                  <option key={String(b.id)} value={String(b.providerId)}>
                    {String((b.provider as { name?: string })?.name || b.providerId)} – ${b.amount != null ? Number(b.amount).toLocaleString() : '—'}
                  </option>
                ))}
              </select>
              <Input label="Nº contrato" value={contractNo} onChange={(e) => setContractNo(e.target.value)} placeholder="CON-2025-001" />
              <Input label="Monto ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>Crear contrato</Button>
            </form>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
