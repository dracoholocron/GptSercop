'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getProviderId } from '../../../lib/auth';
import Link from 'next/link';
import { SupplierShell } from '../../../components/SupplierShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const OTP_CHANNELS: SelectOption[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
];

const ECON_MODES: SelectOption[] = [
  { value: 'TOTAL', label: 'Monto total' },
  { value: 'ITEMS', label: 'Por ítems' },
];

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const kb = 1024;
  const mb = kb * 1024;
  if (n >= mb) return `${(n / mb).toFixed(2)} MB`;
  if (n >= kb) return `${(n / kb).toFixed(1)} KB`;
  return `${n} B`;
}

export default function OfertaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isSelfInvited = searchParams.get('autoinvitation') === '1';
  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState('');
  const [economicMode, setEconomicMode] = useState<'TOTAL' | 'ITEMS'>('TOTAL');
  const [items, setItems] = useState<Array<{ description: string; quantity: string; unitPrice: string }>>([]);
  const [baePercentage, setBaePercentage] = useState('');
  const [nationalParticipation, setNationalParticipation] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [otpChannel, setOtpChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [otpDestination, setOtpDestination] = useState('');
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [signSessionId, setSignSessionId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('DESGLOSE_ECONOMICO');
  const [docs, setDocs] = useState<Array<any>>([]);
  const [uploading, setUploading] = useState(false);
  const [declareNoInability, setDeclareNoInability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const token = getToken();
  const providerId = getProviderId();

  useEffect(() => {
    if (token) setToken(token);
    api.getTender(id).then(setTender).catch(() => setTender(null));
  }, [id, token]);

  useEffect(() => {
    if (!token || !providerId) return;
    setLoading(true);
    api.createOfferDraft({ processId: id, tenderId: id, providerId, modality: 'LICITACION' })
      .then((d) => setDraftId(d.id))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al crear borrador'))
      .finally(() => setLoading(false));
  }, [id, token, providerId]);

  useEffect(() => {
    api.getOfferFormConfig(id).then((c) => setConfig(c as any)).catch(() => setConfig(null));
  }, [id]);

  const refreshDocs = async () => {
    if (!draftId) return;
    try {
      const r = await api.listOfferDocuments({ draftId });
      setDocs(r.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!draftId) return;
    refreshDocs();
  }, [draftId]);

  const saveDraft = async () => {
    if (!draftId) return;
    const bae = baePercentage.trim() ? parseFloat(baePercentage) : null;
    await api.patchOfferDraft(draftId, {
      stepData: {
        contact: { email: contactEmail, phone: contactPhone },
        economic:
          economicMode === 'TOTAL'
            ? {
                mode: 'TOTAL',
                amount: amount ? parseFloat(amount) : null,
                baePercentage: bae != null && !Number.isNaN(bae) ? bae : null,
                nationalParticipation,
              }
            : {
                mode: 'ITEMS',
                items: items.map((it) => ({
                  description: it.description,
                  quantity: it.quantity ? parseFloat(it.quantity) : null,
                  unitPrice: it.unitPrice ? parseFloat(it.unitPrice) : null,
                })),
                baePercentage: bae != null && !Number.isNaN(bae) ? bae : null,
                nationalParticipation,
              },
      },
    });
  };

  const handleUpload = async () => {
    if (!draftId) return;
    if (!selectedFile) { setError('Seleccione un archivo'); return; }
    setError('');
    setUploading(true);
    try {
      const presign = await api.documentsPresign({
        draftId,
        docType,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        sizeBytes: selectedFile.size,
      });
      await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' }, body: selectedFile });
      const ab = await selectedFile.arrayBuffer();
      const hash = await sha256Hex(ab);
      await api.documentsCommit({
        draftId,
        docType,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        sizeBytes: selectedFile.size,
        hash,
        storageKey: presign.storageKey,
      });
      setSelectedFile(null);
      await refreshDocs();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al subir documento';
      try {
        const parsed = JSON.parse(msg);
        if (typeof parsed?.error === 'string') setError(parsed.error);
        else setError(msg);
      } catch {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleValidateAndSign = async () => {
    if (!draftId) return;
    setError('');
    setLoading(true);
    try {
      await saveDraft();
      await api.validateOfferDraft(draftId);
      const signStart = await api.signStart(draftId);
      setSignSessionId(signStart.signSessionId);
      await api.signComplete(draftId, { signSessionId: signStart.signSessionId, action: 'CONFIRM' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al firmar');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!draftId) return;
    setError('');
    setLoading(true);
    try {
      const dest = otpDestination.trim() || (otpChannel === 'EMAIL' ? contactEmail.trim() : contactPhone.trim());
      if (!dest) throw new Error('Ingrese destino OTP (email o teléfono)');
      const r = await api.otpSend(draftId, { channel: otpChannel, destination: dest });
      setOtpSessionId(String((r as any).otpSessionId));
      // En stub dev puede venir debugCode
      if ((r as any).debugCode) setOtpCode(String((r as any).debugCode));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!draftId) { setError('No hay borrador disponible'); return; }
    if (!otpSessionId) { setError('Debe solicitar OTP primero'); return; }
    setLoading(true);
    try {
      await api.otpVerify(draftId, { otpSessionId, code: otpCode });
      await api.submitOfferDraft(draftId, {
        declareNoInability,
        ...(isSelfInvited && { invitationType: 'self_invited' as const }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar oferta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupplierShell activeId="procesos">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        {!tender ? <p>Cargando…</p> : (
          <Card title={String(tender.title)}>
            <p className="mb-4 text-gray-600">{String(tender.description || '—')}</p>
            {!token ? (
              <p className="text-gray-600">Debe <Link href="/login" className="text-blue-600 underline">iniciar sesión</Link> para presentar una oferta.</p>
            ) : !providerId ? (
              <p className="text-gray-600">Inicie sesión con su RUC para vincular su proveedor y poder presentar ofertas.</p>
            ) : success ? (
              <p className="text-green-600">Oferta enviada correctamente.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                  <span className={`rounded-full px-3 py-1 ${step === 0 ? 'bg-primary-light text-primary' : 'bg-neutral-200'}`}>1 Contacto</span>
                  <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-primary-light text-primary' : 'bg-neutral-200'}`}>2 Económica</span>
                  <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-primary-light text-primary' : 'bg-neutral-200'}`}>3 Documentos</span>
                  <span className={`rounded-full px-3 py-1 ${step === 3 ? 'bg-primary-light text-primary' : 'bg-neutral-200'}`}>4 Envío</span>
                </div>

                {step === 0 && (
                  <Card title="Contacto" variant="outline">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                      <Input label="Teléfono" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+593..." />
                    </div>
                  </Card>
                )}

                {step === 1 && (
                  <Card title="Oferta económica" variant="outline">
                    <div className="grid gap-3">
                      <Select label="Modo" options={ECON_MODES} value={economicMode} onChange={(e) => setEconomicMode(e.target.value as 'TOTAL' | 'ITEMS')} />
                      {economicMode === 'TOTAL' ? (
                        <>
                          <Input label="Monto total ($)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                          <Input label="Porcentaje BAE – Valor Agregado Ecuatoriano (%)" type="number" step="0.01" min={0} max={100} value={baePercentage} onChange={(e) => setBaePercentage(e.target.value)} placeholder="Ej: 30" />
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="nationalPart" checked={nationalParticipation} onChange={(e) => setNationalParticipation(e.target.checked)} className="rounded border-neutral-300" />
                            <label htmlFor="nationalPart" className="text-sm font-medium text-text-primary">Participación nacional</label>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between gap-2">
                            <div className="text-sm text-text-secondary">Ingrese ítems con cantidad y precio unitario.</div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '' }])}
                            >
                              + Agregar ítem
                            </Button>
                          </div>
                          {items.length === 0 ? (
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-text-secondary">
                              Aún no hay ítems.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {items.map((it, idx) => (
                                <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                                  <div className="grid gap-3 sm:grid-cols-4">
                                    <div className="sm:col-span-2">
                                      <Input
                                        label="Descripción"
                                        value={it.description}
                                        onChange={(e) =>
                                          setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)))
                                        }
                                        placeholder="Ej. Bien/servicio"
                                      />
                                    </div>
                                    <Input
                                      label="Cantidad"
                                      type="number"
                                      step="0.01"
                                      value={it.quantity}
                                      onChange={(e) =>
                                        setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: e.target.value } : p)))
                                      }
                                    />
                                    <Input
                                      label="Precio unit."
                                      type="number"
                                      step="0.01"
                                      value={it.unitPrice}
                                      onChange={(e) =>
                                        setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unitPrice: e.target.value } : p)))
                                      }
                                    />
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                                      Eliminar
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {economicMode === 'ITEMS' && (
                        <>
                          <Input label="Porcentaje BAE – Valor Agregado Ecuatoriano (%)" type="number" step="0.01" min={0} max={100} value={baePercentage} onChange={(e) => setBaePercentage(e.target.value)} placeholder="Ej: 30" />
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="nationalPartItems" checked={nationalParticipation} onChange={(e) => setNationalParticipation(e.target.checked)} className="rounded border-neutral-300" />
                            <label htmlFor="nationalPartItems" className="text-sm font-medium text-text-primary">Participación nacional</label>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                {step === 2 && (
                  <Card title="Documentos" variant="outline">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        label="Tipo de documento"
                        options={[
                          { value: 'DESGLOSE_ECONOMICO', label: 'Desglose económico' },
                          { value: 'FORMULARIO_OFERTA', label: 'Formulario de oferta' },
                          { value: 'FICHA_TECNICA', label: 'Ficha técnica' },
                        ]}
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                      />
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-secondary">Archivo</label>
                        <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                        <div className="text-xs text-text-secondary">
                          Máx. archivo: {(config?.limits?.maxFileBytes ? formatBytes(config.limits.maxFileBytes) : '20 MB')} · Máx. total: {(config?.limits?.maxTotalBytes ? formatBytes(config.limits.maxTotalBytes) : '100 MB')}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" variant="outline" disabled={uploading || !selectedFile} onClick={handleUpload}>
                        {uploading ? 'Subiendo…' : 'Subir documento'}
                      </Button>
                      <Button type="button" variant="outline" disabled={!draftId} onClick={refreshDocs}>
                        Refrescar lista
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-semibold text-text-primary">Cargados</div>
                      {docs.length === 0 ? (
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-text-secondary">
                          No hay documentos cargados.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
                          {docs.map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                              <div className="min-w-0">
                                <div className="truncate font-medium text-text-primary">{d.fileName}</div>
                                <div className="text-xs text-text-secondary">{d.docType} · {formatBytes(d.sizeBytes)}</div>
                              </div>
                              <div className="text-xs text-text-secondary">{new Date(d.createdAt).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {step === 3 && (
                  <Card title="Revisión y envío" variant="outline">
                    <div className="space-y-3 text-sm text-text-secondary">
                      <div>
                        <div className="font-semibold text-text-primary">Contacto</div>
                        <div>{contactEmail || '—'} · {contactPhone || '—'}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">Económica</div>
                        {economicMode === 'TOTAL' ? (
                          <div>Monto total: {amount || '—'}</div>
                        ) : (
                          <div>Ítems: {items.length}</div>
                        )}
                        <div className="mt-1 text-text-secondary">BAE: {baePercentage ? `${baePercentage}%` : '—'} · Participación nacional: {nationalParticipation ? 'Sí' : 'No'}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">Documentos</div>
                        <div>{docs.length} cargado(s)</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex items-start gap-2 rounded border border-neutral-200 bg-neutral-50 p-3">
                        <input
                          type="checkbox"
                          id="declareNoInability"
                          checked={declareNoInability}
                          onChange={(e) => setDeclareNoInability(e.target.checked)}
                          className="mt-1 rounded border-neutral-300"
                        />
                        <label htmlFor="declareNoInability" className="text-sm text-text-primary">
                          Declaro no estar incurso en inhabilidades (arts. 75 y 76 LOCP).
                        </label>
                      </div>

                      <Button type="button" variant="accent" disabled={loading || !draftId} onClick={handleValidateAndSign}>
                        Validar y firmar (stub)
                      </Button>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select label="Canal OTP" options={OTP_CHANNELS} value={otpChannel} onChange={(e) => setOtpChannel(e.target.value as 'EMAIL' | 'SMS')} />
                        <Input label="Destino OTP (opcional)" value={otpDestination} onChange={(e) => setOtpDestination(e.target.value)} placeholder="si vacío usa email/teléfono" />
                        <Input label="Código OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={loading || !draftId} onClick={handleSendOtp}>
                          Enviar OTP
                        </Button>
                        <Button type="submit" variant="accent" disabled={loading}>
                          Enviar oferta (submit)
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={step === 0}
                    onClick={async () => {
                      setError('');
                      await saveDraft();
                      setStep((s) => Math.max(0, s - 1));
                    }}
                  >
                    ← Anterior
                  </Button>
                  <Button
                    type="button"
                    disabled={step === 3}
                    onClick={async () => {
                      setError('');
                      await saveDraft();
                      setStep((s) => Math.min(3, s + 1));
                    }}
                  >
                    Siguiente →
                  </Button>
                </div>
                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              </form>
            )}
          </Card>
        )}
      </div>
    </SupplierShell>
  );
}
