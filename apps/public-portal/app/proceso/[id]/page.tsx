'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Breadcrumb, EmptyState, Skeleton, SummarySheet } from '@sercop/design-system';
import { api, setBaseUrl, type TenderClarification } from '@sercop/api-client';
import Link from 'next/link';
import { PublicShell } from '../../components/PublicShell';

const SUPPLIER_URL = process.env.NEXT_PUBLIC_SUPPLIER_URL || 'http://localhost:3002';
setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function TenderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [clarifications, setClarifications] = useState<TenderClarification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    api.getTender(id).then((t) => { setTender(t); setLoaded(true); }).catch(() => { setTender(null); setLoaded(true); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.listTenderClarifications(id).then((r) => setClarifications(r.data)).catch(() => setClarifications([]));
  }, [id]);

  const title = tender ? String(tender.title) : 'Proceso';

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Procesos', href: '/procesos' },
            { label: title },
          ]}
          className="mb-4"
        />
        {!loaded ? (
          <Card variant="outline"><Skeleton variant="card" /></Card>
        ) : !tender ? (
          <EmptyState
            title="Proceso no encontrado"
            description="El proceso solicitado no existe o no está disponible."
            action={{ label: 'Volver a procesos', href: '/procesos' }}
          />
        ) : (
          <>
            <SummarySheet
              title="Resumen del proceso"
              className="mb-6"
              items={[
                { label: 'Objeto', value: String(tender.title) },
                ...((tender as { referenceBudgetAmount?: number | null }).referenceBudgetAmount != null
                  ? [{ label: 'Presupuesto referencial', value: `$${Number((tender as { referenceBudgetAmount: number }).referenceBudgetAmount).toLocaleString()}` }]
                  : []),
                ...((tender as { bidsDeadlineAt?: string | null }).bidsDeadlineAt
                  ? [{ label: 'Límite entrega ofertas', value: new Date(String((tender as { bidsDeadlineAt: string }).bidsDeadlineAt)).toLocaleString('es-EC') }]
                  : []),
                ...((tender as { questionsDeadlineAt?: string | null }).questionsDeadlineAt
                  ? [{ label: 'Límite preguntas', value: new Date(String((tender as { questionsDeadlineAt: string }).questionsDeadlineAt)).toLocaleString('es-EC') }]
                  : []),
                ...(tender.procurementPlan
                  ? [{ label: 'Entidad', value: (tender.procurementPlan as { entity?: { name?: string } })?.entity?.name || '—' }]
                  : []),
              ].flat()}
              cta={
                <a href={`${SUPPLIER_URL}/procesos/${id}/oferta`} target="_blank" rel="noopener noreferrer">
                  <Button variant="accent">Participar (presentar oferta)</Button>
                </a>
              }
            />
            <Card title={String(tender.title)} variant="elevated">
              <p className="text-text-secondary">{String(tender.description || '—')}</p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {tender.status != null && tender.status !== '' ? (
                  <><dt className="font-medium text-text-secondary">Estado</dt><dd className="text-text-primary">{String(tender.status)}</dd></>
                ) : null}
                {tender.procurementMethod != null && tender.procurementMethod !== '' ? (
                  <><dt className="font-medium text-text-secondary">Método</dt><dd className="text-text-primary">{String(tender.procurementMethod)}</dd></>
                ) : null}
                {tender.estimatedAmount != null ? (
                  <><dt className="font-medium text-text-secondary">Monto estimado</dt><dd className="text-text-primary">${Number(tender.estimatedAmount).toLocaleString()}</dd></>
                ) : null}
                {(tender as { referenceBudgetAmount?: number | null }).referenceBudgetAmount != null ? (
                  <><dt className="font-medium text-text-secondary">Presupuesto referencial</dt><dd className="text-text-primary">${Number((tender as { referenceBudgetAmount: number }).referenceBudgetAmount).toLocaleString()}</dd></>
                ) : null}
                {(tender as { bidsDeadlineAt?: string | null }).bidsDeadlineAt ? (
                  <><dt className="font-medium text-text-secondary">Límite entrega ofertas</dt><dd className="text-text-primary">{new Date(String((tender as { bidsDeadlineAt: string }).bidsDeadlineAt)).toLocaleString('es-EC')}</dd></>
                ) : null}
                {(tender as { questionsDeadlineAt?: string | null }).questionsDeadlineAt ? (
                  <><dt className="font-medium text-text-secondary">Límite preguntas</dt><dd className="text-text-primary">{new Date(String((tender as { questionsDeadlineAt: string }).questionsDeadlineAt)).toLocaleString('es-EC')}</dd></>
                ) : null}
                {(tender as { responsibleType?: string | null }).responsibleType ? (
                  <><dt className="font-medium text-text-secondary">Responsable</dt><dd className="text-text-primary">{(tender as { responsibleType: string }).responsibleType === 'commission' ? 'Comisión técnica' : 'Delegado'}</dd></>
                ) : null}
                {(tender as { electronicSignatureRequired?: boolean }).electronicSignatureRequired === false ? (
                  <><dt className="font-medium text-text-secondary">Firma electrónica</dt><dd className="text-text-primary">No requerida (excepción)</dd></>
                ) : (tender as { electronicSignatureRequired?: boolean }).electronicSignatureRequired === true ? (
                  <><dt className="font-medium text-text-secondary">Firma electrónica</dt><dd className="text-text-primary">Requerida</dd></>
                ) : null}
                {(tender as { claimWindowDays?: number | null }).claimWindowDays != null ? (
                  <><dt className="font-medium text-text-secondary">Plazo reclamos (días)</dt><dd className="text-text-primary">{(tender as { claimWindowDays: number }).claimWindowDays}</dd></>
                ) : null}
                {tender.procurementPlan ? (
                  <>
                    <dt className="font-medium text-text-secondary">Entidad</dt>
                    <dd className="text-text-primary">{(tender.procurementPlan as { entity?: { name?: string } })?.entity?.name || '—'}</dd>
                    <dt className="font-medium text-text-secondary">Año PAC</dt>
                    <dd className="text-text-primary">{(tender.procurementPlan as { year?: number })?.year || '—'}</dd>
                  </>
                ) : null}
              </dl>
              {(tender as { claimWindowDays?: number | null }).claimWindowDays != null && (
                <p className="mt-3 text-xs text-text-secondary">Los reclamos deben presentarse dentro del plazo indicado para que cause estado.</p>
              )}
              <a href={`${SUPPLIER_URL}/procesos/${id}/oferta`} className="mt-4 inline-block" target="_blank" rel="noopener noreferrer">
                <Button variant="accent">Participar (presentar oferta)</Button>
              </a>
            </Card>

            {clarifications.length > 0 && (
              <Card title="Preguntas y aclaraciones del proceso" variant="outline" className="mt-6">
                <ul className="space-y-4">
                  {clarifications.map((c) => (
                    <li key={c.id} className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                      <p className="font-medium text-text-primary">{c.question}</p>
                      {c.askedByProvider && (
                        <p className="text-xs text-text-secondary">
                          Pregunta de: {c.askedByProvider.name}
                          {c.askedByProvider.identifier ? ` (${c.askedByProvider.identifier})` : ''}
                        </p>
                      )}
                      {c.answer ? (
                        <p className="mt-2 text-sm text-text-secondary">{c.answer}</p>
                      ) : (
                        <p className="mt-2 text-sm italic text-text-secondary">Sin respuesta aún</p>
                      )}
                      <p className="mt-1 text-xs text-text-secondary">
                        {new Date(c.askedAt).toLocaleDateString()}
                        {c.answeredAt && ` · Respondido: ${new Date(c.answeredAt).toLocaleDateString()}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
