'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '../../../components/AdminShell';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type GptSercopAnalysis } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function AdminOfertasProcesoPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const token = getToken();

  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [offers, setOffers] = useState<Array<any>>([]);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [clarSubject, setClarSubject] = useState('');
  const [clarMessage, setClarMessage] = useState('');
  const [clarifications, setClarifications] = useState<Array<any>>([]);
  const [analysis, setAnalysis] = useState<GptSercopAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [t, o] = await Promise.all([api.getTender(tenderId), api.listOffers({ tenderId })]);
      setTender(t as any);
      setOffers(o.data as any);
    } finally {
      setLoading(false);
    }
  };

  const refreshClarifications = async (offerId: string) => {
    const r = await api.listOfferClarifications(offerId);
    setClarifications(r.data as any);
  };

  useEffect(() => {
    if (token) setToken(token);
    refresh().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenderId, token]);

  useEffect(() => {
    if (!tenderId) return;
    setAnalysisLoading(true);
    api.analyzeProcurement({ tenderId })
      .then((r) => setAnalysis(r))
      .catch(() => setAnalysis(null))
      .finally(() => setAnalysisLoading(false));
  }, [tenderId]);

  return (
    <AdminShell activeId="procesos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        <h1 className="mb-4 text-2xl font-semibold">Ofertas del proceso</h1>
        {!tender ? <p>Cargando…</p> : (
          <Card title={String((tender as any).title)}>
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary-light p-3">
              <div className="mb-1 text-sm font-semibold text-text-primary">GPTsercop · Análisis asistido</div>
              {analysisLoading ? (
                <p className="text-sm text-text-secondary">Generando análisis…</p>
              ) : !analysis ? (
                <p className="text-sm text-text-secondary">Análisis no disponible para este entorno.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">{analysis.summary}</p>
                  {analysis.riskFlags.length > 0 && (
                    <p className="text-xs text-text-secondary">
                      Riesgos: {analysis.riskFlags.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
            {loading ? <p>Cargando…</p> : offers.length === 0 ? (
              <p className="text-text-secondary">No hay ofertas.</p>
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
                  <div className="mb-2 text-sm font-semibold text-text-primary">Acciones</div>
                  {!selectedOffer ? (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-text-secondary">
                      Seleccione una oferta.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-neutral-200 p-3 text-sm">
                        <div className="font-semibold text-text-primary">Manifest</div>
                        <div className="break-all text-xs text-text-secondary">{String(selectedOffer.manifestHash)}</div>
                      </div>

                      <div className="rounded-lg border border-neutral-200 p-3">
                        <div className="mb-2 text-sm font-semibold text-text-primary">Cambiar estado</div>
                        <Input label="Nuevo estado" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} />
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
                          <Button type="button" variant="outline" size="sm" onClick={refresh}>Refrescar</Button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-neutral-200 p-3">
                        <div className="mb-2 text-sm font-semibold text-text-primary">Solicitar aclaración</div>
                        <Input label="Asunto" value={clarSubject} onChange={(e) => setClarSubject(e.target.value)} />
                        <Input label="Mensaje" value={clarMessage} onChange={(e) => setClarMessage(e.target.value)} />
                        <div className="mt-2">
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
          </Card>
        )}
      </div>
    </AdminShell>
  );
}

