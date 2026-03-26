'use client';

/**
 * Logo institucional para la plataforma de Compras Públicas.
 *
 * Símbolo: "documento + sello/check" dentro de un contenedor sobrio.
 * - funciona a tamaños pequeños (favicon / header)
 * - mantiene presencia institucional (geometría estable, contraste alto)
 *
 * Variantes:
 * - full: símbolo + logotipo + subtítulo
 * - compact: símbolo + logotipo
 */
export function SercopLogo({
  className = 'h-10 w-auto',
  variant = 'compact',
}: {
  className?: string;
  variant?: 'full' | 'compact';
}) {
  const showSubtitle = variant === 'full';
  const viewBox = showSubtitle ? '0 0 240 56' : '0 0 240 40';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sercopMarkBg" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A66C2" />
          <stop offset="1" stopColor="#084E94" />
        </linearGradient>
        <linearGradient id="sercopMarkAccent" x1="14" y1="10" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Símbolo (40x40): documento + sello/check */}
      <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#sercopMarkBg)" />
      <path
        d="M13 11.5c0-1.1.9-2 2-2h10.5l4.5 4.5V28.5c0 1.1-.9 2-2 2H15c-1.1 0-2-.9-2-2V11.5z"
        fill="rgba(255,255,255,0.92)"
      />
      <path d="M25.5 9.5V14h4.5" stroke="rgba(13,71,161,0.35)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 18h12" stroke="rgba(13,71,161,0.45)" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 22h9" stroke="rgba(13,71,161,0.45)" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="28.5" cy="27.5" r="6.3" fill="url(#sercopMarkAccent)" />
      <path
        d="M25.6 27.6l1.7 1.8 4.1-4.2"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Logotipo Compras Públicas */}
      <text
        x="52"
        y={showSubtitle ? 30 : 26}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="15"
        fontWeight="800"
        fill="#1A1A1A"
        letterSpacing="-0.02em"
      >
        COMPRAS PUBLICAS
      </text>
      {showSubtitle && (
        <text
          x="52"
          y="46"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="400"
          fill="#525252"
        >
          Plataforma Nacional
        </text>
      )}
    </svg>
  );
}
