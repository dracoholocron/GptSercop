'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@sercop/design-system';
import { SupplierShell } from './components/SupplierShell';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portal proveedores – error:', error);
  }, [error]);

  return (
    <SupplierShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card variant="outline" className="text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Algo salió mal</h1>
          <p className="mt-2 text-text-secondary">
            Ha ocurrido un error. Puede intentar de nuevo o volver al inicio.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button variant="primary" onClick={() => reset()}>
              Intentar de nuevo
            </Button>
            <Link href="/">
              <Button variant="outline">Ir al inicio</Button>
            </Link>
          </div>
        </Card>
      </div>
    </SupplierShell>
  );
}
