'use client';

import Link from 'next/link';
import { Sidebar, TopBar, AppFooter, OfficialBanner, SercopLogo } from '@sercop/design-system';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', href: '/' },
  { id: 'procesos', label: 'Buscar Procesos', href: '/procesos' },
  { id: 'denuncias', label: 'Denuncias', href: '/denuncias' },
  { id: 'normativa', label: 'Normativa', href: '/normativa' },
  { id: 'principios', label: 'Principios', href: '/principios' },
  { id: 'licitacion-plazos', label: 'Plazos y requisitos – Licitación', href: '/licitacion-plazos' },
  { id: 'modelos-pliegos', label: 'Modelos de pliegos', href: '/modelos-pliegos' },
  { id: 'notificaciones', label: 'Notificaciones', href: '/notificaciones' },
  { id: 'certificacion', label: 'Certificación', href: '/certificacion' },
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
    <div className="flex min-h-screen bg-neutral-50 text-text-primary">
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <Sidebar
        title="Portal Ciudadano"
        logo={<SercopLogo variant="compact" />}
        items={NAV_ITEMS}
        activeId={activeId}
        LinkComponent={Link as React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>}
      />
      <div className="flex flex-1 flex-col md:ml-64 transition-all duration-300">
        <OfficialBanner title="Portal de Contratación Pública" />
        <TopBar
          title="Búsqueda y Transparencia"
          userName="Ciudadanía"
          role="Veedor"
        />
        <main id="main" className="flex-1 w-full" tabIndex={-1}>
          {children}
        </main>
        <AppFooter
          links={FOOTER_LINKS}
          copyright={`© ${new Date().getFullYear()} Compras Públicas Ecuador`}
        />
      </div>
    </div>
  );
}
