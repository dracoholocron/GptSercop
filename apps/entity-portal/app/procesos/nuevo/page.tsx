'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select, type SelectOption, Tooltip, HelpCircle } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getEntityId } from '../../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function NuevoProcesoPage() {
  const router = useRouter();
  const [pacPlans, setPacPlans] = useState<Array<Record<string, unknown>>>([]);
  const [procurementPlanId, setProcurementPlanId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sustainabilityCriteria, setSustainabilityCriteria] = useState('');
  const [valueForMoneyCriteria, setValueForMoneyCriteria] = useState('');
  const [territoryPreference, setTerritoryPreference] = useState<string>('');
  const [processType, setProcessType] = useState('');
  const [regime, setRegime] = useState('');
  const [minimumQuotes, setMinimumQuotes] = useState('3');
  const [marketStudyDocumentId, setMarketStudyDocumentId] = useState('');
  const [referenceBudgetAmount, setReferenceBudgetAmount] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [questionsDeadlineAt, setQuestionsDeadlineAt] = useState('');
  const [bidsDeadlineAt, setBidsDeadlineAt] = useState('');
  const [responsibleType, setResponsibleType] = useState('');
  const [electronicSignatureRequired, setElectronicSignatureRequired] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();
  const entityId = getEntityId();

  useEffect(() => {
    if (token) setToken(token);
    if (entityId) {
      api.getPac({ entityId }).then((r) => {
        setPacPlans(r.data as Array<Record<string, unknown>>);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [token, entityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!procurementPlanId || !title.trim()) { setError('Plan y título son obligatorios'); return; }
    if (regime === 'infima_cuantia') {
      const n = parseInt(minimumQuotes, 10);
      if (!Number.isInteger(n) || n < 3) { setError('En ínfima cuantía el mínimo de cotizaciones debe ser al menos 3'); return; }
    }
    setSaving(true);
    try {
      await api.createTender({
        procurementPlanId,
        title: title.trim(),
        description: description.trim() || undefined,
        territoryPreference: territoryPreference && territoryPreference !== 'ninguna' ? territoryPreference : undefined,
        processType: processType || undefined,
        regime: regime || undefined,
        minimumQuotes: regime === 'infima_cuantia' && minimumQuotes ? parseInt(minimumQuotes, 10) : undefined,
        marketStudyDocumentId: marketStudyDocumentId.trim() || undefined,
        referenceBudgetAmount: referenceBudgetAmount ? parseFloat(referenceBudgetAmount) : undefined,
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : undefined,
        questionsDeadlineAt: questionsDeadlineAt.trim() || undefined,
        bidsDeadlineAt: bidsDeadlineAt.trim() || undefined,
        responsibleType: responsibleType === 'commission' || responsibleType === 'delegate' ? responsibleType : undefined,
        electronicSignatureRequired,
        sustainabilityCriteria: sustainabilityCriteria.trim() ? { description: sustainabilityCriteria.trim() } : undefined,
        valueForMoneyCriteria: valueForMoneyCriteria.trim() ? { description: valueForMoneyCriteria.trim() } : undefined,
      });
      router.push('/procesos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityShell activeId="procesos">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block"><Button variant="secondary" size="sm">← Volver</Button></Link>
        <Card title="Nuevo proceso">
          {!token || !entityId ? (
            <p className="text-gray-600">Inicie sesión para crear procesos.</p>
          ) : loading ? (
            <p>Cargando…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label htmlFor="nuevo-plan-pac" className="block text-sm font-medium">Plan PAC</label>
              <select id="nuevo-plan-pac" value={procurementPlanId} onChange={(e) => setProcurementPlanId(e.target.value)} className="w-full rounded border p-2" required>
                <option value="">Seleccione plan</option>
                {pacPlans.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>{`PAC ${p.year} – ${(p.entity as { name?: string })?.name || ''}`}</option>
                ))}
              </select>
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Select
                label="Tipo de proceso"
                options={[
                  { value: '', label: '— Seleccione —' },
                  { value: 'licitacion', label: 'Licitación' },
                  { value: 'contratacion_directa', label: 'Contratación directa' },
                  { value: 'catalogo', label: 'Catálogo' },
                  { value: 'sie', label: 'SIE' },
                  { value: 'feria_inclusiva', label: 'Feria inclusiva' },
                  { value: 'emergencia', label: 'Emergencia' },
                ] as SelectOption[]}
                value={processType}
                onChange={(e) => setProcessType(e.target.value)}
              />
              {processType === 'feria_inclusiva' && <p className="text-xs text-amber-600">Ferias inclusivas: en desarrollo por la autoridad rectora.</p>}
              <Select
                label="Régimen"
                options={[
                  { value: '', label: '— Seleccione —' },
                  { value: 'ordinario', label: 'Ordinario' },
                  { value: 'infima_cuantia', label: 'Ínfima cuantía' },
                  { value: 'especial', label: 'Régimen especial' },
                  { value: 'emergencia', label: 'Emergencia' },
                ] as SelectOption[]}
                value={regime}
                onChange={(e) => setRegime(e.target.value)}
              />
              {regime === 'infima_cuantia' && (
                <>
                  <Input label="Mínimo de cotizaciones" type="number" min={3} value={minimumQuotes} onChange={(e) => setMinimumQuotes(e.target.value)} placeholder="3" />
                  <Input label="ID documento estudio de mercado (opcional)" value={marketStudyDocumentId} onChange={(e) => setMarketStudyDocumentId(e.target.value)} placeholder="UUID del documento" />
                  <p className="text-xs text-text-secondary">En ínfima cuantía se requiere al menos 3 cotizaciones; cuando no exista más oferta en el mercado, adjunte informe de necesidad o estudio de mercado.</p>
                </>
              )}
              {regime === 'emergencia' && <p className="text-xs text-text-secondary">Para régimen emergencia puede adjuntar el plan de contingencia al editar el proceso una vez creado.</p>}
              {processType === 'licitacion' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="min-w-0 flex-1">
                      <Input label="Presupuesto referencial ($)" type="number" min={10001} step="0.01" value={referenceBudgetAmount} onChange={(e) => setReferenceBudgetAmount(e.target.value)} placeholder="Licitación requiere > 10.000" />
                    </span>
                    <Tooltip content="En licitación debe ser mayor a $10.000. Define el techo para las ofertas." position="top">
                      <span className="inline-block pt-8"><HelpCircle className="h-4 w-4 text-text-secondary" aria-hidden /></span>
                    </Tooltip>
                  </div>
                  <Input label="Monto estimado ($) (opcional)" type="number" step="0.01" value={estimatedAmount} onChange={(e) => setEstimatedAmount(e.target.value)} placeholder="Ej: 50.000" />
                  <Select
                    label="Responsable (comisión o delegado)"
                    options={[
                      { value: '', label: '— Seleccione —' },
                      { value: 'commission', label: 'Comisión técnica (monto ≥ $100.000)' },
                      { value: 'delegate', label: 'Delegado (monto < $100.000)' },
                    ] as SelectOption[]}
                    value={responsibleType}
                    onChange={(e) => setResponsibleType(e.target.value)}
                  />
                  <Input label="Límite preguntas (fecha/hora)" type="datetime-local" value={questionsDeadlineAt} onChange={(e) => setQuestionsDeadlineAt(e.target.value)} />
                  <Input label="Límite entrega ofertas (fecha/hora)" type="datetime-local" value={bidsDeadlineAt} onChange={(e) => setBidsDeadlineAt(e.target.value)} />
                </>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="electronicSignatureRequired" checked={electronicSignatureRequired} onChange={(e) => setElectronicSignatureRequired(e.target.checked)} className="rounded border-neutral-300" />
                <label htmlFor="electronicSignatureRequired" className="text-sm text-text-secondary">Firma electrónica requerida (ferias, emergencia e ínfima pueden eximir)</label>
              </div>
              <Select
                label="Preferencia territorial (opcional)"
                options={[
                  { value: '', label: 'Ninguna' },
                  { value: 'amazonia', label: 'Amazonía' },
                  { value: 'galapagos', label: 'Galápagos' },
                ] as SelectOption[]}
                value={territoryPreference}
                onChange={(e) => setTerritoryPreference(e.target.value)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Criterios de sostenibilidad (opcional)</label>
                <textarea
                  value={sustainabilityCriteria}
                  onChange={(e) => setSustainabilityCriteria(e.target.value)}
                  placeholder="Ambiental, social y económico. Ej.: eficiencia energética, materiales reciclados, inclusión."
                  className="min-h-[80px] w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Criterios de mejor valor por dinero (opcional)</label>
                <textarea
                  value={valueForMoneyCriteria}
                  onChange={(e) => setValueForMoneyCriteria(e.target.value)}
                  placeholder="Vida útil, eficiencia, impacto social. No solo precio más bajo."
                  className="min-h-[80px] w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>Crear proceso</Button>
            </form>
          )}
        </Card>
      </div>
    </EntityShell>
  );
}
