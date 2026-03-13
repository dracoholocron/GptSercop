import * as React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export function Checkbox({ label, description, className = '', ...props }: CheckboxProps) {
  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex h-6 items-center">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
          {...props}
        />
      </div>
      <div className="ml-3 text-sm leading-6">
        <label htmlFor={props.id} className="font-medium text-text-primary">
          {label}
        </label>
        {description && <p className="text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}
