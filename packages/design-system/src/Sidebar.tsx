import React from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarProps {
  title?: string;
  logo?: React.ReactNode;
  items: SidebarItem[];
  activeId?: string;
  LinkComponent?: React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>;
}

export function Sidebar({ title = 'SERCOP CMX', logo, items, activeId, LinkComponent }: SidebarProps) {
  const Link = LinkComponent || 'a';
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-white border-r border-neutral-200 shadow-sm hidden md:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-primary px-6 gap-3">
        {logo && <div className="h-8 w-8 text-primary">{logo}</div>}
        <span className="text-xl font-bold tracking-tight text-text-primary uppercase">{title}</span>
      </div>
      <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-primary-light hover:text-primary'
              }`}
            >
              {item.icon && (
                <span className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-primary'}`}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-neutral-200 text-xs text-neutral-500 text-center">
        Powered by GptSercop
      </div>
    </aside>
  );
}
