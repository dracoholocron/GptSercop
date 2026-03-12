'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken, uploadDocument } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function EditarProcesoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [referenceBudgetAmount, setReferenceBudgetAmount] = useState('');
  const [bidsDeadlineAt, setBidsDeadlineAt] = useState('');
  const [questionsDeadlineAt, setQuestionsDeadlineAt] = useState('');
  const [responsibleType, setResponsibleType] = useState('');
  const [electronicSignatureRequired, setElectronicSignatureRequired] = useState(true);
  const [liberationRequesting, setLiberationRequesting] = useState(false);
  const [contingencyFile, setContingencyFile] = useState<File | null>(null);
  const [contingencyUploading, setContingencyUploading] = useState(false);
  const [openingActFile, setOpeningActFile] = useState<File | null>(null);
  const [openingActUploading, setOpeningActUploading] = useState(false);
  const [openingBids, setOpeningBids] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    const t = getToken();
    if (t) setToken(t);
    api.getTender(id).then((r) => {
      const data = r as Record<string, unknown>;
      setTender(data);
      setTitle(String(data.title || ''));
      setDescription(String(data.description || ''));
      setReferenceBudgetAmount(data.referenceBudgetAmount != null ? String(data.referenceBudgetAmount) : '');
      setBidsDeadlineAt(data.bidsDeadlineAt ? new Date(String(data.bidsDeadlineAt)).toISOString().slice(0, 16) : '');
      setQuestionsDeadlineAt(data.questionsDeadlineAt ? new Date(String(data.questionsDeadlineAt)).toISOString().slice(0, 16) : '');
      setResponsibleType(String(data.responsibleType || ''));
      setElectronicSignatureRequired(data.electronicSignatureRequired !== false);
    }).catch(() => setTender(null));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { title: title.trim(), description: description.trim() || undefined };
      if (referenceBudgetAmount.trim()) payload.referenceBudgetAmount = parseFloat(referenceBudgetAmount);
      if (bidsDeadlineAt) payload.bidsDeadlineAt = new Date(bidsDeadlineAt).toISOString();
      if (questionsDeadlineAt) payload.questionsDeadlineAt = new Date(questionsDeadlineAt).toISOString();
      if (responsibleType === 'commission' || responsibleType === 'delegate') payload.responsibleType = responsibleType;
      payload.electronicSignatureRequired = electronicSignatureRequired;
      await api.updateTender(id, payload as Parameters<typeof api.updateTender>[1]);
      router.push('/procesos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestLiberation = async () => {
    if (!tender || tender.status !== 'draft') return;
    setError('');
    setLiberationRequesting(true);
    try {
      await api.requestLiberation(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar liberación');
    } finally {
      setLiberationRequesting(false);
    }
  };

  const handleOpenBids = async () => {
    setError('');
    setOpeningBids(true);
    try {
      await api.openBids(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir ofertas');
    } finally {
      setOpeningBids(false);
    }
  };

  const handleUploadOpeningActAndOpenBids = async () => {
    if (!openingActFile) return;
    setError('');
    setOpeningActUploading(true);
    try {
      const doc = await uploadDocument({
        ownerType: 'tender',
        ownerId: id,
        documentType: 'bid_opening_act',
        file: openingActFile,
      });
      await api.openBids(id, { bidOpeningActDocumentId: doc.id });
      setOpeningActFile(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir acta o registrar apertura');
    } finally {
      setOpeningActUploading(false);
    }
  };

  const handleUploadContingency = async () => {
    if (!contingencyFile) return;
    setError('');
    setContingencyUploading(true);
    try {
      const doc = await uploadDocument({
        ownerType: 'tender',
        ownerId: id,
        documentType: 'contingency_plan',
        file: contingencyFile,
      });
      await api.updateTender(id, { contingencyPlanDocumentId: doc.id });
      setContingencyFile(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir plan de contingencia');
    } finally {
      setContingencyUploading(false);
    }
  };

  const regime = tender ? String(tender.regime || '') : '';
  const liberationRequestedAt = tender?.liberationRequestedAt;
  const liberationApprovedAt = tender?.liberationApprovedAt;
  const contingencyPlanDocumentId = tender?.contingencyPlanDocumentId;
  const bidsDeadlineAtDate = tender?.bidsDeadlineAt ? new Date(String(tender.bidsDeadlineAt)) : null;
  const bidsOpenedAt = tender?.bidsOpenedAt;
  const canOpenBids = bidsDeadlineAtDate && !bidsOpenedAt && (new Date().getTime() >= bidsDeadlineAtDate.getTime() + 60 * 60 * 1000);

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!tender ? <p>Cargando…</p> : (
          <>
            <Card title="Editar proceso">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input label="Presupuesto referencial ($)" type="number" step="0.01" value={referenceBudgetAmount} onChange={(e) => setReferenceBudgetAmount(e.target.value)} placeholder="Opcional" />
                <Input label="Límite preguntas" type="datetime-local" value={questionsDeadlineAt} onChange={(e) => setQuestionsDeadlineAt(e.target.value)} />
                <Input label="Límite entrega ofertas" type="datetime-local" value={bidsDeadlineAt} onChange={(e) => setBidsDeadlineAt(e.target.value)} />
                <label htmlFor="editar-responsible-type" className="mb-1 block text-sm font-medium text-text-secondary">Responsable (comisión / delegado)</label>
                <select id="editar-responsible-type" value={responsibleType} onChange={(e) => setResponsibleType(e.target.value)} className="w-full rounded border border-neutral-300 px-3 py-2 text-sm">
                  <option value="">— Responsable —</option>
                  <option value="commission">Comisión técnica</option>
                  <option value="delegate">Delegado</option>
                </select>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="electronicSignatureRequired" checked={electronicSignatureRequired} onChange={(e) => setElectronicSignatureRequired(e.target.checked)} className="rounded border-neutral-300" />
                  <label htmlFor="electronicSignatureRequired" className="text-sm text-text-secondary">Firma electrónica requerida</label>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={saving}>Guardar</Button>
              </form>
            </Card>

            {canOpenBids && (
              <Card title="Apertura de ofertas" className="mt-4">
                <p className="mb-2 text-sm text-text-secondary">El acto de apertura debe realizarse al menos 1 hora después del límite de entrega. Opcionalmente suba el acta y registre la apertura.</p>
                <div className="flex flex-wrap items-end gap-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setOpeningActFile(e.target.files?.[0] ?? null)}
                    className="text-sm"
                  />
                  <Button variant="secondary" size="sm" onClick={handleUploadOpeningActAndOpenBids} disabled={!openingActFile || openingActUploading}>
                    {openingActUploading ? 'Subiendo…' : 'Subir acta y registrar apertura'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleOpenBids} disabled={openingBids}>{openingBids ? 'Abriendo…' : 'Registrar apertura (sin acta)'}</Button>
                </div>
              </Card>
            )}

            <Card title="Liberación por no producción nacional" className="mt-4">
              <p className="mb-2 text-sm text-text-secondary">Cuando no exista producción nacional puede solicitar autorización para importación.</p>
              {liberationApprovedAt ? (
                <p className="text-sm font-medium text-green-700">Liberación aprobada</p>
              ) : liberationRequestedAt ? (
                <p className="text-sm text-amber-700">Solicitud enviada (pendiente de aprobación)</p>
              ) : tender.status === 'draft' ? (
                <Button variant="secondary" size="sm" onClick={handleRequestLiberation} disabled={liberationRequesting}>
                  {liberationRequesting ? 'Enviando…' : 'Solicitar liberación'}
                </Button>
              ) : (
                <p className="text-sm text-text-secondary">Solo disponible en procesos en borrador.</p>
              )}
            </Card>

            {regime === 'emergencia' && (
              <Card title="Plan de contingencia" className="mt-4">
                <p className="mb-2 text-sm text-text-secondary">Documento opcional para procesos en régimen de emergencia.</p>
                {contingencyPlanDocumentId ? (
                  <p className="text-sm text-green-700">Plan de contingencia adjunto</p>
                ) : (
                  <div className="flex flex-wrap items-end gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setContingencyFile(e.target.files?.[0] ?? null)}
                      className="text-sm"
                    />
                    <Button variant="secondary" size="sm" onClick={handleUploadContingency} disabled={!contingencyFile || contingencyUploading}>
                      {contingencyUploading ? 'Subiendo…' : 'Subir plan'}
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </EntityShell>
  );
}
