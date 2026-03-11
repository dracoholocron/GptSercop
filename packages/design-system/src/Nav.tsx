import type { ComponentType, ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface NavProps {
  items: NavItem[];
  activeId?: string;
  className?: string;
  LinkComponent?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
}

export function Nav({ items, activeId, className = '', LinkComponent }: NavProps) {
  const Link = LinkComponent ?? 'a';
  return (
    <nav className={className} aria-label="Navegación principal">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`rounded px-3 py-2 text-sm font-medium ${
                activeId === item.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
