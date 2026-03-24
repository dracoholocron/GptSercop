import type { ReactNode } from 'react';

export interface StatCardProps {
  /** Icono (Lucide o SVG) */
  icon: ReactNode;
  /** Valor principal (número o texto) */
  value: ReactNode;
  /** Etiqueta descriptiva */
  label: string;
  /** Enlace "Ver más" (si no se pasa, no se muestra el enlace) */
  href?: string;
  /** Texto del enlace (por defecto "Ver más") */
  linkLabel?: string;
  className?: string;
}

/**
 * Tarjeta de estadística/KPI para dashboards: ícono, valor, etiqueta y enlace opcional.
 */
export function StatCard({
  icon,
  value,
  label,
  href,
  linkLabel = 'Ver más',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold text-text-primary">{value}</p>
          <p className="text-sm text-text-secondary">{label}</p>
          {href && (
            <a
              href={href}
              className="mt-2 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {linkLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
