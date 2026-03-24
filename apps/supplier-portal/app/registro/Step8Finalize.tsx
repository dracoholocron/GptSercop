import { useState } from 'react';
import { Card, Button, Checkbox, SummarySheet } from '@sercop/design-system';

interface Step8FinalizeProps {
  summaryData: Record<string, any>;
  onFinish: () => Promise<void>;
  onBack: () => void;
}

export function Step8Finalize({ summaryData, onFinish, onBack }: Step8FinalizeProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError('Debe aceptar el Acuerdo de Responsabilidad para finalizar.');
      return;
    }
    setLoading(true);
    try {
      await onFinish();
    } catch(err) {
      setError('Error al finalizar el registro. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Finalización de Registro" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-text-primary">Resumen de Información</h3>
        <p className="text-sm text-text-secondary">Revise la información ingresada. Si todo es correcto, acepte el acuerdo y finalice el proceso.</p>

        {/* Mapeo del Resumen. Para MVP usamos SummarySheet simple o divs */}
        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-text-secondary">RUC / Identificador</dt>
              <dd className="mt-1 text-sm text-text-primary">{summaryData.identifier || 'No provisto'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-secondary">Razón Social</dt>
              <dd className="mt-1 text-sm text-text-primary">{summaryData.name || summaryData.legalName || 'No provista'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-secondary">Email de Cuenta</dt>
              <dd className="mt-1 text-sm text-text-primary">{summaryData.email || 'No provisto'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-secondary">Dirección</dt>
              <dd className="mt-1 text-sm text-text-primary">{summaryData.province}, {summaryData.address || 'No provista'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-text-secondary">Productos Seleccionados (CPC)</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {summaryData.activityCodes?.length > 0
                  ? summaryData.activityCodes.join(', ')
                  : 'Ninguno'}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h4 className="font-semibold text-text-primary text-sm mb-2">Acuerdo de Responsabilidad</h4>
          <div className="rounded-md bg-neutral-50 p-4 text-xs text-text-secondary h-32 overflow-y-auto border border-neutral-200 mb-4">
            <p>
              El usuario declara bajo juramento que toda la información consignada en el presente formulario es verdadera y exacta, y se somete a las sanciones contempladas en la Ley Orgánica del Sistema Nacional de Contratación Pública en caso de falsedad u ocultamiento de información.
              Asimismo, asume la responsabilidad total sobre la custodia y uso adecuado de las credenciales de acceso (usuario y contraseña) a este sistema.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Checkbox
            id="agreement"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            label="He leído y acepto el Modelo de Acuerdo de Responsabilidad."
          />
          
          {error && <p className="text-sm text-red-600 mt-4" role="alert">{error}</p>}

          <div className="mt-6 flex justify-between">
            <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Regresar y Editar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Finalizando...' : 'Finalizar Registro'}</Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
