'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type TenderClarification } from '@sercop/api-client';
import { getToken, getProviderId } from '../../lib/auth';
import Link from 'next/link';
import { SupplierShell } from '../../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const CLAIM_KIND_OPTIONS: SelectOption[] = [
  { value: 'EVALUATION', label: 'Evaluación / puntaje' },
  { value: 'AWARD', label: 'Adjudicación' },
  { value: 'SPECIFICATIONS', label: 'Pliegos / especificaciones' },
  { value: 'PROCEDURE', label: 'Procedimiento' },
  { value: 'OTHER', label: 'Otro' },
];

export default function ProcesoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [clarifications, setClarifications] = useState<TenderClarification[]>([]);
  const [question, setQuestion] = useState('');
  const [claimKind, setClaimKind] = useState('EVALUATION');
  const [claimSubject, setClaimSubject] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [sendingClaim, setSendingClaim] = useState(false);
  const [questionSent, setQuestionSent] = useState(false);
  const [claimSent, setClaimSent] = useState(false);
  const [error, setError] = useState('');

  const token = getToken();
  const providerId = getProviderId();
  const loggedIn = Boolean(token);

  useEffect(() => {
    if (token) setToken(token);
    api.getTender(id).then((t) => setTender(t as Record<string, unknown>)).catch(() => setTender(null));
    api.listTenderClarifications(id).then((r) => setClarifications(r.data)).catch(() => setClarifications([]));
    setLoading(false);
  }, [id, token]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!question.trim() || !providerId) return;
    setSendingQuestion(true);
    try {
      await api.createTenderClarification(id, { question: question.trim(), askedByProviderId: providerId });
      setQuestion('');
      setQuestionSent(true);
      const r = await api.listTenderClarifications(id);
      setClarifications(r.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la pregunta.');
    } finally {
      setSendingQuestion(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!claimSubject.trim() || !claimMessage.trim() || !providerId) {
      setError('Asunto y mensaje son obligatorios. Debe iniciar sesión.');
      return;
    }
    setSendingClaim(true);
    try {
      await api.createProcessClaim({
        tenderId: id,
        providerId,
        kind: claimKind,
        subject: claimSubject.trim(),
        message: claimMessage.trim(),
      });
      setClaimSubject('');
      setClaimMessage('');
      setClaimSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el reclamo.');
    } finally {
      setSendingClaim(false);
    }
  };

  if (loading || !tender) {
    return (
      <SupplierShell activeId="procesos">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-text-secondary">{loading ? 'Cargando…' : 'Proceso no encontrado.'}</p>
          <Link href="/procesos" className="mt-4 inline-block"><Button variant="outline" size="sm">← Volver a procesos</Button></Link>
        </div>
      </SupplierShell>
    );
  }

  const title = String(tender.title);

  return (
    <SupplierShell activeId="procesos">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver a procesos</Button></Link>
        <Card title={title} variant="elevated" className="mb-6">
          <p className="text-text-secondary">{String(tender.description || '—')}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {tender.status != null && <><dt className="font-medium text-text-secondary">Estado</dt><dd>{String(tender.status)}</dd></>}
            {tender.procurementMethod != null && <><dt className="font-medium text-text-secondary">Método</dt><dd>{String(tender.procurementMethod)}</dd></>}
            {tender.estimatedAmount != null && <><dt className="font-medium text-text-secondary">Monto estimado</dt><dd>${Number(tender.estimatedAmount).toLocaleString()}</dd></>}
            {(tender as { referenceBudgetAmount?: number | null }).referenceBudgetAmount != null && (
              <><dt className="font-medium text-text-secondary">Presupuesto referencial</dt><dd>${Number((tender as { referenceBudgetAmount: number }).referenceBudgetAmount).toLocaleString()}</dd></>
            )}
            {(tender as { bidsDeadlineAt?: string | null }).bidsDeadlineAt && (
              <><dt className="font-medium text-text-secondary">Límite entrega ofertas</dt><dd>{new Date(String((tender as { bidsDeadlineAt: string }).bidsDeadlineAt)).toLocaleString('es-EC')}</dd></>
            )}
            {(tender as { electronicSignatureRequired?: boolean }).electronicSignatureRequired === false && (
              <><dt className="font-medium text-text-secondary">Firma electrónica</dt><dd>No requerida (excepción)</dd></>
            )}
            {(tender as { claimWindowDays?: number | null }).claimWindowDays != null && (
              <><dt className="font-medium text-text-secondary">Plazo reclamos (días)</dt><dd>{(tender as { claimWindowDays: number }).claimWindowDays}</dd></>
            )}
          </dl>
          {(tender as { bidsDeadlineAt?: string | null }).bidsDeadlineAt && (
            <p className="mt-2 text-xs text-text-secondary">Si su oferta tiene errores subsanables puede solicitar convalidación a la entidad dentro del plazo indicado en el cronograma del proceso.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/procesos/${id}/oferta`}><Button variant="accent" size="sm">Presentar oferta</Button></Link>
            {loggedIn && (
              <Link href={`/procesos/${id}/oferta?autoinvitation=1`}><Button variant="outline" size="sm">Registrarse a este proceso</Button></Link>
            )}
            <Link href={`/procesos/${id}/sie`}><Button variant="outline" size="sm">SIE (Subasta inversa)</Button></Link>
          </div>
        </Card>

        <Card title="Preguntas y aclaraciones del proceso" variant="outline" className="mb-6">
          <ul className="mb-4 space-y-3">
            {clarifications.length === 0 && <li className="text-sm text-text-secondary">Aún no hay preguntas publicadas.</li>}
            {clarifications.map((c) => (
              <li key={c.id} className="border-b border-neutral-100 pb-3 last:border-0">
                <p className="font-medium text-text-primary">{c.question}</p>
                {c.answer ? <p className="mt-1 text-sm text-text-secondary">{c.answer}</p> : <p className="mt-1 text-sm italic text-text-secondary">Sin respuesta aún</p>}
                <p className="mt-1 text-xs text-text-secondary">{new Date(c.askedAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
          {loggedIn ? (
            <form onSubmit={handleAskQuestion} className="flex flex-wrap items-end gap-2">
              <Input
                label="Nueva pregunta"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Escriba su pregunta sobre el proceso"
                className="flex-1 min-w-[200px]"
              />
              <Button type="submit" size="sm" disabled={sendingQuestion || !question.trim()}>
                {sendingQuestion ? 'Enviando…' : 'Enviar pregunta'}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-text-secondary">Inicie sesión para formular preguntas al proceso.</p>
          )}
          {questionSent && <p className="mt-2 text-sm text-green-600">Pregunta enviada correctamente.</p>}
        </Card>

        <Card title="Presentar reclamo" variant="outline">
          <p className="mb-4 text-sm text-text-secondary">
            Si considera que hubo irregularidad en la evaluación, adjudicación o en el procedimiento, puede presentar un reclamo formal.
          </p>
          {(tender as { claimWindowDays?: number | null }).claimWindowDays != null && (
            <p className="mb-4 text-xs text-text-secondary">Los reclamos deben presentarse dentro del plazo indicado para que cause estado.</p>
          )}
          {loggedIn ? (
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <Select label="Tipo" options={CLAIM_KIND_OPTIONS} value={claimKind} onChange={(e) => setClaimKind(e.target.value)} />
              <Input label="Asunto" value={claimSubject} onChange={(e) => setClaimSubject(e.target.value)} placeholder="Resumen del reclamo" required />
              <Input label="Mensaje" value={claimMessage} onChange={(e) => setClaimMessage(e.target.value)} placeholder="Describa su reclamo con detalle" required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="accent" disabled={sendingClaim}>Enviar reclamo</Button>
            </form>
          ) : (
            <p className="text-sm text-text-secondary">Inicie sesión para presentar un reclamo.</p>
          )}
          {claimSent && <p className="mt-4 text-sm text-green-600">Reclamo registrado. Será revisado por la entidad.</p>}
        </Card>
      </div>
    </SupplierShell>
  );
}
