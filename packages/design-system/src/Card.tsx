import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

export function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`} {...props}>
      {title && <h3 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold">{title}</h3>}
      <div className="p-4">{children}</div>
    </div>
  );
}
