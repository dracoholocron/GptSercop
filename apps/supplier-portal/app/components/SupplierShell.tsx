'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, TopBar, AppFooter, SercopLogo } from '@sercop/design-system';
import { isLoggedIn, logout } from '../lib/auth';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', href: '/' },
  { id: 'registro', label: 'Registrarme', href: '/registro' },
  { id: 'procesos', label: 'Procesos Abiertos', href: '/procesos' },
  { id: 'ofertas', label: 'Mis Ofertas', href: '/ofertas' },
  { id: 'normativa', label: 'Normativa', href: '/normativa' },
  { id: 'perfil', label: 'Mi Perfil', href: '/perfil' },
];

const FOOTER_LINKS = [
  { label: 'Normativa', href: '/normativa' },
  { label: 'Portal público', href: process.env.NEXT_PUBLIC_PUBLIC_URL || 'http://localhost:3000' },
];

export function SupplierShell({ children, activeId }: { children: React.ReactNode; activeId?: string }) {
  const pathname = usePathname();
  const loggedIn = isLoggedIn();
  const isLoginPage = pathname === '/login';

  return (
    <div className="flex min-h-screen bg-neutral-50 text-text-primary">
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <Sidebar
        title="Portal Proveedores"
        logo={<SercopLogo variant="compact" />}
        items={NAV_ITEMS}
        activeId={activeId}
        LinkComponent={Link as React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>}
      />
      <div className="flex flex-1 flex-col md:ml-64 transition-all duration-300">
        <TopBar
          title="Portal Proveedores"
          userName={loggedIn ? 'Empresa Registrada' : 'Invitado'}
          role={loggedIn ? 'Proveedor' : 'Visitante'}
          rightContent={
            !isLoginPage && (
              loggedIn ? (
                <button type="button" onClick={() => { logout(); window.location.href = '/'; }} className="rounded px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-neutral-100 transition-colors">
                  Cerrar sesión
                </button>
              ) : (
                <Link href="/login" className="rounded px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-neutral-100 transition-colors">
                  Iniciar sesión
                </Link>
              )
            )
          }
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
