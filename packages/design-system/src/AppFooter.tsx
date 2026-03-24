import type { ReactNode } from 'react';

export interface AppFooterLink {
  label: string;
  href: string;
}

export interface AppFooterProps {
  links?: AppFooterLink[];
  copyright?: ReactNode;
  className?: string;
}

export function AppFooter({ links = [], copyright, className = '' }: AppFooterProps) {
  return (
    <footer
      className={`mt-auto border-t border-neutral-200 bg-neutral-50 py-8 ${className}`}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {links.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-text-secondary underline-offset-2 transition-colors hover:text-primary hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        {copyright && <p className="text-sm text-text-secondary">{copyright}</p>}
      </div>
    </footer>
  );
}
