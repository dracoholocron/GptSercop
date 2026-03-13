import { useState } from 'react';
import { Card, Input, Button } from '@sercop/design-system';

export interface Step7IndicatorsData {
  annualSales: string;
  externalCapitalPercentage: string;
  employeesCount: string;
  totalAssets: string;
  fixedAssets: string;
  realEstate: string;
  netWorth: string;
}

interface Step7IndicatorsProps {
  initialData: Partial<Step7IndicatorsData>;
  onNext: (data: Step7IndicatorsData) => Promise<void>;
  onBack: () => void;
}

export function Step7Indicators({ initialData, onNext, onBack }: Step7IndicatorsProps) {
  const [data, setData] = useState({
    annualSales: initialData.annualSales || '',
    externalCapitalPercentage: initialData.externalCapitalPercentage || '',
    employeesCount: initialData.employeesCount || '',
    totalAssets: initialData.totalAssets || '',
    fixedAssets: initialData.fixedAssets || '',
    realEstate: initialData.realEstate || '',
    netWorth: initialData.netWorth || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas de que no sean montos negativos
    if (Object.values(data).some(v => Number(v) < 0)) {
      setError('Los valores financieros no pueden ser negativos.');
      return;
    }

    setLoading(true);
    try {
      await onNext(data);
    } catch(err) {
      setError('Error al guardar indicadores');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Indicadores del Proveedor" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary mb-4">Ingrese la información financiera y estructural de su organización.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Venta anual Total ($) *"
            type="number"
            step="0.01"
            min="0"
            required
            value={data.annualSales}
            onChange={(e) => setData({ ...data, annualSales: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="% Capital Extranjero *"
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            value={data.externalCapitalPercentage}
            onChange={(e) => setData({ ...data, externalCapitalPercentage: e.target.value })}
            placeholder="0"
          />
        </div>

        <Input
          label="Número de trabajadores permanentes *"
          type="number"
          min="1"
          required
          value={data.employeesCount}
          onChange={(e) => setData({ ...data, employeesCount: e.target.value })}
          placeholder="Ej: 15"
          className="sm:w-1/2"
        />

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <Input
            label="Activos Totales ($) *"
            type="number"
            step="0.01"
            min="0"
            required
            value={data.totalAssets}
            onChange={(e) => setData({ ...data, totalAssets: e.target.value })}
          />
          <Input
            label="Patrimonio Neto ($) *"
            type="number"
            step="0.01"
            min="0"
            required
            value={data.netWorth}
            onChange={(e) => setData({ ...data, netWorth: e.target.value })}
            placeholder="Activos - Pasivos"
          />
          <Input
            label="Activos Fijos ($)"
            type="number"
            step="0.01"
            min="0"
            value={data.fixedAssets}
            onChange={(e) => setData({ ...data, fixedAssets: e.target.value })}
          />
          <Input
            label="Inmuebles ($)"
            type="number"
            step="0.01"
            min="0"
            value={data.realEstate}
            onChange={(e) => setData({ ...data, realEstate: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Regresar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar y Continuar'}</Button>
        </div>
      </form>
    </Card>
  );
}
