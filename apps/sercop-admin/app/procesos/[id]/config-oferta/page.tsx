'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '../../../components/AdminShell';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../../../lib/auth';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const DEFAULT_CONFIG = {
  processId: '',
  modality: 'LICITACION',
  version: '1',
  limits: {
    maxFileBytes: 20 * 1024 * 1024,
    maxTotalBytes: 100 * 1024 * 1024,
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'],
  },
  otp: { enabled: true, channels: ['SMS', 'EMAIL'], ttlSeconds: 600, maxAttempts: 5, cooldownSeconds: 60 },
  signature: { enabled: true, provider: 'STUB', mode: 'REMOTE' },
  steps: [
    { id: 'ELIGIBILITY', title: 'Elegibilidad', enabled: true, fields: [] },
    { id: 'BIDDER', title: 'Datos del oferente', enabled: true, fields: [] },
    { id: 'TECHNICAL', title: 'Oferta técnica', enabled: true, fields: [] },
    { id: 'ECONOMIC', title: 'Oferta económica', enabled: true, fields: [] },
    { id: 'DOCUMENTS', title: 'Documentos', enabled: true, fields: [] },
    { id: 'DECLARATIONS', title: 'Declaraciones', enabled: true, fields: [] },
    { id: 'REVIEW', title: 'Revisión y envío', enabled: true, fields: [] },
  ],
  documents: [
    { docType: 'FORMULARIO_OFERTA', label: 'Formulario de oferta', required: false, allowedExtensions: ['.pdf', '.doc', '.docx'] },
    { docType: 'DESGLOSE_ECONOMICO', label: 'Desglose económico', required: false, allowedExtensions: ['.pdf', '.xls', '.xlsx'] },
  ],
  constraints: { timeline: null, budgetRules: { hasReferenceBudget: false } },
};

export default function ConfigOfertaPage() {
  const params = useParams();
  const processId = params.id as string;
  const token = getToken();

  const [tender, setTender] = useState<Record<string, unknown> | null>(null);
  const [modality, setModality] = useState('LICITACION');
  const [configStr, setConfigStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setToken(token);
    Promise.all([
      api.getTender(processId).catch(() => null),
      api.getOfferFormConfig(processId).catch(() => null),
    ]).then(([t, config]) => {
      setTender((t as Record<string, unknown>) || null);
      if (config && typeof config === 'object') {
        const c = config as Record<string, unknown>;
        if (typeof c.modality === 'string') setModality(c.modality);
        setConfigStr(JSON.stringify(config, null, 2));
      } else {
        const defaultWithId = { ...DEFAULT_CONFIG, processId };
        setConfigStr(JSON.stringify(defaultWithId, null, 2));
      }
      setLoading(false);
    });
  }, [processId, token]);

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configStr) as Record<string, unknown>;
    } catch {
      setError('El JSON de configuración no es válido.');
      return;
    }
    setSaving(true);
    try {
      await api.putOfferFormConfig(processId, { modality, config });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell activeId="procesos">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/procesos" className="mb-4 inline-block">
          <Button variant="secondary" size="sm">← Volver</Button>
        </Link>
        <h1 className="mb-4 text-2xl font-semibold">Configuración del wizard de oferta</h1>
        {loading ? (
          <p>Cargando…</p>
        ) : (
          <Card title={tender ? `Proceso: ${(tender as any).title}` : `Proceso ${processId}`}>
            <div className="space-y-4">
              <Input
                label="Modalidad"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                placeholder="LICITACION | SIE | ..."
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Config (JSON)
                </label>
                <textarea
                  className="w-full rounded border border-neutral-300 bg-white p-3 font-mono text-sm min-h-[320px]"
                  value={configStr}
                  onChange={(e) => setConfigStr(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="accent" disabled={saving} onClick={handleSave}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </Button>
                {success && <span className="text-sm text-green-600">Guardado correctamente.</span>}
              </div>
              {error && <p className="text-sm text-error" role="alert">{error}</p>}
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
