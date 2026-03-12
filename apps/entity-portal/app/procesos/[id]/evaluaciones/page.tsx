'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function EvaluacionesPage() {
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [bids, setBids] = useState<Array<Record<string, unknown>>>([]);
  const [evaluations, setEvaluations] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [bidId, setBidId] = useState('');
  const [technicalScore, setTechnicalScore] = useState('');
  const [financialScore, setFinancialScore] = useState('');
  const [baeScore, setBaeScore] = useState('');
  const [nationalPartScore, setNationalPartScore] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifyingBaeId, setVerifyingBaeId] = useState<string | null>(null);
  const [convalidationBidId, setConvalidationBidId] = useState<string | null>(null);
  const [convalidationResponseByBidId, setConvalidationResponseByBidId] = useState<Record<string, string>>({});
  const [rupBidId, setRupBidId] = useState<string | null>(null);
  const [rupStage, setRupStage] = useState<'opening' | 'award' | 'contract'>('opening');
  const [error, setError] = useState('');

  const load = async () => {
    const t = getToken();
    if (!t || !id) return;
    setToken(t);
    try {
      const [tRes, bRes, eRes] = await Promise.all([
        api.getTender(id),
        api.getTenderBids(id),
        api.getTenderEvaluations(id),
      ]);
      setTender(tRes as Record<string, unknown>);
      setBids((bRes as { data: unknown[] }).data as Array<Record<string, unknown>>);
      setEvaluations((eRes as { data: unknown[] }).data as Array<Record<string, unknown>>);
    } catch {
      setBids([]);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!bidId.trim()) {
      setError('Seleccione una oferta (bid)');
      return;
    }
    setSaving(true);
    try {
      await api.createEvaluation(id, {
        bidId: bidId.trim(),
        technicalScore: technicalScore.trim() ? parseFloat(technicalScore) : undefined,
        financialScore: financialScore.trim() ? parseFloat(financialScore) : undefined,
        baeScore: baeScore.trim() ? parseFloat(baeScore) : undefined,
        nationalPartScore: nationalPartScore.trim() ? parseFloat(nationalPartScore) : undefined,
        totalScore: totalScore.trim() ? parseFloat(totalScore) : undefined,
        status: 'completed',
      });
      setBidId('');
      setTechnicalScore('');
      setFinancialScore('');
      setBaeScore('');
      setNationalPartScore('');
      setTotalScore('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear evaluación');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyBae = async (bidId: string) => {
    setError('');
    setVerifyingBaeId(bidId);
    try {
      await api.verifyBidBae(bidId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar BAE');
    } finally {
      setVerifyingBaeId(null);
    }
  };

  const handleConvalidation = async (bidId: string, status: 'accepted' | 'rejected') => {
    setError('');
    setConvalidationBidId(bidId);
    const response = convalidationResponseByBidId[bidId]?.trim() || undefined;
    try {
      await api.patchConvalidation(bidId, { status, ...(response && { response }) });
      setConvalidationResponseByBidId((prev) => ({ ...prev, [bidId]: '' }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al responder convalidación');
    } finally {
      setConvalidationBidId(null);
    }
  };

  const handleVerifyRup = async (bidId: string) => {
    setError('');
    setRupBidId(bidId);
    try {
      await api.verifyRup(bidId, { stage: rupStage });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar RUP');
    } finally {
      setRupBidId(null);
    }
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link href={`/procesos/${id}`}><Button variant="secondary" size="sm">← Volver al proceso</Button></Link>
          <Link href={`/procesos/${id}/ofertas`}><Button variant="outline" size="sm">Ofertas</Button></Link>
          <Link href={`/procesos/${id}/contrato`}><Button variant="outline" size="sm">Contrato</Button></Link>
        </div>
        <h1 className="mb-2 text-2xl font-semibold">Evaluación de ofertas</h1>
        {tender && <p className="mb-4 text-sm text-gray-600">{String(tender.title)}</p>}

        {loading ? (
          <p>Cargando…</p>
        ) : (
          <>
            <Card title="Ofertas (bids)" variant="outline" className="mb-6">
              {bids.length === 0 ? (
                <p className="text-sm text-text-secondary">No hay ofertas (bids) para este proceso.</p>
              ) : (
                <ul className="space-y-3">
                  {bids.map((b) => {
                    const convalidationStatus = (b as { convalidationStatus?: string | null }).convalidationStatus;
                    const convalidationRequestedAt = (b as { convalidationRequestedAt?: string | null }).convalidationRequestedAt;
                    const convalidationErrorsDescription = (b as { convalidationErrorsDescription?: string | null }).convalidationErrorsDescription;
                    const convalidationResponse = (b as { convalidationResponse?: string | null }).convalidationResponse;
                    const rupOpening = (b as { rupVerifiedAtOpening?: string | null }).rupVerifiedAtOpening;
                    const rupAward = (b as { rupVerifiedAtAward?: string | null }).rupVerifiedAtAward;
                    const rupContract = (b as { rupVerifiedAtContract?: string | null }).rupVerifiedAtContract;
                    const bidIdStr = String(b.id);
                    return (
                      <li key={bidIdStr} className="rounded border border-neutral-200 p-3 text-sm">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{String((b.provider as { name?: string })?.name ?? b.providerId)} · Monto: {b.amount != null ? Number(b.amount).toLocaleString() : '—'}</span>
                          <span className="text-text-secondary">
                            {(b as { invitationType?: string })?.invitationType === 'self_invited' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">Autoinvitación</span>}
                            {(b as { baeVerifiedAt?: string | null }).baeVerifiedAt && ' · BAE verificado'}
                          </span>
                        </div>
                        {convalidationErrorsDescription && (
                          <p className="mb-2 rounded bg-neutral-50 px-2 py-1.5 text-xs text-text-secondary">
                            <span className="font-medium text-text-primary">Descripción de errores (solicitud):</span> {String(convalidationErrorsDescription)}
                          </p>
                        )}
                        {convalidationResponse && convalidationStatus !== 'pending' && (
                          <p className="mb-2 rounded bg-neutral-50 px-2 py-1.5 text-xs text-text-secondary">
                            <span className="font-medium text-text-primary">Respuesta de la entidad:</span> {String(convalidationResponse)}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" disabled={!!(b as { baeVerifiedAt?: string | null }).baeVerifiedAt || verifyingBaeId === bidIdStr} onClick={() => handleVerifyBae(bidIdStr)}>
                            {(b as { baeVerifiedAt?: string | null }).baeVerifiedAt ? 'Verificado' : verifyingBaeId === bidIdStr ? 'Verificando…' : 'Verificar BAE'}
                          </Button>
                          {convalidationRequestedAt && (
                            <>
                              <span className="text-text-secondary">Convalidación: {convalidationStatus === 'pending' ? 'Pendiente' : convalidationStatus === 'accepted' ? 'Aceptada' : convalidationStatus === 'rejected' ? 'Rechazada' : '—'}</span>
                              {convalidationStatus === 'pending' && (
                                <>
                                  <textarea
                                    aria-label="Respuesta de la entidad a la convalidación (opcional)"
                                    placeholder="Respuesta de la entidad (opcional)"
                                    value={convalidationResponseByBidId[bidIdStr] ?? ''}
                                    onChange={(e) => setConvalidationResponseByBidId((prev) => ({ ...prev, [bidIdStr]: e.target.value }))}
                                    className="min-w-[200px] rounded border border-neutral-300 px-2 py-1 text-xs"
                                    rows={2}
                                  />
                                  <Button size="sm" variant="outline" disabled={convalidationBidId === bidIdStr} onClick={() => handleConvalidation(bidIdStr, 'accepted')}>Aceptar</Button>
                                  <Button size="sm" variant="outline" disabled={convalidationBidId === bidIdStr} onClick={() => handleConvalidation(bidIdStr, 'rejected')}>Rechazar</Button>
                                </>
                              )}
                            </>
                          )}
                          <span className="ml-2 text-text-secondary">
                            RUP: {rupOpening ? 'Apertura ✓' : '—'} {rupAward ? 'Adjudicación ✓' : ''} {rupContract ? 'Contrato ✓' : ''}
                          </span>
                          <select aria-label="Etapa de verificación RUP" value={rupStage} onChange={(e) => setRupStage(e.target.value as 'opening' | 'award' | 'contract')} className="rounded border border-neutral-300 px-2 py-1 text-xs">
                            <option value="opening">Apertura</option>
                            <option value="award">Adjudicación</option>
                            <option value="contract">Contrato</option>
                          </select>
                          <Button size="sm" variant="outline" disabled={rupBidId === bidIdStr} onClick={() => handleVerifyRup(bidIdStr)}>{rupBidId === bidIdStr ? 'Verificando…' : 'Verificar RUP'}</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card title="Registrar evaluación" variant="outline" className="mb-6">
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label htmlFor="eval-bid-select" className="mb-1 block text-sm font-medium text-text-secondary">Oferta (bid)</label>
                  <select
                    id="eval-bid-select"
                    value={bidId}
                    onChange={(e) => setBidId(e.target.value)}
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="">— Seleccione —</option>
                    {bids.map((b) => (
                      <option key={String(b.id)} value={String(b.id)}>
                        Bid {String(b.id).slice(0, 8)}… · Monto: {b.amount != null ? String(b.amount) : '—'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Puntaje técnico" type="number" step="0.01" value={technicalScore} onChange={(e) => setTechnicalScore(e.target.value)} placeholder="0–100" />
                  <Input label="Puntaje económico" type="number" step="0.01" value={financialScore} onChange={(e) => setFinancialScore(e.target.value)} placeholder="0–100" />
                  <Input label="Puntaje BAE (Valor Agregado Ecuatoriano)" type="number" step="0.01" value={baeScore} onChange={(e) => setBaeScore(e.target.value)} placeholder="0–100" />
                  <Input label="Puntaje participación nacional" type="number" step="0.01" value={nationalPartScore} onChange={(e) => setNationalPartScore(e.target.value)} placeholder="0–100" />
                  <Input label="Puntaje total (opcional)" type="number" step="0.01" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="0–100" />
                </div>
                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                <Button type="submit" disabled={saving || !bidId.trim()}>{saving ? 'Guardando…' : 'Crear evaluación'}</Button>
              </form>
            </Card>

            <Card title="Evaluaciones registradas" variant="outline">
              {evaluations.length === 0 ? (
                <p className="text-gray-500">No hay evaluaciones. Registre una usando el formulario anterior.</p>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {evaluations.map((ev) => (
                    <div key={String(ev.id)} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                      <div className="text-sm">
                        <span className="font-medium text-text-primary">Bid: {String((ev as any).bidId ?? '').slice(0, 8)}…</span>
                        <span className="ml-2 text-text-secondary">
                          Téc: {ev.technicalScore != null ? String(ev.technicalScore) : '—'} · Econ: {ev.financialScore != null ? String(ev.financialScore) : '—'} · BAE: {ev.baeScore != null ? String(ev.baeScore) : '—'} · Part. nac.: {ev.nationalPartScore != null ? String(ev.nationalPartScore) : '—'} · Total: {ev.totalScore != null ? String(ev.totalScore) : '—'}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary">{String(ev.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </EntityShell>
  );
}
