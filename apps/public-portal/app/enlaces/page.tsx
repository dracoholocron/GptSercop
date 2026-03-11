'use client';

import { Card } from '@sercop/design-system';
import { PublicShell } from '../components/PublicShell';

const LINKS = [
  { title: 'SOCE', desc: 'Sistema Oficial de Contratación Pública', href: 'https://portal.compraspublicas.gob.ec/' },
  { title: 'Registro de Proveedores', desc: 'Inscripción en el RUP', href: '/registro' },
  { title: 'Registro de Entidades Contratantes', desc: 'Registro de entidades', href: '/registro-entidad' },
  { title: 'Módulo de Compras Corporativas (SICM)', desc: 'Compras corporativas', href: 'https://portal.compraspublicas.gob.ec/' },
];

export default function EnlacesPage() {
  return (
    <PublicShell activeId="enlaces">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Enlaces rápidos</h1>
        <p className="mb-8 text-gray-600">Acceso a sistemas y registros relacionados.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {LINKS.map((l) => (
            <Card key={l.title} title={l.title}>
              <p className="mb-3 text-sm text-gray-600">{l.desc}</p>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Ir →
              </a>
            </Card>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
