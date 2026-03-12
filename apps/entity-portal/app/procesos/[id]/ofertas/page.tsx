'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function OfertasPage() {
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [offers, setOffers] = useState<Array<any>>([]);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [clarifications, setClarifications] = useState<Array<any>>([]);
  const [clarSubject, setClarSubject] = useState('');
  const [clarMessage, setClarMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
    Promise.all([api.getTender(id), api.listOffers({ tenderId: id })]).then(([tRes, oRes]) => {
      setTender(tRes as Record<string, unknown>);
      setOffers(oRes.data as Array<any>);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const refreshClarifications = async (offerId: string) => {
    const r = await api.listOfferClarifications(offerId);
    setClarifications(r.data as Array<any>);
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link href="/procesos"><Button variant="secondary" size="sm">← Volver</Button></Link>
          {tender && <Link href={`/procesos/${id}/aclaraciones`}><Button variant="outline" size="sm">Preguntas del proceso</Button></Link>}
        </div>
        {!tender ? <p>Cargando…</p> : (
          <Card title={`Ofertas – ${tender.title}`}>
            {loading ? <p>Cargando…</p> : offers.length === 0 ? (
              <p className="text-gray-500">No hay ofertas presentadas.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-semibold text-text-primary">Ofertas</div>
                  <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
                    {offers.map((o) => (
                      <button
                        key={String(o.id)}
                        type="button"
                        onClick={async () => { setSelectedOffer(o); setNewStatus(String(o.status)); await refreshClarifications(String(o.id)); }}
                        className={`flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-neutral-50 ${selectedOffer?.id === o.id ? 'bg-primary-light' : ''}`}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-text-primary">{String(o.receiptFolio)}</div>
                          <div className="text-xs text-text-secondary truncate">Proveedor: {String(o.providerId)}</div>
                        </div>
                        <div className="text-xs text-text-secondary">{String(o.status)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-text-primary">Detalle / acciones</div>
                  {!selectedOffer ? (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-text-secondary">
                      Seleccione una oferta para revisar.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-neutral-200 p-3 text-sm">
                        <div className="font-semibold text-text-primary">Estado actual</div>
                        <div className="text-text-secondary">{String(selectedOffer.status)}</div>
                        <div className="mt-2 font-semibold text-text-primary">Manifest</div>
                        <div className="break-all text-xs text-text-secondary">{String(selectedOffer.manifestHash)}</div>
                      </div>

                      <div className="rounded-lg border border-neutral-200 p-3">
                        <div className="mb-2 text-sm font-semibold text-text-primary">Cambiar estado</div>
                        <Input label="Nuevo estado" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="under_review / awarded / rejected ..." />
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={async () => {
                              setError('');
                              try {
                                const updated = await api.setOfferStatus(String(selectedOffer.id), newStatus);
                                setSelectedOffer(updated as any);
                                setOffers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                              } catch (e) {
                                setError(e instanceof Error ? e.message : 'Error al actualizar estado');
                              }
                            }}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-neutral-200 p-3">
                        <div className="mb-2 text-sm font-semibold text-text-primary">Solicitar aclaración</div>
                        <Input label="Asunto" value={clarSubject} onChange={(e) => setClarSubject(e.target.value)} placeholder="Ej. Documento faltante" />
                        <Input label="Mensaje" value={clarMessage} onChange={(e) => setClarMessage(e.target.value)} placeholder="Detalle de lo requerido..." />
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="accent"
                            onClick={async () => {
                              setError('');
                              try {
                                await api.requestOfferClarification(String(selectedOffer.id), { subject: clarSubject, message: clarMessage });
                                setClarSubject('');
                                setClarMessage('');
                                await refreshClarifications(String(selectedOffer.id));
                              } catch (e) {
                                setError(e instanceof Error ? e.message : 'Error al solicitar aclaración');
                              }
                            }}
                          >
                            Enviar
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-neutral-200 p-3">
                        <div className="mb-2 text-sm font-semibold text-text-primary">Aclaraciones</div>
                        {clarifications.length === 0 ? (
                          <div className="text-sm text-text-secondary">No hay aclaraciones.</div>
                        ) : (
                          <div className="space-y-2">
                            {clarifications.map((c) => (
                              <div key={String(c.id)} className="rounded border border-neutral-200 p-2 text-sm">
                                <div className="font-medium text-text-primary">{String(c.subject)} <span className="text-xs text-text-secondary">({String(c.status)})</span></div>
                                <div className="text-text-secondary">{String(c.message)}</div>
                                {c.response ? <div className="mt-1 text-xs text-text-secondary">Respuesta: {String(c.response)}</div> : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {error && <p className="text-sm text-error" role="alert">{error}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/procesos/${id}/evaluaciones`}><Button variant="outline" size="sm">Evaluaciones</Button></Link>
            <Link href={`/procesos/${id}/contrato`}><Button size="sm">Crear contrato</Button></Link>
          </div>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
