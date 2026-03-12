import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: ReactNode;
}

export function Input({ label, error, id, className = '', iconLeft, ...props }: InputProps) {
  const inputId = id || (label ? label.replace(/\s/g, '-').toLowerCase() : undefined);
  const inputClass = `rounded border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none ${error ? 'border-error' : 'border-neutral-300'} ${iconLeft ? 'pl-10' : ''} ${className}`;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">{iconLeft}</div>}
        <input
          id={inputId}
          className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <span id={inputId ? `${inputId}-error` : undefined} className="text-sm text-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
