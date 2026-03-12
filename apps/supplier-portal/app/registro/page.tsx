'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@sercop/design-system';
import { api, setBaseUrl, setToken, type Provider } from '@sercop/api-client';
import { setProviderId, getToken, getProviderId } from '../lib/auth';
import { SupplierShell } from '../components/SupplierShell';
import Link from 'next/link';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', identifier: '', legalName: '', tradeName: '', province: '', canton: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [step, setStep] = useState(0);
  const [cpcSearch, setCpcSearch] = useState('');
  const [cpcSuggestions, setCpcSuggestions] = useState<Array<{ code: string; description: string }>>([]);
  const [activityCodes, setActivityCodes] = useState<string[]>([]);
  const [savingStep, setSavingStep] = useState(false);
  const [savingCpc, setSavingCpc] = useState(false);

  useEffect(() => {
    const t = getToken();
    const pid = getProviderId();
    if (t && pid) {
      setToken(t);
      api.getProvider(pid).then((p) => {
        setProvider(p);
        setStep(p.registrationStep ?? 0);
        setActivityCodes(p.activityCodes ?? []);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!cpcSearch.trim()) { setCpcSuggestions([]); return; }
    const t = setTimeout(() => {
      api.getCpcSuggestions({ q: cpcSearch, limit: 10 }).then((r) => setCpcSuggestions(r.data || [])).catch(() => setCpcSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [cpcSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    if (form.identifier.trim() && !/^\d{13}$/.test(form.identifier.trim())) { setError('El RUC debe tener 13 dígitos'); return; }
    setLoading(true);
    try {
      const provider = await api.createProvider({
        name: form.name.trim(),
        identifier: form.identifier.trim() || undefined,
        legalName: form.legalName.trim() || undefined,
        tradeName: form.tradeName.trim() || undefined,
        province: form.province.trim() || undefined,
        canton: form.canton.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setProviderId(provider.id);
      router.push('/login?registered=1');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar';
      setError(msg.includes('fetch') || msg.includes('Failed') ? 'No se pudo conectar con el servidor. Asegúrese de que la API esté ejecutándose (npm run dev).' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupplierShell activeId="registro">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Registro RUP (Registro Único de Proveedores)</h1>
        <Card title="Datos del proveedor">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre / Razón social *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Ej: Empresa XYZ S.A." />
            <Input label="RUC / Identificador" value={form.identifier} onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))} placeholder="Ej: 1234567890001" />
            <Input label="Nombre legal" value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} placeholder="Razón social legal" />
            <Input label="Nombre comercial" value={form.tradeName} onChange={(e) => setForm((f) => ({ ...f, tradeName: e.target.value }))} placeholder="Nombre de fantasía" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Provincia" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} placeholder="Pichincha" />
              <Input label="Cantón" value={form.canton} onChange={(e) => setForm((f) => ({ ...f, canton: e.target.value }))} placeholder="Quito" />
            </div>
            <Input label="Dirección" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Av. Principal 123" />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" disabled={loading}>Registrarme</Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            ¿Ya tiene cuenta? <Link href="/login" className="text-blue-600 hover:underline">Iniciar sesión</Link>
          </p>
        </Card>

        {provider && (
          <Card title="Completar registro RUP (pasos 8+6)" variant="outline" className="mt-6">
            <p className="mb-4 text-sm text-text-secondary">Paso actual del registro: {step} de 14. Códigos CPC de actividad.</p>
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                <label className="w-full sm:w-auto">
                  <span className="block text-sm font-medium text-text-secondary mb-1">Avanzar a paso</span>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    value={step}
                    onChange={(e) => setStep(Math.max(0, Math.min(14, parseInt(e.target.value, 10) || 0)))}
                    className="w-20 rounded border border-neutral-300 px-2 py-1"
                  />
                </label>
                <Button size="sm" disabled={savingStep} onClick={async () => {
                  setSavingStep(true);
                  try {
                    await api.updateProvider(provider.id, { registrationStep: step });
                    setProvider(await api.getProvider(provider.id));
                  } finally { setSavingStep(false); }
                }}>Guardar paso</Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Códigos CPC (actividad)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {activityCodes.map((code) => (
                    <span key={code} className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-sm">
                      {code}
                      <button type="button" className="ml-1 text-neutral-500 hover:text-red-600" onClick={() => setActivityCodes((a) => a.filter((c) => c !== code))}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Buscar CPC..." value={cpcSearch} onChange={(e) => setCpcSearch(e.target.value)} className="flex-1" />
                </div>
                {cpcSuggestions.length > 0 && (
                  <ul className="mt-1 rounded border border-neutral-200 bg-white py-1 text-sm">
                    {cpcSuggestions.map((s) => (
                      <li key={s.code}>
                        <button type="button" className="w-full px-3 py-1 text-left hover:bg-neutral-50" onClick={() => { setActivityCodes((a) => a.includes(s.code) ? a : [...a, s.code]); setCpcSearch(''); setCpcSuggestions([]); }}>
                          {s.code} – {s.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button size="sm" className="mt-2" disabled={savingCpc} onClick={async () => {
                  setSavingCpc(true);
                  try {
                    await api.updateProvider(provider.id, { activityCodes });
                    setProvider(await api.getProvider(provider.id));
                  } finally { setSavingCpc(false); }
                }}>Guardar códigos CPC</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </SupplierShell>
  );
}
