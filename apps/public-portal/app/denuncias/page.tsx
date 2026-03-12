'use client';

import { useState } from 'react';
import { Card, Button, Input, Select, type SelectOption } from '@sercop/design-system';
import { api, setBaseUrl } from '@sercop/api-client';
import { PublicShell } from '../components/PublicShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: 'WEB', label: 'Portal web' },
  { value: 'PHONE', label: 'Teléfono' },
  { value: 'IN_PERSON', label: 'Presencial' },
  { value: 'OTHER', label: 'Otro' },
];

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'TRANSPARENCIA', label: 'Transparencia' },
  { value: 'INTEGRIDAD', label: 'Integridad' },
  { value: 'ETICA', label: 'Ética' },
  { value: 'CORRUPCION', label: 'Posible corrupción' },
  { value: 'TRATO_JUSTO', label: 'Trato justo / competencia' },
  { value: 'OTHER', label: 'Otro' },
];

export default function DenunciasPage() {
  const [channel, setChannel] = useState('WEB');
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [tenderId, setTenderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!category.trim() || !summary.trim()) {
      setError('Categoría y resumen son obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createComplaint({
        channel,
        category: category.trim(),
        summary: summary.trim(),
        details: details.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        tenderId: tenderId.trim() || undefined,
      });
      setSent(true);
      setSummary('');
      setDetails('');
      setContactEmail('');
      setContactPhone('');
      setTenderId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la denuncia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell activeId="denuncias">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Denuncias</h1>
        <p className="mb-6 text-text-secondary">
          Canal para reportar irregularidades en procesos de contratación, entidades o proveedores. Los datos serán tratados con confidencialidad.
        </p>

        <Card variant="outline" className="mb-6 border-blue-100 bg-blue-50/50">
          <p className="text-sm text-text-primary">
            También puede presentar su denuncia por <strong>oficio formal</strong> o al correo{' '}
            <a href="mailto:gestiocumental@sercop.gov.ec" className="font-medium text-primary hover:underline">gestiocumental@sercop.gov.ec</a>.
          </p>
        </Card>

        {sent ? (
          <Card variant="outline" className="border-green-200 bg-green-50">
            <p className="font-medium text-green-800">Denuncia registrada correctamente.</p>
            <p className="mt-1 text-sm text-green-700">
              Hemos recibido su denuncia. Si indicó correo o teléfono, nos pondremos en contacto según corresponda.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
              Enviar otra denuncia
            </Button>
          </Card>
        ) : (
          <Card title="Registrar denuncia" variant="outline">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Canal de recepción"
                options={CHANNEL_OPTIONS}
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              />
              <Select
                label="Categoría"
                options={[{ value: '', label: 'Seleccione' }, ...CATEGORY_OPTIONS]}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <Input
                label="Resumen"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Breve descripción del hecho"
                required
              />
              <Input
                label="Detalle (opcional)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Descripción ampliada si lo desea"
              />
              <Input
                label="ID del proceso (opcional)"
                value={tenderId}
                onChange={(e) => setTenderId(e.target.value)}
                placeholder="Si la denuncia refiere a un proceso específico"
              />
              <Input
                label="Correo de contacto (opcional)"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
              <Input
                label="Teléfono de contacto (opcional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Ej: 0999999999"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="accent" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Enviar denuncia'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </PublicShell>
  );
}
