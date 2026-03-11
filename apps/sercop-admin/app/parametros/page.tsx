'use client';

import { Card } from '@sercop/design-system';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

export default function ParametrosPage() {
  const token = getToken();

  return (
    <AdminShell activeId="parametros">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Parámetros</h1>
        {!token ? (
          <Card title="Inicie sesión"><Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link></Card>
        ) : (
          <Card title="Configuración del sistema">
            <p className="text-gray-600">Módulo de parámetros en desarrollo. Aquí se configurarán umbrales, plazos y otros parámetros del sistema.</p>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
