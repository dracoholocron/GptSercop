'use client';

import { Card, ExternalLink } from '@sercop/design-system';
import { PublicShell } from '../components/PublicShell';

const LINKS = [
  { title: 'SOCE', desc: 'Sistema Oficial de Contratación Pública', href: 'https://portal.compraspublicas.gob.ec/', external: true },
  { title: 'Registro de Proveedores', desc: 'Inscripción en el RUP', href: '/registro', external: false },
  { title: 'Registro de Entidades Contratantes', desc: 'Registro de entidades', href: '/registro-entidad', external: false },
  { title: 'Módulo de Compras Corporativas (SICM)', desc: 'Compras corporativas', href: 'https://portal.compraspublicas.gob.ec/', external: true },
];

export default function EnlacesPage() {
  return (
    <PublicShell activeId="enlaces">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Enlaces rápidos</h1>
        <p className="mb-8 text-text-secondary">Acceso a sistemas y registros relacionados.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {LINKS.map((l) => (
            <Card key={l.title} title={l.title} variant="elevated">
              <p className="mb-4 text-sm text-text-secondary">{l.desc}</p>
              <a
                href={l.href}
                {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Ir al sitio
                {l.external && <ExternalLink className="h-4 w-4" />}
              </a>
            </Card>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
