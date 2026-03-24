import { useState } from 'react';
import { Card, Input, Button } from '@sercop/design-system';

export interface Step4AddressData {
  province: string;
  canton: string;
  address: string;
}

interface Step4AddressProps {
  initialData: Partial<Step4AddressData>;
  onNext: (data: Step4AddressData) => Promise<void>;
  onBack: () => void;
}

export function Step4Address({ initialData, onNext, onBack }: Step4AddressProps) {
  const [data, setData] = useState({
    province: initialData.province || '',
    canton: initialData.canton || '',
    address: initialData.address || '',
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
    <Card title="Dirección y Teléfonos" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Provincia *"
            required
            value={data.province}
            onChange={(e) => setData({ ...data, province: e.target.value })}
            placeholder="Pichincha"
          />
          <Input
            label="Cantón *"
            required
            value={data.canton}
            onChange={(e) => setData({ ...data, canton: e.target.value })}
            placeholder="Quito"
          />
        </div>
        <Input
          label="Dirección Principal *"
          required
          value={data.address}
          onChange={(e) => setData({ ...data, address: e.target.value })}
          placeholder="Av. 10 de Agosto y Naciones Unidas"
        />
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Regresar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar y Continuar'}</Button>
        </div>
      </form>
    </Card>
  );
}
