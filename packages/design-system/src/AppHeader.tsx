'use client';

import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';

export interface AppHeaderNavItem {
  id: string;
  label: string;
  href: string;
}

export interface AppHeaderProps {
  title: string;
  logo?: ReactNode;
  navItems?: AppHeaderNavItem[];
  activeId?: string;
  rightContent?: ReactNode;
  LinkComponent?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
}

export function AppHeader({ title, logo, navItems = [], activeId, rightContent, LinkComponent }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const Link = LinkComponent ?? 'a';
  const hasNav = navItems.length > 0;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 text-xl font-semibold text-text-primary no-underline">
            <span className="inline-flex h-10 shrink-0 items-center">{logo ?? null}</span>
            <span>{title}</span>
          </Link>
          {hasNav ? (
            <>
              <button
                type="button"
                className="rounded p-2 text-text-secondary hover:bg-neutral-100 md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-label="Menú"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <nav className={`${mobileOpen ? 'block' : 'hidden'} md:block`} aria-label="Navegación principal">
                <ul className="absolute left-4 right-4 top-16 flex flex-col gap-1 rounded border border-neutral-200 bg-white p-2 shadow md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0 md:shadow-none">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={`block rounded px-3 py-2 text-sm font-medium md:inline-block ${
                          activeId === item.id ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-neutral-100'
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          ) : null}
        </div>
        {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
      </div>
    </header>
  );
}
