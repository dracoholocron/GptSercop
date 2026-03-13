'use client';

import { useState } from 'react';

export interface OfficialBannerProps {
  /** Título del sitio oficial (ej. "SERCOP" o "Portal de Contratación Pública") */
  title?: string;
  /** Texto para indicar conexión segura (ej. "Conexión segura (HTTPS)") */
  secureLabel?: string;
  /** Texto del botón que expande/colapsa la explicación */
  howYouKnowLabel?: string;
  className?: string;
}

/**
 * Barra superior colapsable que indica "Sitio oficial" y conexión segura.
 * Inspirado en patrones USWDS/GOV para generar confianza.
 */
export function OfficialBanner({
  title = 'SERCOP',
  secureLabel = 'Conexión segura (HTTPS)',
  howYouKnowLabel = 'Cómo lo sabe',
  className = '',
}: OfficialBannerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      className={`border-b border-neutral-200 bg-neutral-100 ${className}`}
      aria-label="Sitio oficial del gobierno"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <span className="font-semibold">Sitio oficial</span>
            <span aria-hidden="true">–</span>
            <span>{title}</span>
          </div>
          <button
            type="button"
            className="rounded px-2 py-1 text-sm font-medium text-text-secondary underline-offset-2 hover:bg-neutral-200 hover:text-text-primary hover:underline"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-controls="official-banner-content"
          >
            {howYouKnowLabel}
          </button>
        </div>
        {expanded && (
          <div
            id="official-banner-content"
            className="mt-3 space-y-2 border-t border-neutral-200 pt-3 text-xs text-text-secondary"
            role="region"
            aria-label="Explicación sitio oficial"
          >
            <p>
              <strong className="text-text-primary">Sitios oficiales</strong> utilizan dominio
              institucional (.gob.ec). La información publicada aquí es de carácter oficial.
            </p>
            <p>
              <strong className="text-text-primary">{secureLabel}</strong>. El candado o
              https:// en la barra de direcciones indica que la conexión es segura.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
