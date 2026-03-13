import { useState } from 'react';
import { Card, Input, Button } from '@sercop/design-system';

interface Step2IdentifierProps {
  initialEmail?: string;
  onNext: (data: { email: string; name: string }) => Promise<void>;
}

export function Step2Identifier({ initialEmail = '', onNext }: Step2IdentifierProps) {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onNext({ email, name });
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Creación de Credenciales" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary mb-4">
          Ingrese el correo electrónico y el nombre representativo del proveedor. Estos datos serán utilizados para validar la creación inicial de su cuenta.
        </p>

        <Input
          label="Correo Electrónico *"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ejemplo@empresa.com"
        />

        <Input
          label="Razón Social / Nombres Completos *"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Proveedores Unidos S.A."
        />

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Crear Cuenta y Continuar'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
