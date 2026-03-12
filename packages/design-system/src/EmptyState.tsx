import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  illustration?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, illustration, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-12 px-4 text-center ${className}`}>
      {illustration && <div className="mb-4 flex justify-center">{illustration}</div>}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              {action.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
