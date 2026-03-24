import type { ReactNode } from 'react';

export interface SummarySheetItem {
  label: string;
  value: ReactNode;
}

export interface SummarySheetProps {
  /** Título opcional del bloque */
  title?: string;
  /** Lista de pares label/valor */
  items: SummarySheetItem[];
  /** CTA opcional (botón o enlace) */
  cta?: ReactNode;
  className?: string;
}

/**
 * Bloque de resumen ejecutivo: título, items en grid 2 columnas (desktop), CTA opcional.
 * Sin lógica de negocio; solo presentación.
 */
export function SummarySheet({ title, items, cta, className = '' }: SummarySheetProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:p-6 ${className}`}
      role="region"
      aria-label={title ?? 'Resumen'}
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{title}</h2>
      )}
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:gap-2">
            <dt className="text-sm font-medium text-text-secondary">{item.label}</dt>
            <dd className="text-sm text-text-primary">{item.value}</dd>
          </div>
        ))}
      </dl>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
