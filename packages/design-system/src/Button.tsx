import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    accent: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent',
    secondary: 'bg-neutral-200 text-text-primary hover:bg-neutral-300 focus:ring-neutral-400',
    outline: 'border-2 border-neutral-300 bg-transparent hover:bg-neutral-50 focus:ring-neutral-400',
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
