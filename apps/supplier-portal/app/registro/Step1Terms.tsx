import { Card, Checkbox, Button } from '@sercop/design-system';

interface Step1TermsProps {
  onNext: () => void;
}

export function Step1Terms({ onNext }: Step1TermsProps) {
  return (
    <Card title="Términos y Condiciones de Uso" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="rounded-md bg-neutral-50 p-4 text-sm text-text-secondary h-64 overflow-y-auto border border-neutral-200">
          <p className="mb-4">
            Al registrarse en el Sistema Oficial de Contratación del Estado (SOCE), usted acepta los presentes Términos y Condiciones...
          </p>
          <p className="mb-4">
            <strong>1. Veracidad de la información:</strong> El proveedor declara que toda la información ingresada es real, verificable y asume la responsabilidad legal por su falsedad.
          </p>
          <p className="mb-4">
            <strong>2. Uso del portal:</strong> Las credenciales entregadas son personales e intransferibles. Cualquier actividad realizada bajo su usuario será de su exclusiva responsabilidad.
          </p>
          <p>
            <strong>3. Notificaciones:</strong> Acepta que las notificaciones enviadas al correo electrónico registrado tendrán plena validez legal.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          <Checkbox
            id="acceptTerms"
            required
            label="He leído y acepto los Términos y Condiciones de Uso del portal."
          />
          <div className="mt-6 flex justify-end">
            <Button type="submit">Continuar</Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
