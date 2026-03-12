'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppHeader, AppFooter, SercopLogo } from '@sercop/design-system';
import { isLoggedIn, logout } from '../lib/auth';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', href: '/' },
  { id: 'pac', label: 'PAC', href: '/pac' },
  { id: 'procesos', label: 'Procesos', href: '/procesos' },
  { id: 'catalogos', label: 'Catálogos', href: '/catalogos' },
  { id: 'ordenes-compra', label: 'Órdenes de compra', href: '/ordenes-compra' },
  { id: 'rendicion-cuentas', label: 'Rendición de cuentas', href: '/rendicion-cuentas' },
  { id: 'reportes', label: 'Reportes', href: '/reportes' },
  { id: 'documentos', label: 'Documentos', href: '/documentos' },
];

const FOOTER_LINKS = [
  { label: 'Portal público', href: process.env.NEXT_PUBLIC_PUBLIC_URL || 'http://localhost:3000' },
];

export function EntityShell({ children, activeId }: { children: React.ReactNode; activeId?: string }) {
  const pathname = usePathname();
  const loggedIn = isLoggedIn();
  const isLoginPage = pathname === '/login';

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <AppHeader
        title="Portal entidad"
        logo={<SercopLogo variant="compact" />}
        navItems={NAV_ITEMS}
        activeId={activeId}
        rightContent={
          !isLoginPage && (
            loggedIn ? (
              <button type="button" onClick={() => { logout(); window.location.href = '/'; }} className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cerrar sesión
              </button>
            ) : (
              <Link href="/login" className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Iniciar sesión
              </Link>
            )
          )
        }
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
