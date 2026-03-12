'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken, uploadDocument, type Contract, type ContractPayment } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const CONTRACT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'signed', label: 'Firmado' },
  { value: 'in_progress', label: 'En ejecución' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'terminated', label: 'Terminado' },
];

const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'planned', label: 'Planificado' },
  { value: 'requested', label: 'Solicitado' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'paid', label: 'Pagado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function ContratoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<ContractPayment[]>([]);
  const [bids, setBids] = useState<Array<Record<string, unknown>>>([]);
  const [providerId, setProviderId] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [amount, setAmount] = useState('');
  const [administratorName, setAdministratorName] = useState('');
  const [administratorEmail, setAdministratorEmail] = useState('');
  const [contractStatus, setContractStatus] = useState('');
  const [newPaySequence, setNewPaySequence] = useState('');
  const [newPayAmount, setNewPayAmount] = useState('');
  const [resultReportDocId, setResultReportDocId] = useState('');
  const [resultReportFile, setResultReportFile] = useState<File | null>(null);
  const [uploadingResultReport, setUploadingResultReport] = useState(false);
  const [uploadErrorResultReport, setUploadErrorResultReport] = useState('');
  const [disputeDeadlineDays, setDisputeDeadlineDays] = useState('');
  const [terminationCause, setTerminationCause] = useState('');
  const [suspensionCause, setSuspensionCause] = useState('');
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [closingDocs, setClosingDocs] = useState<Array<{ id: string; documentType: string; fileName: string }>>([]);
  const [closingFile, setClosingFile] = useState<File | null>(null);
  const [uploadingClosing, setUploadingClosing] = useState(false);
  const [objectionReason, setObjectionReason] = useState('');
  const [submittingObjection, setSubmittingObjection] = useState(false);
  const [awardPublishedAt, setAwardPublishedAt] = useState('');
  const [showFailedAwardeeModal, setShowFailedAwardeeModal] = useState(false);
  const [declaringFailed, setDeclaringFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const t = getToken();
    if (t) setToken(t);
    try {
      const [tRes, c] = await Promise.all([
        api.getTender(id).then((r) => r as Record<string, unknown>).catch(() => null),
        api.getContractByTenderId(id),
      ]);
      setTender(tRes);
      setContract(c);
      if (c) {
        setAdministratorName(c.administratorName ?? '');
        setAdministratorEmail(c.administratorEmail ?? '');
        setContractStatus(c.status);
        setResultReportDocId((c as { resultReportDocumentId?: string | null }).resultReportDocumentId ?? '');
        setDisputeDeadlineDays(c.disputeDeadlineDays != null ? String(c.disputeDeadlineDays) : '');
        setTerminationCause(c.terminationCause ?? '');
        setSuspensionCause(c.suspensionCause ?? '');
        setAwardPublishedAt(c.awardPublishedAt ? new Date(c.awardPublishedAt).toISOString().slice(0, 16) : '');
        const [payRes, docsRes] = await Promise.all([
          api.listContractPayments(c.id),
          api.listContractDocuments(c.id),
        ]);
        setPayments(payRes.data);
        setClosingDocs(docsRes.data.filter((d: { documentType: string }) => d.documentType === 'closing_attachment'));
      } else {
        const bRes = await api.getTenderBids(id);
        const bidList = bRes.data as Array<Record<string, unknown>>;
        setBids(bidList);
        if (bidList.length > 0) setProviderId(String(bidList[0].providerId));
      }
    } catch {
      setTender(null);
      setContract(null);
      setPayments([]);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!providerId) { setError('Seleccione proveedor'); return; }
    setSaving(true);
    try {
      await api.createContract(id, {
        providerId,
        contractNo: contractNo.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        administratorName: administratorName.trim() || undefined,
        administratorEmail: administratorEmail.trim() || undefined,
        disputeDeadlineDays: disputeDeadlineDays ? parseInt(disputeDeadlineDays, 10) : undefined,
        awardPublishedAt: awardPublishedAt ? new Date(awardPublishedAt).toISOString() : undefined,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear contrato');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadResultReport = async () => {
    if (!contract || !resultReportFile) return;
    setUploadErrorResultReport('');
    setUploadingResultReport(true);
    try {
      const doc = await uploadDocument({
        ownerType: 'contract',
        ownerId: contract.id,
        documentType: 'result_report',
        file: resultReportFile,
      });
      setResultReportDocId(doc.id);
      await api.updateContract(contract.id, { resultReportDocumentId: doc.id });
      setResultReportFile(null);
      load();
    } catch (err) {
      setUploadErrorResultReport(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploadingResultReport(false);
    }
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    setError('');
    setSaving(true);
    try {
      await api.updateContract(contract.id, {
        administratorName: administratorName.trim() || undefined,
        administratorEmail: administratorEmail.trim() || undefined,
        status: contractStatus || undefined,
        resultReportDocumentId: resultReportDocId.trim() || null,
        disputeDeadlineDays: disputeDeadlineDays ? parseInt(disputeDeadlineDays, 10) : null,
        awardPublishedAt: awardPublishedAt ? new Date(awardPublishedAt).toISOString() : null,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendContract = async () => {
    if (!contract) return;
    setError('');
    setSaving(true);
    try {
      await api.updateContract(contract.id, {
        status: 'suspended',
        suspendedAt: new Date().toISOString(),
        suspensionCause: suspensionCause.trim() || undefined,
      });
      setShowSuspendModal(false);
      setSuspensionCause('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al suspender');
    } finally {
      setSaving(false);
    }
  };

  const handleTerminateContract = async () => {
    if (!contract) return;
    setError('');
    setSaving(true);
    try {
      await api.updateContract(contract.id, {
        status: 'terminated',
        terminatedAt: new Date().toISOString(),
        terminationCause: terminationCause.trim() || undefined,
      });
      setShowTerminateModal(false);
      setTerminationCause('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al terminar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeclareFailedAwardee = async () => {
    if (!contract) return;
    setError('');
    setDeclaringFailed(true);
    try {
      await api.declareFailedAwardee(contract.id);
      setShowFailedAwardeeModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al declarar adjudicatario fallido');
    } finally {
      setDeclaringFailed(false);
    }
  };

  const handleUploadClosingDoc = async () => {
    if (!contract || !closingFile) return;
    setUploadingClosing(true);
    setError('');
    try {
      const doc = await uploadDocument({
        ownerType: 'contract',
        ownerId: contract.id,
        documentType: 'closing_attachment',
        file: closingFile,
      });
      setClosingFile(null);
      const docsRes = await api.listContractDocuments(contract.id);
      setClosingDocs(docsRes.data.filter((d: { documentType: string }) => d.documentType === 'closing_attachment'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir documento');
    } finally {
      setUploadingClosing(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    const seq = parseInt(newPaySequence, 10);
    const amt = parseFloat(newPayAmount);
    if (!Number.isInteger(seq) || seq < 1 || !Number.isFinite(amt) || amt <= 0) {
      setError('Nº de hito (entero ≥ 1) y monto (> 0) son obligatorios.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.createContractPayment(contract.id, { sequenceNo: seq, amount: amt });
      setNewPaySequence('');
      setNewPayAmount('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pago');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, status: string) => {
    setSaving(true);
    try {
      await api.updateContractPayment(paymentId, { status });
      if (contract) {
        const r = await api.listContractPayments(contract.id);
        setPayments(r.data);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href={`/procesos/${id}/ofertas`}><Button variant="secondary" size="sm">← Ofertas</Button></Link>
          <Link href={`/procesos/${id}/evaluaciones`}><Button variant="outline" size="sm">Evaluaciones</Button></Link>
        </div>
        {!tender ? (
          <p className="text-text-secondary">Cargando…</p>
        ) : contract ? (
          <>
            <Card title={`Contrato – ${tender.title}`} variant="outline" className="mb-6">
              <dl className="grid gap-2 text-sm">
                <><dt className="font-medium text-text-secondary">Nº contrato</dt><dd>{contract.contractNo || '—'}</dd></>
                <><dt className="font-medium text-text-secondary">Proveedor</dt><dd>{contract.provider?.name ?? contract.providerId}</dd></>
                <><dt className="font-medium text-text-secondary">Monto</dt><dd>{contract.amount != null ? `$${Number(contract.amount).toLocaleString()}` : '—'}</dd></>
              </dl>
              <form onSubmit={handleUpdateContract} className="mt-4 space-y-3 border-t border-neutral-200 pt-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">Administrador del contrato</p>
                  <p className="mt-1 text-xs text-text-secondary">La designación es por la máxima autoridad (o delegado). Quien reciba la designación puede formular objeción en el plazo de 3 días, debidamente motivada.</p>
                </div>
                <Input label="Nombre" value={administratorName} onChange={(e) => setAdministratorName(e.target.value)} placeholder="Responsable de seguimiento" />
                <Input label="Correo" type="email" value={administratorEmail} onChange={(e) => setAdministratorEmail(e.target.value)} placeholder="admin@entidad.gob.ec" />
                {(contract as { administratorDesignatedAt?: string | null }).administratorDesignatedAt && (
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm">
                    <p className="font-medium text-text-primary">Objeción a la designación</p>
                    <p className="mt-1 text-text-secondary">Plazo para objeción: 3 días (vence el {new Date(new Date((contract as { administratorDesignatedAt: string }).administratorDesignatedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('es-EC')}).</p>
                    {(contract as { administratorObjectionAt?: string | null }).administratorObjectionAt ? (
                      <p className="mt-2 text-green-700">Objeción registrada el {new Date((contract as { administratorObjectionAt: string }).administratorObjectionAt).toLocaleDateString('es-EC')}. Motivo: {(contract as { administratorObjectionReason?: string | null }).administratorObjectionReason || '—'}</p>
                    ) : (() => {
                      const designatedAt = new Date((contract as { administratorDesignatedAt: string }).administratorDesignatedAt).getTime();
                      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                      const withinDeadline = Date.now() - designatedAt <= threeDaysMs;
                      return withinDeadline && (
                        <div className="mt-2">
                          <textarea className="mb-2 w-full rounded border p-2 text-sm" rows={2} value={objectionReason} onChange={(e) => setObjectionReason(e.target.value)} placeholder="Motivo de la objeción (obligatorio)" />
                          <Button type="button" size="sm" variant="outline" disabled={!objectionReason.trim() || submittingObjection} onClick={async () => {
                            setError('');
                            setSubmittingObjection(true);
                            try {
                              await api.updateContract(contract.id, { administratorObjectionReason: objectionReason.trim() });
                              setObjectionReason('');
                              load();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Error al registrar objeción');
                            } finally {
                              setSubmittingObjection(false);
                            }
                          }}>{submittingObjection ? 'Enviando…' : 'Registrar objeción'}</Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <Select label="Estado" options={CONTRACT_STATUS_OPTIONS} value={contractStatus} onChange={(e) => setContractStatus(e.target.value)} />
                <div>
                  <p className="mb-2 text-sm font-medium text-text-primary">Informe de resultado</p>
                  <p className="mb-2 text-xs text-text-secondary">Buena práctica: al cierre o entrega del contrato, elabore un informe que verifique si lo contratado cumplió el objeto y satisfizo las necesidades de la entidad, y anéxelo al expediente (puede subirlo aquí). Este informe da cumplimiento al principio del resultado (art. 5 LOSNCP).</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => { setResultReportFile(e.target.files?.[0] ?? null); setUploadErrorResultReport(''); }}
                      className="rounded border border-neutral-300 px-2 py-1 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!resultReportFile || uploadingResultReport}
                      onClick={handleUploadResultReport}
                    >
                      {uploadingResultReport ? 'Subiendo…' : 'Subir y vincular'}
                    </Button>
                  </div>
                  {resultReportDocId && <p className="mt-1 text-xs text-green-600">Documento vinculado: {resultReportDocId.slice(0, 8)}…</p>}
                  {uploadErrorResultReport && <p className="mt-1 text-xs text-red-600">{uploadErrorResultReport}</p>}
                </div>
                <Input label="ID documento informe de resultado (manual)" value={resultReportDocId} onChange={(e) => setResultReportDocId(e.target.value)} placeholder="UUID si ya tiene el documento" />
                <Input label="Plazo controversias (días)" type="number" min={1} value={disputeDeadlineDays} onChange={(e) => setDisputeDeadlineDays(e.target.value)} placeholder="Debe coincidir con el plazo del proceso (TDR)" />
                <p className="text-xs text-text-secondary">Unifique este plazo con el establecido en los TDR/pliegos del proceso.</p>
                {contract.terminationCause && <p className="text-sm text-text-secondary"><strong>Causal de terminación:</strong> {contract.terminationCause}</p>}
                {contract.suspensionCause && <p className="text-sm text-text-secondary"><strong>Causal de suspensión:</strong> {contract.suspensionCause}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <p className="text-xs text-text-secondary">Solo la entidad contratante puede suspender el contrato. La suspensión del servicio por parte del contratista sin autorización constituye causal de terminación unilateral.</p>
                <Input label="Fecha publicación resolución adjudicación" type="datetime-local" value={awardPublishedAt} onChange={(e) => setAwardPublishedAt(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>Guardar cambios</Button>
                  {contract.status !== 'suspended' && <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setShowSuspendModal(true)}>Suspender contrato</Button>}
                  {contract.status !== 'terminated' && <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setShowTerminateModal(true)}>Terminar contrato</Button>}
                  <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setShowFailedAwardeeModal(true)}>Declarar adjudicatario fallido</Button>
                </div>
              </form>
            </Card>

            {showSuspendModal && (
              <Card title="Suspender contrato" variant="outline" className="mb-4">
                <p className="mb-2 text-sm text-text-secondary">Indique la causal de suspensión (opcional pero recomendado).</p>
                <textarea className="mb-2 w-full rounded border p-2 text-sm" rows={3} value={suspensionCause} onChange={(e) => setSuspensionCause(e.target.value)} placeholder="Causal de suspensión" />
                <div className="flex gap-2">
                  <Button size="sm" disabled={saving} onClick={handleSuspendContract}>Confirmar suspensión</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowSuspendModal(false); setSuspensionCause(''); }}>Cancelar</Button>
                </div>
              </Card>
            )}
            {showTerminateModal && (
              <Card title="Terminar contrato" variant="outline" className="mb-4">
                <p className="mb-2 text-sm text-text-secondary">Indique la causal de terminación unilateral (opcional pero recomendado).</p>
                <textarea className="mb-2 w-full rounded border p-2 text-sm" rows={3} value={terminationCause} onChange={(e) => setTerminationCause(e.target.value)} placeholder="Causal de terminación" />
                <div className="flex gap-2">
                  <Button size="sm" disabled={saving} onClick={handleTerminateContract}>Confirmar terminación</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowTerminateModal(false); setTerminationCause(''); }}>Cancelar</Button>
                </div>
              </Card>
            )}
            {showFailedAwardeeModal && (
              <Card title="Declarar adjudicatario fallido" variant="outline" className="mb-4">
                <p className="mb-2 text-sm text-text-secondary">El proveedor adjudicado quedará con sanción de 3 años. Esta acción registra la oferta como adjudicatario fallido.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={declaringFailed} onClick={handleDeclareFailedAwardee}>Confirmar</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowFailedAwardeeModal(false)}>Cancelar</Button>
                </div>
              </Card>
            )}

            <Card title="Documentación adicional al cierre" variant="outline" className="mb-6">
              {closingDocs.length > 0 && (
                <ul className="mb-3 space-y-1 text-sm">
                  {closingDocs.map((d) => (
                    <li key={d.id}>{d.fileName}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <input type="file" className="rounded border px-2 py-1 text-sm" onChange={(e) => setClosingFile(e.target.files?.[0] ?? null)} />
                <Button type="button" size="sm" disabled={!closingFile || uploadingClosing} onClick={handleUploadClosingDoc}>{uploadingClosing ? 'Subiendo…' : 'Subir documento'}</Button>
              </div>
            </Card>

            <Card title="Pagos / hitos" variant="outline" className="mb-6">
              {payments.length === 0 ? (
                <p className="text-sm text-text-secondary">No hay pagos registrados.</p>
              ) : (
                <ul className="mb-4 space-y-2">
                  {payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 p-2 text-sm">
                      <span className="font-medium">Hito {p.sequenceNo}</span>
                      <span>${Number(p.amount).toLocaleString()}</span>
                      <span className="text-text-secondary">{p.status}</span>
                      <Select
                        options={PAYMENT_STATUS_OPTIONS}
                        value={p.status}
                        onChange={(e) => handleUpdatePaymentStatus(p.id, e.target.value)}
                        className="w-36"
                      />
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleAddPayment} className="flex flex-wrap items-end gap-2 border-t border-neutral-200 pt-4">
                <Input label="Nº hito" type="number" min={1} value={newPaySequence} onChange={(e) => setNewPaySequence(e.target.value)} placeholder="Ej: 1" className="w-24" />
                <Input label="Monto ($)" type="number" step="0.01" value={newPayAmount} onChange={(e) => setNewPayAmount(e.target.value)} placeholder="0.00" className="w-32" />
                <Button type="submit" size="sm" disabled={saving}>Agregar pago</Button>
              </form>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </Card>
          </>
        ) : (
          <Card title={`Crear contrato – ${tender.title}`}>
            <form onSubmit={handleCreateContract} className="space-y-4">
              <label htmlFor="contrato-provider-select" className="block text-sm font-medium">Proveedor adjudicado</label>
              <select id="contrato-provider-select" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-full rounded border p-2" required>
                <option value="">Seleccione</option>
                {bids.map((b) => (
                  <option key={String(b.id)} value={String(b.providerId)}>
                    {String((b.provider as { name?: string })?.name || b.providerId)} – ${b.amount != null ? Number(b.amount).toLocaleString() : '—'}
                  </option>
                ))}
              </select>
              <Input label="Nº contrato" value={contractNo} onChange={(e) => setContractNo(e.target.value)} placeholder="CON-2025-001" />
              <Input label="Monto ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              <Input label="Plazo controversias (días)" type="number" min={1} value={disputeDeadlineDays} onChange={(e) => setDisputeDeadlineDays(e.target.value)} placeholder="Debe coincidir con TDR" />
              <p className="text-xs text-text-secondary">Unifique este plazo con el establecido en los TDR/pliegos del proceso.</p>
              <Input label="Fecha publicación resolución adjudicación" type="datetime-local" value={awardPublishedAt} onChange={(e) => setAwardPublishedAt(e.target.value)} />
              <Input label="Administrador del contrato (opcional)" value={administratorName} onChange={(e) => setAdministratorName(e.target.value)} placeholder="Nombre" />
              <Input label="Correo administrador (opcional)" type="email" value={administratorEmail} onChange={(e) => setAdministratorEmail(e.target.value)} placeholder="admin@entidad.gob.ec" />
              <p className="text-xs text-text-secondary">El designado puede formular objeción a la designación en un plazo de 3 días, debidamente motivada.</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>Crear contrato</Button>
            </form>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
