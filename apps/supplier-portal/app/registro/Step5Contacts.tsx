import { useState } from 'react';
import { Card, Input, Button } from '@sercop/design-system';

export interface Step5ContactsData {
  contactIdNumber: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
}

interface Step5ContactsProps {
  initialData: Partial<Step5ContactsData>;
  onNext: (data: Step5ContactsData) => Promise<void>;
  onBack: () => void;
}

export function Step5Contacts({ initialData, onNext, onBack }: Step5ContactsProps) {
  const [data, setData] = useState({
    contactIdNumber: initialData.contactIdNumber || '',
    contactName: initialData.contactName || '',
    contactRole: initialData.contactRole || '',
    contactEmail: initialData.contactEmail || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onNext(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Contactos" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary mb-4">Ingrese los datos del contacto principal o representante legal.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Número de Identificación *"
            required
            value={data.contactIdNumber}
            onChange={(e) => setData({ ...data, contactIdNumber: e.target.value })}
            placeholder="Cédula o Pasaporte"
          />
          <Input
            label="Nombres Completos *"
            required
            value={data.contactName}
            onChange={(e) => setData({ ...data, contactName: e.target.value })}
            placeholder="Juan Pérez"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Cargo / Rol"
            value={data.contactRole}
            onChange={(e) => setData({ ...data, contactRole: e.target.value })}
            placeholder="Gerente, Propietario..."
          />
          <Input
            label="Email de Contacto *"
            type="email"
            required
            value={data.contactEmail}
            onChange={(e) => setData({ ...data, contactEmail: e.target.value })}
            placeholder="juan@empresa.com"
          />
        </div>
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Regresar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar y Continuar'}</Button>
        </div>
      </form>
    </Card>
  );
}
