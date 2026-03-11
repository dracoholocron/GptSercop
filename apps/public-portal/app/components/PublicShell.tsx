'use client';

import Link from 'next/link';
import { AppHeader, AppFooter } from '@sercop/design-system';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', href: '/' },
  { id: 'procesos', label: 'Buscar Procesos', href: '/procesos' },
  { id: 'normativa', label: 'Normativa', href: '/normativa' },
  { id: 'cifras', label: 'Contratación en Cifras', href: '/cifras' },
  { id: 'servicios', label: 'Servicios', href: '/servicios' },
  { id: 'enlaces', label: 'Enlaces', href: '/enlaces' },
];

const FOOTER_LINKS = [
  { label: 'Normativa', href: '/normativa' },
  { label: 'SOCE', href: 'https://portal.compraspublicas.gob.ec/' },
  { label: 'Registro de Proveedores', href: '/enlaces' },
];

export function PublicShell({ children, activeId }: { children: React.ReactNode; activeId?: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <AppHeader
        title="SERCOP – Portal público"
        navItems={NAV_ITEMS}
        activeId={activeId}
        LinkComponent={Link as React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>}
      />
      <main id="main" className="flex-1" tabIndex={-1}>{children}</main>
      <AppFooter
        links={FOOTER_LINKS}
        copyright={`© ${new Date().getFullYear()} SERCOP – Servicio Nacional de Contratación Pública`}
      />
    </div>
  );
}
