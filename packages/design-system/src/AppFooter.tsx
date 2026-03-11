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
    <footer className={`border-t border-gray-200 bg-white py-6 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {links.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-gray-600 hover:text-blue-600">
                {link.label}
              </a>
            ))}
          </div>
        )}
        {copyright && <p className="text-sm text-gray-500">{copyright}</p>}
      </div>
    </footer>
  );
}
