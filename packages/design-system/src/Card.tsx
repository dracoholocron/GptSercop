import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'default' | 'elevated' | 'outline';
  children: ReactNode;
}

const cardVariants = {
  default: 'border border-neutral-200 bg-white shadow-sm',
  elevated: 'border border-neutral-200 bg-white shadow-md',
  outline: 'border border-neutral-200 bg-white',
};

export function Card({ title, variant = 'default', children, className = '', ...props }: CardProps) {
  return (
    <div className={`rounded-lg ${cardVariants[variant]} ${className}`} {...props}>
      {title && <h3 className="border-b border-neutral-100 px-4 py-3 text-lg font-semibold text-text-primary">{title}</h3>}
      <div className="p-4">{children}</div>
    </div>
  );
}
