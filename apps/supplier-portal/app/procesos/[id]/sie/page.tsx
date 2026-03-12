'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SupplierShell } from '../../../components/SupplierShell';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken as setApiToken } from '@sercop/api-client';
import { getToken, getProviderId } from '../../../lib/auth';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const ACTIONS: SelectOption[] = [
  { value: 'INITIAL', label: 'Oferta inicial' },
  { value: 'BID', label: 'Puja' },
  { value: 'NEGOTIATION_FINAL', label: 'Negociación (oferta final)' },
];

export default function SiePage() {
  const params = useParams();
  const tenderId = params.id as string;
  const token = getToken();
  const providerId = getProviderId();

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'INITIAL' | 'BID' | 'NEGOTIATION_FINAL'>('INITIAL');
  const [amount, setAmount] = useState('');

  const bestAmount = useMemo(() => {
    const v = status?.bestBid?.amount;
    return typeof v === 'number' ? v : null;
  }, [status]);

  const refresh = async () => {
    try {
      if (token) setApiToken(token);
      const s = await api.sie.status(tenderId, providerId ?? undefined);
      setStatus(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al obtener estado SIE');
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenderId, token, providerId]);

  useEffect(() => {
    if (!polling) return;
    const t = setInterval(() => refresh(), 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling, tenderId, token, providerId]);

  const submit = async () => {
    setError('');
    if (!providerId) { setError('Debe iniciar sesión con su RUC (providerId)'); return; }
    const n = amount ? Number(amount) : NaN;
    if (!Number.isFinite(n) || n <= 0) { setError('Ingrese un monto válido'); return; }
    if (bestAmount != null && action !== 'INITIAL' && n >= bestAmount) {
      setError('La oferta debe ser menor que la mejor oferta actual.');
      return;
    }
    setLoading(true);
    try {
      if (token) setApiToken(token);
      if (action === 'INITIAL') await api.sie.submitInitial(tenderId, { providerId, amount: n });
      else if (action === 'BID') await api.sie.placeBid(tenderId, { providerId, amount: n });
      else await api.sie.submitNegotiationFinal(tenderId, { providerId, amount: n });
      await refresh();
      setAmount('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar oferta SIE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupplierShell activeId="procesos">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link href="/procesos" className="inline-block">
            <Button variant="secondary" size="sm">← Volver</Button>
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={() => setPolling((p) => !p)}>
            {polling ? 'Pausar actualización' : 'Reanudar actualización'}
          </Button>
        </div>

        <Card title="Subasta Inversa Electrónica (SIE) – MVP">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
              <div className="font-semibold text-text-primary">Estado</div>
              <div className="text-text-secondary">{status?.auction?.status ?? '—'}</div>
              <div className="mt-2 font-semibold text-text-primary">Mejor oferta</div>
              <div className="text-text-secondary">{bestAmount != null ? `$${bestAmount}` : '—'}</div>
              <div className="mt-2 font-semibold text-text-primary">Mi última</div>
              <div className="text-text-secondary">{status?.myLastBid?.amount != null ? `$${status.myLastBid.amount}` : '—'}</div>
            </div>

            <div className="space-y-3">
              {!token ? (
                <div className="text-sm text-text-secondary">
                  Debe <Link className="text-primary underline" href="/login">iniciar sesión</Link> para participar.
                </div>
              ) : !providerId ? (
                <div className="text-sm text-text-secondary">Inicie sesión con su RUC para vincular su proveedor.</div>
              ) : (
                <>
                  <Select label="Acción" options={ACTIONS} value={action} onChange={(e) => setAction(e.target.value as any)} />
                  <Input label="Monto ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                  <div className="flex gap-2">
                    <Button type="button" variant="accent" disabled={loading} onClick={submit}>
                      {loading ? 'Enviando…' : 'Enviar'}
                    </Button>
                    <Button type="button" variant="outline" disabled={loading} onClick={refresh}>Refrescar</Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
        </Card>
      </div>
    </SupplierShell>
  );
}

