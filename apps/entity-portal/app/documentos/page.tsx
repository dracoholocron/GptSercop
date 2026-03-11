'use client';

import { Card } from '@sercop/design-system';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

export default function DocumentosPage() {
  const token = getToken();

  return (
    <EntityShell activeId="documentos">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Documentos</h1>
        {!token ? (
          <Card title="Inicie sesión"><Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link></Card>
        ) : (
          <Card title="Gestión de documentos">
            <p className="text-gray-600">Módulo de documentos en desarrollo. Los documentos se gestionan desde los procesos y contratos.</p>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
