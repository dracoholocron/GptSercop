import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base =
    'rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';
  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-hover hover:shadow-sm focus:ring-primary active:scale-[0.98]',
    accent:
      'bg-accent text-white hover:bg-accent-hover hover:shadow-sm focus:ring-accent active:scale-[0.98]',
    secondary:
      'bg-neutral-200 text-text-primary hover:bg-neutral-300 hover:shadow-sm focus:ring-neutral-400 active:scale-[0.98]',
    outline:
      'border-2 border-neutral-300 bg-transparent hover:bg-neutral-50 hover:border-neutral-400 focus:ring-neutral-400 active:scale-[0.98]',
  };
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
