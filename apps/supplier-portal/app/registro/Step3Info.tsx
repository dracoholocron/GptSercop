import { useState } from 'react';
import { Card, Input, Button } from '@sercop/design-system';

export interface Step3InfoData {
  identifier: string;
  legalName: string;
  tradeName: string;
}

interface Step3InfoProps {
  initialData: Partial<Step3InfoData>;
  onNext: (data: Step3InfoData) => Promise<void>;
  onBack: () => void;
}

export function Step3Info({ initialData, onNext, onBack }: Step3InfoProps) {
  const [data, setData] = useState({
    identifier: initialData.identifier || '',
    legalName: initialData.legalName || '',
    tradeName: initialData.tradeName || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.identifier) {
      setError('El RUC o Identificador es obligatorio');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onNext(data);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Información del Proveedor" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="RUC / Identificador *"
          required
          value={data.identifier}
          onChange={(e) => setData({ ...data, identifier: e.target.value })}
          placeholder="Ej: 1234567890001"
        />
        <Input
          label="Nombre legal (Razón Social)"
          value={data.legalName}
          onChange={(e) => setData({ ...data, legalName: e.target.value })}
          placeholder="Razón social oficial según SRI"
        />
        <Input
          label="Nombre comercial"
          value={data.tradeName}
          onChange={(e) => setData({ ...data, tradeName: e.target.value })}
          placeholder="Nombre de fantasía o marca"
        />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Regresar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar y Continuar'}</Button>
        </div>
      </form>
    </Card>
  );
}
