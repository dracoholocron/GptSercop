import Link from 'next/link';
import { Card, Button } from '@sercop/design-system';
import { PublicShell } from './components/PublicShell';

export default function NotFound() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card variant="outline" className="text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Página no encontrada</h1>
          <p className="mt-2 text-text-secondary">
            La ruta que ha solicitado no existe o ya no está disponible.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button variant="primary">Inicio</Button>
            </Link>
            <Link href="/procesos">
              <Button variant="outline">Buscar procesos</Button>
            </Link>
          </div>
        </Card>
      </div>
    </PublicShell>
  );
}
