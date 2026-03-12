'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SupplierShell } from '../../components/SupplierShell';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type Offer, type OfferClarification } from '@sercop/api-client';
import { getToken, getProviderId } from '../../lib/auth';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function OfertaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const token = getToken();
  const providerId = getProviderId();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [clarifications, setClarifications] = useState<OfferClarification[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseByClar, setResponseByClar] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const load = async () => {
    if (!providerId) return;
    try {
      const [offersRes, clarRes] = await Promise.all([
        api.listOffers({ providerId }),
        api.listOfferClarifications(offerId).catch(() => ({ data: [] })),
      ]);
      const found = offersRes.data.find((o) => o.id === offerId);
      setOffer(found || null);
      setClarifications((clarRes as { data: OfferClarification[] }).data);
    } catch {
      setOffer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) setToken(token);
    load();
  }, [offerId, token, providerId]);

  const handleRespond = async (clarificationId: string) => {
    const text = responseByClar[clarificationId]?.trim();
    if (!text) return;
    setError('');
    setRespondingId(clarificationId);
    try {
      await api.respondOfferClarification(offerId, clarificationId, text);
      setResponseByClar((prev) => ({ ...prev, [clarificationId]: '' }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar respuesta');
    } finally {
      setRespondingId(null);
    }
  };

  if (!token || !providerId) {
    return (
      <SupplierShell activeId="ofertas">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <p className="text-text-secondary">Debe iniciar sesión con su RUC para ver esta oferta.</p>
          <Link href="/login" className="mt-2 inline-block text-primary hover:underline">Ir a login</Link>
        </div>
      </SupplierShell>
    );
  }

  if (loading) {
    return (
      <SupplierShell activeId="ofertas">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6"><p className="text-text-secondary">Cargando…</p></div>
      </SupplierShell>
    );
  }

  if (!offer) {
    return (
      <SupplierShell activeId="ofertas">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <p className="text-text-secondary">Oferta no encontrada o no corresponde a su proveedor.</p>
          <Link href="/ofertas" className="mt-2 inline-block"><Button variant="secondary" size="sm">← Volver a Mis ofertas</Button></Link>
        </div>
      </SupplierShell>
    );
  }

  const openClarifications = clarifications.filter((c) => c.status === 'OPEN');

  return (
    <SupplierShell activeId="ofertas">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/ofertas" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver a Mis ofertas</Button></Link>
        <Card title={offer.receiptFolio} variant="outline">
          <div className="space-y-2 text-sm text-text-secondary">
            <p><span className="font-medium text-text-primary">Estado:</span> {offer.status}</p>
            <p><span className="font-medium text-text-primary">Enviada:</span> {new Date(offer.submittedAt).toLocaleString()}</p>
            {offer.tenderId && (
              <Link href={`/procesos/${offer.tenderId}/oferta`} className="text-primary hover:underline">Ver proceso</Link>
            )}
          </div>
        </Card>

        <Card title="Aclaraciones" variant="outline" className="mt-6">
          {clarifications.length === 0 ? (
            <p className="text-sm text-text-secondary">No hay aclaraciones para esta oferta.</p>
          ) : (
            <div className="space-y-4">
              {clarifications.map((c) => (
                <div key={c.id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="font-medium text-text-primary">{c.subject}</div>
                  <div className="mt-1 text-sm text-text-secondary">{c.message}</div>
                  {c.response ? (
                    <div className="mt-2 rounded bg-neutral-50 p-2 text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">Su respuesta:</span> {c.response}
                    </div>
                  ) : c.status === 'OPEN' && (
                    <div className="mt-3">
                      <Input
                        label="Su respuesta"
                        value={responseByClar[c.id] ?? ''}
                        onChange={(e) => setResponseByClar((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Escriba aquí su respuesta..."
                        disabled={respondingId !== null && respondingId !== c.id}
                      />
                      <Button
                        className="mt-2"
                        size="sm"
                        variant="accent"
                        disabled={!(responseByClar[c.id]?.trim()) || respondingId !== null}
                        onClick={() => handleRespond(c.id)}
                      >
                        {respondingId === c.id ? 'Enviando…' : 'Enviar respuesta'}
                      </Button>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-text-secondary">Estado: {c.status}</div>
                </div>
              ))}
            </div>
          )}
          {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
        </Card>
      </div>
    </SupplierShell>
  );
}
