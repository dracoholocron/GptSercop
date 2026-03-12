'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type TenderClarification } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function AclaracionesPage() {
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [clarifications, setClarifications] = useState<TenderClarification[]>([]);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    const t = getToken();
    if (t) setToken(t);
    api.getTender(id).then((tRes) => setTender(tRes as Record<string, unknown>)).catch(() => setTender(null));
    api.listTenderClarifications(id).then((r) => setClarifications(r.data)).catch(() => setClarifications([]));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleAnswer = async (clarificationId: string) => {
    const text = (draftAnswers[clarificationId] || '').trim();
    if (!text) return;
    setError('');
    setSubmittingId(clarificationId);
    try {
      await api.answerTenderClarification(clarificationId, text);
      setDraftAnswers((prev) => ({ ...prev, [clarificationId]: '' }));
      setSubmittingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la respuesta.');
      setSubmittingId(null);
    }
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href={`/procesos/${id}/ofertas`} className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver a ofertas</Button></Link>
        {loading ? (
          <p className="text-text-secondary">Cargando…</p>
        ) : !tender ? (
          <p className="text-text-secondary">Proceso no encontrado.</p>
        ) : (
          <Card title={`Preguntas y aclaraciones – ${tender.title}`} variant="outline">
            <p className="mb-4 text-sm text-text-secondary">
              Responda las preguntas de los proveedores sobre este proceso. Las respuestas serán visibles en el portal público.
            </p>
            {clarifications.length === 0 ? (
              <p className="text-sm text-text-secondary">No hay preguntas pendientes.</p>
            ) : (
              <ul className="space-y-4">
                {clarifications.map((c) => (
                  <li key={c.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
                    <p className="font-medium text-text-primary">{c.question}</p>
                    {c.askedByProvider && (
                      <p className="mt-1 text-xs text-text-secondary">
                        Por: {c.askedByProvider.name} {c.askedByProvider.identifier ? `(${c.askedByProvider.identifier})` : ''}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-text-secondary">{new Date(c.askedAt).toLocaleString()}</p>
                    {c.status === 'ANSWERED' && c.answer ? (
                      <p className="mt-2 text-sm text-text-secondary">Respuesta: {c.answer}</p>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <Input
                          label="Respuesta"
                          value={draftAnswers[c.id] ?? ''}
                          onChange={(e) => setDraftAnswers((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Escriba la respuesta pública"
                          className="flex-1 min-w-[200px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAnswer(c.id)}
                          disabled={!(draftAnswers[c.id] ?? '').trim() || submittingId === c.id}
                        >
                          {submittingId === c.id ? 'Enviando…' : 'Responder'}
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
