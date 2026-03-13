import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'default' | 'elevated' | 'outline' | 'interactive';
  children: ReactNode;
}

const cardVariants = {
  default: 'border border-neutral-200 bg-white shadow-sm transition-shadow duration-200',
  elevated:
    'border border-neutral-200 bg-white shadow-md transition-shadow duration-200',
  outline: 'border border-neutral-200 bg-white transition-shadow duration-200',
  interactive:
    'border border-neutral-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg cursor-pointer',
};

export function Card({ title, variant = 'default', children, className = '', ...props }: CardProps) {
  return (
    <div className={`rounded-lg ${cardVariants[variant]} ${className}`} {...props}>
      {title && (
        <h3 className="border-b border-neutral-100 px-4 py-3 text-lg font-semibold text-text-primary">
          {title}
        </h3>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
