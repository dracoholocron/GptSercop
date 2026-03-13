'use client';

import { useState, useId, type ReactNode } from 'react';

export interface TooltipProps {
  /** Contenido del tooltip */
  content: ReactNode;
  /** Posición respecto al trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Elemento que activa el tooltip (hover/focus) */
  children: ReactNode;
  className?: string;
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * Tooltip accesible: se muestra en hover y focus. Usa aria-describedby para lectores de pantalla.
 */
export function Tooltip({
  content,
  position = 'top',
  children,
  className = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span className={`relative inline-flex ${className}`}>
      <span
        tabIndex={0}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-describedby={visible ? id : undefined}
      >
        {children}
      </span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-50 max-w-xs rounded bg-neutral-900 px-2 py-1.5 text-xs text-white shadow-lg ${positionClasses[position]} whitespace-normal`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
