import type { HTMLAttributes, ReactNode } from 'react';

export interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
}

export function PageLayout({ title, children, className = '', ...props }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`} {...props}>
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
